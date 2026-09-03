export class DashboardRequestTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`请求超时（${timeoutMs}ms）`);
    this.name = "TimeoutError";
  }
}

export async function fetchWithTimeout(input, options = {}) {
  const {
    timeoutMs = 15_000,
    signal: externalSignal,
    ...requestOptions
  } = options;
  const abortController = new AbortController();
  let timedOut = false;
  const forwardAbort = () => abortController.abort(externalSignal?.reason);

  if (externalSignal?.aborted) {
    forwardAbort();
  } else {
    externalSignal?.addEventListener("abort", forwardAbort, { once: true });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    abortController.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...requestOptions,
      signal: abortController.signal,
    });
  } catch (error) {
    if (timedOut) throw new DashboardRequestTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", forwardAbort);
  }
}

export async function fetchJsonWithTimeout(input, options = {}) {
  const response = await fetchWithTimeout(input, options);
  if (!response.ok) throw new Error(`请求失败（${response.status}）`);
  return response.json();
}
