type MetricBucket = { count: number; failures: number; totalMs: number; maxMs: number };

const requestMetrics: MetricBucket = { count: 0, failures: 0, totalMs: 0, maxMs: 0 };
const mutationMetrics: MetricBucket = { count: 0, failures: 0, totalMs: 0, maxMs: 0 };
const workflowMetrics: MetricBucket = { count: 0, failures: 0, totalMs: 0, maxMs: 0 };
const payrollMetrics: MetricBucket = { count: 0, failures: 0, totalMs: 0, maxMs: 0 };

function record(bucket: MetricBucket, statusCode: number, durationMs: number): void {
  bucket.count += 1;
  if (statusCode >= 400) bucket.failures += 1;
  bucket.totalMs += durationMs;
  bucket.maxMs = Math.max(bucket.maxMs, durationMs);
}

export function recordRequest(method: string, path: string, statusCode: number, durationMs: number): void {
  record(requestMetrics, statusCode, durationMs);
  const mutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  if (mutation) record(mutationMetrics, statusCode, durationMs);
  if (mutation && (path.includes('/actions') || path.includes('/leaves/') || path.includes('/employees/'))) {
    record(workflowMetrics, statusCode, durationMs);
  }
  if (mutation && path.includes('/payroll')) record(payrollMetrics, statusCode, durationMs);
}

function snapshot(bucket: MetricBucket) {
  return {
    count: bucket.count,
    failures: bucket.failures,
    averageMs: bucket.count ? Number((bucket.totalMs / bucket.count).toFixed(2)) : 0,
    maxMs: Number(bucket.maxMs.toFixed(2)),
  };
}

export function getMetrics() {
  return {
    requests: snapshot(requestMetrics),
    mutations: snapshot(mutationMetrics),
    workflows: snapshot(workflowMetrics),
    payroll: snapshot(payrollMetrics),
  };
}
