import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { studentPortalAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Spinner, Button } from '../../components/ui';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, MapPin, Home, FileText } from 'lucide-react';
import useHostelNameMap from '../../hooks/useHostelNameMap';

export default function StudentDashboard() {
  const { getHostelName } = useHostelNameMap();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.getDashboard()
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-purple-600" />
      </div>
    );
  }

  const { student, complaintStats, recentNotices } = data;

  const complaintMetrics = [
    { title: 'Total Complaints', value: complaintStats?.total || 0, icon: AlertCircle, tone: 'bg-purple-100 text-purple-600' },
    { title: 'Pending', value: complaintStats?.pending || 0, icon: Clock, tone: 'bg-amber-100 text-amber-600' },
    { title: 'In Progress', value: complaintStats?.in_progress || 0, icon: MapPin, tone: 'bg-blue-100 text-blue-600' },
    { title: 'Resolved', value: complaintStats?.resolved || 0, icon: CheckCircle2, tone: 'bg-green-100 text-green-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-6"
      >
        <div className="space-y-3 flex-1">
          <div className="text-sm font-semibold uppercase tracking-wider text-purple-600">Student Portal</div>
          <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user?.name || 'Resident'}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-gray-600">
            Your hostel dashboard with room details, complaints, and latest notices at a glance.
          </p>
        </div>
        <div className="flex flex-col gap-3 shrink-0">
          <Link to="/student/complaints">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap">File Complaint</Button>
          </Link>
          <Link to="/student/profile">
            <Button variant="outline" className="whitespace-nowrap">View Profile</Button>
          </Link>
        </div>
      </motion.section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {complaintMetrics.map(({ title, value, icon: Icon, tone }, idx) => (
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
                  <div className="text-5xl font-black text-gray-900">{value}</div>
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

      {/* Room & Notices Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Room Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 bg-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Room Information</h2>
                  <p className="mt-1 text-sm text-gray-600">Current room assignment details</p>
                </div>
                {student?.room_number && (
                  <Badge className="bg-green-100 text-green-700">Assigned</Badge>
                )}
              </div>
            </div>

            {student?.room_number ? (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />
                    <div className="relative space-y-2 text-center">
                      <div className="text-sm font-semibold text-purple-100 uppercase tracking-wider">Room Number</div>
                      <div className="text-4xl font-bold text-white">{student.room_number}</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
                  >
                    <div className="space-y-2 text-center">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Hostel</div>
                      <div className="text-2xl font-bold text-gray-900">{getHostelName(student.block)}</div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Home className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
                  >
                    <div className="space-y-2 text-center">
                      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Floor</div>
                      <div className="text-2xl font-bold text-gray-900">{student.floor}</div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-3">No Room Allocated</h3>
                <p className="mt-2 text-sm text-gray-600">Please contact the hostel administration for your room assignment.</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Recent Notices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="border-b border-gray-200 bg-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Latest Notices</h2>
                  <p className="mt-1 text-sm text-gray-600">Important updates</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {recentNotices.length > 0 ? (
                <div className="space-y-4">
                  {recentNotices.map((notice, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="group border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-purple-600" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                            {notice.title}
                          </h3>
                          {notice.content && (
                            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                              {notice.content}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              {format(new Date(notice.created_at), 'dd MMM yyyy')}
                            </span>
                            {notice.category === 'urgent' && (
                              <Badge className="bg-red-100 text-red-700 text-xs">Urgent</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-300 mb-3" />
                  <p className="font-semibold text-gray-900">You're all caught up!</p>
                  <p className="mt-1 text-sm text-gray-600">No new notices at this time.</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <Link to="/student/notices" className="inline-flex text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                View All Notices →
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
