import React, { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Search, Users } from 'lucide-react';
import { studentsAPI, wardenAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, EmptyState, Input, MetricPanel, PanelShell, PortalHero, Select, Spinner } from '../../components/ui';
import useHostelNameMap from '../../hooks/useHostelNameMap';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD'];
const PAGE_SIZE = 20;

function wingBadgeVariant(wing) {
  const w = String(wing || '').toLowerCase();
  if (w === 'left') return 'bg-emerald-500/15 text-emerald-700 border-emerald-200';
  if (w === 'right') return 'bg-violet-500/15 text-violet-700 border-violet-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function formatWingLabel(wing) {
  const w = String(wing || '').toLowerCase();
  if (w === 'left') return 'Left wing';
  if (w === 'right') return 'Right wing';
  return '—';
}

export default function WardenStudentsPortal() {
  const { getHostelName } = useHostelNameMap();
  const { isWarden, isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scopeLoading, setScopeLoading] = useState(!!isWarden);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ dept: '', year: '' });
  const [page, setPage] = useState(1);
  /** null = all assignments; 'left' | 'right' narrows when warden has multiple scopes */
  const [wingFilter, setWingFilter] = useState(null);

  useEffect(() => {
    if (!isWarden) {
      setScopeLoading(false);
      setAssignments([]);
      return;
    }
    let cancelled = false;
    setScopeLoading(true);
    wardenAPI
      .getMyScope()
      .then((res) => {
        if (!cancelled) setAssignments(res.data.assignments || []);
      })
      .catch(() => {
        if (!cancelled) setAssignments([]);
      })
      .finally(() => {
        if (!cancelled) setScopeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isWarden]);

  useEffect(() => {
    if (!isWarden || assignments.length !== 1) return;
    setWingFilter(assignments[0].wing);
  }, [isWarden, assignments]);

  const allowedWings = [...new Set(assignments.map((a) => a.wing).filter(Boolean))];

  const loadStudents = useCallback(() => {
    setLoading(true);
    const params = {
      search,
      ...filters,
      page,
      limit: PAGE_SIZE,
    };
    if (isWarden && assignments.length === 1) {
      params.block = assignments[0].block;
      params.floor = assignments[0].floor;
      params.wing = assignments[0].wing;
    } else if (isWarden && assignments.length > 1 && wingFilter) {
      params.wing = wingFilter;
    }

    studentsAPI
      .getAll(params)
      .then((response) => {
        setStudents(response.data.data || []);
        setTotal(response.data.total || 0);
      })
      .catch(() => {
        setStudents([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [search, filters, page, isWarden, assignments, wingFilter]);

  useEffect(() => {
    if (isWarden && scopeLoading) return;
    loadStudents();
  }, [loadStudents, isWarden, scopeLoading]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const noAssignment = isWarden && !scopeLoading && assignments.length === 0;

  const emptyCopy = noAssignment
    ? {
        title: 'No floor assignment',
        description:
          'You are not assigned as a floor warden yet. Ask an administrator to assign you to a hostel, floor, and wing.',
      }
    : {
        title: 'No students found',
        description:
          'No resident students match your scope, or wing and room data is still being set up. Try adjusting filters.',
      };

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Warden Students"
        title="Student Management"
        description="Students in your assigned hostel, floor, and wing. Lists are scoped automatically from your warden assignment."
        accent="blue"
        icon={<GraduationCap className="h-4 w-4" />}
      />

      {isAdmin && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You are viewing this page as an administrator. The list shows all students; warden-specific scoping applies to warden accounts only.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <MetricPanel
          title="Visible Students"
          value={students.length}
          helper="Current page results"
          tone="blue"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricPanel
          title="Total Records"
          value={total}
          helper="Students matching current query"
          tone="primary"
          icon={<GraduationCap className="h-5 w-5" />}
        />
      </div>

      {isWarden && assignments.length > 0 && (
        <PanelShell title="Your assignment" description="Floor warden scope from the directory.">
          <div className="flex flex-wrap gap-2">
            {assignments.map((a) => (
              <Badge key={`${a.block}-${a.floor}-${a.wing}`} className="rounded-full px-3 py-1 text-xs font-semibold">
                {getHostelName(a.block)} · Floor {a.floor} · {formatWingLabel(a.wing)}
              </Badge>
            ))}
          </div>
        </PanelShell>
      )}

      {isWarden && assignments.length > 1 && (
        <PanelShell title="Wing filter" description="Narrow the list when you cover more than one assignment.">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setWingFilter(null);
                setPage(1);
              }}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                wingFilter == null ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-brand-border text-brand-muted hover:bg-white'
              }`}
            >
              All assigned
            </button>
            {allowedWings.includes('left') && (
              <button
                type="button"
                onClick={() => {
                  setWingFilter('left');
                  setPage(1);
                }}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                  wingFilter === 'left' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-brand-border text-brand-muted hover:bg-white'
                }`}
              >
                Show Left Wing
              </button>
            )}
            {allowedWings.includes('right') && (
              <button
                type="button"
                onClick={() => {
                  setWingFilter('right');
                  setPage(1);
                }}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                  wingFilter === 'right' ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-brand-border text-brand-muted hover:bg-white'
                }`}
              >
                Show Right Wing
              </button>
            )}
          </div>
        </PanelShell>
      )}

      <PanelShell title="Filters" description="Refine student records by name, register number, department, and academic year.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or register no"
            className="h-14 rounded-[20px] bg-[#fbfbff] px-5"
          />
          <Select
            value={filters.dept}
            onChange={(event) => {
              setFilters((current) => ({ ...current, dept: event.target.value }));
              setPage(1);
            }}
            className="h-14 rounded-[20px] bg-[#fbfbff] px-5"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
          <Select
            value={filters.year}
            onChange={(event) => {
              setFilters((current) => ({ ...current, year: event.target.value }));
              setPage(1);
            }}
            className="h-14 rounded-[20px] bg-[#fbfbff] px-5"
          >
            <option value="">All Years</option>
            {[1, 2, 3, 4].map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </Select>
        </div>
      </PanelShell>

      <PanelShell title="Student directory" description="Name, room, floor, and wing for each resident in your scope.">
        {scopeLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-sky-500" />
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-sky-500" />
          </div>
        ) : noAssignment || students.length === 0 ? (
          <EmptyState title={emptyCopy.title} description={emptyCopy.description} icon={<Users className="h-10 w-10" />} />
        ) : (
          <div className="overflow-x-auto rounded-[24px] border border-brand-border/70">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border/70 bg-[#f4f6fc] text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Room No</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Wing</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-brand-border/40 last:border-0 bg-white/80">
                    <td className="px-4 py-3 font-semibold text-brand-text">{student.name}</td>
                    <td className="px-4 py-3 text-brand-muted">
                      {student.room_number ? `${student.room_number} (${getHostelName(student.block)})` : '—'}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{student.effective_floor ?? student.floor ?? student.room_floor ?? '—'}</td>
                    <td className="px-4 py-3">
                      {student.effective_wing || student.wing || student.room_wing ? (
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${wingBadgeVariant(
                            student.effective_wing || student.wing || student.room_wing
                          )}`}
                        >
                          {(student.effective_wing || student.wing || student.room_wing || '').toString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!noAssignment && total > PAGE_SIZE ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-brand-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-brand-muted">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-2xl border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-2xl border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </PanelShell>
    </div>
  );
}
