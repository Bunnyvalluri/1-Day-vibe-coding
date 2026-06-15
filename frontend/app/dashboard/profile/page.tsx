'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest, getUser, setUser, setToken } from '../../utils/api';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Camera,
  IdCard,
  Building2,
  Calendar,
  AlertCircle,
  Save,
  KeyRound,
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUserState] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    const currentUser = getUser();
    setUserState(currentUser);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/auth/me');
      const u = data.user;
      setProfileData(u);
      setFullName(u.fullName);
      setPhone(u.phone || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const data = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, phone }),
      });
      // Refresh local auth state with fresh token + user data
      setToken(data.token);
      setUser(data.user);
      setUserState(data.user);
      setProfileData(data.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    setPwdLoading(true);
    setPwdSuccess(false);
    try {
      const data = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, phone, currentPassword, newPassword }),
      });
      setToken(data.token);
      setUser(data.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdSuccess(true);
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err: any) {
      setPwdError(err.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'from-teal-500 to-emerald-600';
      case 'ADMIN': return 'from-pink-500 to-rose-600';
      case 'MINISTRY_LEADER': return 'from-amber-500 to-orange-500';
      default: return 'from-indigo-500 to-purple-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrator';
      case 'ADMIN': return 'System Administrator';
      case 'MINISTRY_LEADER': return 'Ministry Leader';
      default: return 'Community Member';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-teal-50 text-teal-700 border-teal-200/50';
      case 'ADMIN': return 'bg-pink-50 text-pink-700 border-pink-200/50';
      case 'MINISTRY_LEADER': return 'bg-amber-50 text-amber-700 border-amber-200/50';
      default: return 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs">Loading your profile...</p>
      </div>
    );
  }

  const u = profileData || user;
  const initials = u?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-xs mt-1">Manage your personal information, contact details, and account security</p>
      </div>

      {/* Identity Card */}
      <div className={`relative rounded-2xl p-6 bg-gradient-to-br ${getRoleColor(u?.role)} overflow-hidden shadow-lg`}>
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 backdrop-blur flex items-center justify-center font-black text-2xl text-white shadow-inner">
              {initials}
            </div>
          </div>

          {/* Info */}
          <div className="flex-grow">
            <h2 className="text-2xl font-extrabold text-white">{u?.fullName}</h2>
            <p className="text-white/70 text-xs mt-0.5">{u?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border bg-white/20 text-white border-white/20`}>
                {getRoleLabel(u?.role)}
              </span>
              {u?.ministry?.name && (
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-white/20 text-white border border-white/20">
                  {u.ministry.name}
                </span>
              )}
            </div>
          </div>

          {/* Member ID */}
          <div className="bg-white/15 border border-white/20 backdrop-blur rounded-xl px-4 py-3 text-center">
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Member ID</p>
            <p className="text-lg font-black text-white font-mono mt-0.5">{u?.memberId || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Personal Information Form */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" /> Personal Information
          </h2>
          
          <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-5">
            {saveSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4" /> Profile updated successfully!
              </div>
            )}
            {saveError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4" /> {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address <span className="text-slate-400 font-normal normal-case">(cannot be changed)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={u?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Phone Number <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555 000 0000"
                    className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {saveLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Read-only Account Details Card */}
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pt-2">
            <IdCard className="w-5 h-5 text-amber-500" /> Account Details
          </h2>
          <div className="glass-panel rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <IdCard className="w-4 h-4 text-amber-500" />
                <span>Member ID</span>
              </div>
              <span className="text-xs font-black font-mono text-slate-900">{u?.memberId || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <Shield className="w-4 h-4 text-pink-500" />
                <span>System Role</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getRoleBadgeClass(u?.role)}`}>
                {u?.role?.replace(/_/g, ' ')}
              </span>
            </div>

            {u?.ministry?.name && (
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-xs text-slate-500">
                  <Building2 className="w-4 h-4 text-teal-500" />
                  <span>Ministry</span>
                </div>
                <span className="text-xs font-bold text-slate-700">{u.ministry.name}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Member Since</span>
              </div>
              <span className="text-xs font-bold text-slate-700">
                {u?.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Security / Password Change */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-500" /> Security Settings
          </h2>
          
          <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 p-3.5 bg-amber-50/50 border border-amber-200/40 rounded-xl">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Change Password</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Enter your current password to set a new one</p>
              </div>
            </div>

            {pwdSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4" /> Password changed successfully!
              </div>
            )}
            {pwdError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4" /> {pwdError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              
              {/* Current Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-3 glass-input rounded-xl text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-3 glass-input rounded-xl text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength bar */}
                {newPassword.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => {
                        const strength = newPassword.length < 6 ? 1 : newPassword.length < 8 ? 2 : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3;
                        return (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              level <= strength
                                ? strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : strength === 3 ? 'bg-blue-400' : 'bg-green-500'
                                : 'bg-slate-200'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-slate-500">
                      {newPassword.length < 6 ? 'Too short' : newPassword.length < 8 ? 'Weak' : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'Strong' : 'Good'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Shield className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={`w-full pl-10 pr-10 py-3 glass-input rounded-xl text-sm focus:outline-none transition-all ${
                      confirmPassword.length > 0 && confirmPassword !== newPassword
                        ? 'border-red-300 focus:border-red-400'
                        : confirmPassword.length > 0 && confirmPassword === newPassword
                        ? 'border-green-300 focus:border-green-400'
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword === newPassword && (
                  <p className="text-[9px] text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="text-[9px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={pwdLoading || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwdLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" /> Update Password
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security Tips */}
          <div className="glass-panel rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-500" /> Security Tips
            </h3>
            <ul className="space-y-2.5">
              {[
                'Use a unique password not used on other sites.',
                'Combine uppercase, lowercase, numbers and symbols.',
                'Never share your login credentials with others.',
                'Sign out from shared or public devices after use.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px] text-slate-600">
                  <span className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 font-black text-[7px]">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
