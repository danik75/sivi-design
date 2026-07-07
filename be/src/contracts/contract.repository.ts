import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import pool from '../db';
import { ContractType, CreateContractDto } from './dto/create-contract.dto';

const TYPE_LABELS: Record<string, string> = {
  lump_sum: 'Lump Sum',
  time_and_materials: 'Time & Materials (T&M)',
  prepaid_hours: 'Prepaid Hours Block',
  monthly_retainer: 'Monthly Retainer',
};

type ContractStatusFilter = 'active' | 'inactive' | 'all';

type ContractRow = {
  id: string;
  customerId: string;
  customerName: string;
  type: string;
  status: 'active' | 'inactive';
  description: string;
  createdAt: string;
  expiresAt: string | null;
  totalAmount: string | null;
  hourlyRate: string | null;
  hoursPurchased: string | null;
  amountPaid: string | null;
  monthlyFee: string | null;
  hoursPerMonth: string | null;
  currency: string | null;
};

@Injectable()
export class ContractRepository {
  async findAll(customerId?: string, status: ContractStatusFilter = 'active') {
    const conditions: string[] = [];
    const values: Array<string> = [];

    if (customerId) {
      values.push(customerId);
      conditions.push(`con.customer_id = $${values.length}`);
    }

    if (status === 'active' || status === undefined) {
      conditions.push(`con.status = 'active'`);
    } else if (status === 'inactive') {
      conditions.push(`con.status = 'inactive'`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await pool.query(
      `
        SELECT
          con.id,
          con.customer_id AS "customerId",
          c.name AS "customerName",
          con.type,
          con.status,
          con.description,
          con.created_at AS "createdAt",
          con.expires_at AS "expiresAt",
          con.total_amount AS "totalAmount",
          con.hourly_rate AS "hourlyRate",
          con.hours_purchased AS "hoursPurchased",
          con.amount_paid AS "amountPaid",
          con.monthly_fee AS "monthlyFee",
          con.hours_per_month AS "hoursPerMonth",
          con.currency
        FROM contracts con
        JOIN customers c ON c.id = con.customer_id
        ${whereClause}
        ORDER BY con.created_at DESC
      `,
      values,
    );

    return res.rows.map((row) => this.mapRow(row));
  }

  async findOne(id: string) {
    const res = await pool.query(
      `
        SELECT
          con.id,
          con.customer_id AS "customerId",
          c.name AS "customerName",
          con.type,
          con.status,
          con.description,
          con.created_at AS "createdAt",
          con.expires_at AS "expiresAt",
          con.total_amount AS "totalAmount",
          con.hourly_rate AS "hourlyRate",
          con.hours_purchased AS "hoursPurchased",
          con.amount_paid AS "amountPaid",
          con.monthly_fee AS "monthlyFee",
          con.hours_per_month AS "hoursPerMonth",
          con.currency
        FROM contracts con
        JOIN customers c ON c.id = con.customer_id
        WHERE con.id = $1
      `,
      [id],
    );

    if (!res.rows[0]) {
      throw new NotFoundException('Contract not found');
    }

    return this.mapRow(res.rows[0]);
  }

  // Prepaid-hours burndown: how much of the purchased block has been consumed
  // by the actual hours logged on the contract's tasks. `excludeTaskId` omits the
  // task currently being edited so re-saving it doesn't double-count its hours.
  async getUsage(id: string, excludeTaskId?: string) {
    const contractRes = await pool.query(
      'SELECT id, type, hours_purchased FROM contracts WHERE id = $1',
      [id],
    );
    if (!contractRes.rows[0]) {
      throw new NotFoundException('Contract not found');
    }
    const row = contractRes.rows[0];
    const hoursPurchased = row.hours_purchased != null ? Number(row.hours_purchased) : null;

    const usedRes = await pool.query(
      `SELECT COALESCE(SUM(actual_hours), 0) AS used
       FROM tasks
       WHERE contract_id = $1 AND ($2::uuid IS NULL OR id <> $2)`,
      [id, excludeTaskId ?? null],
    );
    const hoursUsed = Number(usedRes.rows[0].used);
    const hoursRemaining = hoursPurchased != null ? hoursPurchased - hoursUsed : null;
    const percentUsed =
      hoursPurchased != null && hoursPurchased > 0
        ? Math.min(1, hoursUsed / hoursPurchased)
        : null;

    return {
      contractId: id,
      type: row.type as string,
      hoursPurchased,
      hoursUsed,
      hoursRemaining,
      percentUsed,
    };
  }

  async create(dto: CreateContractDto) {
    this.validateCreateDto(dto);

    try {
      const res = await pool.query(
        `
          INSERT INTO contracts (
            customer_id,
            type,
            description,
            expires_at,
            total_amount,
            hourly_rate,
            hours_purchased,
            amount_paid,
            monthly_fee,
            hours_per_month,
            currency
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id
        `,
        [
          dto.customerId,
          dto.type,
          dto.description.trim(),
          dto.expiresAt ?? null,
          dto.totalAmount ?? null,
          dto.hourlyRate ?? null,
          dto.hoursPurchased ?? null,
          dto.amountPaid ?? null,
          dto.monthlyFee ?? null,
          dto.hoursPerMonth ?? null,
          dto.currency?.trim() ?? null,
        ],
      );

      return this.findOne(res.rows[0].id);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          `An active ${TYPE_LABELS[dto.type]} contract already exists for this customer.`,
        );
      }

      throw error;
    }
  }

  async deactivate(id: string) {
    const res = await pool.query(
      `
        UPDATE contracts
        SET status = 'inactive'
        WHERE id = $1 AND status = 'active'
        RETURNING id
      `,
      [id],
    );

    if (!res.rows[0]) {
      throw new NotFoundException('Contract not found or already inactive');
    }

    return this.findOne(id);
  }

  private mapRow(row: ContractRow) {
    return {
      ...row,
      typeLabel: TYPE_LABELS[row.type] ?? row.type,
      name: `${row.customerName} - ${TYPE_LABELS[row.type] ?? row.type}`,
    };
  }

  private validateCreateDto(dto: CreateContractDto) {
    switch (dto.type) {
      case ContractType.LUMP_SUM:
        this.ensureFieldsPresent(dto, ['totalAmount', 'currency']);
        this.ensureFieldsAbsent(dto, ['hourlyRate', 'hoursPurchased', 'amountPaid', 'monthlyFee', 'hoursPerMonth']);
        return;
      case ContractType.TIME_AND_MATERIALS:
        this.ensureFieldsPresent(dto, ['hourlyRate', 'currency']);
        this.ensureFieldsAbsent(dto, ['totalAmount', 'hoursPurchased', 'amountPaid', 'monthlyFee', 'hoursPerMonth']);
        return;
      case ContractType.PREPAID_HOURS:
        this.ensureFieldsPresent(dto, ['hoursPurchased', 'amountPaid', 'currency']);
        this.ensureFieldsAbsent(dto, ['totalAmount', 'hourlyRate', 'monthlyFee', 'hoursPerMonth']);
        return;
      case ContractType.MONTHLY_RETAINER:
        this.ensureFieldsPresent(dto, ['monthlyFee', 'hoursPerMonth', 'currency']);
        this.ensureFieldsAbsent(dto, ['totalAmount', 'hourlyRate', 'hoursPurchased', 'amountPaid']);
        return;
      default:
        throw new BadRequestException('Invalid contract type');
    }
  }

  private ensureFieldsPresent(dto: CreateContractDto, fields: Array<keyof CreateContractDto>) {
    const missingFields = fields.filter((field) => dto[field] === undefined || dto[field] === null || dto[field] === '');

    if (missingFields.length) {
      throw new BadRequestException(`Missing required fields for ${dto.type}: ${missingFields.join(', ')}`);
    }
  }

  private ensureFieldsAbsent(dto: CreateContractDto, fields: Array<keyof CreateContractDto>) {
    const invalidFields = fields.filter((field) => dto[field] !== undefined && dto[field] !== null);

    if (invalidFields.length) {
      throw new BadRequestException(`Invalid fields for ${dto.type}: ${invalidFields.join(', ')}`);
    }
  }
}
