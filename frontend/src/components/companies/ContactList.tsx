'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Contact } from '@away/shared';
import {
  User, Mail, Linkedin, Plus, X, Check,
  ChevronDown, Loader2, Phone, Search, Send,
  Clipboard, RefreshCw, UserCheck, ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/Badge';

const SENIORITY_OPTIONS = ['C-Suite', 'VP', 'Director', 'Manager', 'Individual Contributor', 'Other'];

interface ContactListProps {
  contacts: Contact[];
  companyId: string;
  companyName: string;
  companyWebsite: string | null;
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

export function ContactList({ contacts: initialContacts, companyId, companyName, companyWebsite }: ContactListProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [actionMode, setActionMode] = useState<'select' | 'manual' | 'apollo' | 'email'>('select');
  const [apolloStep, setApolloStep] = useState(0);
  const [apolloResult, setApolloResult] = useState<any | null>(null);
  const [emailStep, setEmailStep] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? 'dev-api-key';

  const getMockApolloContact = () => {
    const domain = companyWebsite
      ? companyWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
      : `${companyName.toLowerCase().replace(/\s/g, '')}.com`;
    
    // Deterministic selection based on companyId
    const charCodeSum = companyId.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const names = ['Amit Patel', 'Sneha Iyer', 'Rohan Deshmukh', 'Nisha Rao', 'Vikram Sen'];
    const titles = ['Operations Director', 'Head of People & HR', 'Chief of Staff', 'Facilities Manager', 'Admin Lead'];
    const seniorities = ['Director', 'VP', 'Manager', 'Manager', 'Lead'];
    
    const idx = charCodeSum % names.length;
    const name = names[idx];
    const email = `${name.toLowerCase().replace(' ', '.')}@${domain}`;
    
    return {
      name,
      title: titles[idx],
      email,
      linkedin_url: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`,
      seniority: seniorities[idx],
      decision_maker: true
    };
  };

  function runApolloLookup() {
    setActionMode('apollo');
    setApolloStep(0);
    setApolloResult(null);
    setError(null);
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      setApolloStep(currentStep);
      if (currentStep >= 3) {
        clearInterval(interval);
        const contact = getMockApolloContact();
        setApolloResult(contact);
      }
    }, 700);
  }

  function runColdEmailFlow() {
    setActionMode('email');
    setEmailStep(0);
    setError(null);
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      setEmailStep(currentStep);
      if (currentStep >= 4) {
        clearInterval(interval);
      }
    }, 600);
  }

  async function saveApolloContact() {
    if (!apolloResult) return;
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
        body: JSON.stringify(apolloResult),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to save contact');
      }

      const newContact: Contact = await res.json();
      setContacts((prev) => [...prev, newContact]);
      setSaved(true);
      setShowForm(false);
      setActionMode('select');
      setApolloResult(null);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

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
      setActionMode('select');
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
          onClick={() => {
            setShowForm((v) => {
              const next = !v;
              if (next) {
                setActionMode('select');
              }
              return next;
            });
            setError(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            showForm
              ? 'bg-background-soft text-text-secondary border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200'
              : 'bg-away text-white hover:bg-away-600'
          }`}
        >
          {showForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Add Contact</>}
        </button>
      </div>

      {/* Add Contact Form & Outreach Flows */}
      {showForm && (
        <div className="mb-4 p-4 bg-background-soft rounded-xl border border-border space-y-4">
          {actionMode === 'select' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Choose outreach or contact channel
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {/* Find via Apollo */}
                <button
                  type="button"
                  onClick={runApolloLookup}
                  className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl text-left hover:border-away/30 hover:shadow-sm transition-all group animate-fade-in"
                >
                  <div className="p-2 bg-away-50 text-away rounded-lg group-hover:scale-105 transition-transform">
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                      Find via Apollo (AI Bot)
                      <span className="text-[10px] px-1.5 py-0.2 bg-away text-white rounded font-bold uppercase tracking-wider">Mock API</span>
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Search the Apollo.io database automatically using AI to discover decision-maker contacts.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-secondary/50 group-hover:text-away group-hover:translate-x-1 transition-all" />
                </button>

                {/* Send Cold Email */}
                <button
                  type="button"
                  onClick={runColdEmailFlow}
                  className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl text-left hover:border-away/30 hover:shadow-sm transition-all group animate-fade-in"
                >
                  <div className="p-2 bg-away-50 text-away rounded-lg group-hover:scale-105 transition-transform">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                      Send Cold Email (AI Agent)
                      <span className="text-[10px] px-1.5 py-0.2 bg-away text-white rounded font-bold uppercase tracking-wider">Mock Send</span>
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Draft and send an automated personalized email template to company leadership instantly.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-secondary/50 group-hover:text-away group-hover:translate-x-1 transition-all" />
                </button>

                {/* Manual entry */}
                <button
                  type="button"
                  onClick={() => setActionMode('manual')}
                  className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl text-left hover:border-away/30 hover:shadow-sm transition-all group animate-fade-in"
                >
                  <div className="p-2 bg-away-50 text-away rounded-lg group-hover:scale-105 transition-transform">
                    <Clipboard className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      Manual entry (Zoho CRM)
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Manually type contact information and sync directly to Zoho CRM leads database.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-secondary/50 group-hover:text-away group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          )}

          {/* Apollo Flow */}
          {actionMode === 'apollo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Apollo.io Directory Lookup
                </p>
                <button
                  type="button"
                  onClick={() => setActionMode('select')}
                  className="text-xs font-semibold text-away hover:underline"
                >
                  Back to Channels
                </button>
              </div>

              {apolloStep < 3 ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 text-away animate-spin" />
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={apolloStep >= 1 ? "text-emerald-600 font-bold" : "text-text-secondary"}>
                        {apolloStep >= 1 ? "✓" : "○"} Querying Apollo database...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={apolloStep >= 2 ? "text-emerald-600 font-bold" : "text-text-secondary"}>
                        {apolloStep >= 2 ? "✓" : "○"} Scanning for decision makers at {companyName}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-text-secondary">
                        ○ Finding verified email & LinkedIn profile...
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {apolloResult && (
                    <div className="p-4 bg-white border border-border rounded-xl space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-base font-bold text-text-primary">{apolloResult.name}</p>
                          <p className="text-xs text-text-secondary">{apolloResult.title} ({apolloResult.seniority})</p>
                        </div>
                        <Badge variant="success">Found Decision Maker</Badge>
                      </div>
                      <div className="text-xs space-y-1 pt-2 border-t border-border/50">
                        <p className="flex items-center gap-2 text-text-secondary">
                          <Mail className="w-3.5 h-3.5" /> <span className="font-semibold text-text-primary">{apolloResult.email}</span>
                        </p>
                        <p className="flex items-center gap-2 text-text-secondary">
                          <Linkedin className="w-3.5 h-3.5" /> <span className="font-semibold text-text-primary">{apolloResult.linkedin_url}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={runApolloLookup}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white text-text-primary text-xs font-semibold rounded-lg hover:bg-background-soft transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Find
                    </button>
                    <button
                      type="button"
                      onClick={saveApolloContact}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-away text-white text-xs font-semibold rounded-lg hover:bg-away-600 disabled:opacity-60 transition-colors"
                    >
                      {saving ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing...</>
                      ) : (
                        <><UserCheck className="w-3.5 h-3.5" /> Add & Sync to Zoho</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Flow */}
          {actionMode === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Cold Outreach Automation
                </p>
                <button
                  type="button"
                  onClick={() => setActionMode('select')}
                  className="text-xs font-semibold text-away hover:underline"
                >
                  Back to Channels
                </button>
              </div>

              {emailStep < 4 ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 text-away animate-spin" />
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={emailStep >= 1 ? "text-emerald-600 font-bold" : "text-text-secondary"}>
                        {emailStep >= 1 ? "✓" : "○"} Reading {companyName} signals...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={emailStep >= 2 ? "text-emerald-600 font-bold" : "text-text-secondary"}>
                        {emailStep >= 2 ? "✓" : "○"} Drafting personalized subject line...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={emailStep >= 3 ? "text-emerald-600 font-bold" : "text-text-secondary"}>
                        {emailStep >= 3 ? "✓" : "○"} Personalizing with co-working product recommendations...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-text-secondary">
                        ○ Dispatching email via SMTP gateway...
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-800 text-sm">
                    <p className="flex items-center gap-2 font-bold text-emerald-900">
                      <Check className="w-5 h-5 text-emerald-600" />
                      Cold email successfully sent to {companyName} team!
                    </p>
                    <p className="text-xs">
                      Outreach signal tracked and registered in the database for followup sequence.
                    </p>
                  </div>

                  {/* Mail Preview */}
                  <div className="bg-white border border-border rounded-xl overflow-hidden text-xs">
                    <div className="bg-background-soft px-3 py-2 border-b border-border space-y-1 font-medium text-text-secondary">
                      <p><span className="font-semibold text-text-primary">To:</span> leadership@{companyWebsite ? companyWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : `${companyName.toLowerCase().replace(/\s/g, '')}.com`}</p>
                      <p><span className="font-semibold text-text-primary">Subject:</span> Flexible co-working solutions for {companyName} team</p>
                    </div>
                    <div className="p-3 text-text-primary space-y-2 leading-relaxed whitespace-pre-wrap font-sans">
                      {`Hi Team,

I noticed your recent expansion signals in India and wanted to check if you have any co-working or flexible office space requirements for the ${companyName} team.

Away Center offers premium flexible offices, day passes, and meeting rooms with no long-term lease commitments.

Would you be open to a quick 10-minute discovery call this week?

Best regards,
Sales Representative
Away Intelligence`}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setActionMode('select'); }}
                      className="px-4 py-1.5 bg-away text-white text-xs font-semibold rounded-lg hover:bg-away-600 transition-colors"
                    >
                      Close Outreach Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Form */}
          {actionMode === 'manual' && (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Manual CRM Entry Form (Zoho CRM)
                </p>
                <button
                  type="button"
                  onClick={() => setActionMode('select')}
                  className="text-xs font-semibold text-away hover:underline"
                >
                  Back to Channels
                </button>
              </div>

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
        </div>
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
