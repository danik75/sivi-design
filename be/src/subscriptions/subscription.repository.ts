import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import pool from '../db';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

const CATEGORY_LABELS: Record<string, string> = {
  software: 'Software',
  hardware: 'Hardware',
  subcontractor: 'Subcontractor',
  travel: 'Travel',
  office: 'Office',
  other: 'Other',
};

const SELECT_FIELDS = `
  SELECT
    s.id,
    s.name,
    s.start_date      AS "startDate",
    s.monthly_amount  AS "monthlyAmount",
    s.currency,
    s.renewal_day     AS "renewalDay",
    s.category,
    s.description,
    s.customer_id     AS "customerId",
    c.name            AS "customerName",
    s.status,
    s.created_at      AS "createdAt"
  FROM subscriptions s
  LEFT JOIN customers c ON c.id = s.customer_id
`;

type StatusFilter = 'active' | 'inactive' | 'all';

type SubscriptionRow = {
  id: string;
  name: string;
  startDate: string;
  monthlyAmount: string;
  currency: string;
  renewalDay: number;
  category: string | null;
  description: string | null;
  customerId: string | null;
  customerName: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
};

// The next date (YYYY-MM-DD) the subscription renews: the next occurrence of
// `renewalDay` on/after max(today, startDate), clamped to each month's length.
function nextRenewalDate(renewalDay: number, startDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${startDate}T00:00:00`);
  const base = today > start ? today : start;

  const lastDayOf = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

  let y = base.getFullYear();
  let m = base.getMonth();
  let cand = new Date(y, m, Math.min(renewalDay, lastDayOf(y, m)));
  if (cand < base) {
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    cand = new Date(y, m, Math.min(renewalDay, lastDayOf(y, m)));
  }
  const mm = String(cand.getMonth() + 1).padStart(2, '0');
  const dd = String(cand.getDate()).padStart(2, '0');
  return `${cand.getFullYear()}-${mm}-${dd}`;
}

@Injectable()
export class SubscriptionRepository {
  async findAll(status: StatusFilter = 'active', customerId?: string) {
    if (customerId && !this.isUuid(customerId)) {
      throw new BadRequestException('Invalid customerId');
    }
    if (status !== 'active' && status !== 'inactive' && status !== 'all') {
      throw new BadRequestException('Invalid status');
    }

    const conditions: string[] = [];
    const values: string[] = [];
    if (customerId) {
      values.push(customerId);
      conditions.push(`s.customer_id = $${values.length}`);
    }
    if (status === 'active') conditions.push(`s.status = 'active'`);
    else if (status === 'inactive') conditions.push(`s.status = 'inactive'`);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await pool.query(
      `${SELECT_FIELDS} ${whereClause} ORDER BY s.name`,
      values,
    );
    return res.rows.map((r) => this.mapRow(r));
  }

  async findOne(id: string) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid subscription id');
    }
    const res = await pool.query(`${SELECT_FIELDS} WHERE s.id = $1`, [id]);
    if (!res.rows[0]) {
      throw new NotFoundException('Subscription not found');
    }
    return this.mapRow(res.rows[0]);
  }

  async create(dto: CreateSubscriptionDto) {
    try {
      const res = await pool.query(
        `
          INSERT INTO subscriptions (
            name, start_date, monthly_amount, currency, renewal_day, category, description, customer_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `,
        [
          dto.name.trim(),
          dto.startDate,
          dto.monthlyAmount,
          dto.currency.trim().toUpperCase(),
          dto.renewalDay,
          dto.category ?? null,
          dto.description?.trim() ?? null,
          dto.customerId ?? null,
        ],
      );
      return this.findOne(res.rows[0].id);
    } catch (error) {
      if ((error as { code?: string }).code === '23503') {
        throw new BadRequestException('Customer not found');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid subscription id');
    }
    const existing = await pool.query('SELECT id FROM subscriptions WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      throw new NotFoundException('Subscription not found');
    }

    const set: string[] = [];
    const values: Array<string | number | null> = [];
    const push = (col: string, val: string | number | null) => {
      values.push(val);
      set.push(`${col} = $${values.length}`);
    };

    if (dto.name !== undefined) push('name', dto.name.trim());
    if (dto.startDate !== undefined) push('start_date', dto.startDate);
    if (dto.monthlyAmount !== undefined) push('monthly_amount', dto.monthlyAmount);
    if (dto.currency !== undefined) push('currency', dto.currency.trim().toUpperCase());
    if (dto.renewalDay !== undefined) push('renewal_day', dto.renewalDay);
    if (dto.category !== undefined) push('category', dto.category ?? null);
    if (dto.description !== undefined) push('description', dto.description?.trim() ?? null);
    if (dto.customerId !== undefined) push('customer_id', dto.customerId ?? null);

    if (!set.length) return this.findOne(id);

    values.push(id);
    await pool.query(`UPDATE subscriptions SET ${set.join(', ')} WHERE id = $${values.length}`, values);
    return this.findOne(id);
  }

  async deactivate(id: string) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid subscription id');
    }
    const res = await pool.query(
      `UPDATE subscriptions SET status = 'inactive' WHERE id = $1 AND status = 'active' RETURNING id`,
      [id],
    );
    if (!res.rows[0]) {
      throw new NotFoundException('Subscription not found or already inactive');
    }
    return this.findOne(id);
  }

  // Monthly recurring totals for active subscriptions, grouped by currency.
  async getSummary() {
    const res = await pool.query(
      `
        SELECT currency,
               COALESCE(SUM(monthly_amount), 0) AS "monthlyTotal",
               COUNT(*) AS count
        FROM subscriptions
        WHERE status = 'active'
        GROUP BY currency
        ORDER BY currency
      `,
    );
    return {
      totalsByCurrency: res.rows.map((r) => ({
        currency: r.currency,
        monthlyTotal: Number(Number(r.monthlyTotal).toFixed(2)),
        count: Number(r.count),
      })),
    };
  }

  private mapRow(row: SubscriptionRow) {
    return {
      ...row,
      monthlyAmount: Number(row.monthlyAmount),
      categoryLabel: row.category ? CATEGORY_LABELS[row.category] ?? row.category : null,
      nextRenewalDate: nextRenewalDate(row.renewalDay, row.startDate),
    };
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
