import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { wardenAPI } from '../../services/api';
import { Spinner, Badge, Card } from '../../components/ui';
import { Users, Home, AlertCircle, Building2, UserPlus, CheckCircle2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import useHostelNameMap from '../../hooks/useHostelNameMap';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#A855F7', '#14B8A6', '#F87171'];

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
        <Spinner size="lg" className="text-sky-600" />
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

  const metricCards = [
    { title: 'Total Students', value: stats.totalStudents || 0, icon: Users, tone: 'bg-blue-100 text-blue-600' },
    { title: 'Total Rooms', value: stats.totalRooms || 0, icon: Building2, tone: 'bg-indigo-100 text-indigo-600' },
    { title: 'Available Slots', value: stats.availableRooms || 0, icon: Home, tone: 'bg-green-100 text-green-600' },
    { title: 'Occupied Rooms', value: stats.occupiedRooms || 0, icon: CheckCircle2, tone: 'bg-sky-100 text-sky-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="text-sm font-semibold uppercase tracking-wider text-sky-600">Management Portal</div>
        <h1 className="text-4xl font-bold text-gray-900">Warden Dashboard</h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-600">
          Student oversight, room management, and hostel statistics overview.
        </p>
      </motion.section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Occupancy Pie Chart */}
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
                        { name: 'Occupied', value: totalOccupied },
                        { name: 'Available', value: availableSlots }
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
                  {totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0}%
                </span>
                <span className="text-xs font-medium text-gray-500">Occupied</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-600">Occupied</span>
                <span className="font-bold text-gray-900">{totalOccupied}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-600">Available</span>
                <span className="font-bold text-gray-900">{availableSlots}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Hostel Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Capacity Overview</h2>
            <div className="mt-6 space-y-4">
              <div className="space-y-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Total Capacity</span>
                  <span className="text-2xl font-bold text-blue-600">{totalCapacity}</span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Currently Occupied</span>
                  <span className="text-2xl font-bold text-green-600">{totalOccupied}</span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Available Slots</span>
                  <span className="text-2xl font-bold text-amber-600">{availableSlots}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Distribution by Hostel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Distribution by Hostel</h2>
            <div className="mt-6 space-y-3">
              {blockStats.map((block, idx) => {
                const occupancy = block.capacity ? Math.round((block.occupied / block.capacity) * 100) : 0;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">{getHostelName(block.block)}</span>
                      <span className="text-xs font-bold text-sky-600">{occupancy}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${occupancy}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-sky-500 to-sky-600"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Registrations Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Student Registrations</h2>
              <p className="mt-1 text-sm text-gray-600">Latest students added to the system</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>

          {recentStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Student Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Register No</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Department</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Year</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Date Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentStudents.map((student) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
                          {student.register_no}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{student.department}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          Year {student.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{format(new Date(student.created_at), 'dd MMM yyyy')}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-base font-semibold text-gray-900">No recent students</p>
              <p className="mt-1 text-sm text-gray-600">No new registrations in the system yet</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
}
