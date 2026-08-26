import React, { useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Alert } from '@grafana/ui';
import { QueryDefinition } from '../types';

const PLACEHOLDER = JSON.stringify(
  {
    TRESO_GET_DATE_TFJ_PREC: {
      name: 'TRESO_GET_DATE_TFJ_PREC',
      sql: 'SELECT * FROM table WHERE date = ${dateArrete}',
      inputs: [{ name: 'dateArrete', type: 'date', source: 'variable' }],
    },
  },
  null,
  2
);

/**
 * Editor for the `queryConfig` panel option: a JSON map of named SQL query
 * definitions that `useBackendQuery()` looks up by name at runtime.
 */
export const QueryConfigEditor: React.FC<StandardEditorProps<Record<string, QueryDefinition>>> = ({
  value,
  onChange,
}) => {
  const [text, setText] = useState(() => JSON.stringify(value || {}, null, 2));
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => {
          const next = e.currentTarget.value;
          setText(next);
          try {
            onChange(next.trim() ? JSON.parse(next) : {});
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON');
          }
        }}
        rows={16}
        className="w-full p-2 border rounded font-mono text-xs"
        placeholder={PLACEHOLDER}
      />
      {error && (
        <Alert severity="error" title="Invalid JSON">
          {error}
        </Alert>
      )}
    </div>
  );
};
