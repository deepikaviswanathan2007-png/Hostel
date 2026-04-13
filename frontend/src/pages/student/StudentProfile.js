import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { studentPortalAPI } from '../../services/api';
import { Spinner } from '../../components/ui';
import { AlertCircle, Mail, Phone, MapPin, Building2, BookOpen, Calendar, CheckCircle2, BedDouble, ShieldCheck } from 'lucide-react';
import useHostelNameMap from '../../hooks/useHostelNameMap';

export default function StudentProfile() {
  const { getHostelName } = useHostelNameMap();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    studentPortalAPI.getProfile()
      .then(r => setProfile(r.data.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-card p-6 text-center border border-gray-100"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Linked</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <div className="bg-blue-50/50 rounded-xl p-4 text-left border border-blue-100">
            <p className="text-sm font-semibold text-blue-900 mb-1">How to fix this:</p>
            <p className="text-sm text-blue-700">Contact the hostel warden or administrator to link your registered email address to your student record.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const parseRoomStatus = () => {
    if (!profile.room_number) return { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Pending Allocation' };
    return { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'Assigned' };
  };

  const roomState = parseRoomStatus();

  return (
    <div className="pb-12 min-h-screen pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col gap-6">

          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] flex items-center justify-center text-white font-bold text-4xl shadow-md flex-shrink-0 bg-gradient-to-br from-brand-primary to-[#7e57c2]"
            >
              {profile.name.charAt(0).toUpperCase()}
            </motion.div>

            <div className="flex-1 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold tracking-widest uppercase mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Student
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2 uppercase">
                {profile.name}
              </h1>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-gray-300" /> {profile.register_no}
                </div>
                <div className="hidden sm:block text-gray-200">•</div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-300" /> {profile.department}
                </div>
              </div>
            </div>

            <div className="md:self-end pt-4 md:pt-0">
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border ${roomState.bg} ${roomState.border} ${roomState.color} font-bold text-xs shadow-sm tracking-wide uppercase`}>
                <CheckCircle2 className="w-4 h-4" />
                {roomState.text}
              </div>
            </div>
          </motion.div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">

            {/* Left Column: Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="lg:col-span-2 flex flex-col gap-6"
            >
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: BookOpen, label: 'Register No.', value: profile.register_no, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { icon: Building2, label: 'Department', value: profile.department, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { icon: Calendar, label: 'Academic Year', value: `Year ${profile.year}`, color: 'text-pink-600', bg: 'bg-pink-50' },
                    { icon: Phone, label: 'Contact Phone', value: profile.phone || 'N/A', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: Mail, label: 'Email Address', value: profile.email || 'N/A', color: 'text-blue-600', bg: 'bg-blue-50', span: true },
                  ].map((field, i) => (
                    <div key={i} className={`group p-4 rounded-xl shadow-sm bg-[#f8f9fa] border border-gray-100 hover:bg-white transition-all duration-300 ${field.span ? 'sm:col-span-2' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 w-8 h-8 rounded-lg ${field.bg} ${field.color} flex items-center justify-center shrink-0`}>
                          <field.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{field.label}</p>
                          <p className="text-sm font-bold text-gray-900">{field.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {profile.address && (
                    <div className="sm:col-span-2 group p-4 rounded-2xl bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0`}>
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Residential Address</p>
                          <p className="font-medium text-gray-800 leading-relaxed">{profile.address}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column: Room Assignment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col gap-6"
            >
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Hostel Details</h3>
                </div>

                {profile.room_number ? (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-gray-100 text-center transition-all group">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Room Number</p>
                      <p className="text-4xl font-black text-brand-primary tracking-tight">{profile.room_number}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-gray-100 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hostel</p>
                        <p className="text-lg font-bold text-gray-800">{getHostelName(profile.block)}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-gray-100 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Floor</p>
                        <p className="text-lg font-bold text-gray-800">{profile.floor}</p>
                      </div>
                    </div>

                    <div className="py-3 px-4 rounded-2xl bg-gray-50/50 border border-gray-100 flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500">Room Type</p>
                      <p className="text-xs font-bold text-gray-900 capitalize px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200">
                        {profile.room_type}
                      </p>
                    </div>

                    <div className="py-3 px-4 rounded-2xl bg-gray-50/50 border border-gray-100 flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500">Warden Name</p>
                      <p className="text-xs font-bold text-gray-900 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200">
                        {profile.warden_name || 'Head Warden'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                    <BedDouble className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">You have not been allocated a room yet.</p>
                    <p className="text-xs text-gray-400 mt-2">Please contact the hostel administration.</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
