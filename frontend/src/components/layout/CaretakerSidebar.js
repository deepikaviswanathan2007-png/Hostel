import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Home, FileText, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TopNavBar from './TopNavBar';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { to: '/caretaker', label: 'Dashboard', icon: Home, end: true },
    ]
  },
  {
    title: 'Operations',
    items: [
      { to: '/caretaker/complaints', label: 'Complaints', icon: FileText },
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

export default function CaretakerSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const activeItem = allItems.find(item => (item.to === '/caretaker' ? location.pathname === '/caretaker' : location.pathname.startsWith(item.to)));
  const pageTitle = activeItem?.label || 'Caretaker Dashboard';

  return (
    <div className="min-h-screen bg-brand-surface font-sans">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-brand-sidebar shadow-[4px_0_20px_rgba(0,0,0,0.12)] lg:flex">
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
                Caretaker Portal
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-0 py-4 space-y-4 scrollbar-thin" aria-label="Caretaker navigation">
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

      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        <TopNavBar 
          pageTitle={pageTitle}
          theme="caretaker"
        />

        <main className="flex-1 px-6 py-5 lg:px-8">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative flex w-[260px] flex-col bg-brand-sidebar shadow-xl">
            <div className="border-b border-white/10 px-5 py-4 bg-[#152F5A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                  <img src="/bit-hostel-logo.png" alt="Logo" className="h-6 w-6 object-contain" />
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-white/90">BAIT Caretaker</div>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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
    </div>
  );
}
