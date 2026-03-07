import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Image, Users, HelpCircle, Download, Settings, Menu, X, LogOut
} from 'lucide-react';
import { useState } from 'react';
import { clearAuthToken } from '../lib/api';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'ダッシュボード' },
  { to: '/calendar', icon: Calendar, label: 'カレンダー' },
  { to: '/images', icon: Image, label: '画像管理' },
  { to: '/characters', icon: Users, label: 'キャラクター' },
  { to: '/quiz', icon: HelpCircle, label: 'クイズ' },
  { to: '/export', icon: Download, label: 'エクスポート' },
  { to: '/settings', icon: Settings, label: '設定' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 flex flex-col
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-kabuki)' }}>
            KABUKI POST 365
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-red-50 text-red-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
              end={to === '/'}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => { clearAuthToken(); window.location.reload(); }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 w-full"
          >
            <LogOut size={18} />
            ログアウト
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center px-4 border-b border-gray-200 bg-white lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
            <Menu size={20} />
          </button>
          <h1 className="ml-3 text-lg font-bold" style={{ color: 'var(--color-kabuki)' }}>
            KABUKI POST 365
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
