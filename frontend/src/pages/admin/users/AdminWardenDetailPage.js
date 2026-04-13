import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hostelsAPI } from '../../../services/api';
import { ArrowLeft, User, Building2, BedDouble, Users, Home } from 'lucide-react';
import { Spinner } from '../../../components/ui';

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-5 text-center">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mt-1">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-brand-border/40 last:border-0">
      <span className="text-sm text-brand-muted">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value || '—'}</span>
    </div>
  );
}

export default function AdminWardenDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    hostelsAPI.getWardenDetail(id)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load warden details.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Spinner size="lg" className="text-brand-primary" />
    </div>
  );

  if (error || !data) return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 text-sm">{error || 'Warden not found.'}</div>
    </div>
  );

  const { warden, hostelStats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-brand-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{warden.name}</h1>
          <p className="text-sm text-brand-muted mt-0.5">Warden Profile &amp; Hostel Statistics</p>
        </div>
      </div>

      {/* Warden Profile */}
      <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border/40 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-brand-primary" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Warden Information</h2>
        </div>
        <div className="px-6 py-2">
          <InfoRow label="Full Name"  value={warden.name} />
          <InfoRow label="Email"      value={warden.email} />
          <InfoRow label="Specialty"  value={warden.specialty} />
          <InfoRow label="Role"       value="Warden" />
          <InfoRow label="Joined"     value={warden.created_at ? new Date(warden.created_at).toLocaleDateString('en-IN') : null} />
        </div>
      </div>

      {/* Hostel Assignment */}
      {hostelStats ? (
        <>
          <div className="bg-gradient-to-br from-brand-primary to-brand-primary/70 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-1">
              <Building2 className="h-5 w-5 opacity-80" />
              <p className="text-sm text-white/70 font-medium">Assigned Hostel</p>
            </div>
            <h2 className="text-2xl font-black">{hostelStats.hostel.name}</h2>
            <p className="text-white/70 text-sm mt-1">
              {hostelStats.hostel.gender ? (hostelStats.hostel.gender === 'MALE' ? 'Boys Hostel' : hostelStats.hostel.gender === 'FEMALE' ? 'Girls Hostel' : hostelStats.hostel.gender) : ''}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Rooms"    value={hostelStats.totalRooms}    color="text-blue-600"         icon={BedDouble}  />
            <StatCard label="Occupied"       value={hostelStats.occupiedRooms} color="text-orange-600"       icon={Home}       />
            <StatCard label="Available"      value={hostelStats.availableRooms} color="text-green-600"       icon={BedDouble}  />
            <StatCard label="Students"       value={hostelStats.totalStudents} color="text-brand-primary"    icon={Users}      />
          </div>

          {/* Room Details Table */}
          {hostelStats.rooms?.length > 0 && (
            <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-brand-border/40">
                <h2 className="text-sm font-bold text-gray-900">Room Details</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-brand-border/60">
                      {['Room No.', 'Capacity', 'Occupied', 'Status', 'Students'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-brand-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {hostelStats.rooms.map(room => (
                      <tr key={room.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-gray-900">{room.room_number}</td>
                        <td className="px-5 py-3.5 text-gray-700">{room.capacity}</td>
                        <td className="px-5 py-3.5 text-gray-700">{room.currentOccupancy}</td>
                        <td className="px-5 py-3.5">
                          {room.status === 'Full' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Full</span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Available</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {room.students?.length > 0 ? (
                            <div className="space-y-0.5">
                              {room.students.map((s, i) => (
                                <p key={i} className="text-xs text-gray-600">{s.name} {s.register_no ? `(${s.register_no})` : ''}</p>
                              ))}
                            </div>
                          ) : <span className="text-brand-muted text-xs">Empty</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-200" />
          <p className="text-sm font-semibold text-gray-600">No hostel assigned</p>
          <p className="text-xs text-brand-muted mt-1">This warden hasn't been assigned to a hostel yet. Go to Hostels Management to assign one.</p>
        </div>
      )}
    </div>
  );
}

