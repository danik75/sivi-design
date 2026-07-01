import { Injectable, NotFoundException } from '@nestjs/common';
import pool from '../db';

// Number of data points shown in the trend chart
const MONTHLY_LOOKBACK = 12;
const YEARLY_LOOKBACK = 5;

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

  async getTrend(period: 'monthly' | 'yearly', year: number, month?: number) {
    if (period === 'monthly') {
      const mm = String(month).padStart(2, '0');
      const anchorDate = `${year}-${mm}-01`;

      const res = await pool.query(
        `
        WITH months AS (
          SELECT generate_series(
            (DATE_TRUNC('month', $1::date) - INTERVAL '${MONTHLY_LOOKBACK - 1} months'),
            DATE_TRUNC('month', $1::date),
            INTERVAL '1 month'
          )::date AS month_start
        ),
        paid AS (
          SELECT DATE_TRUNC('month', issue_date)::date AS ms, SUM(total) AS total
          FROM invoices
          WHERE status = 'paid'
            AND issue_date >= (DATE_TRUNC('month', $1::date) - INTERVAL '${MONTHLY_LOOKBACK - 1} months')::date
            AND issue_date < (DATE_TRUNC('month', $1::date) + INTERVAL '1 month')::date
          GROUP BY 1
        ),
        exp AS (
          SELECT DATE_TRUNC('month', date)::date AS ms, SUM(amount) AS total
          FROM expenses
          WHERE status = 'active'
            AND date >= (DATE_TRUNC('month', $1::date) - INTERVAL '${MONTHLY_LOOKBACK - 1} months')::date
            AND date < (DATE_TRUNC('month', $1::date) + INTERVAL '1 month')::date
          GROUP BY 1
        )
        SELECT
          TO_CHAR(m.month_start, 'Mon ''YY') AS label,
          COALESCE(p.total, 0) AS "paidTotal",
          COALESCE(e.total, 0) AS "expensesTotal",
          COALESCE(p.total, 0) - COALESCE(e.total, 0) AS balance
        FROM months m
        LEFT JOIN paid p ON p.ms = m.month_start
        LEFT JOIN exp  e ON e.ms = m.month_start
        ORDER BY m.month_start
        `,
        [anchorDate],
      );

      return res.rows.map((r) => ({
        label: r.label,
        paidTotal: parseFloat(r.paidTotal).toFixed(2),
        expensesTotal: parseFloat(r.expensesTotal).toFixed(2),
        balance: parseFloat(r.balance).toFixed(2),
      }));
    }

    // Yearly
    const res = await pool.query(
      `
      WITH years AS (
        SELECT generate_series($1::int - ${YEARLY_LOOKBACK - 1}, $1::int) AS yr
      ),
      paid AS (
        SELECT EXTRACT(YEAR FROM issue_date)::int AS yr, SUM(total) AS total
        FROM invoices
        WHERE status = 'paid'
          AND EXTRACT(YEAR FROM issue_date) BETWEEN ($1::int - ${YEARLY_LOOKBACK - 1}) AND $1::int
        GROUP BY 1
      ),
      exp AS (
        SELECT EXTRACT(YEAR FROM date)::int AS yr, SUM(amount) AS total
        FROM expenses
        WHERE status = 'active'
          AND EXTRACT(YEAR FROM date) BETWEEN ($1::int - ${YEARLY_LOOKBACK - 1}) AND $1::int
        GROUP BY 1
      )
      SELECT
        y.yr::text AS label,
        COALESCE(p.total, 0) AS "paidTotal",
        COALESCE(e.total, 0) AS "expensesTotal",
        COALESCE(p.total, 0) - COALESCE(e.total, 0) AS balance
      FROM years y
      LEFT JOIN paid p ON p.yr = y.yr
      LEFT JOIN exp  e ON e.yr = y.yr
      ORDER BY y.yr
      `,
      [year],
    );

    return res.rows.map((r) => ({
      label: r.label,
      paidTotal: parseFloat(r.paidTotal).toFixed(2),
      expensesTotal: parseFloat(r.expensesTotal).toFixed(2),
      balance: parseFloat(r.balance).toFixed(2),
    }));
  }

  async getCustomerTrend(customerId: string, period: 'monthly' | 'yearly', year: number, month?: number) {
    if (period === 'monthly') {
      const mm = String(month).padStart(2, '0');
      const anchorDate = `${year}-${mm}-01`;

      const res = await pool.query(
        `
        WITH months AS (
          SELECT generate_series(
            (DATE_TRUNC('month', $1::date) - INTERVAL '${MONTHLY_LOOKBACK - 1} months'),
            DATE_TRUNC('month', $1::date),
            INTERVAL '1 month'
          )::date AS month_start
        ),
        paid AS (
          SELECT DATE_TRUNC('month', issue_date)::date AS ms, SUM(total) AS total
          FROM invoices
          WHERE status = 'paid'
            AND customer_id = $2
            AND issue_date >= (DATE_TRUNC('month', $1::date) - INTERVAL '${MONTHLY_LOOKBACK - 1} months')::date
            AND issue_date < (DATE_TRUNC('month', $1::date) + INTERVAL '1 month')::date
          GROUP BY 1
        ),
        exp AS (
          SELECT DATE_TRUNC('month', date)::date AS ms, SUM(amount) AS total
          FROM expenses
          WHERE status = 'active'
            AND customer_id = $2
            AND date >= (DATE_TRUNC('month', $1::date) - INTERVAL '${MONTHLY_LOOKBACK - 1} months')::date
            AND date < (DATE_TRUNC('month', $1::date) + INTERVAL '1 month')::date
          GROUP BY 1
        )
        SELECT
          TO_CHAR(m.month_start, 'Mon ''YY') AS label,
          COALESCE(p.total, 0) AS "paidTotal",
          COALESCE(e.total, 0) AS "expensesTotal",
          COALESCE(p.total, 0) - COALESCE(e.total, 0) AS balance
        FROM months m
        LEFT JOIN paid p ON p.ms = m.month_start
        LEFT JOIN exp  e ON e.ms = m.month_start
        ORDER BY m.month_start
        `,
        [anchorDate, customerId],
      );

      return res.rows.map((r) => ({
        label: r.label,
        paidTotal: parseFloat(r.paidTotal).toFixed(2),
        expensesTotal: parseFloat(r.expensesTotal).toFixed(2),
        balance: parseFloat(r.balance).toFixed(2),
      }));
    }

    // Yearly
    const res = await pool.query(
      `
      WITH years AS (
        SELECT generate_series($1::int - ${YEARLY_LOOKBACK - 1}, $1::int) AS yr
      ),
      paid AS (
        SELECT EXTRACT(YEAR FROM issue_date)::int AS yr, SUM(total) AS total
        FROM invoices
        WHERE status = 'paid'
          AND customer_id = $2
          AND EXTRACT(YEAR FROM issue_date) BETWEEN ($1::int - ${YEARLY_LOOKBACK - 1}) AND $1::int
        GROUP BY 1
      ),
      exp AS (
        SELECT EXTRACT(YEAR FROM date)::int AS yr, SUM(amount) AS total
        FROM expenses
        WHERE status = 'active'
          AND customer_id = $2
          AND EXTRACT(YEAR FROM date) BETWEEN ($1::int - ${YEARLY_LOOKBACK - 1}) AND $1::int
        GROUP BY 1
      )
      SELECT
        y.yr::text AS label,
        COALESCE(p.total, 0) AS "paidTotal",
        COALESCE(e.total, 0) AS "expensesTotal",
        COALESCE(p.total, 0) - COALESCE(e.total, 0) AS balance
      FROM years y
      LEFT JOIN paid p ON p.yr = y.yr
      LEFT JOIN exp  e ON e.yr = y.yr
      ORDER BY y.yr
      `,
      [year, customerId],
    );

    return res.rows.map((r) => ({
      label: r.label,
      paidTotal: parseFloat(r.paidTotal).toFixed(2),
      expensesTotal: parseFloat(r.expensesTotal).toFixed(2),
      balance: parseFloat(r.balance).toFixed(2),
    }));
  }
}
