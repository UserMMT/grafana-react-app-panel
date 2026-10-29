import type { BackendQueryClient } from '../utils/api';

/**
 * Panel options - configure your app behavior
 */
export interface PanelOptions {
  appName: string;
  description?: string;
  appCode: string; // TSX/JSX code as string
  enableDataFetch?: boolean;
  enableTour?: boolean;
  queryConfig?: Record<string, QueryDefinition>;
  /** Backend base URL used by BackendQueryClient. Required for backend queries (https; http only for localhost) - there is no default. */
  apiBaseUrl?: string;
}

/**
 * Query definition - maps to backend SQL query
 */
export interface QueryDefinition {
  name: string; // Query identifier (e.g., 'TRESO_GET_DATE_TFJ_PREC')
  sql: string; // SQL query template with ${param} placeholders
  inputs: InputParam[]; // Input parameters from UI
  cacheTime?: number; // Cache results (ms)
}

/**
 * Input parameter - from panel options or user input
 */
export interface InputParam {
  name: string; // Parameter name
  type: 'string' | 'number' | 'date' | 'select';
  defaultValue?: any;
  label?: string;
  source?: 'static' | 'variable' | 'input'; // Where value comes from
}

/**
 * Query result - what backend returns
 */
export interface QueryResult {
  queryName: string;
  status: 'loading' | 'success' | 'error';
  data: any[];
  error?: string;
  timestamp: number;
}

/**
 * Shared app context - passed to your React app
 */
export interface AppContextData {
  options: PanelOptions;
  /** This panel's own client, bound to its API Base URL. */
  queryClient: BackendQueryClient;
  queries: Record<string, QueryResult>;
  executeQuery: (queryName: string, params: Record<string, any>) => Promise<any[]>;
  updateQuery: (queryName: string, result: any) => void;
  variables: Record<string, string>; // Grafana template variables
}
