import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@grafana/ui';
import { useAppContext, AppContext } from './SimplePanel';
import { useBackendQuery } from '../utils/hooks';
import { BackendQueryClient } from '../utils/api';

/**
 * YOUR APP GOES HERE
 *
 * This is a template. Replace this with your React components:
 * - Import SecuritiesPortfolio3Manual
 * - Import PosexErQuotidien
 * - Add routing/tabs as needed
 */
export const App: React.FC = () => {
  const appContext = useAppContext();
  const queryClient = new BackendQueryClient();
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{appContext.options.appName}</h1>
        <p className="text-sm text-gray-500">Grafana React App Panel</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="example">Example</TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <div className="mt-4 p-4 border rounded">
            <h2 className="text-lg font-semibold mb-2">Welcome to {appContext.options.appName}</h2>
            <p className="text-sm text-gray-600 mb-4">
              This is your generic Grafana React app panel. Replace this component with your own app:
            </p>
            <ul className="text-sm space-y-2 text-gray-600">
              <li>✅ Import your SecuritiesPortfolio3Manual component</li>
              <li>✅ Import your PosexErQuotidien component</li>
              <li>✅ Use useBackendQuery() hook to fetch data (replaces getRequest)</li>
              <li>✅ Pass appContext to access queries and options</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="example">
          <ExampleComponent queryClient={queryClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Example component showing how to use backend queries
 */
function ExampleComponent({ queryClient }: { queryClient: BackendQueryClient }) {
  const { data, loading, error } = useBackendQuery(
    'EXAMPLE_QUERY',
    { dateArrete: new Date().toISOString().split('T')[0] },
    queryClient
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="mt-4 p-4 border rounded">
      <h3 className="font-semibold mb-2">Query Result:</h3>
      <pre className="bg-gray-100 p-2 text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
