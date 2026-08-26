const DEFAULT_API_BASE_URL = 'https://beta.sma-it.com/SMA_APP/API';
const AUTH_TOKEN_STORAGE_KEY = 'access_token';

/**
 * localStorage on THIS page's origin (wherever Grafana is served from) -
 * not the same storage bucket as cashflow-banque's own `access_token`
 * (different origin = different localStorage). Set once per browser via
 * setAuthToken() (see the prompt AppPanel shows when this is empty).
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    /* ignore */
  }
}

export function hasAuthToken(): boolean {
  return !!getAuthToken();
}

/**
 * Generic API client for backend SQL queries. Replaces your getRequest()
 * calls - talks directly to the same SMA_APP_SERVICES_API endpoint
 * (`/CustomData/getWithFilter?Request=...`) that cashflow-banque's own
 * getRequest() (src/hooks/useFetch.ts) already uses, instead of a
 * `/api/plugins/call` Grafana backend route that doesn't exist (this plugin
 * has no Go backend declared in plugin.json).
 *
 * Security note: the auth token lives in this page's localStorage only -
 * never in panel options, so it isn't written into exported dashboard JSON.
 * It IS still a real bearer token sitting in a browser tab anyone with edit
 * access to this panel can inspect/exfiltrate via pasted code, same as any
 * other client-side API key. Treat this as a dev/trial setup, not something
 * to hand a wide Grafana viewer audience without revisiting.
 */
export class BackendQueryClient {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  baseUrl: string = DEFAULT_API_BASE_URL;

  setBaseUrl(url: string) {
    if (url && url.trim()) {
      this.baseUrl = url.replace(/\/+$/, '');
    }
  }

  /**
   * Execute a named SQL query with parameters
   * @param queryName - Query identifier (e.g., 'TRESO_GET_DATE_TFJ_PREC')
   * @param params - Query parameters {DateArrete: '2024-01-15'}
   * @param cacheTime - Cache duration in ms (0 = no cache)
   */
  async executeQuery<T = any>(
    queryName: string,
    params: Record<string, any> = {},
    cacheTime: number = 0
  ): Promise<T[]> {
    const cacheKey = this.getCacheKey(queryName, params);

    if (cacheTime > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        return cached.data as T[];
      }
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('No SMA API token set for this browser - see the token prompt in the panel.');
    }

    // Same param shape the .NET endpoint expects everywhere in
    // cashflow-banque: an array of {name, value, type}, not the
    // {DateArrete: '...'} object useBackendQuery's callers pass.
    const paramArray = Object.entries(params).map(([name, value]) => ({
      name,
      value,
      type: 'string',
    }));

    try {
      const res = await fetch(`${this.baseUrl}/CustomData/getWithFilter?Request=${encodeURIComponent(queryName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paramArray),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const body = await res.json();
      const data: T[] = body?.success ? body.data?.data ?? [] : [];

      if (cacheTime > 0) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error(`Query '${queryName}' failed:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific query or all queries
   */
  clearCache(queryName?: string) {
    if (queryName) {
      for (const [key] of this.cache) {
        if (key.startsWith(queryName)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  private getCacheKey(queryName: string, params: Record<string, any>): string {
    return `${queryName}:${JSON.stringify(params)}`;
  }
}

/**
 * Singleton instance
 */
export const queryClient = new BackendQueryClient();
