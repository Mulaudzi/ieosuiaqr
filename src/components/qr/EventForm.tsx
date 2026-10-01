import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface EventData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
}

export interface EventValidationResult {
  valid: boolean;
  message?: string;
  start?: Date;
  end?: Date;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function parseLocalEventDate(date: string, time: string): Date | null {
  if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const value = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (!Number.isFinite(value.getTime())) return null;
  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day ||
    value.getHours() !== hour ||
    value.getMinutes() !== minute
  ) return null;
  return value;
}

export function validateEventData(data: EventData): EventValidationResult {
  if (!data.title.trim()) return { valid: false, message: "Please enter the event title" };
  if (!data.startDate || !data.startTime || !data.endDate || !data.endTime) {
    return { valid: false, message: "Please enter valid start and end dates and times" };
  }
  const start = parseLocalEventDate(data.startDate, data.startTime);
  const end = parseLocalEventDate(data.endDate, data.endTime);
  if (!start || !end) return { valid: false, message: "Please enter valid start and end dates and times" };
  if (end.getTime() <= start.getTime()) {
    return { valid: false, message: "End date/time must be after start date/time" };
  }
  return { valid: true, start, end };
}

export function normalizeEventData(content: Record<string, unknown>): EventData {
  const split = (value: unknown) => {
    const text = typeof value === "string" ? value.trim() : "";
    if (/T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) {
      const parsed = new Date(text);
      if (Number.isFinite(parsed.getTime())) {
        const pad = (part: number) => String(part).padStart(2, "0");
        return {
          date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
          time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
        };
      }
    }
    const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
    return { date: match?.[1] ?? (DATE_PATTERN.test(text) ? text : ""), time: match?.[2] ?? "" };
  };
  const start = split(content.startDate ?? content.start ?? content.startAt);
  const end = split(content.endDate ?? content.end ?? content.endAt);
  return {
    title: String(content.title ?? content.eventTitle ?? ""),
    description: String(content.description ?? ""),
    startDate: start.date,
    startTime: String(content.startTime ?? start.time),
    endDate: end.date,
    endTime: String(content.endTime ?? end.time),
    location: String(content.location ?? content.venue ?? ""),
  };
}

interface EventFormProps {
  data: EventData;
  onChange: (data: EventData) => void;
}

export function EventForm({ data, onChange }: EventFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-title">Event Title *</Label>
        <Input
          id="event-title"
          placeholder="Team Meeting"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          id="event-description"
          placeholder="Describe the event..."
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date *</Label>
          <Input
            id="start-date"
            type="date"
            value={data.startDate}
            onChange={(e) => onChange({ ...data, startDate: e.target.value })}
            aria-required="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-time">Start Time *</Label>
          <Input
            id="start-time"
            type="time"
            value={data.startTime}
            onChange={(e) => onChange({ ...data, startTime: e.target.value })}
            aria-required="true"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date *</Label>
          <Input
            id="end-date"
            type="date"
            value={data.endDate}
            onChange={(e) => onChange({ ...data, endDate: e.target.value })}
            aria-required="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-time">End Time *</Label>
          <Input
            id="end-time"
            type="time"
            value={data.endTime}
            onChange={(e) => onChange({ ...data, endTime: e.target.value })}
            aria-required="true"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-location">Location</Label>
        <Input
          id="event-location"
          placeholder="Conference Room A / 123 Main St"
          value={data.location}
          onChange={(e) => onChange({ ...data, location: e.target.value })}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Scanning this QR code will add the event to the user's calendar.
      </p>
    </div>
  );
}

export function generateEventString(data: EventData): string {
  const result = validateEventData(data);
  if (!result.valid || !result.start || !result.end) return "";
  const formatDateTime = (value: Date) => value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const escapeCalendarText = (value: string) => value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

  const dtStart = formatDateTime(result.start);
  const dtEnd = formatDateTime(result.end);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${escapeCalendarText(data.title.trim())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
  ];

  if (data.description) lines.push(`DESCRIPTION:${escapeCalendarText(data.description)}`);
  if (data.location) lines.push(`LOCATION:${escapeCalendarText(data.location)}`);

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\n");
}
