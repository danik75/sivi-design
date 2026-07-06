import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import pool from '../db';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerRepository {
  async findAll(search?: string, page = 1, limit = 25) {
    const offset = (page - 1) * limit;
    const where = search
      ? `WHERE c.name ILIKE $1 OR c.company_name ILIKE $1 OR EXISTS (SELECT 1 FROM contacts ct WHERE ct.customer_id = c.id AND (ct.first_name ILIKE $1 OR ct.last_name ILIKE $1 OR ct.email ILIKE $1 OR ct.phone ILIKE $1))`
      : '';
    const params = search ? [`%${search}%`, limit, offset] : [limit, offset];
    const limitIdx = search ? 2 : 1;
    const offsetIdx = search ? 3 : 2;

    const q = `
      SELECT c.id, c.name, c.company_name AS "companyName", c.company_number AS "companyNumber", c.address, c.created_at, c.updated_at,
        json_agg(json_build_object('id', ct.id, 'firstName', ct.first_name, 'lastName', ct.last_name, 'email', ct.email, 'phone', ct.phone, 'address', ct.address, 'isPrimary', ct.is_primary) ORDER BY ct.is_primary DESC, ct.created_at) FILTER (WHERE ct.id IS NOT NULL) AS contacts
      FROM customers c
      LEFT JOIN contacts ct ON ct.customer_id = c.id
      ${where}
      GROUP BY c.id
      ORDER BY c.name
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;
    const countQ = search
      ? `SELECT COUNT(*) FROM customers c WHERE c.name ILIKE $1 OR c.company_name ILIKE $1 OR EXISTS (SELECT 1 FROM contacts ct WHERE ct.customer_id = c.id AND (ct.first_name ILIKE $1 OR ct.last_name ILIKE $1 OR ct.email ILIKE $1 OR ct.phone ILIKE $1))`
      : `SELECT COUNT(*) FROM customers`;
    const countParams = search ? [`%${search}%`] : [];

    const [rows, countRes] = await Promise.all([pool.query(q, params), pool.query(countQ, countParams)]);
    return { data: rows.rows, total: parseInt(countRes.rows[0].count, 10), page, limit };
  }

  async findOne(id: string) {
    const res = await pool.query(
      `SELECT c.id, c.name, c.company_name AS "companyName", c.company_number AS "companyNumber", c.address, c.created_at, c.updated_at,
        json_agg(json_build_object('id', ct.id, 'firstName', ct.first_name, 'lastName', ct.last_name, 'email', ct.email, 'phone', ct.phone, 'address', ct.address, 'isPrimary', ct.is_primary) ORDER BY ct.is_primary DESC, ct.created_at) FILTER (WHERE ct.id IS NOT NULL) AS contacts
       FROM customers c LEFT JOIN contacts ct ON ct.customer_id = c.id
       WHERE c.id = $1 GROUP BY c.id`,
      [id],
    );
    if (!res.rows[0]) {
      throw new NotFoundException('Customer not found');
    }
    return res.rows[0];
  }

  async create(dto: CreateCustomerDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query('SELECT id FROM customers WHERE lower(trim(name)) = lower(trim($1))', [
        dto.name,
      ]);
      if (existing.rows.length) {
        throw new ConflictException('Customer name already exists');
      }
      const res = await client.query(
        'INSERT INTO customers (name, company_name, company_number, address) VALUES ($1, $2, $3, $4) RETURNING id',
        [
          dto.name.trim(),
          dto.companyName?.trim() || null,
          dto.companyNumber?.trim() || null,
          dto.address?.trim() || null,
        ],
      );
      const customer = res.rows[0];
      if (dto.contacts?.length) {
        for (let i = 0; i < dto.contacts.length; i += 1) {
          const c = dto.contacts[i];
          await client.query(
            'INSERT INTO contacts (customer_id, first_name, last_name, email, phone, address, is_primary) VALUES ($1,$2,$3,$4,$5,$6,$7)',
            [
              customer.id,
              c.firstName ?? null,
              c.lastName ?? null,
              c.email ?? null,
              c.phone ?? null,
              c.address ?? null,
              c.isPrimary ?? i === 0,
            ],
          );
        }
      }
      await client.query('COMMIT');
      return this.findOne(customer.id);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existingCustomer = await client.query('SELECT id FROM customers WHERE id = $1', [id]);
      if (!existingCustomer.rows.length) {
        throw new NotFoundException('Customer not found');
      }

      if (dto.name !== undefined) {
        const existing = await client.query(
          'SELECT id FROM customers WHERE lower(trim(name)) = lower(trim($1)) AND id <> $2',
          [dto.name, id],
        );
        if (existing.rows.length) {
          throw new ConflictException('Customer name already exists');
        }
        await client.query('UPDATE customers SET name = $1, updated_at = now() WHERE id = $2', [dto.name.trim(), id]);
      }
      if (dto.companyName !== undefined) {
        await client.query('UPDATE customers SET company_name = $1, updated_at = now() WHERE id = $2', [
          dto.companyName?.trim() || null,
          id,
        ]);
      }
      if (dto.companyNumber !== undefined) {
        await client.query('UPDATE customers SET company_number = $1, updated_at = now() WHERE id = $2', [
          dto.companyNumber?.trim() || null,
          id,
        ]);
      }
      if (dto.address !== undefined) {
        await client.query('UPDATE customers SET address = $1, updated_at = now() WHERE id = $2', [
          dto.address?.trim() || null,
          id,
        ]);
      }
      if (dto.contacts !== undefined) {
        await client.query('DELETE FROM contacts WHERE customer_id = $1', [id]);
        for (let i = 0; i < dto.contacts.length; i += 1) {
          const c = dto.contacts[i];
          await client.query(
            'INSERT INTO contacts (customer_id, first_name, last_name, email, phone, address, is_primary) VALUES ($1,$2,$3,$4,$5,$6,$7)',
            [
              id,
              c.firstName ?? null,
              c.lastName ?? null,
              c.email ?? null,
              c.phone ?? null,
              c.address ?? null,
              c.isPrimary ?? i === 0,
            ],
          );
        }
      }
      await client.query('COMMIT');
      return this.findOne(id);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async remove(id: string) {
    const res = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
    if (!res.rows[0]) {
      throw new NotFoundException('Customer not found');
    }
    return { deleted: true };
  }
}
