import { PanelPlugin } from '@grafana/data';
import { SimplePanel } from './components/SimplePanel';
import { PanelOptions } from './types';
import { PanelOptions as PanelOptionsEditor } from './components/PanelOptions';

export const plugin = new PanelPlugin<PanelOptions>(SimplePanel)
  .setPanelOptions((builder) =>
    builder
      .addTextOption({
        path: 'appName',
        name: 'App Name',
        description: 'Name/identifier of your React app',
        defaultValue: 'My App',
      })
      .addBooleanSwitch({
        path: 'enableDataFetch',
        name: 'Enable Backend Queries',
        description: 'Allow queries from configured datasources',
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'enableTour',
        name: 'Show Tour',
        description: 'Display page tour on load',
        defaultValue: false,
      })
      .addCustomEditor({
        path: 'queryConfig',
        name: 'Query Configuration',
        description: 'SQL queries and input mappings',
        defaultValue: {},
        editor: PanelOptionsEditor,
      })
  );
