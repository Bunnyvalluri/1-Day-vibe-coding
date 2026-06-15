'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, getUser, logout } from './utils/api';
import { 
  Search, Calendar, MapPin, Users, Sparkles, Filter, Check, LogOut, 
  LayoutDashboard, Loader2, ChevronDown, Mail, 
  ArrowRight, Flame, Compass, Star, HelpingHand, BookOpen
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

export default function LandingPage() {
  const router = useRouter();
  const [user, setUserState] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Registration Modal
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [bookingType, setBookingType] = useState('INDIVIDUAL');
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // FAQ Accordion
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const categories = ['All', 'Worship', 'Youth', 'Prayer Meeting', 'Outreach', 'Retreat', 'Conference', 'Special Service'];

  const stats = [
    { value: '1,200+', label: 'Active Members', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50/40 border-amber-200/50', glow: 'glow-amber', bar: 'bg-amber-500' },
    { value: '15+', label: 'Ministries', icon: Compass, color: 'text-indigo-600', bg: 'bg-indigo-50/40 border-indigo-200/50', glow: 'glow-indigo', bar: 'bg-indigo-500' },
    { value: '80+', label: 'Events Annually', icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50/40 border-pink-200/50', glow: 'glow-pink', bar: 'bg-pink-500' },
    { value: '98%', label: 'Participation Rate', icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-50/40 border-emerald-200/50', glow: 'glow-teal', bar: 'bg-emerald-500' },
  ];

  const ministries = [
    { name: 'Worship Arts', desc: 'Leading the congregation in praise, tech, production, and musical creative expressions.', icon: Flame, color: 'border-amber-200 bg-amber-50/20 text-amber-700 hover:border-amber-400' },
    { name: 'Youth & Young Adults', desc: 'Gathering the next generation for retreats, weekly study cells, and community panels.', icon: Compass, color: 'border-indigo-200 bg-indigo-50/20 text-indigo-700 hover:border-indigo-400' },
    { name: 'Outreach & Missions', desc: 'Feeding local families, sponsoring local drives, and spreading faith in nearby towns.', icon: HelpingHand, color: 'border-pink-200 bg-pink-50/20 text-pink-700 hover:border-pink-400' },
    { name: 'Discipleship & Studies', desc: 'Equipping members through deep theology courses, small home cells, and bible studies.', icon: BookOpen, color: 'border-teal-200 bg-teal-50/20 text-teal-700 hover:border-teal-400' },
  ];

  const testimonials = [
    { quote: "The Youth Summer Camp was a turning point. The registration was seamless and the checks via QR code made boarding the buses stress-free!", name: "Grace Miller", role: "Youth Member" },
    { quote: "Volunteering at the Food Drive was incredibly rewarding. Being able to see seat capacity and get email confirmations kept us all organized.", name: "Caleb Peterson", role: "Outreach Volunteer" },
    { quote: "As a leader, having real-time mobile scanning on my phone meant I could greet members at the door rather than tracking checkins on paper lists.", name: "David Praise", role: "Worship Pastor" },
  ];

  const faqs = [
    { q: "How do I register for an event?", a: "Simply browse our events feed, click 'Reserve Pass', and choose your booking size. If you don't have an account yet, you will be prompted to create a free account to receive your tickets and QR codes." },
    { q: "What is the QR code check-in pass?", a: "Each confirmed registration generates a secure check-in QR code pass. You can display it on your phone from your Member Dashboard at the entrance. Our leaders will scan it to verify and record your attendance." },
    { q: "Can I cancel my booking if my plans change?", a: "Yes, you can cancel your booking directly from your Member Dashboard at any time before the event starts. This instantly frees up capacity for other church members to attend." },
    { q: "Can I register my family members under one booking?", a: "Absolutely! When clicking register, choose 'FAMILY' or 'GROUP' type, and enter the total headcount. You will only need to scan a single QR code at the door for your whole group." }
  ];

  useEffect(() => {
    setUserState(getUser());
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/events');
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
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
          eventId: selectedEvent?.id,
          registrationType: bookingType,
          attendeeCount,
          notes,
        }),
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedEvent(null);
        setAttendeeCount(1);
        setBookingType('INDIVIDUAL');
        setNotes('');
        fetchEvents();
      }, 2000);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to complete registration.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookClick = (event: Event) => {
    if (!user) {
      router.push('/login');
    } else {
      setSelectedEvent(event);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    
    return matchesSearch && matchesCategory && event.status === 'OPEN';
  });

  return (
    <div className="min-h-screen flex flex-col relative text-slate-800 bg-slate-50/30">
      
      {/* Top Navbar */}
      <nav className="w-full py-4.5 px-6 md:px-12 flex justify-between items-center border-b border-slate-200/60 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-650 flex items-center justify-center font-black text-white shadow-md transform hover:rotate-6 transition-transform duration-300">
            G
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">
            Grace Community
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/" className="text-xs text-slate-700 hover:text-indigo-655 font-bold transition-all hidden sm:flex items-center min-h-[44px] px-3 relative py-3.5 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-655 hover:after:w-full after:transition-all after:duration-300">
            Home
          </Link>
          <a href="#events" className="text-xs text-slate-700 hover:text-indigo-655 font-bold transition-all hidden sm:flex items-center min-h-[44px] px-3 relative py-3.5 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-655 hover:after:w-full after:transition-all after:duration-300">
            Explore Events
          </a>
          <a href="#ministries" className="text-xs text-slate-700 hover:text-indigo-655 font-bold transition-all hidden sm:flex items-center min-h-[44px] px-3 relative py-3.5 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-655 hover:after:w-full after:transition-all after:duration-300">
            Ministries
          </a>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={
                  user.role === 'SUPER_ADMIN'
                    ? '/dashboard/superadmin'
                    : user.role === 'ADMIN'
                    ? '/dashboard/admin'
                    : user.role === 'MINISTRY_LEADER'
                    ? '/dashboard/leader'
                    : '/dashboard/member'
                }
                className="py-3 px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:scale-102 min-h-[44px]"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <button
                onClick={logout}
                className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50/20 rounded-xl transition-all w-11 h-11 flex items-center justify-center"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-indigo-655 py-3.5 px-4 transition-colors min-h-[44px] flex items-center">
                Sign In
              </Link>
              <Link href="/register" className="py-3 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md hover:scale-102 min-h-[44px] flex items-center justify-center">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-28 px-6 md:px-12 text-center relative overflow-hidden flex flex-col items-center justify-center border-b border-slate-100 bg-white bg-grid-pattern">
        {/* Decorative background rotating blobs */}
        <div className="absolute top-0 left-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-amber-300/40 via-rose-300/30 to-indigo-400/40 blur-[130px] rounded-full -z-10 animate-spin-slow"></div>
        <div className="absolute top-1/3 right-10 w-[600px] h-[600px] bg-gradient-to-br from-teal-300/30 via-emerald-200/20 to-indigo-300/30 blur-[120px] rounded-full -z-10 animate-spin-slow-reverse"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-100/60 via-orange-100/60 to-indigo-100/60 text-indigo-950 rounded-full border border-indigo-200/50 text-xs font-bold mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Connecting Faith & Fellowship
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold max-w-5xl tracking-tight leading-[1.08] mb-6 text-slate-900">
          Experience Community <br />
          <span className="bg-gradient-to-r from-amber-500 via-rose-500 via-purple-650 to-indigo-650 bg-clip-text text-transparent drop-shadow-sm">
            Through Shared Events
          </span>
        </h1>
        <p className="text-slate-650 max-w-2xl text-base md:text-lg mb-10 leading-relaxed font-semibold">
          Stay plugged into worship, young adult ministries, local outreach projects, retreats, and courses. Discover programs, reserve passes, and check in effortlessly with secure QR tickets.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#events" className="py-4 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/45 hover:scale-103 active:scale-98 transition-all text-xs flex items-center justify-center gap-2 min-h-[44px]">
            Browse Events Directory <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          {!user && (
            <Link href="/register" className="py-4 px-8 bg-white border border-slate-250 hover:border-slate-350 text-slate-800 font-bold rounded-xl transition-all text-xs shadow-sm hover:scale-103 active:scale-98 min-h-[44px] flex items-center justify-center">
              Join Community Portal
            </Link>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div 
                key={i} 
                className={`p-5 rounded-2xl border ${stat.bg} ${stat.glow} transition-all duration-305 hover:-translate-y-1 hover:scale-102.5 flex items-center gap-4 relative overflow-hidden group`}
              >
                {/* Decorative background shape */}
                <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 group-hover:scale-150 transition-all duration-500 ${stat.bar}`}></div>
                
                {/* Icon Box */}
                <div className={`w-12 h-12 flex-shrink-0 rounded-xl ${stat.bar} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>

                <div>
                  <span className={`text-2xl md:text-3xl font-extrabold text-slate-900 block`}>
                    {stat.value}
                  </span>
                  <p className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ministries Section */}
      <section id="ministries" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full border-b border-slate-200/40">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Our Ministries</h2>
          <p className="text-slate-600 text-xs font-bold">Find where you belong and build relationships</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ministries.map((min, idx) => {
            const IconComp = min.icon;
            const minStyles = [
              {
                bg: 'bg-gradient-to-b from-amber-50/40 to-white hover:border-amber-400 hover:shadow-amber-100/50',
                border: 'border-amber-105',
                iconBg: 'bg-amber-100 text-amber-600 border border-amber-200/50',
                glow: 'hover:glow-amber',
                badge: 'Worship'
              },
              {
                bg: 'bg-gradient-to-b from-indigo-50/40 to-white hover:border-indigo-400 hover:shadow-indigo-100/50',
                border: 'border-indigo-105',
                iconBg: 'bg-indigo-100 text-indigo-655 border border-indigo-200/50',
                glow: 'hover:glow-indigo',
                badge: 'Youth'
              },
              {
                bg: 'bg-gradient-to-b from-pink-50/40 to-white hover:border-pink-400 hover:shadow-pink-100/50',
                border: 'border-pink-105',
                iconBg: 'bg-pink-100 text-pink-600 border border-pink-200/50',
                glow: 'hover:glow-pink',
                badge: 'Outreach'
              },
              {
                bg: 'bg-gradient-to-b from-teal-50/40 to-white hover:border-teal-400 hover:shadow-teal-100/50',
                border: 'border-teal-105',
                iconBg: 'bg-teal-100 text-teal-600 border border-teal-200/50',
                glow: 'hover:glow-teal',
                badge: 'Discipleship'
              }
            ];
            const style = minStyles[idx % 4];
            return (
              <div key={idx} className={`p-8 border rounded-2xl transition-all duration-300 hover:-translate-y-1.5 shadow-sm flex flex-col items-start text-left relative overflow-hidden group ${style.bg} ${style.border} ${style.glow}`}>
                {/* Visual decorative line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-indigo-500' : idx === 2 ? 'bg-pink-500' : 'bg-teal-500'}`}></div>
                
                <div className={`p-3.5 rounded-2xl mb-5 group-hover:scale-110 transition-transform duration-300 ${style.iconBg}`}>
                  <IconComp className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-650 transition-colors">{min.name}</h3>
                <p className="text-slate-650 text-xs leading-relaxed mb-4">{min.desc}</p>
                <div className="mt-auto flex items-center gap-1 text-[10px] font-extrabold text-slate-500 group-hover:text-indigo-600 transition-colors min-h-[44px] py-2">
                  <span>Explore Ministry</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Events Explorer Directory */}
      <section id="events" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        
        {/* Explorer Header */}
        <div className="mb-16 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Upcoming Calendar</h2>
            <p className="text-slate-600 text-xs font-bold">Reserve seats and get secure QR check-in passes</p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Search Box */}
            <div className="relative flex-grow sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search programs by keywords..."
                className="w-full pl-9 pr-4 py-2.5 glass-input rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-xs transition-all shadow-sm"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block flex-shrink-0" />
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                let activeClass = 'bg-indigo-650 text-white';
                if (cat === 'Worship') activeClass = 'bg-amber-500 text-slate-950 font-black';
                if (cat === 'Youth' || cat === 'Retreat') activeClass = 'bg-indigo-600 text-white';
                if (cat === 'Outreach') activeClass = 'bg-pink-650 text-white';
                if (cat === 'Prayer Meeting' || cat === 'Conference') activeClass = 'bg-teal-600 text-white';
                
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4.5 py-3 rounded-xl text-[10px] font-bold transition-all duration-300 whitespace-nowrap shadow-sm hover:scale-105 flex items-center justify-center min-h-[44px] ${
                      isActive
                        ? `${activeClass} shadow-md`
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200/70 hover:border-slate-350'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* List renderer */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-xs">Fetching event schedules...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-250 rounded-2xl bg-white shadow-sm">
            <p className="text-slate-750 text-sm mb-1 font-bold">No active events found</p>
            <p className="text-[10px] text-slate-500">Try altering your filters or check back later!</p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const totalBookings = event._count?.registrations || 0;
              const seatsLeft = Math.max(0, event.capacity - totalBookings);
              const occupancyRate = Math.min(100, Math.round((totalBookings / event.capacity) * 100));
              const isClosed = seatsLeft <= 0;

              // Design values based on category
              let categoryStyle = 'bg-slate-105 text-slate-750 border-slate-205';
              let cardHighlight = 'border-slate-205 hover:border-slate-350 bg-white hover:bg-slate-50/30';
              let buttonStyle = 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-indigo-100/50';
              let iconColor = 'text-indigo-500';
              let progColor = 'bg-indigo-600';
              let accentLine = 'bg-indigo-500';
              let glowStyle = 'glow-indigo';

              if (event.category.toLowerCase().includes('worship') || event.category.toLowerCase().includes('service')) {
                categoryStyle = 'bg-amber-50 text-amber-900 border-amber-200/60';
                cardHighlight = 'border-amber-100 hover:border-amber-400 bg-gradient-to-b from-amber-50/10 to-white';
                buttonStyle = 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/10';
                iconColor = 'text-amber-500';
                progColor = 'bg-gradient-to-r from-amber-500 to-orange-500';
                accentLine = 'bg-amber-500';
                glowStyle = 'glow-amber';
              } else if (event.category.toLowerCase().includes('youth') || event.category.toLowerCase().includes('retreat') || event.category.toLowerCase().includes('camp')) {
                categoryStyle = 'bg-indigo-50 text-indigo-900 border-indigo-200/60';
                cardHighlight = 'border-indigo-105 hover:border-indigo-400 bg-gradient-to-b from-indigo-50/10 to-white';
                buttonStyle = 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/15';
                iconColor = 'text-indigo-500';
                progColor = 'bg-gradient-to-r from-indigo-600 to-purple-600';
                accentLine = 'bg-indigo-600';
                glowStyle = 'glow-indigo';
              } else if (event.category.toLowerCase().includes('outreach') || event.category.toLowerCase().includes('mission')) {
                categoryStyle = 'bg-pink-50 text-pink-900 border-pink-200/60';
                cardHighlight = 'border-pink-105 hover:border-pink-400 bg-gradient-to-b from-pink-50/10 to-white';
                buttonStyle = 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-pink-550/15';
                iconColor = 'text-pink-600';
                progColor = 'bg-gradient-to-r from-pink-500 to-rose-500';
                accentLine = 'bg-pink-500';
                glowStyle = 'glow-pink';
              } else if (event.category.toLowerCase().includes('prayer') || event.category.toLowerCase().includes('meeting') || event.category.toLowerCase().includes('study')) {
                categoryStyle = 'bg-teal-50 text-teal-900 border-teal-200/60';
                cardHighlight = 'border-teal-105 hover:border-teal-400 bg-gradient-to-b from-teal-50/10 to-white';
                buttonStyle = 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-600/15';
                iconColor = 'text-teal-600';
                progColor = 'bg-gradient-to-r from-teal-600 to-emerald-600';
                accentLine = 'bg-teal-600';
                glowStyle = 'glow-teal';
              }

              return (
                <div key={event.id} className={`glass-card rounded-2xl p-6 flex flex-col justify-between border transition-all duration-300 relative overflow-hidden ${cardHighlight} ${glowStyle}`}>
                  {/* Category Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentLine}`}></div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${categoryStyle}`}>
                        {event.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider badge-open animate-pulse">
                        Open
                      </span>
                    </div>

                    <Link href={`/events/${event.id}`}>
                      <h3 className="text-lg font-bold text-slate-900 mb-1.5 line-clamp-1 hover:text-indigo-650 transition-colors cursor-pointer">{event.title}</h3>
                    </Link>
                    <p className="text-slate-700 text-xs mb-6 line-clamp-3 leading-relaxed">{event.description}</p>
                  </div>

                  <div>
                    {/* Capacity Visual Progress Bar */}
                    <div className="space-y-1 mb-5">
                      <div className="flex justify-between text-[9px] text-slate-600">
                        <span className="font-semibold">Seat Bookings ({occupancyRate}%)</span>
                        <span className="font-extrabold text-slate-700">{totalBookings} / {event.capacity}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isClosed ? 'bg-slate-400' : progColor
                          }`}
                          style={{ width: `${occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Details block */}
                    <div className="space-y-2.5 mb-5 pt-3 border-t border-slate-100 text-[10px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${iconColor}`} />
                        <span className="font-medium">{new Date(event.startDate).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${iconColor}`} />
                        <span className="line-clamp-1 font-medium">{event.venue}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookClick(event)}
                      disabled={isClosed}
                      className={`w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1 transition-all shadow-md min-h-[44px] ${
                        isClosed
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : `${buttonStyle} hover:scale-102 hover:shadow-lg`
                      }`}
                    >
                      {isClosed ? 'Fully Booked' : 'Reserve Pass'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Testimonials Carousel Section */}
      <section className="py-24 px-6 md:px-12 bg-slate-100/50 border-t border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Community Voices</h2>
            <p className="text-slate-600 text-xs font-bold">How our event registration portal enhances fellowship</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test, index) => {
              const testimonialStyles = [
                {
                  accent: 'bg-amber-500',
                  bg: 'bg-gradient-to-b from-amber-50/30 to-white hover:border-amber-400',
                  border: 'border-amber-100',
                  stars: 'text-amber-500',
                  avatar: 'bg-amber-100 text-amber-800 border-amber-200/60',
                  glow: 'glow-amber'
                },
                {
                  accent: 'bg-indigo-500',
                  bg: 'bg-gradient-to-b from-indigo-50/30 to-white hover:border-indigo-400',
                  border: 'border-indigo-100',
                  stars: 'text-indigo-500',
                  avatar: 'bg-indigo-100 text-indigo-805 border-indigo-200/60',
                  glow: 'glow-indigo'
                },
                {
                  accent: 'bg-pink-500',
                  bg: 'bg-gradient-to-b from-pink-50/30 to-white hover:border-pink-400',
                  border: 'border-pink-100',
                  stars: 'text-pink-500',
                  avatar: 'bg-pink-100 text-pink-850 border-pink-200/60',
                  glow: 'glow-pink'
                }
              ];
              const style = testimonialStyles[index % 3];
              return (
                <div key={index} className={`p-8 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${style.bg} ${style.border} ${style.glow}`}>
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${style.accent}`}></div>
                  <div>
                    <div className={`flex gap-1 ${style.stars} mb-4`}>
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" aria-hidden="true" />)}
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed italic">"{test.quote}"</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${style.avatar}`}>
                      {test.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{test.name}</div>
                      <p className="text-[10px] text-slate-600">{test.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Common Questions</h2>
          <p className="text-slate-600 text-xs font-bold">Need help? Here are the most frequently asked questions</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${faqOpen === i ? 'border-indigo-400 bg-indigo-50/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full p-5 flex justify-between items-center text-left transition-all font-bold relative min-h-[44px]"
              >
                {faqOpen === i && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-600" aria-hidden="true"></div>
                )}
                <span className="text-sm font-bold text-slate-800 pr-4">{faq.q}</span>
                <ChevronDown className={`w-4.5 h-4.5 text-slate-500 transition-transform duration-300 flex-shrink-0 ${faqOpen === i ? 'rotate-180 text-indigo-500' : ''}`} />
              </button>
              {faqOpen === i && (
                <div className="px-5 pb-5 text-xs text-slate-650 leading-relaxed border-t border-slate-100/60 pt-3 bg-indigo-50/10 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 px-6 md:px-12 max-w-4xl mx-auto w-full mb-16">
        <div className="p-10 md:p-12 rounded-3xl text-center relative overflow-hidden flex flex-col items-center justify-center shadow-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white border border-indigo-900/60 shadow-indigo-950/20">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl opacity-60"></div>
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl opacity-60"></div>

          <Mail className="w-8 h-8 text-amber-400 mb-4 animate-bounce" aria-hidden="true" />
          <h3 className="text-xl font-bold text-white mb-2">Subscribe to Announcements</h3>
          <p className="text-indigo-200 text-xs mb-6 max-w-md">Stay up to date with new event announcements, emergency venue updates, and community opportunities.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md z-10">
            <input
              type="email"
              placeholder="Enter your email address..."
              aria-label="Email Address for newsletter"
              className="flex-grow px-4 py-3 bg-white/10 border border-white/20 focus:border-white focus:ring-1 focus:ring-white rounded-xl text-white placeholder-indigo-300 text-xs shadow-inner focus:outline-none transition-all min-h-[44px]"
            />
            <button 
              className="py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-102 min-h-[44px]"
            >
              Subscribe <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Booking Form Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl p-6 relative text-slate-800">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Event Registration</h3>
            <p className="text-slate-600 text-xs mb-6">
              Confirm your registration details for <strong className="text-indigo-650">{selectedEvent.title}</strong>
            </p>

            {bookingSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Booking Confirmed!</h4>
                <p className="text-xs text-slate-500">Your ticket has been generated. Redirecting dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-650 text-xs rounded-lg">
                    {bookingError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Registration Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['INDIVIDUAL', 'FAMILY', 'GROUP'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setBookingType(type);
                          if (type === 'INDIVIDUAL') setAttendeeCount(1);
                        }}
                        className={`py-3 px-2 text-[10px] font-semibold border rounded-xl text-center transition-all flex items-center justify-center min-h-[44px] ${
                          bookingType === type
                            ? 'bg-indigo-655 text-white border-indigo-655 font-bold shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-105'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {bookingType !== 'INDIVIDUAL' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Number of Attendees</label>
                    <input
                      type="number"
                      min={2}
                      max={15}
                      required
                      value={attendeeCount}
                      onChange={(e) => setAttendeeCount(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-xs min-h-[44px]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Special Requests / Prayer Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., Prayer requests, allergy warnings, seat placement preferences"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-xs resize-none min-h-[44px]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1 min-h-[44px]"
                  >
                    {bookingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-10 text-center border-t border-slate-200 text-slate-605 text-xs mt-auto bg-slate-50">
        <p>© 2026 Grace & Fellowship Community Church. All rights reserved.</p>
        <p className="mt-1.5 text-slate-500">Powered by Next.js, Express.js, & Neon PostgreSQL</p>
      </footer>
    </div>
  );
}
