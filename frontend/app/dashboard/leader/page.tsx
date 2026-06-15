'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiRequest, getUser, API_BASE_URL } from '../../utils/api';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Loader2,
  Camera,
  Check,
  X,
  FileSpreadsheet,
  FileText,
  Search,
  ScanLine,
  UserCheck
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  capacity: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: string;
  ministryId: string;
  _count: { registrations: number };
}

interface AttendanceRecord {
  id: string;
  registrationId: string;
  attendanceStatus: string;
  checkInTime: string | null;
  markedBy: string | null;
  user: {
    fullName: string;
    email: string;
    phone: string | null;
    memberId: string | null;
  };
  registration: {
    registrationType: string;
    attendeeCount: number;
    notes: string | null;
  };
}

export default function MinistryLeaderDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'create' | 'scanner'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Event Details (Stats & Roll Call)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsSearch, setRecordsSearch] = useState('');

  // Event Creation states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Worship');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [eventStatus, setEventStatus] = useState('OPEN');
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  // Scanner helper states
  const [scannerRecords, setScannerRecords] = useState<AttendanceRecord[]>([]);
  const [scannerRecordsLoading, setScannerRecordsLoading] = useState(false);
  const [scannerSearchQuery, setScannerSearchQuery] = useState('');
  
  // Real-time scan logs
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);

  // Event list search & filters
  const [eventSearch, setEventSearch] = useState('');
  const [eventFilterStatus, setEventFilterStatus] = useState('All');

  // Scanner states
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerEventId, setScannerEventId] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');
  const [manualRegId, setManualRegId] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    const activeUser = getUser();
    setUser(activeUser);
    fetchMinistryEvents();
  }, []);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(850, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScannerAttendees = async (eventId: string) => {
    if (!eventId) {
      setScannerRecords([]);
      return;
    }
    setScannerRecordsLoading(true);
    try {
      const data = await apiRequest(`/attendance/${eventId}`);
      setScannerRecords(data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setScannerRecordsLoading(false);
    }
  };

  const addToSessionLog = (name: string, status: string) => {
    const entry = {
      time: new Date().toLocaleTimeString(),
      name,
      status,
    };
    setSessionLogs((prev) => [entry, ...prev.slice(0, 4)]);
  };

  const handleScannerCheckIn = async (regId: string) => {
    try {
      await apiRequest('/attendance/manual', {
        method: 'POST',
        body: JSON.stringify({ registrationId: regId, status: 'PRESENT' }),
      });
      playBeep();
      fetchScannerAttendees(scannerEventId);
      const rec = scannerRecords.find(r => r.registrationId === regId);
      if (rec) {
        addToSessionLog(rec.user.fullName, 'PRESENT');
      }
    } catch (err: any) {
      alert(err.message || 'Check-in failed.');
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.title.toLowerCase().includes(eventSearch.toLowerCase()) || 
                          ev.venue.toLowerCase().includes(eventSearch.toLowerCase());
    const matchesStatus = eventFilterStatus === 'All' || ev.status === eventFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredScannerRecords = scannerRecords.filter((rec) => {
    const s = scannerSearchQuery.toLowerCase();
    return (
      rec.user.fullName.toLowerCase().includes(s) ||
      (rec.user.memberId && rec.user.memberId.toLowerCase().includes(s)) ||
      rec.attendanceStatus.toLowerCase().includes(s)
    );
  });

  const fetchMinistryEvents = async () => {
    try {
      setLoading(true);
      const activeUser = getUser();
      const endpoint = activeUser?.role === 'MINISTRY_LEADER' 
        ? `/events?ministryId=${activeUser.ministryId}` 
        : `/events`;
      const data = await apiRequest(endpoint);
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateSuccess(false);

    try {
      await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          category,
          venue,
          capacity,
          startDate,
          endDate,
          registrationDeadline: deadline,
          ministryId: user?.ministryId,
          status: eventStatus,
        }),
      });

      setCreateSuccess(true);
      setTitle('');
      setDescription('');
      setVenue('');
      setCapacity(100);
      setStartDate('');
      setEndDate('');
      setDeadline('');
      
      fetchMinistryEvents();
      setTimeout(() => {
        setCreateSuccess(false);
        setActiveTab('events');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to create event.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSelectEvent = async (event: Event) => {
    setSelectedEvent(event);
    fetchAttendanceRecords(event.id);
  };

  const fetchAttendanceRecords = async (eventId: string) => {
    setRecordsLoading(true);
    try {
      const data = await apiRequest(`/attendance/${eventId}`);
      setAttendanceStats(data.stats);
      setAttendanceRecords(data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRecordsLoading(false);
    }
  };

  // Toggle/Update attendance manual
  const handleMarkAttendance = async (registrationId: string, newStatus: string) => {
    try {
      await apiRequest('/attendance/manual', {
        method: 'POST',
        body: JSON.stringify({ registrationId, status: newStatus }),
      });
      if (selectedEvent) {
        fetchAttendanceRecords(selectedEvent.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance.');
    }
  };

  // QR Code Scanner control
  const startScanner = async () => {
    if (!scannerEventId) {
      alert('Please select an event to check in attendees.');
      return;
    }
    setScannerActive(true);
    setScanResult(null);
    setScanError('');

    setTimeout(() => {
      const html5QrCode = new Html5Qrcode('qr-reader-panel');
      qrCodeRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Success callback
          try {
            const parsed = JSON.parse(decodedText);
            
            // Verify event match
            if (parsed.eventId !== scannerEventId) {
              setScanError('This pass belongs to a different event!');
              return;
            }

            // Submit check-in
            const res = await apiRequest('/attendance/checkin', {
              method: 'POST',
              body: JSON.stringify({ registrationId: parsed.registrationId }),
            });

            playBeep();
            setScanResult({
              success: true,
              userName: res.userName,
              eventTitle: res.eventTitle,
              status: res.status,
              checkInTime: res.checkInTime,
            });
            setScanError('');
            addToSessionLog(res.userName, res.status);
            fetchScannerAttendees(scannerEventId);

            // Automatically clear feedback after 3 seconds
            setTimeout(() => setScanResult(null), 3000);
          } catch (err: any) {
            setScanError(err.message || 'Invalid ticket code scanned.');
            setScanResult(null);
          }
        },
        (errorMessage) => {
          // verbose error logs, skip to prevent spamming
        }
      ).catch((err) => {
        setScanError('Camera access failed or blocked. Please try manual entry.');
        setScannerActive(false);
      });
    }, 300);
  };

  const stopScanner = async () => {
    if (qrCodeRef.current) {
      try {
        await qrCodeRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      qrCodeRef.current = null;
    }
    setScannerActive(false);
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRegId || !scannerEventId) return;

    setManualLoading(true);
    setScanResult(null);
    setScanError('');
    try {
      const res = await apiRequest('/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify({ registrationId: manualRegId }),
      });

      playBeep();
      setScanResult({
        success: true,
        userName: res.userName,
        eventTitle: res.eventTitle,
        status: res.status,
        checkInTime: res.checkInTime,
      });
      setManualRegId('');
      addToSessionLog(res.userName, res.status);
      fetchScannerAttendees(scannerEventId);
    } catch (err: any) {
      setScanError(err.message || 'Manual check-in failed.');
    } finally {
      setManualLoading(false);
    }
  };

  // Filter attendance records by search
  const filteredRecords = attendanceRecords.filter((rec) => {
    const s = recordsSearch.toLowerCase();
    return (
      rec.user.fullName.toLowerCase().includes(s) ||
      (rec.user.memberId && rec.user.memberId.toLowerCase().includes(s)) ||
      rec.attendanceStatus.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Sub-Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Ministry Management</h1>
          <p className="text-slate-500 text-xs mt-1">
            Worship leaders, outreach staff, and administrators can build events and scan code passes
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedEvent(null);
              setActiveTab('events');
              stopScanner();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'events' && !selectedEvent
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/15'
                : 'bg-white text-slate-650 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
          >
            My Events
          </button>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setActiveTab('create');
              stopScanner();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/15'
                : 'bg-white text-slate-650 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
          >
            Create Event
          </button>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setActiveTab('scanner');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
              activeTab === 'scanner'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/15'
                : 'bg-white text-slate-650 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" /> Check-in Scanner
          </button>
        </div>
      </div>

      {/* TAB 1: EVENTS LIST */}
      {activeTab === 'events' && !selectedEvent && (
        <div className="space-y-6">
          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-200/65 shadow-sm">
            <div className="relative flex-grow max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search events by title or venue..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={eventFilterStatus}
                onChange={(e) => setEventFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white font-bold"
              >
                <option value="All">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-300 rounded-2xl bg-white/50">
              <p className="text-slate-650 text-sm">No matching events found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => {
                const category = ev.category.toLowerCase();
                let categoryStyle = 'bg-slate-50 text-slate-700 border-slate-200/50';
                let cardHighlight = 'border-slate-200 hover:border-slate-350 bg-white';
                let progColor = 'bg-indigo-650';
                let accentLine = 'bg-indigo-500';
                let glowStyle = 'glow-indigo';

                if (category.includes('worship') || category.includes('service')) {
                  categoryStyle = 'bg-amber-50 text-amber-850 border-amber-200/60';
                  cardHighlight = 'border-amber-100 hover:border-amber-400 bg-gradient-to-b from-amber-50/10 to-white';
                  progColor = 'bg-amber-500';
                  accentLine = 'bg-amber-500';
                  glowStyle = 'glow-amber';
                } else if (category.includes('youth') || category.includes('retreat') || category.includes('camp')) {
                  categoryStyle = 'bg-indigo-50 text-indigo-850 border-indigo-200/60';
                  cardHighlight = 'border-indigo-100 hover:border-indigo-400 bg-gradient-to-b from-indigo-50/10 to-white';
                  progColor = 'bg-indigo-650';
                  accentLine = 'bg-indigo-655';
                  glowStyle = 'glow-indigo';
                } else if (category.includes('outreach') || category.includes('mission')) {
                  categoryStyle = 'bg-pink-50 text-pink-855 border-pink-200/60';
                  cardHighlight = 'border-pink-100 hover:border-pink-400 bg-gradient-to-b from-pink-50/10 to-white';
                  progColor = 'bg-pink-500';
                  accentLine = 'bg-pink-500';
                  glowStyle = 'glow-pink';
                } else if (category.includes('prayer') || category.includes('meeting') || category.includes('study')) {
                  categoryStyle = 'bg-teal-50 text-teal-855 border-teal-200/60';
                  cardHighlight = 'border-teal-100 hover:border-teal-400 bg-gradient-to-b from-teal-50/10 to-white';
                  progColor = 'bg-teal-605';
                  accentLine = 'bg-teal-605';
                  glowStyle = 'glow-teal';
                }

                return (
                  <div key={ev.id} className={`glass-card rounded-2xl p-5 border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 ${cardHighlight} ${glowStyle}`}>
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentLine}`}></div>
                    
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${categoryStyle}`}>
                          {ev.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            ev.status === 'OPEN'
                              ? 'badge-open'
                              : ev.status === 'DRAFT'
                              ? 'badge-draft'
                              : ev.status === 'COMPLETED'
                              ? 'badge-completed'
                              : 'badge-cancelled'
                          }`}
                        >
                          {ev.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{ev.title}</h3>
                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-4">{ev.description}</p>
                    </div>

                    <div>
                      <div className="space-y-2 mb-4 pt-3 border-t border-slate-100 text-[10px] text-slate-505">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(ev.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="line-clamp-1">{ev.venue}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Bookings: {ev._count?.registrations || 0} / {ev.capacity}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectEvent(ev)}
                        className="w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all hover:scale-102"
                      >
                        <UserCheck className="w-4 h-4 text-indigo-500" /> Manage & Roll Call
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EVENT DETAIL: STATS & ROLL CALL */}
      {activeTab === 'events' && selectedEvent && (
        <div className="space-y-6 animate-fade-in">
          {/* Back Action */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to list
            </button>
            <div className="flex gap-2">
              <a
                href={`${API_BASE_URL}/reports/attendance/${selectedEvent.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" /> PDF Report
              </a>
              <a
                href={`${API_BASE_URL}/reports/attendance/${selectedEvent.id}/csv`}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-650" /> CSV Export
              </a>
            </div>
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-indigo-650 border border-indigo-500/20 uppercase">
              {selectedEvent.category}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2 mb-1">{selectedEvent.title}</h2>
            <p className="text-slate-500 text-xs">{selectedEvent.venue} | {new Date(selectedEvent.startDate).toLocaleDateString()}</p>
          </div>

          {/* Attendance Statistics Panel */}
          {attendanceStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="glass-panel p-4 rounded-xl text-center shadow-sm">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Total Tickets</p>
                <h4 className="text-xl font-bold mt-1 text-slate-900">{attendanceStats.totalTickets}</h4>
              </div>
              <div className="glass-panel p-4 rounded-xl text-center shadow-sm">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Headcount</p>
                <h4 className="text-xl font-bold mt-1 text-slate-900">{attendanceStats.totalRegisteredHeadcount}</h4>
              </div>
              <div className="glass-panel p-4 rounded-xl text-center shadow-sm">
                <p className="text-[9px] font-bold text-slate-500 uppercase text-green-600">Present</p>
                <h4 className="text-xl font-bold mt-1 text-green-600">{attendanceStats.presentCount}</h4>
              </div>
              <div className="glass-panel p-4 rounded-xl text-center shadow-sm">
                <p className="text-[9px] font-bold text-slate-500 uppercase text-yellow-600">Late</p>
                <h4 className="text-xl font-bold mt-1 text-yellow-600">{attendanceStats.lateCount}</h4>
              </div>
              <div className="glass-panel p-4 rounded-xl text-center col-span-2 md:col-span-1 shadow-sm">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Rate</p>
                <h4 className="text-xl font-bold mt-1 text-amber-600">{attendanceStats.attendanceRate}%</h4>
              </div>
            </div>
          )}

          {/* Roll Call Table */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Attendee Roll Call</h3>
              <div className="relative w-48 sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={recordsSearch}
                  onChange={(e) => setRecordsSearch(e.target.value)}
                  placeholder="Filter by name / ID..."
                  className="w-full pl-8 pr-3 py-1.5 glass-input rounded-lg text-[10px] shadow-sm"
                />
              </div>
            </div>

            {recordsLoading ? (
              <div className="text-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-500">No matching registrants found</p>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white/50 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <th className="py-3.5 px-4">Member ID</th>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Check-in Time</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{rec.user.memberId || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{rec.user.fullName}</p>
                            <p className="text-[9px] text-slate-500">{rec.user.email}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[10px]">
                            {rec.registration.registrationType} ({rec.registration.attendeeCount})
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                rec.attendanceStatus === 'PRESENT'
                                  ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                  : rec.attendanceStatus === 'LATE'
                                  ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {rec.attendanceStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[10px] text-slate-500 font-medium">
                            {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleMarkAttendance(rec.registrationId, 'PRESENT')}
                                className="py-1 px-2 bg-green-500/10 border border-green-500/20 hover:bg-green-500 hover:text-slate-950 text-green-600 text-[9px] font-bold rounded-lg transition-all"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(rec.registrationId, 'LATE')}
                                className="py-1 px-2 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500 hover:text-slate-950 text-yellow-600 text-[9px] font-bold rounded-lg transition-all"
                              >
                                Late
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(rec.registrationId, 'ABSENT')}
                                className="py-1 px-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 text-[9px] font-bold rounded-lg transition-all"
                              >
                                Reset
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE EVENT */}
      {activeTab === 'create' && (
        <div className="max-w-2xl glass-panel p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Create New Ministry Event</h2>
          <p className="text-slate-600 text-xs mb-6">Build a new program associated with your ministry and open registrations</p>

          {createSuccess && (
            <div className="mb-6 p-4 bg-green-500/15 border border-green-500/30 text-green-600 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-5 h-5" /> Event created and published successfully!
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Worship Revival Night"
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-xs"
                >
                  <option value="Worship">Worship</option>
                  <option value="Youth Meeting">Youth Meeting</option>
                  <option value="Prayer Meeting">Prayer Meeting</option>
                  <option value="Bible Study">Bible Study</option>
                  <option value="Conference">Conference</option>
                  <option value="Retreat">Retreat</option>
                  <option value="Outreach">Outreach</option>
                  <option value="Volunteer Program">Volunteer Program</option>
                  <option value="Special Service">Special Service</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Description</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the goals, schedules, and guest speakers for this event..."
                className="w-full px-4 py-2.5 glass-input rounded-xl text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Venue / Location</label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="E.g., Main Sanctuary"
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Max Seating Capacity</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  placeholder="E.g., 200"
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-[10px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-[10px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Registration Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Publishing Status</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center text-xs gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="OPEN"
                    checked={eventStatus === 'OPEN'}
                    onChange={() => setEventStatus('OPEN')}
                    className="accent-amber-500"
                  />
                  <span className="text-slate-700 font-medium">Publish Immediately (OPEN)</span>
                </label>
                <label className="inline-flex items-center text-xs gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="DRAFT"
                    checked={eventStatus === 'DRAFT'}
                    onChange={() => setEventStatus('DRAFT')}
                    className="accent-amber-500"
                  />
                  <span className="text-slate-700 font-medium">Save as Draft (DRAFT)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs"
            >
              {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create & Publish Event</>}
            </button>
          </form>
        </div>
      )}      {/* TAB 3: CHECK-IN SCANNER */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Active Camera Viewfinder */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2 self-start flex items-center gap-1.5">
              <Camera className="w-5 h-5 text-amber-500" /> Live QR Viewfinder
            </h2>
            <p className="text-slate-600 text-xs mb-6 self-start">Select an event below, allow webcam permissions, and point the camera at a member's pass</p>

            <div className="w-full mb-6">
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-2">Target Check-in Event</label>
              <select
                value={scannerEventId}
                onChange={(e) => {
                  setScannerEventId(e.target.value);
                  stopScanner();
                  fetchScannerAttendees(e.target.value);
                }}
                disabled={scannerActive}
                className="w-full px-4 py-2.5 glass-input rounded-xl text-xs"
              >
                <option value="">-- Choose Target Program --</option>
                {events.filter((e) => e.status === 'OPEN').map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({new Date(ev.startDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Viewfinder boundary */}
            <div className="w-full h-80 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative flex flex-col items-center justify-center shadow-inner group">
              {/* Corner crosshairs */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-500"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-500"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-500"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-500"></div>
              
              {scannerActive ? (
                <div id="qr-reader-panel" className="w-full h-full object-cover"></div>
              ) : (
                <div className="text-center p-6 text-slate-550 flex flex-col items-center gap-3 z-10">
                  <ScanLine className="w-12 h-12 text-amber-500/80 animate-pulse" />
                  <p className="text-xs font-bold text-slate-300">Scanner is Offline</p>
                  <p className="text-[10px] text-slate-500">Select an event and click Start Scanner</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="w-full flex gap-3 mt-6">
              {scannerActive ? (
                <button
                  onClick={stopScanner}
                  className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 text-xs font-bold rounded-xl transition-all"
                >
                  Turn Scanner Off
                </button>
              ) : (
                <button
                  onClick={startScanner}
                  disabled={!scannerEventId}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <Camera className="w-4 h-4" /> Start Camera Scan
                </button>
              )}
            </div>
          </div>

          {/* Feedback & Manual Input Column */}
          <div className="space-y-6">
            {/* Scan Feedback logs */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Scan Status Feedback</h3>

              {scanResult && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl space-y-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-green-500" /> Check-in Successful!
                  </div>
                  <div className="text-xs space-y-1 mt-2 text-slate-605">
                    <p>Attendee: <strong className="text-slate-900">{scanResult.userName}</strong></p>
                    <p>Event: <span>{scanResult.eventTitle}</span></p>
                    <p>Status: <span className="text-amber-600 font-bold">{scanResult.status}</span></p>
                  </div>
                </div>
              )}

              {scanError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-550 rounded-xl flex items-center gap-1.5 text-xs animate-fade-in">
                  <X className="w-4 h-4 text-red-500" /> {scanError}
                </div>
              )}

              {!scanResult && !scanError && (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  Waiting for a scanned ticket...
                </div>
              )}

              {/* Session Log History List */}
              {sessionLogs.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Live Session Log</h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {sessionLogs.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 animate-fade-in">
                        <span className="font-semibold text-slate-700">{log.name}</span>
                        <div className="flex items-center gap-1.5 text-[8px] text-slate-400">
                          <span className="bg-green-100 text-green-700 px-1 py-0.2 rounded font-extrabold uppercase">{log.status}</span>
                          <span>{log.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Attendee List Grid */}
            {scannerEventId && (
              <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Registrants Registry</h3>
                    <p className="text-[10px] text-slate-500">Quick check-in via search query</p>
                  </div>
                  <input
                    type="text"
                    value={scannerSearchQuery}
                    onChange={(e) => setScannerSearchQuery(e.target.value)}
                    placeholder="Search name..."
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-amber-500 w-36"
                  />
                </div>

                {scannerRecordsLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500 mx-auto" />
                  </div>
                ) : filteredScannerRecords.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">No registrants found</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {filteredScannerRecords.map((rec) => {
                      const isCheckedIn = rec.attendanceStatus === 'PRESENT' || rec.attendanceStatus === 'LATE';
                      return (
                        <div key={rec.id} className="flex justify-between items-center p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl text-xs transition-colors">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{rec.user.fullName}</p>
                            <p className="text-[9px] text-slate-400">{rec.user.memberId || 'Guest ID'} | Headcount: {rec.registration.attendeeCount}</p>
                          </div>

                          <div>
                            {isCheckedIn ? (
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-green-50 text-green-700 border border-green-200">
                                {rec.attendanceStatus}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleScannerCheckIn(rec.registrationId)}
                                className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black rounded-lg transition-all shadow-sm"
                              >
                                Check In
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Manual check-in fallback */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Manual Ticket Check-in</h3>
              <p className="text-slate-500 text-[10px] mb-4">Use this form if the QR reader is unavailable or the pass won't scan</p>

              <form onSubmit={handleManualCheckIn} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-750 uppercase mb-2">Ticket / Registration ID</label>
                  <input
                    type="text"
                    required
                    value={manualRegId}
                    onChange={(e) => setManualRegId(e.target.value)}
                    placeholder="Enter Registration UUID (e.g., e3e0e7a0-...)"
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={manualLoading || !scannerEventId || !manualRegId}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {manualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserCheck className="w-4 h-4 text-indigo-500" /> Log Manual Attendance</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
