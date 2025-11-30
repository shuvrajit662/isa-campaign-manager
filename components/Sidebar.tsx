
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, LayoutGrid, Bug, History } from 'lucide-react';
import { cn } from './UI';

const NAV_ITEMS = [
  { icon: Mail, label: 'Inbox', path: '/inbox' },
  { icon: Bug, label: 'Debugger', path: '/debugger/AC57bed091a6a4108cf257065048c0c344' },
  { icon: History, label: 'Test Executions', path: '/test-executions' },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 flex-shrink-0">
      <div className="p-6 flex items-center space-x-3 text-white">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <LayoutGrid size={20} />
        </div>
        <span className="font-bold text-xl tracking-tight">Isa</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'hover:bg-slate-800/50 hover:text-white'
              )
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-slate-500 truncate">john@isa.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
