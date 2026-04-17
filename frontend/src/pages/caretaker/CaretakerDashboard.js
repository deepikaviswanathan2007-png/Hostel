import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { caretakerAPI } from '../../services/api';
import { Spinner, Badge, Card } from '../../components/ui';
import { AlertCircle, CheckCircle2, Clock, Users, Building2, Home, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function CaretakerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caretakerAPI.getStats()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-orange-600" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentComplaints = data?.recentComplaints || [];

  const metricCards = [
    { title: 'Total Students', value: stats.totalStudents || 0, icon: Users, tone: 'bg-orange-100 text-orange-600' },
    { title: 'Total Rooms', value: stats.totalRooms || 0, icon: Building2, tone: 'bg-blue-100 text-blue-600' },
    { title: 'Occupied Rooms', value: stats.occupiedRooms || 0, icon: Home, tone: 'bg-emerald-100 text-emerald-600' },
    { title: 'Pending Issues', value: stats.pendingComplaints || 0, icon: AlertCircle, tone: 'bg-red-100 text-red-600' },
  ];

  const complaintStats = [
    { label: 'Pending', value: stats.pendingComplaints || 0, icon: AlertCircle, color: 'bg-orange-50 border-orange-100 text-orange-600' },
    { label: 'In Progress', value: stats.inProgressComplaints || 0, icon: Clock, color: 'bg-blue-50 border-blue-100 text-blue-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="text-sm font-semibold uppercase tracking-wider text-orange-600">Caretaker Portal</div>
        <h1 className="text-4xl font-bold text-gray-900">Complaint Management</h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-600">
          Manage and resolve all hostel complaints efficiently from your dashboard.
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Complaint Status Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-4"
        >
          {complaintStats.map(({ label, value, icon: Icon, color }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
            >
              <Card className={`rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md ${color}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 mb-2">{label}</div>
                    <div className="text-3xl font-bold text-gray-900">{value}</div>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg opacity-80">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Complaints Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recent Complaints</h2>
                <p className="mt-1 text-sm text-gray-600">Latest complaints requiring your attention</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            {recentComplaints.length > 0 ? (
              <div className="max-h-[500px] overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {recentComplaints.map((complaint, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="transition-colors hover:bg-gray-50 p-6"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-base">{complaint.title}</h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {complaint.student_name || 'Unknown Student'} • Room {complaint.room_number || 'N/A'}
                            </p>
                          </div>
                          <Badge 
                            className={`flex-shrink-0 ${
                              complaint.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}
                          >
                            {complaint.status === 'pending' ? 'Pending' :
                             complaint.status === 'in_progress' ? 'In Progress' :
                             'Resolved'}
                          </Badge>
                        </div>

                        {complaint.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{complaint.description}</p>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${complaint.priority?.toLowerCase() === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                            {complaint.priority || 'MEDIUM'} Priority
                          </span>
                          <span className="text-xs font-medium text-gray-500">
                            {format(new Date(complaint.created_at), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-300 mb-3" />
                <p className="text-base font-semibold text-gray-900">No complaints</p>
                <p className="mt-1 text-sm text-gray-600">All complaints have been resolved!</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
