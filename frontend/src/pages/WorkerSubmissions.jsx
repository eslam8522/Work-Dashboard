import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import ChatBox from '../components/ChatBox';

export default function WorkerSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [codes, setCodes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubmissions = useCallback(async () => {
    try {
      const { data } = await api.get('/api/studies/mine');
      setSubmissions(data);
    } catch {
      setError('Failed to load your submissions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleCompleteStudy = async (studyId) => {
    const code = codes[studyId]?.trim();
    if (!code) return setError('Please enter a completion code.');

    setError('');
    try {
      await api.post(`/api/studies/${studyId}/complete`, { completionCode: code });
      fetchSubmissions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit completion code.');
    }
  };

  if (isLoading) return <div className="loading-text">Loading your workspace…</div>;

  return (
    <div className="dashboard-container">
      <h1 className="page-title">My workspace &amp; submissions</h1>
      <p className="page-subtitle">Track your reservations, reviews, and chat with the researcher.</p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {submissions.length === 0 ? (
        <div className="card loading-text">You have not reserved any studies yet.</div>
      ) : (
        submissions.map((sub) => {
          const study = sub.studyId;
          return (
            <div key={sub._id} className="card">
              <h3>{study?.title || 'Study no longer available'}</h3>
              <p style={{ margin: '0.5rem 0' }}>
                Status: <span className={`status-badge status-badge--${sub.status.toLowerCase()}`}>{sub.status.toUpperCase()}</span>
                {sub.status === 'accepted' && study && <strong style={{ marginLeft: '0.75rem', color: '#047857' }}>+${Number(study.rewardPerWorker).toFixed(2)} paid</strong>}
              </p>

              {sub.status === 'RESERVED' && study ? (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <p>
                    <strong>Required action:</strong> complete the{' '}
                    <a href={study.surveyUrl} target="_blank" rel="noreferrer">survey ↗</a>, then enter your completion code.
                  </p>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter completion code"
                    aria-label="Completion code"
                    value={codes[study._id] || ''}
                    onChange={(e) => setCodes({ ...codes, [study._id]: e.target.value })}
                  />
                  <button onClick={() => handleCompleteStudy(study._id)} className="btn btn-primary">Complete study</button>
                </div>
              ) : (
                <div className="card-grid" style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div>
                    {sub.adminFeedback ? (
                      <p><strong>Admin feedback:</strong><br />{sub.adminFeedback}</p>
                    ) : (
                      <p className="muted">{sub.status === 'pending' ? 'Waiting for admin review…' : 'No feedback provided.'}</p>
                    )}
                  </div>
                  <ChatBox receiverId={study?.adminId} receiverRole="Researcher" />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
