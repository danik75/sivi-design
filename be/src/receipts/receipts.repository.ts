import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import pool from '../db';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Injectable()
export class ReceiptsRepository {
  async findAll(opts: {
    search?: string;
    customerId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { search, customerId, from, to, page = 1, limit = 15 } = opts;
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(r.receipt_number) LIKE $${values.length} OR LOWER(inv.invoice_number) LIKE $${values.length})`);
    }
    if (customerId) {
      values.push(customerId);
      conditions.push(`inv.customer_id = $${values.length}`);
    }
    if (from) {
      values.push(from);
      conditions.push(`r.paid_at >= $${values.length}::date`);
    }
    if (to) {
      values.push(to);
      conditions.push(`r.paid_at < ($${values.length}::date + interval '1 day')`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM receipts r JOIN invoices inv ON inv.id = r.invoice_id LEFT JOIN customers c ON c.id = inv.customer_id ${where}`,
      values,
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (Math.max(1, page) - 1) * limit;
    values.push(limit, offset);

    const dataRes = await pool.query(
      `
        SELECT
          r.id,
          r.receipt_number   AS "receiptNumber",
          r.invoice_id       AS "invoiceId",
          inv.invoice_number AS "invoiceNumber",
          c.name             AS "customerName",
          c.id               AS "customerId",
          inv.total,
          inv.currency,
          r.paid_at          AS "paidAt",
          r.file_name        AS "fileName",
          r.file_mime_type   AS "fileMimeType",
          r.created_at       AS "createdAt"
        FROM receipts r
        JOIN invoices inv ON inv.id = r.invoice_id
        LEFT JOIN customers c ON c.id = inv.customer_id
        ${where}
        ORDER BY r.created_at DESC
        LIMIT $${values.length - 1} OFFSET $${values.length}
      `,
      values,
    );

    return { data: dataRes.rows, total };
  }

  async findOne(id: number) {
    const res = await pool.query(
      `
        SELECT
          r.id,
          r.receipt_number   AS "receiptNumber",
          r.invoice_id       AS "invoiceId",
          inv.invoice_number AS "invoiceNumber",
          inv.issue_date     AS "issueDate",
          inv.due_date       AS "dueDate",
          c.name             AS "customerName",
          inv.total,
          inv.subtotal,
          inv.tax_amount     AS "taxAmount",
          inv.currency,
          r.paid_at          AS "paidAt",
          r.file_data        AS "fileData",
          r.file_name        AS "fileName",
          r.file_mime_type   AS "fileMimeType",
          r.created_at       AS "createdAt"
        FROM receipts r
        JOIN invoices inv ON inv.id = r.invoice_id
        LEFT JOIN customers c ON c.id = inv.customer_id
        WHERE r.id = $1
      `,
      [id],
    );

    if (!res.rows[0]) throw new NotFoundException('Receipt not found');
    return res.rows[0];
  }

  async delete(id: number, revertInvoice: boolean) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const res = await client.query(
        `SELECT id, invoice_id AS "invoiceId" FROM receipts WHERE id = $1`,
        [id],
      );
      if (!res.rows[0]) throw new NotFoundException('Receipt not found');

      await client.query(`DELETE FROM receipts WHERE id = $1`, [id]);

      if (revertInvoice) {
        await client.query(
          `UPDATE invoices SET status = 'sent', updated_at = now() WHERE id = $1`,
          [res.rows[0].invoiceId],
        );
      }

      await client.query('COMMIT');
      return { deleted: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async create(dto: CreateReceiptDto) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const invRes = await client.query(
        `SELECT id, status FROM invoices WHERE id = $1`,
        [dto.invoiceId],
      );
      if (!invRes.rows[0]) throw new NotFoundException('Invoice not found');

      const { status } = invRes.rows[0];
      if (!['sent', 'paid'].includes(status)) {
        throw new BadRequestException('Only sent or paid invoices can have receipts added');
      }

      const receiptRes = await client.query(
        `
          INSERT INTO receipts (receipt_number, invoice_id, paid_at, file_data, file_name, file_mime_type)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        [
          dto.receiptNumber.trim(),
          dto.invoiceId,
          dto.paidAt,
          dto.fileData ?? null,
          dto.fileName ?? null,
          dto.fileMimeType ?? null,
        ],
      );

      if (status === 'sent') {
        await client.query(
          `UPDATE invoices SET status = 'paid', updated_at = now() WHERE id = $1`,
          [dto.invoiceId],
        );
      }

      await client.query('COMMIT');
      return this.findOne(receiptRes.rows[0].id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
