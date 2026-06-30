import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
             t.created_at AS "createdAt", t.updated_at AS "updatedAt"
      FROM tasks t
      LEFT JOIN customers c ON c.id = t.customer_id
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
               t.created_at AS "createdAt", t.updated_at AS "updatedAt"
        FROM tasks t
        LEFT JOIN customers c ON c.id = t.customer_id
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

    const res = await pool.query(
      `
        INSERT INTO tasks (name, description, start_date, end_date, status, customer_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [dto.name, dto.description ?? null, dto.startDate, dto.endDate, dto.status ?? 'pending', dto.customerId ?? null],
    );

    return this.findOne(res.rows[0].id);
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existingRes = await pool.query('SELECT id, start_date, end_date FROM tasks WHERE id = $1', [id]);
    const existing = existingRes.rows[0];

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const nextStartDate = dto.startDate ?? existing.start_date;
    const nextEndDate = dto.endDate ?? existing.end_date;
    this.validateDateRange(nextStartDate, nextEndDate);

    const setClauses: string[] = [];
    const values: Array<string | null> = [];

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

    if (!setClauses.length) {
      return this.findOne(id);
    }

    values.push(id);
    await pool.query(`UPDATE tasks SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $${values.length}`, values);

    return this.findOne(id);
  }

  async remove(id: string) {
    const res = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

    if (!res.rows[0]) {
      throw new NotFoundException('Task not found');
    }

    return { deleted: true };
  }

  private validateDateRange(startDate: string, endDate: string) {
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      throw new BadRequestException('endDate must be greater than or equal to startDate');
    }
  }
}
