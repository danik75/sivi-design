import { Injectable, NotFoundException } from '@nestjs/common';
import pool from '../db';

@Injectable()
export class BillingRepository {
  async getOverview(startDate: string, endDate: string) {
    const res = await pool.query(
      `
      WITH paid AS (
        SELECT
          c.id           AS customer_id,
          c.name         AS customer_name,
          inv.currency,
          SUM(inv.total) AS paid_invoices_total
        FROM invoices inv
        JOIN customers c ON c.id = inv.customer_id
        WHERE inv.status = 'paid'
          AND inv.issue_date >= $1::date
          AND inv.issue_date <= $2::date
        GROUP BY c.id, c.name, inv.currency
      ),
      exp AS (
        SELECT customer_id, currency, SUM(amount) AS expenses_total
        FROM expenses
        WHERE status = 'active'
          AND date >= $1::date
          AND date <= $2::date
        GROUP BY customer_id, currency
      )
      SELECT
        p.customer_id          AS "customerId",
        p.customer_name        AS "customerName",
        p.currency,
        p.paid_invoices_total  AS "paidInvoicesTotal",
        COALESCE(e.expenses_total, 0) AS "expensesTotal",
        (p.paid_invoices_total - COALESCE(e.expenses_total, 0)) AS balance
      FROM paid p
      LEFT JOIN exp e ON e.customer_id = p.customer_id AND e.currency = p.currency
      ORDER BY balance DESC
      `,
      [startDate, endDate],
    );

    const customerMap = new Map<string, {
      customerId: string;
      customerName: string;
      currencies: { currency: string; paidInvoicesTotal: string; expensesTotal: string; balance: string }[];
    }>();

    for (const row of res.rows) {
      if (!customerMap.has(row.customerId)) {
        customerMap.set(row.customerId, {
          customerId: row.customerId,
          customerName: row.customerName,
          currencies: [],
        });
      }
      customerMap.get(row.customerId)!.currencies.push({
        currency: row.currency,
        paidInvoicesTotal: parseFloat(row.paidInvoicesTotal).toFixed(2),
        expensesTotal: parseFloat(row.expensesTotal).toFixed(2),
        balance: parseFloat(row.balance).toFixed(2),
      });
    }

    return Array.from(customerMap.values());
  }

  async getCustomerDetail(customerId: string, startDate: string, endDate: string) {
    const customerRes = await pool.query(
      `SELECT id, name FROM customers WHERE id = $1`,
      [customerId],
    );
    if (!customerRes.rows[0]) throw new NotFoundException('Customer not found');

    const [balanceRes, invoicesRes, expensesRes, tasksRes, contractsRes] = await Promise.all([
      pool.query(
        `
        WITH paid AS (
          SELECT currency, SUM(total) AS paid_invoices_total
          FROM invoices
          WHERE customer_id = $1 AND status = 'paid'
            AND issue_date >= $2::date AND issue_date <= $3::date
          GROUP BY currency
        ),
        exp AS (
          SELECT currency, SUM(amount) AS expenses_total
          FROM expenses
          WHERE customer_id = $1 AND status = 'active'
            AND date >= $2::date AND date <= $3::date
          GROUP BY currency
        )
        SELECT
          p.currency,
          p.paid_invoices_total  AS "paidInvoicesTotal",
          COALESCE(e.expenses_total, 0) AS "expensesTotal",
          (p.paid_invoices_total - COALESCE(e.expenses_total, 0)) AS balance
        FROM paid p
        LEFT JOIN exp e USING (currency)
        `,
        [customerId, startDate, endDate],
      ),
      pool.query(
        `
        SELECT
          inv.id, inv.invoice_number AS "invoiceNumber", inv.status,
          inv.issue_date AS "issueDate", inv.due_date AS "dueDate",
          inv.total, inv.currency,
          con.type AS "contractType"
        FROM invoices inv
        JOIN contracts con ON con.id = inv.contract_id
        WHERE inv.customer_id = $1
        ORDER BY inv.issue_date DESC
        `,
        [customerId],
      ),
      pool.query(
        `
        SELECT id, vendor, amount, currency, date, category, status
        FROM expenses
        WHERE customer_id = $1 AND status = 'active'
        ORDER BY date DESC
        `,
        [customerId],
      ),
      pool.query(
        `
        SELECT id, name, status, start_date AS "startDate", end_date AS "endDate",
               estimated_hours AS "estimatedHours", percent_complete AS "percentComplete"
        FROM tasks
        WHERE customer_id = $1
        ORDER BY start_date DESC NULLS LAST
        `,
        [customerId],
      ),
      pool.query(
        `
        SELECT id, type, status, currency,
               total_amount AS "totalAmount", hourly_rate AS "hourlyRate",
               monthly_fee AS "monthlyFee", amount_paid AS "amountPaid"
        FROM contracts
        WHERE customer_id = $1
        ORDER BY created_at DESC
        `,
        [customerId],
      ),
    ]);

    const { id, name } = customerRes.rows[0];

    return {
      customerId: id,
      customerName: name,
      balance: balanceRes.rows.map((r) => ({
        currency: r.currency,
        paidInvoicesTotal: parseFloat(r.paidInvoicesTotal).toFixed(2),
        expensesTotal: parseFloat(r.expensesTotal).toFixed(2),
        balance: parseFloat(r.balance).toFixed(2),
      })),
      invoices: invoicesRes.rows,
      expenses: expensesRes.rows,
      tasks: tasksRes.rows,
      contracts: contractsRes.rows,
    };
  }
}
