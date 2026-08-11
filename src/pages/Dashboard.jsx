import { useEffect, useState } from 'react';
import {
  FaUsers,
  FaChalkboardUser,
  FaGraduationCap,
  FaUserShield,
  FaUserSlash,
  FaFilePdf,
  FaVideo,
  FaClipboardCheck,
  FaMoneyBillWave,
  FaBolt,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import { api } from '../api';

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sf_admin_user') || 'null');
    setName(stored?.name?.split(' ')[0] || 'Admin');

    api.admin
      .stats()
      .then((d) => setStats(d.stats))
      .catch((err) => setError(err.message));

    api.admin
      .payments({ page: 1 })
      .then((d) => setRecent((d.payments || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="page">
        <h1 className="page-title">Platform Overview</h1>
        {error ? <p className="error">{error}</p> : <p className="muted">Loading platform stats…</p>}
      </div>
    );
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const attention = [];
  if (stats.pending_teachers > 0) attention.push(`${stats.pending_teachers} teacher${stats.pending_teachers > 1 ? 's' : ''} awaiting approval`);
  if (stats.suspended > 0) attention.push(`${stats.suspended} suspended account${stats.suspended > 1 ? 's' : ''}`);

  return (
    <div className="page">
      <header className="dash-head">
        <div>
          <h1>Platform Overview</h1>
          <p className="muted">{today}</p>
        </div>
        <div className="dash-greeting">
          Welcome back, <strong>{name}</strong>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {attention.length > 0 ? (
        <div className="attention-banner">
          <FaTriangleExclamation />
          <span>{attention.join(' • ')}</span>
          <a className="attention-link" href="#/users">Review users →</a>
        </div>
      ) : null}

      <section className="revenue-hero">
        <div className="revenue-main">
          <span className="revenue-label">Total Revenue Collected</span>
          <strong className="revenue-value">TZS {formatMoney(stats.revenue)}</strong>
          <span className="revenue-sub">{stats.successful_payments} successful payments</span>
        </div>
        <div className="revenue-metrics">
          <div className="revenue-metric">
            <FaMoneyBillWave />
            <span>
              <strong>{stats.payments}</strong>
              All payments
            </span>
          </div>
          <div className="revenue-metric">
            <FaBolt />
            <span>
              <strong>{stats.ai_tokens_sold}</strong>
              AI token purchases
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Users</h2>
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-icon icon-navy"><FaUsers /></span>
            <span className="stat-value">{stats.users}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon icon-green"><FaChalkboardUser /></span>
            <span className="stat-value">{stats.teachers}</span>
            <span className="stat-label">Teachers</span>
            {stats.pending_teachers > 0 ? <span className="stat-warn">{stats.pending_teachers} pending</span> : null}
          </div>
          <div className="stat-card">
            <span className="stat-icon icon-blue"><FaGraduationCap /></span>
            <span className="stat-value">{stats.students}</span>
            <span className="stat-label">Students</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon icon-gold"><FaUserShield /></span>
            <span className="stat-value">{stats.admins}</span>
            <span className="stat-label">Admins</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon icon-red"><FaUserSlash /></span>
            <span className="stat-value">{stats.suspended}</span>
            <span className="stat-label">Suspended</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Content</h2>
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-icon icon-gold"><FaFilePdf /></span>
            <span className="stat-value">{stats.notes}</span>
            <span className="stat-label">Notes</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon icon-purple"><FaVideo /></span>
            <span className="stat-value">{stats.videos}</span>
            <span className="stat-label">Videos</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon icon-navy"><FaClipboardCheck /></span>
            <span className="stat-value">{stats.exams}</span>
            <span className="stat-label">Exams</span>
          </div>
        </div>
      </section>

      {recent.length > 0 ? (
        <section className="section">
          <h2 className="section-title">Recent Payments</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>User</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.reference}</td>
                    <td>{p.user?.name || '—'}</td>
                    <td>{p.purpose === 'ai_tokens' ? 'AI Tokens' : 'Content'}</td>
                    <td>{formatMoney(p.amount)} {p.currency}</td>
                    <td>
                      <span className={`status-pill status-${p.status}`}>{p.status}</span>
                    </td>
                    <td>{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
