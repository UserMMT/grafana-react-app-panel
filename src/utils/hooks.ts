import { useEffect, useState, useCallback } from 'react';
import { BackendQueryClient } from './api';
import { QueryResult } from '../types';

/**
 * Hook to fetch data from backend SQL queries
 * Replaces your getRequest() pattern
 *
 * @example
 * const { data, loading, error } = useBackendQuery('TRESO_GET_DATE_TFJ_PREC', {
 *   DateArrete: dateArrete,
 * });
 */
export function useBackendQuery<T = any>(
  queryName: string,
  params: Record<string, any> = {},
  queryClient: BackendQueryClient,
  cacheTime: number = 0
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await queryClient.executeQuery<T>(queryName, params, cacheTime);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setData([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [queryName, JSON.stringify(params), queryClient, cacheTime]);

  return { data, loading, error };
}

/**
 * Hook for manual query execution
 * Use when you need to trigger queries on demand (button click, form submit, etc.)
 */
export function useBackendQueryMutation(
  queryClient: BackendQueryClient
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async <T = any>(
      queryName: string,
      params: Record<string, any> = {},
      cacheTime?: number
    ): Promise<T[]> => {
      setLoading(true);
      setError(null);

      try {
        const result = await queryClient.executeQuery<T>(queryName, params, cacheTime);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [queryClient]
  );

  return { mutate, loading, error };
}
