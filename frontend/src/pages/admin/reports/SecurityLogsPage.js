import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  RefreshCcw,
  Search,
  Download,
  Radar,
  Shield,
  Ban,
  BadgeCheck,
  Clock3,
  ShieldOff,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge, Button, EmptyState, Input, SectionCard, Select, Spinner } from '../../../components/ui';
import { securityAPI } from '../../../services/api';
import { format } from 'date-fns';
import useDebouncedValue from '../../../hooks/useDebouncedValue';

const severityLabel = {
  low: 'LOW',
  medium: 'MEDIUM INCIDENT',
  high: 'HIGH INCIDENT',
  critical: 'CRITICAL INCIDENT',
};

const severityVariant = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

function escapeCsvValue(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(incidents) {
  const header = [
    'id',
    'event_type',
    'severity',
    'status',
    'actor_email',
    'target_user_name',
    'request_method',
    'endpoint',
    'source_ip',
    'browser',
    'operating_system',
    'device_type',
    'message',
    'created_at',
  ];

  const rows = incidents.map((incident) => [
    incident.id,
    incident.event_type,
    incident.severity,
    incident.status,
    incident.actor_email,
    incident.target_user_name,
    incident.request_method,
    incident.endpoint,
    incident.source_ip,
    incident.browser,
    incident.operating_system,
    incident.device_type,
    incident.message,
    incident.created_at,
  ].map(escapeCsvValue).join(','));

  return [header.map(escapeCsvValue).join(','), ...rows].join('\r\n');
}

function safeFormatDate(value, pattern, fallback = '-') {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return format(parsed, pattern);
}

function IncidentCard({ incident, selected, onToggleSelect, onBlock, onResolve, onDelete, busyId }) {
  const canBlock = Boolean(incident.source_ip) && incident.status !== 'blocked';
  const safeMeta = incident.target_user_meta || 'No user metadata';
  const statusTone = {
    open: 'bg-amber-50 text-amber-700 border-amber-200',
    blocked: 'bg-red-50 text-red-700 border-red-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ignored: 'bg-slate-100 text-slate-600 border-slate-200',
  }[incident.status] || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
      <div className="h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-orange-500" />
      <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 md:px-6">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(incident.id)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 shadow-sm">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={severityVariant[incident.severity] || 'warning'} className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em]">
              {severityLabel[incident.severity] || 'INCIDENT'}
            </Badge>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusTone}`}>
              {incident.status}
            </span>
          </div>

          <div className="text-[1.3rem] font-black leading-tight tracking-[-0.04em] text-slate-950 md:text-[1.5rem]">{incident.event_type}</div>
          <p className="mt-1.5 max-w-4xl text-sm leading-6 text-slate-600 md:text-[0.95rem]">
            [Attributed to {incident.actor_email || safeMeta}] {incident.message || 'Suspicious activity detected.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start pt-0.5">
          <Button
            size="sm"
            variant="danger"
            disabled={!canBlock || busyId === incident.id}
            loading={busyId === incident.id}
            onClick={() => onBlock(incident.id)}
            className="h-9 rounded-full px-4"
          >
            Block
          </Button>
          <Button
            size="sm"
            variant="success"
            disabled={incident.status === 'resolved' || busyId === incident.id}
            loading={busyId === incident.id}
            onClick={() => onResolve(incident.id)}
            className="h-9 rounded-full px-4"
          >
            <ShieldCheck className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busyId === incident.id}
            loading={busyId === incident.id}
            onClick={() => onDelete(incident.id)}
            className="h-9 rounded-full px-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-4 md:grid-cols-4 md:px-6">
        <StatMini label="Target User" value={incident.target_user_name || 'Unknown / Guest'} helper={safeMeta} />
        <StatMini label="Endpoint" value={`${incident.request_method || 'GET'} ${incident.endpoint || '-'}`} helper={incident.status === 'blocked' ? 'Currently blocked' : 'Action required'} tone="blue" />
        <StatMini label="Source IP" value={incident.source_ip || '-'} helper={incident.browser || 'Unknown browser'} tone="slate" />
        <StatMini label="Timestamp" value={safeFormatDate(incident.created_at, 'MMM d, yyyy')} helper={safeFormatDate(incident.created_at, 'h:mm a')} tone="violet" />
      </div>

      <div className="mx-5 mb-5 rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:mx-6">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
          <Shield className="h-3.5 w-3.5 text-brand-primary" /> Device Details (Fingerprint)
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <DetailChip label="Browser" value={incident.browser || 'Unknown'} icon={<ShieldCheck className="h-4 w-4" />} />
          <DetailChip label="Operating System" value={incident.operating_system || 'Unknown'} icon={<Clock3 className="h-4 w-4" />} />
          <DetailChip label="Device Type" value={incident.device_type || 'Unknown'} icon={<ShieldOff className="h-4 w-4" />} />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-6 text-slate-500 shadow-sm">
          <span className="font-semibold text-slate-700">Raw User-Agent:</span> {incident.user_agent || 'Unavailable'}
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, helper, tone = 'default' }) {
  const toneMap = {
    default: 'bg-white',
    blue: 'bg-blue-50/60',
    slate: 'bg-slate-50/80',
    violet: 'bg-violet-50/70',
  };

  return (
    <div className={`rounded-2xl border border-slate-200 px-4 py-3 ${toneMap[tone] || toneMap.default}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-bold text-slate-950">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500">{helper}</div>
    </div>
  );
}

function DetailChip({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">{icon}</div>
      </div>
      <div className="text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main Page with Tabs
   ───────────────────────────────────────────────────────────── */

export default function SecurityLogsPage() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, open_count: 0, blocked_count: 0, resolved_count: 0, high_risk_count: 0 });
  const [insights, setInsights] = useState({ top_event_types: [], last_24h_total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ status: '', severity: '', search: '' });
  const debouncedIncidentSearch = useDebouncedValue(filters.search, 400);
  const inFlightRef = useRef(null);
  const inFlightKeyRef = useRef('');
  const latestRequestIdRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    const queryKey = JSON.stringify({
      status: filters.status || '',
      severity: filters.severity || '',
      search: debouncedIncidentSearch || '',
    });

    // Avoid duplicate calls when the same query is already loading.
    if (inFlightRef.current && inFlightKeyRef.current === queryKey) {
      return inFlightRef.current;
    }

    inFlightKeyRef.current = queryKey;
    setLoading(true);
    setLoadError('');
    const request = (async () => {
      try {
        const res = await securityAPI.getIncidents({
          status: filters.status,
          severity: filters.severity,
          search: debouncedIncidentSearch,
        });
        // Keep UI consistent when multiple loads race: only latest response wins.
        if (!mountedRef.current || requestId !== latestRequestIdRef.current) return;
        setIncidents(res.data?.data || []);
        setStats(res.data?.stats || { total: 0, open_count: 0, blocked_count: 0, resolved_count: 0, high_risk_count: 0 });
        setInsights(res.data?.insights || { top_event_types: [], last_24h_total: 0 });
      } catch (error) {
        if (!mountedRef.current || requestId !== latestRequestIdRef.current) return;
        const message = error?.response?.data?.message || 'Failed to load security incidents.';
        setLoadError(message);
        toast.error(message);
      } finally {
        if (inFlightKeyRef.current === queryKey) {
          inFlightRef.current = null;
          inFlightKeyRef.current = '';
        }
        if (mountedRef.current && requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
      }
    })();

    inFlightRef.current = request;
    return request;
  }, [filters.status, filters.severity, debouncedIncidentSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const visibleIds = new Set(incidents.map((item) => item.id));
    setSelectedIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [incidents]);

  const allSelected = useMemo(() => incidents.length > 0 && selectedIds.length === incidents.length, [incidents.length, selectedIds.length]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : incidents.map((item) => item.id));
  };

  const runAction = async (id, action, successMessage) => {
    setBusyId(id);
    try {
      await action();
      toast.success(successMessage);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = (id) => runAction(id, () => securityAPI.resolveIncident(id), 'Incident marked as safe.');
  const handleBlock = (id) => runAction(id, () => securityAPI.blockIncidentIp(id), 'Source IP blocked.');
  const handleDelete = (id) => {
    if (!window.confirm('Delete this incident log permanently?')) return;
    runAction(id, () => securityAPI.deleteIncident(id), 'Incident deleted.');
  };

  const handleExport = () => {
    if (!incidents.length) {
      toast.error('No incidents to export.');
      return;
    }

    const csv = buildCsv(incidents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-alerts-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))]" />
        <div className="relative px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600 shadow-sm">
                <Radar className="h-3.5 w-3.5" /> Security Monitoring
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-slate-950 text-white shadow-[0_18px_32px_rgba(15,23,42,0.18)]">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="font-display text-[2rem] font-black tracking-[-0.06em] text-slate-950 md:text-[2.5rem]">Security Alerts</h1>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 md:text-[0.98rem]">
                    Live monitoring for unauthorized access, suspicious requests, and account abuse.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={handleExport}
                className="h-11 rounded-2xl bg-slate-900 px-5 text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)] hover:bg-slate-800"
              >
                <Download className="h-4 w-4" /> Export Data
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={load}
                className="h-11 rounded-2xl px-5"
              >
                <RefreshCcw className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total', value: stats.total || 0, icon: Shield, tone: 'from-slate-900 to-slate-700' },
              { label: 'Open', value: stats.open_count || 0, icon: AlertTriangle, tone: 'from-amber-500 to-orange-500' },
              { label: 'Blocked', value: stats.blocked_count || 0, icon: Ban, tone: 'from-rose-500 to-red-600' },
              { label: 'High Risk', value: stats.high_risk_count || 0, icon: BadgeCheck, tone: 'from-emerald-500 to-green-600' },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                    <div className="mt-1 text-[2rem] font-black tracking-[-0.06em] text-slate-950">{value}</div>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Last 24 Hours</div>
              <div className="mt-1 text-[2rem] font-black tracking-[-0.06em] text-slate-950">{insights.last_24h_total || 0}</div>
              <p className="text-xs text-slate-500">Incidents recorded in the past day</p>
            </div>
            <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Top Event Types</div>
              {insights.top_event_types?.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {insights.top_event_types.slice(0, 6).map((event, index) => (
                    <div key={`${event.event_type || 'event'}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="truncate text-xs font-semibold text-slate-700">{event.event_type}</span>
                      <Badge variant="warning" className="rounded-full px-2 py-0.5 text-[10px]">{event.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No event type trends available yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <>
          <SectionCard
            title="Filter Logs"
            description="Search by endpoint, user, IP, or message."
            action={(
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>{allSelected ? 'Unselect All' : 'Select All'}</Button>
                <Button variant="outline" size="sm" onClick={load}><RefreshCcw className="h-4 w-4" /> Refresh Logs</Button>
              </div>
            )}
            className="overflow-hidden border border-slate-200/80 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Quick Filters
            </div>
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="blocked">Blocked</option>
                  <option value="resolved">Resolved</option>
                  <option value="ignored">Ignored</option>
                </Select>
              </div>
              <div className="lg:col-span-3">
                <Select value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}>
                  <option value="">All Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </Select>
              </div>
              <div className="lg:col-span-4">
                <Input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search logs..."
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="lg:col-span-2">
                <Button variant="ghost" className="h-10 w-full" onClick={() => setFilters({ status: '', severity: '', search: '' })}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </SectionCard>

          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" className="text-brand-primary" /></div>
          ) : loadError ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 py-8 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <EmptyState
                icon={<AlertTriangle />}
                title="Unable to load security incidents"
                description={loadError}
                action={<Button variant="danger" size="sm" onClick={load}>Try Again</Button>}
              />
            </div>
          ) : incidents.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white py-8 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <EmptyState icon={<AlertTriangle />} title="No security incidents" description="No incidents match the selected filters." />
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  selected={selectedIds.includes(incident.id)}
                  onToggleSelect={toggleSelect}
                  onBlock={handleBlock}
                  onResolve={handleResolve}
                  onDelete={handleDelete}
                  busyId={busyId}
                />
              ))}
            </div>
          )}
      </>
    </div>
  );
}
