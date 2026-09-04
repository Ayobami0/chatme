import { DateTime } from "luxon";

export function formatDateTime(date: string | Date): string {
  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);

  return dt.toFormat("hh:mm a");
}

export function formatMessageTime(date: Date): string {
  return DateTime.fromJSDate(date).toFormat("HH:mm");
}

export function formatActiveDateTimeHumanReadable(
  date?: Date,
): string | undefined {
  if (!date) return undefined;

  const now = DateTime.now();
  const diff = now.diff(DateTime.fromJSDate(date));

  if (diff.as("second") < 60) {
    return undefined;
  } else if (diff.as("minute") < 60) {
    return `Active ${diff.as("minute").toFixed(0)} minute${diff.as("minute") >= 2 ? "s" : ""} ago`;
  } else if (diff.as("hour") < 24) {
    return `Active ${diff.as("hour").toFixed(0)} hour${diff.as("hour") >= 2 ? "s" : ""} ago`;
  } else {
    return `Active ${diff.as("day").toFixed(0)} day${diff.as("day") >= 2 ? "s" : ""} ago`;
  }
}
