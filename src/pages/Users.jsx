import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export default function Users() {
  const [filters, setFilters] = useState({ role: '', search: '', suspended: false, pending: false });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const d = await api.admin.users({ page, ...filters });
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

  const action = async (fn, id) => {
    setBusyId(id);
    setError('');
    try {
      await fn(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Users</h1>
          <p>Review accounts, approve teachers, suspend or promote users.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="filter-row">
        <input
          className="text-input filter-search"
          placeholder="Search name or email…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select className="text-input filter-select" value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}>
          <option value="">All roles</option>
          <option value="teacher">Teachers</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
          <option value="none">Unassigned</option>
        </select>
        <label className="filter-check">
          <input type="checkbox" checked={filters.suspended} onChange={(e) => setFilters((f) => ({ ...f, suspended: e.target.checked }))} />
          Suspended
        </label>
        <label className="filter-check">
          <input type="checkbox" checked={filters.pending} onChange={(e) => setFilters((f) => ({ ...f, pending: e.target.checked }))} />
          Pending approval
        </label>
      </div>

      {loading && !data ? <p className="muted">Loading users…</p> : null}

      {data && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Level</th>
                <th>AI Tokens</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="muted">No users found.</td>
                </tr>
              ) : (
                data.users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      <div className="muted small">{u.email}</div>
                    </td>
                    <td>
                      <span className={`role-pill role-${u.role}`}>{u.role}</span>
                    </td>
                    <td>{u.level || '—'}</td>
                    <td>{u.ai_tokens}</td>
                    <td>
                      {u.is_suspended ? (
                        <span className="status-pill status-failed">suspended</span>
                      ) : u.role === 'teacher' && !u.teacher_profile?.is_approved ? (
                        <span className="status-pill status-processing">pending</span>
                      ) : (
                        <span className="status-pill status-success">active</span>
                      )}
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        {u.role === 'teacher' && !u.teacher_profile?.is_approved ? (
                          <button className="btn btn-primary btn-small" disabled={busyId === u.id} onClick={() => action(api.admin.approveTeacher, u.id)}>
                            Approve
                          </button>
                        ) : null}
                        {!u.is_admin ? (
                          <>
                            <button className="btn btn-secondary btn-small" disabled={busyId === u.id} onClick={() => action(api.admin.toggleAdmin, u.id)}>
                              {u.is_admin ? 'Remove admin' : 'Make admin'}
                            </button>
                            <button
                              className={`btn btn-small ${u.is_suspended ? 'btn-secondary' : 'btn-danger'}`}
                              disabled={busyId === u.id}
                              onClick={() => action(api.admin.toggleSuspend, u.id)}
                            >
                              {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </>
                        ) : null}
                      </div>
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
    </div>
  );
}
