import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../../services/api';
import { Spinner, Card } from '../../../components/ui';
import { Building2, Home, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useHostelNameMap from '../../../hooks/useHostelNameMap';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

export default function DashboardPage() {
  const { getHostelName } = useHostelNameMap();
  const { collegeTheme, setCollegeTheme, collegeThemeOptions } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const blockStats = data?.blockStats || [];

  const metricCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents || 0,
      icon: Users,
      tone: 'bg-blue-100 text-blue-600',
      color: '#3B82F6'
    },
    {
      title: 'Total Rooms',
      value: stats.totalRooms || 0,
      icon: Building2,
      tone: 'bg-indigo-100 text-indigo-600',
      color: '#4F46E5'
    },
    {
      title: 'Available Rooms',
      value: stats.availableRooms || 0,
      icon: Home,
      tone: 'bg-green-100 text-green-600',
      color: '#10B981'
    },
    {
      title: 'Occupied Rooms',
      value: stats.occupiedRooms || 0,
      icon: Home,
      tone: 'bg-purple-100 text-purple-600',
      color: '#A855F7'
    },
    {
      title: 'Pending Issues',
      value: stats.pendingComplaints || 0,
      icon: AlertCircle,
      tone: 'bg-amber-100 text-amber-600',
      color: '#F59E0B'
    },
    {
      title: 'Resolved Issues',
      value: stats.resolvedComplaints || 0,
      icon: CheckCircle,
      tone: 'bg-emerald-100 text-emerald-600',
      color: '#10B981'
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" className="text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">{todayLabel}</div>
          <select
            id="college-theme"
            value={collegeTheme}
            onChange={(event) => setCollegeTheme(event.target.value)}
            className="rounded-full border-0 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none ring-1 ring-slate-200 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-brand-primary/30"
          >
            {collegeThemeOptions.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map(({ title, value, icon: Icon, tone }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="group overflow-hidden rounded-2xl border border-[#F1F5F9] bg-white p-5 shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md">
              <div className="flex flex-col gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900">{value.toLocaleString()}</div>
                  <div className="mt-1 text-sm font-medium text-slate-500">{title}</div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '72%' }}
                    transition={{ duration: 0.8, delay: idx * 0.05 }}
                    className={`h-full rounded-full ${tone.split(' ')[0]}`}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card className="rounded-2xl border-l-4 border-l-brand-primary border border-[#F1F5F9] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Room Occupancy</h2>
            <div className="relative mt-6 flex items-center justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Occupied', value: stats.occupiedRooms || 0 },
                        { name: 'Available', value: stats.availableRooms || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        fontSize: '13px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: '#111827', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">
                  {stats.occupiedRooms ? Math.round((stats.occupiedRooms / (stats.occupiedRooms + stats.availableRooms)) * 100) : 0}%
                </span>
                <span className="text-xs font-medium text-slate-500">Occupied</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">Occupied</span>
                <span className="font-bold text-slate-900">{stats.occupiedRooms || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">Available</span>
                <span className="font-bold text-slate-900">{stats.availableRooms || 0}</span>
              </div>
            </div>
            <button className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:bg-slate-800">
              View Details
            </button>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl border border-[#F1F5F9] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Hostel Distribution</h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {blockStats.map((block, idx) => {
                const occupancy = block.capacity ? Math.round((block.occupied / block.capacity) * 100) : 0;
                const barColors = ['from-blue-500 to-blue-600', 'from-indigo-500 to-indigo-600', 'from-emerald-500 to-emerald-600', 'from-purple-500 to-purple-600', 'from-amber-500 to-amber-600'];
                const colorClass = barColors[idx % barColors.length];
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="space-y-2 rounded-xl p-4 transition-all duration-200 ease-in-out hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{getHostelName(block.block)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{occupancy}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${occupancy}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                      />
                    </div>
                    <div className="text-xs text-slate-500">{block.occupied} of {block.capacity} rooms</div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
