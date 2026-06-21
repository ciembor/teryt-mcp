type Fetch = typeof fetch;

const requestTimeoutMs = 30_000;
const maxAttempts = 3;
const retryDelayMs = 250;

export async function fetchWithRetry(fetchFn: Fetch, input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(fetchFn, input, init);

      if (!isRetryableStatus(response.status) || attempt === maxAttempts) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < maxAttempts) {
      await delay(retryDelayMs * attempt);
    }
  }

  throw lastError;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function fetchWithTimeout(fetchFn: Fetch, input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetchFn(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, ms);
  });
}
