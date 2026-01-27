export function sanitizeText(value: string): string {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "");
}

export function escapeHtml(value: string): string {
  if (typeof value !== "string") return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return value.replace(/[&<>"']/g, (char) => map[char]);
}

export function sanitizeHtml(value: string): string {
  if (typeof value !== "string") return "";
  return escapeHtml(value);
}
