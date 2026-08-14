import { useEffect, useState } from 'react';
import { api } from '../api';

/**
 * Everything the Firestore import could not place.
 *
 * Three kinds of thing end up here: collections whose feature has not been
 * rebuilt yet (classes, referrals, flashcards), records belonging to accounts
 * deleted before the snapshot, and documents that failed validation. They were
 * kept verbatim because the export ran once — but without a screen they may as
 * well have been discarded.
 */

const REASON_LABELS = {
  archived: 'No destination yet',
  orphaned: 'Owner missing',
  rejected: 'Failed validation',
};

const REASON_HINTS = {
  archived: 'The feature these belong to has not been rebuilt. Kept so it can be restored later.',
  orphaned: 'Valid records whose owning account no longer exists in the export.',
  rejected: 'Documents that could not be read into the new schema.',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export default function LegacyArchive() {
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [filters, setFilters] = useState({ reason: '', collection: '', search: '' });
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin
      .legacyArchiveSummary()
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  const load = () => {
    setLoading(true);
    api.admin
      .legacyArchive({ ...filters, page })
      .then((res) => {
        setEntries(res.entries || []);
        setPagination(res.pagination || { current_page: 1, last_page: 1, total: 0 });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters, page]);

  const openPayload = async (entry) => {
    if (expanded === entry.id) {
      setExpanded(null);
      setPayload(null);
      return;
    }
    setExpanded(entry.id);
    setPayload(null);
    try {
      const res = await api.admin.legacyArchiveEntry(entry.id);
      setPayload(res.entry.payload);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleResolved = async (entry) => {
    try {
      const res = await api.admin.resolveLegacyArchive(entry.id, !entry.resolved_at);
      setEntries((rows) =>
        rows.map((row) => (row.id === entry.id ? { ...row, resolved_at: res.resolved_at } : row))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const applyFilter = (patch) => {
    setPage(1);
    setFilters((current) => ({ ...current, ...patch }));
  };

  const collections = summary ? [...new Set(summary.groups.map((g) => g.collection))].sort() : [];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Legacy Archive</h1>
          <p>Records carried over from the old platform that have no home in the new one yet.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {summary ? (
        <div className="cards-grid">
          <div className="stat-card">
            <span className="stat-label">Parked records</span>
            <span className="stat-value">{summary.total.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Not yet reviewed</span>
            <span className="stat-value">{summary.unresolved.toLocaleString()}</span>
          </div>
          {Object.entries(summary.by_reason).map(([reason, total]) => (
            <div className="stat-card" key={reason}>
              <span className="stat-label">{REASON_LABELS[reason] || reason}</span>
              <span className="stat-value">{Number(total).toLocaleString()}</span>
              <span className="muted small">{REASON_HINTS[reason]}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="filters">
          <select value={filters.reason} onChange={(e) => applyFilter({ reason: e.target.value })}>
            <option value="">All reasons</option>
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select value={filters.collection} onChange={(e) => applyFilter({ collection: e.target.value })}>
            <option value="">All collections</option>
            {collections.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <input
            type="search"
            value={filters.search}
            placeholder="Search document id, owner or detail"
            onChange={(e) => applyFilter({ search: e.target.value })}
          />
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading archive…</p>
      ) : entries.length === 0 ? (
        <div className="empty-state"><p>Nothing matches these filters.</p></div>
      ) : (
        <>
          <p className="muted small" style={{ margin: '16px 0 8px' }}>
            {pagination.total.toLocaleString()} records
          </p>
          <div className="list">
            {entries.map((entry) => (
              <div key={entry.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div className="list-item-body">
                    <strong>
                      {entry.collection} / {entry.document_id}
                    </strong>
                    <p>{entry.detail || REASON_LABELS[entry.reason]}</p>
                    <span className="muted small">
                      {entry.owner
                        ? `Owner: ${entry.owner.name} (${entry.owner.email})`
                        : entry.owner_uid
                          ? `Owner ${entry.owner_uid} no longer exists`
                          : 'No owner recorded'}
                      {' • '}
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  <div className="list-item-actions" style={{ gap: 8 }}>
                    <span className={`badge badge-${entry.reason}`}>
                      {REASON_LABELS[entry.reason] || entry.reason}
                    </span>
                    <button type="button" className="btn btn-small" onClick={() => openPayload(entry)}>
                      {expanded === entry.id ? 'Hide' : 'View record'}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-small ${entry.resolved_at ? '' : 'btn-primary'}`}
                      onClick={() => toggleResolved(entry)}
                    >
                      {entry.resolved_at ? 'Reopen' : 'Mark reviewed'}
                    </button>
                  </div>
                </div>

                {expanded === entry.id ? (
                  <pre
                    style={{
                      marginTop: 12,
                      maxHeight: 320,
                      overflow: 'auto',
                      fontSize: '0.78rem',
                      background: 'rgba(0,0,0,0.04)',
                      padding: 12,
                      borderRadius: 6,
                    }}
                  >
                    {payload ? JSON.stringify(payload, null, 2) : 'Loading record…'}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>

          {pagination.last_page > 1 ? (
            <div className="list-item-actions" style={{ marginTop: 16, gap: 8 }}>
              <button
                type="button"
                className="btn"
                disabled={pagination.current_page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="muted small">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                type="button"
                className="btn"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
