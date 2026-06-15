'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Users, Calendar, BarChart3, Bell, UserCheck, ShieldAlert, Shield, Loader2, Sparkles, Send, Search, History } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  memberId: string | null;
  ministry: { name: string } | null;
}

interface Ministry {
  id: string;
  name: string;
}

interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  attendancePercentage: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast Notification Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastMinistryId, setBroadcastMinistryId] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // User Filtering States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');

  // Broadcast History State
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

  // Role modification states
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [roleMessage, setRoleMessage] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, ministriesData] = await Promise.all([
        apiRequest('/reports/stats'),
        apiRequest('/auth/users'),
        apiRequest('/auth/ministries'),
      ]);

      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setMinistries(ministriesData.ministries || []);
    } catch (err) {
      console.error('Failed to load admin logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    setRoleMessage('');
    try {
      await apiRequest('/auth/roles', {
        method: 'PUT',
        body: JSON.stringify({ userId, role: newRole }),
      });
      setRoleMessage('Role updated successfully.');
      
      // Update local state
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      
      // Reload stats in case counts change
      const statsData = await apiRequest('/reports/stats');
      setStats(statsData.stats);
    } catch (err: any) {
      setRoleMessage(err.message || 'Failed to update role.');
    } finally {
      setUpdatingUserId(null);
      setTimeout(() => setRoleMessage(''), 3000);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastLoading(true);
    setBroadcastSuccess(false);

    try {
      await apiRequest('/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          ministryId: broadcastMinistryId || undefined,
        }),
      });

      setBroadcastSuccess(true);

      const newBroadcast = {
        title: broadcastTitle,
        message: broadcastMessage,
        target: broadcastMinistryId ? ministries.find(m => m.id === broadcastMinistryId)?.name || 'Ministry' : 'All Members (Global)',
        time: new Date().toLocaleTimeString()
      };
      setBroadcastHistory((prev) => [newBroadcast, ...prev]);

      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastMinistryId('');
      setTimeout(() => setBroadcastSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to send broadcast.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.memberId && u.memberId.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs">Loading administration modules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Administration Dashboard</h1>
        <p className="text-slate-500 text-xs mt-1">Global system logs, user permissions management, and notification broadcasts</p>
      </div>

      {/* Analytics stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-gradient-to-br from-indigo-50/40 to-white border border-indigo-150 rounded-2xl flex items-center gap-4 glow-indigo relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
            <div className="p-3 bg-indigo-500/10 text-indigo-650 rounded-xl border border-indigo-200/50">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-amber-50/40 to-white border border-amber-150 rounded-2xl flex items-center gap-4 glow-amber relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200/50">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Created Events</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.totalEvents}</h3>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-pink-50/40 to-white border border-pink-155 rounded-2xl flex items-center gap-4 glow-pink relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-pink-500"></div>
            <div className="p-3 bg-pink-500/10 text-pink-600 rounded-xl border border-pink-200/50">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registrations</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.totalRegistrations}</h3>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-teal-50/40 to-white border border-teal-150 rounded-2xl flex items-center gap-4 glow-teal relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
            <div className="p-3 bg-green-500/10 text-green-650 rounded-xl border border-teal-200/50">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Check-in Rate</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.attendancePercentage}%</h3>
            </div>
          </div>
        </div>
      )}

      {roleMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 text-xs rounded-xl">
          {roleMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Role Management Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">System Users Registry</h2>
          </div>

          {/* Filters and search */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200/65 shadow-sm">
            <div className="relative flex-grow max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name, email or ID..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white font-bold"
              >
                <option value="All">All Roles</option>
                <option value="MEMBER">Member</option>
                <option value="MINISTRY_LEADER">Ministry Leader</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white/50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Name / Contact</th>
                    <th className="py-3 px-4">Ministry</th>
                    <th className="py-3 px-4 text-right">System Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{item.memberId || 'Guest'}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.fullName}</p>
                        <p className="text-[9px] text-slate-500">{item.email}</p>
                      </td>
                      <td className="py-3 px-4 text-[10px] text-slate-600">
                        {item.ministry?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {updatingUserId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500 inline-block" />
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            {/* Visual role color indicator badge */}
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                              item.role === 'SUPER_ADMIN'
                                ? 'bg-teal-50 text-teal-700 border-teal-200/50'
                                : item.role === 'ADMIN'
                                ? 'bg-pink-50 text-pink-700 border-pink-200/50'
                                : item.role === 'MINISTRY_LEADER'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200/50'
                            }`}>
                              {item.role.replace('_', ' ')}
                            </span>
                            
                            <select
                              value={item.role}
                              onChange={(e) => handleRoleChange(item.id, e.target.value)}
                              className="glass-input rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-amber-400 shadow-sm"
                            >
                              <option value="MEMBER">Member</option>
                              <option value="MINISTRY_LEADER">Ministry Leader</option>
                              <option value="ADMIN">Admin</option>
                              <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Announcements Broadcast Center & Analytics */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Broadcast Centre</h2>
          
          <div className="glass-panel p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Broadcaster Alert</h3>
                <p className="text-[9px] text-slate-500">Pushes instantly to members' in-app notification centers</p>
              </div>
            </div>

            {broadcastSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-xs rounded-xl flex items-center gap-1.5 animate-fade-in">
                <Sparkles className="w-4 h-4 text-green-500" /> Broadcast sent successfully!
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase mb-2">Broadcast Title</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="E.g., Special Guest Announcement"
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase mb-2">Target Ministry</label>
                <select
                  value={broadcastMinistryId}
                  onChange={(e) => setBroadcastMinistryId(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-xs"
                >
                  <option value="">All Members (Global)</option>
                  {ministries.map((min) => (
                    <option key={min.id} value={min.id}>
                      {min.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase mb-2">Broadcast Message</label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Write message announcements here..."
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={broadcastLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {broadcastLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Broadcast Now
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Broadcast History */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-pink-500" /> Broadcast History
            </h3>
            {broadcastHistory.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                No announcements sent in this session
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {broadcastHistory.map((b, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl text-[10px] space-y-1 transition-colors animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 truncate">{b.title}</span>
                      <span className="text-[8px] text-slate-450 font-medium">{b.time}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{b.message}</p>
                    <div className="text-[8px] text-indigo-600 font-semibold uppercase">
                      Target: {b.target}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registration Breakdown by Category */}
          <div className="glass-panel p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-teal-600" /> Ministry Distributions
            </h3>
            <p className="text-[9px] text-slate-500">Distribution of registrations across major event categories</p>
            
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-amber-800">Worship & Services</span>
                  <span className="text-slate-700">40%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-indigo-800">Youth & Young Adults</span>
                  <span className="text-slate-700">30%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-indigo-650 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-pink-850">Outreach & Missions</span>
                  <span className="text-slate-700">18%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: '18%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-teal-855">Prayer & Discipleship</span>
                  <span className="text-slate-700">12%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
