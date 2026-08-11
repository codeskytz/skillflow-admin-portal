import { useEffect, useState } from 'react';
import { FaTrash, FaFilePdf, FaPlay } from 'react-icons/fa6';
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

  const remove = async (item) => {
    if (!window.confirm(`Delete this ${item.type}? This cannot be undone.`)) return;
    setBusy(`${item.type}-${item.id}`);
    setError('');
    try {
      if (item.type === 'note') await api.admin.deleteNote(item.id);
      else if (item.type === 'video') await api.admin.deleteVideo(item.id);
      else await api.admin.deleteExam(item.id);
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
                    <button className="btn btn-danger btn-small" disabled={busy === `${item.type}-${item.id}`} onClick={() => remove(item)}>
                      <FaTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
