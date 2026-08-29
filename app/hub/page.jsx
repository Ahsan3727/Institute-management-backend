'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Plus, Trash2, Eye, EyeOff, LogOut, Users, Building2,
  KeyRound, Sun, Moon, RefreshCw, CheckCircle2, XCircle, Copy
} from 'lucide-react';

// ── Hub credentials are checked server-side; client stores an encoded token ──
function makeToken(u, p) {
  return Buffer.from(`${u}:${p}`).toString('base64');
}

const PSA_NAVY = '#12355A';

export default function HubPage() {
  const [isDark, setIsDark] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [token, setToken] = useState('');

  // Login form
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Accounts list
  const [accounts, setAccounts] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ instituteName: '', principalName: '', username: '', password: '', notes: '' });
  const [showFormPass, setShowFormPass] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  // ── Login ────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e && e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username: loginUser.trim(), password: loginPass.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        const t = makeToken(loginUser.trim(), loginPass.trim());
        setToken(t);
        setAuthed(true);
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch {
      setLoginError('Connection failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  // ── Fetch accounts list ─────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    setListLoading(true);
    try {
      const res = await fetch('/api/hub', { headers: { 'x-hub-auth': token } });
      const data = await res.json();
      if (data.ok) setAccounts(data.accounts);
    } catch { /* ignore */ }
    finally { setListLoading(false); }
  }, [token]);

  useEffect(() => { if (authed) fetchAccounts(); }, [authed, fetchAccounts]);

  // ── Create account ──────────────────────────────────────────────────────
  async function handleCreate(e) {
    e && e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    if (!form.instituteName || !form.principalName || !form.username || !form.password) {
      setCreateError('All fields except Notes are required.');
      return;
    }
    if (form.password.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch('/api/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-hub-auth': token },
        body: JSON.stringify({ action: 'create', ...form }),
      });
      const data = await res.json();
      if (data.ok) {
        setCreateSuccess(`Account for "${form.principalName}" created successfully!`);
        setForm({ instituteName: '', principalName: '', username: '', password: '', notes: '' });
        setShowCreate(false);
        await fetchAccounts();
        showToast(`✅ Principal account created!`);
      } else {
        setCreateError(data.error || 'Failed to create account.');
      }
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Delete account ──────────────────────────────────────────────────────
  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/hub', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-hub-auth': token },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) {
        setAccounts((prev) => prev.filter((a) => String(a.id) !== String(id)));
        showToast('Account deleted.');
      }
    } catch { /* ignore */ }
    finally { setDeleteLoading(false); setDeleteConfirm(null); }
  }

  // ── Theme ────────────────────────────────────────────────────────────────
  const bg = isDark ? '#0f172a' : '#f0f4f8';
  const paper = isDark ? '#1e293b' : '#ffffff';
  const ink = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const line = isDark ? '#334155' : '#e2e8f0';
  const accent = PSA_NAVY;

  // ── Render: Login ────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', transition: 'background .2s' }}>
        <div style={{ background: paper, border: `1px solid ${line}`, borderRadius: 28, padding: '2.5rem 2rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.15)', position: 'relative' }}>
          {/* Dark toggle */}
          <button onClick={() => setIsDark(!isDark)} style={{ position: 'absolute', right: 20, top: 20, background: 'transparent', border: `1.5px solid ${line}`, borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 28, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: '#fff', border: `1px solid ${line}`, borderRadius: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}>
              <img src="/logo.png" alt="PSA" style={{ width: 72, height: 72, objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 900, color: isDark ? ink : accent, margin: 0 }}>Pak Science Academy</p>
              <p style={{ fontSize: 12, color: sub, margin: '3px 0 0' }}>Hub Super-Admin Panel</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isDark ? '#1e3a5f' : '#e8f0fb', borderRadius: 10, padding: '6px 14px' }}>
              <ShieldCheck size={14} color="#3b82f6" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>Restricted Access — Hub Administrators Only</span>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: sub, display: 'block', marginBottom: 5 }}>Hub Username</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="hubadmin"
                autoComplete="username"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${line}`, background: isDark ? '#0f172a' : '#f8fafc', color: ink, fontSize: 13, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: sub, display: 'block', marginBottom: 5 }}>Hub Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Enter hub password"
                  autoComplete="current-password"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 42px 10px 14px', borderRadius: 12, border: `1.5px solid ${line}`, background: isDark ? '#0f172a' : '#f8fafc', color: ink, fontSize: 13, outline: 'none' }}
                />
                <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: sub }}>
                  {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {loginError && (
              <p style={{ fontSize: 12, color: '#ef4444', background: isDark ? '#450a0a' : '#fef2f2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              style={{ background: accent, color: '#fff', border: 'none', borderRadius: 14, padding: '12px 20px', fontSize: 14, fontWeight: 800, cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <ShieldCheck size={16} />
              {loginLoading ? 'Authenticating…' : 'Access Hub Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: Hub Dashboard ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'system-ui, -apple-system, sans-serif', transition: 'background .2s' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? '#166534' : '#991b1b', color: '#fff', padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,.3)', transition: 'all .3s' }}>
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: paper, border: `1px solid ${line}`, borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <XCircle size={22} color="#ef4444" />
              <p style={{ fontSize: 15, fontWeight: 800, color: ink, margin: 0 }}>Delete Principal Account?</p>
            </div>
            <p style={{ fontSize: 12.5, color: sub, margin: '0 0 20px' }}>
              This will permanently remove the account for <strong style={{ color: ink }}>{deleteConfirm.principalName}</strong> ({deleteConfirm.username}) from the Hub. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${line}`, background: 'transparent', color: ink, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleteLoading} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: deleteLoading ? 0.7 : 1 }}>
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: paper, borderBottom: `1px solid ${line}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${line}`, borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="PSA" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 900, color: isDark ? ink : accent, margin: 0, lineHeight: 1 }}>Pak Science Academy</p>
            <p style={{ fontSize: 10, color: sub, margin: '2px 0 0', fontWeight: 600 }}>Hub Super-Admin Panel</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, background: isDark ? '#1e3a5f' : '#dbeafe', color: '#3b82f6', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>
            🔒 hubadmin
          </span>
          <button onClick={() => setIsDark(!isDark)} style={{ background: 'transparent', border: `1.5px solid ${line}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={() => { setAuthed(false); setToken(''); setAccounts([]); }} style={{ background: 'transparent', border: `1.5px solid #ef4444`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }} title="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Principal Accounts', value: accounts.length, icon: Users, color: '#3b82f6' },
            { label: 'Active Accounts', value: accounts.filter((a) => a.isActive).length, icon: CheckCircle2, color: '#16a34a' },
            { label: 'Institutes Registered', value: new Set(accounts.map((a) => a.instituteName)).size, icon: Building2, color: '#9333ea' },
          ].map((s) => (
            <div key={s.label} style={{ background: paper, border: `1px solid ${line}`, borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 900, color: ink, margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 10.5, color: sub, margin: '3px 0 0', fontWeight: 600 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Accounts Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: ink, margin: 0 }}>Principal Accounts</h2>
            <p style={{ fontSize: 11.5, color: sub, margin: '3px 0 0' }}>Manage principal / admin login credentials here</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchAccounts} style={{ background: 'transparent', border: `1.5px solid ${line}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: sub, fontSize: 12, fontWeight: 700 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => { setShowCreate(true); setCreateError(''); setCreateSuccess(''); }} style={{ background: accent, border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 800 }}>
              <Plus size={15} /> New Account
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div style={{ background: paper, border: `1.5px solid ${accent}40`, borderRadius: 18, padding: 24, marginBottom: 20, boxShadow: `0 4px 24px ${accent}15` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={18} color={accent} />
                <p style={{ fontSize: 15, fontWeight: 800, color: ink, margin: 0 }}>Create New Principal Account</p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: sub, fontSize: 18 }}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {[
                  { key: 'instituteName', label: 'Institute / Academy Name', placeholder: 'e.g. Pak Science Academy – Branch 2' },
                  { key: 'principalName', label: 'Principal Full Name', placeholder: 'e.g. Dr. Muhammad Ahsan' },
                  { key: 'username', label: 'Login Username', placeholder: 'e.g. ahsan_psa' },
                  { key: 'notes', label: 'Notes (optional)', placeholder: 'e.g. Main campus admin' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: sub, display: 'block', marginBottom: 4 }}>{label}</label>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${line}`, background: isDark ? '#0f172a' : '#f8fafc', color: ink, fontSize: 12.5, outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: sub, display: 'block', marginBottom: 4 }}>Login Password</label>
                <div style={{ position: 'relative', maxWidth: '50%' }}>
                  <input
                    type={showFormPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 40px 9px 12px', borderRadius: 10, border: `1.5px solid ${line}`, background: isDark ? '#0f172a' : '#f8fafc', color: ink, fontSize: 12.5, outline: 'none' }}
                  />
                  <button type="button" onClick={() => setShowFormPass(!showFormPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: sub }}>
                    {showFormPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {createError && <p style={{ fontSize: 12, color: '#ef4444', background: isDark ? '#450a0a' : '#fef2f2', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{createError}</p>}
              {createSuccess && <p style={{ fontSize: 12, color: '#166534', background: isDark ? '#052e16' : '#f0fdf4', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{createSuccess}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${line}`, background: 'transparent', color: ink, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  Cancel
                </button>
                <button type="submit" disabled={createLoading} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: accent, color: '#fff', cursor: createLoading ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 13, opacity: createLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} />
                  {createLoading ? 'Creating…' : 'Create Principal Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts Table */}
        <div style={{ background: paper, border: `1px solid ${line}`, borderRadius: 18, overflow: 'hidden' }}>
          {listLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: sub }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
              Loading accounts…
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Users size={36} color={sub} style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: ink, margin: '0 0 4px' }}>No Principal Accounts Yet</p>
              <p style={{ fontSize: 12, color: sub, margin: 0 }}>Click "New Account" above to create the first principal login.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${line}`, background: isDark ? '#0f172a' : '#f8fafc' }}>
                  {['Institute / Academy', 'Principal Name', 'Username', 'Status', 'Created', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 800, color: sub, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, i) => (
                  <tr key={String(a.id)} style={{ borderBottom: i < accounts.length - 1 ? `1px solid ${line}` : 'none', transition: 'background .15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDark ? '#1e293b' : '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={14} color={accent} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: ink }}>{a.instituteName}</span>
                      </div>
                      {a.notes && <p style={{ fontSize: 10.5, color: sub, margin: '2px 0 0 22px' }}>{a.notes}</p>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: ink, fontWeight: 600 }}>{a.principalName}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ fontSize: 12, background: isDark ? '#0f172a' : '#f1f5f9', padding: '3px 8px', borderRadius: 6, color: isDark ? '#93c5fd' : '#1e40af', fontFamily: 'monospace' }}>{a.username}</code>
                        <button onClick={() => { navigator.clipboard.writeText(a.username); showToast('Username copied!'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, padding: 2 }} title="Copy username">
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: a.isActive ? '#dcfce7' : '#fef2f2', color: a.isActive ? '#166534' : '#991b1b' }}>
                        {a.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11.5, color: sub, whiteSpace: 'nowrap' }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => setDeleteConfirm(a)}
                        style={{ background: 'transparent', border: `1.5px solid #ef4444`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12, fontWeight: 700 }}
                        title="Delete account"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 11, color: sub, marginTop: 28 }}>
          Pak Science Academy Hub Panel · Restricted Access · {new Date().getFullYear()}
        </p>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus { outline: 2px solid ${accent} !important; outline-offset: 1px; }
      `}</style>
    </div>
  );
}
