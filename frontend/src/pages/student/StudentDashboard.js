import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { studentPortalAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Spinner, Button, PageHeader } from '../../components/ui';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, MapPin } from 'lucide-react';
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
        <Spinner size="lg" className="text-brand-primary" />
      </div>
    );
  }

  const { student, complaintStats, recentNotices } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title={`Welcome back, ${user?.name || 'Resident'}`}
          description="Your hostel dashboard with room details, complaints, and latest notices at a glance."
          eyebrow="Student Portal"
        />
        <div className="flex items-center gap-3 shrink-0 mb-8 md:mb-0">
          <Link to="/student/complaints">
            <Button>File Complaint</Button>
          </Link>
          <Link to="/student/profile">
            <Button variant="outline">View Profile</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/10 to-[#7e57c2]/10 text-brand-primary flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest">Total</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 group-hover:text-brand-primary transition-colors">{complaintStats?.total || 0}</div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest">Pending</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 group-hover:text-amber-500 transition-colors">{complaintStats?.pending || 0}</div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest">Progress</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 group-hover:text-blue-500 transition-colors">{complaintStats?.in_progress || 0}</div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest">Resolved</h3>
          </div>
          <div className="text-4xl font-black text-gray-900 group-hover:text-emerald-500 transition-colors">{complaintStats?.resolved || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 h-full border-t-4 border-t-brand-primary">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Room Information</h2>
              <p className="text-sm text-gray-500">Current room assignment details</p>
            </div>
            {student?.room_number && (
              <Badge variant="success" className="px-3 py-1">Assigned</Badge>
            )}
          </div>

          {student?.room_number ? (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-brand-primary to-[#7e57c2] rounded-2xl p-6 border border-transparent shadow-lg flex flex-col items-center justify-center text-center group transform transition-all hover:scale-[1.02]">
                  <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1 group-hover:text-white transition-colors">Room</div>
                  <div className="text-4xl font-black text-white drop-shadow-md">{student.room_number}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-md transition-all">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-brand-primary transition-colors">Hostel</div>
                  <div className="text-3xl font-black text-gray-800">{getHostelName(student.block)}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-md transition-all">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-brand-primary transition-colors">Floor</div>
                  <div className="text-3xl font-black text-gray-800">{student.floor}</div>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-12 flex flex-col items-center text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
              <h3 className="text-base font-bold text-gray-900 border-none">No Room Allocated</h3>
              <p className="text-sm text-gray-500 mt-1">Please contact the hostel administration for your room assignment.</p>
            </div>
          )}
        </Card>

        <Card className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Notices</h2>
              <p className="text-sm text-gray-500">Latest updates</p>
            </div>
            <Link to="/student/notices" className="text-sm font-semibold text-brand-primary hover:text-brand-primary-light">
              View All &rarr;
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            {recentNotices.length > 0 ? (
              <div className="space-y-4">
                {recentNotices.map((notice, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-sm text-gray-900 group-hover:text-brand-primary transition-colors">{notice.title}</h3>
                      {notice.category === 'urgent' && (
                        <Badge variant="danger">Urgent</Badge>
                      )}
                    </div>
                    {notice.content && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {notice.content}
                      </p>
                    )}
                    <span className="text-xs font-medium text-gray-400">
                      {format(new Date(notice.created_at), 'dd MMM yyyy')}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-gray-900">You're all caught up!</p>
                <p className="text-xs text-gray-500">No new notices at this time.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
