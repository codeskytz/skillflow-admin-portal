import { useEffect, useState } from 'react';
import { FaTrash, FaFilePdf, FaPlay, FaEye, FaXmark } from 'react-icons/fa6';
import { api } from '../api';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Content() {
  const [type, setType] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const load = async (t = type) => {
    setLoading(true);
    setError('');
    try {
      const d = await api.admin.content(t);
      setItems(d.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const openDelete = (item) => {
    setDeleteItem(item);
    setDeleteReason('');
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    setBusy(`${deleteItem.type}-${deleteItem.id}`);
    setError('');
    try {
      if (deleteItem.type === 'note') await api.admin.deleteNote(deleteItem.id, { reason: deleteReason.trim() });
      else if (deleteItem.type === 'video') await api.admin.deleteVideo(deleteItem.id, { reason: deleteReason.trim() });
      else await api.admin.deleteExam(deleteItem.id, { reason: deleteReason.trim() });
      setDeleteItem(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'notes', label: 'Notes' },
    { key: 'videos', label: 'Videos' },
    { key: 'exams', label: 'Exams' },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Content</h1>
          <p>Review and remove notes, videos and exams across the platform.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${type === t.key ? 'tab-active' : ''}`} onClick={() => setType(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? <p className="muted">Loading content…</p> : null}

      {!loading && items.length === 0 ? (
        <div className="empty-state"><p>No content found.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Details</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.type}-${item.id}`}>
                  <td>
                    <div className="content-cell">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="" className="content-cell-thumb" />
                      ) : (
                        <div className="content-cell-thumb content-cell-icon">
                          {item.type === 'video' ? <FaPlay /> : item.type === 'exam' ? '📝' : <FaFilePdf />}
                        </div>
                      )}
                      <div>
                        <strong>{item.title}</strong>
                        <div className="muted small">{item.course || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-pill role-${item.type}`}>{item.type}</span>
                  </td>
                  <td>{item.owner}</td>
                  <td>
                    {item.type === 'exam' ? (
                      <span className="muted small">{item.code} • {item.questions_count} questions</span>
                    ) : (
                      <span className="muted small">
                        {item.is_premium ? `Premium • ${formatMoney(item.price)} TZS` : 'Free'}
                      </span>
                    )}
                  </td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      {item.url ? (
                        <a className="btn btn-secondary btn-small" href={item.url} target="_blank" rel="noreferrer">
                          <FaEye /> View
                        </a>
                      ) : null}
                      <button className="btn btn-danger btn-small" disabled={busy === `${item.type}-${item.id}`} onClick={() => openDelete(item)}>
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteItem ? (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="modal-close" onClick={() => setDeleteItem(null)} aria-label="Close">
              <FaXmark />
            </button>
            <h3 className="modal-title">Delete {deleteItem.type}?</h3>
            <p className="muted">
              <strong>{deleteItem.title}</strong> by {deleteItem.owner}. This cannot be undone.
            </p>
            <label className="field">
              <span>Reason for deletion (sent to the teacher)</span>
              <textarea
                className="text-input"
                rows={4}
                placeholder="e.g. Violates platform content guidelines…"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </label>
            <div className="checkout-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteItem(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={busy === `${deleteItem.type}-${deleteItem.id}`} onClick={confirmDelete}>
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
