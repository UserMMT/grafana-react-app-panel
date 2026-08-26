import React, { useState, useEffect } from 'react';
import { PanelProps } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { TabsBar, Tab, TabContent, Button, Alert } from '@grafana/ui';
import { css } from '@emotion/css';
import { PanelOptions, AppContextData } from '../types';
import { CodeEditor } from './CodeEditor';
import { DynamicComponentRenderer } from './DynamicComponentRenderer';
import { AppContext, useAppContext } from './SimplePanel';
import { useBackendQuery, useBackendQueryMutation } from '../utils/hooks';
import { queryClient, BackendQueryClient, hasAuthToken, setAuthToken } from '../utils/api';

interface AppPanelProps extends PanelProps<PanelOptions> {}

/**
 * Main panel component that:
 * 1. Shows code editor (edit/manage TSX code)
 * 2. Shows live preview (render the component)
 * 3. Stores code in panel options
 * 4. Passes props and dependencies to rendered component
 */
export const AppPanel: React.FC<AppPanelProps> = ({
  options,
  onOptionsChange,
  width,
  height,
  replaceVariables,
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'preview'>('preview');
  const [editCode, setEditCode] = useState(options.appCode || '');
  const [isSaved, setIsSaved] = useState(true);

  // Save code to panel options
  const handleSaveCode = () => {
    onOptionsChange({
      ...options,
      appCode: editCode,
    });
    setIsSaved(true);
  };

  // BackendQueryClient talks straight to the SMA API (see utils/api.ts) -
  // apiBaseUrl is an optional override, blank uses the built-in default.
  useEffect(() => {
    if (options.apiBaseUrl) {
      queryClient.setBaseUrl(options.apiBaseUrl);
    }
  }, [options.apiBaseUrl]);

  // Token lives in this Grafana origin's localStorage only (never in panel
  // options / dashboard JSON) - see utils/api.ts. Re-checked each render so
  // the prompt below disappears right after Save without a reload.
  const [tokenPresent, setTokenPresent] = useState(hasAuthToken());
  const [tokenInput, setTokenInput] = useState('');

  // Same context shape SimplePanel builds - pasted code calling useAppContext()
  // (per the README's migration example) needs a real Provider above it, not
  // just the hook definition existing somewhere in the bundle.
  const [appContext, setAppContext] = useState<AppContextData | null>(null);
  useEffect(() => {
    setAppContext({
      options,
      queries: {},
      executeQuery: (queryName, params) =>
        queryClient.executeQuery(queryName, params, options.queryConfig?.[queryName]?.cacheTime || 0),
      updateQuery: () => {},
      variables: Object.fromEntries(
        getTemplateSrv()
          .getVariables()
          .map((v) => [v.name, replaceVariables(`$${v.name}`)])
      ),
    });
  }, [options, replaceVariables]);

  // Extra modules the pasted TSX is allowed to `import` from, on top of the
  // built-in `react` / `@emotion/css` (see DynamicComponentRenderer). Module
  // specifiers here are arbitrary strings (the sandbox has no real resolver,
  // just this lookup table) - pasted code does
  // `import { useBackendQuery, useAppContext } from 'app-panel/hooks'`.
  const externalImports = React.useMemo(
    () => ({
      'app-panel/hooks': { useBackendQuery, useBackendQueryMutation, useAppContext },
      'app-panel/api': { queryClient, BackendQueryClient },
    }),
    []
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
            {!tokenPresent && (
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
                  No SMA API token set for this browser (stored locally, not in the dashboard) - paste one to let{' '}
                  <code>useBackendQuery()</code> reach real data:
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
                    if (tokenInput.trim()) {
                      setAuthToken(tokenInput.trim());
                      setTokenInput('');
                      setTokenPresent(true);
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            )}
            {options.appCode && appContext ? (
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
