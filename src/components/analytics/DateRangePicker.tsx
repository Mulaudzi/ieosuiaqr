import { useState } from "react";
import { format, subDays, subHours, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  onDateChange: (startDate: string, endDate: string) => void;
}

const presets = [
  { label: "Last 24 hours", value: "24h", days: 1, isHours: true },
  { label: "Last 7 days", value: "7d", days: 7, isHours: false },
  { label: "Last 30 days", value: "30d", days: 30, isHours: false },
  { label: "Last 90 days", value: "90d", days: 90, isHours: false },
];

export function DateRangePicker({ onDateChange }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [selectedPreset, setSelectedPreset] = useState<string>("7d");
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (preset: typeof presets[0]) => {
    const end = new Date();
    const start = preset.isHours
      ? subHours(end, 24)
      : subDays(end, preset.days);
    
    setDate({ from: startOfDay(start), to: endOfDay(end) });
    setSelectedPreset(preset.value);
    onDateChange(
      format(startOfDay(start), "yyyy-MM-dd"),
      format(endOfDay(end), "yyyy-MM-dd")
    );
    setIsOpen(false);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    setSelectedPreset("custom");
    if (range?.from && range?.to) {
      onDateChange(
        format(range.from, "yyyy-MM-dd"),
        format(range.to, "yyyy-MM-dd")
      );
    }
  };

  const getDisplayLabel = () => {
    if (selectedPreset !== "custom") {
      return presets.find((p) => p.value === selectedPreset)?.label || "Select dates";
    }
    if (date?.from && date?.to) {
      return `${format(date.from, "MMM d")} - ${format(date.to, "MMM d, yyyy")}`;
    }
    if (date?.from) {
      return format(date.from, "MMM d, yyyy");
    }
    return "Select dates";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-between text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="truncate">{getDisplayLabel()}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Presets */}
          <div className="border-r border-border p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick Select</p>
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "block w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                  selectedPreset === preset.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {preset.label}
              </button>
            ))}
            <div className="border-t border-border my-2 pt-2">
              <button
                onClick={() => setSelectedPreset("custom")}
                className={cn(
                  "block w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                  selectedPreset === "custom"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                Custom range
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              disabled={(date) =>
                date > new Date() || date < new Date("2020-01-01")
              }
              className={cn("p-0 pointer-events-auto")}
            />
            <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
              <p className="text-xs text-muted-foreground">
                {date?.from && date?.to && (
                  <>
                    {format(date.from, "MMM d, yyyy")} -{" "}
                    {format(date.to, "MMM d, yyyy")}
                  </>
                )}
              </p>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={!date?.from || !date?.to}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
