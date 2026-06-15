'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { ShieldAlert, Cpu, Settings, ScrollText, Check, Loader2, Play, HardDrive, Database, Activity, Download, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [maxGuestLimit, setMaxGuestLimit] = useState(10);
  const [logLevel, setLogLevel] = useState('INFO');
  
  // Settings alert
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Fluctuating health metrics
  const [cpuLoad, setCpuLoad] = useState(24);
  const [dbLatency, setDbLatency] = useState(11);
  const [activeConnections, setActiveConnections] = useState(148);

  // Log Search & Filters States
  const [logSearch, setLogSearch] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState('ALL');

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad((prev) => Math.min(95, Math.max(5, prev + Math.floor(Math.random() * 7) - 3)));
      setDbLatency((prev) => Math.min(50, Math.max(2, prev + Math.floor(Math.random() * 5) - 2)));
      setActiveConnections((prev) => Math.min(300, Math.max(80, prev + Math.floor(Math.random() * 9) - 4)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Mock System Audit logs (high fidelity simulator)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      action: 'ROLE_UPDATE',
      user: 'Elijah Vance (SUPER_ADMIN)',
      details: 'Updated role of Joshua Strong to MINISTRY_LEADER',
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      status: 'SUCCESS',
    },
    {
      id: 'log-2',
      action: 'SYSTEM_SETTINGS_CHANGE',
      user: 'Elijah Vance (SUPER_ADMIN)',
      details: 'Changed default guest registration limit to 10',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'SUCCESS',
    },
    {
      id: 'log-3',
      action: 'USER_REGISTRATION',
      user: 'Grace Miller (MEMBER)',
      details: 'Created new account (ID: M-30001)',
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      status: 'SUCCESS',
    },
    {
      id: 'log-4',
      action: 'DATABASE_BACKUP',
      user: 'SYSTEM',
      details: 'Automated database backup executed in 12ms',
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      status: 'SUCCESS',
    },
    {
      id: 'log-5',
      action: 'CHECKIN_REJECTED',
      user: 'David Praise (MINISTRY_LEADER)',
      details: 'Check-in failed: ticket QR was associated with a different event',
      timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
      status: 'WARNING',
    },
  ]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    
    // Simulate API request saving settings
    setTimeout(() => {
      setSettingsLoading(false);
      setSettingsSuccess(true);
      
      // Add a new log entry
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'SYSTEM_SETTINGS_CHANGE',
        user: 'Elijah Vance (SUPER_ADMIN)',
        details: `Saved configurations (Maintenance: ${maintenance ? 'ON' : 'OFF'}, Guest limit: ${maxGuestLimit})`,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
      };
      setAuditLogs([newLog, ...auditLogs]);

      setTimeout(() => setSettingsSuccess(false), 2000);
    }, 800);
  };

  const handleSimulateBackup = () => {
    // Adds a mock log entry immediately
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'DATABASE_CLEANUP',
      user: 'Elijah Vance (SUPER_ADMIN)',
      details: 'Triggered manual database vacuum and cache flush.',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleDownloadBackup = () => {
    const backupData = {
      systemName: "Grace Community Church Event Registration System",
      backupTimestamp: new Date().toISOString(),
      globalSettings: {
        maintenanceMode: maintenance,
        maxGroupBookingLimit: maxGuestLimit,
        logLevel: logLevel
      },
      status: "HEALTHY",
      simulatedMetrics: {
        cpuLoad: cpuLoad + "%",
        dbLatency: dbLatency + "ms",
        activeConnections: activeConnections
      }
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `church_system_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SYSTEM_BACKUP',
      user: 'Elijah Vance (SUPER_ADMIN)',
      details: 'Exported JSON backup file of system settings state',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
                          log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                          log.user.toLowerCase().includes(logSearch.toLowerCase());
    const matchesStatus = logFilterStatus === 'ALL' || log.status === logFilterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Super Admin Settings</h1>
        <p className="text-slate-500 text-xs mt-1">Configure global application variables, manage hardware states, and monitor logs</p>
      </div>

      {/* Diagnostics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU Usage Card */}
        <div className="p-5 bg-gradient-to-br from-indigo-50/40 to-white border border-indigo-150 rounded-2xl flex items-center gap-4 glow-indigo relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
          <div className="p-3 bg-indigo-500/10 text-indigo-650 rounded-xl border border-indigo-200/50">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>CPU Usage</span>
              <span className="text-indigo-650 font-black">{cpuLoad}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${cpuLoad}%` }}></div>
            </div>
          </div>
        </div>

        {/* Database Latency Card */}
        <div className="p-5 bg-gradient-to-br from-amber-50/40 to-white border border-amber-150 rounded-2xl flex items-center gap-4 glow-amber relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="p-3 bg-amber-500/10 text-amber-655 rounded-xl border border-amber-200/50">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>DB Response Time</span>
              <span className="text-amber-600 font-black">{dbLatency}ms</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, dbLatency * 2)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Active Connections Card */}
        <div className="p-5 bg-gradient-to-br from-teal-50/40 to-white border border-teal-150 rounded-2xl flex items-center gap-4 glow-teal relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
          <div className="p-3 bg-green-500/10 text-green-650 rounded-xl border border-teal-200/50">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Active Sessions</span>
              <span className="text-green-650 font-black">{activeConnections}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (activeConnections / 500) * 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Global Settings Console */}
        <div className="space-y-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900">Global Configuration</h2>
          <div className="glass-panel p-6 rounded-2xl shadow-sm">
            
            {settingsSuccess && (
              <div className="mb-4 p-3 bg-green-500/15 border border-green-500/35 text-green-600 text-xs rounded-xl flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4" /> Settings saved successfully!
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Maintenance Mode</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMaintenance(!maintenance)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
                      maintenance
                        ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/20'
                        : 'bg-white text-slate-605 border-slate-200 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    {maintenance ? '🔴 Maintenance ACTIVE' : '🟢 Maintenance INACTIVE'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Max Group Booking Limit</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxGuestLimit}
                  onChange={(e) => setMaxGuestLimit(Number(e.target.value))}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Audit Logs Level</label>
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-xs"
                >
                  <option value="INFO">INFO (Verbose)</option>
                  <option value="DEBUG">DEBUG (All logs)</option>
                  <option value="ERROR_ONLY">ERROR (Warnings & Failures Only)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex gap-2">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save System Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Actions Console */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4.5 h-4.5 text-indigo-500" /> Utilities
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleSimulateBackup}
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 text-green-500" /> Trigger Vacuum & Purge
              </button>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" /> Backup System JSON
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log Panel */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <ScrollText className="w-5 h-5 text-amber-500" /> System Audit Logger
          </h2>

          {/* Log Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200/65 shadow-sm">
            <div className="relative flex-grow max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search logs by action, user or details..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white font-bold"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl shadow-sm">
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => {
                const action = log.action.toLowerCase();
                let actionStyle = 'bg-amber-50 text-amber-700 border-amber-200/50';
                if (action.includes('settings')) actionStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
                if (action.includes('user') || action.includes('register')) actionStyle = 'bg-purple-50 text-purple-700 border-purple-200/50';
                if (action.includes('db') || action.includes('database') || action.includes('cleanup') || action.includes('vacuum') || action.includes('backup')) actionStyle = 'bg-teal-50 text-teal-700 border-teal-200/50';
                if (action.includes('reject') || action.includes('fail') || action.includes('warn')) actionStyle = 'bg-red-50 text-red-700 border-red-200/50';
                
                return (
                  <div key={log.id} className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-150/70 rounded-xl space-y-1.5 transition-all shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black font-mono border ${actionStyle}`}>
                        {log.action}
                      </span>
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                          log.status === 'SUCCESS'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : log.status === 'WARNING'
                            ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-700 font-medium">{log.details}</p>
                    <div className="flex justify-between items-center text-[8px] text-slate-500 pt-1.5 border-t border-slate-100/50">
                      <span>By: {log.user}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
