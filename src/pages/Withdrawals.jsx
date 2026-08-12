import { useCallback, useEffect, useState } from 'react';
import { FaEllipsisVertical, FaXmark } from 'react-icons/fa6';
import { api } from '../api';
import { useCurrency } from '../CurrencyContext';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Withdrawals() {
  const { formatMoney } = useCurrency();
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [actionItem, setActionItem] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const d = await api.admin.withdrawals({ page, status });
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

  useEffect(() => {
    if (!menuId) return;
    const handler = (e) => {
      if (!e.target.closest('.row-menu')) setMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuId]);

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
      if (kind === 'process') {
        await api.admin.processWithdrawal(item.id, { note: note.trim() });
      } else {
        await api.admin.rejectWithdrawal(item.id, { note: note.trim() });
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
          <h1>Withdrawals</h1>
          <p>Approve teacher payout requests, then send the money to them.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="filter-row">
        <select className="text-input filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processed">Processed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading && !data ? <p className="muted">Loading withdrawals…</p> : null}

      {data && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Pay to</th>
                <th>Amount</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="muted">No withdrawals found.</td>
                </tr>
              ) : (
                data.withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <strong>{w.user?.name || '—'}</strong>
                      <div className="muted small">{w.user?.email}</div>
                    </td>
                    <td>
                      <strong>{w.receiver_name || '—'}</strong>
                      <div className="muted small">{w.phone || '—'}</div>
                    </td>
                    <td><strong>{formatMoney(w.amount)}</strong></td>
                    <td>{formatDate(w.created_at)}</td>
                    <td>
                      <span className={`status-pill status-${w.status}`}>{w.status}</span>
                    </td>
                    <td className="muted small">{w.note || '—'}</td>
                    <td>
                      {w.status === 'pending' ? (
                        <div className="row-menu">
                          <button className="dots-btn" aria-label="Actions" onClick={() => setMenuId(menuId === w.id ? null : w.id)}>
                            <FaEllipsisVertical />
                          </button>
                          {menuId === w.id ? (
                            <div className="row-dropdown">
                              <button className="row-dropdown-item menu-approve" disabled={busy === w.id} onClick={() => openAction(w, 'process')}>
                                Approve &amp; Pay
                              </button>
                              <button className="row-dropdown-item menu-danger" disabled={busy === w.id} onClick={() => openAction(w, 'reject')}>
                                Reject
                              </button>
                            </div>
                          ) : null}
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
            <h3 className="modal-title">{actionItem.kind === 'process' ? 'Approve &amp; Pay' : 'Reject Withdrawal'}</h3>
            <p className="muted">
              {actionItem.item.user?.name} requested <strong>{formatMoney(actionItem.item.amount)}</strong>.
            </p>
            {actionItem.kind === 'process' ? (
              <p className="muted">
                Pay <strong>{formatMoney(actionItem.item.amount)}</strong> to{' '}
                <strong>{actionItem.item.receiver_name || actionItem.item.user?.name || 'the teacher'}</strong>{' '}
                at <strong>{actionItem.item.phone || actionItem.item.user?.phone || 'no phone on file'}</strong>.
              </p>
            ) : (
              <p className="muted">The amount will be refunded to the teacher&apos;s wallet.</p>
            )}
            <label className="field">
              <span>{actionItem.kind === 'process' ? 'Payment note (optional)' : 'Reason (optional)'}</span>
              <textarea className="text-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={actionItem.kind === 'process' ? 'e.g. Paid via M-Pesa 255712345678' : 'e.g. Insufficient payout details'} />
            </label>
            <div className="checkout-actions">
              <button className="btn btn-ghost" onClick={() => setActionItem(null)}>Cancel</button>
              <button className={`btn ${actionItem.kind === 'process' ? 'btn-primary' : 'btn-danger'}`} disabled={busy === actionItem.item.id} onClick={confirmAction}>
                {busy === actionItem.item.id ? 'Saving…' : actionItem.kind === 'process' ? 'Approve &amp; Pay' : 'Reject &amp; Refund'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
