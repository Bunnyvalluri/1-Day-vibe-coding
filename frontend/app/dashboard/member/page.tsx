'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Calendar, MapPin, Users, Ticket, Trash2, ShieldAlert, Award, Loader2, RefreshCw } from 'lucide-react';

interface Registration {
  id: string;
  eventId: string;
  registrationType: string;
  attendeeCount: number;
  notes: string | null;
  status: string;
  registeredAt: string;
  event: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    venue: string;
    category: string;
    status: string;
  };
  attendance: {
    checkInTime: string | null;
    attendanceStatus: string;
  } | null;
}

export default function MemberDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // QR ticket state
  const [selectedTicket, setSelectedTicket] = useState<Registration | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  // Cancelling states
  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/my-registrations');
      setRegistrations(data.registrations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowTicket = async (reg: Registration) => {
    setSelectedTicket(reg);
    setQrLoading(true);
    setQrUrl('');
    try {
      const data = await apiRequest(`/registrations/${reg.id}/qr`);
      setQrUrl(data.qrCodeUrl);
    } catch (err) {
      console.error('Failed to generate QR', err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await apiRequest(`/cancel-registration/${cancelTarget.id}`, {
        method: 'DELETE',
      });
      setCancelTarget(null);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration.');
    } finally {
      setCancelLoading(false);
    }
  };

  const pastRegistrations = registrations.filter(
    (r) => r.status === 'CANCELLED' || new Date(r.event.endDate) <= new Date()
  );

  const activeRegistrations = registrations.filter((r) => {
    if (r.status === 'CANCELLED' || new Date(r.event.endDate) <= new Date()) return false;
    
    const matchesSearch = r.event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.event.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Stats calculation
  const totalBookings = registrations.filter((r) => r.status !== 'CANCELLED').length;
  const attendedCount = registrations.filter(
    (r) => r.attendance?.attendanceStatus === 'PRESENT' || r.attendance?.attendanceStatus === 'LATE'
  ).length;
  
  const pastCheckins = pastRegistrations.filter((r) => r.status !== 'CANCELLED');
  const attendanceRate = pastCheckins.length > 0 ? Math.round((attendedCount / pastCheckins.length) * 100) : 100;

  const absentCount = registrations.filter(
    (r) => r.attendance?.attendanceStatus === 'ABSENT' && new Date(r.event.endDate) < new Date()
  ).length;

  const downloadICS = (event: any) => {
    const cleanDate = (dStr: string) => {
      const d = new Date(dStr);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const start = cleanDate(event.startDate);
    const end = cleanDate(event.endDate);
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Grace Community Church//Event Registration//EN',
      'BEGIN:VEVENT',
      `UID:reg-${event.id}`,
      `DTSTAMP:${cleanDate(new Date().toISOString())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, ' ')}`,
      `LOCATION:${event.venue}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">My Registrations</h1>
          <p className="text-slate-500 text-xs mt-1">Manage booked seats, view tickets, and review attendance logs</p>
        </div>
        <button
          onClick={fetchRegistrations}
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all flex items-center gap-2 text-xs font-semibold shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-650 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl flex items-center gap-4 border border-amber-200 bg-gradient-to-br from-amber-50/40 to-white glow-amber shadow-sm">
          <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200/50">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Bookings</p>
            <h3 className="text-2xl font-black text-amber-650 mt-1">{totalBookings}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl flex items-center gap-4 border border-green-200 bg-gradient-to-br from-green-50/40 to-white glow-teal shadow-sm">
          <div className="p-3.5 bg-green-500/10 text-green-600 rounded-xl border border-green-200/50">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attended Programs</p>
            <h3 className="text-2xl font-black text-green-700 mt-1">{attendedCount}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl flex items-center gap-4 border border-red-200 bg-gradient-to-br from-red-50/40 to-white glow-pink shadow-sm">
          <div className="p-3.5 bg-red-500/10 text-red-650 rounded-xl border border-red-200/50">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Absent Logs</p>
            <h3 className="text-2xl font-black text-red-650 mt-1">{absentCount}</h3>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs">Loading registrations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Tickets */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800">Active Check-in Tickets</h2>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tickets..."
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none bg-white font-bold"
                >
                  <option value="All">All Categories</option>
                  <option value="Worship">Worship</option>
                  <option value="Youth">Youth</option>
                  <option value="Prayer Meeting">Prayer Meeting</option>
                  <option value="Outreach">Outreach</option>
                  <option value="Retreat">Retreat</option>
                  <option value="Special Service">Special Service</option>
                </select>
              </div>
            </div>

            {activeRegistrations.length === 0 ? (
              <div className="p-10 border border-dashed border-slate-200 rounded-2xl text-center bg-white shadow-sm">
                <p className="text-slate-500 text-xs">No active registrations found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRegistrations.map((reg) => {
                  const category = reg.event.category.toLowerCase();
                  let categoryStyle = 'bg-slate-50 text-slate-700 border-slate-200/50';
                  let cardHighlight = 'border-slate-200 hover:border-slate-300';
                  let accentLine = 'bg-slate-550';
                  let iconColor = 'text-slate-500';
                  let glowStyle = 'hover:shadow-sm';
                  let buttonStyle = 'bg-slate-600 hover:bg-slate-700 text-white';

                  if (category.includes('worship') || category.includes('service')) {
                    categoryStyle = 'bg-amber-50 text-amber-850 border-amber-200/60';
                    cardHighlight = 'border-amber-100 hover:border-amber-400 bg-gradient-to-b from-amber-50/10 to-white';
                    accentLine = 'bg-amber-500';
                    iconColor = 'text-amber-500';
                    glowStyle = 'glow-amber hover:shadow-md';
                    buttonStyle = 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/10';
                  } else if (category.includes('youth') || category.includes('retreat') || category.includes('camp')) {
                    categoryStyle = 'bg-indigo-50 text-indigo-850 border-indigo-200/60';
                    cardHighlight = 'border-indigo-100 hover:border-indigo-400 bg-gradient-to-b from-indigo-50/10 to-white';
                    accentLine = 'bg-indigo-650';
                    iconColor = 'text-indigo-500';
                    glowStyle = 'glow-indigo hover:shadow-md';
                    buttonStyle = 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/10';
                  } else if (category.includes('outreach') || category.includes('mission')) {
                    categoryStyle = 'bg-pink-50 text-pink-855 border-pink-200/60';
                    cardHighlight = 'border-pink-100 hover:border-pink-400 bg-gradient-to-b from-pink-50/10 to-white';
                    accentLine = 'bg-pink-500';
                    iconColor = 'text-pink-500';
                    glowStyle = 'glow-pink hover:shadow-md';
                    buttonStyle = 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-pink-500/10';
                  } else if (category.includes('prayer') || category.includes('meeting') || category.includes('study')) {
                    categoryStyle = 'bg-teal-50 text-teal-850 border-teal-200/60';
                    cardHighlight = 'border-teal-100 hover:border-teal-400 bg-gradient-to-b from-teal-50/10 to-white';
                    accentLine = 'bg-teal-600';
                    iconColor = 'text-teal-500';
                    glowStyle = 'glow-teal hover:shadow-md';
                    buttonStyle = 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-600/10';
                  }

                  return (
                    <div key={reg.id} className={`glass-card rounded-2xl p-5 border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${cardHighlight} ${glowStyle}`}>
                      {/* Accent Top Bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentLine}`}></div>

                      <div className="pt-2">
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${categoryStyle}`}>
                            {reg.event.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-extrabold">{reg.registrationType}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{reg.event.title}</h4>
                        <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed mb-4">{reg.event.description}</p>
                      </div>

                      <div>
                        <div className="space-y-2.5 mb-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-3.5 h-3.5 ${iconColor}`} />
                            <span className="font-medium">{new Date(reg.event.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-3.5 h-3.5 ${iconColor}`} />
                            <span className="line-clamp-1 font-medium">{reg.event.venue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className={`w-3.5 h-3.5 ${iconColor}`} />
                            <span className="font-medium">Headcount: {reg.attendeeCount}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShowTicket(reg)}
                            className={`flex-1 py-2 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm ${buttonStyle}`}
                          >
                            <Ticket className="w-3.5 h-3.5" /> View QR Pass
                          </button>
                          <button
                            onClick={() => downloadICS(reg.event)}
                            className="px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 rounded-xl transition-all shadow-sm flex items-center justify-center"
                            title="Add to Calendar (.ics)"
                          >
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          </button>
                          <button
                            onClick={() => setCancelTarget(reg)}
                            className="p-2 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 text-red-650 rounded-xl transition-all shadow-sm"
                            title="Cancel Registration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Participation Logs & Fellowship Level */}
          <div className="space-y-6">
            
            {/* Fellowship Engagement Gauge */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4.5 h-4.5 text-amber-500" /> Fellowship Level
              </h3>
              
              <div className="flex items-center gap-4 pt-2">
                <div className="relative w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center font-black text-slate-800 text-sm shadow-inner">
                  {attendanceRate}%
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent border-r-transparent animate-spin-slow opacity-15"></div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Attendance Index</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {attendanceRate >= 90 ? '🌟 Faithful Pillar' : attendanceRate >= 75 ? '⚡ Consistent Member' : '🌱 Growing Disciple'}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">Based on past {pastCheckins.length} registered programs</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100 mt-3">
                <div 
                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                    attendanceRate >= 85 ? 'from-green-500 to-emerald-500' : 'from-indigo-500 to-purple-500'
                  }`}
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800">Participation Logs</h2>
            <div className="glass-panel border border-slate-200 bg-white shadow-sm rounded-2xl p-4 overflow-hidden">
              {pastRegistrations.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No past events recorded</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {pastRegistrations.map((reg) => {
                    const status = reg.status;
                    const attStatus = reg.attendance?.attendanceStatus || 'ABSENT';
                    const isCancelled = status === 'CANCELLED';

                    return (
                      <div key={reg.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-900 line-clamp-1">{reg.event.title}</p>
                          <p className="text-[8px] text-slate-400 mt-0.5">Date: {new Date(reg.event.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          {isCancelled ? (
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase badge-cancelled">
                              Cancelled
                            </span>
                          ) : attStatus === 'PRESENT' || attStatus === 'LATE' ? (
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-green-50 text-green-700 border border-green-200">
                              {attStatus}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                              Absent
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Pass QR Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-center text-slate-900 mb-1">Check-in Pass</h3>
            <p className="text-[10px] text-center text-slate-500 mb-6">Present this QR code to the ministry leader</p>

            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center mx-auto w-64 h-64 border border-slate-200 relative shadow-sm">
              {qrLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              ) : qrUrl ? (
                <img src={qrUrl} alt="Check-in Pass" className="w-56 h-56 object-contain" />
              ) : (
                <p className="text-slate-400 text-xs">Failed to load pass</p>
              )}
            </div>

            <div className="text-center mt-6 space-y-1">
              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{selectedTicket.event.title}</h4>
              <p className="text-[10px] text-slate-500">Venue: {selectedTicket.event.venue}</p>
              <p className="text-[10px] text-indigo-600 font-bold">Ticket for {selectedTicket.attendeeCount} Attendee(s)</p>
            </div>

            <button
              onClick={() => {
                setSelectedTicket(null);
                setQrUrl('');
              }}
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 relative shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center mb-4 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Ticket?</h3>
            <p className="text-slate-600 text-xs leading-relaxed mb-6">
              Are you sure you want to cancel your registration for <strong className="text-slate-900">"{cancelTarget.event.title}"</strong>? 
              This will release your reserved seat ({cancelTarget.attendeeCount} spots) back to the community pool.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-semibold rounded-xl text-xs transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={cancelLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center"
              >
                {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Cancel Pass'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
