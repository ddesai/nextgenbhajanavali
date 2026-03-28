export function absoluteUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}
