import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { caretakerAPI } from '../../services/api';
import { Spinner, Badge, StatCard, PageHeader, Card } from '../../components/ui';
import { AlertCircle, CheckCircle2, Clock, Users, Building2, Home } from 'lucide-react';
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
        <Spinner size="lg" className="text-orange-500" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentComplaints = data?.recentComplaints || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Complaint Management Dashboard"
        description="Manage and resolve all hostel complaints from here."
        eyebrow="Caretaker Portal"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents || 0} icon={<Users className="w-5 h-5" />} color="primary" />
        <StatCard title="Total Rooms" value={stats.totalRooms || 0} icon={<Building2 className="w-5 h-5" />} color="blue" />
        <StatCard title="Occupied Rooms" value={stats.occupiedRooms || 0} icon={<Home className="w-5 h-5" />} color="purple" />
        <StatCard title="Pending Issues" value={stats.pendingComplaints || 0} icon={<AlertCircle className="w-5 h-5" />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 h-full flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Complaint Status</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-600">Pending</div>
                <div className="text-2xl font-bold text-gray-900">{stats.pendingComplaints || 0}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-600">In Progress</div>
                <div className="text-2xl font-bold text-gray-900">{stats.inProgressComplaints || 0}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 h-full">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Complaints</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {recentComplaints.length > 0 ? (
              recentComplaints.map((complaint, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-slate-50 border border-gray-100 hover:border-brand-primary/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{complaint.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {complaint.student_name || 'Unknown Student'} • Room {complaint.room_number || 'N/A'}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        complaint.status === 'pending' ? 'warning' :
                        complaint.status === 'in_progress' ? 'info' :
                        'success'
                      }
                      className="shrink-0 w-fit"
                    >
                      {complaint.status === 'pending' ? 'Pending' :
                       complaint.status === 'in_progress' ? 'In Progress' :
                       'Resolved'}
                    </Badge>
                  </div>
                  {complaint.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{complaint.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium pt-3 border-t border-gray-100">
                    <span className={`uppercase tracking-wider ${complaint.priority?.toLowerCase() === 'high' ? 'text-red-500' : ''}`}>
                      {complaint.priority || 'MEDIUM'} Priority
                    </span>
                    <span>{format(new Date(complaint.created_at), 'dd MMM yyyy')}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center text-center">
                <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500" />
                <p className="text-base font-bold text-gray-900">No complaints</p>
                <p className="text-sm text-gray-500 mt-1">All complaints are resolved!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
