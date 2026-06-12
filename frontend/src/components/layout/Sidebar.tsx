'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Radio,
  Users,
  Search,
  Zap,
  Settings,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Building2 },
  { href: '/signals', label: 'Signal Explorer', icon: Search },
  { href: '/sales-queue', label: 'Sales Queue', icon: Users },
  { href: '/settings', label: 'Scheduler & Weights', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-card border-r border-surface-border flex flex-col z-50">
      <div className="p-6 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-away-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Away Intelligence</h1>
            <p className="text-xs text-gray-400">Workspace Intent Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-away-600/20 text-away-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-hover'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-away-700 flex items-center justify-center text-sm font-medium">
            AC
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">Away Center</p>
            <p className="text-xs text-gray-500">Sales Team</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
