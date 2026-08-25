# Grafana React App Panel

A generic Grafana panel plugin that lets you embed full-featured React applications with multi-page navigation, complex state management, and backend SQL query integration.

## Features

✅ **Full React App Support** - Embed any React component with multi-page navigation
✅ **Backend SQL Queries** - Execute SQL queries defined in panel config
✅ **Data Fetching** - Replace `getRequest()` calls with `useBackendQuery()` hook
✅ **State Management** - Share state between pages via context
✅ **Caching** - Built-in query result caching
✅ **Grafana Integration** - Access variables, datasources, and Grafana APIs

## Installation

```bash
# Clone this template
git clone https://github.com/UserMMT/grafana-react-app-panel.git
cd grafana-react-app-panel

# Install dependencies
npm install

# Build plugin
npm run build

# Copy to Grafana plugins directory
cp -r dist /var/lib/grafana/plugins/grafana-react-app-panel

# Restart Grafana
sudo systemctl restart grafana-server
```

## Usage

### 1. Replace the App Component

**src/components/App.tsx**

```typescript
import { useAppContext } from './SimplePanel';
import { useBackendQuery } from '../utils/hooks';
import SecuritiesPortfolio3Manual from './treasury/SecuritiesPortfolio3Manual';
import PosexErQuotidien from './reporting/PosexErQuotidien';

export const App: React.FC = () => {
  const appContext = useAppContext();
  const [activeTab, setActiveTab] = useState('securities');

  return (
    <div className="p-4 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="securities">Securities</TabsTrigger>
          <TabsTrigger value="posex">POSEX</TabsTrigger>
        </TabsList>

        <TabsContent value="securities">
          <SecuritiesPortfolio3Manual />
        </TabsContent>
        
        <TabsContent value="posex">
          <PosexErQuotidien />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### 2. Replace `getRequest()` with `useBackendQuery()`

**Before (your code)**
```typescript
useEffect(() => {
  let alive = true;
  getRequest("TRESO_GET_DATE_TFJ_PREC", [{ "name": "DateArrete", "value": dateArrete, "type": "string" }])
    .then(Mydata => {
      if (alive && Mydata.length > 0) {
        setDateArretePrecedent(new Date(Mydata[0].DCO).toISOString().split("T")[0]);
      }
    })
    .catch(() => {});
  return () => { alive = false; };
}, [dateArrete]);
```

**After (using plugin)**
```typescript
import { useBackendQuery } from '@/utils/hooks';
import { useAppContext } from './SimplePanel';

const appContext = useAppContext();
const queryClient = new BackendQueryClient();

const { data: myData, loading, error } = useBackendQuery(
  'TRESO_GET_DATE_TFJ_PREC',
  { dateArrete },
  queryClient
);

useEffect(() => {
  if (!loading && myData.length > 0) {
    setDateArretePrecedent(new Date(myData[0].DCO).toISOString().split("T")[0]);
  }
}, [myData, loading]);
```

### 3. Configure Queries in Panel Options

When editing a panel, configure your SQL queries:

```json
{
  "TRESO_GET_DATE_TFJ_PREC": {
    "name": "TRESO_GET_DATE_TFJ_PREC",
    "sql": "SELECT * FROM treso_dates WHERE date_arrete = ${dateArrete}",
    "inputs": [
      {
        "name": "dateArrete",
        "type": "date",
        "source": "variable",
        "label": "Date d'arrêté"
      }
    ],
    "cacheTime": 300000
  },
  "TRESO_GET_MVT_DETAILS": {
    "name": "TRESO_GET_MVT_DETAILS",
    "sql": "SELECT * FROM mvt_details WHERE date_arrete = ${dateArrete} AND date_arrete_prec = ${dateArretePrecedent}",
    "inputs": [
      {"name": "dateArrete", "type": "date", "source": "variable"},
      {"name": "dateArretePrecedent", "type": "date", "source": "variable"}
    ]
  }
}
```

## API Reference

### `useBackendQuery(queryName, params, queryClient, cacheTime?)`

Fetch data from a backend SQL query.

```typescript
const { data, loading, error } = useBackendQuery(
  'TRESO_GET_DATE_TFJ_PREC',
  { dateArrete: '2024-01-15' },
  queryClient,
  300000 // Cache for 5 minutes
);
```

### `useBackendQueryMutation(queryClient)`

Manually trigger queries (on button click, form submit, etc.)

```typescript
const { mutate, loading, error } = useBackendQueryMutation(queryClient);

const handleSubmit = async () => {
  const result = await mutate('TRESO_GET_DATE_TFJ_PREC', { dateArrete });
  console.log(result);
};
```

### `useAppContext()`

Access panel context, options, and query results.

```typescript
const appContext = useAppContext();
console.log(appContext.options); // Panel configuration
console.log(appContext.queries); // All query results
await appContext.executeQuery('QUERY_NAME', { param: 'value' });
```

## Architecture

```
Grafana Panel
  └─ SimplePanel (Wrapper)
      └─ App (Your React App)
          ├─ Page 1 (e.g., SecuritiesPortfolio)
          ├─ Page 2 (e.g., PosexErQuotidien)
          └─ useBackendQuery() → BackendQueryClient → Backend SQL
```

## Backend Integration

The plugin calls your backend at:
```
POST /api/plugins/call
{
  "pluginId": "grafana-react-app-panel",
  "method": "TRESO_GET_DATE_TFJ_PREC",
  "params": { "dateArrete": "2024-01-15" }
}
```

Make sure your Grafana instance has a backend handler for these requests.

## Migration Checklist

- [ ] Copy your React components to `src/components/`
- [ ] Update `App.tsx` to render your components
- [ ] Replace `getRequest()` calls with `useBackendQuery()` hook
- [ ] Define SQL queries in panel config JSON
- [ ] Update backend to handle `/api/plugins/call` requests
- [ ] Build plugin: `npm run build`
- [ ] Install to Grafana and enable plugin
- [ ] Add panel to dashboard

## Examples

See `examples/` directory for:
- Treasury Securities Portfolio example
- POSEX + E-R reporting example
- Complete migration from getRequest() to useBackendQuery()

## Troubleshooting

### Queries not executing
- Check browser console for errors
- Verify backend `/api/plugins/call` handler is implemented
- Check panel configuration JSON format

### Data not updating
- Use `useBackendQueryMutation()` for manual triggers
- Check cache duration - set `cacheTime: 0` to disable caching
- Verify panel `enableDataFetch` option is enabled

### Context errors
- Ensure component is rendered inside `AppContext.Provider`
- Use `useAppContext()` inside components, not at module level

## License

MIT

## Support

For issues and questions, visit: https://github.com/UserMMT/grafana-react-app-panel
