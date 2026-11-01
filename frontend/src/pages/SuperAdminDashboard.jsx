import { useState, useEffect } from 'react';
import api from '../lib/api';

function SuperAdminDashboard() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // 1. Fetch all users when the page loads
  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/auth/users');
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Flip the block switch for a specific user
  const handleToggleBlock = async (userId) => {
    try {
      setError('');
      setMessage('');
      const response = await api.put(`/api/auth/users/${userId}/block`);
      
      setMessage(response.data.message);
      fetchUsers(); // Refresh the list to show the new status
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#111827', marginBottom: '0.5rem' }}>Platform Administration</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Manage researcher and worker accounts.</p>

      {error && <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}
      {message && <div style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '1rem' }}>{message}</div>}

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Role</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No other users found on the platform.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', background: u.role === 'ADMIN' ? '#dbeafe' : '#f3e8ff', color: u.role === 'ADMIN' ? '#1e40af' : '#6b21a8' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {u.isBlocked ? (
                      <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Blocked</span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Active</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => handleToggleBlock(u._id)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', background: u.isBlocked ? '#10b981' : '#ef4444' }}
                    >
                      {u.isBlocked ? 'Unblock Access' : 'Suspend Account'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;