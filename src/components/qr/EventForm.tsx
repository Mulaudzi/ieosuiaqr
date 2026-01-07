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
  const formatDateTime = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`);
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const dtStart = formatDateTime(data.startDate, data.startTime);
  const dtEnd = formatDateTime(data.endDate, data.endTime);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${data.title}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
  ];

  if (data.description) lines.push(`DESCRIPTION:${data.description.replace(/\n/g, "\\n")}`);
  if (data.location) lines.push(`LOCATION:${data.location}`);

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\n");
}
