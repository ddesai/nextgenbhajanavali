import { load } from "cheerio";

/** Prefer paragraph breaks for kirtan HTML (`p.k_line_gu`, etc.). */
export function textFromHtml(html: string): string {
  if (!html?.trim()) return "";
  const $ = load(html);
  const ps = $("p")
    .toArray()
    .map((el) => $(el).text().replace(/\u00a0/g, " ").trim())
    .filter(Boolean);
  if (ps.length) return ps.join("\n");
  return $.root()
    .text()
    .replace(/\u00a0/g, " ")
    .trim();
}
