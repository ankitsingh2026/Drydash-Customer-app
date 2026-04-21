export const normalizeDigits = (phone: unknown) =>
  String(phone ?? "").replace(/\D/g, "");

export const buildPhoneCandidates = (phone: unknown) => {
  const digits = normalizeDigits(phone);
  if (!digits) return [] as string[];

  const candidates = new Set<string>();

  candidates.add(digits);

  if (digits.length === 10) {
    candidates.add(`91${digits}`);
  }

  if (digits.length > 10 && digits.startsWith("91")) {
    const withoutCountryCode = digits.slice(2);
    if (withoutCountryCode.length === 10) {
      candidates.add(withoutCountryCode);
    }
  }

  return Array.from(candidates).filter(Boolean);
};