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

  /*
   * Version thresholds per exam client. `minimum` is the forcing one: anything
   * below it is refused a paper by the API, not merely nagged. Left blank the
   * whole feature is inert, which is the safe default — a wrong value here
   * locks students out of exams.
   */
  const [releases, setReleases] = useState({
    desktop: { latest: '', minimum: '', url: '', notes: '' },
    android: { latest: '', minimum: '', url: '', notes: '' },
    ios: { latest: '', minimum: '', url: '', notes: '' },
  });

  const setRelease = (platform, field, value) =>
    setReleases((current) => ({ ...current, [platform]: { ...current[platform], [field]: value } }));

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.admin.developerSettings();
      setSettings(d.settings);
      setHealth(d.health);
      setUrl(d.settings.ai_processor_url || '');
      setEnabled(d.settings.ai_processor_enabled !== false);
      if (d.releases) setReleases(d.releases);
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
      const payload = { ai_processor_url: url.trim() || null, ai_processor_enabled: enabled, releases };

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

      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title">Exam app versions</h2>
        <p className="muted small" style={{ marginBottom: 4 }}>
          <strong>Minimum</strong> forces an update: the API refuses to give a paper to anything older, so the
          app cannot be used until it is updated. <strong>Latest</strong> only shows a dismissable notice.
        </p>
        <p className="muted small" style={{ marginBottom: 16 }}>
          Leave a field blank to disable that check. A student already writing a paper is never interrupted —
          submission is deliberately not gated.
        </p>

        <form onSubmit={save}>
          {[
            ['desktop', 'Desktop (Windows, macOS)'],
            ['android', 'Android'],
            ['ios', 'iOS'],
          ].map(([platform, label]) => (
            <div key={platform} className="release-block">
              <h3 className="release-title">{label}</h3>

              <div className="form-grid">
                <label className="field">
                  <span>Minimum version (forces update)</span>
                  <input
                    value={releases[platform]?.minimum ?? ''}
                    onChange={(e) => setRelease(platform, 'minimum', e.target.value)}
                    placeholder="e.g. 1.2.0"
                  />
                </label>

                <label className="field">
                  <span>Latest version</span>
                  <input
                    value={releases[platform]?.latest ?? ''}
                    onChange={(e) => setRelease(platform, 'latest', e.target.value)}
                    placeholder="e.g. 1.4.0"
                  />
                </label>
              </div>

              <label className="field">
                <span>Download link</span>
                <input
                  value={releases[platform]?.url ?? ''}
                  onChange={(e) => setRelease(platform, 'url', e.target.value)}
                  placeholder={
                    platform === 'desktop'
                      ? 'https://github.com/codeskytz/skillflow-exam-desktop/releases/latest'
                      : 'Store listing URL'
                  }
                />
              </label>

              <label className="field">
                <span>What's new (shown on the update screen)</span>
                <textarea
                  rows={2}
                  value={releases[platform]?.notes ?? ''}
                  onChange={(e) => setRelease(platform, 'notes', e.target.value)}
                  placeholder="Optional. Tell students why they need this version."
                />
              </label>
            </div>
          ))}

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save versions'}
          </button>
        </form>
      </div>
    </div>
  );
}
