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
import {
  buildProposalHtml,
  buildBilingualPdf,
  ContentJson,
  CustomerInfo,
} from './proposal-template';
import { htmlToPdfBuffer } from './pdf-generator';

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
  contentJson: ContentJson | null;
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
    heSnippet: string;
    enSnippet: string;
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
  currentContentJson?: ContentJson;
};

const PRICING_MODEL_LABELS: Record<ProposalPricingModel, string> = {
  fixed_fee: 'Fixed Fee',
  time_and_materials: 'Time & Materials',
  capped_hours_bundle: 'Capped Hours Bundle',
  monthly_retainer: 'Monthly Retainer',
};

const SYSTEM_PROMPT = `You are a professional business proposal writer for Sivi-Design, an Israeli creative studio.

ABOUT SIVI-DESIGN:
- Owner / Designer: Sivan Darmon Pritsker (Hebrew: סיון דרמון פריצקר)
- Services: AI Design, Graphic Design (עיצוב גרפי), Creative Direction, Marketing, Digital Design, UX/UI, Web Design, Illustration
- VAT status: Exempt (עוסק פטור) — prices do NOT include VAT
- Standard hourly rate: 250 NIS/hour
- Overtime/additional hours rate: 230 NIS/hour
- Rush/emergency surcharge: +50% above base price
- Contact: 052-6613709 | sivandarmon@gmail.com | sivi-design.com

PRICING MODEL GUIDANCE:
- fixed_fee: One total price. Payment: 25% advance before start, milestone payments per phase, final 25% upon file delivery.
- time_and_materials: Hourly billing at 250 NIS/hr. 1,000 NIS advance. Monthly invoicing.
- monthly_retainer: Fixed monthly fee for agreed ongoing hours. Payment on the 15th of each calendar month. Track hours monthly.
- capped_hours_bundle: Pre-purchased block of hours at slightly reduced rate. Full amount paid upfront. Hours tracked; unused hours do not roll over.

STANDARD TERMS (these appear in every proposal — do NOT include in your JSON, they are added automatically by the template):
- 2 revision rounds + 3 sub-revisions per deliverable, then billed hourly
- 50% surcharge for rush/emergency work
- No VAT (עוסק פטור)
- Work begins only after advance payment and signed contract
- Source files transferred only after final payment

YOUR TASK:
Generate a complete, professional price proposal for Sivi-Design. Base the scope, timeline, pricing, and deliverables on the business requirement and pricing model provided. Be specific, realistic, and professional.

RETURN a JSON object with EXACTLY this structure (no extra keys):
{
  "he": {
    "greeting": "היי [contactName],",
    "intro": "בהמשך לשיחתנו, להלן הצעת מחיר לעיצוב – אנא עבר/י בעיון והחזר/י לי חתום/ה:",
    "projectDescription": "תיאור קצר של הפרויקט ומטרותיו",
    "timeline": [
      {
        "phase": "שלב א׳: שם השלב",
        "duration": "עד X ימי עסקים",
        "tasks": ["משימה 1", "משימה 2", "משימה 3"]
      }
    ],
    "totalPrice": "XX,XXX ₪",
    "paymentSchedule": [
      { "label": "מקדמה", "amount": "X,XXX ₪", "condition": "לפני תחילת הפרויקט – 25% מהסכום הכללי" },
      { "label": "תשלום שני", "amount": "X,XXX ₪", "condition": "לאחר סיום שלב א׳" },
      { "label": "תשלום אחרון", "amount": "X,XXX ₪", "condition": "לאחר סיום ולפני העברת קבצים פתוחים" }
    ],
    "projectStructure": [
      {
        "name": "שם המרכיב / שלב",
        "description": "תיאור קצר",
        "deliverables": [
          { "item": "שם פריט ספציפי", "price": "X,XXX ₪" }
        ]
      }
    ]
  },
  "en": {
    "greeting": "Hi [contactName],",
    "intro": "Following our conversation, please find the price proposal for design services below. Please review and return signed:",
    "projectDescription": "Brief description of the project and its goals",
    "timeline": [ ... same structure in English ... ],
    "totalPrice": "₪XX,XXX",
    "paymentSchedule": [ ... ],
    "projectStructure": [ ... ]
  }
}

RULES:
- Both "he" and "en" must be fully populated — do not leave any field empty.
- Use [contactName] as a placeholder in greeting when the contact name is not known.
- Be specific about deliverables and prices — don't use generic placeholders.
- For time_and_materials / monthly_retainer: totalPrice should reflect the hourly rate or monthly fee, not a vague estimate.
- For refinements: if refinementInstructions and currentContentJson are provided, update only the relevant sections while keeping the rest.
- Return ONLY the JSON object — no markdown, no explanation, no wrapper.`;

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
    bp.content_json AS "contentJson",
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
            content_json = NULL,
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

  async updateContent(id: string, contentJson: ContentJson) {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid business proposal id');
    }

    const row = await this.findOneRow(id);
    if (!row) {
      throw new NotFoundException('Business proposal not found');
    }
    if (row.status !== 'completed') {
      throw new BadRequestException('Only completed proposals can have their content edited');
    }

    const customer = await this.loadCustomerInfo(row.customerId);
    const dateStr = this.formatDate(row.createdAt);
    const englishHtml = buildProposalHtml({ contentJson, customer, dateStr, lang: 'en' });
    const hebrewHtml = buildProposalHtml({ contentJson, customer, dateStr, lang: 'he' });

    await pool.query(
      `
        UPDATE business_proposals
        SET content_json = $2::jsonb,
            english_html = $3,
            hebrew_html  = $4
        WHERE id = $1
      `,
      [id, JSON.stringify(contentJson), englishHtml, hebrewHtml],
    );

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

  async generatePdfBuffer(id: string): Promise<Buffer> {
    if (!this.isUuid(id)) {
      throw new BadRequestException('Invalid business proposal id');
    }

    const row = await this.findOneRow(id);
    if (!row) {
      throw new NotFoundException('Business proposal not found');
    }
    if (row.status !== 'completed' || !row.contentJson) {
      throw new BadRequestException('Proposal is not yet completed or has no content');
    }

    const customer = await this.loadCustomerInfo(row.customerId);
    const dateStr = this.formatDate(row.createdAt);
    const html = buildBilingualPdf({ contentJson: row.contentJson, customer, dateStr });
    return htmlToPdfBuffer(html);
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
      const customer = await this.loadCustomerInfo(proposal.customerId);

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
        if (!proposal.contentJson) {
          throw new BadRequestException('Proposal content is missing and cannot be refined');
        }
        generationInput.refinementInstructions = refinementText;
        generationInput.currentContentJson = proposal.contentJson;
      }

      const llmResult = await this.callGroq(generationInput, customer);
      const dateStr = this.formatDate(proposal.createdAt);

      const englishHtml = buildProposalHtml({ contentJson: llmResult.contentJson, customer, dateStr, lang: 'en' });
      const hebrewHtml = buildProposalHtml({ contentJson: llmResult.contentJson, customer, dateStr, lang: 'he' });

      await pool.query(
        `
          UPDATE business_proposals
          SET status = 'completed',
              content_json = $2::jsonb,
              english_html = $3,
              hebrew_html = $4,
              context_snapshot = $5::jsonb,
              llm_model = $6,
              llm_response = $7::jsonb,
              generation_error = NULL,
              completed_at = now()
          WHERE id = $1
        `,
        [
          id,
          JSON.stringify(llmResult.contentJson),
          englishHtml,
          hebrewHtml,
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
            LEFT(COALESCE(content_json->>'he', ''), 400) AS "heSnippet",
            LEFT(COALESCE(content_json->>'en', ''), 400) AS "enSnippet"
          FROM business_proposals
          WHERE customer_id = $1
            AND status = 'completed'
            AND id != $2
          ORDER BY created_at DESC
          LIMIT 3
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

  private async loadCustomerInfo(customerId: string): Promise<CustomerInfo> {
    const [customerRes, contactRes] = await Promise.all([
      pool.query('SELECT name FROM customers WHERE id = $1', [customerId]),
      pool.query(
        'SELECT email, phone, address FROM contacts WHERE customer_id = $1 ORDER BY created_at LIMIT 1',
        [customerId],
      ),
    ]);

    const customer = customerRes.rows[0] as { name: string } | undefined;
    const contact = contactRes.rows[0] as { email?: string; phone?: string; address?: string } | undefined;

    return {
      businessName: customer?.name ?? 'Unknown',
      email: contact?.email ?? undefined,
      phone: contact?.phone ?? undefined,
      address: contact?.address ?? undefined,
    };
  }

  private async callGroq(payload: GenerationInput, customer: CustomerInfo) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing');
    }

    const preferredModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const candidates = Array.from(
      new Set([preferredModel, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']),
    );

    let lastError = 'Unknown Groq error';
    for (const model of candidates) {
      try {
        const rawResponse = await this.requestGroqCompletion(apiKey, model, payload, customer);
        const content = this.extractAssistantContent(rawResponse);
        const contentJson = this.parseContentJson(content);

        return { model, contentJson, rawResponse };
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
    payload: GenerationInput,
    customer: CustomerInfo,
  ) {
    const userMessage = `Generate a business proposal for Sivi-Design with the following details:

Customer: ${customer.businessName}
${customer.contactName ? `Contact: ${customer.contactName}` : ''}
${customer.email ? `Email: ${customer.email}` : ''}

Business Requirement: ${payload.businessRequirement}

Pricing Model: ${PRICING_MODEL_LABELS[payload.pricingModel]}
${payload.estimatedHours ? `Estimated Hours: ${payload.estimatedHours}` : ''}
${payload.hourlyRate ? `Hourly Rate: ${payload.hourlyRate} ${payload.currency}` : ''}
Currency: ${payload.currency}
Payment Distribution Preference: ${payload.paymentDistribution}

Customer Context:
- Existing contracts: ${payload.context.contracts.length} (${payload.context.contracts.map(c => c.type).join(', ') || 'none'})
- Billing history: ${payload.context.billingSummary.paidTotal} ${payload.currency} paid across ${payload.context.billingSummary.paidInvoices} invoices
- Active tasks: ${payload.context.taskSummary.activeTasks}
${payload.context.previousProposals.length ? `- Previous proposals: ${payload.context.previousProposals.length} (pricing model: ${payload.context.previousProposals[0]?.pricingModel})` : ''}
${payload.refinementInstructions ? `\nRefinement instructions: ${payload.refinementInstructions}\n\nCurrent content JSON to refine:\n${JSON.stringify(payload.currentContentJson, null, 2)}` : ''}

Return only the JSON object as specified in the system prompt.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
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

  private parseContentJson(content: string): ContentJson {
    const trimmed = content.trim();
    const jsonCandidate = trimmed.startsWith('```')
      ? trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
      : trimmed;

    try {
      const parsed = JSON.parse(jsonCandidate) as ContentJson;
      if (!parsed.he || !parsed.en) {
        throw new Error('Content JSON missing "he" or "en" key');
      }
      return parsed;
    } catch {
      throw new Error('Unable to parse structured content JSON from Groq response');
    }
  }

  private mapRow(row: ProposalRow, withContent: boolean) {
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
      contentJson: withContent ? row.contentJson : undefined,
      contextSnapshot: withContent ? row.contextSnapshot : undefined,
      llmModel: withContent ? row.llmModel : undefined,
      llmResponse: withContent ? row.llmResponse : undefined,
      englishHtml: withContent ? row.englishHtml : undefined,
      hebrewHtml: withContent ? row.hebrewHtml : undefined,
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

  private formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message.slice(0, 2000);
    }
    return 'Unknown proposal generation error';
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }
}
