import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Input } from '@grafana/ui';
import { css } from '@emotion/css';
import { PanelOptions } from '../types';

/**
 * Panel configuration editor - appears when editing panel settings
 */
export const AppPanelOptions: React.FC<
  StandardEditorProps<PanelOptions, any, any>
> = ({ value, onChange }) => {
  return (
    <div
      className={css`
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
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
          App Name
        </label>
        <Input
          type="text"
          value={value.appName || ''}
          onChange={(e) =>
            onChange({
              ...value,
              appName: e.currentTarget.value,
            })
          }
          placeholder="My React App"
        />
      </div>

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
          Description
        </label>
        <textarea
          value={value.description || ''}
          onChange={(e) =>
            onChange({
              ...value,
              description: e.currentTarget.value,
            })
          }
          placeholder="Describe your app here"
          className={css`
            width: 100%;
            min-height: 80px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
            font-size: 12px;
          `}
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
        <strong>ℹ️ How to use:</strong>
        <ul
          className={css`
            margin: 8px 0 0 0;
            padding-left: 20px;
          `}
        >
          <li>Go to "Edit Code" tab to write/edit your TSX component</li>
          <li>Your code will be saved automatically</li>
          <li>Switch to "Preview" to see the rendered component</li>
        </ul>
      </div>
    </div>
  );
};
