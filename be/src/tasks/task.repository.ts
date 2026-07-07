import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import pool from '../db';
import { CreateTaskDto, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskRepository {
  async findAll(search?: string, status?: TaskStatus, customerId?: string, page = 1, limit = 25) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 25;
    const offset = (safePage - 1) * safeLimit;
    const searchTerm = search ? `%${search}%` : null;

    const query = `
      SELECT t.id, t.name, t.description, t.start_date AS "startDate", t.end_date AS "endDate",
             t.status, t.customer_id AS "customerId", c.name AS "customerName",
             t.start_time AS "startTime", t.end_time AS "endTime",
             t.estimated_hours AS "estimatedHours", t.actual_hours AS "actualHours",
             t.percent_complete AS "percentComplete",
             t.color,
             t.contract_id AS "contractId", con.type AS "contractType",
             il.invoice_id AS "invoiceId", il.invoice_number AS "invoiceNumber",
             t.created_at AS "createdAt", t.updated_at AS "updatedAt"
      FROM tasks t
      LEFT JOIN customers c ON c.id = t.customer_id
      LEFT JOIN contracts con ON con.id = t.contract_id
      LEFT JOIN LATERAL (
        SELECT inv.id AS invoice_id, inv.invoice_number
        FROM invoice_line_items li
        JOIN invoices inv ON inv.id = li.invoice_id
        WHERE li.source_type = 'task' AND li.source_id = t.id AND inv.status <> 'cancelled'
        LIMIT 1
      ) il ON TRUE
      WHERE ($1::text IS NULL OR t.name ILIKE $1 OR t.description ILIKE $1 OR c.name ILIKE $1)
      AND ($2::text IS NULL OR t.status = $2)
      AND ($3::uuid IS NULL OR t.customer_id = $3)
      ORDER BY t.start_date, t.name
      LIMIT $4 OFFSET $5
    `;
    const countQuery = `
      SELECT COUNT(*)
      FROM tasks t
      LEFT JOIN customers c ON c.id = t.customer_id
      WHERE ($1::text IS NULL OR t.name ILIKE $1 OR t.description ILIKE $1 OR c.name ILIKE $1)
      AND ($2::text IS NULL OR t.status = $2)
      AND ($3::uuid IS NULL OR t.customer_id = $3)
    `;
    const params = [searchTerm, status ?? null, customerId ?? null, safeLimit, offset];

    const [rows, countRes] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, [searchTerm, status ?? null, customerId ?? null]),
    ]);

    return {
      data: rows.rows,
      total: parseInt(countRes.rows[0].count, 10),
      page: safePage,
      limit: safeLimit,
    };
  }

  async findOne(id: string) {
    const res = await pool.query(
      `
        SELECT t.id, t.name, t.description, t.start_date AS "startDate", t.end_date AS "endDate",
               t.status, t.customer_id AS "customerId", c.name AS "customerName",
               t.start_time AS "startTime", t.end_time AS "endTime",
               t.estimated_hours AS "estimatedHours", t.actual_hours AS "actualHours",
               t.percent_complete AS "percentComplete",
               t.color,
               t.contract_id AS "contractId", con.type AS "contractType",
               il.invoice_id AS "invoiceId", il.invoice_number AS "invoiceNumber",
               t.created_at AS "createdAt", t.updated_at AS "updatedAt"
        FROM tasks t
        LEFT JOIN customers c ON c.id = t.customer_id
        LEFT JOIN contracts con ON con.id = t.contract_id
        LEFT JOIN LATERAL (
          SELECT inv.id AS invoice_id, inv.invoice_number
          FROM invoice_line_items li
          JOIN invoices inv ON inv.id = li.invoice_id
          WHERE li.source_type = 'task' AND li.source_id = t.id AND inv.status <> 'cancelled'
          LIMIT 1
        ) il ON TRUE
        WHERE t.id = $1
      `,
      [id],
    );

    if (!res.rows[0]) {
      throw new NotFoundException('Task not found');
    }

    return res.rows[0];
  }

  async create(dto: CreateTaskDto) {
    this.validateDateRange(dto.startDate, dto.endDate);
    if (dto.contractId) {
      await this.assertContractForCustomer(dto.contractId, dto.customerId);
    }

    const res = await pool.query(
      `
        INSERT INTO tasks (name, description, start_date, end_date, status, customer_id, contract_id,
                           start_time, end_time, estimated_hours, color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        dto.name,
        dto.description ?? null,
        dto.startDate,
        dto.endDate,
        dto.status ?? 'pending',
        dto.customerId ?? null,
        dto.contractId ?? null,
        dto.startTime ?? null,
        dto.endTime ?? null,
        dto.estimatedHours ?? null,
        dto.color ?? null,
      ],
    );

    return this.findOne(res.rows[0].id);
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existingRes = await pool.query(
      'SELECT id, start_date, end_date, customer_id FROM tasks WHERE id = $1',
      [id],
    );
    const existing = existingRes.rows[0];

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const nextStartDate = dto.startDate ?? existing.start_date;
    const nextEndDate = dto.endDate ?? existing.end_date;
    this.validateDateRange(nextStartDate, nextEndDate);

    if (dto.contractId) {
      await this.assertContractForCustomer(dto.contractId, dto.customerId ?? existing.customer_id);
    }

    // A task on an active invoice can't be cancelled — unrelate it first.
    if (dto.status === 'cancelled') {
      await this.assertNotInvoiced(id, 'cancelled');
    }

    const setClauses: string[] = [];
    const values: Array<string | number | null> = [];

    if (dto.name !== undefined) {
      values.push(dto.name);
      setClauses.push(`name = $${values.length}`);
    }
    if (dto.description !== undefined) {
      values.push(dto.description ?? null);
      setClauses.push(`description = $${values.length}`);
    }
    if (dto.startDate !== undefined) {
      values.push(dto.startDate);
      setClauses.push(`start_date = $${values.length}`);
    }
    if (dto.endDate !== undefined) {
      values.push(dto.endDate);
      setClauses.push(`end_date = $${values.length}`);
    }
    if (dto.status !== undefined) {
      values.push(dto.status);
      setClauses.push(`status = $${values.length}`);
    }
    if (dto.customerId !== undefined) {
      values.push(dto.customerId ?? null);
      setClauses.push(`customer_id = $${values.length}`);
    }
    if (dto.contractId !== undefined) {
      values.push(dto.contractId ?? null);
      setClauses.push(`contract_id = $${values.length}`);
    }
    if (dto.startTime !== undefined) {
      values.push(dto.startTime ?? null);
      setClauses.push(`start_time = $${values.length}`);
    }
    if (dto.endTime !== undefined) {
      values.push(dto.endTime ?? null);
      setClauses.push(`end_time = $${values.length}`);
    }
    if (dto.estimatedHours !== undefined) {
      values.push(dto.estimatedHours ?? null);
      setClauses.push(`estimated_hours = $${values.length}`);
    }
    if (dto.percentComplete !== undefined) {
      values.push(dto.percentComplete);
      setClauses.push(`percent_complete = $${values.length}`);
    }
    if (dto.actualHours !== undefined) {
      values.push(dto.actualHours ?? null);
      setClauses.push(`actual_hours = $${values.length}`);
    }
    if (dto.color !== undefined) {
      values.push(dto.color ?? null);
      setClauses.push(`color = $${values.length}`);
    }
    // Completing a task always sets percent_complete to 100
    if (dto.status === 'done' && dto.percentComplete === undefined) {
      setClauses.push(`percent_complete = 100`);
    }

    if (!setClauses.length) {
      return this.findOne(id);
    }

    values.push(id);
    await pool.query(`UPDATE tasks SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $${values.length}`, values);

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.assertNotInvoiced(id, 'deleted');
    const res = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

    if (!res.rows[0]) {
      throw new NotFoundException('Task not found');
    }

    return { deleted: true };
  }

  // Rejects the action if the task is on a non-cancelled invoice.
  private async assertNotInvoiced(id: string, action: 'cancelled' | 'deleted') {
    const res = await pool.query(
      `
        SELECT inv.invoice_number AS "invoiceNumber"
        FROM invoice_line_items li
        JOIN invoices inv ON inv.id = li.invoice_id
        WHERE li.source_type = 'task' AND li.source_id = $1 AND inv.status <> 'cancelled'
        LIMIT 1
      `,
      [id],
    );
    if (res.rows[0]) {
      throw new ConflictException(
        `This task is on invoice ${res.rows[0].invoiceNumber}. Unrelate it from the invoice before it can be ${action}.`,
      );
    }
  }

  // A task's contract must belong to the task's customer.
  private async assertContractForCustomer(contractId: string, customerId?: string | null) {
    if (!customerId) {
      throw new BadRequestException('A task with a contract must have a customer.');
    }
    const res = await pool.query('SELECT customer_id FROM contracts WHERE id = $1', [contractId]);
    if (!res.rows[0]) {
      throw new BadRequestException('Contract not found.');
    }
    if (res.rows[0].customer_id !== customerId) {
      throw new BadRequestException('Contract does not belong to the selected customer.');
    }
  }

  private validateDateRange(startDate: string, endDate: string) {
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      throw new BadRequestException('endDate must be greater than or equal to startDate');
    }
  }
}
