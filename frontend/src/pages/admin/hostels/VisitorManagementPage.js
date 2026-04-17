import React, { useCallback, useEffect, useState } from 'react';
import { visitorsAPI, studentsAPI, wardenAPI } from '../../../services/api';
import { Card, Button, Input, Select, Badge, Table, Modal, Spinner } from '../../../components/ui';
import { LogOut, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import useDebouncedValue from '../../../hooks/useDebouncedValue';

export default function VisitorManagementPage() {
  const { isAdmin, isWarden } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [students, setStudents] = useState([]);

  const [formData, setFormData] = useState({
    visitor_name: '',
    relation: '',
    phone: '',
    id_proof: '',
    student_id: ''
  });

  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await visitorsAPI.getAll({ search: debouncedSearch, status: statusFilter });
      setVisitors(res.data.data);
    } catch (err) {
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  const fetchStudents = useCallback(async () => {
    try {
      // Wardens use their own endpoint; admins use the admin students endpoint
      if (isWarden) {
        const res = await wardenAPI.getStudents({ limit: 1000 });
        setStudents(res.data.data);
      } else {
        const res = await studentsAPI.getAll({ limit: 1000 });
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load students');
    }
  }, [isWarden]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      await visitorsAPI.create(formData);
      toast.success('Visitor logged successfully');
      setIsModalOpen(false);
      setFormData({ visitor_name: '', relation: '', phone: '', id_proof: '', student_id: '' });
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log visitor');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMarkExit = async (id) => {
    if (!window.confirm('Mark this visitor as exited?')) return;
    try {
      await visitorsAPI.markExit(id);
      toast.success('Visitor exit marked');
      fetchVisitors();
    } catch (err) {
      toast.error('Failed to mark exit');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visitor record?')) return;
    try {
      await visitorsAPI.delete(id);
      toast.success('Visitor deleted');
      fetchVisitors();
    } catch (err) {
      toast.error('Failed to delete visitor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-4">
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Log Visitor
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Search by visitor name, phone, or student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="inside">Currently Inside</option>
              <option value="exited">Exited</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <Table 
              columns={[
                { key: 'visitor', label: 'Visitor', render: (_, row) => (
                  <div>
                    <div className="font-medium text-gray-900">{row.visitor_name}</div>
                    <div className="text-xs text-gray-500">{row.relation} • {row.phone}</div>
                  </div>
                )},
                { key: 'student', label: 'Visiting (Student)', render: (_, row) => (
                  <div>
                    <div className="text-sm text-gray-900">{row.student_name}</div>
                    <div className="text-xs text-gray-500">{row.student_reg} • {row.room_number ? `Room ${row.room_number}` : 'No Room'}</div>
                  </div>
                )},
                { key: 'in_time', label: 'Entry Time', render: (val) => <div className="text-sm whitespace-nowrap">{new Date(val).toLocaleString()}</div> },
                { key: 'out_time', label: 'Exit Time', render: (val) => <div className="text-sm whitespace-nowrap">{val ? new Date(val).toLocaleString() : '-'}</div> },
                { key: 'status', label: 'Status', render: (val) => (
                  <Badge variant={val === 'inside' ? 'success' : 'default'}>
                    {val === 'inside' ? 'Inside' : 'Exited'}
                  </Badge>
                )},
                { key: 'actions', label: 'Actions', render: (_, row) => (
                  <div className="flex items-center gap-2">
                    {row.status === 'inside' && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkExit(row.id)} title="Mark Exit" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="outline" onClick={() => handleDelete(row.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              ]}
              data={visitors}
            />
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Visitor">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="Visitor Name" 
            required 
            value={formData.visitor_name} 
            onChange={e => setFormData({...formData, visitor_name: e.target.value})} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Relation (e.g., Father)" 
              required 
              value={formData.relation} 
              onChange={e => setFormData({...formData, relation: e.target.value})} 
            />
            <Input 
              label="Phone Number" 
              required 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
            />
          </div>
          <Input 
            label="ID Proof (optional)" 
            value={formData.id_proof} 
            onChange={e => setFormData({...formData, id_proof: e.target.value})} 
          />
          <Select 
            label="Visiting Student" 
            required 
            value={formData.student_id} 
            onChange={e => setFormData({...formData, student_id: e.target.value})}
          >
            <option value="">Select Student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.register_no})</option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? 'Logging...' : 'Log Entry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
