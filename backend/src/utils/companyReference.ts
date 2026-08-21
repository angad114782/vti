/** Stable human-facing reference. The Mongo id remains the canonical identifier. */
export const getCompanyReference = (id: unknown, companyCode?: string | null): string => {
  if (companyCode) return companyCode;
  const raw = typeof id === 'string' ? id : (id as { toString(): string })?.toString();
  return raw ? `CMP-${raw.slice(-8).toUpperCase()}` : 'CMP-UNKNOWN';
};
