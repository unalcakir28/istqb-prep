/**
 * F4-07 — `/sinav-sureci`, how the exam is taken in Turkey, through TTB.
 *
 * Every sentence is one TTB or ISTQB states on its own page, read on
 * CHECKED_ON and recorded with its quote in docs/03-istqb-reference.md §9
 * (rule 5). Each section links the pages it rests on, and the intro says
 * those pages decide: fees and rules change without notice, and this page
 * cannot follow them. What could not be confirmed is listed as such, not
 * guessed.
 *
 * The links are TTB's and ISTQB's process pages, not a certification's
 * documents, so they live here rather than in a meta.json `sources`.
 */

import { useTranslation } from "react-i18next";

import { useArrivalFocus } from "@/lib/useArrivalFocus";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Lang } from "@/types/content";

/** The day the facts on this page were read (docs/03 §9). */
const CHECKED_ON = new Date(2026, 9, 5);

/** Each page's address in the interface language; its name is `process.page.<key>`. */
interface SourcePage {
  url: Record<Lang, string>;
}

const TTB = "https://www.turkishtestingboard.org";

const PAGES = {
  faq: {
    url: { tr: `${TTB}/sikca-sorulan-sorular/`, en: `${TTB}/en/faq/` },
  },
  examInfo: {
    url: { tr: `${TTB}/istqb-sinavlar-hakkinda-bilgi/`, en: `${TTB}/en/about-istqb-exams/` },
  },
  payment: {
    url: { tr: `${TTB}/odeme-kosullari/`, en: `${TTB}/odeme-kosullari/` },
  },
  ctflRegistration: {
    url: {
      tr: `${TTB}/kayit/foundation-level-certified-tester/`,
      en: `${TTB}/en/register/foundation-level-certified-tester/`,
    },
  },
  ctflPage: {
    url: { tr: `${TTB}/foundation-level/`, en: `${TTB}/en/foundation-level/` },
  },
  shop: {
    url: { tr: `${TTB}/kayit/`, en: `${TTB}/kayit/` },
  },
  retake: {
    url: {
      tr: `${TTB}/kayit/foundation-level-2-katilim/`,
      en: `${TTB}/kayit/foundation-level-2-katilim/`,
    },
  },
  register: {
    url: { tr: `${TTB}/istqb-sertifika-kazananlar/`, en: `${TTB}/istqb-sertifika-kazananlar/` },
  },
  ctaiRegistration: {
    url: { tr: `${TTB}/kayit/specialist-ai-testing/`, en: `${TTB}/en/register/ai-testing/` },
  },
  istqbCertificates: {
    url: {
      tr: "https://istqb.org/help/certifications-2/",
      en: "https://istqb.org/help/certifications-2/",
    },
  },
  istqbExams: {
    url: { tr: "https://istqb.org/help/exam/", en: "https://istqb.org/help/exam/" },
  },
} satisfies Record<string, SourcePage>;

interface Section {
  id: string;
  items: string[];
  sources: (keyof typeof PAGES)[];
}

const SECTIONS: Section[] = [
  {
    id: "register",
    items: ["register1", "register2", "register3", "register4", "register5", "register6"],
    sources: ["ctflRegistration", "ctaiRegistration", "faq", "payment", "ctflPage", "istqbExams"],
  },
  {
    id: "examDay",
    items: ["examDay1", "examDay2", "examDay3", "examDay4", "examDay5", "examDay6"],
    sources: ["faq", "examInfo"],
  },
  {
    id: "paper",
    items: ["paper1", "paper2", "paper3"],
    sources: ["examInfo", "ctflRegistration", "ctaiRegistration", "faq", "ctflPage"],
  },
  {
    id: "result",
    items: ["result1", "result2", "result3", "result4"],
    sources: ["ctflRegistration", "faq", "istqbCertificates", "register"],
  },
  {
    id: "retake",
    items: ["retake1", "retake2", "retake3", "retake4"],
    sources: ["retake", "shop", "faq", "istqbExams"],
  },
  { id: "ctai", items: ["ctai1"], sources: ["ctaiRegistration"] },
  { id: "notFound", items: ["notFound1"], sources: [] },
];

const CARD = "flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5";

export default function ExamProcess() {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language === "en" ? "en" : "tr";
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "long" }).format(CHECKED_ON);

  useDocumentTitle(t("process.title"));
  // Reached from the footer: a route swap with nothing else to announce it.
  const headingRef = useArrivalFocus<HTMLHeadingElement>(true);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-semibold leading-tight">
          {t("process.title")}
        </h1>
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
          {t("process.intro", { date })}
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={`process-${section.id}`} className={CARD}>
          <h2 id={`process-${section.id}`} className="text-lg font-semibold">
            {t(`process.${section.id}Title`)}
          </h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-relaxed">
            {section.items.map((item) => (
              <li key={item}>{t(`process.${item}`, { date })}</li>
            ))}
          </ul>
          {section.sources.length > 0 ? (
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-fg-muted">
              <span>{t("process.sourcesLabel")}:</span>
              {section.sources.map((key) => (
                <a
                  key={key}
                  href={PAGES[key].url[lang]}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent underline underline-offset-2"
                >
                  {t(`process.page.${key}`)}
                </a>
              ))}
            </p>
          ) : null}
        </section>
      ))}
    </div>
  );
}
