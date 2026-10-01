import { describe, expect, it } from "vitest";
import { generateEventString, normalizeEventData, validateEventData, type EventData } from "./EventForm";

const validEvent: EventData = {
  title: "Year end, review",
  description: "Line one\nLine two",
  startDate: "2028-02-29",
  startTime: "23:00",
  endDate: "2028-03-01",
  endTime: "00:00",
  location: "Room 1; HQ",
};

describe("event date handling", () => {
  it("serializes a valid local event without throwing", () => {
    expect(() => generateEventString(validEvent)).not.toThrow();
    const value = generateEventString(validEvent);
    expect(value).toContain("BEGIN:VEVENT");
    expect(value).toContain("SUMMARY:Year end\\, review");
    expect(value).toContain("LOCATION:Room 1\\; HQ");
  });

  it.each([
    [{ ...validEvent, startDate: "" }, "missing date"],
    [{ ...validEvent, startDate: "2027-02-29" }, "invalid leap date"],
    [{ ...validEvent, startTime: "24:00" }, "invalid time"],
    [{ ...validEvent, endDate: validEvent.startDate, endTime: "22:59" }, "end before start"],
  ])("rejects %s safely", (candidate) => {
    expect(validateEventData(candidate as EventData).valid).toBe(false);
    expect(generateEventString(candidate as EventData)).toBe("");
  });

  it.each(["00:00", "23:59"])("accepts boundary time %s", (startTime) => {
    const candidate = { ...validEvent, startDate: "2028-12-31", startTime, endDate: "2029-01-01", endTime: "00:01" };
    expect(validateEventData(candidate).valid).toBe(true);
  });
  it("normalizes legacy names and ISO date-time values for edit", () => {
    const localParts = (value: string) => {
      const date = new Date(value); const pad = (part: number) => String(part).padStart(2,"0");
      return { date:`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`, time:`${pad(date.getHours())}:${pad(date.getMinutes())}` };
    };
    const start=localParts("2028-01-31T23:59:00Z"), end=localParts("2028-02-01T00:30:00Z");
    expect(normalizeEventData({eventTitle:"Legacy",startDate:"2028-01-31T23:59:00Z",endDate:"2028-02-01T00:30:00Z",venue:"HQ"})).toEqual({title:"Legacy",description:"",startDate:start.date,startTime:start.time,endDate:end.date,endTime:end.time,location:"HQ"});
  });
});
