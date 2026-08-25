import { PanelPlugin } from '@grafana/data';
import { AppPanel } from './components/AppPanel';
import { AppPanelOptions } from './components/AppPanelOptions';
import { PanelOptions } from './types';

export const plugin = new PanelPlugin<PanelOptions>(AppPanel)
  .setPanelOptions((builder) =>
    builder
      .addTextOption({
        path: 'appName',
        name: 'App Name',
        description: 'Name of your React app',
        defaultValue: 'My React App',
      })
      .addTextOption({
        path: 'description',
        name: 'Description',
        description: 'Brief description of the app',
        defaultValue: '',
      })
      .addCustomEditor({
        path: 'appCode',
        name: 'Component Code',
        id: 'appCode',
        path: 'appCode',
        defaultValue: '',
        editor: AppPanelOptions,
      })
  );
