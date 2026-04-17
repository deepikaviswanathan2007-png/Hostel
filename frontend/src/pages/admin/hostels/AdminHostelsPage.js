import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { hostelsAPI, usersAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Spinner, Table, Button, SectionCard } from '../../../components/ui';

const GENDER_LABELS = { MALE: 'Boys Hostel', FEMALE: 'Girls Hostel' };
const GENDER_COLORS = {
  MALE: 'bg-blue-50 text-blue-700 border border-blue-200',
  FEMALE: 'bg-pink-50 text-pink-700 border border-pink-200',
};

function StatCard({ label, value, color, index }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-6 text-center hover:shadow-md hover:scale-105 transition-all duration-300"
    >
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-muted mb-3">{label}</p>
      <p className={`text-5xl font-black ${color}`}>{value}</p>
    </motion.div>
  );
}

function HostelModal({ hostel, wardens, onSave, onClose }) {
  const [form, setForm] = useState({
    name: hostel?.name || '',
    gender: hostel?.gender || 'MALE',
    total_rooms: hostel?.total_rooms ?? '',
    capacity: hostel?.capacity ?? '',
    warden_id: hostel?.warden_id || '',
  });
  const [saving, setSaving] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Hostel name is required');
    setSaving(true);
    try {
      await onSave({
        ...form,
        total_rooms: Number(form.total_rooms) || 0,
        capacity: Number(form.capacity) || 0,
        warden_id: form.warden_id || null,
      });
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/60">
          <h2 className="text-base font-bold text-gray-900">{hostel ? 'Edit Hostel' : 'Add New Hostel'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hostel Name *</label>
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sri Ramanujan Block"
              className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          <div className="grid grid-cols-1 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="MALE">Boys Hostel</option>
                <option value="FEMALE">Girls Hostel</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Total Rooms</label>
              <input
                type="number"
                min="0"
                value={form.total_rooms}
                onChange={e => setForm({ ...form, total_rooms: e.target.value })}
                className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Capacity</label>
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={e => setForm({ ...form, capacity: e.target.value })}
                className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Warden</label>
            <select
              value={form.warden_id || ''}
              onChange={e => setForm({ ...form, warden_id: e.target.value })}
              className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="">None</option>
              {wardens.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
              {hostel ? 'Save Changes' : 'Add Hostel'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-brand-border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminHostelsPage() {
  const [hostels, setHostels] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editHostel, setEditHostel] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [hRes, wRes] = await Promise.all([
        hostelsAPI.getAll(),
        usersAPI.getAll({ role: 'warden', limit: 100 }),
      ]);
      setHostels(hRes.data.hostels || []);
      setWardens(wRes.data.data || []);
    } catch {
      toast.error('Failed to load hostels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (form) => {
    try {
      if (editHostel) {
        await hostelsAPI.update(editHostel.id, form);
        toast.success('Hostel updated!');
      } else {
        await hostelsAPI.create(form);
        toast.success('Hostel added!');
      }
      setEditHostel(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hostel');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hostel?')) return;
    try {
      await hostelsAPI.delete(id);
      toast.success('Hostel removed');
      fetchAll();
    } catch {}
  };

  const columns = [
    { key: 'name', label: 'Hostel Name', render: (val) => <span className="font-bold text-gray-900">{val}</span> },
    { key: 'gender', label: 'Gender', render: (val) => <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${GENDER_COLORS[val] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>{GENDER_LABELS[val] || val}</span> },
    { key: 'warden_name', label: 'Warden', render: val => val || 'Not assigned' },
    { key: 'total_rooms', label: 'Configured / Live Rooms', render: (val, row) => <span>{val || 0} / {row.actual_room_count || 0}</span> },
    { key: 'capacity', label: 'Capacity', render: val => val || 0 },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditHostel(row); setShowModal(true); }}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</Button>
      </div>
    )}
  ];

  const maleHostels = hostels.filter(h => h.gender === 'MALE');
  const femaleHostels = hostels.filter(h => h.gender === 'FEMALE');
  const totalRooms = hostels.reduce((sum, hostel) => sum + (Number(hostel.total_rooms) || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Spinner size="lg" className="text-brand-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hostels Management</h1>
          <p className="text-sm text-brand-muted mt-0.5">Manage hostel records and their warden assignments</p>
        </div>
        <button
          onClick={() => { setEditHostel(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Hostel
        </button>
      </div>

      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard label="Total Hostels" value={hostels.length} color="text-gray-900" index={0} />
        <StatCard label="Boys Hostels" value={maleHostels.length} color="text-blue-600" index={1} />
        <StatCard label="Girls Hostels" value={femaleHostels.length} color="text-pink-600" index={2} />
        <StatCard label="Total Rooms" value={totalRooms} color="text-green-600" index={3} />
      </motion.div>

      <SectionCard title="Hostels List" description="Complete registry of all campus accommodations.">
        <Table columns={columns} data={hostels} loading={loading} paginate pageSize={10} />
      </SectionCard>

      {showModal && (
        <HostelModal
          hostel={editHostel}
          wardens={wardens}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditHostel(null); }}
        />
      )}
    </div>
  );
}
