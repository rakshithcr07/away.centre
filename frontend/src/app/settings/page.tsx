'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import {
  Settings,
  Play,
  Clock,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  Info
} from 'lucide-react';
import clsx from 'clsx';

interface SchedulerLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: {
    success: boolean;
    duration: number;
    trigger_type: 'automatic' | 'manual';
    error?: string;
  };
  ip_address: string | null;
  created_at: string;
}

const PRESETS = [
  { label: 'Every 1 Hour', value: '0 */1 * * *' },
  { label: 'Every 6 Hours', value: '0 */6 * * *' },
  { label: 'Every 12 Hours', value: '0 */12 * * *' },
  { label: 'Daily (Midnight)', value: '0 0 * * *' },
  { label: 'Weekly (Monday Midnight)', value: '0 0 * * 1' },
];

export default function SettingsPage() {
  const [cron, setCron] = useState('0 */6 * * *');
  const [preset, setPreset] = useState('0 */6 * * *');
  const [fitWeight, setFitWeight] = useState(0.4);
  const [intentWeight, setIntentWeight] = useState(0.4);
  const [timingWeight, setTimingWeight] = useState(0.2);

  const [lastRun, setLastRun] = useState<string | null>(null);
  const [lastRunStatus, setLastRunStatus] = useState('idle');

  const [history, setHistory] = useState<SchedulerLog[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<SchedulerLog[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'automatic' | 'manual'>('all');

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [triggeringPipeline, setTriggeringPipeline] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load settings and trigger logs
  async function loadData() {
    try {
      const [settings, logs] = await Promise.all([
        api.getSettings(),
        api.getSchedulerHistory()
      ]);

      setCron(settings.signal_collection_cron);
      setFitWeight(settings.fit_weight);
      setIntentWeight(settings.intent_weight);
      setTimingWeight(settings.timing_weight);
      setLastRun(settings.last_run);
      setLastRunStatus(settings.last_run_status);

      // Determine if cron matches a preset
      const matchingPreset = PRESETS.find(p => p.value === settings.signal_collection_cron);
      if (matchingPreset) {
        setPreset(settings.signal_collection_cron);
      } else {
        setPreset('custom');
      }

      setHistory(logs);
    } catch (err: any) {
      console.error('Failed to load settings data', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter history
  useEffect(() => {
    let result = [...history];
    if (statusFilter !== 'all') {
      result = result.filter(item => 
        statusFilter === 'success' ? item.details.success : !item.details.success
      );
    }
    if (typeFilter !== 'all') {
      result = result.filter(item => item.details.trigger_type === typeFilter);
    }
    setFilteredHistory(result);
  }, [history, statusFilter, typeFilter]);

  // Handle Preset Change
  const handlePresetChange = (value: string) => {
    setPreset(value);
    if (value !== 'custom') {
      setCron(value);
    }
  };

  // Weight validation
  const sumWeights = parseFloat((fitWeight + intentWeight + timingWeight).toFixed(2));
  const isWeightValid = sumWeights === 1.0;

  // Save Settings
  const handleSaveSettings = async () => {
    if (!isWeightValid) {
      setSaveError('Scoring weights must sum to exactly 1.0 (100%)');
      return;
    }

    setSavingSettings(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await api.updateSettings({
        signal_collection_cron: cron,
        fit_weight: fitWeight,
        intent_weight: intentWeight,
        timing_weight: timingWeight
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Reload updated settings and logs
      await loadData();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Run Pipeline Manually
  const handleTriggerPipeline = async () => {
    setTriggeringPipeline(true);
    try {
      await api.triggerPipeline();
      // Reload logs and status
      await loadData();
    } catch (err: any) {
      alert('Pipeline execution failed: ' + err.message);
    } finally {
      setTriggeringPipeline(false);
    }
  };

  // Format Date Helper
  const formatDate = (isoString: string) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PageHeader showActions={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-away animate-spin" />
            <p className="text-text-secondary text-sm">Loading settings and trigger history...</p>
          </div>
        </div>
      </div>
    );
  }

  // Combined Weight Bar Calculations
  const fitWidth = (fitWeight / 1.0) * 100;
  const intentWidth = (intentWeight / 1.0) * 100;
  const timingWidth = (timingWeight / 1.0) * 100;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader showActions={false} />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Page title header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight flex items-center gap-2">
              <Settings className="w-8 h-8 text-away" />
              Scheduler & Scoring Configuration
            </h1>
            <p className="text-text-secondary mt-1 max-w-2xl">
              Manage the automatic background signals pipeline frequency and calibrate lead score weighting variables dynamically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Settings form column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Scheduler Card */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-away-50 rounded-lg text-away">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Pipeline Scheduler</h2>
                  <p className="text-xs text-text-secondary">Determine how frequently the system crawls and processes signals</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Preset selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Schedule Preset</label>
                    <Select
                      value={preset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="w-full"
                    >
                      {PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                      <option value="custom">Custom Cron Expression</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Cron Expression
                    </label>
                    <Input
                      type="text"
                      value={cron}
                      onChange={(e) => {
                        setCron(e.target.value);
                        setPreset('custom');
                      }}
                      placeholder="e.g. 0 */6 * * *"
                      disabled={preset !== 'custom'}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="bg-background/60 p-4 rounded-xl border border-border text-xs text-text-secondary flex gap-3">
                  <Info className="w-4 h-4 text-away flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-text-primary mb-0.5">Scheduler Hot-reloading Active</p>
                    <p>Changing the schedule will dynamically trigger node-cron job realignment on the background server process instantly without restarting the API or worker nodes.</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Weights Card */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Lead Score Weights</h2>
                    <p className="text-xs text-text-secondary">Calibrate how each category shapes the overall account score</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={clsx(
                    "text-sm font-bold px-3 py-1 rounded-full",
                    isWeightValid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  )}>
                    Sum: {sumWeights.toFixed(2)} / 1.00
                  </span>
                </div>
              </div>

              {/* Dynamic Weights Visualization */}
              <div className="mb-8">
                <div className="text-xs font-semibold text-text-secondary mb-2 flex justify-between">
                  <span>Visual Calibrator Allocation</span>
                  <span>{isWeightValid ? "Optimal (100% Shared)" : "Total must equal 100%"}</span>
                </div>
                <div className="h-4 w-full bg-background rounded-full overflow-hidden flex border border-border">
                  <div
                    style={{ width: `${fitWidth}%` }}
                    className="h-full bg-away transition-all duration-300"
                    title={`Fit: ${fitWidth.toFixed(0)}%`}
                  />
                  <div
                    style={{ width: `${intentWidth}%` }}
                    className="h-full bg-amber-500 transition-all duration-300"
                    title={`Intent: ${intentWidth.toFixed(0)}%`}
                  />
                  <div
                    style={{ width: `${timingWidth}%` }}
                    className="h-full bg-accent-brown transition-all duration-300"
                    title={`Timing: ${timingWidth.toFixed(0)}%`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                  <div className="flex items-center justify-center gap-1.5 font-medium text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-away block" />
                    Fit: {(fitWeight * 100).toFixed(0)}%
                  </div>
                  <div className="flex items-center justify-center gap-1.5 font-medium text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
                    Intent: {(intentWeight * 100).toFixed(0)}%
                  </div>
                  <div className="flex items-center justify-center gap-1.5 font-medium text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-brown block" />
                    Timing: {(timingWeight * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Range sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-semibold text-text-primary">Fit Weight</span>
                    <span className="text-text-secondary font-mono">{fitWeight}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={fitWeight}
                    onChange={(e) => setFitWeight(parseFloat(e.target.value))}
                    className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-away border border-border"
                  />
                  <p className="text-xs text-text-secondary mt-1">Match level of demographic parameters: industry suitability, location match, size criteria.</p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-semibold text-text-primary">Intent Weight</span>
                    <span className="text-text-secondary font-mono">{intentWeight}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={intentWeight}
                    onChange={(e) => setIntentWeight(parseFloat(e.target.value))}
                    className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-amber-500 border border-border"
                  />
                  <p className="text-xs text-text-secondary mt-1">Hiring activity, social signals, company expansion posts, or workspace search indicators.</p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-semibold text-text-primary">Timing Weight</span>
                    <span className="text-text-secondary font-mono">{timingWeight}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={timingWeight}
                    onChange={(e) => setTimingWeight(parseFloat(e.target.value))}
                    className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-accent-brown border border-border"
                  />
                  <p className="text-xs text-text-secondary mt-1">Freshness multiplier. Signals collected within 7 days carry the highest multipliers.</p>
                </div>
              </div>
            </Card>

            {/* Error / Success Notifications and Save button */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-6 bg-white border border-border rounded-2xl">
              <div className="flex-1">
                {saveSuccess && (
                  <div className="text-sm text-emerald-700 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Configuration saved and loaded dynamically!
                  </div>
                )}
                {saveError && (
                  <div className="text-sm text-red-600 flex items-center gap-2 font-medium">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    {saveError}
                  </div>
                )}
                {!saveSuccess && !saveError && !isWeightValid && (
                  <div className="text-sm text-amber-600 flex items-center gap-2 font-medium">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Weights must sum to 1.00 before you can save.
                  </div>
                )}
                {!saveSuccess && !saveError && isWeightValid && (
                  <div className="text-xs text-text-secondary">
                    Saving triggers live background update & score recalculation for all leads immediately.
                  </div>
                )}
              </div>
              <Button
                variant="primary"
                onClick={handleSaveSettings}
                disabled={savingSettings || !isWeightValid}
                loading={savingSettings}
                className="justify-center min-w-[150px]"
              >
                {savingSettings ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>

          </div>

          {/* Scheduler status column */}
          <div className="space-y-8">
            <Card className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">System Operations</h2>
                    <p className="text-xs text-text-secondary">Current status of data pipelines</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-background border border-border rounded-xl">
                    <span className="text-xs text-text-secondary block mb-1">Pipeline State</span>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "w-3 h-3 rounded-full block",
                        lastRunStatus === 'running' && "bg-blue-500 animate-pulse",
                        lastRunStatus === 'success' && "bg-emerald-500",
                        lastRunStatus === 'failed' && "bg-red-500",
                        lastRunStatus === 'idle' && "bg-gray-400"
                      )} />
                      <span className="text-sm font-bold text-text-primary capitalize">{lastRunStatus}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-background border border-border rounded-xl">
                    <span className="text-xs text-text-secondary block mb-1">Last Pipeline Run</span>
                    <span className="text-sm font-bold text-text-primary font-mono block">
                      {lastRun ? formatDate(lastRun) : 'Never Triggered'}
                    </span>
                  </div>

                  <div className="p-4 bg-background border border-border rounded-xl">
                    <span className="text-xs text-text-secondary block mb-1">Current Frequency</span>
                    <span className="text-sm font-bold text-text-primary block font-mono">
                      {cron}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <Button
                  onClick={handleTriggerPipeline}
                  disabled={triggeringPipeline || lastRunStatus === 'running'}
                  loading={triggeringPipeline}
                  className="w-full justify-center py-4"
                  icon={triggeringPipeline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                >
                  {triggeringPipeline ? 'Pipeline Running...' : 'Trigger Pipeline Now'}
                </Button>
                <p className="text-[10px] text-center text-text-secondary mt-2">
                  Initiates an ad-hoc manual run across search signal scrapers, scoring engine and Zoho CRM synchronization.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* 4. Trigger History Section */}
        <Card className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-away" />
                Pipeline Trigger History
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Audit trail of all automated cron and manual pipeline trigger executions
              </p>
            </div>

            {/* History Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex border border-border rounded-lg overflow-hidden bg-background">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    typeFilter === 'all' ? "bg-away text-white" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  All Types
                </button>
                <button
                  onClick={() => setTypeFilter('automatic')}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium border-l border-border transition-colors",
                    typeFilter === 'automatic' ? "bg-away text-white" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Automatic
                </button>
                <button
                  onClick={() => setTypeFilter('manual')}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium border-l border-border transition-colors",
                    typeFilter === 'manual' ? "bg-away text-white" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Manual
                </button>
              </div>

              <div className="flex border border-border rounded-lg overflow-hidden bg-background">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === 'all' ? "bg-away text-white" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  All Statuses
                </button>
                <button
                  onClick={() => setStatusFilter('success')}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium border-l border-border transition-colors",
                    statusFilter === 'success' ? "bg-away text-white" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Success
                </button>
                <button
                  onClick={() => setStatusFilter('failed')}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium border-l border-border transition-colors",
                    statusFilter === 'failed' ? "bg-away text-white" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Failed
                </button>
              </div>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 bg-background rounded-2xl border border-dashed border-border">
              <Calendar className="w-10 h-10 text-text-secondary mx-auto mb-2 opacity-50" />
              <p className="text-text-primary font-medium text-sm">No triggers found</p>
              <p className="text-text-secondary text-xs mt-1">Try relaxing filters or running the pipeline manually.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-secondary text-left border-b border-border">
                    <th className="pb-3 font-semibold">Trigger Timestamp</th>
                    <th className="pb-3 font-semibold">Trigger Mode</th>
                    <th className="pb-3 font-semibold">Duration</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredHistory.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const success = log.details.success !== false;
                    const durationText = log.details.duration
                      ? `${(log.details.duration / 1000).toFixed(2)}s`
                      : '—';

                    return (
                      <tr key={log.id} className="hover:bg-background-soft transition-colors group">
                        <td className="py-3.5 font-medium text-text-primary">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-3.5">
                          <span className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                            log.details.trigger_type === 'manual'
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          )}>
                            <span className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              log.details.trigger_type === 'manual' ? "bg-purple-600" : "bg-blue-600"
                            )} />
                            {log.details.trigger_type === 'manual' ? 'Manual (UI)' : 'Automatic (Cron)'}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-text-primary text-xs">
                          {durationText}
                        </td>
                        <td className="py-3.5">
                          <span className={clsx(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                            success
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          )}>
                            {success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-red-600" />}
                            {success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {log.details.error ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-away hover:text-away-600 font-semibold inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:bg-away-50 transition-colors"
                            >
                              {isExpanded ? 'Hide Error' : 'View Error'}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="text-text-secondary text-xs pr-3 group-hover:block hidden">Job ID: {log.id.slice(0, 8)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredHistory.map((log) => {
                const isExpanded = expandedLogId === log.id;
                if (!isExpanded || !log.details.error) return null;

                return (
                  <div key={`${log.id}-error`} className="bg-red-50 border border-red-200 rounded-xl p-4 my-2 text-xs text-red-700 font-mono flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-1">Execution Failure Stack:</p>
                      <p className="whitespace-pre-wrap">{log.details.error}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
