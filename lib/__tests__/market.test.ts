import { describe, expect, it } from "vitest";
import {
  assessChallenge,
  blendChartSeries,
  changePct,
  chartSeriesFromBars,
  compactMoney,
  mccLabel,
  normalizeCloses,
  seriesFor,
} from "../market";
import type { BarsResponse, PendingChallenge } from "../types";

// assessChallenge drives the FurlPay Protect verdict shown on 3DS2 approval
// cards — the copy a user reads before approving or declining a real charge.
// Its decision table is small and MUST stay pinned.

type ChallengeOverrides = Omit<Partial<PendingChallenge>, "merchant"> & {
  merchant?: Partial<PendingChallenge["merchant"]>;
};

function challenge(over: ChallengeOverrides = {}): PendingChallenge {
  const { merchant, ...rest } = over;
  return {
    id: "ch_1",
    amountUsd: 42.5,
    currency: "usd",
    merchant: { name: "Blue Bottle", city: "Oakland", country: "US", mcc: "5814", ...merchant },
    cardId: "card_000004521",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    ...rest,
  };
}

describe("assessChallenge", () => {
  it("flags every risky MCC as high risk, regardless of amount or location", () => {
    for (const mcc of ["5967", "6051", "7995", "7273"]) {
      const verdict = assessChallenge(challenge({ amountUsd: 5, merchant: { mcc } }));
      expect(verdict.level).toBe("high");
      expect(verdict.label).toBe("High risk");
    }
  });

  it("risky MCC outranks the large-amount rule (checked first)", () => {
    const verdict = assessChallenge(challenge({ amountUsd: 5000, merchant: { mcc: "7995" } }));
    expect(verdict.level).toBe("high");
  });

  it("$750 is the review threshold — inclusive", () => {
    expect(assessChallenge(challenge({ amountUsd: 749.99 })).level).toBe("safe");
    expect(assessChallenge(challenge({ amountUsd: 750 })).level).toBe("review");
    expect(assessChallenge(challenge({ amountUsd: 750 })).reason).toMatch(/Large amount/);
  });

  it("missing location downgrades to review", () => {
    const verdict = assessChallenge(
      challenge({ merchant: { city: undefined, country: undefined } }),
    );
    expect(verdict.level).toBe("review");
    expect(verdict.reason).toMatch(/location/);
  });

  it("city alone or country alone counts as a location", () => {
    expect(assessChallenge(challenge({ merchant: { country: undefined } })).level).toBe("safe");
    expect(assessChallenge(challenge({ merchant: { city: undefined } })).level).toBe("safe");
  });

  it("normal purchase reads safe", () => {
    const verdict = assessChallenge(challenge());
    expect(verdict.level).toBe("safe");
    expect(verdict.label).toBe("Looks safe");
  });
});

describe("market utilities", () => {
  it("seriesFor is deterministic per seed and differs across seeds", () => {
    const a1 = seriesFor("USDC:arbitrum", "1D", 0.2);
    const a2 = seriesFor("USDC:arbitrum", "1D", 0.2);
    const b = seriesFor("ETH:ethereum", "1D", 0.2);
    expect(a1).toEqual(a2);
    expect(a1).not.toEqual(b);
    expect(a1.length).toBeGreaterThan(2);
  });

  it("changePct reports the first→last percentage move", () => {
    expect(changePct([100, 110])).toBeCloseTo(10);
    expect(changePct([100, 95])).toBeCloseTo(-5);
    // Pinned current behavior: empty series yields NaN — callers guard with
    // `series.length ? changePct(series) : 0` (see WalletTab).
    expect(Number.isNaN(changePct([]))).toBe(true);
  });

  it("normalizeCloses rebases a series to 1.0", () => {
    const n = normalizeCloses([200, 220, 180]);
    expect(n[0]).toBeCloseTo(1);
    expect(n[1]).toBeCloseTo(1.1);
    expect(n[2]).toBeCloseTo(0.9);
  });

  it("compactMoney abbreviates like the Earn TVL pills expect", () => {
    expect(compactMoney(950)).toMatch(/950/);
    expect(compactMoney(1_500_000)).toMatch(/1\.5\s?M|\$1\.5M/i);
  });

  it("mccLabel maps known codes and returns null for unknown", () => {
    expect(mccLabel("7995")).toBeTruthy();
    expect(mccLabel("0000")).toBeNull();
    expect(mccLabel(undefined)).toBeNull();
  });
});

describe("wallet chart data sources", () => {
  const fallback = seriesFor("ETH:arbitrum", "1D", 0.04);

  function bars(...closes: number[]): BarsResponse {
    return { candles: closes.map((close, time) => ({ time, open: close, high: close, low: close, close })) };
  }

  it("keeps normalized market bars unlabelled when the feed succeeds", () => {
    expect(chartSeriesFromBars(bars(100, 120), fallback)).toEqual({
      series: [1, 1.2],
      hasSyntheticData: false,
    });
  });

  it.each([null, bars(), bars(100), bars(1, 100)])("marks the fallback when bars are unusable (%j)", (response) => {
    expect(chartSeriesFromBars(response, fallback)).toEqual({ series: fallback, hasSyntheticData: true });
  });

  it("marks a portfolio that blends market bars with a weighted fallback", () => {
    const market = chartSeriesFromBars(bars(100, 120), fallback);
    const synthetic = chartSeriesFromBars(null, fallback);
    expect(blendChartSeries([{ ...market, weight: 1 }, { ...synthetic, weight: 1 }]).hasSyntheticData).toBe(true);
    expect(blendChartSeries([{ ...market, weight: 1 }, { ...synthetic, weight: 0 }]).hasSyntheticData).toBe(false);
    expect(blendChartSeries([]).hasSyntheticData).toBe(false);
  });
});
