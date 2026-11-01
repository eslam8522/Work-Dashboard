import { useState } from 'react';
import api from '../lib/api';

function AdminDashboard() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    surveyUrl: '',
    rewardPerWorker: '',
    maxParticipants: '',
    completionCode: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', message: 'Publishing study...' });
    
    try {
      await api.post('/api/studies/create', {
        ...formData,
        rewardPerWorker: Number(formData.rewardPerWorker),
        maxParticipants: Number(formData.maxParticipants),
      });
      
      setStatus({ type: 'success', message: 'Success! Study published to the worker pool.' });
      setFormData({ title: '', description: '', surveyUrl: '', rewardPerWorker: '', maxParticipants: '', completionCode: '' }); 
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || err.message });
    }
  };

  // --- Professional UI Styles ---
  const containerStyle = { display: 'flex', justifyContent: 'center', padding: '3rem 1rem' };
  const cardStyle = { background: '#ffffff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '650px', alignSelf: 'flex-start' };
  const inputGroupStyle = { marginBottom: '1.25rem' };
  const labelStyle = { display: 'block', fontWeight: '600', color: '#374151', fontSize: '0.9rem', marginBottom: '0.4rem' };
  const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' };
  
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1.8rem' }}>Publish a New Study</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Fill out the details below to deploy your survey to available workers.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Study Title</label>
            <input name="title" value={formData.title} onChange={handleChange} required style={inputStyle} placeholder="e.g., Consumer Behavior in E-commerce" />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Detailed Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Explain what workers will be doing in this study..." />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Survey Link</label>
            <input name="surveyUrl" type="url" value={formData.surveyUrl} onChange={handleChange} required style={inputStyle} placeholder="https://forms.google.com/..." />
          </div>
          
          {/* Side-by-Side Grid for Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Reward per Worker ($)</label>
              <input name="rewardPerWorker" type="number" step="0.01" min="0.10" value={formData.rewardPerWorker} onChange={handleChange} required style={inputStyle} placeholder="1.50" />
            </div>
            <div>
              <label style={labelStyle}>Max Participants</label>
              <input name="maxParticipants" type="number" min="1" value={formData.maxParticipants} onChange={handleChange} required style={inputStyle} placeholder="100" />
            </div>
          </div>
          
          <div style={{ ...inputGroupStyle, marginBottom: '2rem' }}>
            <label style={labelStyle}>Secret Completion Code</label>
            <input name="completionCode" value={formData.completionCode} onChange={handleChange} required style={inputStyle} placeholder="e.g., C8JFLH16" />
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Workers will paste this code after finishing your survey to claim their reward.</p>
          </div>
          
          <button 
            type="submit" 
            style={{ width: '100%', padding: '0.85rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.background = '#2563eb'}
          >
            Publish Study
          </button>

        </form>
        
        {/* Status Messages */}
        {status.message && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '6px', background: status.type === 'success' ? '#dcfce7' : status.type === 'error' ? '#fee2e2' : '#e0e7ff', color: status.type === 'success' ? '#166534' : status.type === 'error' ? '#991b1b' : '#3730a3', textAlign: 'center', fontWeight: '500' }}>
            {status.message}
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;