export function formatDate(isoOrPgTimestamp: string) {
  const d = new Date(isoOrPgTimestamp);
  if (Number.isNaN(d.getTime())) return isoOrPgTimestamp;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function normalizeText(value: unknown) {
  return String(value ?? "").toLowerCase();
}
