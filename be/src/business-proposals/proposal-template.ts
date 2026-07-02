import { SIDEBAR_IMG, FOOTER_IMG, SIGNATURE_IMG } from './proposal-assets';

export interface ProposalTimelinePhase {
  phase: string;
  duration: string;
  tasks: string[];
}

export interface ProposalPaymentItem {
  label: string;
  amount: string;
  condition: string;
}

export interface ProposalDeliverable {
  item: string;
  price?: string;
}

export interface ProposalStructureSection {
  name: string;
  description?: string;
  deliverables: ProposalDeliverable[];
}

export interface ProposalContent {
  greeting: string;
  intro: string;
  projectDescription: string;
  timeline: ProposalTimelinePhase[];
  totalPrice: string;
  paymentSchedule: ProposalPaymentItem[];
  projectStructure: ProposalStructureSection[];
}

export interface ContentJson {
  he: ProposalContent;
  en: ProposalContent;
}

export interface CustomerInfo {
  businessName: string;
  registrationNumber?: string;
  address?: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

// ─── Fixed terms (identical across all proposals) ────────────────────────────

const FIXED = {
  he: {
    notes: [
      'לכל עבודה יוגשו עד 2 סקיצות + 3 סבבי תיקונים. לאחר מכן כל תיקון ידרש בתשלום נוסף.',
      'עבור עבודה שהוכנה ובוטלה בסקיצה, ישולמו 50% ממחירה הנקוב.',
      'המחירים ללא מע"מ. כ"עוסק פטור" אינני מוציאה חשבונית מס. לכן לפני כל תשלום תישלח דרישה לתשלום – חשבון עסקה עם סיכום העבודה ולאחר קבלת התשלום – תונפק קבלה כנגד.',
      'בתום העבודה ולאחר אישור תשלום על ידי הלקוחה, יועברו קבצים פתוחים – לפני ביצוע הדפסות ולפני העברת קבצים.',
      'אין להעביר הצעת מחיר/חוזה זה לצד ג׳ ואין לחשוף את הפרטים הנ"ל ללא אישור מראש ובכתב מסיון דרמון פריצקר.',
    ],
    rights: [
      { label: 'זכויות יוצרים', text: 'מוסכם כי המעצבת אינה מוותרת על זכויותיה הרוחניות וקניינה הפרטי בשום פרק במהלך הפרויקט.' },
      { label: 'זכויות שימוש', text: 'מוסכם כי זכויות השימוש הבלעדיות על היצירות ותוצרי העיצוב שייכות ללקוחה.' },
      { label: 'זכויות מוצרי גלם', text: 'מוסכם כי האחריות הבלעדית לכל דיני הזכויות על חומרי הגלם שהלקוחה מספקת מוטלת על הלקוחה, ואין לראות בהם כמעצבת מולם כלפי צד שלישי.' },
    ],
    additional: [
      { label: 'תהליך העבודה', text: 'בכלל, התקשורת המחייבת בין הלקוחה למעצבת תבוצע בכתב, בואטסאפ או בדוא"ל. שינוי משמעותי של עיצוב לאחר שכבר אושר, או עדכון חומרים לאחר שליחתם, עלול לגרור תשלום נוסף לפי תעריף ועל פי תנאי ושנות מספורות למעלה.' },
      { label: 'הפסקת התקשרות', text: 'שני הצדדים מחזיקים בזכות להפסיק את ההתקשרות בזכות בכל עת, הודעה מוקדמת. מצב כזה לא יזוכו תשלומים שבוצעו ולא יועברו קבצים ונכסים דיגיטליים ללקוחה. הפסקה של 20 יום במהלך הפרויקט, הפסקה אלא אם סוכם אחרת.' },
      { label: 'תחילת וסיום העבודה', text: 'העבודה תחל לאחר שליחת חוזה חתום ובמיצוי הסכום הראשון, ותסתיים בהעברת הקבצים לידי הלקוחה תמורת תשלום האחרון. שני הצדדים מודעים ללוח הזמנים המתוכנן ולמשימות הנדרשות ומתחייבים לעשות את שביכולתם לעמוד בהם בהצלחה.' },
      { label: 'פרסום היצירה', text: 'המעצבת שומרת לעצמה את הזכות לפרסם את היצירות ותוצרי היצירה ותוצרין ותוצרי הלוואי שלהן בתיק העבודות, באתר, ברשתות החברתיות ובכל פלטפורמה שתמצא לנכון, באופן שלא מזיק ללקוחה במישרין ובגבולות הסבירות, כנהוג.' },
      { label: 'קרדיט', text: 'המעצבת שומרת לעצמה את הזכות לציין קרדיט בגוף היצירות. באופן שלא יפגע בגוף היצירות ובנראות העבודה ולא מזיק ללקוחה במישרין ובגבולות הסבירות. כנהוג. במקרה של אתר אינטרנט, הקרדיט יכול להיות מלווה לבקשות.' },
      { label: 'תוקף החוזה', text: 'חוזה זה, כל עוד לא החזיר הלקוחה למעצבת, תקף לחודש לאחר שליחתו ללקוחה.' },
    ],
    sigNote: 'ניתן להחזיר מייל עם אישור ותופס זה מצורף',
    designer: 'סיון דרמון פריצקר',
  },
  en: {
    notes: [
      'Every deliverable includes up to 2 full revision rounds + 3 sub-revisions per item. Additional revisions are billed at the hourly rate.',
      'A cancelled sketch/draft after production is billed at 50% of the quoted price.',
      'Prices do not include VAT (exempt freelancer). A payment request is issued before payment; a receipt is issued upon receipt of payment.',
      'Final open files are transferred to the client after all payments are received and prior to printing or file handoff.',
      'This proposal/contract may not be transferred to a third party without prior written consent signed by Sivan Darmon Pritsker.',
    ],
    rights: [
      { label: 'Creator Rights', text: 'The designer retains all moral and personal rights to the work throughout the project.' },
      { label: 'Usage Rights', text: 'Exclusive usage rights to the designs and creative outputs belong to the client, as agreed.' },
      { label: 'Raw Materials Rights', text: 'Full responsibility for the rights to any raw materials supplied by the client lies solely with the client.' },
    ],
    additional: [
      { label: 'Work Process', text: 'All binding communication between client and designer takes place in writing (WhatsApp or email). Significant changes to already-approved designs, or supplying updated materials after delivery, may incur additional charges at the hourly rate.' },
      { label: 'Termination', text: 'Either party may terminate the engagement with advance written notice. Payments already made are non-refundable, and no digital files or assets will be transferred. A 20-day pause clause applies as separately agreed.' },
      { label: 'Work Start & End', text: 'Work begins after a signed contract and advance payment are received, and ends upon delivery of final files following receipt of the last payment. Both parties commit to meeting the agreed schedule.' },
      { label: 'Publication', text: 'The designer reserves the right to publish the work in a portfolio, website, social media, and any relevant platform, in a manner that does not harm the client and is within reasonable boundaries.' },
      { label: 'Credit', text: 'The designer reserves the right to include a credit notice within the work. For websites, a credit link may accompany the request.' },
      { label: 'Contract Validity', text: 'This contract is valid for one month from the date it was sent to the client.' },
    ],
    sigNote: 'You may reply by email with approval and attach this document.',
    designer: 'Sivan Darmon Pritsker',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function e(s: string | undefined): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const ACCENT = '#f04e63';

// Right gutter reserved for pink field-labels / notes. Body + section headings
// are inset from the start edge by GUTTER so they align at the values' edge,
// while the pink keys sit in the gutter, flush to the outer margin.
const GUTTER = '34mm';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Heebo:wght@400;500;700&display=swap');

@page { size: A4; margin: 0; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/*
 * Latin renders in Montserrat; Hebrew glyphs (absent in Montserrat) fall
 * through per-glyph to FB Pilot when the brand font is installed, otherwise to
 * Heebo. Drop FbPilot .ttf/.otf on the system (or embed via @font-face) to
 * render Hebrew in the exact brand font.
 */
body {
  font-family: 'Montserrat', 'FB Pilot', 'FbPilot', 'Heebo', 'Arial Hebrew', Arial, sans-serif;
  font-size: 9.5pt;
  color: #111;
  background: #fff;
}

/* ── Page: fixed A4, brand chrome positioned absolutely ── */
.page {
  position: relative;
  width: 210mm;
  height: 297mm;
  overflow: hidden;
  page-break-after: always;
}
.sb { position: absolute; top: 0; left: 0; width: 32mm; height: auto; }
.ft { position: absolute; bottom: 4.5mm; left: 9mm; width: 52mm; height: auto; }

.main {
  margin-left: 32mm;
  height: 297mm;
  padding: 18mm 22mm 24mm 4mm;
}

/* ── Header block (aligns to outer margin) ── */
.hdr-date { font-size: 9pt; color: #444; margin-bottom: 6mm; text-align: end; }
.subject { font-size: 14pt; font-weight: 700; text-align: start; margin-bottom: 4mm; line-height: 1.35; }
.greeting { font-size: 10.5pt; text-align: start; margin-bottom: 1mm; }
.intro { font-size: 9.5pt; color: #222; text-align: start; line-height: 1.6; margin-bottom: 7mm; }

/* ── Sections ── */
.sec { margin-bottom: 6mm; }
.sec-head {
  color: ${ACCENT}; font-weight: 700; font-size: 13pt;
  text-align: start; margin-bottom: 2.5mm;
}
.sec-body {
  text-align: start;
  font-size: 9.5pt; line-height: 1.6; color: #222;
}
/*
 * The pink field-labels sit in a gutter on the reading-start side. In RTL that
 * gutter is on the right, so headings/body are inset to align at the values'
 * edge. In LTR the labels form the left column, so headings/body stay flush to
 * the outer margin (no inset) — otherwise the whole content column looks
 * indented and unaligned.
 */
[dir="rtl"] .sec-head,
[dir="rtl"] .sec-body,
[dir="rtl"] .notes { padding-inline-start: ${GUTTER}; }

/* ── Key / value rows (pink key in gutter, value inset) ── */
.kv { display: flex; gap: 4mm; margin-bottom: 0.6mm; align-items: flex-start; }
.k { color: ${ACCENT}; width: 30mm; flex-shrink: 0; text-align: start; white-space: nowrap; font-size: 9.5pt; line-height: 1.45; }
.v { flex: 1; text-align: start; font-size: 9.5pt; line-height: 1.45; color: #111; }
.kv-gap { height: 3mm; }
/* Keys align on the edge next to the values (left in RTL), matching the
 * reference — left edges flush; longer labels run toward the outer margin
 * (nowrap keeps them on one line instead of wrapping and breaking alignment). */
[dir="rtl"] .k { text-align: end; }

/* ── Timeline phases ── */
.phase { margin-bottom: 2.5mm; }
.phase-h { font-size: 9.5pt; line-height: 1.5; }
.phase-h b { font-weight: 700; }
.phase-tasks { margin-top: 0.3mm; text-align: start; }
.phase-tasks div { line-height: 1.6; font-size: 9pt; }

/* ── Project structure ── */
.struct { margin-bottom: 3mm; }
.struct-name { font-weight: 700; font-size: 10pt; margin-bottom: 0.8mm; }
.struct-desc { font-size: 9pt; color: #333; margin-bottom: 1mm; line-height: 1.5; }
.deliv { font-size: 9pt; line-height: 1.7; text-align: start; }

/* ── Notes (bullet list; inset handled by the [dir=rtl] rule above) ── */
.notes .n { position: relative; padding-inline-start: 4mm; margin-bottom: 0.6mm; font-size: 9pt; line-height: 1.5; text-align: start; }
.notes .n::before { content: '•'; position: absolute; inset-inline-start: 0; color: #111; }

/* ── Signature ── */
.sig-head { text-align: center; color: ${ACCENT}; font-weight: 700; font-size: 13pt; margin: 12mm 0 20mm; }
/* Top-align both blocks so the two signature lines sit at the same height;
 * names hang directly below each line, the client's note further below. */
.sig-row { display: flex; justify-content: space-between; gap: 16mm; align-items: flex-start; }
.sig-b { flex: 1; text-align: center; position: relative; }
/* Transparent PNG drawn over the continuous line (line stays visible under it). */
.sig-scribble { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 46mm; margin-bottom: -2mm; }
.sig-line { border-top: 1px solid #111; padding-top: 1.5mm; font-size: 9pt; }
.sig-sub { font-size: 8pt; color: #555; margin-top: 1mm; line-height: 1.4; }

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { page-break-after: always; }
}
`;

// ─── Page builder ─────────────────────────────────────────────────────────────

function page(inner: string, dir: 'rtl' | 'ltr'): string {
  return `
<div class="page">
  <img class="sb" src="${SIDEBAR_IMG}" alt="">
  <div class="main" dir="${dir}">${inner}</div>
  <img class="ft" src="${FOOTER_IMG}" alt="">
</div>`;
}

// ─── Dynamic content pages ────────────────────────────────────────────────────

function dynamicPages(c: ProposalContent, cust: CustomerInfo, dateStr: string, lang: 'he' | 'en'): string {
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const isHe = lang === 'he';

  const L = isHe ? {
    subject: `הנדון: הצעת מחיר וחוזה עבודה – ${e(cust.businessName)}`,
    clientTitle: 'פרטי הלקוח',
    lBusinessName: 'שם העסק', lReg: 'ח.פ.', lAddress: 'כתובת',
    lContact: 'איש קשר', lPhone: 'טלפון', lEmail: 'דוא"ל',
    projectTitle: 'תיאור הפרויקט',
    timelineTitle: 'לוח זמנים',
    payTitle: 'תשלום', priceLabel: 'מחיר הפרויקט', schedLabel: 'חלוקה לתשלומים',
    rateLabel: 'מחיר שעת עבודה נוספת', addRateLabel: 'מחיר לשעה בבנק שעות',
    approvalLabel: 'תנאי לשעות נוספות',
    approval: 'אישור הלקוחה לפני ביצוע + דיווח יומי במסמך משותף און ליין',
    structTitle: 'מבנה הפרויקט',
  } : {
    subject: `Re: Price Proposal & Work Contract – ${e(cust.businessName)}`,
    clientTitle: 'Client Details',
    lBusinessName: 'Business Name', lReg: 'Reg. No.', lAddress: 'Address',
    lContact: 'Contact', lPhone: 'Phone', lEmail: 'Email',
    projectTitle: 'Project Description',
    timelineTitle: 'Timeline',
    payTitle: 'Payment', priceLabel: 'Project Price', schedLabel: 'Payment Schedule',
    rateLabel: 'Additional Hour Rate', addRateLabel: 'Hour-Bank Rate',
    approvalLabel: 'Extra Hours Terms',
    approval: 'Client approval before production + daily updates in a shared online document',
    structTitle: 'Project Structure',
  };

  // Timeline phases
  const phasesHtml = c.timeline.map(ph => `
    <div class="phase">
      <div class="phase-h"><b>${e(ph.phase)}</b>${ph.duration ? ` – ${e(ph.duration)}` : ''}</div>
      <div class="phase-tasks">${ph.tasks.map(t => `<div>${e(t)}</div>`).join('')}</div>
    </div>`).join('');

  // Payment breakdown lines (under "payment split")
  const payLines = c.paymentSchedule.map(p => {
    const parts = [p.label, p.amount, p.condition].filter(Boolean).map(e);
    return `<div>${parts.join(' – ')}</div>`;
  }).join('');

  // Structure sections — deliverables flow inline as "item – price"
  const structHtml = c.projectStructure.map((s, i) => `
    <div class="struct">
      <div class="struct-name">${i + 1}. ${e(s.name)}</div>
      ${s.description ? `<div class="struct-desc">${e(s.description)}</div>` : ''}
      ${s.deliverables.map(d => `
        <div class="deliv">${e(d.item)}${d.price ? ` – ${e(d.price)}` : ''}</div>`).join('')}
    </div>`).join('');

  // Client details key/value rows
  const detRows = [
    { l: L.lBusinessName, v: cust.businessName },
    { l: L.lReg, v: cust.registrationNumber },
    { l: L.lAddress, v: cust.address },
    { l: L.lContact, v: cust.contactName },
    { l: L.lPhone, v: cust.phone },
    { l: L.lEmail, v: cust.email },
  ].filter(r => r.v).map(r => `
    <div class="kv"><span class="k">${r.l}</span><span class="v">${e(r.v)}</span></div>`).join('');

  const p1 = page(`
    <div class="hdr-date">${e(dateStr)}</div>
    <div class="subject">${L.subject}</div>
    <div class="greeting">${e(c.greeting)}</div>
    <div class="intro">${e(c.intro)}</div>

    <div class="sec">
      <div class="sec-head">${L.clientTitle}</div>
      ${detRows}
    </div>

    <div class="sec">
      <div class="sec-head">${L.projectTitle}</div>
      <div class="sec-body">${e(c.projectDescription)}</div>
    </div>

    <div class="sec">
      <div class="sec-head">${L.timelineTitle}</div>
      <div class="sec-body">${phasesHtml}</div>
    </div>
  `, dir);

  const p2 = page(`
    <div class="sec">
      <div class="sec-head">${L.payTitle}</div>
      <div class="kv"><span class="k">${L.priceLabel}</span><span class="v">${e(c.totalPrice)}</span></div>
      <div class="kv"><span class="k">${L.schedLabel}</span><span class="v">${payLines}</span></div>
      <div class="kv-gap"></div>
      <div class="kv"><span class="k">${L.rateLabel}</span><span class="v">250 ₪</span></div>
      <div class="kv"><span class="k">${L.addRateLabel}</span><span class="v">230 ₪</span></div>
      <div class="kv"><span class="k">${L.approvalLabel}</span><span class="v">${L.approval}</span></div>
    </div>

    <div class="sec">
      <div class="sec-head">${L.structTitle}</div>
      <div class="sec-body">${structHtml}</div>
    </div>
  `, dir);

  return p1 + p2;
}

// ─── Fixed terms page ─────────────────────────────────────────────────────────

function termsPage(lang: 'he' | 'en', clientName: string): string {
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const F = FIXED[lang];

  const notesHtml = F.notes.map(n => `<div class="n">${e(n)}</div>`).join('');
  const rightsHtml = F.rights.map(r => `
    <div class="kv"><span class="k">${e(r.label)}</span><span class="v">${e(r.text)}</span></div>`).join('');
  const addHtml = F.additional.map(a => `
    <div class="kv"><span class="k">${e(a.label)}</span><span class="v">${e(a.text)}</span></div>`).join('');

  const notesTitle = lang === 'he' ? 'הערות' : 'Notes';
  const rightsTitle = lang === 'he' ? 'זכויות' : 'Rights';
  const addTitle = lang === 'he' ? 'פרטים נוספים' : 'Additional Details';
  const sigTitle = lang === 'he' ? 'חתימה ומתחילים :)' : "Let's Sign and Begin :)";

  return page(`
    <div class="sec">
      <div class="sec-head">${notesTitle}</div>
      <div class="notes">${notesHtml}</div>
    </div>

    <div class="sec">
      <div class="sec-head">${rightsTitle}</div>
      ${rightsHtml}
    </div>

    <div class="sec">
      <div class="sec-head">${addTitle}</div>
      ${addHtml}
    </div>

    <div class="sig-head">${sigTitle}</div>
    <div class="sig-row">
      <div class="sig-b">
        <img class="sig-scribble" src="${SIGNATURE_IMG}" alt="">
        <div class="sig-line">${e(F.designer)}</div>
      </div>
      <div class="sig-b">
        <div class="sig-line">${e(clientName)}</div>
        <div class="sig-sub">${e(F.sigNote)}</div>
      </div>
    </div>
  `, dir);
}

// ─── Public API ───────────────────────────────────────────────────────────────

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${CSS}</style>
</head>
<body>${body}</body>
</html>`;
}

export function buildProposalHtml(params: {
  contentJson: ContentJson;
  customer: CustomerInfo;
  dateStr: string;
  lang: 'he' | 'en';
}): string {
  const { contentJson, customer, dateStr, lang } = params;
  const clientName = customer.contactName || customer.businessName;
  return wrapHtml(
    dynamicPages(contentJson[lang], customer, dateStr, lang) +
    termsPage(lang, clientName),
  );
}

export function buildBilingualPdf(params: {
  contentJson: ContentJson;
  customer: CustomerInfo;
  dateStr: string;
}): string {
  const { contentJson, customer, dateStr } = params;
  const clientName = customer.contactName || customer.businessName;
  return wrapHtml(
    dynamicPages(contentJson.he, customer, dateStr, 'he') +
    termsPage('he', clientName) +
    dynamicPages(contentJson.en, customer, dateStr, 'en') +
    termsPage('en', clientName),
  );
}

export { formatDate };
