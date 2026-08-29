'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Plus, Trash2, Eye, EyeOff, Users, Building2,
  KeyRound, RefreshCw, CheckCircle2, XCircle, Copy, AlertCircle
} from 'lucide-react';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { useToast } from '@/context/ToastContext';

function makeToken(u, p) {
  return Buffer.from(`${u}:${p}`).toString('base64');
}

export default function HubScreen() {
  const toast = useToast();
  const token = makeToken('Ahsan3727', 'Ahsan3727');

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    instituteName: '',
    principalName: '',
    username: '',
    password: '',
    notes: '',
  });
  const [showFormPass, setShowFormPass] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hub', {
        headers: { 'x-hub-auth': token },
      });
      const data = await res.json();
      if (data.ok) {
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Error fetching hub accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  async function handleCreate(e) {
    if (e && e.preventDefault) e.preventDefault();
    setCreateError('');

    if (!form.instituteName || !form.principalName || !form.username || !form.password) {
      setCreateError('Please fill all required fields.');
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
        headers: {
          'Content-Type': 'application/json',
          'x-hub-auth': token,
        },
        body: JSON.stringify({ action: 'create', ...form }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`Principal account "${form.username}" created successfully!`, 'success');
        setForm({ instituteName: '', principalName: '', username: '', password: '', notes: '' });
        setShowCreate(false);
        fetchAccounts();
      } else {
        setCreateError(data.error || 'Failed to create principal account.');
      }
    } catch (err) {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/hub', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-auth': token,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) {
        setAccounts((prev) => prev.filter((a) => String(a.id) !== String(id)));
        toast('Principal account removed from Hub.', 'success');
        setDeleteConfirm(null);
      } else {
        toast(data.error || 'Failed to delete account.', 'error');
      }
    } catch (err) {
      toast('Network error deleting account.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <ScreenBody>
      {/* Super-Admin Badge Banner */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--role-bg)] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#12355A] text-white shadow-sm">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-[14px] font-extrabold text-[var(--ink)]">Super-Admin Hub Control</h2>
            <p className="text-[11.5px] text-[var(--sub)]">
              Authorized as <strong className="text-[var(--ink)]">Ahsan3727</strong> · Central Principal & Institute Management
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchAccounts}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-[12px] font-bold text-[var(--ink)] shadow-sm hover:bg-[var(--bg)]"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-[var(--ink)]">{accounts.length}</p>
            <p className="text-[11px] font-semibold text-[var(--sub)]">Principal Accounts</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-[var(--ink)]">{accounts.filter((a) => a.isActive).length}</p>
            <p className="text-[11px] font-semibold text-[var(--sub)]">Active Accounts</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-[var(--ink)]">{new Set(accounts.map((a) => a.instituteName)).size}</p>
            <p className="text-[11px] font-semibold text-[var(--sub)]">Institutes Registered</p>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-extrabold text-[var(--ink)]">Institute Principal Logins</h3>
          <p className="text-[11.5px] text-[var(--sub)]">Create and manage access credentials for Institute Principals</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setCreateError('');
          }}
          className="flex items-center gap-1.5 rounded-xl bg-[#12355A] px-3.5 py-2 text-[12.5px] font-bold text-white shadow-sm hover:opacity-95"
        >
          <Plus size={15} /> Create Principal Account
        </button>
      </div>

      {/* Create Modal / Form Card */}
      {showCreate && (
        <Card className="mb-4 border-2 border-[#12355A]/30 shadow-lg">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2.5">
            <div className="flex items-center gap-2">
              <KeyRound size={17} className="text-[#12355A]" />
              <p className="text-[14px] font-bold text-[var(--ink)]">New Principal Account</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-[16px] font-bold text-[var(--sub)] hover:text-[var(--ink)]"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[var(--sub)]">Institute / Branch Name *</label>
                <input
                  type="text"
                  value={form.instituteName}
                  onChange={(e) => setForm((f) => ({ ...f, instituteName: e.target.value }))}
                  placeholder="e.g. Pak Science Academy - Main"
                  className="w-full rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink)] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[var(--sub)]">Principal Full Name *</label>
                <input
                  type="text"
                  value={form.principalName}
                  onChange={(e) => setForm((f) => ({ ...f, principalName: e.target.value }))}
                  placeholder="e.g. Principal Admin"
                  className="w-full rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink)] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[var(--sub)]">Login Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="e.g. principal_main"
                  className="w-full rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink)] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[var(--sub)]">Login Password *</label>
                <div className="relative">
                  <input
                    type={showFormPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3 py-2 pr-9 text-[12.5px] font-semibold text-[var(--ink)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPass(!showFormPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--sub)]"
                  >
                    {showFormPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-[var(--sub)]">Notes (Optional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Campus incharge, contact 0300-XXXXXXX"
                className="w-full rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink)] outline-none"
              />
            </div>

            {createError && (
              <p className="rounded-lg bg-red-50 p-2 text-[12px] font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {createError}
              </p>
            )}

            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-[12.5px] font-bold text-[var(--ink)] hover:bg-[var(--bg)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="flex items-center gap-1.5 rounded-xl bg-[#12355A] px-4 py-2 text-[12.5px] font-bold text-white shadow-sm hover:opacity-95"
              >
                <Plus size={14} />
                {createLoading ? 'Saving...' : 'Save Principal Account'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Accounts List Card */}
      <Card>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-[var(--sub)]">
            <RefreshCw size={22} className="animate-spin mb-2" />
            <p className="text-[12.5px]">Loading registered principal accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Users size={36} className="text-[var(--sub)] mb-2 opacity-50" />
            <p className="text-[14px] font-bold text-[var(--ink)]">No Principal Accounts Registered</p>
            <p className="text-[12px] text-[var(--sub)] mt-0.5">
              Click &quot;Create Principal Account&quot; above to set up the first institute login.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {accounts.map((a) => (
              <div key={String(a.id)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-[#12355A] shrink-0" />
                    <p className="text-[13.5px] font-bold text-[var(--ink)] truncate">{a.instituteName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[var(--sub)]">
                    Principal: <strong className="text-[var(--ink)]">{a.principalName}</strong>
                    {a.notes ? ` · ${a.notes}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg)] px-2.5 py-1 text-[11.5px] font-mono text-[var(--ink)] border border-[var(--line)]">
                    <span>{a.username}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(a.username);
                        toast(`Copied username: ${a.username}`, 'success');
                      }}
                      title="Copy username"
                      className="text-[var(--sub)] hover:text-[var(--ink)]"
                    >
                      <Copy size={12} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(a)}
                    className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11.5px] font-bold text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-2xl">
            <div className="mb-2 flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              <p className="text-[14.5px] font-bold text-[var(--ink)]">Delete Principal Account?</p>
            </div>
            <p className="mb-4 text-[12px] text-[var(--sub)]">
              This will permanently delete the login for <strong className="text-[var(--ink)]">{deleteConfirm.principalName}</strong> ({deleteConfirm.username}).
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-[12px] font-bold text-[var(--ink)] hover:bg-[var(--bg)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => handleDelete(deleteConfirm.id)}
                className="rounded-xl bg-red-600 px-3.5 py-2 text-[12px] font-bold text-white hover:bg-red-700"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ScreenBody>
  );
}
