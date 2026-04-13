import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { allocationsAPI, studentsAPI, roomsAPI, hostelsAPI } from '../../../services/api';
import { Button, Badge, Select, Modal, Table, PageHeader, SectionCard } from '../../../components/ui';
import BulkUploadModal from '../../../components/ui/BulkUploadModal';
import { Upload } from 'lucide-react';
import { format } from 'date-fns';
import useHostelNameMap from '../../../hooks/useHostelNameMap';

export default function AllocationsPage() {
  const { getHostelName } = useHostelNameMap();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [students, setStudents] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [form, setForm] = useState({ student_id: '', hostel_id: '', room_id: '' });
  const [vacateId, setVacateId] = useState('');
  const [saving, setSaving] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const lastOptionsLoadAtRef = useRef(0);
  const load = useCallback(() => {
    setLoading(true);
    allocationsAPI.history().then(r => setHistory(r.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAllocate = async () => {
    try {
      const now = Date.now();
      const isFresh = now - lastOptionsLoadAtRef.current < 30_000; // 30s: prevents refetch storm when reopening modal

      if (!isFresh || students.length === 0 || allRooms.length === 0 || hostels.length === 0) {
        const [sr, rr, hr] = await Promise.all([
          studentsAPI.getAll({ limit: 500 }),
          roomsAPI.getAll({ status: 'available' }),
          hostelsAPI.getAll(),
        ]);

        setStudents((sr.data.data || []).filter(s => !s.room_id));

        const availableRooms = (rr.data.data || []).filter(r => r.occupied < r.capacity);
        setAllRooms(availableRooms);
        setFilteredRooms(availableRooms);
        setHostels(hr.data.hostels || []);

        lastOptionsLoadAtRef.current = now;
      }
    
      setForm({ student_id: '', hostel_id: '', room_id: '' });
      setModal('allocate');
    } catch {
      toast.error('Failed to load allocation options.');
    }
  };

  const handleHostelChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, hostel_id: val, room_id: '' }));
    if (val) {
      setFilteredRooms(allRooms.filter(r => String(r.hostel_id) === String(val)));
    } else {
      setFilteredRooms(allRooms);
    }
  };

  const openVacate = async () => {
    try {
      const sr = await studentsAPI.getAll({ limit: 200 });
      setStudents((sr.data.data || []).filter(s => s.room_id));
      setVacateId('');
      setModal('vacate');
    } catch {
      toast.error('Failed to load students.');
    }
  };

  const handleAllocate = async () => {
    if (!form.student_id || !form.room_id) return toast.error('Select student and room.');
    setSaving(true);
    try {
      await allocationsAPI.allocate({ student_id: +form.student_id, room_id: +form.room_id });
      toast.success('Room allocated!');
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleVacate = async () => {
    if (!vacateId) return toast.error('Select a student.');
    setSaving(true);
    try {
      await allocationsAPI.vacate({ student_id: +vacateId });
      toast.success('Room vacated!');
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'student_name',
      label: 'Student',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-brand-text">{value}</div>
          <div className="text-xs font-mono text-gray-400">{row.register_no}</div>
        </div>
      ),
    },
    {
      key: 'room_number',
      label: 'Room',
      render: (value, row) => <span className="font-mono font-semibold text-brand-primary">{value} ({getHostelName(row.block)})</span>,
    },
    { key: 'allocated_at', label: 'Allocated', render: value => format(new Date(value), 'dd MMM yyyy, HH:mm') },
    { key: 'vacated_at', label: 'Vacated', render: value => value ? format(new Date(value), 'dd MMM yyyy, HH:mm') : 'N/A' },
    { key: 'is_active', label: 'Status', render: value => <Badge variant={value ? 'success' : 'default'}>{value ? 'Active' : 'Vacated'}</Badge> },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Hostel Allocation Control"
        title="Room Allocation Ledger"
        description="Administer student-to-room assignments, track active occupancy, and review historical room movement across hostel blocks."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={openVacate}>Vacate Room</Button>
            <Button size="sm" onClick={openAllocate}>Allocate Room</Button>
          </>
        }
      />

      <SectionCard title="Allocation History" description="Complete assignment trail for room movements, activations, and vacated records.">
        <Table columns={columns} data={history} loading={loading} paginate pageSize={10} />
      </SectionCard>

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Import Allocations"
        columns={[
          { key: 'register_no', label: 'Student Register No' },
          { key: 'room_number', label: 'Room Number' }
        ]}
        sampleData={[
          { register_no: '22CS001', room_number: 'A-101' }
        ]}
        uploadEndpoint="/bulk/allocations"
        onSuccess={() => { setIsBulkModalOpen(false); load(); }}
      />

      <Modal open={modal === 'allocate'} onClose={() => setModal(null)} title="Allocate Room">
        <div className="space-y-4">
          <Select label="Select Student (unassigned)" value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}>
            <option value="">Choose student</option>
            {students.map(student => <option key={student.id} value={student.id}>{student.name} ({student.register_no})</option>)}
          </Select>
          <Select label="Filter by Hostel (Optional)" value={form.hostel_id} onChange={handleHostelChange}>
            <option value="">All Hostels</option>
            {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
          <Select label="Select Room" value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))}>
            <option value="">Choose room</option>
            {filteredRooms.map(room => <option key={room.id} value={room.id}>{room.room_number} ({getHostelName(room.block)}, {room.occupied}/{room.capacity} occupied)</option>)}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleAllocate} loading={saving}>Allocate</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'vacate'} onClose={() => setModal(null)} title="Vacate Room">
        <div className="space-y-4">
          <p className="text-sm text-brand-muted">Select a student currently occupying a room to vacate.</p>
          <Select label="Select Student" value={vacateId} onChange={e => setVacateId(e.target.value)}>
            <option value="">Choose student</option>
            {students.map(student => <option key={student.id} value={student.id}>{student.name} ({student.register_no}), Room {student.room_number}</option>)}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleVacate} loading={saving}>Vacate Room</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
