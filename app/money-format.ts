export type MoneyUnit = "亿元" | "万元";

type MoneyFormatOptions = {
  unit?: MoneyUnit;
  /** Amounts below this many 亿元 are shown in 万元. */
  thresholdYi?: number;
};

export type MoneyDisplay = {
  value: string;
  unit: MoneyUnit;
  scaledValue: number;
};

function fractionDigits(value: number, unit: MoneyUnit) {
  const magnitude = Math.abs(value);
  if (unit === "万元") {
    if (Math.abs(value - Math.round(value)) < 1e-9 || magnitude >= 1_000) return 0;
    return magnitude >= 10 ? 1 : 2;
  }
  return 2;
}

/**
 * Formats an amount whose source unit is 亿元.
 *
 * A dashboard should not force tiny amounts into four decimal places. Values
 * below 0.1 亿元 therefore switch to 万元, while a chart can pass an explicit
 * unit so every bar stays on the same scale.
 */
export function formatMoneyFromYi(
  valueYi: number,
  options: MoneyFormatOptions = {},
): MoneyDisplay {
  if (!Number.isFinite(valueYi)) {
    return { value: "—", unit: options.unit ?? "亿元", scaledValue: Number.NaN };
  }

  const thresholdYi = options.thresholdYi ?? .1;
  const unit = options.unit ?? (Math.abs(valueYi) < thresholdYi ? "万元" : "亿元");
  const scaledValue = unit === "万元"
    ? Number((valueYi * 10_000).toFixed(6))
    : valueYi;
  const digits = fractionDigits(scaledValue, unit);
  const value = new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(scaledValue);

  return { value, unit, scaledValue };
}
