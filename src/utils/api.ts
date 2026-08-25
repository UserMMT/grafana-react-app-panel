import { getBackendSrv } from '@grafana/runtime';
import { QueryResult } from '../types';

/**
 * Generic API client for backend SQL queries
 * Replaces your getRequest() calls
 */
export class BackendQueryClient {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

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

    // Check cache
    if (cacheTime > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        return cached.data as T[];
      }
    }

    try {
      const response = await getBackendSrv().post('/api/plugins/call', {
        pluginId: 'grafana-react-app-panel',
        method: queryName,
        params,
      });

      const data = Array.isArray(response) ? response : response.data || [];

      // Cache result
      if (cacheTime > 0) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data as T[];
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
      // Clear specific query
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
