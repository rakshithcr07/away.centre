'use client';

import { RefreshCw, Upload, Bell, User, LayoutDashboard, Building2, Search, Users, Settings, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <>
      <header className="nav-height bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
        {/* Left: Logo & Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-away hover:opacity-90 transition-opacity whitespace-nowrap">
            away intelligence
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
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

        {/* Right: Actions, City, Notifications, User Profile & Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:gap-6">
          {showActions && (
            <div className="hidden md:flex items-center gap-3">
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
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden sm:inline text-text-primary font-medium">Bengaluru</span>
            <button className="p-2 hover:bg-background-soft rounded-full transition-colors">
              <Bell className="w-5 h-5 text-text-secondary" />
            </button>
            <button className="p-2 hover:bg-background-soft rounded-full transition-colors">
              <User className="w-5 h-5 text-text-secondary" />
            </button>
            
            {/* Mobile Menu Toggle Button */}
            <button 
              className="lg:hidden p-2 hover:bg-background-soft rounded-full transition-colors text-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bg-background/95 backdrop-blur-md z-45 flex flex-col border-b border-border shadow-lg max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Mobile Navigation Links */}
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors',
                      isActive
                        ? 'bg-away-50 text-away'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-soft'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <hr className="border-border" />

            {/* Mobile Action Buttons (Visible only when showActions is true and on mobile viewports) */}
            {showActions && (
              <div className="flex flex-col gap-3">
                <Button
                  variant="secondary"
                  className="w-full justify-center py-3 text-base"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleRecalculate();
                  }}
                  loading={loading}
                  icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                >
                  Recalculate Scores
                </Button>
                <Button
                  className="w-full justify-center py-3 text-base"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSync();
                  }}
                  loading={loading}
                  icon={<Upload className="w-4 h-4" />}
                >
                  Sync CRM
                </Button>
              </div>
            )}
            
            {/* Mobile-only location info */}
            <div className="sm:hidden pt-2 text-center">
              <span className="text-text-secondary text-sm">Active Workspace: </span>
              <span className="text-text-primary font-bold">Bengaluru</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
