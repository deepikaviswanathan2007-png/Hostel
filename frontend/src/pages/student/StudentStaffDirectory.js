import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { staffDirectoryAPI } from '../../services/api';
import { PortalHero, EmptyState, Spinner, Badge } from '../../components/ui';
import { Contact, PhoneCall, Mail, Wrench, Shield, Briefcase, UserCircle } from 'lucide-react';

export default function StudentStaffDirectory() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffDirectoryAPI.getAll()
      .then(res => setStaff(res.data.data || []))
      .catch(() => toast.error('Failed to load staff directory'))
      .finally(() => setLoading(false));
  }, []);

  const getRoleIcon = (role, specialty) => {
    if (role === 'admin') return <Briefcase className="w-6 h-6" />;
    if (role === 'warden') return <Shield className="w-6 h-6" />;
    if (role === 'caretaker' && specialty) return <Wrench className="w-6 h-6" />;
    return <UserCircle className="w-6 h-6" />;
  };

  const getRoleColor = (role) => {
    if (role === 'admin') return 'text-purple-600 bg-purple-100 border-purple-200';
    if (role === 'warden') return 'text-blue-600 bg-blue-100 border-blue-200';
    return 'text-emerald-600 bg-emerald-100 border-emerald-200';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" className="text-brand-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PortalHero
        eyebrow="Help & Support"
        title="Staff Directory"
        description="Contact information for hostel wardens, caretakers, and support staff."
        accent="blue"
        icon={<Contact className="w-5 h-5" />}
      />

      {staff.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {staff.map(member => (
            <div key={member.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${getRoleColor(member.role).split(' ')[1]}`} />
               
               <div className="flex items-start gap-4 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role, member.specialty)}
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-900 leading-tight">{member.name}</h3>
                     <div className="mt-1 flex flex-wrap gap-1.5">
                       <Badge variant={member.role === 'admin' ? 'purple' : member.role === 'warden' ? 'info' : 'success'} className="capitalize">
                         {member.role === 'caretaker' ? 'Caretaker' : member.role}
                       </Badge>
                       {member.specialty && <Badge variant="outline" className="capitalize">{member.specialty.replace('_', ' ')}</Badge>}
                     </div>
                  </div>
               </div>

               <div className="mt-6 space-y-3 relative z-10">
                  <a href={`mailto:${member.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-brand-primary transition-colors p-2 -mx-2 rounded-lg hover:bg-gray-50">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{member.email}</span>
                  </a>
                  <div className="flex items-center gap-3 text-sm text-gray-600 p-2 -mx-2">
                    <PhoneCall className="w-4 h-4 text-gray-400" />
                    <span>Contact via Portal</span>
                  </div>
               </div>

               <div className="mt-6 pt-4 border-t border-gray-50 text-xs text-gray-400 font-medium tracking-wide">
                 Member since {new Date(member.created_at).getFullYear()}
               </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Directory Empty" description="No staff members are currently listed in the directory." icon={<Contact className="w-12 h-12 text-gray-300" />} />
      )}
    </div>
  );
}
