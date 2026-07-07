import { Injectable } from '@nestjs/common';
import pool from '../db';

const TREND_MONTHS = 12;
const FORECAST_MONTHS = 6;

function trendSql(startSql: string, wherePaid: string, whereExp: string) {
  return `
    WITH months AS (
      SELECT generate_series(
        (DATE_TRUNC('month', NOW()) - INTERVAL '${TREND_MONTHS - 1} months'),
        DATE_TRUNC('month', NOW()),
        INTERVAL '1 month'
      )::date AS ms
    ),
    paid AS (
      SELECT DATE_TRUNC('month', issue_date)::date AS ms, SUM(total) AS total
      FROM invoices WHERE status = 'paid' ${wherePaid}
        AND issue_date >= (DATE_TRUNC('month', NOW()) - INTERVAL '${TREND_MONTHS - 1} months')::date
      GROUP BY 1
    ),
    exp AS (
      SELECT DATE_TRUNC('month', date)::date AS ms, SUM(amount) AS total
      FROM expenses WHERE status = 'active' ${whereExp}
        AND date >= (DATE_TRUNC('month', NOW()) - INTERVAL '${TREND_MONTHS - 1} months')::date
      GROUP BY 1
    )
    SELECT
      TO_CHAR(m.ms, 'Mon ''YY') AS label,
      COALESCE(p.total,0) AS revenue,
      COALESCE(e.total,0) AS expenses,
      COALESCE(p.total,0) - COALESCE(e.total,0) AS profit
    FROM months m
    LEFT JOIN paid p ON p.ms = m.ms
    LEFT JOIN exp  e ON e.ms = m.ms
    ORDER BY m.ms
  `;
}

function mapMoney(r: Record<string, unknown>) {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(r)) {
    out[k] = typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v as string)
      ? parseFloat(v as string).toFixed(2)
      : (v as string | number);
  }
  return out;
}

@Injectable()
export class ReportsRepository {

  // ─── P&L ───────────────────────────────────────────────────────────────────

  async getPL(startDate: string, endDate: string) {
    const [summaryRes, trendRes] = await Promise.all([
      pool.query(
        `
        WITH paid AS (
          SELECT currency, SUM(total) AS revenue
          FROM invoices WHERE status='paid' AND issue_date BETWEEN $1 AND $2
          GROUP BY currency
        ),
        exp AS (
          SELECT currency, SUM(amount) AS expenses
          FROM expenses WHERE status='active' AND date BETWEEN $1 AND $2
          GROUP BY currency
        )
        SELECT
          COALESCE(p.currency, e.currency) AS currency,
          COALESCE(p.revenue,0) AS revenue,
          COALESCE(e.expenses,0) AS expenses,
          COALESCE(p.revenue,0) - COALESCE(e.expenses,0) AS profit,
          CASE WHEN COALESCE(p.revenue,0) > 0
            THEN ROUND((COALESCE(p.revenue,0) - COALESCE(e.expenses,0)) / COALESCE(p.revenue,0) * 100, 2)
            ELSE 0
          END AS margin_pct
        FROM paid p FULL OUTER JOIN exp e USING (currency)
        `,
        [startDate, endDate],
      ),
      pool.query(trendSql(startDate, '', '')),
    ]);

    return {
      summary: summaryRes.rows.map((r) => ({
        currency: r.currency,
        revenue: parseFloat(r.revenue).toFixed(2),
        expenses: parseFloat(r.expenses).toFixed(2),
        profit: parseFloat(r.profit).toFixed(2),
        marginPct: parseFloat(r.margin_pct).toFixed(2),
      })),
      trend: trendRes.rows.map((r) => ({
        label: r.label,
        revenue: parseFloat(r.revenue).toFixed(2),
        expenses: parseFloat(r.expenses).toFixed(2),
        profit: parseFloat(r.profit).toFixed(2),
      })),
    };
  }

  // ─── Revenue breakdown ──────────────────────────────────────────────────────

  async getRevenueBreakdown(startDate: string, endDate: string) {
    const [byCustomerRes, byCategoryRes] = await Promise.all([
      pool.query(
        `
        WITH rev AS (
          SELECT customer_id, currency, SUM(total) AS revenue
          FROM invoices WHERE status='paid' AND issue_date BETWEEN $1 AND $2
          GROUP BY customer_id, currency
        ),
        exp AS (
          SELECT customer_id, currency, SUM(amount) AS expenses
          FROM expenses WHERE status='active' AND date BETWEEN $1 AND $2
          GROUP BY customer_id, currency
        )
        SELECT
          c.id AS "customerId", c.name AS "customerName",
          COALESCE(r.currency, e.currency) AS currency,
          COALESCE(r.revenue,0) AS revenue,
          COALESCE(e.expenses,0) AS expenses,
          COALESCE(r.revenue,0) - COALESCE(e.expenses,0) AS net
        FROM customers c
        LEFT JOIN rev r ON r.customer_id = c.id
        LEFT JOIN exp e ON e.customer_id = c.id AND e.currency = r.currency
        WHERE r.revenue IS NOT NULL OR e.expenses IS NOT NULL
        ORDER BY revenue DESC
        `,
        [startDate, endDate],
      ),
      pool.query(
        `
        SELECT
          category,
          currency,
          SUM(amount) AS total,
          COUNT(*) AS count
        FROM expenses WHERE status='active' AND date BETWEEN $1 AND $2
        GROUP BY category, currency
        ORDER BY total DESC
        `,
        [startDate, endDate],
      ),
    ]);

    const totalExp = byCategoryRes.rows.reduce((s, r) => s + parseFloat(r.total), 0);

    return {
      byCustomer: byCustomerRes.rows.map((r) => ({
        customerId: r.customerId,
        customerName: r.customerName,
        currency: r.currency,
        revenue: parseFloat(r.revenue).toFixed(2),
        expenses: parseFloat(r.expenses).toFixed(2),
        net: parseFloat(r.net).toFixed(2),
      })),
      expensesByCategory: byCategoryRes.rows.map((r) => ({
        category: r.category ?? 'other',
        currency: r.currency,
        total: parseFloat(r.total).toFixed(2),
        count: parseInt(r.count, 10),
        pct: totalExp > 0 ? ((parseFloat(r.total) / totalExp) * 100).toFixed(2) : '0.00',
      })),
    };
  }

  // ─── Customer statement ─────────────────────────────────────────────────────

  async getCustomerStatement(customerId: string, startDate: string, endDate: string) {
    const [customerRes, entriesRes] = await Promise.all([
      pool.query(`SELECT id, name FROM customers WHERE id=$1`, [customerId]),
      pool.query(
        `
        SELECT 'invoice' AS type, i.id, i.invoice_number AS reference,
               COALESCE(con.type::text,'') AS description,
               i.total AS amount, i.issue_date AS date, i.status::text AS status, i.currency
        FROM invoices i
        JOIN contracts con ON con.id = i.contract_id
        WHERE i.customer_id = $1 AND i.issue_date BETWEEN $2 AND $3
          AND i.status IN ('paid','sent')

        UNION ALL

        SELECT 'expense' AS type, e.id,
               CONCAT('EXP-', SUBSTRING(e.id::text,1,8)) AS reference,
               CONCAT(COALESCE(e.vendor,''),' – ',COALESCE(e.category::text,'')) AS description,
               -e.amount AS amount, e.date, e.status::text AS status, e.currency
        FROM expenses e
        WHERE e.customer_id = $1 AND e.date BETWEEN $2 AND $3

        ORDER BY date ASC, type DESC
        `,
        [customerId, startDate, endDate],
      ),
    ]);

    if (!customerRes.rows[0]) return null;

    let balance = 0;
    const entries = entriesRes.rows.map((r) => {
      balance += parseFloat(r.amount);
      return {
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        type: r.type,
        reference: r.reference,
        description: r.description,
        amount: parseFloat(r.amount).toFixed(2),
        runningBalance: balance.toFixed(2),
        status: r.status,
        currency: r.currency,
      };
    });

    return {
      customerId,
      customerName: customerRes.rows[0].name,
      period: { from: startDate, to: endDate },
      openingBalance: '0.00',
      closingBalance: balance.toFixed(2),
      entries,
    };
  }

  // ─── AR Aging ───────────────────────────────────────────────────────────────

  async getARaging() {
    const res = await pool.query(
      `
      SELECT
        i.id, i.invoice_number AS "invoiceNumber",
        i.customer_id AS "customerId", c.name AS "customerName",
        i.issue_date AS "issueDate", i.due_date AS "dueDate",
        i.total, i.currency,
        GREATEST(0, CURRENT_DATE - i.due_date::date) AS days_overdue
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.status = 'sent'
      ORDER BY days_overdue DESC
      `,
    );

    const bucketOf = (d: number) => {
      if (d === 0) return 'current';
      if (d <= 30) return 'days1to30';
      if (d <= 60) return 'days31to60';
      if (d <= 90) return 'days61to90';
      return 'days90plus';
    };

    const summary = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0 };
    const invoices = res.rows.map((r) => {
      const days = parseInt(r.days_overdue, 10);
      const bucket = bucketOf(days);
      summary[bucket] += parseFloat(r.total);
      return {
        invoiceId: r.id,
        invoiceNumber: r.invoiceNumber,
        customerId: r.customerId,
        customerName: r.customerName,
        issueDate: r.issueDate instanceof Date ? r.issueDate.toISOString().split('T')[0] : r.issueDate,
        dueDate: r.dueDate instanceof Date ? r.dueDate.toISOString().split('T')[0] : r.dueDate,
        total: parseFloat(r.total).toFixed(2),
        currency: r.currency,
        daysOverdue: days,
        bucket,
      };
    });

    const total = Object.values(summary).reduce((s, v) => s + v, 0);

    return {
      asOf: new Date().toISOString().split('T')[0],
      summary: {
        totalOutstanding: total.toFixed(2),
        current: summary.current.toFixed(2),
        days1to30: summary.days1to30.toFixed(2),
        days31to60: summary.days31to60.toFixed(2),
        days61to90: summary.days61to90.toFixed(2),
        days90plus: summary.days90plus.toFixed(2),
      },
      invoices,
    };
  }

  // ─── Tax summary ────────────────────────────────────────────────────────────

  async getTaxSummary(startDate: string, endDate: string) {
    const [invoicesRes, trendRes] = await Promise.all([
      pool.query(
        `
        SELECT
          i.invoice_number AS "invoiceNumber", c.name AS "customerName",
          i.issue_date AS "issueDate", i.status,
          i.subtotal, i.tax_rate AS "taxRate",
          i.tax_amount AS "taxAmount", i.total, i.currency
        FROM invoices i
        JOIN customers c ON c.id = i.customer_id
        WHERE i.tax_amount > 0
          AND i.issue_date BETWEEN $1 AND $2
        ORDER BY i.issue_date DESC
        `,
        [startDate, endDate],
      ),
      pool.query(`
        WITH months AS (
          SELECT generate_series(
            (DATE_TRUNC('month', NOW()) - INTERVAL '${TREND_MONTHS - 1} months'),
            DATE_TRUNC('month', NOW()), INTERVAL '1 month'
          )::date AS ms
        ),
        tax AS (
          SELECT DATE_TRUNC('month', issue_date)::date AS ms, SUM(tax_amount) AS total
          FROM invoices WHERE tax_amount > 0
            AND issue_date >= (DATE_TRUNC('month', NOW()) - INTERVAL '${TREND_MONTHS - 1} months')::date
          GROUP BY 1
        )
        SELECT TO_CHAR(m.ms,'Mon ''YY') AS label, COALESCE(t.total,0) AS total
        FROM months m LEFT JOIN tax t ON t.ms = m.ms ORDER BY m.ms
      `),
    ]);

    const totalTax = invoicesRes.rows.reduce((s, r) => s + parseFloat(r.taxAmount ?? 0), 0);

    const byRateMap: Record<string, { taxRate: string; count: number; subtotalSum: number; taxSum: number }> = {};
    invoicesRes.rows.forEach((r) => {
      const key = r.taxRate;
      if (!byRateMap[key]) byRateMap[key] = { taxRate: parseFloat(key).toFixed(2), count: 0, subtotalSum: 0, taxSum: 0 };
      byRateMap[key].count++;
      byRateMap[key].subtotalSum += parseFloat(r.subtotal ?? 0);
      byRateMap[key].taxSum += parseFloat(r.taxAmount ?? 0);
    });

    return {
      totalTaxCollected: totalTax.toFixed(2),
      invoices: invoicesRes.rows.map((r) => ({
        invoiceNumber: r.invoiceNumber,
        customerName: r.customerName,
        issueDate: r.issueDate instanceof Date ? r.issueDate.toISOString().split('T')[0] : r.issueDate,
        status: r.status,
        subtotal: parseFloat(r.subtotal ?? 0).toFixed(2),
        taxRate: parseFloat(r.taxRate ?? 0).toFixed(2),
        taxAmount: parseFloat(r.taxAmount ?? 0).toFixed(2),
        total: parseFloat(r.total ?? 0).toFixed(2),
        currency: r.currency,
      })),
      byTaxRate: Object.values(byRateMap).map((v) => ({
        taxRate: v.taxRate,
        count: v.count,
        subtotalSum: v.subtotalSum.toFixed(2),
        taxSum: v.taxSum.toFixed(2),
      })),
      trend: trendRes.rows.map((r) => ({
        label: r.label,
        total: parseFloat(r.total).toFixed(2),
      })),
    };
  }

  // ─── Expense analysis ───────────────────────────────────────────────────────

  async getExpenseAnalysis(startDate: string, endDate: string) {
    const [byCatRes, byVendorRes, byCustomerRes, trendRes] = await Promise.all([
      pool.query(
        `SELECT category, currency, SUM(amount) AS total, COUNT(*) AS count
         FROM expenses WHERE status='active' AND date BETWEEN $1 AND $2
         GROUP BY category, currency ORDER BY total DESC`,
        [startDate, endDate],
      ),
      pool.query(
        `SELECT vendor, category, currency, SUM(amount) AS total, COUNT(*) AS count
         FROM expenses WHERE status='active' AND date BETWEEN $1 AND $2
         GROUP BY vendor, category, currency ORDER BY total DESC LIMIT 20`,
        [startDate, endDate],
      ),
      pool.query(
        `SELECT c.id AS "customerId", c.name AS "customerName", e.currency,
                SUM(e.amount) AS total, COUNT(*) AS count
         FROM expenses e JOIN customers c ON c.id = e.customer_id
         WHERE e.status='active' AND e.date BETWEEN $1 AND $2
         GROUP BY c.id, c.name, e.currency ORDER BY total DESC`,
        [startDate, endDate],
      ),
      pool.query(trendSql(startDate, "AND 1=0 --", '')),
    ]);

    const grandTotal = byCatRes.rows.reduce((s, r) => s + parseFloat(r.total), 0);

    return {
      totalExpenses: grandTotal.toFixed(2),
      byCategory: byCatRes.rows.map((r) => ({
        category: r.category ?? 'other',
        currency: r.currency,
        total: parseFloat(r.total).toFixed(2),
        count: parseInt(r.count, 10),
        pct: grandTotal > 0 ? ((parseFloat(r.total) / grandTotal) * 100).toFixed(2) : '0.00',
      })),
      byVendor: byVendorRes.rows.map((r) => ({
        vendor: r.vendor,
        category: r.category ?? 'other',
        currency: r.currency,
        total: parseFloat(r.total).toFixed(2),
        count: parseInt(r.count, 10),
      })),
      byCustomer: byCustomerRes.rows.map((r) => ({
        customerId: r.customerId,
        customerName: r.customerName,
        currency: r.currency,
        total: parseFloat(r.total).toFixed(2),
        count: parseInt(r.count, 10),
      })),
      trend: trendRes.rows.map((r) => ({
        label: r.label,
        total: parseFloat(r.expenses).toFixed(2),
      })),
    };
  }

  // ─── Customer profitability ─────────────────────────────────────────────────

  async getCustomerProfitability(startDate: string, endDate: string) {
    const res = await pool.query(
      `
      WITH rev AS (
        SELECT customer_id, currency, SUM(total) AS revenue, COUNT(*) AS inv_count
        FROM invoices WHERE status='paid' AND issue_date BETWEEN $1 AND $2
        GROUP BY customer_id, currency
      ),
      exp AS (
        SELECT customer_id, currency, SUM(amount) AS expenses, COUNT(*) AS exp_count
        FROM expenses WHERE status='active' AND date BETWEEN $1 AND $2
        GROUP BY customer_id, currency
      )
      SELECT
        c.id AS "customerId", c.name AS "customerName",
        r.currency,
        r.revenue,
        COALESCE(e.expenses,0) AS expenses,
        r.revenue - COALESCE(e.expenses,0) AS profit,
        ROUND((r.revenue - COALESCE(e.expenses,0)) / r.revenue * 100, 2) AS margin_pct,
        r.inv_count AS "invoiceCount",
        COALESCE(e.exp_count,0) AS "expenseCount"
      FROM rev r
      JOIN customers c ON c.id = r.customer_id
      LEFT JOIN exp e ON e.customer_id = r.customer_id AND e.currency = r.currency
      WHERE r.revenue > 0
      ORDER BY margin_pct DESC
      `,
      [startDate, endDate],
    );

    return {
      rows: res.rows.map((r) => ({
        customerId: r.customerId,
        customerName: r.customerName,
        currency: r.currency,
        revenue: parseFloat(r.revenue).toFixed(2),
        expenses: parseFloat(r.expenses).toFixed(2),
        profit: parseFloat(r.profit).toFixed(2),
        marginPct: parseFloat(r.margin_pct).toFixed(2),
        invoiceCount: parseInt(r.invoiceCount, 10),
        expenseCount: parseInt(r.expenseCount, 10),
      })),
    };
  }

  // ─── Revenue forecast ───────────────────────────────────────────────────────

  async getForecast() {
    const [confirmedRes, contractsRes] = await Promise.all([
      pool.query(
        `
        SELECT i.id, i.invoice_number AS "invoiceNumber", i.customer_id AS "customerId",
               c.name AS "customerName", i.due_date AS "dueDate", i.total, i.currency
        FROM invoices i JOIN customers c ON c.id = i.customer_id
        WHERE i.status = 'sent'
          AND i.due_date >= CURRENT_DATE
          AND i.due_date < CURRENT_DATE + INTERVAL '${FORECAST_MONTHS} months'
        ORDER BY i.due_date
        `,
      ),
      pool.query(
        `
        SELECT con.id, con.customer_id AS "customerId", c.name AS "customerName",
               con.type, con.monthly_fee AS "monthlyFee", con.total_amount AS "totalAmount",
               con.amount_paid AS "amountPaid", con.expires_at AS "expiresAt", con.currency
        FROM contracts con JOIN customers c ON c.id = con.customer_id
        WHERE con.status = 'active' AND con.type IN ('monthly_retainer','lump_sum')
        `,
      ),
    ]);

    // Build 6 forecast month labels
    const now = new Date();
    const fmtMonth = (d: Date) =>
      d.toLocaleString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '");
    const monthLabels = Array.from({ length: FORECAST_MONTHS }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { label: fmtMonth(d), year: d.getFullYear(), month: d.getMonth() };
    });

    const confirmed = confirmedRes.rows.map((r) => {
      const due = new Date(r.dueDate);
      const label = fmtMonth(new Date(due.getFullYear(), due.getMonth(), 1));
      return {
        customerId: r.customerId,
        customerName: r.customerName,
        source: 'invoice',
        invoiceNumber: r.invoiceNumber,
        dueDate: due.toISOString().split('T')[0],
        amount: parseFloat(r.total).toFixed(2),
        currency: r.currency,
        forecastMonth: label,
      };
    });

    const projected: typeof confirmed = [];
    for (const con of contractsRes.rows) {
      if (con.type === 'monthly_retainer' && con.monthlyFee) {
        for (const m of monthLabels) {
          const expiresAt = con.expiresAt ? new Date(con.expiresAt) : null;
          if (expiresAt && new Date(m.year, m.month, 1) > expiresAt) continue;
          projected.push({
            customerId: con.customerId,
            customerName: con.customerName,
            source: 'retainer_contract',
            invoiceNumber: '',
            dueDate: '',
            amount: parseFloat(con.monthlyFee).toFixed(2),
            currency: con.currency,
            forecastMonth: m.label,
          });
        }
      } else if (con.type === 'lump_sum' && con.totalAmount) {
        const remaining = parseFloat(con.totalAmount) - parseFloat(con.amountPaid ?? 0);
        if (remaining <= 0) continue;
        projected.push({
          customerId: con.customerId,
          customerName: con.customerName,
          source: 'fixed_contract',
          invoiceNumber: '',
          dueDate: '',
          amount: remaining.toFixed(2),
          currency: con.currency,
          forecastMonth: monthLabels[0].label,
        });
      }
    }

    const summary = monthLabels.map((m) => {
      const conf = confirmed.filter((c) => c.forecastMonth === m.label).reduce((s, c) => s + parseFloat(c.amount), 0);
      const proj = projected.filter((c) => c.forecastMonth === m.label).reduce((s, c) => s + parseFloat(c.amount), 0);
      return { month: m.label, confirmed: conf.toFixed(2), projected: proj.toFixed(2), total: (conf + proj).toFixed(2) };
    });

    return { asOf: new Date().toISOString().split('T')[0], confirmed, projected, summary };
  }

  // ─── Project status ─────────────────────────────────────────────────────────

  async getProjectStatus(customerId?: string, status?: string) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (customerId) {
      values.push(customerId);
      conditions.push(`t.customer_id = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`t.status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [tasksRes, contractsRes] = await Promise.all([
      pool.query(
        `
        SELECT t.id, t.name, t.status, t.start_date AS "startDate", t.end_date AS "endDate",
               t.estimated_hours AS "estimatedHours", t.percent_complete AS "percentComplete",
               t.customer_id AS "customerId", c.name AS "customerName"
        FROM tasks t JOIN customers c ON c.id = t.customer_id
        ${where}
        ORDER BY c.name, t.start_date NULLS LAST
        `,
        values,
      ),
      pool.query(
        `
        SELECT con.id, con.customer_id AS "customerId", con.type, con.status,
               con.hourly_rate AS "hourlyRate", con.monthly_fee AS "monthlyFee",
               con.total_amount AS "totalAmount", con.currency
        FROM contracts con
        ${customerId ? `WHERE con.customer_id = $1` : ''}
        ORDER BY con.created_at DESC
        `,
        customerId ? [customerId] : [],
      ),
    ]);

    // Group tasks by customer
    const customerMap = new Map<string, { customerId: string; customerName: string; tasks: unknown[]; contracts: unknown[] }>();
    for (const task of tasksRes.rows) {
      if (!customerMap.has(task.customerId)) {
        customerMap.set(task.customerId, {
          customerId: task.customerId,
          customerName: task.customerName,
          tasks: [],
          contracts: [],
        });
      }
      customerMap.get(task.customerId)!.tasks.push({
        id: task.id,
        name: task.name,
        status: task.status,
        startDate: task.startDate instanceof Date ? task.startDate.toISOString().split('T')[0] : task.startDate,
        endDate: task.endDate instanceof Date ? task.endDate.toISOString().split('T')[0] : task.endDate,
        estimatedHours: task.estimatedHours,
        percentComplete: task.percentComplete ?? 0,
      });
    }

    for (const con of contractsRes.rows) {
      if (customerMap.has(con.customerId)) {
        customerMap.get(con.customerId)!.contracts.push(con);
      }
    }

    const total = tasksRes.rows.length;
    const counts = { todo: 0, in_progress: 0, done: 0, cancelled: 0 };
    let totalPct = 0;
    for (const t of tasksRes.rows) {
      if (t.status in counts) counts[t.status as keyof typeof counts]++;
      totalPct += t.percentComplete ?? 0;
    }

    const byCustomer = Array.from(customerMap.values()).map((c) => {
      const tasks = c.tasks as Array<{ percentComplete: number }>;
      const avg = tasks.length > 0 ? tasks.reduce((s, t) => s + t.percentComplete, 0) / tasks.length : 0;
      return { ...c, avgCompletion: avg.toFixed(2) };
    });

    return {
      asOf: new Date().toISOString().split('T')[0],
      summary: {
        total,
        ...counts,
        avgCompletion: total > 0 ? (totalPct / total).toFixed(2) : '0.00',
      },
      byCustomer,
    };
  }

  // Tasks overlapping [startDate, endDate] with estimated vs actual hours.
  // When a task has no actual_hours it falls back to the estimate (flagged).
  async getCustomerTaskHours(startDate: string, endDate: string, customerId?: string) {
    // Only completed tasks — hours & cost are only meaningful once a task is done.
    const conditions: string[] = ["t.status = 'done'", 't.start_date <= $1', 't.end_date >= $2'];
    const values: unknown[] = [endDate, startDate];
    if (customerId) {
      values.push(customerId);
      conditions.push(`t.customer_id = $${values.length}`);
    }

    const res = await pool.query(
      `
        SELECT t.id AS "taskId", t.name, t.status,
               t.customer_id AS "customerId", c.name AS "customerName",
               t.start_date AS "startDate", t.end_date AS "endDate",
               t.start_time AS "startTime", t.end_time AS "endTime",
               t.estimated_hours AS "estimatedHours", t.actual_hours AS "actualHours"
        FROM tasks t
        LEFT JOIN customers c ON c.id = t.customer_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY c.name NULLS LAST, t.start_date, t.name
      `,
      values,
    );

    const toISO = (d: unknown) =>
      d instanceof Date ? d.toISOString().split('T')[0] : (d as string | null);
    const hhmm = (t: unknown) => (typeof t === 'string' ? t.slice(0, 5) : null);

    let totalEstimated = 0;
    let totalActual = 0;

    const rows = res.rows.map((r) => {
      const estimated = r.estimatedHours != null ? Number(r.estimatedHours) : null;
      const hasActual = r.actualHours != null;
      const actual = hasActual ? Number(r.actualHours) : estimated;
      totalEstimated += estimated ?? 0;
      totalActual += actual ?? 0;
      return {
        taskId: r.taskId,
        name: r.name,
        status: r.status,
        customerId: r.customerId,
        customerName: r.customerName,
        startDate: toISO(r.startDate),
        endDate: toISO(r.endDate),
        startTime: hhmm(r.startTime),
        endTime: hhmm(r.endTime),
        estimatedHours: estimated,
        actualHours: actual,
        actualIsEstimate: !hasActual,
      };
    });

    return {
      startDate,
      endDate,
      rows,
      totals: {
        estimatedHours: Number(totalEstimated.toFixed(2)),
        actualHours: Number(totalActual.toFixed(2)),
      },
    };
  }

  // Distribution of tasks across contracts for the period. Prepaid contracts also
  // carry lifetime burndown (used vs purchased) for the pie chart.
  async getTasksPerContract(startDate: string, endDate: string, customerId?: string) {
    const labels: Record<string, string> = {
      lump_sum: 'Lump Sum',
      time_and_materials: 'Time & Materials',
      prepaid_hours: 'Prepaid Hours',
      monthly_retainer: 'Monthly Retainer',
    };
    const values: unknown[] = [startDate, endDate, customerId ?? null];
    const res = await pool.query(
      `
        SELECT con.id AS "contractId", con.customer_id AS "customerId", c.name AS "customerName",
               con.type AS "contractType", con.status AS "contractStatus",
               con.hours_purchased AS "hoursPurchased",
               con.hours_per_month AS "hoursPerMonth",
               COUNT(t.id) AS "taskCount",
               COALESCE(SUM(t.estimated_hours), 0) AS "estimatedHours",
               COALESCE(SUM(t.actual_hours), 0) AS "actualHours",
               (SELECT COALESCE(SUM(actual_hours), 0) FROM tasks tt WHERE tt.contract_id = con.id) AS "hoursUsedLifetime"
        FROM contracts con
        JOIN customers c ON c.id = con.customer_id
        LEFT JOIN tasks t ON t.contract_id = con.id AND t.start_date <= $2 AND t.end_date >= $1
        WHERE ($3::uuid IS NULL OR con.customer_id = $3)
        GROUP BY con.id, c.name
        HAVING COUNT(t.id) > 0 OR con.type IN ('prepaid_hours', 'monthly_retainer')
        ORDER BY c.name, con.type
      `,
      values,
    );

    const rows = res.rows.map((r) => {
      const isPrepaid = r.contractType === 'prepaid_hours';
      const hoursPurchased = r.hoursPurchased != null ? Number(r.hoursPurchased) : null;
      const hoursUsed = isPrepaid ? Number(r.hoursUsedLifetime) : null;
      const hoursRemaining = hoursPurchased != null && hoursUsed != null ? hoursPurchased - hoursUsed : null;
      const percentUsed =
        hoursPurchased != null && hoursPurchased > 0 && hoursUsed != null
          ? Math.min(1, hoursUsed / hoursPurchased)
          : null;
      return {
        contractId: r.contractId,
        customerId: r.customerId,
        customerName: r.customerName,
        contractType: r.contractType,
        contractLabel: labels[r.contractType] ?? r.contractType,
        contractStatus: r.contractStatus,
        taskCount: Number(r.taskCount),
        estimatedHours: Number(Number(r.estimatedHours).toFixed(2)),
        actualHours: Number(Number(r.actualHours).toFixed(2)),
        hoursPurchased,
        hoursUsed: hoursUsed != null ? Number(hoursUsed.toFixed(2)) : null,
        hoursRemaining: hoursRemaining != null ? Number(hoursRemaining.toFixed(2)) : null,
        percentUsed,
        hoursPerMonth: r.hoursPerMonth != null ? Number(r.hoursPerMonth) : null,
      };
    });

    return { startDate, endDate, rows };
  }

  // Historical tasks grouped by customer → contract, with a "No contract" bucket
  // per customer (and a "No customer" bucket for orphaned tasks).
  async getTaskHistory(startDate: string, endDate: string, customerId?: string) {
    const labels: Record<string, string> = {
      lump_sum: 'Lump Sum',
      time_and_materials: 'Time & Materials',
      prepaid_hours: 'Prepaid Hours',
      monthly_retainer: 'Monthly Retainer',
    };
    const toISO = (d: unknown) =>
      d instanceof Date ? d.toISOString().split('T')[0] : (d as string | null);
    const res = await pool.query(
      `
        SELECT t.id AS "taskId", t.name, t.status,
               t.start_date AS "startDate", t.end_date AS "endDate",
               t.estimated_hours AS "estimatedHours", t.actual_hours AS "actualHours",
               t.customer_id AS "customerId", c.name AS "customerName",
               t.contract_id AS "contractId", con.type AS "contractType"
        FROM tasks t
        LEFT JOIN customers c ON c.id = t.customer_id
        LEFT JOIN contracts con ON con.id = t.contract_id
        WHERE t.start_date <= $2 AND t.end_date >= $1
          AND ($3::uuid IS NULL OR t.customer_id = $3)
        ORDER BY c.name NULLS LAST, con.type NULLS LAST, t.start_date, t.name
      `,
      [startDate, endDate, customerId ?? null],
    );

    const customers = new Map<
      string,
      {
        customerId: string | null;
        customerName: string;
        contracts: Map<string, { contractId: string; contractLabel: string; tasks: unknown[] }>;
        unassignedTasks: unknown[];
      }
    >();

    for (const r of res.rows) {
      const custKey = r.customerId ?? '__none__';
      if (!customers.has(custKey)) {
        customers.set(custKey, {
          customerId: r.customerId,
          customerName: r.customerName ?? 'No customer',
          contracts: new Map(),
          unassignedTasks: [],
        });
      }
      const cust = customers.get(custKey)!;
      const task = {
        taskId: r.taskId,
        name: r.name,
        status: r.status,
        startDate: toISO(r.startDate),
        endDate: toISO(r.endDate),
        estimatedHours: r.estimatedHours != null ? Number(r.estimatedHours) : null,
        actualHours: r.actualHours != null ? Number(r.actualHours) : null,
      };
      if (r.contractId) {
        if (!cust.contracts.has(r.contractId)) {
          cust.contracts.set(r.contractId, {
            contractId: r.contractId,
            contractLabel: labels[r.contractType] ?? r.contractType,
            tasks: [],
          });
        }
        cust.contracts.get(r.contractId)!.tasks.push(task);
      } else {
        cust.unassignedTasks.push(task);
      }
    }

    const rows = [...customers.values()].map((c) => ({
      customerId: c.customerId,
      customerName: c.customerName,
      contracts: [...c.contracts.values()],
      unassignedTasks: c.unassignedTasks,
    }));

    return { startDate, endDate, customers: rows };
  }
}
