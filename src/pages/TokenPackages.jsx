import { useEffect, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa6';
import { api } from '../api';

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const empty = { name: '', description: '', tokens: '', price: '', is_active: true };

export default function TokenPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.admin.tokenPackages();
      setPackages(d.packages || []);
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
    if (!form.name.trim() || !form.tokens || !form.price) {
      setError('Name, token count and price are required.');
      return;
    }
    const payload = {
      ...form,
      tokens: Number(form.tokens),
      price: Number(form.price),
      is_active: Boolean(form.is_active),
    };
    try {
      if (editingId) {
        await api.admin.updateTokenPackage(editingId, payload);
      } else {
        await api.admin.createTokenPackage(payload);
      }
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      tokens: p.tokens,
      price: p.price,
      is_active: p.is_active,
    });
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete package "${p.name}"?`)) return;
    setError('');
    try {
      await api.admin.deleteTokenPackage(p.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Token Packages</h1>
          <p>Manage AI token packages sold to teachers.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <form className="card form-card" onSubmit={handleSubmit}>
        <h2 className="section-title">{editingId ? 'Edit Package' : 'Add Package'}</h2>
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Starter Pack" />
          </label>
          <label className="field">
            <span>Tokens</span>
            <input type="number" value={form.tokens} onChange={(e) => setForm({ ...form, tokens: e.target.value })} placeholder="e.g. 10" />
          </label>
          <label className="field">
            <span>Price (TZS)</span>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 10000" />
          </label>
          <label className="field">
            <span>Description</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
          </label>
          <label className="filter-check">
            <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </div>
        <div className="form-actions">
          {editingId ? (
            <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(empty); }}>
              Cancel
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary">
            <FaPlus /> {editingId ? 'Save Changes' : 'Add Package'}
          </button>
        </div>
      </form>

      {loading ? <p className="muted">Loading packages…</p> : null}

      {!loading && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Tokens</th>
                <th>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="muted">No packages yet.</td>
                </tr>
              ) : (
                packages.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <div className="muted small">{p.description}</div>
                    </td>
                    <td>{p.tokens}</td>
                    <td>{formatMoney(p.price)} {p.currency}</td>
                    <td>
                      <span className={`status-pill ${p.is_active ? 'status-success' : 'status-failed'}`}>
                        {p.is_active ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-small" onClick={() => edit(p)}>Edit</button>
                        <button className="btn btn-danger btn-small" onClick={() => remove(p)}>
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
