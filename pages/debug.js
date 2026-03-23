export default function Debug() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>CX Standup Debug</h1>
      <p>API Test:</p>
      <button onClick={async () => {
        const res = await fetch('/api/data');
        const data = await res.json();
        console.log('API Response:', data);
        alert(`API returned ${data.items?.length || 0} items`);
      }}>
        Test API
      </button>
      <hr />
      <p>Check browser console for details.</p>
    </div>
  );
}
