import { test, expect } from "@playwright/test";
import { fromZonedInput, toZonedInput } from "../src/lib/timezone";

test("event wall times round-trip through UTC without depending on the server zone", () => {
  for (const [zone, wall, utc] of [["Asia/Kolkata", "2027-02-14T18:30", "2027-02-14T13:00:00.000Z"], ["America/New_York", "2027-07-14T18:30", "2027-07-14T22:30:00.000Z"], ["Asia/Kathmandu", "2027-02-14T18:30", "2027-02-14T12:45:00.000Z"]]) {
    expect(fromZonedInput(wall, zone)).toEqual({ value: utc });
    expect(toZonedInput(utc, zone)).toBe(wall);
  }
});

test("impossible dates, DST gaps and repeated hours receive explicit errors", () => {
  expect(fromZonedInput("2027-02-29T18:30", "Asia/Kolkata").error).toBeTruthy();
  expect(fromZonedInput("2027-03-14T02:30", "America/New_York").error).toContain("skipped");
  expect(fromZonedInput("2027-11-07T01:30", "America/New_York").error).toContain("twice");
  expect(fromZonedInput("2027-03-14T03:30", "America/New_York").value).toBe("2027-03-14T07:30:00.000Z");
  expect(fromZonedInput("2027-03-14T03:30", "Invalid/Zone").error).toBeTruthy();
});
