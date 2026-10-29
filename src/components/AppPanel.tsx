import React, { useState, useEffect, useMemo } from 'react';
import { PanelProps } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { TabsBar, Tab, TabContent, Button, Alert } from '@grafana/ui';
import { css } from '@emotion/css';
import { PanelOptions, AppContextData } from '../types';
import { CodeEditor } from './CodeEditor';
import { CodeTrustPrompt } from './CodeTrustPrompt';
import { DynamicComponentRenderer } from './DynamicComponentRenderer';
import { AppContext, useAppContext } from './SimplePanel';
import { useBackendQuery, useBackendQueryMutation } from '../utils/hooks';
import {
  BackendQueryClient,
  hasAuthToken,
  originOf,
  setAuthToken,
  withDefaultBaseUrl,
} from '../utils/api';
import { isCodeTrusted, sha256, trustCode } from '../utils/trust';

interface AppPanelProps extends PanelProps<PanelOptions> {}

/**
 * Main panel component that:
 * 1. Shows code editor (edit/manage TSX code)
 * 2. Shows live preview (render the component)
 * 3. Stores code in panel options
 * 4. Passes props and dependencies to rendered component
 */
export const AppPanel: React.FC<AppPanelProps> = ({ options, onOptionsChange, replaceVariables }) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'preview'>('preview');
  const [editCode, setEditCode] = useState(options.appCode || '');
  const [isSaved, setIsSaved] = useState(true);

  // The author saving code here is the one who wrote it: mark that exact code
  // as trusted for this browser so it doesn't prompt them for their own edit.
  const handleSaveCode = () => {
    trustCode(sha256(editCode));
    onOptionsChange({
      ...options,
      appCode: editCode,
    });
    setIsSaved(true);
  };

  // One client per panel, bound to this panel's API Base URL. (A shared
  // module-level client made panels with different URLs overwrite each other.)
  const client = useMemo(() => new BackendQueryClient(options.apiBaseUrl), [options.apiBaseUrl]);
  const apiOrigin = client.baseUrl ? originOf(client.baseUrl) : null;
  const apiBaseUrlInvalid = !!options.apiBaseUrl?.trim() && !client.baseUrl;

  // Token lives in this Grafana origin's localStorage only (never in panel
  // options / dashboard JSON), scoped to the API origin - see utils/api.ts.
  const [tokenInput, setTokenInput] = useState('');
  // Token and approval are read from localStorage on every render (cheap);
  // this just re-renders right after Save / Trust without a reload.
  const [, refreshStoredState] = useState(0);
  const tokenPresent = hasAuthToken(client.baseUrl);

  // Approval is keyed by the saved code's hash, so the prompt reappears
  // whenever anyone edits the code (see utils/trust.ts).
  const codeHash = useMemo(() => sha256(options.appCode || ''), [options.appCode]);
  const codeTrusted = isCodeTrusted(codeHash);

  // Same context shape SimplePanel builds - pasted code calling useAppContext()
  // (per the README's migration example) needs a real Provider above it, not
  // just the hook definition existing somewhere in the bundle.
  const [appContext, setAppContext] = useState<AppContextData | null>(null);
  useEffect(() => {
    setAppContext({
      options,
      queryClient: client,
      queries: {},
      executeQuery: (queryName, params) =>
        client.executeQuery(queryName, params, options.queryConfig?.[queryName]?.cacheTime || 0),
      updateQuery: () => {},
      variables: Object.fromEntries(
        getTemplateSrv()
          .getVariables()
          .map((v) => [v.name, replaceVariables(`$${v.name}`)])
      ),
    });
  }, [options, replaceVariables, client]);

  // Extra modules the pasted TSX is allowed to `import` from, on top of the
  // built-in `react` / `@emotion/css` (see DynamicComponentRenderer). Module
  // specifiers here are arbitrary strings (there is no real resolver, just
  // this lookup table) - pasted code does
  // `import { useBackendQuery, useAppContext } from 'app-panel/hooks'`.
  const externalImports = useMemo(
    () => ({
      'app-panel/hooks': { useBackendQuery, useBackendQueryMutation, useAppContext },
      'app-panel/api': { queryClient: client, BackendQueryClient: withDefaultBaseUrl(client.baseUrl) },
    }),
    [client]
  );

  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #fff;
        overflow: hidden;
      `}
    >
      {/* Header */}
      <div
        className={css`
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        `}
      >
        <div>
          <h2
            className={css`
              margin: 0;
              font-size: 16px;
              font-weight: 600;
            `}
          >
            {options.appName || 'React App Panel'}
          </h2>
          <p
            className={css`
              margin: 4px 0 0 0;
              font-size: 12px;
              color: #666;
            `}
          >
            {!isSaved && '⚠️ Unsaved changes'}
          </p>
        </div>
        {activeTab === 'manage' && !isSaved && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveCode}
          >
            💾 Save Code
          </Button>
        )}
      </div>

      {/* Tabs */}
      <TabsBar>
        <Tab
          label="Preview"
          active={activeTab === 'preview'}
          onChangeTab={() => setActiveTab('preview')}
        />
        <Tab
          label="Edit Code"
          active={activeTab === 'manage'}
          onChangeTab={() => setActiveTab('manage')}
        />
      </TabsBar>

      <TabContent
        className={css`
          flex: 1;
          overflow: auto;
          padding: 16px;
        `}
      >
        {activeTab === 'preview' && (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 12px;
              height: 100%;
            `}
          >
            {apiBaseUrlInvalid && (
              <Alert severity="warning" title="Invalid API Base URL">
                The API Base URL in the panel options must be an https:// URL (http:// is only accepted for localhost).
                Backend queries are disabled until it is fixed.
              </Alert>
            )}
            {apiOrigin && !tokenPresent && (
              <div
                className={css`
                  border: 1px solid #d0e8ff;
                  background: #f0f7ff;
                  border-radius: 4px;
                  padding: 12px;
                  display: flex;
                  gap: 8px;
                  align-items: center;
                  flex-wrap: wrap;
                `}
              >
                <span className={css`font-size: 12px; color: #003f8f;`}>
                  No API token stored for <code>{apiOrigin}</code> in this browser. Paste one to let{' '}
                  <code>useBackendQuery()</code> reach real data (kept locally, never in the dashboard, and only ever
                  sent to <code>{apiOrigin}</code>):
                </span>
                <input
                  type="password"
                  placeholder="Bearer token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className={css`
                    flex: 1;
                    min-width: 200px;
                    padding: 6px 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                  `}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (client.baseUrl && tokenInput.trim()) {
                      setAuthToken(client.baseUrl, tokenInput.trim());
                      setTokenInput('');
                      refreshStoredState((n) => n + 1);
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            )}
            {options.appCode && appContext && !codeTrusted ? (
              <CodeTrustPrompt
                code={options.appCode}
                onTrust={() => {
                  trustCode(codeHash);
                  refreshStoredState((n) => n + 1);
                }}
              />
            ) : options.appCode && appContext ? (
              <AppContext.Provider value={appContext}>
                <DynamicComponentRenderer
                  code={options.appCode}
                  externalImports={externalImports}
                  showErrors={true}
                />
              </AppContext.Provider>
            ) : (
              <Alert severity="info" title="No Code">
                Go to Edit Code tab and write your React component
              </Alert>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 12px;
            `}
          >
            <div>
              <label
                className={css`
                  display: block;
                  font-size: 12px;
                  font-weight: 600;
                  margin-bottom: 8px;
                  color: #333;
                `}
              >
                Component Code (TSX/JSX)
              </label>
              <CodeEditor
                value={editCode}
                onChange={(code) => {
                  setEditCode(code);
                  setIsSaved(false);
                }}
                language="tsx"
                height={400}
                showPreview={false}
              />
            </div>

            <div
              className={css`
                background: #f0f7ff;
                border: 1px solid #d0e8ff;
                border-radius: 4px;
                padding: 12px;
                font-size: 12px;
                color: #003f8f;
              `}
            >
              <strong>Tips:</strong>
              <ul
                className={css`
                  margin: 8px 0 0 0;
                  padding-left: 20px;
                `}
              >
                <li>Use <code>export default</code> for your component</li>
                <li>React is automatically available as <code>React</code></li>
                <li>Upload .tsx/.jsx files using the upload button</li>
                <li>Click Save to persist the code in panel options</li>
              </ul>
            </div>
          </div>
        )}
      </TabContent>
    </div>
  );
};
