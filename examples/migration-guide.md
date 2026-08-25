# Migration Guide: getRequest() → useBackendQuery()

## Overview

This guide shows how to migrate your existing React components to use the Grafana panel plugin.

## Step 1: Copy Your Components

```bash
cp src/components/treasury/SecuritiesPortfolio3Manual.tsx grafana-react-app-panel/src/components/
cp src/pages/reporting/PosexErQuotidien.tsx grafana-react-app-panel/src/components/
```

## Step 2: Update Imports

**Before:**
```typescript
import { getRequest } from '@/hooks/useFetch';
```

**After:**
```typescript
import { useBackendQuery, useBackendQueryMutation } from '@/utils/hooks';
import { BackendQueryClient } from '@/utils/api';
```

## Step 3: Replace useEffect + getRequest Pattern

### Example 1: Simple Query

**Before (PosexErQuotidien.tsx line ~60)**
```typescript
useEffect(() => {
  let alive = true;
  getRequest("TRESO_GET_DATE_TFJ_PREC", [
    { "name": "DateArrete", "value": dateArrete, "type": "string" }
  ]).then(Mydata => {
    if (Mydata.length == 0) return;
    console.log("time to update to " + new Date(Mydata[0].DCO).toISOString().split("T")[0]);
    setDateArretePrecedent(new Date(Mydata[0].DCO).toISOString().split("T")[0]);
  })
  .catch(() => {});
  return () => { alive = false; };
}, [dateArrete]);
```

**After:**
```typescript
const queryClient = new BackendQueryClient();
const { data: tfjPrecData, loading } = useBackendQuery(
  'TRESO_GET_DATE_TFJ_PREC',
  { DateArrete: dateArrete },
  queryClient
);

useEffect(() => {
  if (!loading && tfjPrecData.length > 0) {
    setDateArretePrecedent(
      new Date(tfjPrecData[0].DCO).toISOString().split("T")[0]
    );
  }
}, [tfjPrecData, loading]);
```

### Example 2: Multiple Dependent Queries

**Before (PosexErQuotidien.tsx lines ~70-140)**
```typescript
useEffect(() => {
  let alive = true;
  
  // Query 1
  getRequest("TRESO_GET_MVT_EXPLIC2", [
    { "name": "DateArrete", "value": dateArrete, "type": "string" },
    { "name": "dateArretePrecedent", "value": dateArretePrecedent, "type": "string" }
  ]).then(Mydata => {
    if (Mydata.length == 0) return;
    setExplanations(Mydata.map(res => res.Commentaire));
  })
  .catch(() => {});
  
  // Query 2
  getRequest("TRESO_GET_LIST_RELEVE_BETW_DATEARRETE_PREVIOUS", [
    /* params */
  ]).then(Mydata => {
    /* process */
  })
  .catch(() => {});
  
  return () => { alive = false; };
}, [dateArretePrecedent]);
```

**After:**
```typescript
const queryClient = new BackendQueryClient();

const { data: explicitData } = useBackendQuery(
  'TRESO_GET_MVT_EXPLIC2',
  { DateArrete: dateArrete, dateArretePrecedent },
  queryClient
);

const { data: releveData } = useBackendQuery(
  'TRESO_GET_LIST_RELEVE_BETW_DATEARRETE_PREVIOUS',
  { DateArrete: dateArrete, PrecedenteDateArrete: dateArretePrecedent },
  queryClient
);

useEffect(() => {
  setExplanations(explicitData.map(res => res.Commentaire));
}, [explicitData]);

useEffect(() => {
  const releves = releveData.map((x, index) => ({
    id: index,
    account: x.numeroCompte,
    /* ... */
  }));
  setReleve(releves);
}, [releveData]);
```

### Example 3: Manual Query Trigger

**Before (Form submission)**
```typescript
const handleStockImport = (rows: StockImportRow[]) => {
  getRequest("TRESO_IMPORT_STOCK", [
    { "name": "data", "value": rows, "type": "json" }
  ])
  .then(result => {
    console.log("Import successful");
    // Process result
  })
  .catch(err => console.error("Import failed", err));
};
```

**After:**
```typescript
const { mutate: importStock, loading } = useBackendQueryMutation(queryClient);

const handleStockImport = async (rows: StockImportRow[]) => {
  try {
    const result = await importStock('TRESO_IMPORT_STOCK', { data: rows });
    console.log("Import successful", result);
  } catch (err) {
    console.error("Import failed", err);
  }
};

// In JSX
<Button onClick={handleStockImport} disabled={loading}>
  {loading ? 'Importing...' : 'Import'}
</Button>
```

## Step 4: Configure Queries in Panel

In Grafana panel edit mode, paste this JSON config:

```json
{
  "TRESO_GET_DATE_TFJ_PREC": {
    "name": "TRESO_GET_DATE_TFJ_PREC",
    "sql": "SELECT * FROM treso_dates WHERE date_arrete = ${DateArrete}",
    "inputs": [
      {"name": "DateArrete", "type": "date", "source": "variable"}
    ],
    "cacheTime": 300000
  },
  "TRESO_GET_MVT_EXPLIC2": {
    "name": "TRESO_GET_MVT_EXPLIC2",
    "sql": "SELECT * FROM mvt_explications WHERE date_arrete = ${DateArrete} AND date_arrete_prec = ${dateArretePrecedent}",
    "inputs": [
      {"name": "DateArrete", "type": "date", "source": "variable"},
      {"name": "dateArretePrecedent", "type": "date", "source": "variable"}
    ]
  },
  "TRESO_GET_LIST_RELEVE_BETW_DATEARRETE_PREVIOUS": {
    "name": "TRESO_GET_LIST_RELEVE_BETW_DATEARRETE_PREVIOUS",
    "sql": "SELECT * FROM releves WHERE date_arrete BETWEEN ${PrecedenteDateArrete} AND ${DateArrete}",
    "inputs": [
      {"name": "DateArrete", "type": "date", "source": "variable"},
      {"name": "PrecedenteDateArrete", "type": "date", "source": "variable"}
    ]
  }
}
```

## Parameter Mapping

Your old `getRequest()` parameters need to map to query params:

| Old Format | New Format |
|-----------|----------|
| `{"name": "DateArrete", "value": dateArrete, "type": "string"}` | `{ DateArrete: dateArrete }` |
| Multiple params | `{ DateArrete: dateArrete, OtherParam: value }` |

## Testing

1. **Build the plugin:**
   ```bash
   npm run build
   ```

2. **Copy to Grafana:**
   ```bash
   cp -r dist /var/lib/grafana/plugins/grafana-react-app-panel
   ```

3. **Restart Grafana:**
   ```bash
   sudo systemctl restart grafana-server
   ```

4. **Add panel to dashboard** and configure queries

5. **Check browser console** for any errors

## Common Issues

### "Cannot find module"
- Make sure imports are correct: `@/utils/hooks`, `@/utils/api`
- Check tsconfig.json paths configuration

### "useAppContext() returned null"
- Component must be rendered inside panel wrapper
- Don't use at module level, only inside React components

### Queries not executing
- Check panel `enableDataFetch` option is true
- Verify backend `/api/plugins/call` endpoint exists
- Check network tab in browser DevTools

### Data not updating on param change
- Ensure dependency array includes all params
- Use `JSON.stringify()` carefully with objects

## Checklist

- [ ] Copy components to `src/components/`
- [ ] Replace all `getRequest()` with `useBackendQuery()`
- [ ] Update all imports
- [ ] Migrate form submissions to `useBackendQueryMutation()`
- [ ] Configure SQL queries in panel JSON
- [ ] Test each query manually
- [ ] Build and deploy plugin
- [ ] Verify in Grafana dashboard
