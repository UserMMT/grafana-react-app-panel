/**
 * Example: Simple Counter Component
 * 
 * Save this code to the panel to see it rendered!
 */

export default function CounterApp() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{
      padding: '24px',
      maxWidth: '400px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1>Counter App</h1>
      <p>Current count: <strong>{count}</strong></p>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setCount(count + 1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          +1
        </button>
        
        <button
          onClick={() => setCount(count - 1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#d83b01',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          -1
        </button>
        
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
