import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import ChatBox from '../components/ChatBox';

export default function AdminReview() {
  const [pending, setPending] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await api.get('/api/studies/pending');
      setPending(data);
    } catch {
      setError('Failed to load pending submissions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleReview = async (id, status) => {
    setError('');
    setBusyId(id);
    try {
      await api.patch(`/api/studies/${id}/review`, { status, adminFeedback: feedback[id] || '' });
      setPending((list) => list.filter((sub) => sub._id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process review. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <div className="loading-text">Loading pending reviews…</div>;

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Pending reviews</h1>
      <p className="page-subtitle">Approving a submission pays the worker's reward into their wallet.</p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {pending.length === 0 ? (
        <div className="card loading-text">All caught up! No pending submissions.</div>
      ) : (
        pending.map((sub) => (
          <div key={sub._id} className="card card-grid">
            <div>
              <h3>{sub.studyId?.title}</h3>
              <p><strong>Worker:</strong> {sub.workerId?.email}</p>
              <p style={{ margin: '0.5rem 0' }}>
                Status: <span className="status-badge status-badge--pending">PENDING</span>
              </p>

              <textarea
                className="textarea-field"
                aria-label="Feedback for the worker"
                value={feedback[sub._id] || ''}
                onChange={(e) => setFeedback({ ...feedback, [sub._id]: e.target.value })}
                placeholder="Provide feedback (optional)..."
              />

              <div className="row">
                <button onClick={() => handleReview(sub._id, 'accepted')} className="btn btn-success" disabled={busyId === sub._id}>
                  Approve &amp; pay worker
                </button>
                <button onClick={() => handleReview(sub._id, 'rejected')} className="btn btn-danger" disabled={busyId === sub._id}>
                  Reject
                </button>
              </div>
            </div>

            <ChatBox receiverId={sub.workerId?._id} receiverRole="Worker" />
          </div>
        ))
      )}
    </div>
  );
}
