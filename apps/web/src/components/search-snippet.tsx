import type { ReactNode } from "react";

const OPEN = "\uE000";
const CLOSE = "\uE001";

/** Renders PostgreSQL `ts_headline` output that uses U+E000 / U+E001 as highlight bounds. */
export function SearchSnippet({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text.includes(OPEN)) {
    return (
      <p className={className}>
        {text}
      </p>
    );
  }

  const nodes: ReactNode[] = [];
  let rest = text;
  let k = 0;

  while (rest.length > 0) {
    const i = rest.indexOf(OPEN);
    if (i === -1) {
      nodes.push(rest);
      break;
    }
    if (i > 0) nodes.push(rest.slice(0, i));
    const j = rest.indexOf(CLOSE, i + OPEN.length);
    if (j === -1) {
      nodes.push(rest.slice(i));
      break;
    }
    const hit = rest.slice(i + OPEN.length, j);
    nodes.push(
      <mark
        key={k++}
        className="rounded-sm bg-primary/20 px-0.5 font-medium text-foreground"
      >
        {hit}
      </mark>,
    );
    rest = rest.slice(j + CLOSE.length);
  }

  return <p className={className}>{nodes}</p>;
}
