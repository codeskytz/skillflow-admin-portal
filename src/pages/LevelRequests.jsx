import { useCallback, useEffect, useState } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { api } from '../api';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

export default function LevelRequests() {
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [actionItem, setActionItem] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const d = await api.admin.levelRequests({ page, status });
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load(1);
  }, [load]);

  const openAction = (item, kind) => {
    setActionItem({ item, kind });
    setNote('');
  };

  const confirmAction = async () => {
    if (!actionItem) return;
    const { item, kind } = actionItem;
    setBusy(item.id);
    setError('');
    try {
      if (kind === 'approve') {
        await api.admin.approveLevelRequest(item.id, { note: note.trim() });
      } else {
        await api.admin.rejectLevelRequest(item.id, { note: note.trim() });
      }
      setActionItem(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Level Requests</h1>
          <p>Review teachers asking to teach additional levels.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="filter-row">
        <select className="text-input filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading && !data ? <p className="muted">Loading requests…</p> : null}

      {data && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Requested Level</th>
                <th>Date</th>
                <th>Status</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="muted">No requests found.</td>
                </tr>
              ) : (
                data.requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.user?.name || '—'}</strong>
                      <div className="muted small">{r.user?.email}</div>
                    </td>
                    <td><strong>{r.level}</strong></td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>
                      <span className={`status-pill status-${r.status}`}>{STATUS_LABELS[r.status] || r.status}</span>
                    </td>
                    <td className="muted small">{r.note || '—'}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <div className="row-actions">
                          <button className="btn btn-primary btn-small" disabled={busy === r.id} onClick={() => openAction(r, 'approve')}>
                            Approve
                          </button>
                          <button className="btn btn-danger btn-small" disabled={busy === r.id} onClick={() => openAction(r, 'reject')}>
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </td>
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

      {actionItem ? (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close" onClick={() => setActionItem(null)} aria-label="Close">
              <FaXmark />
            </button>
            <h3 className="modal-title">
              {actionItem.kind === 'approve' ? 'Approve level access' : 'Reject level request'}
            </h3>
            <p className="muted">
              {actionItem.item.user?.name} requested <strong>{actionItem.item.level}</strong>.
            </p>
            {actionItem.kind === 'approve' ? (
              <p className="muted">Approving lets them post notes, videos and exams for this level.</p>
            ) : (
              <p className="muted">The teacher will be notified with your reason.</p>
            )}
            <label className="field">
              <span>{actionItem.kind === 'approve' ? 'Note (optional)' : 'Reason (optional)'}</span>
              <textarea className="text-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Granted, welcome!" />
            </label>
            <div className="checkout-actions">
              <button className="btn btn-ghost" onClick={() => setActionItem(null)}>Cancel</button>
              <button className={`btn ${actionItem.kind === 'approve' ? 'btn-primary' : 'btn-danger'}`} disabled={busy === actionItem.item.id} onClick={confirmAction}>
                {busy === actionItem.item.id ? 'Saving…' : actionItem.kind === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
