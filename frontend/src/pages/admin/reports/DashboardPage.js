import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { dashboardAPI } from '../../../services/api';
import { Spinner, StatCard, PageHeader, Card } from '../../../components/ui';
import { Building2, Home, Users, CheckCircle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useHostelNameMap from '../../../hooks/useHostelNameMap';

const PIE_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#8B5CF6'];

export default function DashboardPage() {
  const { getHostelName } = useHostelNameMap();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const blockStats = data?.blockStats || [];

  const pieData = blockStats.length > 0 
    ? blockStats.map((b) => ({
        name: getHostelName(b.block),
        value: Number(b.occupied) || 0
      }))
    : [{ name: 'No Data', value: 1 }];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" className="text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title={`Welcome back, ${user?.name || 'Administrator'} 👋`}
        description="Here's what's happening in your campus today. Manage hostel occupancy, view student statistics, and handle pending complaints."
        eyebrow="Admin Dashboard"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Students" value={stats.totalStudents || 0} icon={<Users className="w-5 h-5" />} color="primary" />
          <StatCard title="Total Rooms" value={stats.totalRooms || 0} icon={<Building2 className="w-5 h-5" />} color="blue" />
          <StatCard title="Available Rooms" value={stats.availableRooms || 0} icon={<Home className="w-5 h-5" />} color="green" />
          <StatCard title="Occupied Rooms" value={stats.occupiedRooms || 0} icon={<Home className="w-5 h-5" />} color="purple" />
          <StatCard title="Pending Complaints" value={stats.pendingComplaints || 0} icon={<Clock className="w-5 h-5" />} color="amber" />
          <StatCard title="Resolved Complaints" value={stats.resolvedComplaints || 0} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        </div>

        <div className="lg:col-span-4">
          <Card className="p-6 h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Occupancy by Hostel</h2>
            <div className="flex-1 min-h-[240px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', fontSize: '13px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} 
                    itemStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-3xl font-bold text-gray-900">{stats.occupiedRooms || 0}</span>
                <span className="text-xs text-gray-500 font-medium">Occupied</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              {pieData.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                    <span className="text-gray-600 font-medium">{d.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
