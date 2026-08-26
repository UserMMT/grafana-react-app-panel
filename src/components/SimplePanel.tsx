import React, { useEffect, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { Spinner, Alert } from '@grafana/ui';
import { PanelOptions, AppContextData } from '../types';
import { queryClient } from '../utils/api';
import { App } from './App';

interface Props extends PanelProps<PanelOptions> {}

/**
 * Generic panel wrapper that:
 * - Initializes your React app
 * - Manages backend queries
 * - Handles Grafana integration
 * - Passes data via context
 */
export const SimplePanel: React.FC<Props> = ({
  options,
  data,
  width,
  height,
  fieldConfig,
  replaceVariables,
}) => {
  const [appContext, setAppContext] = useState<AppContextData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize app context
    const context: AppContextData = {
      options,
      queries: {},
      executeQuery: async (queryName: string, params: Record<string, any>) => {
        try {
          const result = await queryClient.executeQuery(
            queryName,
            params,
            options.queryConfig?.[queryName]?.cacheTime || 0
          );
          return result;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Query failed');
          throw err;
        }
      },
      updateQuery: (queryName: string, result: any) => {
        setAppContext((prev) =>
          prev
            ? {
                ...prev,
                queries: {
                  ...prev.queries,
                  [queryName]: {
                    queryName,
                    status: 'success',
                    data: result,
                    timestamp: Date.now(),
                  },
                },
              }
            : null
        );
      },
      // Current value of every Grafana dashboard template variable, e.g.
      // { dateArrete: '2026-08-25' } for a $dateArrete variable.
      variables: Object.fromEntries(
        getTemplateSrv()
          .getVariables()
          .map((v) => [v.name, replaceVariables(`$${v.name}`)])
      ),
    };

    setAppContext(context);
  }, [options, replaceVariables]);

  if (!appContext) {
    return <Spinner />;
  }

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'auto',
        padding: '16px',
      }}
    >
      {error && <Alert severity="error" title="Error">{error}</Alert>}
      <AppContext.Provider value={appContext}>
        <App />
      </AppContext.Provider>
    </div>
  );
};

/**
 * Context for passing data to your app
 * Use: const context = useContext(AppContext)
 */
export const AppContext = React.createContext<AppContextData | null>(null);

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within SimplePanel');
  }
  return context;
}
