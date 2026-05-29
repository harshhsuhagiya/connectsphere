import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setAuth, logoutUser } from '../store/slices/authSlice';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Palette, Bell, Blocks, AlertTriangle, Camera, CheckCircle, Smartphone, Globe, Monitor, Clock, XCircle, Moon, Sun, Check, Lock, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/common/UserAvatar';

const timezones = Intl.supportedValuesOf('timeZone');

const getPasswordStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length > 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const Account = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: user?.language || 'English'
  });

  // Security Form
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [sessions, setSessions] = useState([]);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);



  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get('/users/me/sessions');
      setSessions(res.data.sessions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/rooms/profile-upload/files/presigned-url`, { params: { filename: file.name, fileType: file.type } });
      await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      const res = await api.put('/users/profile', { avatar: data.s3Url });
      dispatch(setAuth(res.data.user));
      showToast('Profile photo updated!');
    } catch (err) {
      showToast('Failed to upload photo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/users/profile', profileData);
      dispatch(setAuth(res.data.user));
      showToast('Profile updated successfully!');
    } catch(err) {
      showToast('Profile update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }
    try {
      await api.put('/users/password', passwords);
      showToast('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch(err) {
      showToast(err.response?.data?.message || 'Password update failed', 'error');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.delete(`/users/me/sessions/${sessionId}`);
      fetchSessions();
      showToast('Session revoked');
    } catch(err) {
      showToast('Failed to revoke session', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== user?.email) {
      return showToast('Email does not match', 'error');
    }
    try {
      await api.delete('/users/me');
      dispatch(logoutUser());
      navigate('/login');
    } catch(err) {
      showToast('Failed to delete account', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (e) {}
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleUpdateNotifications = async (key, value) => {
    const newNotifs = { ...notifications, [key]: value };
    setNotifications(newNotifs);
    try {
      const res = await api.patch('/users/me/notifications', newNotifs);
      dispatch(setAuth(res.data.user));
      showToast('Notification preferences saved');
    } catch (err) {
      setNotifications(notifications); // revert
      showToast('Failed to update', 'error');
    }
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'logout', icon: LogOut, label: 'Logout', color: 'text-red-500 hover:bg-red-50' }
  ];

  return (
    <div className="min-h-screen bg-background text-text flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface p-6 flex flex-col h-screen sticky top-0 overflow-y-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-textSecondary hover:text-primary transition-colors mb-8 text-sm font-medium">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h2 className="text-xl font-heading mb-6 pl-2">Account Settings</h2>
        <nav className="flex-1 space-y-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'logout') {
                    handleLogout();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : `text-textSecondary hover:bg-surface-hover ${tab.color || 'hover:text-text'}`
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary' : ''} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-3xl mx-auto pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-heading mb-1">Profile</h3>
                    <p className="text-textSecondary text-sm">Manage your personal information.</p>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-4 p-8 bg-surface border border-border rounded-xl">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                      <UserAvatar name={user?.name} src={user?.avatar} size="xl" className="shadow-md group-hover:opacity-75 transition-opacity" />
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                        <Camera className="text-white w-1/3 h-1/3 drop-shadow-md" />
                      </div>
                      <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </div>
                    <div className="text-center">
                      <input 
                        type="text" 
                        value={profileData.name} 
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                        onBlur={handleUpdateProfile}
                        className="text-2xl font-heading text-center bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors px-2 py-1 max-w-[200px]"
                        placeholder="Your Name"
                      />
                      <p className="flex items-center justify-center gap-2 text-textSecondary mt-2">
                        {user?.email} <CheckCircle size={14} className="text-green-500" title="Verified Email"/>
                      </p>
                      <p className="text-xs text-textSecondary mt-1">Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">Bio</label>
                      <textarea 
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value.substring(0, 160)})}
                        className="ag-input min-h-[100px] resize-none"
                        placeholder="Tell us a little about yourself"
                      />
                      <p className="text-xs text-textSecondary text-right mt-1">{profileData.bio.length} / 160</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <input type="text" value={profileData.location} onChange={(e) => setProfileData({...profileData, location: e.target.value})} className="ag-input" placeholder="e.g. San Francisco, CA" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Personal Website</label>
                        <input type="url" value={profileData.website} onChange={(e) => setProfileData({...profileData, website: e.target.value})} className="ag-input" placeholder="https://" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Timezone</label>
                        <select value={profileData.timezone} onChange={(e) => setProfileData({...profileData, timezone: e.target.value})} className="ag-input">
                          {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Language</label>
                        <select value={profileData.language} onChange={(e) => setProfileData({...profileData, language: e.target.value})} className="ag-input">
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                        </select>
                      </div>
                    </div>
                    
                    <button type="submit" disabled={loading} className="ag-btn">Save Changes</button>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-heading mb-1">Security</h3>
                    <p className="text-textSecondary text-sm">Keep your account secure.</p>
                  </div>

                  {!user?.googleId && (
                    <div className="ag-card space-y-4">
                      <h4 className="font-medium flex items-center gap-2"><Lock size={18}/> Change Password</h4>
                      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <input type="password" placeholder="Current Password" required value={passwords.currentPassword} onChange={(e)=>setPasswords({...passwords, currentPassword: e.target.value})} className="ag-input" />
                        <div>
                          <input type="password" placeholder="New Password" required minLength="6" value={passwords.newPassword} onChange={(e)=>setPasswords({...passwords, newPassword: e.target.value})} className="ag-input" />
                          {passwords.newPassword && (
                            <div className="flex gap-1 mt-2">
                              {[1,2,3,4].map(n => (
                                <div key={n} className={`h-1 flex-1 rounded-full ${n <= getPasswordStrength(passwords.newPassword) ? (getPasswordStrength(passwords.newPassword) > 2 ? 'bg-green-500' : 'bg-yellow-500') : 'bg-border'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        <input type="password" placeholder="Confirm Password" required minLength="6" value={passwords.confirmPassword} onChange={(e)=>setPasswords({...passwords, confirmPassword: e.target.value})} className="ag-input" />
                        <button type="submit" className="ag-btn">Update Password</button>
                      </form>
                    </div>
                  )}

                  <div className="ag-card flex justify-between items-center">
                    <div>
                      <h4 className="font-medium mb-1">Two-Factor Authentication</h4>
                      <p className="text-sm text-textSecondary">Add an extra layer of security to your account.</p>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">Coming Soon</span>
                  </div>

                  <div className="ag-card space-y-4">
                    <h4 className="font-medium">Active Sessions & Login History</h4>
                    <div className="space-y-3">
                      {sessions.length === 0 ? (
                        <p className="text-textSecondary text-sm">No active sessions found.</p>
                      ) : (
                        sessions.map((session, i) => (
                          <div key={session.id || i} className="flex justify-between items-center p-4 border border-border rounded-lg bg-background">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-textSecondary">
                                {session.device === 'Mobile' ? <Smartphone size={20}/> : <Monitor size={20}/>}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{session.browser} on {session.device}</p>
                                <p className="text-xs text-textSecondary flex items-center gap-2 mt-1">
                                  <Globe size={12}/> {session.location} • {session.ip}
                                </p>
                                <p className="text-xs text-textSecondary flex items-center gap-2 mt-1">
                                  <Clock size={12}/> Last active: {new Date(session.lastActive).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => handleRevokeSession(session.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors text-sm font-medium">Revoke</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}


            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">Delete Account</h3>
              <button onClick={() => setShowDeleteModal(false)}><XCircle className="text-textSecondary hover:text-text" /></button>
            </div>
            <p className="text-sm text-textSecondary mb-4">
              This action is <span className="font-bold text-text">permanent</span>. To confirm, type your email address (<b>{user?.email}</b>) below.
            </p>
            <input 
              type="text" 
              value={deleteEmail} 
              onChange={(e) => setDeleteEmail(e.target.value)} 
              className="ag-input mb-6" 
              placeholder={user?.email}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="ag-btn-outline flex-1">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleteEmail !== user?.email} className="ag-btn bg-red-600 hover:bg-red-700 text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Account;
