import { describe, it, expect } from "vitest";
import {
  computeResidencePeriodCheck,
  toMonth,
} from "../../domain/value-objects/residence-period-check";

describe("computeResidencePeriodCheck", () => {
  it("returns WARNING when contract end month is after residence expiry (2027-07 > 2026-12)", () => {
    const result = computeResidencePeriodCheck({
      residenceExpiryMonth: "2026-12",
      contractEndDate: "2027-07-31",
    });
    expect(result.status).toBe("WARNING");
    expect(result.residenceExpiryMonth).toBe("2026-12");
    expect(result.contractEndMonth).toBe("2027-07");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("returns OK when contract end month is before residence expiry", () => {
    const result = computeResidencePeriodCheck({
      residenceExpiryMonth: "2027-12",
      contractEndDate: "2027-07-31",
    });
    expect(result.status).toBe("OK");
    expect(result.contractEndMonth).toBe("2027-07");
    expect(result.residenceExpiryMonth).toBe("2027-12");
  });

  it("returns OK when contract end month equals residence expiry (boundary, <=)", () => {
    const result = computeResidencePeriodCheck({
      residenceExpiryMonth: "2027-07",
      contractEndDate: "2027-07-31",
    });
    expect(result.status).toBe("OK");
  });

  it("returns UNKNOWN when residence expiry is missing", () => {
    const result = computeResidencePeriodCheck({
      contractEndDate: "2027-07-31",
    });
    expect(result.status).toBe("UNKNOWN");
    expect(result.residenceExpiryMonth).toBeUndefined();
    expect(result.contractEndMonth).toBe("2027-07");
  });

  it("returns UNKNOWN when contract end date is missing", () => {
    const result = computeResidencePeriodCheck({
      residenceExpiryMonth: "2026-12",
    });
    expect(result.status).toBe("UNKNOWN");
    expect(result.contractEndMonth).toBeUndefined();
  });

  it("returns UNKNOWN when both are missing", () => {
    const result = computeResidencePeriodCheck({});
    expect(result.status).toBe("UNKNOWN");
  });

  it("accepts a residence expiry already in YYYY-MM form", () => {
    const result = computeResidencePeriodCheck({
      residenceExpiryMonth: "2026-12",
      contractEndDate: "2026-11-30",
    });
    expect(result.status).toBe("OK");
    expect(result.contractEndMonth).toBe("2026-11");
  });
});

describe("toMonth", () => {
  it("extracts YYYY-MM from a full date", () => {
    expect(toMonth("2027-07-31")).toBe("2027-07");
  });
  it("passes through a YYYY-MM value", () => {
    expect(toMonth("2026-12")).toBe("2026-12");
  });
  it("returns undefined for undefined or malformed input", () => {
    expect(toMonth(undefined)).toBeUndefined();
    expect(toMonth("nope")).toBeUndefined();
  });
});
