import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  icon?: ReactNode;
};

export function EmptyState({ title, description, icon }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/30 px-6 py-16 text-center"
      role="status"
    >
      {icon ? (
        <div className="mb-4 text-3xl text-muted-foreground/80" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
