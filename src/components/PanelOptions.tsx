import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { PanelOptions } from '../types';

/**
 * Panel configuration UI - shown in panel edit mode
 * Configure SQL queries, inputs, and app behavior here
 */
export const PanelOptions: React.FC<StandardEditorProps<any, any, PanelOptions>> = ({
  value,
  onChange,
}) => {
  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Query Configuration</label>
        <textarea
          defaultValue={JSON.stringify(value || {}, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.currentTarget.value));
            } catch (err) {
              console.error('Invalid JSON');
            }
          }}
          className="w-full h-40 p-2 border rounded font-mono text-xs"
          placeholder="{\n  \"TRESO_GET_DATE_TFJ_PREC\": {\n    \"name\": \"TRESO_GET_DATE_TFJ_PREC\",\n    \"sql\": \"SELECT * FROM table WHERE date = ${dateArrete}\",\n    \"inputs\": [\n      {\"name\": \"dateArrete\", \"type\": \"date\", \"source\": \"variable\"}\n    ]\n  }\n}"
        />
      </div>
      <p className="text-xs text-gray-500">
        Define your SQL queries and input mappings in JSON format
      </p>
    </div>
  );
};
