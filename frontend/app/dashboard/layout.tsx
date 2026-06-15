'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getUser, logout } from '../utils/api';
import {
  Calendar,
  LogOut,
  Bell,
  User as UserIcon,
  ShieldCheck,
  BookOpen,
  Menu,
  X,
  Clock,
  CheckSquare,
  ChevronDown,
  UserCog
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push('/login');
    } else {
      setUser(activeUser);
      fetchNotifications();
    }
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest('/notifications');
      const list = data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading session...
      </div>
    );
  }

  // Sidebar links configuration
  const sidebarLinks = [
    {
      name: 'Member Portal',
      href: '/dashboard/member',
      icon: UserIcon,
      roles: ['MEMBER', 'MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Ministry Leader',
      href: '/dashboard/leader',
      icon: Calendar,
      roles: ['MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Admin Panel',
      href: '/dashboard/admin',
      icon: ShieldCheck,
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
    {
      name: 'Super Admin',
      href: '/dashboard/superadmin',
      icon: Clock,
      roles: ['SUPER_ADMIN'],
    },
    {
      name: 'Edit Profile',
      href: '/dashboard/profile',
      icon: UserCog,
      roles: ['MEMBER', 'MINISTRY_LEADER', 'ADMIN', 'SUPER_ADMIN'],
    },
  ];

  const filteredLinks = sidebarLinks.filter((link) => link.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 relative">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 border-r border-slate-200 bg-white flex flex-col fixed inset-y-0 left-0 z-30 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative shadow-sm`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-sm shadow-sm">
              G
            </div>
            <span className="font-extrabold text-sm text-slate-900">Dashboard</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <p className="text-sm font-bold text-slate-950 line-clamp-1">{user.fullName}</p>
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">{user.role.replace('_', ' ')}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">ID: {user.memberId || 'Guest'}</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            
            // Colorful active gradients based on path
            let activeClass = 'bg-indigo-600 text-white shadow-md';
            if (link.href === '/dashboard/member') activeClass = 'bg-gradient-to-r from-indigo-650 to-purple-600 text-white shadow-md shadow-indigo-100/50';
            if (link.href === '/dashboard/leader') activeClass = 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-100/40';
            if (link.href === '/dashboard/admin') activeClass = 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-100/40';
            if (link.href === '/dashboard/superadmin') activeClass = 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-100/40';
            if (link.href === '/dashboard/profile') activeClass = 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-md shadow-slate-100/40';
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  active
                    ? `${activeClass} font-bold`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 hover:translate-x-1'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 transition-all mb-1"
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Public Home Page
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-red-650 hover:text-red-700 hover:bg-red-50 transition-all text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-600 hidden sm:block">
              {pathname === '/dashboard/member' && 'My Member Space'}
              {pathname === '/dashboard/leader' && 'Ministry Leadership Board'}
              {pathname === '/dashboard/admin' && 'System Admin Controls'}
              {pathname === '/dashboard/superadmin' && 'Super User Panel'}
              {pathname === '/dashboard/profile' && 'My Profile'}
            </h2>
          </div>

          <div className="flex items-center gap-4 relative">
            
            {/* Notification center */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications();
                }}
                className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications panel dropdown */}
              {showNotifications && (
                <>
                  <div
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-0 z-30"
                  ></div>
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 animate-fade-in max-h-96 overflow-y-auto flex flex-col">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
                      <span className="text-xs font-bold text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                        >
                          <CheckSquare className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 flex-grow overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-400">No notifications yet</p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif.id)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                              notif.isRead
                                ? 'bg-slate-50/40 border-slate-100 text-slate-500'
                                : 'bg-gradient-to-r from-indigo-50/10 to-white border-indigo-100 text-slate-800 hover:border-indigo-400 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-bold ${!notif.isRead ? 'text-indigo-650' : 'text-slate-400'}`}>
                                {notif.title}
                              </span>
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-[10px] leading-relaxed line-clamp-2">{notif.message}</p>
                            <span className="text-[8px] text-slate-400 mt-2 block">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar with dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400 flex items-center justify-center font-bold text-xs text-white shadow-md hover:scale-105 transition-all">
                  {user.fullName.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    onClick={() => setShowProfileMenu(false)}
                    className="fixed inset-0 z-30"
                  />
                  <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-40 animate-fade-in">
                    <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{user.fullName}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                    >
                      <UserCog className="w-4 h-4 text-indigo-500" />
                      Edit Profile
                    </Link>
                    <button
                      onClick={() => { setShowProfileMenu(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-all text-left mt-0.5"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Dashboard Pages */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
