'use client';

import { RefreshCw, Upload, Bell, User, LayoutDashboard, Building2, Search, Users, Settings } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import clsx from 'clsx';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showActions?: boolean;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Building2 },
  { href: '/signals', label: 'Signal Explorer', icon: Search },
  { href: '/sales-queue', label: 'Sales Queue', icon: Users },
  { href: '/settings', label: 'Scheduler & Weights', icon: Settings },
];

export function PageHeader({ title, subtitle, showActions = true }: PageHeaderProps) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  async function handleSync() {
    setLoading(true);
    try {
      await api.syncCrm();
      window.location.reload();
    } catch {
      alert('CRM sync failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    setLoading(true);
    try {
      await api.recalculateScores();
      window.location.reload();
    } catch {
      alert('Score recalculation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="nav-height bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left: Logo */}
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-bold text-away">away intelligence</h1>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-away-50 text-away'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-soft'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: City, Notification, User */}
      <div className="flex items-center gap-6">
        {showActions && (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleRecalculate}
              loading={loading}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Recalculate
            </Button>
            <Button
              onClick={handleSync}
              loading={loading}
              icon={<Upload className="w-4 h-4" />}
            >
              Sync CRM
            </Button>
          </div>
        )}
        <div className="flex items-center gap-4">
          <span className="text-text-primary font-medium">Bengaluru</span>
          <button className="p-2 hover:bg-background-soft rounded-full transition-colors">
            <Bell className="w-5 h-5 text-text-secondary" />
          </button>
          <button className="p-2 hover:bg-background-soft rounded-full transition-colors">
            <User className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  );
}
