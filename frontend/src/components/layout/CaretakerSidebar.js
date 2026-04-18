import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Home, FileText, LogOut, X } from 'lucide-react';
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
      className={({ isActive }) =>
        `group flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-all duration-200 ${isActive
          ? 'bg-orange-600 text-white shadow-sm'
        : 'text-black hover:bg-slate-100/90 hover:text-black'        }`
      }
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-current opacity-60 transition-transform group-hover:translate-x-0.5" />
    </NavLink>
  );
}

export default function CaretakerSidebar() {
  const contentZoom = 0.85;
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] flex-col border-r border-slate-200 bg-slate-50 shadow-[0_10px_35px_rgba(15,23,42,0.08)] lg:flex">
        <div className="border-b border-slate-200 px-6 py-6 bg-white/70">
          <div className="flex items-center gap-2">
            <img src="/bit-hostel-logo.png" alt="Bannari Amman Institute of Technology Logo" className="h-[38px] w-[38px] object-contain drop-shadow-sm" />
            <div className="leading-tight">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-900 leading-tight">Bannari Amman Institute of Technology</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Operations Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5 custom-scrollbar" aria-label="Caretaker navigation">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem key={item.to + item.label} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-200 bg-white/70">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-3 w-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-[292px] flex flex-col min-h-screen">
        <TopNavBar 
          pageTitle={pageTitle}
          theme="caretaker"
        />

        <main className="flex-1 px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto" style={{ zoom: contentZoom }}>
            <Outlet />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              className="fixed inset-y-0 left-0 z-50 w-[292px] flex-col bg-slate-50 shadow-xl lg:hidden"
            >
              <div className="flex h-[80px] items-center justify-between px-6 border-b border-slate-200 bg-white/70">
                <div className="flex items-center gap-2">
                  <img src="/bit-hostel-logo.png" alt="Bannari Amman Institute of Technology Logo" className="h-[32px] w-[32px] object-contain drop-shadow-sm" />
                  <div className="leading-tight">
                    <div className="text-[11px] font-bold text-slate-900">Bannari Amman Institute of Technology</div>
                    <div className="text-[10px] font-semibold text-slate-600">Operations Portal</div>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5" aria-label="Caretaker mobile navigation">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    <div className="px-3 mb-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      {group.title}
                    </div>
                    <div className="space-y-0.5">
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

              <div className="p-2 border-t border-slate-200 bg-white/70">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
