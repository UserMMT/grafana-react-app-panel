import React, { useState, useCallback } from 'react';
import { Button, Alert, TabsBar, Tab, TabContent } from '@grafana/ui';
import { css } from '@emotion/css';
import { DynamicComponentRenderer } from './DynamicComponentRenderer';

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  language?: 'tsx' | 'jsx' | 'html';
  height?: number;
  readOnly?: boolean;
  showPreview?: boolean;
}

/**
 * TSX/JSX Code Editor with syntax highlighting and preview
 *
 * Features:
 * - Live preview of React components (via DynamicComponentRenderer)
 * - File upload support
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'tsx',
  height = 400,
  readOnly = false,
  showPreview = true,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onChange(content);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
    },
    [onChange]
  );

  const editorTextarea = (
    <textarea
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      readOnly={readOnly}
      spellCheck={false}
      className={css`
        width: 100%;
        height: ${height}px;
        padding: 12px;
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.5;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #f5f5f5;
        color: #333;
        resize: vertical;

        &:focus {
          outline: none;
          border-color: #0078d4;
          box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
        }
      `}
    />
  );

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 12px;
      `}
    >
      {/* Toolbar */}
      <div
        className={css`
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        `}
      >
        <label>
          <input
            type="file"
            accept=".tsx,.jsx,.ts,.js"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              const input = e.currentTarget.parentElement?.querySelector('input[type="file"]');
              (input as HTMLInputElement)?.click();
            }}
          >
            Upload File
          </Button>
        </label>
        <span
          className={css`
            font-size: 12px;
            color: #999;
            margin-left: auto;
          `}
        >
          Language: {language}
        </span>
      </div>

      {error && (
        <Alert severity="error" title="File Upload Error">
          {error}
        </Alert>
      )}

      {showPreview ? (
        <>
          <TabsBar>
            <Tab label="Editor" active={activeTab === 'editor'} onChangeTab={() => setActiveTab('editor')} />
            <Tab label="Preview" active={activeTab === 'preview'} onChangeTab={() => setActiveTab('preview')} />
          </TabsBar>

          <TabContent>
            {activeTab === 'editor' && editorTextarea}

            {activeTab === 'preview' && (
              <div
                className={css`
                  height: ${height}px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                  background: #fff;
                  overflow: auto;
                  padding: 16px;
                `}
              >
                <DynamicComponentRenderer code={value} showErrors={true} />
              </div>
            )}
          </TabContent>
        </>
      ) : (
        editorTextarea
      )}
    </div>
  );
};
