import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useCurrency } from '../CurrencyContext';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export default function Payments() {
  const { formatMoney } = useCurrency();
  const [filters, setFilters] = useState({ status: '', purpose: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const d = await api.admin.payments({ page, ...filters });
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Payments</h1>
          <p>Monitor all transactions across the platform.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="filter-row">
        <select className="text-input filter-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="processing">Processing</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <select className="text-input filter-select" value={filters.purpose} onChange={(e) => setFilters((f) => ({ ...f, purpose: e.target.value }))}>
          <option value="">All purposes</option>
          <option value="content">Content</option>
          <option value="ai_tokens">AI Tokens</option>
        </select>
      </div>

      {loading && !data ? <p className="muted">Loading payments…</p> : null}

      {data && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>User</th>
                <th>Purpose</th>
                <th>Amount</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="muted">No payments found.</td>
                </tr>
              ) : (
                data.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.reference}</td>
                    <td>
                      <strong>{p.user?.name || '—'}</strong>
                      <div className="muted small">{p.user?.email}</div>
                    </td>
                    <td>{p.purpose === 'ai_tokens' ? 'AI Tokens' : 'Content'}</td>
                    <td>
                      {formatMoney(p.amount)}
                    </td>
                    <td>{p.channel}</td>
                    <td>
                      <span className={`status-pill status-${p.status}`}>{p.status}</span>
                    </td>
                    <td>{formatDate(p.paid_at || p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && data.pagination.last_page > 1 ? (
        <div className="pager">
          <button className="btn btn-ghost btn-small" disabled={data.pagination.current_page <= 1} onClick={() => load(data.pagination.current_page - 1)}>
            Prev
          </button>
          <span className="muted small">
            Page {data.pagination.current_page} of {data.pagination.last_page}
          </span>
          <button className="btn btn-ghost btn-small" disabled={data.pagination.current_page >= data.pagination.last_page} onClick={() => load(data.pagination.current_page + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
