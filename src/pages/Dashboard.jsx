import { useEffect, useState } from 'react';
import { api } from '../api';

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin
      .stats()
      .then((d) => setStats(d.stats))
      .catch((err) => setError(err.message));
  }, []);

  if (!stats) {
    return (
      <div className="page">
        <h1 className="page-title">Dashboard</h1>
        {error ? <p className="error">{error}</p> : <p className="muted">Loading platform stats…</p>}
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats.users },
    { label: 'Teachers', value: stats.teachers, sub: `${stats.pending_teachers} awaiting approval` },
    { label: 'Students', value: stats.students },
    { label: 'Suspended', value: stats.suspended },
    { label: 'Notes', value: stats.notes },
    { label: 'Videos', value: stats.videos },
    { label: 'Exams', value: stats.exams },
    { label: 'Payments', value: stats.payments },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Platform Overview</h1>
          <p>Moderate users and monitor platform activity.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="section">
        <h2 className="section-title">Revenue &amp; Payments</h2>
        <div className="stat-grid">
          <div className="stat-card-light stat-card-accent">
            <span className="stat-value">TZS {formatMoney(stats.revenue)}</span>
            <span className="stat-label">Collected Revenue</span>
          </div>
          <div className="stat-card-light">
            <span className="stat-value">{stats.successful_payments}</span>
            <span className="stat-label">Successful Payments</span>
          </div>
          <div className="stat-card-light">
            <span className="stat-value">{stats.ai_tokens_sold}</span>
            <span className="stat-label">AI Token Purchases</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Platform</h2>
        <div className="stat-grid">
          {cards.map((c) => (
            <div className="stat-card-light" key={c.label}>
              <span className="stat-value">{c.value}</span>
              <span className="stat-label">{c.label}</span>
              {c.sub ? <span className="muted small">{c.sub}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
