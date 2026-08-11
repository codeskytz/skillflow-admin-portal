import { useEffect, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa6';
import { api } from '../api';

const empty = { name: '', slug: '', sort_order: 0 };

export default function Levels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.admin.levels();
      setLevels(d.levels || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required.');
      return;
    }
    try {
      if (editingId) {
        await api.admin.updateLevel(editingId, { ...form, sort_order: Number(form.sort_order) || 0 });
      } else {
        await api.admin.createLevel({ ...form, sort_order: Number(form.sort_order) || 0 });
      }
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (level) => {
    setEditingId(level.id);
    setForm({ name: level.name, slug: level.slug, sort_order: level.sort_order });
  };

  const remove = async (level) => {
    if (!window.confirm(`Delete level "${level.name}"?`)) return;
    setError('');
    try {
      await api.admin.deleteLevel(level.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Levels</h1>
          <p>Manage study levels shown across the platform.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <form className="card form-card" onSubmit={handleSubmit}>
        <h2 className="section-title">{editingId ? 'Edit Level' : 'Add Level'}</h2>
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Secondary" />
          </label>
          <label className="field">
            <span>Slug</span>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. secondary" />
          </label>
          <label className="field">
            <span>Sort order</span>
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </label>
        </div>
        <div className="form-actions">
          {editingId ? (
            <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(empty); }}>
              Cancel
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary">
            <FaPlus /> {editingId ? 'Save Changes' : 'Add Level'}
          </button>
        </div>
      </form>

      {loading ? <p className="muted">Loading levels…</p> : null}

      {!loading && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sort</th>
                <th>Name</th>
                <th>Slug</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {levels.length === 0 ? (
                <tr>
                  <td colSpan="4" className="muted">No levels yet.</td>
                </tr>
              ) : (
                levels.map((l) => (
                  <tr key={l.id}>
                    <td>{l.sort_order}</td>
                    <td><strong>{l.name}</strong></td>
                    <td className="mono">{l.slug}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-small" onClick={() => edit(l)}>Edit</button>
                        <button className="btn btn-danger btn-small" onClick={() => remove(l)}>
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
