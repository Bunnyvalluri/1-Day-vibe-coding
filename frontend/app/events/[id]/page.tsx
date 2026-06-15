'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getUser } from '../../utils/api';
import { 
  Calendar, MapPin, Users, Sparkles, Check, ArrowLeft, 
  Loader2, Clock, ShieldAlert, Tag, HelpCircle
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
  _count: { registrations: number };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [user, setUserState] = useState<any>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking states
  const [bookingType, setBookingType] = useState('INDIVIDUAL');
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    setUserState(getUser());
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest(`/events/${eventId}`);
      setEvent(data.event);
    } catch (err: any) {
      setError(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    
    setBookingLoading(true);
    setBookingError('');
    try {
      await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event?.id,
          registrationType: bookingType,
          attendeeCount,
          notes,
        }),
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setAttendeeCount(1);
        setBookingType('INDIVIDUAL');
        setNotes('');
        fetchEventDetails();
        router.push('/dashboard/member');
      }, 2000);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to complete registration.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-4 p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Event</h2>
        <p className="text-sm text-slate-500 max-w-md">{error || 'The requested event is either in draft or does not exist.'}</p>
        <Link href="/" className="mt-4 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold shadow-sm">
          ← Back to directory
        </Link>
      </div>
    );
  }

  const totalBookings = event._count?.registrations || 0;
  const seatsLeft = Math.max(0, event.capacity - totalBookings);
  const occupancyRate = Math.min(100, Math.round((totalBookings / event.capacity) * 100));
  const isClosed = seatsLeft <= 0 || new Date() > new Date(event.registrationDeadline);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative text-slate-800">
      
      {/* Top Navbar */}
      <nav className="w-full py-4 px-6 md:px-12 flex justify-between items-center border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center font-black text-slate-950 shadow-md">
            G
          </Link>
          <span className="font-extrabold text-xl text-slate-900">
            Grace Community
          </span>
        </div>
        <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
      </nav>

      {/* Event Content */}
      <main className="max-w-6xl mx-auto w-full px-6 py-12 flex-grow grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in">
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> {event.category}
              </span>
              <span className="px-3 py-1 badge-open rounded-full text-xs font-bold">
                Registration Open
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">{event.title}</h1>
          </div>

          {/* Banner mockup */}
          <div className="w-full h-64 md:h-80 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-950 border border-slate-800 overflow-hidden relative flex flex-col justify-end p-8 shadow-md">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.1),transparent_60%)]"></div>
            <div className="absolute bottom-6 right-6 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 text-center min-w-24 shadow-md text-slate-800">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Remaining</p>
              <p className="text-2xl font-black text-indigo-650 mt-0.5" style={{ color: '#4f46e5' }}>{seatsLeft}</p>
              <p className="text-[8px] text-slate-500 font-semibold mt-0.5">Seats left</p>
            </div>
            <div className="relative">
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Featured Fellowship
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-1">Join in Worship & Service</h2>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">About this Event</h3>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <HelpCircle className="w-5 h-5 text-indigo-600" /> Event FAQ
            </h3>
            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-800">Is there any registration fee?</p>
              <p className="text-slate-500 leading-relaxed pl-2 border-l border-slate-200">No, all services and fellowship events organized by Grace Community Church are completely free. Simply register online to reserve your seats.</p>
              
              <p className="font-bold text-slate-800 mt-4">What should I bring to the event?</p>
              <p className="text-slate-500 leading-relaxed pl-2 border-l border-slate-200">We recommend bringing your Bible, notebook, and a heart open to receive. For retreat camps, a Packing Checklist will be sent to your email.</p>
            </div>
          </div>
        </div>

        {/* Right: Schedule details & Book Form */}
        <div className="space-y-6 animate-fade-in">
          
          {/* Scheduling Details Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Event Schedule</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 flex-shrink-0 self-start">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase">Starts</h4>
                  <p className="text-xs text-slate-800 mt-0.5">{new Date(event.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 flex-shrink-0 self-start">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase">Ends</h4>
                  <p className="text-xs text-slate-800 mt-0.5">{new Date(event.endDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 flex-shrink-0 self-start">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase">Location / Venue</h4>
                  <p className="text-xs text-slate-800 mt-0.5">{event.venue}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 bg-red-50 rounded-lg text-red-600 flex-shrink-0 self-start">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase">Registration Deadline</h4>
                  <p className="text-xs text-red-600 mt-0.5">{new Date(event.registrationDeadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Book Your Pass</h3>

            {/* Capacity Progress Bar */}
            <div className="space-y-1 mb-5">
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Total Bookings ({occupancyRate}%)</span>
                <span className="font-bold text-slate-700">{totalBookings} / {event.capacity}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    occupancyRate > 90 ? 'bg-red-500' : occupancyRate > 60 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-200 shadow-sm">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Booking Confirmed!</h4>
                <p className="text-[10px] text-slate-500">Loading your check-in QR code pass...</p>
              </div>
            ) : isClosed ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
                This event is currently fully booked or the registration deadline has passed.
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-650 text-xs rounded-lg">
                    {bookingError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Registration Type</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['INDIVIDUAL', 'FAMILY', 'GROUP'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setBookingType(type);
                          if (type === 'INDIVIDUAL') setAttendeeCount(1);
                        }}
                        className={`py-2 px-1 text-[9px] font-bold border rounded-lg text-center transition-all ${
                          bookingType === type
                            ? 'bg-indigo-650 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                        }`}
                        style={{ backgroundColor: bookingType === type ? '#4f46e5' : undefined }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {bookingType !== 'INDIVIDUAL' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Attendee headcount</label>
                    <input
                      type="number"
                      min={2}
                      max={15}
                      required
                      value={attendeeCount}
                      onChange={(e) => setAttendeeCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Special Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Prayer requests, accessibility needs..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: '#4f46e5' }}
                >
                  {bookingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Reserve My Pass <ArrowLeft className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-slate-200 text-slate-400 text-xs bg-slate-50">
        <p>© 2026 Grace & Fellowship Community Church. All rights reserved.</p>
      </footer>
    </div>
  );
}
