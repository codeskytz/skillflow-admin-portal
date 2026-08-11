import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    const payload = { name: name.trim(), email: email.trim(), phone: phone.trim() || null };
    const changingPassword = newPassword.trim().length > 0;

    if (changingPassword) {
      if (!currentPassword) {
        setError('Enter your current password to change it.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    } else if (email.trim() !== (user?.email || '') && !currentPassword) {
      setError('Enter your current password to change your email.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(payload);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Update your admin account information.</p>
        </div>
      </header>

      <div className="card profile-card">
        <div className="profile-hero">
          <div className="profile-avatar">{user?.name?.charAt(0) || 'A'}</div>
          <div>
            <h2>{user?.name}</h2>
            <span className="profile-role">Platform Admin</span>
          </div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <form className="card form-card" onSubmit={handleSave}>
        <h2 className="section-title">Personal Information</h2>
        <div className="form-grid">
          <label className="field">
            <span>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255…" />
          </label>
        </div>

        <h2 className="section-title section-title-spaced">Change Password</h2>
        <p className="muted small">Leave blank to keep your current password.</p>
        <div className="form-grid">
          <label className="field">
            <span>Current password</span>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </label>
          <label className="field">
            <span>New password</span>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </label>
          <label className="field">
            <span>Confirm new password</span>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </label>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
