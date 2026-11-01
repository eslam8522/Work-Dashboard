import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const money = (n) => `$${Number(n).toFixed(2)}`;

export default function WorkerDashboard() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStudy, setActiveStudy] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchStudies = useCallback(async () => {
    try {
      const { data } = await api.get('/api/studies');
      setStudies(data);
    } catch {
      setError('Failed to load studies.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  const run = async (action) => {
    setError('');
    setMessage('');
    try {
      await action();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleReserve = (study) =>
    run(async () => {
      const { data } = await api.post(`/api/studies/${study._id}/reserve`);
      setActiveStudy(data.study); // now includes the survey link
    });

  const handleComplete = () =>
    run(async () => {
      const { data } = await api.post(`/api/studies/${activeStudy._id}/complete`, { completionCode: inputCode });
      setMessage(data.message);
      setActiveStudy(null);
      setInputCode('');
      fetchStudies();
    });

  const handleCancel = () =>
    run(async () => {
      await api.post(`/api/studies/${activeStudy._id}/cancel`);
      setMessage('Reservation cancelled. Spot returned.');
      setActiveStudy(null);
      setInputCode('');
      fetchStudies();
    });

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Worker Dashboard</h1>
      <p className="page-subtitle">Reserve a study, complete the survey, and get paid after review.</p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {message && <div className="alert alert-success" role="status">{message}</div>}

      {activeStudy ? (
        <div className="card reservation">
          <h2 style={{ color: 'var(--primary)' }}>Active study reservation</h2>
          <h3 style={{ marginTop: '0.5rem' }}>{activeStudy.title}</h3>
          <p className="muted">{activeStudy.description}</p>

          <div className="reservation__steps">
            <p>
              <strong>Instructions:</strong> open the survey below. At the end you will receive a code. Paste it here to
              claim your {money(activeStudy.rewardPerWorker)} reward.
            </p>
            <p style={{ marginTop: '0.75rem' }}>
              <a href={activeStudy.surveyUrl} target="_blank" rel="noreferrer">Open survey link ↗</a>
            </p>
          </div>

          <div className="row">
            <input
              className="input-field"
              style={{ flex: 1, minWidth: 200, margin: 0 }}
              placeholder="Paste completion code here"
              aria-label="Completion code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
            />
            <button className="btn btn-success" onClick={handleComplete} disabled={!inputCode.trim()}>Submit &amp; finish</button>
            <button className="btn btn-danger" onClick={handleCancel}>Cancel reservation</button>
          </div>
        </div>
      ) : loading ? (
        <p className="loading-text">Loading studies…</p>
      ) : (
        <>
          <h2 style={{ marginBottom: '1rem' }}>Available studies ({studies.length})</h2>
          {studies.length === 0 ? (
            <div className="card loading-text">No studies available right now. Check back soon!</div>
          ) : (
            <div className="study-list">
              {studies.map((study) => (
                <div key={study._id} className="card study-item row row--between">
                  <div>
                    <h3>{study.title}</h3>
                    <p className="muted">
                      Reward: <strong>{money(study.rewardPerWorker)}</strong> · Spots: {study.availableSpots} / {study.maxParticipants}
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleReserve(study)}>Reserve spot</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
