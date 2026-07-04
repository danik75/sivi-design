import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import pool from '../db';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateLineItemDto } from './dto/create-line-item.dto';
import { InvoiceStatus } from './dto/transition-status.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  lump_sum: 'Lump Sum',
  time_and_materials: 'Time & Materials (T&M)',
  prepaid_hours: 'Prepaid Hours Block',
  monthly_retainer: 'Monthly Retainer',
};

const VALID_TRANSITIONS: Record<string, InvoiceStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'cancelled'],
  paid: ['cancelled'],
  cancelled: [],
};

const EDITABLE_STATUSES: InvoiceStatus[] = ['draft', 'sent'];
const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'cancelled'];

type InvoiceListRow = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string | null;
  customerCompanyNumber: string | null;
  contractId: string;
  contractType: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  currency: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  createdAt: string;
  updatedAt: string;
};

type InvoiceLineItemRow = {
  id: string;
  sortOrder: number;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  sourceType: string | null;
  sourceId: string | null;
  createdAt: string;
};

type InvoiceStatusRow = {
  id: string;
  status: InvoiceStatus;
};

type ContractRow = {
  id: string;
  customerId: string;
  customerName?: string;
  type: string;
  description: string | null;
  totalAmount: string | null;
  hourlyRate: string | null;
  amountPaid: string | null;
  monthlyFee: string | null;
  currency: string;
};

type TaskPrefillRow = {
  id: string;
  name: string;
  estimatedHours: string;
};

type ExpensePrefillRow = {
  id: string;
  vendor: string;
  amount: string;
  currency: string;
  date: string;
};

type PreparedLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sourceType: string | null;
  sourceId: string | null;
};

@Injectable()
export class InvoiceRepository {
  async findAll(customerId?: string, contractId?: string, status?: string) {
    if (customerId) {
      this.assertValidUuid(customerId, 'customerId');
    }

    if (contractId) {
      this.assertValidUuid(contractId, 'contractId');
    }

    if (status && status !== 'all' && !INVOICE_STATUSES.includes(status as InvoiceStatus)) {
      throw new BadRequestException('Invalid status');
    }

    const conditions: string[] = [];
    const values: string[] = [];

    if (customerId) {
      values.push(customerId);
      conditions.push(`inv.customer_id = $${values.length}`);
    }

    if (contractId) {
      values.push(contractId);
      conditions.push(`inv.contract_id = $${values.length}`);
    }

    if (status && status !== 'all') {
      values.push(status);
      conditions.push(`inv.status = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await pool.query(
      `
        SELECT
          inv.id,
          inv.invoice_number AS "invoiceNumber",
          inv.customer_id AS "customerId",
          c.name AS "customerName",
          c.company_number AS "customerCompanyNumber",
          inv.contract_id AS "contractId",
          con.type AS "contractType",
          inv.status,
          inv.issue_date AS "issueDate",
          inv.due_date AS "dueDate",
          inv.notes,
          inv.currency,
          inv.subtotal,
          inv.tax_rate AS "taxRate",
          inv.tax_amount AS "taxAmount",
          inv.discount_type AS "discountType",
          inv.discount_value AS "discountValue",
          inv.discount_amount AS "discountAmount",
          inv.total,
          inv.created_at AS "createdAt",
          inv.updated_at AS "updatedAt"
        FROM invoices inv
        LEFT JOIN customers c ON c.id = inv.customer_id
        JOIN contracts con ON con.id = inv.contract_id
        ${whereClause}
        ORDER BY inv.issue_date DESC, inv.created_at DESC
      `,
      values,
    );

    return res.rows.map((row) => this.mapInvoiceRow(row as InvoiceListRow));
  }

  async findOne(id: string) {
    this.assertValidUuid(id, 'invoice id');

    const headerRes = await pool.query(
      `
        SELECT
          inv.id,
          inv.invoice_number AS "invoiceNumber",
          inv.customer_id AS "customerId",
          c.name AS "customerName",
          c.company_number AS "customerCompanyNumber",
          inv.contract_id AS "contractId",
          con.type AS "contractType",
          inv.status,
          inv.issue_date AS "issueDate",
          inv.due_date AS "dueDate",
          inv.notes,
          inv.currency,
          inv.subtotal,
          inv.tax_rate AS "taxRate",
          inv.tax_amount AS "taxAmount",
          inv.discount_type AS "discountType",
          inv.discount_value AS "discountValue",
          inv.discount_amount AS "discountAmount",
          inv.total,
          inv.created_at AS "createdAt",
          inv.updated_at AS "updatedAt",
          (SELECT co.email FROM contacts co WHERE co.customer_id = inv.customer_id AND co.is_primary = TRUE LIMIT 1) AS "customerEmail",
          (SELECT r.id FROM receipts r WHERE r.invoice_id = inv.id ORDER BY r.created_at DESC LIMIT 1) AS "receiptId"
        FROM invoices inv
        LEFT JOIN customers c ON c.id = inv.customer_id
        JOIN contracts con ON con.id = inv.contract_id
        WHERE inv.id = $1
      `,
      [id],
    );

    if (!headerRes.rows[0]) {
      throw new NotFoundException('Invoice not found');
    }

    const lineItemsRes = await pool.query(
      `
        SELECT
          id,
          sort_order AS "sortOrder",
          description,
          quantity,
          unit_price AS "unitPrice",
          amount,
          source_type AS "sourceType",
          source_id AS "sourceId",
          created_at AS "createdAt"
        FROM invoice_line_items
        WHERE invoice_id = $1
        ORDER BY sort_order
      `,
      [id],
    );

    return {
      ...this.mapInvoiceRow(headerRes.rows[0] as InvoiceListRow),
      lineItems: lineItemsRes.rows as InvoiceLineItemRow[],
    };
  }

  async create(dto: CreateInvoiceDto) {
    this.assertValidDateRange(dto.issueDate, dto.dueDate);
    this.assertValidUuid(dto.customerId, 'customerId');
    this.assertValidUuid(dto.contractId, 'contractId');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await this.ensureCustomerExists(client, dto.customerId);
      await this.ensureContractExistsForCustomer(client, dto.contractId, dto.customerId);

      const preparedLineItems = this.prepareLineItems(dto.lineItems);
      const totals = this.calculateTotals(preparedLineItems, dto.taxRate, dto.discountType, dto.discountValue);
      const invoiceRes = await client.query(
        `
          INSERT INTO invoices (
            customer_id,
            contract_id,
            issue_date,
            due_date,
            notes,
            currency,
            subtotal,
            tax_rate,
            tax_amount,
            discount_type,
            discount_value,
            discount_amount,
            total
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `,
        [
          dto.customerId,
          dto.contractId,
          dto.issueDate,
          dto.dueDate,
          dto.notes?.trim() || null,
          dto.currency.trim().toUpperCase(),
          totals.subtotal,
          dto.taxRate,
          totals.taxAmount,
          dto.discountType ?? null,
          dto.discountValue ?? null,
          totals.discountAmount,
          totals.total,
        ],
      );

      await this.insertLineItems(client, invoiceRes.rows[0].id, preparedLineItems);
      await client.query('COMMIT');

      return this.findOne(invoiceRes.rows[0].id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    this.assertValidUuid(id, 'invoice id');
    this.assertValidDateRange(dto.issueDate, dto.dueDate);
    this.assertValidUuid(dto.customerId, 'customerId');
    this.assertValidUuid(dto.contractId, 'contractId');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const current = await this.getInvoiceStatus(client, id);
      if (!current) {
        throw new NotFoundException('Invoice not found');
      }

      if (!EDITABLE_STATUSES.includes(current.status)) {
        throw new ForbiddenException('Paid and cancelled invoices cannot be edited.');
      }

      await this.ensureCustomerExists(client, dto.customerId);
      await this.ensureContractExistsForCustomer(client, dto.contractId, dto.customerId);

      const preparedLineItems = this.prepareLineItems(dto.lineItems);
      const totals = this.calculateTotals(preparedLineItems, dto.taxRate, dto.discountType, dto.discountValue);

      await client.query(
        `
          UPDATE invoices
          SET customer_id = $1,
              contract_id = $2,
              issue_date = $3,
              due_date = $4,
              notes = $5,
              currency = $6,
              subtotal = $7,
              tax_rate = $8,
              tax_amount = $9,
              discount_type = $10,
              discount_value = $11,
              discount_amount = $12,
              total = $13,
              updated_at = now()
          WHERE id = $14
        `,
        [
          dto.customerId,
          dto.contractId,
          dto.issueDate,
          dto.dueDate,
          dto.notes?.trim() || null,
          dto.currency.trim().toUpperCase(),
          totals.subtotal,
          dto.taxRate,
          totals.taxAmount,
          dto.discountType ?? null,
          dto.discountValue ?? null,
          totals.discountAmount,
          totals.total,
          id,
        ],
      );

      await client.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);
      await this.insertLineItems(client, id, preparedLineItems);
      await client.query('COMMIT');

      return this.findOne(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async remove(id: string) {
    this.assertValidUuid(id, 'invoice id');

    const current = await this.getInvoiceStatus(pool, id);
    if (!current) {
      throw new NotFoundException('Invoice not found');
    }

    if (!EDITABLE_STATUSES.includes(current.status)) {
      throw new ForbiddenException('Paid and cancelled invoices cannot be deleted.');
    }

    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);

    return { deleted: true };
  }

  async transitionStatus(id: string, targetStatus: string) {
    this.assertValidUuid(id, 'invoice id');

    const current = await this.getInvoiceStatus(pool, id);
    if (!current) {
      throw new NotFoundException('Invoice not found');
    }

    if (!VALID_TRANSITIONS[current.status]?.includes(targetStatus as InvoiceStatus)) {
      throw new BadRequestException('Invalid invoice status transition.');
    }

    await pool.query(
      `
        UPDATE invoices
        SET status = $1,
            updated_at = now()
        WHERE id = $2
      `,
      [targetStatus, id],
    );

    return this.findOne(id);
  }

  async prefill(contractId: string) {
    this.assertValidUuid(contractId, 'contractId');

    const contractRes = await pool.query(
      `
        SELECT
          con.id,
          con.customer_id AS "customerId",
          c.name AS "customerName",
          con.type,
          con.description,
          con.total_amount AS "totalAmount",
          con.hourly_rate AS "hourlyRate",
          con.amount_paid AS "amountPaid",
          con.monthly_fee AS "monthlyFee",
          con.currency
        FROM contracts con
        JOIN customers c ON c.id = con.customer_id
        WHERE con.id = $1
      `,
      [contractId],
    );

    const contract = contractRes.rows[0] as ContractRow | undefined;
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const suggestedLineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      sourceType: string;
      sourceId: string;
    }> = [];

    switch (contract.type) {
      case 'lump_sum':
        suggestedLineItems.push({
          description: contract.description?.trim() || 'Project fee',
          quantity: 1,
          unitPrice: this.toNumber(contract.totalAmount),
          sourceType: 'contract',
          sourceId: contract.id,
        });
        break;
      case 'monthly_retainer':
        suggestedLineItems.push({
          description: 'Monthly retainer fee',
          quantity: 1,
          unitPrice: this.toNumber(contract.monthlyFee),
          sourceType: 'contract',
          sourceId: contract.id,
        });
        break;
      case 'prepaid_hours':
        suggestedLineItems.push({
          description: 'Prepaid hours block',
          quantity: 1,
          unitPrice: this.toNumber(contract.amountPaid),
          sourceType: 'contract',
          sourceId: contract.id,
        });
        break;
      case 'time_and_materials':
      default:
        break;
    }

    const tasksRes = await pool.query(
      `
        SELECT id, name, estimated_hours AS "estimatedHours"
        FROM tasks
        WHERE customer_id = $1
          AND status != 'cancelled'
          AND estimated_hours > 0
        ORDER BY name
      `,
      [contract.customerId],
    );

    for (const task of tasksRes.rows as TaskPrefillRow[]) {
      suggestedLineItems.push({
        description: task.name,
        quantity: contract.type === 'time_and_materials' ? this.toNumber(task.estimatedHours) : 1,
        unitPrice: contract.type === 'time_and_materials' ? this.toNumber(contract.hourlyRate) : 0,
        sourceType: 'task',
        sourceId: task.id,
      });
    }

    const expensesRes = await pool.query(
      `
        SELECT id, vendor, amount, currency, date
        FROM expenses
        WHERE customer_id = $1
          AND status = 'active'
          AND currency = $2
        ORDER BY date DESC, created_at DESC
      `,
      [contract.customerId, contract.currency],
    );

    for (const expense of expensesRes.rows as ExpensePrefillRow[]) {
      suggestedLineItems.push({
        description: `${expense.vendor} — ${expense.date}`,
        quantity: 1,
        unitPrice: this.toNumber(expense.amount),
        sourceType: 'expense',
        sourceId: expense.id,
      });
    }

    return {
      currency: contract.currency,
      suggestedLineItems: suggestedLineItems.map((item, index) => ({
        sortOrder: index,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: this.roundMoney(item.quantity * item.unitPrice),
        sourceType: item.sourceType,
        sourceId: item.sourceId,
      })),
    };
  }

  private mapInvoiceRow(row: InvoiceListRow) {
    return {
      ...row,
      contractTypeLabel: CONTRACT_TYPE_LABELS[row.contractType] ?? row.contractType,
    };
  }

  private async ensureCustomerExists(client: PoolClient, customerId: string) {
    const res = await client.query('SELECT id FROM customers WHERE id = $1', [customerId]);

    if (!res.rows[0]) {
      throw new NotFoundException('Customer not found');
    }
  }

  private async ensureContractExistsForCustomer(client: PoolClient, contractId: string, customerId: string) {
    const res = await client.query(
      `
        SELECT
          id,
          customer_id AS "customerId",
          type,
          description,
          total_amount AS "totalAmount",
          hourly_rate AS "hourlyRate",
          amount_paid AS "amountPaid",
          monthly_fee AS "monthlyFee",
          currency
        FROM contracts
        WHERE id = $1
      `,
      [contractId],
    );

    const contract = res.rows[0] as ContractRow | undefined;

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.customerId !== customerId) {
      throw new ConflictException('Contract does not belong to the specified customer.');
    }

    return contract;
  }

  private prepareLineItems(lineItems: CreateLineItemDto[]): PreparedLineItem[] {
    return lineItems.map((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      return {
        description: item.description.trim(),
        quantity,
        unitPrice,
        amount: this.roundMoney(quantity * unitPrice),
        sourceType: item.sourceType ?? null,
        sourceId: item.sourceId ?? null,
      };
    });
  }

  private calculateTotals(lineItems: PreparedLineItem[], taxRate: number, discountType?: string, discountValue?: number) {
    const subtotal = this.roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0));

    let discountAmount = 0;
    if (discountType && discountValue != null && discountValue > 0) {
      discountAmount = discountType === 'percentage'
        ? this.roundMoney((subtotal * discountValue) / 100)
        : this.roundMoney(Math.min(discountValue, subtotal));
    }

    const discountedSubtotal = this.roundMoney(subtotal - discountAmount);
    const taxAmount = this.roundMoney((discountedSubtotal * Number(taxRate)) / 100);
    const total = this.roundMoney(discountedSubtotal + taxAmount);

    return { subtotal, discountAmount, taxAmount, total };
  }

  private async insertLineItems(client: PoolClient, invoiceId: string, lineItems: PreparedLineItem[]) {
    if (!lineItems.length) {
      return;
    }

    const values: Array<string | number | null> = [];
    const rowsSql = lineItems.map((item, index) => {
      const offset = index * 8;
      values.push(
        invoiceId,
        index,
        item.description,
        item.quantity,
        item.unitPrice,
        item.amount,
        item.sourceType,
        item.sourceId,
      );

      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
    });

    await client.query(
      `
        INSERT INTO invoice_line_items (
          invoice_id,
          sort_order,
          description,
          quantity,
          unit_price,
          amount,
          source_type,
          source_id
        )
        VALUES ${rowsSql.join(', ')}
      `,
      values,
    );
  }

  private async getInvoiceStatus(client: PoolClient | typeof pool, id: string) {
    const res = await client.query('SELECT id, status FROM invoices WHERE id = $1', [id]);
    return res.rows[0] as InvoiceStatusRow | undefined;
  }

  private assertValidDateRange(issueDate: string, dueDate: string) {
    if (dueDate < issueDate) {
      throw new BadRequestException('dueDate must be greater than or equal to issueDate');
    }
  }

  private assertValidUuid(value: string, field: string) {
    if (!this.isUuid(value)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private toNumber(value: string | number | null | undefined) {
    return Number(value ?? 0);
  }

  private roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
