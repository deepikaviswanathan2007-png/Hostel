import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../../services/api';
import { Spinner, Card } from '../../../components/ui';
import { Building2, Home, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useHostelNameMap from '../../../hooks/useHostelNameMap';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { getHostelName } = useHostelNameMap();
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
        <Spinner size="lg" className="text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map(({ title, value, icon: Icon, tone }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="group overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="text-sm font-semibold uppercase tracking-wider text-gray-600">{title}</div>
                  <div className="text-5xl font-black text-gray-900">{value.toLocaleString()}</div>
                </div>
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${tone} transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-gray-200 to-transparent" />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts & Data Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Occupancy Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Room Occupancy</h2>
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
                <span className="text-3xl font-bold text-gray-900">
                  {stats.occupiedRooms ? Math.round((stats.occupiedRooms / (stats.occupiedRooms + stats.availableRooms)) * 100) : 0}%
                </span>
                <span className="text-xs font-medium text-gray-500">Occupied</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-600">Occupied</span>
                <span className="font-bold text-gray-900">{stats.occupiedRooms || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-600">Available</span>
                <span className="font-bold text-gray-900">{stats.availableRooms || 0}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Hostel Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Distribution by Hostel</h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {blockStats.map((block, idx) => {
                const occupancy = block.capacity ? Math.round((block.occupied / block.capacity) * 100) : 0;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="space-y-2 rounded-lg bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{getHostelName(block.block)}</span>
                      <span className="text-xs font-bold text-blue-600">{occupancy}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${occupancy}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      />
                    </div>
                    <div className="text-xs text-gray-500">{block.occupied} of {block.capacity} rooms</div>
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
