/**
 * Common formatting utilities for Cognito application
 */

/**
 * Format number as currency string (defaults to VND)
 */
export function formatCurrency(amount: number, currency: string = "VND", locale: string = "vi-VN"): string {
  if (isNaN(amount)) return "0 " + currency;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(amount);
}

/**
 * Format Date into localized date/time string
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "vi-VN"
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
}

/**
 * Format relative time (e.g., "5 phút trước", "2 ngày trước")
 */
export function formatRelativeTime(date: Date | string | number, locale: string = "vi"): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.round((d.getTime() - now.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const cutoffs = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity];
  const units: Intl.RelativeTimeFormatUnit[] = ["second", "minute", "hour", "day", "week", "month", "year"];

  const unitIndex = cutoffs.findIndex((cutoff) => cutoff > Math.abs(diffInSeconds));
  const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1;

  return rtf.format(Math.round(diffInSeconds / divisor), units[unitIndex]);
}

/**
 * Truncate long text with ellipsis
 */
export function truncateText(text: string, maxLength: number, suffix: string = "..."): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + suffix;
}

/**
 * Convert string into a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese accents
    .replace(/[đĐ]/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Format file size in bytes to human readable format (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
