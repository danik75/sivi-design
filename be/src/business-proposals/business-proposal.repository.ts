import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import pool from '../db';
import {
  CreateBusinessProposalDto,
  ProposalLanguage,
  ProposalPricingModel,
} from './dto/create-business-proposal.dto';
import { ProposalLifecycleStatus } from './dto/update-business-proposal-lifecycle.dto';

type ProposalStatus = 'queued' | 'in_progress' | 'completed' | 'failed';

type ProposalRow = {
  id: string;
  customerId: string;
  customerName: string | null;
  businessRequirement: string;
  pricingModel: ProposalPricingModel;
  estimatedHours: string | null;
  hourlyRate: string | null;
  currency: string;
  paymentDistribution: string;
  requestedLanguage: ProposalLanguage;
  status: ProposalStatus;
  lifecycleStatus: ProposalLifecycleStatus;
  englishHtml: string | null;
  hebrewHtml: string | null;
  generationError: string | null;
  contextSnapshot: Record<string, unknown> | null;
  llmModel: string | null;
  llmResponse: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
};

type ProposalContext = {
  contracts: Array<{
    type: string;
    description: string | null;
    status: string;
    currency: string;
    totalAmount: string | null;
    hourlyRate: string | null;
    monthlyFee: string | null;
  }>;
  taskSummary: {
    totalTasks: number;
    activeTasks: number;
    avgEstimatedHours: number;
  };
  billingSummary: {
    sentTotal: number;
    paidTotal: number;
    paidInvoices: number;
  };
  previousProposals: Array<{
    id: string;
    createdAt: string;
    pricingModel: string;
    businessRequirement: string;
    paymentDistribution: string;
    englishSnippet: string;
    hebrewSnippet: string;
  }>;
};

type GenerationInput = {
  customerId: string;
  customerName: string | null;
  businessRequirement: string;
  pricingModel: ProposalPricingModel;
  estimatedHours: string | null;
  hourlyRate: string | null;
  currency: string;
  paymentDistribution: string;
  requestedLanguage: ProposalLanguage;
  context: ProposalContext;
  refinementInstructions?: string;
  currentProposal?: {
    englishHtml: string;
    hebrewHtml: string;
  };
};

const PRICING_MODEL_LABELS: Record<ProposalPricingModel, string> = {
  fixed_fee: 'Fixed Fee',
  time_and_materials: 'Time & Materials',
  capped_hours_bundle: 'Capped Hours Bundle',
  monthly_retainer: 'Monthly Retainer',
};

const SELECT_FIELDS = `
  SELECT
    bp.id,
    bp.customer_id AS "customerId",
    c.name AS "customerName",
    bp.business_requirement AS "businessRequirement",
    bp.pricing_model AS "pricingModel",
    bp.estimated_hours AS "estimatedHours",
    bp.hourly_rate AS "hourlyRate",
    bp.currency,
    bp.payment_distribution AS "paymentDistribution",
    bp.requested_language AS "requestedLanguage",
    bp.status,
    bp.lifecycle_status AS "lifecycleStatus",
    bp.english_html AS "englishHtml",
    bp.hebrew_html AS "hebrewHtml",
    bp.generation_error AS "generationError",
    bp.context_snapshot AS "contextSnapshot",
    bp.llm_model AS "llmModel",
    bp.llm_response AS "llmResponse",
    bp.created_at AS "createdAt",
    bp.completed_at AS "completedAt"
  FROM business_proposals bp
  JOIN customers c ON c.id = bp.customer_id
`;

@Injectable()
export class BusinessProposalRepository {
  async findAll(customerId?: string, status = 'all') {
    if (customerId && !this.isUuid(customerId)) {
      throw new BadRequestException('Invalid customerId');
    }

    if (!['all', 'queued', 'in_progress', 'completed', 'failed'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const conditions: string[] = [];
    const values: string[] = [];

    if (customerId) {
      values.push(customerId);
      conditions.push(`bp.customer_id = $${values.length}`);
    }

    if (status !== 'all') {
      values.push(status);
      conditions.push(`bp.status = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await pool.query(
      `
        ${SELECT_FIELDS}
        ${whereClause}
        ORDER BY bp.created_at DESC
      `,
      values,
    );

    return res.rows.map((row) => this.mapRow(row as ProposalRow, false));
  }

  async findOne(id: string) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid business proposal id');
    }

    const row = await this.findOneRow(id);
    if (!row) {
      throw new NotFoundException('Business proposal not found');
    }

    return this.mapRow(row, true);
  }

  async create(dto: CreateBusinessProposalDto) {
    try {
      const res = await pool.query(
        `
          INSERT INTO business_proposals (
            customer_id,
            business_requirement,
            pricing_model,
            estimated_hours,
            hourly_rate,
            currency,
            payment_distribution,
            requested_language
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING
            id,
            status,
            created_at AS "createdAt"
        `,
        [
          dto.customerId,
          dto.businessRequirement.trim(),
          dto.pricingModel,
          dto.estimatedHours ?? null,
          dto.hourlyRate ?? null,
          dto.currency.trim().toUpperCase(),
          dto.paymentDistribution.trim(),
          dto.requestedLanguage ?? ProposalLanguage.EN,
        ],
      );

      return res.rows[0] as { id: string; status: ProposalStatus; createdAt: string };
    } catch (error) {
      if ((error as { code?: string }).code === '23503') {
        throw new BadRequestException('Customer not found');
      }
      throw error;
    }
  }

  async resubmit(id: string) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid business proposal id');
    }

    const res = await pool.query(
      `
        UPDATE business_proposals
        SET status = 'queued',
            english_html = NULL,
            hebrew_html = NULL,
            generation_error = NULL,
            context_snapshot = NULL,
            llm_model = NULL,
            llm_response = NULL,
            completed_at = NULL
        WHERE id = $1
          AND status = 'failed'
        RETURNING
          id,
          status,
          created_at AS "createdAt"
      `,
      [id],
    );

    if (res.rows[0]) {
      return res.rows[0] as { id: string; status: ProposalStatus; createdAt: string };
    }

    const exists = await pool.query(
      'SELECT id FROM business_proposals WHERE id = $1',
      [id],
    );
    if (!exists.rows[0]) {
      throw new NotFoundException('Business proposal not found');
    }
    throw new BadRequestException('Only failed proposals can be resubmitted');
  }

  async refine(id: string) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid business proposal id');
    }

    const res = await pool.query(
      `
        UPDATE business_proposals
        SET status = 'queued',
            generation_error = NULL,
            completed_at = NULL
        WHERE id = $1
          AND status = 'completed'
        RETURNING
          id,
          status,
          created_at AS "createdAt"
      `,
      [id],
    );

    if (res.rows[0]) {
      return res.rows[0] as { id: string; status: ProposalStatus; createdAt: string };
    }

    const exists = await pool.query(
      'SELECT id FROM business_proposals WHERE id = $1',
      [id],
    );
    if (!exists.rows[0]) {
      throw new NotFoundException('Business proposal not found');
    }
    throw new BadRequestException('Only completed proposals can be refined');
  }

  async updateLifecycle(id: string, lifecycleStatus: ProposalLifecycleStatus) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid business proposal id');
    }

    const res = await pool.query(
      `
        UPDATE business_proposals
        SET lifecycle_status = $2
        WHERE id = $1
        RETURNING id
      `,
      [id, lifecycleStatus],
    );

    if (!res.rows[0]) {
      throw new NotFoundException('Business proposal not found');
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid business proposal id');
    }

    const res = await pool.query(
      `
        DELETE FROM business_proposals
        WHERE id = $1
        RETURNING id
      `,
      [id],
    );

    if (!res.rows[0]) {
      throw new NotFoundException('Business proposal not found');
    }

    return { deleted: true };
  }

  async processGeneration(id: string, refinementText?: string) {
    const lock = await pool.query(
      `
        UPDATE business_proposals
        SET status = 'in_progress'
        WHERE id = $1 AND status = 'queued'
        RETURNING id
      `,
      [id],
    );

    if (!lock.rows[0]) {
      return;
    }

    try {
      const proposal = await this.findOneRow(id);
      if (!proposal) {
        throw new NotFoundException('Business proposal not found');
      }

      const context = await this.loadContext(proposal.customerId, proposal.id);
      const generationInput: GenerationInput = {
        customerId: proposal.customerId,
        customerName: proposal.customerName,
        businessRequirement: proposal.businessRequirement,
        pricingModel: proposal.pricingModel,
        estimatedHours: proposal.estimatedHours,
        hourlyRate: proposal.hourlyRate,
        currency: proposal.currency,
        paymentDistribution: proposal.paymentDistribution,
        requestedLanguage: proposal.requestedLanguage,
        context,
      };

      if (refinementText) {
        if (!proposal.englishHtml || !proposal.hebrewHtml) {
          throw new BadRequestException('Proposal content is missing and cannot be refined');
        }
        generationInput.refinementInstructions = refinementText;
        generationInput.currentProposal = {
          englishHtml: proposal.englishHtml,
          hebrewHtml: proposal.hebrewHtml,
        };
      }

      const llmResult = await this.callGroq(generationInput);

      await pool.query(
        `
          UPDATE business_proposals
          SET status = 'completed',
              english_html = $2,
              hebrew_html = $3,
              context_snapshot = $4::jsonb,
              llm_model = $5,
              llm_response = $6::jsonb,
              generation_error = NULL,
              completed_at = now()
          WHERE id = $1
        `,
        [
          id,
          llmResult.englishHtml,
          llmResult.hebrewHtml,
          JSON.stringify(generationInput),
          llmResult.model,
          JSON.stringify(llmResult.rawResponse),
        ],
      );
    } catch (error) {
      await pool.query(
        `
          UPDATE business_proposals
          SET status = 'failed',
              generation_error = $2
          WHERE id = $1
        `,
        [id, this.getErrorMessage(error)],
      );
    }
  }

  private async loadContext(customerId: string, proposalId: string): Promise<ProposalContext> {
    const [contractsRes, tasksRes, billingRes, previousProposalsRes] = await Promise.all([
      pool.query(
        `
          SELECT
            type,
            description,
            status,
            currency,
            total_amount AS "totalAmount",
            hourly_rate AS "hourlyRate",
            monthly_fee AS "monthlyFee"
          FROM contracts
          WHERE customer_id = $1
          ORDER BY created_at DESC
          LIMIT 5
        `,
        [customerId],
      ),
      pool.query(
        `
          SELECT
            COUNT(*)::int AS "totalTasks",
            COUNT(*) FILTER (WHERE status = 'in_progress')::int AS "activeTasks",
            COALESCE(AVG(estimated_hours), 0)::numeric(10,2) AS "avgEstimatedHours"
          FROM tasks
          WHERE customer_id = $1
        `,
        [customerId],
      ),
      pool.query(
        `
          SELECT
            COALESCE(SUM(total) FILTER (WHERE status = 'sent'), 0)::numeric(14,2) AS "sentTotal",
            COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0)::numeric(14,2) AS "paidTotal",
            COUNT(*) FILTER (WHERE status = 'paid')::int AS "paidInvoices"
          FROM invoices
          WHERE customer_id = $1
        `,
        [customerId],
      ),
      pool.query(
        `
          SELECT
            id,
            created_at AS "createdAt",
            pricing_model AS "pricingModel",
            business_requirement AS "businessRequirement",
            payment_distribution AS "paymentDistribution",
            LEFT(regexp_replace(COALESCE(english_html, ''), '<[^>]*>', '', 'g'), 600) AS "englishSnippet",
            LEFT(regexp_replace(COALESCE(hebrew_html, ''), '<[^>]*>', '', 'g'), 600) AS "hebrewSnippet"
          FROM business_proposals
          WHERE customer_id = $1
            AND status = 'completed'
            AND id != $2
          ORDER BY created_at DESC
          LIMIT 5
        `,
        [customerId, proposalId],
      ),
    ]);

    return {
      contracts: contractsRes.rows as ProposalContext['contracts'],
      taskSummary: {
        totalTasks: Number(tasksRes.rows[0]?.totalTasks ?? 0),
        activeTasks: Number(tasksRes.rows[0]?.activeTasks ?? 0),
        avgEstimatedHours: Number(tasksRes.rows[0]?.avgEstimatedHours ?? 0),
      },
      billingSummary: {
        sentTotal: Number(billingRes.rows[0]?.sentTotal ?? 0),
        paidTotal: Number(billingRes.rows[0]?.paidTotal ?? 0),
        paidInvoices: Number(billingRes.rows[0]?.paidInvoices ?? 0),
      },
      previousProposals: previousProposalsRes.rows as ProposalContext['previousProposals'],
    };
  }

  private async callGroq(payload: GenerationInput) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing');
    }

    const preferredModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const candidates = Array.from(
      new Set([
        preferredModel,
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
      ]),
    );

    let lastError = 'Unknown Groq error';
    for (const model of candidates) {
      try {
        const rawResponse = await this.requestGroqCompletion(apiKey, model, payload);
        const content = this.extractAssistantContent(rawResponse);
        const parsed = this.parseProposalPayload(content);

        if (!parsed.englishHtml || !parsed.hebrewHtml) {
          throw new Error('Groq response missing englishHtml/hebrewHtml');
        }

        return {
          model,
          englishHtml: parsed.englishHtml,
          hebrewHtml: parsed.hebrewHtml,
          rawResponse,
        };
      } catch (error) {
        lastError = this.getErrorMessage(error);
        const isModelAccessError =
          lastError.includes('does not exist') ||
          lastError.includes('do not have access') ||
          lastError.includes('Groq error 404') ||
          lastError.includes('model_not_found') ||
          lastError.includes('decommissioned') ||
          (lastError.includes('model') && lastError.includes('Groq error 400'));
        if (!isModelAccessError) {
          throw error;
        }
      }
    }

    throw new Error(`Groq model selection failed. ${lastError}`);
  }

  private async requestGroqCompletion(
    apiKey: string,
    model: string,
    payload: Record<string, unknown>,
  ) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a B2B proposal generator. Produce one English proposal and one Hebrew translation. If refinementInstructions and currentProposal are provided, revise the proposal accordingly while preserving professionalism and consistency. Return valid JSON object with keys: englishHtml, hebrewHtml. Both values must be complete styled HTML documents. Hebrew must have dir="rtl" and lang="he".',
          },
          {
            role: 'user',
            content: `Generate proposal from this JSON payload:\n${JSON.stringify(payload, null, 2)}`,
          },
        ],
      }),
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`Groq error ${response.status}: ${rawText.slice(0, 1000)}`);
    }

    try {
      return JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      throw new Error('Invalid JSON response from Groq');
    }
  }

  private extractAssistantContent(rawResponse: Record<string, unknown>) {
    const choices = rawResponse.choices as Array<{ message?: { content?: string } }> | undefined;
    const content = choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No assistant content returned by Groq');
    }
    return content;
  }

  private parseProposalPayload(content: string) {
    const trimmed = content.trim();
    const jsonCandidate = trimmed.startsWith('```')
      ? trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
      : trimmed;

    try {
      return JSON.parse(jsonCandidate) as { englishHtml?: string; hebrewHtml?: string };
    } catch {
      throw new Error('Unable to parse proposal JSON payload from Groq');
    }
  }

  private mapRow(row: ProposalRow, withHtml: boolean) {
    return {
      id: row.id,
      customerId: row.customerId,
      customerName: row.customerName,
      businessRequirement: row.businessRequirement,
      pricingModel: row.pricingModel,
      pricingModelLabel: PRICING_MODEL_LABELS[row.pricingModel] ?? row.pricingModel,
      estimatedHours: row.estimatedHours,
      hourlyRate: row.hourlyRate,
      currency: row.currency,
      paymentDistribution: row.paymentDistribution,
      requestedLanguage: row.requestedLanguage,
      status: row.status,
      lifecycleStatus: row.lifecycleStatus,
      generationError: row.generationError,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
      contextSnapshot: withHtml ? row.contextSnapshot : undefined,
      llmModel: withHtml ? row.llmModel : undefined,
      llmResponse: withHtml ? row.llmResponse : undefined,
      englishHtml: withHtml ? row.englishHtml : undefined,
      hebrewHtml: withHtml ? row.hebrewHtml : undefined,
    };
  }

  private async findOneRow(id: string) {
    const res = await pool.query(
      `
        ${SELECT_FIELDS}
        WHERE bp.id = $1
      `,
      [id],
    );
    return (res.rows[0] as ProposalRow | undefined) ?? null;
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message.slice(0, 2000);
    }
    return 'Unknown proposal generation error';
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
