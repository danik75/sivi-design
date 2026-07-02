import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import pool from '../db';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Injectable()
export class ReceiptsRepository {
  async findAll() {
    const res = await pool.query(`
      SELECT
        r.id,
        r.receipt_number  AS "receiptNumber",
        r.invoice_id      AS "invoiceId",
        inv.invoice_number AS "invoiceNumber",
        c.name            AS "customerName",
        inv.total,
        inv.currency,
        r.paid_at         AS "paidAt",
        r.file_name       AS "fileName",
        r.file_mime_type  AS "fileMimeType",
        r.created_at      AS "createdAt"
      FROM receipts r
      JOIN invoices inv ON inv.id = r.invoice_id
      LEFT JOIN customers c ON c.id = inv.customer_id
      ORDER BY r.created_at DESC
    `);
    return res.rows;
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
