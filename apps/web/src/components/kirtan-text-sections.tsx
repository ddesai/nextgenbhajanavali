import type { KirtanDetail } from "@ngb/content-schema";

type Props = {
  texts: KirtanDetail["texts"];
};

const labels: Record<string, string> = {
  GUJARATI_LYRICS: "Lyrics (Gujarati)",
  TRANSLITERATION: "Gujlish / transliteration",
  ENGLISH_TRANSLATION: "English",
};

export function KirtanTextSections({ texts }: Props) {
  if (texts.length === 0) {
    return (
      <p className="text-muted-foreground" role="status">
        No lyrics or translations are available for this kirtan yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {texts.map((t) => {
        const lang =
          t.locale ??
          (t.kind === "GUJARATI_LYRICS"
            ? "gu"
            : t.kind === "TRANSLITERATION"
              ? "gu-Latn"
              : "en");
        const isGujarati = t.kind === "GUJARATI_LYRICS";
        return (
          <section
            key={`${t.kind}-${t.sortOrder}`}
            aria-labelledby={`heading-${t.kind}-${t.sortOrder}`}
          >
            <h2
              id={`heading-${t.kind}-${t.sortOrder}`}
              className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground"
            >
              {labels[t.kind] ?? t.kind}
            </h2>
            <div
              lang={lang}
              className={`prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap ${
                isGujarati ? "font-gujarati text-xl leading-relaxed" : ""
              }`}
            >
              {t.content}
            </div>
          </section>
        );
      })}
    </div>
  );
}
