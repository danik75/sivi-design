import { Injectable } from '@nestjs/common';
import pool from '../db';

@Injectable()
export class BusinessTargetsRepository {
  async get() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [targetsRes, hoursRes, incomeRes] = await Promise.all([
      pool.query(`SELECT target_hours_per_month AS "targetHoursPerMonth",
                         target_income_per_month AS "targetIncomePerMonth",
                         currency
                  FROM business_targets WHERE id = 1`),

      pool.query(
        `SELECT COALESCE(SUM(estimated_hours), 0) AS hours
         FROM tasks
         WHERE status != 'cancelled'
           AND EXTRACT(YEAR  FROM start_date) = $1
           AND EXTRACT(MONTH FROM start_date) = $2`,
        [year, month],
      ),

      pool.query(
        `SELECT COALESCE(SUM(total), 0) AS income
         FROM invoices
         WHERE status = 'paid'
           AND EXTRACT(YEAR  FROM issue_date) = $1
           AND EXTRACT(MONTH FROM issue_date) = $2`,
        [year, month],
      ),
    ]);

    const targets = targetsRes.rows[0] ?? {
      targetHoursPerMonth: 0,
      targetIncomePerMonth: 0,
      currency: 'USD',
    };

    return {
      ...targets,
      targetHoursPerMonth: parseFloat(targets.targetHoursPerMonth),
      targetIncomePerMonth: parseFloat(targets.targetIncomePerMonth),
      currentHours: parseFloat(hoursRes.rows[0].hours),
      currentIncome: parseFloat(incomeRes.rows[0].income),
    };
  }

  async upsert(dto: { targetHoursPerMonth: number; targetIncomePerMonth: number; currency?: string }) {
    const res = await pool.query(
      `INSERT INTO business_targets (id, target_hours_per_month, target_income_per_month, currency, updated_at)
       VALUES (1, $1, $2, $3, now())
       ON CONFLICT (id) DO UPDATE
         SET target_hours_per_month  = EXCLUDED.target_hours_per_month,
             target_income_per_month = EXCLUDED.target_income_per_month,
             currency                = EXCLUDED.currency,
             updated_at              = now()
       RETURNING target_hours_per_month AS "targetHoursPerMonth",
                 target_income_per_month AS "targetIncomePerMonth",
                 currency`,
      [dto.targetHoursPerMonth, dto.targetIncomePerMonth, dto.currency ?? 'USD'],
    );
    return res.rows[0];
  }
}
