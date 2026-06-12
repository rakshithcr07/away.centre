'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Contact } from '@away/shared';
import {
  User, Mail, Linkedin, Plus, X, Check,
  ChevronDown, Loader2, Phone,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/Badge';

const SENIORITY_OPTIONS = ['C-Suite', 'VP', 'Director', 'Manager', 'Individual Contributor', 'Other'];

interface ContactListProps {
  contacts: Contact[];
  companyId: string;
}

interface FormState {
  name: string;
  title: string;
  email: string;
  linkedin_url: string;
  seniority: string;
  decision_maker: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  title: '',
  email: '',
  linkedin_url: '',
  seniority: '',
  decision_maker: false,
};

export function ContactList({ contacts: initialContacts, companyId }: ContactListProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? 'dev-api-key';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/companies/${companyId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'x-user-role': 'admin',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          title: form.title || undefined,
          email: form.email || undefined,
          linkedin_url: form.linkedin_url || undefined,
          seniority: form.seniority || undefined,
          decision_maker: form.decision_maker,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to save contact');
      }

      const newContact: Contact = await res.json();
      setContacts((prev) => [...prev, newContact]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle title={`Contacts (${contacts.length})`} />
        <button
          onClick={() => { setShowForm((v) => !v); setError(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            showForm
              ? 'bg-background-soft text-text-secondary border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200'
              : 'bg-away text-white hover:bg-away-600'
          }`}
        >
          {showForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Add Contact</>}
        </button>
      </div>

      {/* Add Contact Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 p-4 bg-background-soft rounded-xl border border-border space-y-3"
        >
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            New Contact
          </p>

          {/* Name + Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Name <span className="text-away">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Priya Mehta"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-away focus:ring-1 focus:ring-away/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Title / Role</label>
              <input
                type="text"
                placeholder="e.g. HR Manager"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-away focus:ring-1 focus:ring-away/30"
              />
            </div>
          </div>

          {/* Email + LinkedIn */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
              <input
                type="email"
                placeholder="priya@company.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-away focus:ring-1 focus:ring-away/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">LinkedIn URL</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={form.linkedin_url}
                onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-away focus:ring-1 focus:ring-away/30"
              />
            </div>
          </div>

          {/* Seniority + Decision Maker */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Seniority</label>
              <div className="relative">
                <select
                  value={form.seniority}
                  onChange={(e) => setForm((f) => ({ ...f, seniority: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 text-sm rounded-lg border border-border bg-white text-text-primary focus:outline-none focus:border-away focus:ring-1 focus:ring-away/30 pr-8"
                >
                  <option value="">Select seniority</option>
                  {SENIORITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 pb-1">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, decision_maker: !f.decision_maker }))}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                  form.decision_maker ? 'bg-away' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    form.decision_maker ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <label className="text-sm text-text-primary font-medium cursor-pointer select-none"
                onClick={() => setForm((f) => ({ ...f, decision_maker: !f.decision_maker }))}>
                Decision Maker
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-away text-white text-sm font-semibold rounded-lg hover:bg-away-600 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-4 h-4" /> Save Contact</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Success toast */}
      {saved && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          <Check className="w-4 h-4" />
          Contact saved successfully
        </div>
      )}

      {/* Contact list */}
      <div className="space-y-2">
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No contacts yet</p>
            <p className="text-xs mt-1">Click "Add Contact" to add the first one</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-start gap-3 p-3 bg-background-soft rounded-xl border border-border hover:border-away/20 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-away-50 border-2 border-away/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-away">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-text-primary">{contact.name}</p>
                  {contact.decision_maker && (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0">DM</Badge>
                  )}
                  {contact.seniority && (
                    <span className="text-[10px] px-2 py-0.5 bg-background-soft border border-border rounded-full text-text-secondary font-medium">
                      {contact.seniority}
                    </span>
                  )}
                </div>
                {contact.title && (
                  <p className="text-xs text-text-secondary mt-0.5">{contact.title}</p>
                )}
              </div>

              {/* Action icons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    title={contact.email}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-border text-text-secondary hover:text-away hover:border-away/30 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
                {contact.linkedin_url && (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-border text-text-secondary hover:text-blue-600 hover:border-blue-200 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
