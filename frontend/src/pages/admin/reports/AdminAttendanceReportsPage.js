import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { attendanceAPI } from '../../../services/api';
import { UserCheck, UserX, Users, Search, Filter } from 'lucide-react';
import { Spinner } from '../../../components/ui';

const fmt12h = (val) => {
  if (!val) return '—';
  const [h = '0', m = '00'] = String(val).split(':');
  const hour = parseInt(h, 10);
  const min  = parseInt(m, 10);
  if (!isFinite(hour) || !isFinite(min)) return val;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${String(min).padStart(2, '0')} ${suffix}`;
};

function StatCard({ label, value, icon: Icon, color, bg, index }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-6 hover:shadow-md hover:scale-105 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-muted mb-2">{label}</p>
          <p className={`text-5xl font-black ${color}`}>{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminAttendanceReportsPage() {
  const [attendance,  setAttendance]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [dateFilter,  setDateFilter]  = useState('');

  useEffect(() => {
    attendanceAPI.getAll()
      .then(res => setAttendance(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filtered = attendance.filter(a => {
    const name     = `${a.student_name || ''} ${a.register_no || ''}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchDate   = !dateFilter || (a.date || '').startsWith(dateFilter);
    return matchSearch && matchDate;
  });

  const todayRecords  = attendance.filter(a => (a.date || '').startsWith(today));
  const presentToday  = todayRecords.filter(a => a.check_in_time || a.status === 'present').length;
  const absentToday   = todayRecords.filter(a => !a.check_in_time && a.status !== 'present').length;

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Spinner size="lg" className="text-brand-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label="Present Today"  value={presentToday}      icon={UserCheck} color="text-green-600"       bg="bg-green-100" index={0} />
        <StatCard label="Absent Today"   value={absentToday}       icon={UserX}     color="text-red-600"         bg="bg-red-100" index={1}   />
        <StatCard label="Total Records"  value={attendance.length} icon={Users}     color="text-brand-primary"   bg="bg-brand-primary/10" index={2} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or reg. no…"
              className="w-full rounded-xl border border-brand-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full rounded-xl border border-brand-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>
        {(search || dateFilter) && (
          <button
            onClick={() => { setSearch(''); setDateFilter(''); }}
            className="mt-3 text-xs font-semibold text-brand-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Records count */}
      <p className="text-sm text-brand-muted font-medium">
        Showing <span className="text-gray-900 font-bold">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-14 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-200" />
          <p className="text-sm font-semibold text-gray-600">No attendance records found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-brand-border/60 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-brand-border/60">
                  {['Student', 'Reg. No', 'Date', 'Check-in', 'Check-out', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-brand-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filtered.map((a, i) => {
                  const present = !!(a.check_in_time || a.status === 'present');
                  return (
                    <tr key={a.id || i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{a.student_name || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{a.register_no || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-700">{a.date ? new Date(a.date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-5 py-3.5 text-gray-700">{fmt12h(a.check_in_time)}</td>
                      <td className="px-5 py-3.5 text-gray-700">{fmt12h(a.check_out_time)}</td>
                      <td className="px-5 py-3.5">
                        {present ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                            <UserCheck className="h-3 w-3" /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            <UserX className="h-3 w-3" /> Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((a, i) => {
              const present = !!(a.check_in_time || a.status === 'present');
              return (
                <div key={a.id || i} className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{a.student_name || '—'}</p>
                      <p className="text-xs font-mono text-brand-muted mt-0.5">{a.register_no || '—'}</p>
                    </div>
                    {present ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <UserCheck className="h-3 w-3" /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        <UserX className="h-3 w-3" /> Absent
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs border-t border-brand-border/40 pt-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-brand-muted font-medium">Date</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{a.date ? new Date(a.date).toLocaleDateString('en-IN') : '—'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-green-600 font-medium">Check-in</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{fmt12h(a.check_in_time)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2">
                      <p className="text-orange-600 font-medium">Check-out</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{fmt12h(a.check_out_time)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
