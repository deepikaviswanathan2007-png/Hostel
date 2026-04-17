import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { hostelsAPI, roomsAPI } from '../../../services/api';
import { Button, Badge, Input, Select, Modal, Spinner, PageHeader, SectionCard, Table } from '../../../components/ui';
import BulkUploadModal from '../../../components/ui/BulkUploadModal';
import { Upload } from 'lucide-react';
import useHostelNameMap from '../../../hooks/useHostelNameMap';

const STATUS_BADGE = { available: 'success', occupied: 'danger', maintenance: 'warning', reserved: 'info' };
const STATUS_COLOR = {
  available: 'bg-green-500',
  occupied: 'bg-brand-primary',
  maintenance: 'bg-amber-500',
  reserved: 'bg-blue-500',
};

export default function RoomsPage() {
  const { getHostelName } = useHostelNameMap();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hostels, setHostels] = useState([]);
  const [hostelId, setHostelId] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ room_number: '', hostel_id: '', block: 'A', floor: 1, capacity: 4, room_type: 'quad' });
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('grid');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const resolveBlockForForm = useCallback((draft) => {
    const linkedHostel = hostels.find((hostel) => String(hostel.id) === String(draft.hostel_id || ''));
    if (linkedHostel?.block_code) return String(linkedHostel.block_code).toUpperCase();

    // Fallback to explicitly selected block
    return draft.block || 'A';
  }, [hostels]);

  useEffect(() => {
    hostelsAPI.getAll().then(res => setHostels(res.data.hostels || [])).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    roomsAPI.getAll({ hostel_id: hostelId, status }).then(r => setRooms(r.data.data)).finally(() => setLoading(false));
  }, [hostelId, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm({ room_number: '', hostel_id: '', block: 'A', floor: 1, capacity: 3, room_type: 'triple' });
    setModal('add');
  };

  const openEdit = room => {
    setSelected(room);
    let hId = room.hostel_id;
    if (!hId && room.block) {
      const linked = hostels.find(h => String(h.block_code || '').replace(/BLOCK_/i, '').trim().toUpperCase() === String(room.block || '').replace(/BLOCK_/i, '').trim().toUpperCase());
      if (linked) hId = linked.id;
    }
    setForm({ room_number: room.room_number, hostel_id: hId || '', block: room.block, floor: room.floor, capacity: room.capacity, room_type: room.room_type, status: room.status });
    setModal('edit');
  };

  const openDetail = async room => {
    setSelected(room);
    const res = await roomsAPI.getOne(room.id);
    setDetail(res.data.data);
    setModal('detail');
  };

  const handleSave = async () => {
    const block = resolveBlockForForm(form);
    if (!block) {
      toast.error('Select a hostel or use a room number like A-101 so the room can be assigned correctly.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, block };
      if (modal === 'add') {
        await roomsAPI.create(payload);
        toast.success('Room created!');
      } else {
        await roomsAPI.update(selected.id, payload);
        toast.success('Room updated!');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await roomsAPI.delete(id);
      toast.success('Room deleted.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete.');
    }
  };

  const occupancyPct = room => room.capacity > 0 ? Math.round((room.occupied / room.capacity) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Badge variant="default">{rooms.length} rooms in inventory</Badge>
        <Button variant="outline" size="sm" onClick={() => setView(v => v === 'grid' ? 'table' : 'grid')}>
          {view === 'grid' ? 'Table View' : 'Grid View'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-2">
          <Upload className="w-4 h-4" /> Import Rooms
        </Button>
        <Button size="sm" onClick={openAdd}>Add Room</Button>
      </div>

      <SectionCard>
        <div className="flex flex-wrap gap-3">
          <Select value={hostelId} onChange={e => setHostelId(e.target.value)}>
            <option value="">All Hostels</option>
            {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
          <Select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Reserved</option>
          </Select>
          {(hostelId || status) && <Button variant="ghost" size="sm" onClick={() => { setHostelId(''); setStatus(''); }}>Clear</Button>}
          <div className="ml-auto flex items-center gap-4">
            {Object.keys(STATUS_BADGE).map(key => (
              <span key={key} className="flex items-center gap-2 text-xs text-brand-muted">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLOR[key]}`} />
                <span className="capitalize">{key}</span>
              </span>
            ))}
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" className="text-brand-primary" /></div>
      ) : view === 'grid' ? (
        <SectionCard title="Grid Inventory" description="Quick scan view for occupancy and room status.">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {rooms.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ scale: 1.04, y: -2 }}
              onClick={() => openDetail(room)}
              className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all p-2
                ${room.status === 'available' ? 'border-green-200 bg-green-50' : ''}
                ${room.status === 'occupied' ? 'border-brand-primary/20 bg-brand-primary/5' : ''}
                ${room.status === 'maintenance' ? 'border-amber-200 bg-amber-50' : ''}
                ${room.status === 'reserved' ? 'border-blue-200 bg-blue-50' : ''}`}
            >
              <div className="text-sm font-bold text-brand-text">{room.room_number}</div>
              <div className="text-xs text-brand-muted mt-0.5">{room.occupied}/{room.capacity}</div>
              <div className="mt-1.5 w-full rounded-full h-1.5 bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full ${room.status === 'occupied' ? 'bg-brand-primary' : room.status === 'available' ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${occupancyPct(room)}%` }} />
              </div>
            </motion.div>
          ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Table Inventory" description="Detailed room register for administrators managing facilities and occupancy.">
          <Table 
            paginate pageSize={15}
            columns={[
              { key: 'room_number', label: 'Room No', render: val => <span className="font-mono font-semibold text-brand-primary">{val}</span> },
              { key: 'hostel_name', label: 'Hostel Name', render: (val, row) => val || (row.hostel_id && hostels.find(h => h.id === row.hostel_id)?.name) || '-' },
              { key: 'block', label: 'Hostel', render: val => getHostelName(val) },
              { key: 'floor', label: 'Floor', render: val => `Floor ${val}` },
              { key: 'room_type', label: 'Type', render: val => <span className="capitalize">{val}</span> },
              { key: 'capacity', label: 'Capacity' },
              { key: 'occupied', label: 'Occupied', render: (val, row) => (
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full" style={{ width: `${occupancyPct(row)}%` }} />
                  </div>
                  <span className="text-xs font-mono">{row.occupied}/{row.capacity}</span>
                </div>
              )},
              { key: 'status', label: 'Status', render: val => <Badge variant={STATUS_BADGE[val]}>{val}</Badge> },
              { key: 'actions', label: 'Actions', render: (_, row) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>Delete</Button>
                </div>
              )}
            ]}
            data={rooms}
            loading={loading}
          />
        </SectionCard>
      )}

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Import Rooms"
        columns={[
          { key: 'room_number', label: 'Room Number' },
          { key: 'hostel_name', label: 'Hostel Name' },
          { key: 'floor', label: 'Floor' },
          { key: 'capacity', label: 'Capacity' },
          { key: 'room_type', label: 'Room Type' }
        ]}
        sampleData={[
          { room_number: 'A-101', hostel_name: 'Boys Hostel A', floor: '1', capacity: '3', room_type: 'triple' }
        ]}
        uploadEndpoint="/bulk/rooms"
        onSuccess={() => { setIsBulkModalOpen(false); load(); }}
      />

      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Room' : 'Edit Room'}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Room Number" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="e.g. A-101" disabled={modal === 'edit'} />
          <Select label="Hostel" value={form.hostel_id} onChange={e => setForm(f => ({ ...f, hostel_id: e.target.value }))}>
            <option value="">-- No linked hostel --</option>
            {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>

          <Input label="Floor" type="number" min={1} max={10} value={form.floor} onChange={e => setForm(f => ({ ...f, floor: +e.target.value }))} />
          <Input label="Capacity" type="number" min={1} max={6} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} />
          <Select label="Room Type" value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="quad">Quad</option>
          </Select>
          {modal === 'edit' && (
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Reserved</option>
            </Select>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{modal === 'add' ? 'Create Room' : 'Save'}</Button>
        </div>
      </Modal>

      <Modal open={modal === 'detail'} onClose={() => setModal(null)} title={`Room ${detail?.room_number || ''}`}>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[['Hostel Name', detail.hostel_name || getHostelName(detail.block)], ['Floor', `Floor ${detail.floor}`], ['Type', detail.room_type], ['Capacity', detail.capacity], ['Occupied', detail.occupied], ['Status', detail.status]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <div className="text-xs text-brand-muted uppercase font-bold mb-1">{k}</div>
                  <div className="font-semibold text-brand-text capitalize">{v}</div>
                </div>
              ))}
            </div>
            {detail.students?.length > 0 && (
              <div>
                <p className="text-sm font-bold text-brand-text mb-2">Residents</p>
                <div className="space-y-2">
                  {detail.students.map(student => (
                    <div key={student.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light text-white text-xs font-bold flex items-center justify-center">
                        {student.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-brand-text">{student.name}</div>
                        <div className="text-xs text-brand-muted">{student.register_no}, {student.department}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => openEdit(selected)}>Edit Room</Button>
              <Button variant="danger" onClick={() => { setModal(null); handleDelete(selected.id); }}>Delete Room</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
