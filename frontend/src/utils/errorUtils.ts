export function extractError(err: unknown, fallback = 'Something went wrong'): string {
  if (typeof err !== 'object' || err === null) return fallback;
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message ?? e.message ?? fallback;
}
