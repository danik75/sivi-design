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

const ACCENT = '#c8365a';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@400;700&display=swap');

@page { size: A4; margin: 0; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Montserrat', Arial, sans-serif;
  font-size: 9.5pt;
  color: #1a1a1a;
  background: #fff;
}

/* ── Page wrapper ── */
.page {
  width: 210mm;
  min-height: 297mm;
  display: flex;
  page-break-after: always;
}

/* ── Left sidebar ── */
.sidebar {
  width: 20mm;
  min-height: 297mm;
  border-right: 0.75px solid #bbb;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10mm 0 8mm;
  flex-shrink: 0;
}

.logo-text {
  font-family: 'Great Vibes', cursive;
  font-size: 20pt;
  color: #1a1a1a;
  writing-mode: vertical-lr;
  letter-spacing: 2px;
  line-height: 1;
}

.logo-divider {
  width: 55%;
  height: 0.75px;
  background: #bbb;
  margin: 5mm 0;
}

.services {
  font-size: 5pt;
  color: #666;
  writing-mode: vertical-lr;
  letter-spacing: 3px;
  text-align: center;
  flex: 1;
}

/* ── Content column (main + footer stacked) ── */
.content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 297mm;
}

/* ── Main content area ── */
.main {
  flex: 1;
  padding: 8mm 13mm 5mm 11mm;
}

/* ── Footer ── */
.page-footer {
  padding: 3mm 0 6mm 11mm;
  font-size: 7.5pt;
  color: #444;
  line-height: 1.6;
}

/* ── Typography ── */
.date { font-size: 8.5pt; color: #777; margin-bottom: 3.5mm; }
.subject {
  font-size: 13pt;
  font-weight: bold;
  margin-bottom: 4mm;
  line-height: 1.3;
}
.greeting { font-size: 10pt; margin-bottom: 1.5mm; }
.intro { font-size: 9pt; color: #444; line-height: 1.6; margin-bottom: 5mm; }

/* ── Sections ── */
.section { margin-bottom: 5mm; }
.sec-title {
  font-size: 10.5pt;
  font-weight: bold;
  color: ${ACCENT};
  margin-bottom: 2.5mm;
}

/* ── Client details ── */
.details-table { width: 100%; border-collapse: collapse; }
.details-table td { padding: 0.8mm 0; vertical-align: top; font-size: 9pt; }
.det-label { color: ${ACCENT}; font-size: 8.5pt; white-space: nowrap; width: 25mm; }
.det-value { color: #1a1a1a; }
/* RTL: label on right */
[dir="rtl"] .det-label { text-align: right; padding-right: 0; padding-left: 4mm; }
[dir="rtl"] .det-value { text-align: right; }
[dir="ltr"] .det-label { text-align: left; padding-right: 4mm; }

/* ── Timeline ── */
.phase { margin-bottom: 3mm; }
.phase-header { font-size: 9.5pt; font-weight: normal; }
.phase-header strong { font-weight: bold; }
.phase-dur { color: #555; }
.phase-tasks {
  margin-top: 1mm;
  font-size: 8.5pt;
  color: #444;
  line-height: 1.7;
}
[dir="rtl"] .phase-tasks { padding-right: 5mm; }
[dir="ltr"] .phase-tasks { padding-left: 5mm; }
.phase-tasks li { list-style: disc; }

/* ── Payment ── */
.pay-price-row { display: flex; align-items: baseline; gap: 5mm; margin-bottom: 2mm; }
[dir="rtl"] .pay-price-row { flex-direction: row-reverse; justify-content: flex-end; }
.pay-price-label { color: ${ACCENT}; font-size: 8.5pt; }
.pay-price-val { font-size: 12pt; font-weight: bold; }

.pay-schedule-title { color: ${ACCENT}; font-size: 8.5pt; font-weight: bold; margin-bottom: 1.5mm; }

.pay-row { display: flex; align-items: flex-start; gap: 3mm; margin-bottom: 1.5mm; font-size: 8.5pt; }
[dir="rtl"] .pay-row { flex-direction: row-reverse; }
.pay-label { color: ${ACCENT}; min-width: 18mm; flex-shrink: 0; }
.pay-amount { font-weight: bold; white-space: nowrap; min-width: 16mm; flex-shrink: 0; }
.pay-cond { color: #555; }

.rate-row { font-size: 7.5pt; color: #666; margin-top: 2mm; }
.rate-row span { color: #1a1a1a; font-weight: bold; }

/* ── Project structure ── */
.struct-item { margin-bottom: 4mm; }
.struct-name { font-weight: bold; font-size: 10pt; margin-bottom: 0.5mm; }
.struct-desc { font-size: 8.5pt; color: #555; margin-bottom: 1.5mm; }
.struct-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
.struct-table td { padding: 0.6mm 0; }
.s-item { color: #333; }
.s-price { white-space: nowrap; color: #555; }
[dir="rtl"] .s-price { text-align: left; }
[dir="ltr"] .s-price { text-align: right; }

/* ── Notes ── */
.notes-list { font-size: 8.5pt; line-height: 1.65; color: #333; }
[dir="rtl"] .notes-list { padding-right: 4mm; }
[dir="ltr"] .notes-list { padding-left: 4mm; }
.notes-list li { list-style: disc; margin-bottom: 1mm; }

/* ── Rights ── */
.rights-row { display: flex; align-items: flex-start; gap: 3mm; margin-bottom: 2mm; }
[dir="rtl"] .rights-row { flex-direction: row-reverse; }
.r-label { color: ${ACCENT}; font-size: 8.5pt; min-width: 28mm; flex-shrink: 0; }
.r-text { font-size: 8.5pt; color: #333; line-height: 1.55; }

/* ── Additional details ── */
.add-row { display: flex; align-items: flex-start; gap: 3mm; margin-bottom: 2mm; }
[dir="rtl"] .add-row { flex-direction: row-reverse; }
.a-label { color: ${ACCENT}; font-size: 8.5pt; font-weight: bold; min-width: 28mm; flex-shrink: 0; }
.a-text { font-size: 8.5pt; color: #333; line-height: 1.55; }

/* ── Signature ── */
.sig-heading {
  text-align: center;
  font-size: 12pt;
  font-weight: bold;
  color: ${ACCENT};
  margin-bottom: 2mm;
  margin-top: 4mm;
}
.sig-note { text-align: center; font-size: 8pt; color: #666; margin-bottom: 10mm; }
.sig-blocks { display: flex; justify-content: space-between; gap: 20mm; margin-top: 2mm; }
.sig-block { flex: 1; text-align: center; }
.sig-line { border-bottom: 1px solid #1a1a1a; height: 14mm; margin-bottom: 2mm; }
.sig-name { font-size: 8.5pt; font-weight: bold; }
.sig-sub { font-size: 8pt; color: #666; }

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { page-break-after: always; }
}
`;

// ─── Sidebar (shared) ─────────────────────────────────────────────────────────

const SIDEBAR = `
<div class="sidebar">
  <div class="logo-text">Sivi-Design</div>
  <div class="logo-divider"></div>
  <div class="services">AI &nbsp;·&nbsp; Design &nbsp;·&nbsp; Creative &nbsp;·&nbsp; Marketing &nbsp;·&nbsp; Digital &nbsp;·&nbsp; UX/UI &nbsp;·&nbsp; Web &nbsp;·&nbsp; Illustration</div>
</div>`;

const PAGE_FOOTER = `
<div class="page-footer">
  052-6613709<br>sivandarmon@gmail.com<br>sivi-design.com
</div>`;

// ─── Page builder ─────────────────────────────────────────────────────────────

function page(inner: string, dir: 'rtl' | 'ltr'): string {
  return `
<div class="page">
  ${SIDEBAR}
  <div class="content-col">
    <div class="main" dir="${dir}">${inner}</div>
    ${PAGE_FOOTER}
  </div>
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
    rateLabel: 'מחיר שעת עבודה נוספת', addRateLabel: 'מחיר לשעות נוספות',
    approval: 'אישור הלקוחה לפני ביצוע ובמסמך משותף אין ליין',
    structTitle: 'מבנה הפרויקט',
  } : {
    subject: `Re: Price Proposal & Work Contract – ${e(cust.businessName)}`,
    clientTitle: 'Client Details',
    lBusinessName: 'Business Name', lReg: 'Reg. No.', lAddress: 'Address',
    lContact: 'Contact', lPhone: 'Phone', lEmail: 'Email',
    projectTitle: 'Project Description',
    timelineTitle: 'Timeline',
    payTitle: 'Payment', priceLabel: 'Project Price', schedLabel: 'Payment Schedule',
    rateLabel: 'Additional Hours Rate', addRateLabel: 'Extra Hours Rate',
    approval: 'Client approval required via shared online document before production',
    structTitle: 'Project Structure',
  };

  // Timeline phases
  const phasesHtml = c.timeline.map(ph => `
    <div class="phase">
      <div class="phase-header"><strong>${e(ph.phase)}</strong> <span class="phase-dur">– ${e(ph.duration)}</span></div>
      <ul class="phase-tasks">${ph.tasks.map(t => `<li>${e(t)}</li>`).join('')}</ul>
    </div>`).join('');

  // Payment rows
  const payRows = c.paymentSchedule.map(p => `
    <div class="pay-row">
      <span class="pay-label">${e(p.label)}</span>
      <span class="pay-amount">${e(p.amount)}</span>
      <span class="pay-cond">${e(p.condition)}</span>
    </div>`).join('');

  // Structure sections
  const structHtml = c.projectStructure.map(s => `
    <div class="struct-item">
      <div class="struct-name">${e(s.name)}</div>
      ${s.description ? `<div class="struct-desc">${e(s.description)}</div>` : ''}
      <table class="struct-table">
        ${s.deliverables.map(d => `
        <tr>
          <td class="s-item">${e(d.item)}</td>
          <td class="s-price">${e(d.price ?? '')}</td>
        </tr>`).join('')}
      </table>
    </div>`).join('');

  // Client details rows
  const detRows = [
    { l: L.lBusinessName, v: cust.businessName },
    { l: L.lReg, v: cust.registrationNumber },
    { l: L.lAddress, v: cust.address },
    { l: L.lContact, v: cust.contactName },
    { l: L.lPhone, v: cust.phone },
    { l: L.lEmail, v: cust.email },
  ].filter(r => r.v).map(r => `
    <tr>
      <td class="det-label">${r.l}</td>
      <td class="det-value">${e(r.v)}</td>
    </tr>`).join('');

  const p1 = page(`
    <div class="date">${e(dateStr)}</div>
    <div class="subject">${L.subject}</div>
    <div class="greeting">${e(c.greeting)}</div>
    <p class="intro">${e(c.intro)}</p>

    <div class="section">
      <div class="sec-title">${L.clientTitle}</div>
      <table class="details-table"><tbody>${detRows}</tbody></table>
    </div>

    <div class="section">
      <div class="sec-title">${L.projectTitle}</div>
      <p style="font-size:9.5pt;line-height:1.6;color:#333">${e(c.projectDescription)}</p>
    </div>

    <div class="section">
      <div class="sec-title">${L.timelineTitle}</div>
      ${phasesHtml}
    </div>
  `, dir);

  const p2 = page(`
    <div class="section">
      <div class="sec-title">${L.payTitle}</div>
      <div class="pay-price-row">
        <span class="pay-price-label">${L.priceLabel}</span>
        <span class="pay-price-val">${e(c.totalPrice)}</span>
      </div>
      <div class="pay-schedule-title">${L.schedLabel}</div>
      ${payRows}
      <div class="rate-row">${L.rateLabel} – <span>250 ₪</span> &nbsp;&nbsp; ${L.addRateLabel} – <span>230 ₪</span></div>
      <div class="rate-row" style="margin-top:1mm;color:#999">${L.approval}</div>
    </div>

    <div class="section">
      <div class="sec-title">${L.structTitle}</div>
      ${structHtml}
    </div>
  `, dir);

  return p1 + p2;
}

// ─── Fixed terms page ─────────────────────────────────────────────────────────

function termsPage(lang: 'he' | 'en', clientName: string): string {
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const F = FIXED[lang];

  const notesHtml = F.notes.map(n => `<li>${e(n)}</li>`).join('');
  const rightsHtml = F.rights.map(r => `
    <div class="rights-row">
      <span class="r-label">${e(r.label)}</span>
      <span class="r-text">${e(r.text)}</span>
    </div>`).join('');
  const addHtml = F.additional.map(a => `
    <div class="add-row">
      <span class="a-label">${e(a.label)}</span>
      <span class="a-text">${e(a.text)}</span>
    </div>`).join('');

  const notesTitle = lang === 'he' ? 'הערות' : 'Notes';
  const rightsTitle = lang === 'he' ? 'זכויות' : 'Rights';
  const addTitle = lang === 'he' ? 'פרטים נוספים' : 'Additional Details';
  const sigTitle = lang === 'he' ? 'חתימה ומתחילים :)' : "Let's Sign and Begin :)";

  return page(`
    <div class="section">
      <div class="sec-title">${notesTitle}</div>
      <ul class="notes-list">${notesHtml}</ul>
    </div>

    <div class="section">
      <div class="sec-title">${rightsTitle}</div>
      ${rightsHtml}
    </div>

    <div class="section">
      <div class="sec-title">${addTitle}</div>
      ${addHtml}
    </div>

    <div class="sig-heading">${sigTitle}</div>
    <p class="sig-note" dir="${dir}">${e(F.sigNote)}</p>
    <div class="sig-blocks">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${e(F.designer)}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${e(clientName)}</div>
        ${lang === 'he' ? `<div class="sig-sub">נתן להחזיר מייל עם אישור ותופס זה מצורף</div>` : ''}
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
