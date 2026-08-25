/**
 * Example: Component with Data Fetching
 * 
 * Shows how to fetch and display data using the backend query API
 */

export default function DataFetchingApp() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // This would call your backend query
      // For demo purposes, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setData([
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
        { id: 3, name: 'Item 3', value: 300 },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1>Data Fetching Example</h1>

      <button
        onClick={fetchData}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: loading ? '#ccc' : '#0078d4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'default' : 'pointer',
          marginBottom: '16px',
        }}
      >
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>

      {error && (
        <div
          style={{
            backgroundColor: '#fee',
            border: '1px solid #f99',
            color: '#c00',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {data.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
