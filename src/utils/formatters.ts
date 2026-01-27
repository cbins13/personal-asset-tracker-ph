export const formatCurrency = (value: number) =>
  value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });

export const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
