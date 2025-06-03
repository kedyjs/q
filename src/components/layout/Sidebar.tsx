import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CheckSquare, Trello, 
  Settings, ChevronLeft, ChevronRight, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isTeamLeader, logout } = useAuth();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, text: 'Gösterge Paneli' },
    { to: '/tasks', icon: <CheckSquare size={20} />, text: 'Görevler' },
    { to: '/kanban', icon: <Trello size={20} />, text: 'Kanban' },
    ...(isTeamLeader 
      ? [{ to: '/users', icon: <Users size={20} />, text: 'Kullanıcılar' }] 
      : []
    ),
    { to: '/settings', icon: <Settings size={20} />, text: 'Ayarlar' },
  ];

  return (
    <aside 
      className={`bg-slate-800 text-white transition-all duration-300 ease-in-out 
                ${collapsed ? 'w-16' : 'w-56'} relative h-screen flex flex-col`}
    >
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : ''}`}>
          {!collapsed && <span className="font-bold text-lg">Görev Takip</span>}
          {collapsed && <CheckSquare className="text-blue-400" size={24} />}
        </div>
        <button 
          onClick={toggleSidebar}
          className={`text-gray-400 hover:text-white transition-colors ${collapsed ? 'absolute -right-3 top-5 bg-slate-800 rounded-full' : ''}`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.to} className="mb-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center py-2 px-4 ${
                    isActive
                      ? 'bg-slate-700 text-blue-400'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  } transition-colors ${collapsed ? 'justify-center' : ''}`
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.text}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={() => logout()}
          className={`flex items-center py-2 px-4 text-gray-300 hover:bg-slate-700 
                    hover:text-white transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          {!collapsed && <span className="ml-3">Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;