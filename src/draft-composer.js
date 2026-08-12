import { DERIVED_FIELD_BY_STAGE, getFieldDefinition, getInheritedContextFields } from "./catalog/index.js";
import { getFieldValue, serializeDisplayValue } from "./field-values.js";
import { t } from "./i18n.js";

const DRAFT_IDS = Object.freeze(Object.values(DERIVED_FIELD_BY_STAGE));

function localeCode(locale) {
  return locale === "th" ? "th" : "en";
}

function display(state, fieldId, locale) {
  const field = getFieldDefinition(fieldId);
  const fallback = localeCode(locale) === "th" ? "ยังไม่ระบุ" : "Not specified";
  if (field.control === "short-text" || field.control === "derived-text") {
    const value = getFieldValue(state, fieldId);
    return typeof value === "string" && value.trim() ? value : fallback;
  }
  return serializeDisplayValue(
    state,
    field,
    localeCode(locale) === "th" ? "thai" : "english"
  ) || fallback;
}

function fieldLabel(fieldId, locale) {
  const field = getFieldDefinition(fieldId);
  return t(localeCode(locale), field?.labelKey ?? `fields.${fieldId}`);
}

function contextFor(state, stageId) {
  return {
    researchTypeId: state.researchTypeId,
    studyDesignId: state.studyDesignId,
    stageId,
    evidenceMode: state.evidenceMode,
    fields: state.fields,
  };
}

function inheritedContext(state, stageId, locale) {
  return getInheritedContextFields(contextFor(state, stageId))
    .map(field => DRAFT_IDS.includes(field.id)
      ? workspaceContext(state, field.id, locale)
      : `${fieldLabel(field.id, locale)}: ${display(state, field.id, locale)}`)
    .filter(Boolean)
    .join("; ");
}

function workspaceContext(state, draftId, locale) {
  const draftValue = state.drafts?.[draftId]?.value;
  const value = typeof draftValue === "string" && draftValue.trim()
    ? draftValue
    : state.fields?.[draftId];
  if (typeof value !== "string" || !value.trim()) return "";
  return `${fieldLabel(draftId, locale)}: "${value.trim()}"`;
}

function lowerDisplay(state, fieldId, locale) {
  return display(state, fieldId, locale).toLocaleLowerCase(localeCode(locale));
}

function composeResearchQuestion(state, locale) {
  const topic = display(state, "topic", locale);
  const population = display(state, "population", locale);
  const questionType = lowerDisplay(state, "questionType", locale);
  const outcome = display(state, "primaryOutcome", locale);
  return localeCode(locale) === "th"
    ? `ร่างคำถามวิจัยแบบมุ่งเน้นชนิด ${questionType} เกี่ยวกับ ${topic} ใน ${population} โดยมี ${outcome} เป็นผลลัพธ์หลัก ข้อความนี้เป็นบริบทพื้นที่ทำงานจากการเลือกของผู้ใช้ ไม่ได้ยืนยันหลักฐาน.`
    : `Draft a focused ${questionType} question about ${topic} in ${population}, with ${outcome} as the primary outcome. This workspace draft restates user selections and does not establish evidence.`;
}

function composeSearchStrategy(state, locale) {
  const context = inheritedContext(state, "literature-review", locale);
  const sources = display(state, "informationSources", locale);
  const coverage = display(state, "dateCoverage", locale);
  const evidenceTypes = display(state, "evidenceTypes", locale);
  const concepts = display(state, "searchConcepts", locale);
  const question = workspaceContext(state, "researchQuestion", locale);
  return localeCode(locale) === "th"
    ? `จัดทำกลยุทธ์การสืบค้นวรรณกรรมที่ทำซ้ำได้สำหรับ ${context} โดยใช้แหล่งข้อมูล ${sources}, ช่วงเวลา ${coverage}, ประเภทหลักฐาน ${evidenceTypes}, และแนวคิดการสืบค้น ${concepts}. ใช้ ${question || "บริบทคำถามวิจัยยังไม่ระบุ"} เป็นบริบทพื้นที่ทำงานที่ผู้ใช้มองเห็น และขอให้ผู้ช่วยปลายทางดำเนินการสืบค้นโดยไม่อ้างว่าได้สังเคราะห์หลักฐาน.`
    : `Build a reproducible literature search for ${context}. Use ${sources}, ${coverage}, ${evidenceTypes}, and search concepts ${concepts}. Use ${question || "a research question that is not specified"} as user-visible workspace context, and request downstream search work without claiming evidence synthesis.`;
}

function composeEvidenceSummary(state, locale) {
  const context = inheritedContext(state, "synthesize-information", locale);
  const pattern = display(state, "evidencePattern", locale);
  const method = display(state, "synthesisMethod", locale);
  const certainty = display(state, "evidenceCertainty", locale);
  const limitations = display(state, "mainLimitations", locale);
  const search = workspaceContext(state, "searchStrategy", locale);
  return localeCode(locale) === "th"
    ? `ขอให้ผู้ช่วยปลายทางประเมินรูปแบบหลักฐานด้วยวิธี ${method} รายงานความเชื่อมั่น ${certainty} และข้อจำกัด ${limitations} สำหรับ ${context} โดยถือว่ารูปแบบที่เลือก (${pattern}) เป็นข้อมูลเบื้องต้นจนกว่าจะมีแหล่งหลักฐานที่อนุญาตรองรับ. ใช้ ${search || "กลยุทธ์การสืบค้นยังไม่ระบุ"} เป็นบริบทพื้นที่ทำงานที่ผู้ใช้มองเห็น ไม่ใช่หลักฐานที่ตรวจสอบแล้ว.`
    : `Ask the downstream assistant to assess the evidence pattern using ${method}, report ${certainty} certainty and ${limitations} for ${context}. Treat the selected pattern as provisional unless supported by permitted sources (${pattern}). Use ${search || "a search strategy that is not specified"} as user-visible workspace context, never as verified evidence.`;
}

function composeResearchGaps(state, locale) {
  const context = inheritedContext(state, "identify-gaps", locale);
  const gapType = lowerDisplay(state, "gapType", locale);
  const support = display(state, "gapEvidenceSupport", locale);
  const gapContext = display(state, "gapContext", locale);
  const priority = display(state, "gapPriority", locale);
  const summary = workspaceContext(state, "evidenceSummary", locale);
  return localeCode(locale) === "th"
    ? `ร่างข้อความช่องว่างการวิจัยด้าน ${gapType} สำหรับบริบท ${gapContext} และ ${context} โดยระบุสถานะการสนับสนุนว่า ${support} และลำดับความสำคัญ ${priority}. ใช้ ${summary || "สรุปหลักฐานยังไม่ระบุ"} เป็นบริบทพื้นที่ทำงานที่ผู้ใช้มองเห็น และขอให้ผู้ช่วยปลายทางตรวจสอบช่องว่างต่อไปโดยไม่อ้างว่าได้รับการยืนยันแล้ว.`
    : `Draft a ${gapType} research-gap statement for ${gapContext} and ${context}, recording ${support} as the selected support status and ${priority} priority. Use ${summary || "an evidence summary that is not specified"} as user-visible workspace context, and request downstream gap assessment without claiming verification.`;
}

function composeHypotheses(state, locale) {
  const context = inheritedContext(state, "generate-hypotheses", locale);
  const approach = lowerDisplay(state, "hypothesisApproach", locale);
  const exposure = display(state, "interventionOrExposure", locale);
  const outcome = display(state, "hypothesisOutcome", locale);
  const direction = lowerDisplay(state, "expectedDirection", locale);
  const gaps = workspaceContext(state, "researchGaps", locale);
  return localeCode(locale) === "th"
    ? `ร่างสมมติฐานแบบ ${approach} ว่า ${exposure} จะ ${direction} ${outcome} สำหรับ ${context}. ใช้ ${gaps || "ข้อความช่องว่างการวิจัยยังไม่ระบุ"} เป็นบริบทพื้นที่ทำงานที่ผู้ใช้มองเห็น สมมติฐานนี้เป็นข้อเสนอสำหรับการตรวจสอบภายหลัง ไม่ใช่หลักฐานที่ยืนยันแล้ว.`
    : `Draft a ${approach} hypothesis that ${exposure} will ${direction} ${outcome} for ${context}. Use ${gaps || "a research-gap statement that is not specified"} as user-visible workspace context. This is a proposed hypothesis, not verified evidence.`;
}

function composeMethodologyOutline(state, locale) {
  const context = inheritedContext(state, "outline-methodology", locale);
  const design = lowerDisplay(state, "confirmedDesign", locale);
  const recruitment = display(state, "dataSourceRecruitment", locale);
  const sampling = display(state, "samplingApproach", locale);
  const analysis = display(state, "analysisFamily", locale);
  const feasibility = display(state, "feasibilityPeriod", locale);
  const hypotheses = workspaceContext(state, "hypotheses", locale);
  return localeCode(locale) === "th"
    ? `วางโครงร่างระเบียบวิธีวิจัยแบบ ${design} สำหรับ ${context} โดยใช้ ${recruitment}, การคัดเลือกตัวอย่าง ${sampling}, การวิเคราะห์ ${analysis}, และช่วงความเป็นไปได้ ${feasibility}. ใช้ ${hypotheses || "สมมติฐานยังไม่ระบุ"} เป็นบริบทพื้นที่ทำงานที่ผู้ใช้มองเห็น และขอให้ผู้ช่วยปลายทางพัฒนาระเบียบวิธีโดยไม่อ้างว่าได้ยืนยันผลลัพธ์.`
    : `Outline a ${design} study methodology for ${context} using ${recruitment}, ${sampling} sampling, ${analysis} analysis, and a ${feasibility} feasibility period. Use ${hypotheses || "hypotheses that are not specified"} as user-visible workspace context, and request downstream methodology work without claiming results.`;
}

function composeProposalOutline(state, locale) {
  const context = inheritedContext(state, "write-proposal", locale);
  const proposalType = lowerDisplay(state, "proposalType", locale);
  const audience = display(state, "targetAudience", locale);
  const sections = display(state, "requiredSections", locale);
  const timeline = display(state, "proposalTimeline", locale);
  const products = DRAFT_IDS.slice(0, -1)
    .map(draftId => workspaceContext(state, draftId, locale))
    .filter(Boolean)
    .join("; ");
  return localeCode(locale) === "th"
    ? `จัดทำโครงร่างข้อเสนอแบบ ${proposalType} สำหรับ ${audience} ในบริบท ${context} พร้อมส่วน ${sections} และกรอบเวลา ${timeline}. ใช้ผลิตภัณฑ์มาตรฐานจากขั้นตอนที่ 1-6 ต่อไปนี้เป็นบริบทพื้นที่ทำงานที่ผู้ใช้มองเห็น: ${products || "ยังไม่มีผลิตภัณฑ์ขั้นตอนก่อนหน้า"}. บริบทเหล่านี้ไม่ใช่หลักฐานที่ตรวจสอบแล้ว และข้อเสนอนี้ขอให้ผู้ช่วยปลายทางดำเนินงานต่อ.`
    : `Assemble a ${proposalType} outline for ${audience} in the context of ${context}, with ${sections} and a ${timeline} timeline. Use these available canonical products from Steps 1-6 as user-visible workspace context: ${products || "No earlier stage products are specified"}. They are not verified evidence; this outline requests downstream proposal work.`;
}

const COMPOSERS = Object.freeze({
  researchQuestion: composeResearchQuestion,
  searchStrategy: composeSearchStrategy,
  evidenceSummary: composeEvidenceSummary,
  researchGaps: composeResearchGaps,
  hypotheses: composeHypotheses,
  methodologyOutline: composeMethodologyOutline,
  proposalOutline: composeProposalOutline,
});

export function composeSuggestedDraft(state, draftId, locale = "en") {
  const compose = COMPOSERS[draftId];
  if (!compose) throw new RangeError(`Unknown draft: ${draftId}`);
  return compose(state, localeCode(locale));
}

function nextDraft(previous, suggested) {
  if (previous?.customized) return { ...previous, suggested, error: "" };
  return { suggested, value: suggested, customized: false, error: "" };
}

export function syncDrafts(state, locale = state.interfaceLocale, mode = "structured") {
  const drafts = { ...state.drafts };
  let fields;
  const currentFields = () => fields ?? state.fields ?? {};
  const writableFields = () => {
    if (!fields) {
      fields = Object.defineProperties({}, Object.getOwnPropertyDescriptors(state.fields ?? {}));
    }
    return fields;
  };

  for (const draftId of DRAFT_IDS) {
    const previous = drafts[draftId] ?? { suggested: "", value: "", customized: false, error: "" };
    if (mode === "locale" && previous.customized) {
      drafts[draftId] = previous;
      writableFields()[draftId] = previous.value;
      continue;
    }
    try {
      const suggested = composeSuggestedDraft({ ...state, drafts, fields: currentFields() }, draftId, locale);
      const next = nextDraft(previous, suggested);
      drafts[draftId] = next;
      writableFields()[draftId] = next.value;
    } catch {
      drafts[draftId] = { ...previous, error: "composition-failed" };
      writableFields()[draftId] = previous.value;
    }
  }

  return { ...state, drafts, fields: currentFields() };
}
