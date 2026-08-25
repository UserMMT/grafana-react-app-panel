/**
 * Example: Multi-Tab Dashboard App
 * 
 * Demonstrates how to create a full app with navigation and state
 */

export default function DashboardApp() {
  const [activeTab, setActiveTab] = React.useState('home');
  const [data, setData] = React.useState({ messages: [], newMessage: '' });

  const handleSendMessage = () => {
    if (data.newMessage.trim()) {
      setData({
        messages: [...data.messages, { id: Date.now(), text: data.newMessage }],
        newMessage: '',
      });
    }
  };

  const tabStyle = {
    padding: '8px 16px',
    backgroundColor: activeTab === 'home' ? '#0078d4' : '#f0f0f0',
    color: activeTab === 'home' ? 'white' : '#333',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
  };

  return (
    <div style={{
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1>Dashboard App</h1>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('home')}
          style={{ ...tabStyle, backgroundColor: activeTab === 'home' ? '#0078d4' : '#f0f0f0' }}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          style={{ ...tabStyle, backgroundColor: activeTab === 'messages' ? '#0078d4' : '#f0f0f0' }}
        >
          Messages ({data.messages.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{ ...tabStyle, backgroundColor: activeTab === 'settings' ? '#0078d4' : '#f0f0f0' }}
        >
          Settings
        </button>
      </div>

      {/* Home Tab */}
      {activeTab === 'home' && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '4px',
        }}>
          <h2>Welcome to Dashboard</h2>
          <p>This is a multi-tab React app running inside Grafana!</p>
          <ul>
            <li>Click tabs to navigate</li>
            <li>Try sending a message in the Messages tab</li>
            <li>State is preserved when switching tabs</li>
          </ul>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '4px',
        }}>
          <h2>Messages</h2>
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              value={data.newMessage}
              onChange={(e) => setData({ ...data, newMessage: e.currentTarget.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0078d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>

          {data.messages.length === 0 ? (
            <p style={{ color: '#666' }}>No messages yet. Send one above!</p>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {data.messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    backgroundColor: '#fff',
                    padding: '8px 12px',
                    borderLeft: '4px solid #0078d4',
                    borderRadius: '2px',
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '16px',
          borderRadius: '4px',
        }}>
          <h2>Settings</h2>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" defaultChecked /> Enable notifications
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" defaultChecked /> Dark mode
          </label>
          <label style={{ display: 'block' }}>
            <input type="checkbox" /> Auto-refresh
          </label>
        </div>
      )}
    </div>
  );
}
