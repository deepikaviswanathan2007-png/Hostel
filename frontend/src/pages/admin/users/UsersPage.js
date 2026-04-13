import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { usersAPI } from '../../../services/api';
import { Table, Badge, Button, Input, Select, Modal, PageHeader, EmptyState } from '../../../components/ui';
import { format } from 'date-fns';
import { UsersIcon, UserPlus, ShieldIcon, Wrench, Trash2, Edit2 } from 'lucide-react';
import useDebouncedValue from '../../../hooks/useDebouncedValue';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'warden', specialty: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ role: roleFilter, search: debouncedSearch });
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenForm = (user = null) => {
    if (user) {
      setEditId(user.id);
      setFormData({ name: user.name, email: user.email, password: '', role: user.role, specialty: user.specialty || '' });
    } else {
      setEditId(null);
      setFormData({ name: '', email: '', password: '', role: 'warden', specialty: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // Do not send empty password on update
      if (payload.role !== 'caretaker') delete payload.specialty;

      if (editId) {
        await usersAPI.update(editId, payload);
        toast.success('User updated successfully');
      } else {
        if (!payload.password) return toast.error('Password is required for new users');
        await usersAPI.create(payload);
        toast.success('User created successfully');
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const columns = [
    { key: 'name', label: 'User Details', render: (val, row) => (
      <div>
        <div className="font-semibold text-gray-900 leading-tight">{val}</div>
        <div className="text-xs text-gray-500 mt-0.5">{row.email}</div>
      </div>
    )},
    { key: 'role', label: 'Role Profile', render: (val, row) => (
      <div className="flex items-center gap-2">
         {val === 'admin' ? <ShieldIcon className="w-4 h-4 text-purple-500" /> : val === 'warden' ? <UsersIcon className="w-4 h-4 text-blue-500" /> : val === 'caretaker' ? <Wrench className="w-4 h-4 text-emerald-500" /> : <UsersIcon className="w-4 h-4 text-gray-400" />}
         <div>
            <Badge variant={val === 'admin' ? 'purple' : val === 'warden' ? 'info' : val === 'caretaker' ? 'success' : 'default'} className="capitalize">{val === 'caretaker' ? 'Caretaker' : val}</Badge>
            {row.specialty && <div className="text-[10px] uppercase font-bold text-gray-500 mt-1 pl-1 tracking-wider">{row.specialty.replace('_', ' ')}</div>}
         </div>
      </div>
    )},
    { key: 'has_google', label: 'Auth', render: (val) => val ? <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Google</Badge> : <Badge variant="outline">Password</Badge> },
    { key: 'created_at', label: 'Joined', render: (val) => <span className="text-sm text-gray-600">{format(new Date(val), 'MMM yyyy')}</span> },
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Button variant="ghost" className="h-8 w-8 !p-0" onClick={() => handleOpenForm(row)}><Edit2 className="w-4 h-4 text-gray-500" /></Button>
        <Button variant="ghost" className="h-8 w-8 !p-0 hover:bg-red-50" onClick={() => handleDelete(row.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System Administration"
        title="User Management"
        description="Add and manage administrative users, wardens, and caretakers."
        actions={<Button onClick={() => handleOpenForm()} className="gap-2"><UserPlus className="w-4 h-4"/> Add User</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-2">
         <Input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 bg-white" />
         <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full sm:w-48 bg-white">
           <option value="">All Roles</option>
           <option value="admin">Administrators</option>
           <option value="warden">Wardens</option>
           <option value="caretaker">Caretakers</option>
         </Select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         {users.length > 0 ? (
           <Table columns={columns} data={users} loading={loading} />
         ) : (
           <EmptyState 
             title="No Users Found" 
             description="No users matched your search criteria." 
             icon={<UsersIcon className="w-10 h-10 text-gray-300" />} 
           />
         )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit User Profile" : "Register New User"} size="md">
         <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input type="email" label="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required autoComplete="username" />
            <Input type="password" label={editId ? "Password (leave blank to keep current)" : "Initial Password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editId} autoComplete="new-password" />
            
            <div className="pt-2">
              <label className="text-sm font-medium text-gray-700 mb-3 block">System Role</label>
              <div className="grid grid-cols-3 gap-3">
                 {[
                   { id: 'admin', label: 'Admin', icon: <ShieldIcon className="w-4 h-4 mb-2 mx-auto"/>, color: 'purple' },
                   { id: 'warden', label: 'Warden', icon: <UsersIcon className="w-4 h-4 mb-2 mx-auto"/>, color: 'blue' },
                   { id: 'caretaker', label: 'Caretaker', icon: <Wrench className="w-4 h-4 mb-2 mx-auto"/>, color: 'emerald' },
                 ].map(r => (
                   <label key={r.id} className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${formData.role === r.id ? `border-${r.color}-500 bg-${r.color}-50 text-${r.color}-700` : 'border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <input type="radio" className="hidden" name="role" value={r.id} checked={formData.role === r.id} onChange={e => setFormData({...formData, role: e.target.value})} />
                      {r.icon}
                      <span className="text-xs font-bold uppercase tracking-wider">{r.label}</span>
                   </label>
                 ))}
              </div>
            </div>

            {formData.role === 'caretaker' && (
              <Select label="Staff Specialty (For Smart Routing)" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})}>
                <option value="">General Support / No Specialty</option>
                <option value="electrician">Electrician</option>
                <option value="plumber">Plumber</option>
                <option value="carpenter">Carpenter</option>
                <option value="cleaner">Housekeeping / Cleaner</option>
                <option value="network_admin">Network & IT</option>
              </Select>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
               <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
               <Button type="submit" loading={submitting}>{editId ? 'Save Changes' : 'Create User'}</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
