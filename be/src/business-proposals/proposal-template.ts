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

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="44" fill="#ffffff"/>
  <rect x="10" y="10" width="236" height="236" rx="34" fill="none" stroke="#dc2626" stroke-width="12"/>
  <text x="128" y="108" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="56" font-weight="900" letter-spacing="1.2" fill="#dc2626">Sivi</text>
  <text x="128" y="168" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="44" font-weight="900" letter-spacing="0.8" fill="#dc2626">Design</text>
</svg>`;

const SERVICES = 'AI · Design · Creative · Marketing · Digital · UX/UI · Web · Illustration';

const ACCENT = '#c8365a';
const FOOTER_TEXT = '052-6613709 &nbsp;&nbsp; sivandarmon@gmail.com &nbsp;&nbsp; sivi-design.com';

const FIXED_TERMS = {
  he: {
    notesTitle: 'הערות',
    notes: [
      'לכל עבודה יוגשו עד 2 סקיצות + 3 סבבי תיקונים. לאחר מכן כל תיקון ידרש בתשלום נוסף.',
      'עבור עבודה שהוכנה ובוטלה בסקיצה, ישולמו 50% ממחירה הנקוב.',
      'המחירים ללא מע"מ. כ"עוסק פטור" אינני מוציאה חשבונית מס. לכן לפני כל תשלום תישלח דרישה לתשלום – חשבון עסקה עם סיכום העבודה ולאחר קבלת התשלום – תונפק קבלה כנגד.',
      'בתום העבודה ולאחר אישור תשלום על ידי הלקוחה, יועברו קבצים פתוחים – לפני ביצוע הדפסות ולפני העברת קבצים.',
      'אין להעביר הצעת מחיר/חוזה זה לצד ג׳ ואין לחשוף את הפרטים הנ"ל ללא אישור מראש ובכתב מסיון דרמון פריצקר.',
    ],
    rightsTitle: 'זכויות',
    rights: [
      { label: 'זכויות יוצרים', text: 'מוסכם כי המעצבת אינה מוותרת על זכויותיה הרוחניות וקניינה הפרטי בשום פרק במהלך הפרויקט.' },
      { label: 'זכויות שימוש', text: 'מוסכם כי זכויות השימוש הבלעדיות על היצירות ותוצרי העיצוב שייכות ללקוחה.' },
      { label: 'זכויות מוצרי גלם', text: 'מוסכם כי האחריות הבלעדית לכל דיני הזכויות על חומרי הגלם שהלקוחה מספקת מוטלת על הלקוחה, ואין לראות בהם כמעצבת מולם כלפי צד שלישי.' },
    ],
    addTitle: 'פרטים נוספים',
    additional: [
      { label: 'תהליך העבודה', text: 'בכלל, התקשורת המחייבת בין הלקוחה למעצבת תבוצע בכתב, בואטסאפ או בדוא"ל. שינוי משמעותי של עיצוב לאחר שכבר אושר, או עדכון חומרים לאחר שליחתם, עלול לגרור תשלום נוסף לפי תעריף ועל פי תנאי ושנות מספורות למעלה.' },
      { label: 'הפסקת התקשרות', text: 'שני הצדדים מחזיקים בזכות להפסיק את ההתקשרות בזכות בכל עת, הודעה מוקדמת. מצב כזה לא יזוכו תשלומים שבוצעו ולא יועברו קבצים ונכסים דיגיטליים ללקוחה. הפסקה של 20 יום במהלך הפרויקט, הפסקה אלא אם סוכם אחרת.' },
      { label: 'תחילת וסיום העבודה', text: 'העבודה תחל לאחר שליחת חוזה חתום ובמיצוי הסכום הראשון, ותסתיים בהעברת הקבצים לידי הלקוחה תמורת תשלום האחרון. שני הצדדים מודעים ללוח הזמנים המתוכנן ולמשימות הנדרשות ומתחייבים לעשות את שביכולתם לעמוד בהם בהצלחה.' },
      { label: 'פרסום היצירה', text: 'המעצבת שומרת לעצמה את הזכות לפרסם את היצירות ותוצרי היצירה ותוצרין ותוצרי הלוואי שלהן בתיק העבודות, באתר, ברשתות החברתיות ובכל פלטפורמה שתמצא לנכון, באופן שלא מזיק ללקוחה במישרין ובגבולות הסבירות, כנהוג.' },
      { label: 'קרדיט', text: 'המעצבת שומרת לעצמה את הזכות לציין קרדיט בגוף היצירות. באופן שלא יפגע בגוף היצירות ובנראות העבודה ולא מזיק ללקוחה במישרין ובגבולות הסבירות. כנהוג. במקרה של אתר אינטרנט, הקרדיט יכול להיות מלווה לבקשות.' },
      { label: 'תוקף החוזה', text: 'חוזה זה, כל עוד לא החזיר הלקוחה למעצבת, תקף לחודש לאחר שליחתו ללקוחה.' },
    ],
    signatureTitle: 'חתימה ומתחילים :)',
    signatureNote: 'ניתן להחזיר מייל עם אישור ותופס זה מצורף',
    designerLabel: 'סיון דרמון פריצקר',
  },
  en: {
    notesTitle: 'Notes',
    notes: [
      'Every deliverable includes up to 2 full revision rounds + 3 sub-revisions per item. Additional revisions are billed at the hourly rate.',
      'A cancelled sketch/draft after production is billed at 50% of the quoted price.',
      'Prices do not include VAT (exempt freelancer). A payment request is issued before payment; a receipt is issued upon receipt of payment.',
      'Final open files are transferred to the client after all payments are received and prior to printing or file handoff.',
      'This proposal/contract may not be transferred to a third party without prior written consent signed by Sivan Darmon Pritsker.',
    ],
    rightsTitle: 'Rights',
    rights: [
      { label: 'Creator Rights', text: 'The designer retains all moral and personal rights to the work throughout the project.' },
      { label: 'Usage Rights', text: 'Exclusive usage rights to the designs and creative outputs belong to the client, as agreed.' },
      { label: 'Raw Materials Rights', text: 'Full responsibility for the rights to any raw materials supplied by the client lies solely with the client. The designer bears no liability to any third party in this regard.' },
    ],
    addTitle: 'Additional Details',
    additional: [
      { label: 'Work Process', text: 'All binding communication between client and designer takes place in writing (WhatsApp or email). Significant changes to already-approved designs, or supplying updated materials after delivery, may incur additional charges at the hourly rate.' },
      { label: 'Termination', text: 'Either party may terminate the engagement with advance written notice. Payments already made are non-refundable, and no digital files or assets will be transferred. A 20-day pause clause applies as separately agreed.' },
      { label: 'Work Start & End', text: 'Work begins after a signed contract and advance payment are received, and ends upon delivery of final files following receipt of the last payment. Both parties commit to meeting the agreed schedule.' },
      { label: 'Publication', text: 'The designer reserves the right to publish the work in a portfolio, website, social media, and any relevant platform, in a manner that does not harm the client and is within reasonable boundaries, as is customary.' },
      { label: 'Credit', text: 'The designer reserves the right to include a credit notice within the work, in a manner that does not harm the client. For websites, a credit link may accompany the request.' },
      { label: 'Contract Validity', text: 'This contract is valid for one month from the date it was sent to the client.' },
    ],
    signatureTitle: "Let's Sign and Begin :)",
    signatureNote: 'You may reply by email with approval and attach this document.',
    designerLabel: 'Sivan Darmon Pritsker',
  },
};

function esc(str: string | undefined): string {
  return (str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildPage(content: string, lang: 'he' | 'en'): string {
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  return `
  <div class="page" lang="${lang}">
    <div class="sidebar">
      ${LOGO_SVG}
      <div class="services">${SERVICES}</div>
    </div>
    <div class="main" dir="${dir}">
      ${content}
    </div>
    <div class="footer" dir="ltr">${FOOTER_TEXT}</div>
  </div>`;
}

function buildDynamicPages(content: ProposalContent, customer: CustomerInfo, dateStr: string, lang: 'he' | 'en'): string {
  const isHe = lang === 'he';
  const L = isHe
    ? {
        subject: `הנדון: הצעת מחיר וחוזה עבודה – ${esc(customer.businessName)}`,
        clientTitle: 'פרטי הלקוח',
        businessName: 'שם העסק', regNum: 'ח.פ.', address: 'כתובת',
        contact: 'איש קשר', phone: 'טלפון', email: 'דוא"ל',
        projectTitle: 'תיאור הפרויקט',
        timelineTitle: 'לוח זמנים', timelineQuestion: 'מתי זה יהיה מוכן?',
        paymentTitle: 'תשלום', priceLabel: 'מחיר הפרויקט', scheduleLabel: 'חלוקה לתשלומים',
        hourlyLabel: 'מחיר שעת עבודה', additionalLabel: 'תנאי לשעות נוספות',
        workApproval: 'אישור הלקוחה לפני ביצוע ובמסמך משותף אין ליין',
        structureTitle: 'מבנה הפרויקט',
      }
    : {
        subject: `Re: Price Proposal & Work Contract – ${esc(customer.businessName)}`,
        clientTitle: 'Client Details',
        businessName: 'Business Name', regNum: 'Reg. No.', address: 'Address',
        contact: 'Contact', phone: 'Phone', email: 'Email',
        projectTitle: 'Project Description',
        timelineTitle: 'Timeline', timelineQuestion: 'When will it be ready?',
        paymentTitle: 'Payment', priceLabel: 'Project Price', scheduleLabel: 'Payment Schedule',
        hourlyLabel: 'Hourly Rate', additionalLabel: 'Additional Hours',
        workApproval: 'Client approval via shared online document before production',
        structureTitle: 'Project Structure',
      };

  const timelineSide = isHe ? 'right' : 'left';

  const timelineHtml = content.timeline.map(ph => `
    <div class="phase">
      <div class="phase-header"><strong>${esc(ph.phase)}</strong> <span class="phase-dur">– ${esc(ph.duration)}</span></div>
      <ul class="phase-tasks">${ph.tasks.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>`).join('');

  const paymentRows = content.paymentSchedule.map(p => `
    <div class="pay-row">
      <span class="pay-label">${esc(p.label)}</span>
      <span class="pay-amount">${esc(p.amount)}</span>
      <span class="pay-cond">${esc(p.condition)}</span>
    </div>`).join('');

  const structureHtml = content.projectStructure.map(sec => `
    <div class="struct-section">
      <div class="struct-name">${esc(sec.name)}</div>
      ${sec.description ? `<div class="struct-desc">${esc(sec.description)}</div>` : ''}
      <table class="struct-table">
        ${sec.deliverables.map(d => `
        <tr>
          <td class="struct-item">${esc(d.item)}</td>
          <td class="struct-price">${esc(d.price ?? '')}</td>
        </tr>`).join('')}
      </table>
    </div>`).join('');

  const page1 = buildPage(`
    <div class="date-line">${esc(dateStr)}</div>
    <h1 class="subject">${L.subject}</h1>
    <p class="greeting">${esc(content.greeting)}</p>
    <p class="intro">${esc(content.intro)}</p>

    <div class="section">
      <div class="sec-heading">${L.clientTitle}</div>
      <div class="details-grid">
        <span class="dl">${L.businessName}</span><span class="dv">${esc(customer.businessName)}</span>
        ${customer.registrationNumber ? `<span class="dl">${L.regNum}</span><span class="dv">${esc(customer.registrationNumber)}</span>` : ''}
        ${customer.address ? `<span class="dl">${L.address}</span><span class="dv">${esc(customer.address)}</span>` : ''}
        ${customer.contactName ? `<span class="dl">${L.contact}</span><span class="dv">${esc(customer.contactName)}</span>` : ''}
        ${customer.phone ? `<span class="dl">${L.phone}</span><span class="dv">${esc(customer.phone)}</span>` : ''}
        ${customer.email ? `<span class="dl">${L.email}</span><span class="dv">${esc(customer.email)}</span>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="sec-heading">${L.projectTitle}</div>
      <p class="body-text">${esc(content.projectDescription)}</p>
    </div>

    <div class="section timeline-section" style="position:relative">
      <div class="sec-heading">${L.timelineTitle}</div>
      <div class="timeline-note" style="${timelineSide}:0">${L.timelineQuestion}</div>
      ${timelineHtml}
    </div>
  `, lang);

  const page2 = buildPage(`
    <div class="section">
      <div class="sec-heading">${L.paymentTitle}</div>
      <div class="price-total">
        <span class="price-label">${L.priceLabel}</span>
        <span class="price-value">${esc(content.totalPrice)}</span>
      </div>
      <div class="sec-sub-heading">${L.scheduleLabel}</div>
      ${paymentRows}
      <div class="work-approval">${L.workApproval}</div>
    </div>

    <div class="section">
      <div class="sec-heading">${L.structureTitle}</div>
      ${structureHtml}
    </div>
  `, lang);

  return page1 + page2;
}

function buildFixedTermsPage(lang: 'he' | 'en', clientName: string): string {
  const T = FIXED_TERMS[lang];
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  const notesHtml = T.notes.map(n => `<li>${esc(n)}</li>`).join('');
  const rightsHtml = T.rights.map(r => `
    <div class="rights-row">
      <span class="rights-label">${esc(r.label)}</span>
      <span class="rights-text">${esc(r.text)}</span>
    </div>`).join('');
  const addHtml = T.additional.map(a => `
    <div class="add-row">
      <span class="add-label">${esc(a.label)}</span>
      <span class="add-text">${esc(a.text)}</span>
    </div>`).join('');

  return buildPage(`
    <div class="section">
      <div class="sec-heading">${T.notesTitle}</div>
      <ul class="notes-list">${notesHtml}</ul>
    </div>

    <div class="section">
      <div class="sec-heading">${T.rightsTitle}</div>
      ${rightsHtml}
    </div>

    <div class="section">
      <div class="sec-heading">${T.addTitle}</div>
      ${addHtml}
    </div>

    <div class="sig-section">
      <div class="sig-title">${T.signatureTitle}</div>
      <p class="sig-note" dir="${dir}">${T.signatureNote}</p>
      <div class="sig-row">
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">${esc(T.designerLabel)}</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">${esc(clientName)}</div>
        </div>
      </div>
    </div>
  `, lang);
}

const CSS = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, 'Arial Unicode MS', 'Helvetica Neue', sans-serif;
    font-size: 9.5pt;
    color: #1a1a1a;
    background: #fff;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    position: relative;
    display: flex;
    page-break-after: always;
    overflow: hidden;
  }
  /* ── Sidebar ── */
  .sidebar {
    width: 22mm;
    min-height: 297mm;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8mm 0 6mm;
    flex-shrink: 0;
  }
  .sidebar svg { width: 14mm; height: 14mm; }
  .services {
    font-size: 5pt;
    letter-spacing: 0.3px;
    color: #555;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    margin-top: auto;
    line-height: 2.2;
    white-space: nowrap;
  }
  /* ── Main content ── */
  .main {
    flex: 1;
    padding: 8mm 12mm 18mm 10mm;
    position: relative;
  }
  .date-line { font-size: 8.5pt; color: #666; margin-bottom: 4mm; }
  .subject { font-size: 13pt; font-weight: bold; color: #1a1a1a; margin-bottom: 4mm; line-height: 1.3; }
  .greeting { font-size: 10pt; margin-bottom: 1.5mm; }
  .intro { font-size: 9pt; color: #444; margin-bottom: 5mm; line-height: 1.55; }
  /* ── Section ── */
  .section { margin-bottom: 5.5mm; }
  .sec-heading {
    font-size: 11pt;
    font-weight: bold;
    color: ${ACCENT};
    margin-bottom: 2.5mm;
  }
  .sec-sub-heading {
    font-size: 9pt;
    font-weight: bold;
    color: ${ACCENT};
    margin: 2mm 0 1mm;
  }
  .body-text { font-size: 9.5pt; line-height: 1.55; color: #333; }
  /* ── Client details ── */
  .details-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.2mm 5mm;
    font-size: 9pt;
  }
  .dl { color: ${ACCENT}; white-space: nowrap; font-size: 8.5pt; }
  .dv { color: #1a1a1a; }
  /* ── Timeline ── */
  .timeline-section { padding-top: 1mm; }
  .timeline-note {
    position: absolute;
    font-size: 7.5pt;
    color: ${ACCENT};
    font-style: italic;
    top: 0;
    max-width: 30mm;
    line-height: 1.3;
  }
  .phase { margin-bottom: 2.5mm; }
  .phase-header { font-size: 9.5pt; }
  .phase-dur { font-weight: normal; color: #555; }
  .phase-tasks { margin-top: 1mm; padding-inline-start: 5mm; }
  .phase-tasks li { font-size: 8.5pt; color: #444; margin-bottom: 0.5mm; list-style-type: disc; }
  /* ── Payment ── */
  .price-total { display: flex; align-items: baseline; gap: 4mm; margin-bottom: 2mm; }
  .price-label { font-size: 9pt; color: ${ACCENT}; }
  .price-value { font-size: 12pt; font-weight: bold; }
  .pay-row { display: flex; align-items: flex-start; gap: 3mm; margin-bottom: 1.5mm; font-size: 8.5pt; }
  .pay-label { color: ${ACCENT}; min-width: 20mm; flex-shrink: 0; font-size: 8pt; }
  .pay-amount { font-weight: bold; white-space: nowrap; }
  .pay-cond { color: #555; }
  .work-approval { font-size: 7.5pt; color: #777; margin-top: 2mm; }
  /* ── Project structure ── */
  .struct-section { margin-bottom: 3.5mm; }
  .struct-name { font-weight: bold; font-size: 9.5pt; margin-bottom: 0.5mm; }
  .struct-desc { font-size: 8pt; color: #555; margin-bottom: 1.5mm; }
  .struct-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  .struct-item { padding: 0.5mm 0; color: #333; }
  .struct-price { text-align: end; color: #666; white-space: nowrap; padding-inline-start: 4mm; }
  /* ── Fixed terms ── */
  .notes-list { padding-inline-start: 4mm; font-size: 8.5pt; line-height: 1.6; color: #333; }
  .notes-list li { margin-bottom: 1.2mm; list-style-type: disc; }
  .rights-row { display: flex; gap: 3mm; margin-bottom: 2mm; align-items: flex-start; }
  .rights-label { color: ${ACCENT}; font-size: 8.5pt; min-width: 28mm; flex-shrink: 0; }
  .rights-text { font-size: 8.5pt; color: #333; line-height: 1.5; }
  .add-row { display: flex; gap: 3mm; margin-bottom: 2mm; align-items: flex-start; }
  .add-label { color: ${ACCENT}; font-size: 8.5pt; font-weight: bold; min-width: 28mm; flex-shrink: 0; }
  .add-text { font-size: 8.5pt; color: #333; line-height: 1.5; }
  /* ── Signature ── */
  .sig-section { margin-top: 5mm; }
  .sig-title { font-size: 12pt; font-weight: bold; color: ${ACCENT}; text-align: center; margin-bottom: 3mm; }
  .sig-note { font-size: 8pt; color: #666; margin-bottom: 8mm; text-align: center; }
  .sig-row { display: flex; gap: 15mm; justify-content: space-between; }
  .sig-block { flex: 1; }
  .sig-line { border-bottom: 1px solid #1a1a1a; height: 14mm; margin-bottom: 2mm; }
  .sig-name { font-size: 8.5pt; font-weight: bold; text-align: center; }
  /* ── Footer ── */
  .footer {
    position: absolute;
    bottom: 5mm;
    left: 22mm;
    right: 0;
    font-size: 7.5pt;
    color: #555;
    padding: 1.5mm 12mm 0 10mm;
    border-top: 1px solid #eee;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; }
  }
`;

export function buildProposalHtml(params: {
  contentJson: ContentJson;
  customer: CustomerInfo;
  dateStr: string;
  lang: 'he' | 'en';
}): string {
  const { contentJson, customer, dateStr, lang } = params;
  const content = contentJson[lang];
  const clientName = customer.contactName || customer.businessName;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${CSS}</style>
</head>
<body>
${buildDynamicPages(content, customer, dateStr, lang)}
${buildFixedTermsPage(lang, clientName)}
</body>
</html>`;
}

export function buildBilingualPdf(params: {
  contentJson: ContentJson;
  customer: CustomerInfo;
  dateStr: string;
}): string {
  const { contentJson, customer, dateStr } = params;
  const clientName = customer.contactName || customer.businessName;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${CSS}</style>
</head>
<body>
${buildDynamicPages(contentJson.he, customer, dateStr, 'he')}
${buildFixedTermsPage('he', clientName)}
${buildDynamicPages(contentJson.en, customer, dateStr, 'en')}
${buildFixedTermsPage('en', clientName)}
</body>
</html>`;
}
