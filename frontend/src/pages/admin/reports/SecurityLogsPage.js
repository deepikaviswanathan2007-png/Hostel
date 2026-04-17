import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, ShieldAlert, ShieldCheck, Trash2, RefreshCcw, Search } from 'lucide-react';
import { Badge, Button, EmptyState, Input, SectionCard, Select, Spinner } from '../../../components/ui';
import { securityAPI } from '../../../services/api';
import { format } from 'date-fns';

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

function IncidentCard({ incident, selected, onToggleSelect, onBlock, onResolve, onDelete, busyId }) {
  const canBlock = Boolean(incident.source_ip) && incident.status !== 'blocked';
  const safeMeta = incident.target_user_meta || 'No user metadata';

  return (
    <div className="rounded-2xl border border-red-100 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-red-50 px-4 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(incident.id)}
          className="mt-1 h-4 w-4 rounded border-gray-300"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant={severityVariant[incident.severity] || 'warning'} className="font-semibold uppercase tracking-wide">
              {severityLabel[incident.severity] || 'INCIDENT'}
            </Badge>
            <span className="h-2 w-2 rounded-full bg-red-500" />
          </div>

          <div className="text-2xl font-black leading-tight text-slate-800">{incident.event_type}</div>
          <p className="mt-1 text-sm text-slate-600">
            [Attributed to {incident.actor_email || safeMeta}] {incident.message || 'Suspicious activity detected.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="danger"
            disabled={!canBlock || busyId === incident.id}
            loading={busyId === incident.id}
            onClick={() => onBlock(incident.id)}
            className="h-8 rounded-full px-4"
          >
            Block
          </Button>
          <Button
            size="sm"
            variant="success"
            disabled={incident.status === 'resolved' || busyId === incident.id}
            loading={busyId === incident.id}
            onClick={() => onResolve(incident.id)}
            className="h-8 rounded-full px-4"
          >
            <ShieldCheck className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busyId === incident.id}
            loading={busyId === incident.id}
            onClick={() => onDelete(incident.id)}
            className="h-8 rounded-full px-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-4 md:grid-cols-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Target User</div>
          <div className="text-sm font-bold text-slate-800">{incident.target_user_name || 'Unknown / Guest'}</div>
          <div className="text-[11px] text-slate-500">{safeMeta}</div>
        </div>

        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Endpoint</div>
          <div className="text-sm font-bold text-blue-700">{incident.request_method || 'GET'} {incident.endpoint || '-'}</div>
        </div>

        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Source IP</div>
          <div className="text-sm font-bold text-slate-800">{incident.source_ip || '-'}</div>
        </div>

        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Timestamp</div>
          <div className="text-sm font-bold text-slate-800">
            {incident.created_at ? format(new Date(incident.created_at), 'M/d/yyyy, h:mm:ss a') : '-'}
          </div>
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Device Details (Fingerprint)</div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Browser</div>
            <div className="font-semibold text-slate-800">{incident.browser || 'Unknown'}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Operating System</div>
            <div className="font-semibold text-slate-800">{incident.operating_system || 'Unknown'}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Device Type</div>
            <div className="font-semibold text-slate-800">{incident.device_type || 'Unknown'}</div>
          </div>
        </div>

        <div className="mt-4 text-[11px] text-slate-500">
          Raw User-Agent: {incident.user_agent || 'Unavailable'}
        </div>
      </div>
    </div>
  );
}

export default function SecurityLogsPage() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, open_count: 0, blocked_count: 0, resolved_count: 0, high_risk_count: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ status: 'open', severity: '', search: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await securityAPI.getIncidents(filters);
      setIncidents(res.data?.data || []);
      setStats(res.data?.stats || { total: 0, open_count: 0, blocked_count: 0, resolved_count: 0, high_risk_count: 0 });
    } catch {
      toast.error('Failed to load security incidents.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionCard
        title="Security & Malpractice Logs"
        description="Track unauthorized access attempts and suspicious system activity."
        action={(
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>{allSelected ? 'Unselect All' : 'Select All'}</Button>
            <Button variant="outline" size="sm" onClick={load}><RefreshCcw className="h-4 w-4" /> Refresh Logs</Button>
          </div>
        )}
      >
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold text-slate-500">Total</div>
            <div className="text-2xl font-black text-slate-900">{stats.total || 0}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold text-slate-500">Open</div>
            <div className="text-2xl font-black text-amber-600">{stats.open_count || 0}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold text-slate-500">Blocked</div>
            <div className="text-2xl font-black text-red-600">{stats.blocked_count || 0}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold text-slate-500">High Risk</div>
            <div className="text-2xl font-black text-rose-700">{stats.high_risk_count || 0}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Filter Logs" description="Search by endpoint, user, IP, or message.">
        <div className="grid gap-3 md:grid-cols-4">
          <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="blocked">Blocked</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </Select>
          <Select value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}>
            <option value="">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search logs..."
            icon={<Search className="h-4 w-4" />}
          />
          <Button variant="ghost" onClick={() => setFilters({ status: 'open', severity: '', search: '' })}>Reset Filters</Button>
        </div>
      </SectionCard>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-primary" /></div>
      ) : incidents.length === 0 ? (
        <EmptyState icon={<AlertTriangle />} title="No security incidents" description="No incidents match the selected filters." />
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
    </div>
  );
}
