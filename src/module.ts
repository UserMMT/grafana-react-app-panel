import { PanelPlugin } from '@grafana/data';
import { AppPanel } from './components/AppPanel';
import { QueryConfigEditor } from './components/QueryConfigEditor';
import { PanelOptions } from './types';

// Component code (appCode) is edited from the panel's own "Edit Code" tab
// (see AppPanel.tsx), not from the Grafana options side panel.
export const plugin = new PanelPlugin<PanelOptions>(AppPanel).setPanelOptions((builder) =>
  builder
    .addTextInput({
      path: 'appName',
      name: 'App Name',
      description: 'Name of your React app',
      defaultValue: 'My React App',
    })
    .addTextInput({
      path: 'description',
      name: 'Description',
      description: 'Brief description of the app',
      defaultValue: '',
    })
    .addTextInput({
      path: 'apiBaseUrl',
      name: 'API Base URL',
      description:
        'Required for useBackendQuery(): https:// base URL of the backend (http:// only for localhost). The API token you paste in the panel is stored per origin and only ever sent to this origin.',
      defaultValue: '',
    })
    .addCustomEditor({
      id: 'queryConfig',
      path: 'queryConfig',
      name: 'Backend Queries',
      description: 'JSON map of named SQL queries available to useBackendQuery()',
      defaultValue: {},
      editor: QueryConfigEditor,
    })
);
