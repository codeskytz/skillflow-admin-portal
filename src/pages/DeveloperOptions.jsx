import { useEffect, useState } from 'react';
import { FaRotate, FaCircleCheck, FaCircleXmark } from 'react-icons/fa6';
import { api } from '../api';

/**
 * Developer options.
 *
 * The AI processor runs on its own server. When that server moves, dies, or is
 * swapped for a spare, someone has to repoint the platform at a new address —
 * and on shared hosting editing .env is a deployment, not an operation. This
 * makes it a form field.
 *
 * The shared secret is never sent back by the API, only whether one is set, so
 * this screen shows a placeholder and leaves the stored value alone unless a
 * new one is typed.
 */
export default function DeveloperOptions() {
  const [settings, setSettings] = useState(null);
  const [health, setHealth] = useState(null);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.admin.developerSettings();
      setSettings(d.settings);
      setHealth(d.health);
      setUrl(d.settings.ai_processor_url || '');
      setEnabled(d.settings.ai_processor_enabled !== false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = { ai_processor_url: url.trim() || null, ai_processor_enabled: enabled };

      // Only send the secret when one was actually typed. Sending an empty
      // string would clear the stored value, which is not what "I did not
      // retype it" means.
      if (secret.trim()) payload.ai_processor_secret = secret.trim();

      const d = await api.admin.updateDeveloperSettings(payload);
      setSettings(d.settings);
      setHealth(d.health);
      setSecret('');
      setNotice('Saved. New jobs will use this address immediately.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setError('');
    setNotice('');
    try {
      const d = await api.admin.testAiProcessor();
      setHealth(d.health);
    } catch (err) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Developer Options</h1>
          <p>Configuration that can be changed without a deploy.</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}

      <div className="card">
        <h2 className="section-title">AI processor</h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          All AI generation runs on a separate server. Point this at its address. If that
          server goes down, change the address here and processing resumes — nothing needs
          redeploying.
        </p>

        {/* Whether the address currently answers, so it can be confirmed before
            anyone relies on it. */}
        <div className={`processor-health ${health?.ok ? 'processor-health-ok' : 'processor-health-bad'}`}>
          {health?.ok ? <FaCircleCheck /> : <FaCircleXmark />}
          <div>
            <strong>{health?.ok ? 'Processor reachable' : 'Processor not reachable'}</strong>
            <span className="muted small">{health?.message}</span>
            {health?.details?.gemini_configured === false ? (
              <span className="muted small">
                It answered, but it has no Gemini API key set — generation will fail.
              </span>
            ) : null}
            {health?.details?.models?.workhorse ? (
              <span className="muted small">Models: {health.details.models.workhorse}, {health.details.models.image}</span>
            ) : null}
          </div>
          <button className="btn btn-secondary btn-small" onClick={test} disabled={testing}>
            <FaRotate /> {testing ? 'Testing…' : 'Test'}
          </button>
        </div>

        <form onSubmit={save} style={{ marginTop: 20 }}>
          <label className="field">
            <span>Processor URL</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ai.example.com"
              autoComplete="off"
            />
            <span className="muted small">No trailing slash. The service listens on /jobs, /explain and /visual.</span>
          </label>

          <label className="field">
            <span>Shared secret</span>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={settings?.ai_processor_secret_set ? '•••••••• (leave blank to keep)' : 'Not set'}
              autoComplete="new-password"
            />
            <span className="muted small">
              Must match SHARED_SECRET on the processor. Leave blank to keep the current one.
            </span>
          </label>

          <label className="checkbox-label" style={{ marginBottom: 16 }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            AI summaries enabled
          </label>
          <p className="muted small" style={{ marginTop: -8, marginBottom: 16 }}>
            Turning this off hides the feature from students rather than letting uploads fail.
          </p>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
