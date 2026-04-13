import React, { useEffect, useState } from 'react';
import { myRoomAPI } from '../../services/api';
import { BedDouble, Calendar, Building2, AlertCircle } from 'lucide-react';
import { Spinner } from '../../components/ui';
import useHostelNameMap from '../../hooks/useHostelNameMap';

function InfoCard({ label, value, accent = false }) {
  return (
    <div className={`rounded-xl p-4 ${accent ? 'bg-brand-primary/5 border border-brand-primary/20' : 'bg-gray-50 border border-brand-border/50'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${accent ? 'text-brand-primary' : 'text-brand-muted'}`}>{label}</p>
      <p className={`text-sm font-bold ${accent ? 'text-brand-primary' : 'text-gray-900'}`}>{value || 'N/A'}</p>
    </div>
  );
}

export default function StudentMyRoomPage() {
  const { getHostelName } = useHostelNameMap();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    myRoomAPI.get()
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load room details. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Spinner size="lg" className="text-brand-primary" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm">{error}</p>
    </div>
  );

  if (!data?.allocated || !data.room) return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Room</h1>
        <p className="text-sm text-brand-muted mt-0.5">Your allocated room details</p>
      </div>
      <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-12 text-center">
        <BedDouble className="h-14 w-14 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-bold text-gray-700">No Room Allocated</h2>
        <p className="text-sm text-brand-muted mt-2 max-w-xs mx-auto">
          You don't have a room assigned yet. Please contact the hostel administration.
        </p>
      </div>
    </div>
  );

  const { room, allocation } = data;
  const amenities = room.amenities ? room.amenities.split(',').map(a => a.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Room</h1>
        <p className="text-sm text-brand-muted mt-0.5">Your allocated room details</p>
      </div>

      {/* Room Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary/70 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/70 font-medium">Room Number</p>
            <h2 className="text-4xl font-black tracking-tight mt-0.5">{room.roomNumber}</h2>
            <p className="text-white/80 text-sm mt-2">
              {getHostelName(room.blockName)} &nbsp;·&nbsp; Floor {room.floorNumber}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              allocation?.status === 'ACTIVE' ? 'bg-green-400/30 text-green-100 border border-green-400/40' : 'bg-yellow-400/30 text-yellow-100'
            }`}>
              {allocation?.status || 'ACTIVE'}
            </span>
            <BedDouble className="h-12 w-12 opacity-20 mt-3 ml-auto" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Room Details */}
        <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
            <BedDouble className="h-4 w-4 text-brand-primary" />
            Room Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Room Type"    value={room.roomType} />
            <InfoCard label="Hostel"       value={getHostelName(room.blockName)} />
            <InfoCard label="Floor"        value={`Floor ${room.floorNumber}`} />
            <InfoCard label="Status"       value={room.status} />
          </div>
          {room.description && (
            <div className="mt-3 rounded-xl bg-gray-50 border border-brand-border/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1">Description</p>
              <p className="text-sm text-gray-700">{room.description}</p>
            </div>
          )}
        </div>

        {/* Allocation Details */}
        <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
            <Calendar className="h-4 w-4 text-brand-primary" />
            Allocation Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Academic Year" value={allocation?.academicYear}  accent />
            <InfoCard label="Semester"      value={allocation?.semester}      accent />
            <InfoCard
              label="Allocated On"
              value={allocation?.allocationDate ? new Date(allocation.allocationDate).toLocaleDateString('en-IN') : null}
            />
            <InfoCard
              label="End Date"
              value={allocation?.endDate ? new Date(allocation.endDate).toLocaleDateString('en-IN') : 'Ongoing'}
            />
          </div>
        </div>
      </div>

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
            <Building2 className="h-4 w-4 text-brand-primary" />
            Amenities
          </h3>
          <div className="flex flex-wrap gap-2">
            {amenities.map((a, i) => (
              <span key={i} className="bg-brand-primary/10 text-brand-primary text-xs font-semibold px-3 py-1 rounded-full">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
