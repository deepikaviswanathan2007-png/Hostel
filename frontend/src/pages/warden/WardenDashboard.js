import React, { useEffect, useState } from 'react';

import { wardenAPI } from '../../services/api';
import { Spinner, Badge, StatCard, PageHeader, Card } from '../../components/ui';
import { Users, Home, AlertCircle, Building2, UserPlus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useHostelNameMap from '../../hooks/useHostelNameMap';

const PIE_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#f59e0b'];

export default function WardenDashboard() {
  const { getHostelName } = useHostelNameMap();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wardenAPI.getStats()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-brand-primary" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const blockStats = data?.blockStats || [];
  const recentStudents = data?.recentStudents || [];

  const pieData = blockStats.length > 0
    ? blockStats.map((b) => ({ name: getHostelName(b.block), value: Number(b.occupied) || 0 }))
    : [{ name: 'No Data', value: 1 }];

  const totalCapacity = blockStats.reduce((sum, b) => sum + (Number(b.capacity) || 0), 0);
  const totalOccupied = blockStats.reduce((sum, b) => sum + (Number(b.occupied) || 0), 0);
  const availableSlots = Math.max(0, totalCapacity - totalOccupied);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Warden Dashboard"
        description="Student oversight, room management, and hostel statistics overview."
        eyebrow="Management Portal"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents || 0} icon={<Users className="w-5 h-5" />} color="primary" />
        <StatCard title="Total Rooms" value={stats.totalRooms || 0} icon={<Building2 className="w-5 h-5" />} color="blue" />
        <StatCard title="Available Slots" value={stats.availableRooms || 0} icon={<Home className="w-5 h-5" />} color="amber" />
        <StatCard title="Occupied Rooms" value={stats.occupiedRooms || 0} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Occupancy by Hostel</h2>
          {pieData.length > 0 && pieData[0].value > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      border: '1px solid #e5e7eb', 
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
                    }} 
                    itemStyle={{ color: '#111827', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                    />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl border border-dashed border-gray-200">
              <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-500">No occupancy data available</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Room Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-gray-900">Total Capacity</div>
              </div>
              <div className="text-xl font-bold text-indigo-600">{totalCapacity}</div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-gray-900">Currently Occupied</div>
              </div>
              <div className="text-xl font-bold text-emerald-600">{totalOccupied}</div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-gray-900">Available Slots</div>
              </div>
              <div className="text-xl font-bold text-amber-600">{availableSlots}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Registrations</h2>
            <p className="text-sm text-gray-500">Latest students added to the system</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        <div className="-mx-6 -mb-6 border-t border-gray-100">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Student</th>
                <th className="px-6 py-3 whitespace-nowrap">Register No</th>
                <th className="px-6 py-3 whitespace-nowrap">Department</th>
                <th className="px-6 py-3 whitespace-nowrap">Year</th>
                <th className="px-6 py-3 whitespace-nowrap">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {recentStudents.length > 0 ? (
                recentStudents.map((student, i) => (
                  <tr key={student.id} className="transition-colors group hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap"><Badge variant="outline" className="font-mono text-xs">{student.register_no}</Badge></td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap"><div className="text-gray-600">{student.department}</div></td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                        Year {student.year}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap"><div className="text-gray-500">{format(new Date(student.created_at), 'dd MMM yyyy')}</div></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="py-8 flex flex-col items-center text-center">
                      <Users className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-900">No recent students</p>
                      <p className="text-xs text-gray-500">No new registrations in the system yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
