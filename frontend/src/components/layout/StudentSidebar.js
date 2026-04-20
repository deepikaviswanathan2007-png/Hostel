import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, ClipboardList, LayoutGrid, LogOut, UserRound, X, Building2, CalendarRange, RefreshCcw, Coffee, Users, UserPlus, BedDouble } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TopNavBar from './TopNavBar';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { to: '/student', label: 'Dashboard', icon: LayoutGrid, end: true },
      { to: '/student/profile', label: 'Profile', icon: UserRound },
    ]
  },
  {
    title: 'Hostel & Room',
    items: [
      { to: '/student/my-room', label: 'My Room', icon: BedDouble },
      { to: '/student/applications', label: 'Hostel Application', icon: Building2 },
      { to: '/student/mess-menu', label: 'Mess Menu', icon: Coffee },
    ]
  },
  {
    title: 'Requests & Applications',
    items: [
      { to: '/student/attendance', label: 'Attendance', icon: CalendarRange },
      { to: '/student/requests', label: 'Requests', icon: RefreshCcw },
      { to: '/student/visitors', label: 'Visitor Request', icon: UserPlus },
      { to: '/student/outpass', label: 'Leave', icon: ClipboardList },
    ]
  },
  {
    title: 'Support & Info',
    items: [
      { to: '/student/complaints', label: 'Complaints', icon: ClipboardList },
      { to: '/student/notices', label: 'Notices', icon: Bell },
      { to: '/student/staff-directory', label: 'Staff Directory', icon: Users },
    ]
  }
];

function NavItem({ to, label, icon: Icon, onClick, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      children={({ isActive }) => (
        <div
          className={`flex items-center gap-2 h-[38px] rounded-lg px-4 text-[13.5px] font-medium transition-all duration-150 m-0.5 mx-2 ${
            isActive
              ? 'bg-white/15 text-white border-l-3 border-blue-400 pl-[13px]'
              : 'text-white/70 hover:bg-white/8 hover:text-white'
          }`}
        >
          <Icon className="h-[15px] w-[15px] stroke-[1.75]" />
          <span>{label}</span>
        </div>
      )}
    />
  );
}

export default function StudentSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const activeItem = allItems.find(item => (item.to === '/student' ? location.pathname === '/student' : location.pathname.startsWith(item.to)));
  const pageTitle = activeItem?.label || 'Student Portal';

  return (
    <div className="min-h-screen bg-brand-surface font-sans">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-brand-sidebar shadow-[4px_0_20px_rgba(0,0,0,0.12)] lg:flex">
        {/* Logo Header */}
        <div className="border-b border-white/10 px-5 py-5 bg-[#152F5A]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <img src="/bit-hostel-logo.png" alt="Logo" className="h-7 w-7 object-contain" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/90 line-clamp-2">
                Bannari Amman Institute of Technology
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/50 mt-0.5">
                Student Portal
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-0 py-4 space-y-4 scrollbar-thin" aria-label="Student navigation">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx}>
              <div className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {group.title}
              </div>
              <div className="space-y-0">
                {group.items.map(item => (
                  <NavItem key={item.to + item.label} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium text-white/50 transition-all hover:bg-white/7 hover:text-white/90"
          >
            <LogOut className="h-[15px] w-[15px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        <TopNavBar 
          pageTitle={pageTitle}
          theme="student"
        />

        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-brand-sidebar px-4 py-3 flex items-center h-14">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-white text-sm font-medium ml-3">{pageTitle}</span>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden pt-14">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="relative flex w-[260px] flex-col bg-brand-sidebar shadow-xl">
              {/* Mobile Logo Header */}
              <div className="border-b border-white/10 px-5 py-4 bg-[#152F5A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                    <img src="/bit-hostel-logo.png" alt="Logo" className="h-6 w-6 object-contain" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-white/90">BAIT Hostel</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto px-0 py-4 space-y-4 scrollbar-thin">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    <div className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                      {group.title}
                    </div>
                    <div className="space-y-0">
                      {group.items.map(item => (
                        <NavItem
                          key={item.to + item.label}
                          {...item}
                          onClick={() => setMobileOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Mobile Logout */}
              <div className="border-t border-white/10 p-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-[13px] font-medium text-white/50 transition-all hover:bg-white/7 hover:text-white/90"
                >
                  <LogOut className="h-[15px] w-[15px]" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-6 py-5 lg:px-8 pt-16 lg:pt-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
