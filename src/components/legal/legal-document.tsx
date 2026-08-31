"use client";

import { Info } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import type { Locale } from "@/types";

export type LegalBlock =
  | { type: "p"; content: React.ReactNode }
  | { type: "list"; items: React.ReactNode[] }
  | { type: "callout"; content: React.ReactNode };

export type LegalSection = {
  id: string;
  number: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocumentProps = {
  locale: Locale;
  eyebrow: string;
  title: string;
  description: string;
  tocLabel: string;
  intro: string;
  sections: LegalSection[];
  closing?: string;
};

function LegalBlockView({ block }: { block: LegalBlock }) {
  if (block.type === "p") return <p>{block.content}</p>;
  if (block.type === "list") return <ul className="legal-list">{block.items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
  return <div className="legal-callout"><Info aria-hidden="true" /><p>{block.content}</p></div>;
}

export function LegalDocument({ locale, eyebrow, title, description, tocLabel, intro, sections, closing }: LegalDocumentProps) {
  return <PublicShell locale={locale}>
    <section className="page-hero compact legal-hero"><div className="container legal-container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></section>
    <section className="section container legal-container">
      <div className="legal-layout">
        <nav className="legal-toc" aria-label={tocLabel}>
          <span className="legal-toc-label">{tocLabel}</span>
          {sections.map((section) => <a key={section.id} href={`#${section.id}`}><span>{section.number}</span>{section.title}</a>)}
        </nav>
        <div className="legal-copy">
          <p className="legal-intro">{intro}</p>
          {sections.map((section) => <article className="legal-section" key={section.id} id={section.id}>
            <h2><span className="legal-section-number">{section.number}</span>{section.title}</h2>
            {section.blocks.map((block, index) => <LegalBlockView key={index} block={block} />)}
          </article>)}
          {closing && <p className="legal-closing">{closing}</p>}
        </div>
      </div>
    </section>
  </PublicShell>;
}
