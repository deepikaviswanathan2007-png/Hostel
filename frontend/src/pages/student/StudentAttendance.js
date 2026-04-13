import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { attendanceAPI } from '../../services/api';
import { Badge, PanelShell, PortalHero, EmptyState, Spinner, Select } from '../../components/ui';
import { format } from 'date-fns';
import { CalendarCheckIcon, Sunrise, Moon, UserCheck } from 'lucide-react';

export default function StudentAttendance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.getMyAttendance({ month, year });
      setRecords(res.data.data || []);
      setStats(res.data.stats || null);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PortalHero
        eyebrow="Hostel Records"
        title="My Attendance"
        description="View your bi-daily hostel check-in records and attendance history."
        accent="orange"
        icon={<CalendarCheckIcon className="w-5 h-5" />}
        actions={
          <div className="flex gap-3">
             <Select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-32 bg-white/60">
                {Array.from({length: 12}, (_, i) => (<option key={i+1} value={i+1}>{format(new Date(2000, i, 1), 'MMMM')}</option>))}
             </Select>
             <Select value={year} onChange={e => setYear(Number(e.target.value))} className="w-28 bg-white/60">
                {Array.from({length: 5}, (_, i) => {
                  const y = currentDate.getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>
                })}
             </Select>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" className="text-orange-500" /></div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                   <CalendarCheckIcon className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Days Present</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">{stats.days_present || 0}</p>
                 </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                   <Sunrise className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Morning</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">{stats.morning_count || 0}</p>
                 </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                   <Moon className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Evening</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">{stats.evening_count || 0}</p>
                 </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                   <UserCheck className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Checks</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">{stats.total_checkins || 0}</p>
                 </div>
              </div>
            </div>
          )}

          <PanelShell title={`${format(new Date(year, month - 1, 1), 'MMMM yyyy')} Records`} className="mt-6">
            {records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-5 py-4 font-semibold rounded-tl-xl">Date & Time</th>
                      <th className="px-5 py-4 font-semibold">Type</th>
                      <th className="px-5 py-4 font-semibold">Method</th>
                      <th className="px-5 py-4 font-semibold rounded-tr-xl">Marked By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900 block">{format(new Date(r.checked_at), 'dd MMM yyyy')}</span>
                          <span className="text-gray-500">{format(new Date(r.checked_at), 'hh:mm a')}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {r.check_type === 'morning' ? <Badge variant="primary" className="gap-1"><Sunrise className="w-3 h-3"/> Morning</Badge> : null}
                          {r.check_type === 'evening' ? <Badge variant="purple" className="gap-1"><Moon className="w-3 h-3"/> Evening</Badge> : null}
                          {r.check_type === 'manual'  ? <Badge variant="default" className="gap-1"><UserCheck className="w-3 h-3"/> Manual Check</Badge> : null}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                           <Badge variant="outline" className="capitalize">{r.method}</Badge>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                          {r.marked_by_name || 'System / Auto'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No Attendance Records" description="No successful check-ins found for this period." icon={<CalendarCheckIcon className="w-10 h-10 text-gray-300" />} />
            )}
          </PanelShell>
        </>
      )}
    </div>
  );
}
