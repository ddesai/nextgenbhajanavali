import {
  AnirdeshApiErrorSchema,
  AnirdeshKirtanApiSchema,
  type AnirdeshKirtanApi,
} from "@ngb/content-schema";

export type ParseAnirdeshResult =
  | { ok: true; data: AnirdeshKirtanApi }
  | { ok: false; kind: "api_error"; message: string }
  | { ok: false; kind: "json"; message: string }
  | { ok: false; kind: "validation"; message: string };

export function parseAnirdeshApiResponseText(body: string): ParseAnirdeshResult {
  let json: unknown;
  try {
    json = JSON.parse(body) as unknown;
  } catch (e) {
    return {
      ok: false,
      kind: "json",
      message: e instanceof Error ? e.message : "invalid json",
    };
  }

  const err = AnirdeshApiErrorSchema.safeParse(json);
  if (err.success)
    return { ok: false, kind: "api_error", message: err.data.message };

  const k = AnirdeshKirtanApiSchema.safeParse(json);
  if (!k.success)
    return {
      ok: false,
      kind: "validation",
      message: k.error.message,
    };

  return { ok: true, data: k.data };
}
