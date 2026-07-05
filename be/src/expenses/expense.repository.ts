import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import pool from '../db';
import { CreateExpenseDto, ExpenseCategory } from './dto/create-expense.dto';

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
    e.id,
    e.vendor,
    e.amount,
    e.currency,
    e.date,
    e.category,
    e.description,
    e.customer_id   AS "customerId",
    c.name          AS "customerName",
    e.status,
    il.invoice_id    AS "invoiceId",
    il.invoice_number AS "invoiceNumber",
    e.created_at    AS "createdAt"
  FROM expenses e
  LEFT JOIN customers c ON c.id = e.customer_id
  LEFT JOIN LATERAL (
    SELECT inv.id AS invoice_id, inv.invoice_number
    FROM invoice_line_items li
    JOIN invoices inv ON inv.id = li.invoice_id
    WHERE li.source_type = 'expense' AND li.source_id = e.id AND inv.status <> 'cancelled'
    LIMIT 1
  ) il ON TRUE
`;

type ExpenseStatusFilter = 'active' | 'inactive' | 'all';

type ExpenseRow = {
  id: string;
  vendor: string;
  amount: string;
  currency: string;
  date: string;
  category: string;
  description: string | null;
  customerId: string | null;
  customerName: string | null;
  status: 'active' | 'inactive';
  invoiceId: string | null;
  invoiceNumber: string | null;
  createdAt: string;
};

@Injectable()
export class ExpenseRepository {
  async findAll(customerId?: string, status: ExpenseStatusFilter = 'active', category?: string) {
    if (customerId && !this.isUuid(customerId)) {
      throw new BadRequestException('Invalid customerId');
    }

    if (status !== 'active' && status !== 'inactive' && status !== 'all') {
      throw new BadRequestException('Invalid status');
    }

    if (category && !Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
      throw new BadRequestException('Invalid category');
    }

    const conditions: string[] = [];
    const values: Array<string> = [];

    if (customerId) {
      values.push(customerId);
      conditions.push(`e.customer_id = $${values.length}`);
    }

    if (status === 'active' || status === undefined) {
      conditions.push(`e.status = 'active'`);
    } else if (status === 'inactive') {
      conditions.push(`e.status = 'inactive'`);
    }

    if (category) {
      values.push(category);
      conditions.push(`e.category = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await pool.query(
      `
        ${SELECT_FIELDS}
        ${whereClause}
        ORDER BY e.date DESC, e.created_at DESC
      `,
      values,
    );

    return res.rows.map((row) => this.mapRow(row));
  }

  async findOne(id: string) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid expense id');
    }

    const res = await pool.query(
      `
        ${SELECT_FIELDS}
        WHERE e.id = $1
      `,
      [id],
    );

    if (!res.rows[0]) {
      throw new NotFoundException('Expense not found');
    }

    return this.mapRow(res.rows[0]);
  }

  async create(dto: CreateExpenseDto) {
    try {
      const res = await pool.query(
        `
          INSERT INTO expenses (
            vendor,
            amount,
            currency,
            date,
            category,
            description,
            customer_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `,
        [
          dto.vendor.trim(),
          dto.amount,
          dto.currency.trim().toUpperCase(),
          dto.date,
          dto.category,
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

  async deactivate(id: string) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid expense id');
    }

    // An expense on an active invoice can't be cancelled — unrelate it first.
    const linked = await pool.query(
      `
        SELECT inv.invoice_number AS "invoiceNumber"
        FROM invoice_line_items li
        JOIN invoices inv ON inv.id = li.invoice_id
        WHERE li.source_type = 'expense' AND li.source_id = $1 AND inv.status <> 'cancelled'
        LIMIT 1
      `,
      [id],
    );
    if (linked.rows[0]) {
      throw new ConflictException(
        `This expense is on invoice ${linked.rows[0].invoiceNumber}. Unrelate it from the invoice before it can be cancelled.`,
      );
    }

    const res = await pool.query(
      `
        UPDATE expenses
        SET status = 'inactive'
        WHERE id = $1 AND status = 'active'
        RETURNING id
      `,
      [id],
    );

    if (!res.rows[0]) {
      throw new NotFoundException('Expense not found or already inactive');
    }

    return this.findOne(id);
  }

  private mapRow(row: ExpenseRow) {
    return {
      ...row,
      categoryLabel: CATEGORY_LABELS[row.category] ?? row.category,
    };
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
