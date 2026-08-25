import React, { useState } from 'react';
import { PanelProps } from '@grafana/data';
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, Alert } from '@grafana/ui';
import { css } from '@emotion/css';
import { PanelOptions } from '../types';
import { CodeEditor } from './CodeEditor';
import { DynamicComponentRenderer } from './DynamicComponentRenderer';

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

  // Prepare external imports available to the component
  const externalImports = React.useMemo(() => {
    return {
      React,
      // Add more as needed: Button, Input, Tabs, etc.
    };
  }, []);

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
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'manage' | 'preview')}
        className={css`
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        `}
      >
        <TabsList className={css`
          border-bottom: 1px solid #eee;
          margin: 0;
          border-radius: 0;
        `}>
          <TabsTrigger value="preview">👁️ Preview</TabsTrigger>
          <TabsTrigger value="manage">✏️ Edit Code</TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent
          value="preview"
          className={css`
            flex: 1;
            overflow: auto;
            padding: 16px;
            margin: 0;
          `}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 12px;
              height: 100%;
            `}
          >
            {options.appCode ? (
              <DynamicComponentRenderer
                code={options.appCode}
                externalImports={externalImports}
                showErrors={true}
              />
            ) : (
              <Alert severity="info" title="No Code">
                Go to Edit Code tab and write your React component
              </Alert>
            )}
          </div>
        </TabsContent>

        {/* Edit Code Tab */}
        <TabsContent
          value="manage"
          className={css`
            flex: 1;
            overflow: auto;
            padding: 16px;
            margin: 0;
            display: flex;
            flex-direction: column;
          `}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 12px;
              flex: 1;
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
              <strong>💡 Tips:</strong>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
