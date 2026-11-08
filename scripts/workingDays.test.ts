import { test, expect } from "bun:test";
import { addWorkingDays, easterSunday, isWorkingDay, nextWorkingDay, onOrNextWorkingDay, warsawToday, dateShortcut, isContactTime } from "../src/lib/workingDays";

test("9 November 2026 is a working Monday", () => expect(isWorkingDay("2026-11-09")).toBe(true));
test("Saturday is not working", () => expect(isWorkingDay("2026-11-07")).toBe(false));
test("Sunday is not working", () => expect(isWorkingDay("2026-11-08")).toBe(false));
for (const date of ["2026-01-01", "2026-01-06", "2026-05-01", "2027-05-03", "2028-08-15", "2027-11-01", "2026-11-11", "2026-12-24", "2026-12-25", "2028-12-26"]) {
  test(`Statutory holiday ${date} is not working`, () => expect(isWorkingDay(date)).toBe(false));
}
test("Easter 2026 is April 5", () => expect(easterSunday(2026)).toBe("2026-04-05"));
test("Easter Monday is April 6 2026", () => expect(isWorkingDay("2026-04-06")).toBe(false));
test("Corpus Christi is June 4 2026", () => expect(isWorkingDay("2026-06-04")).toBe(false));
test("Mobile Easter dates in 2027", () => expect(nextWorkingDay("2027-03-26")).toBe("2027-03-30"));
test("Next day skips Independence Day", () => expect(nextWorkingDay("2026-11-10")).toBe("2026-11-12"));
test("Current working date remains unchanged", () => expect(onOrNextWorkingDay("2026-11-09")).toBe("2026-11-09"));
test("Sunday moves forward", () => expect(onOrNextWorkingDay("2026-11-08")).toBe("2026-11-09"));
test("Five working days from November 9 skips holiday and weekend", () => expect(addWorkingDays("2026-11-09", 5)).toBe("2026-11-17"));
test("Month boundary", () => expect(nextWorkingDay("2026-10-30")).toBe("2026-11-02"));
test("Year boundary", () => expect(nextWorkingDay("2026-12-31")).toBe("2027-01-04"));
test("Christmas Eve and Christmas weekend", () => expect(nextWorkingDay("2026-12-23")).toBe("2026-12-28"));
test("Warsaw calendar differs from UTC at midnight", () => expect(warsawToday(new Date("2026-11-08T23:30:00Z"))).toBe("2026-11-09"));
test("Warsaw daylight saving calendar", () => expect(warsawToday(new Date("2026-06-01T22:30:00Z"))).toBe("2026-06-02"));
test("Tomorrow working shortcut", () => expect(dateShortcut("tomorrow", "2026-11-10")).toBe("2026-11-12"));
test("Two working days shortcut", () => expect(dateShortcut("two", "2026-11-09")).toBe("2026-11-12"));
test("Five working days shortcut", () => expect(dateShortcut("five", "2026-11-09")).toBe("2026-11-17"));
test("One week shortcut is calendar week moved forward", () => expect(dateShortcut("week", "2026-11-04")).toBe("2026-11-12"));
test("Contact starts at Warsaw 9", () => expect(isContactTime(new Date("2026-11-09T08:00:00Z"))).toBe(true));
test("Contact not allowed before Warsaw 9", () => expect(isContactTime(new Date("2026-11-09T07:59:00Z"))).toBe(false));
test("Contact ends at Warsaw 17", () => expect(isContactTime(new Date("2026-11-09T16:00:00Z"))).toBe(false));
test("No contact on holiday within usual hours", () => expect(isContactTime(new Date("2026-11-11T10:00:00Z"))).toBe(false));