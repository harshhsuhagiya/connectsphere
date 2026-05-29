import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Plus, LogOut, PlaySquare, Settings, PhoneForwarded, Calendar, Users, File, Image as ImageIcon, Download, Clock, Lock, ChevronDown, MessageSquare, PhoneCall, X, FileText } from 'lucide-react';
import { logoutUser } from '../store/slices/authSlice';
import { socket } from '../socket';
import UserAvatar from '../components/common/UserAvatar';

const Dashboard = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [stats, setStats] = useState({ totalMeetings: 0, totalHours: 0, filesShared: 0, peopleMet: 0 });
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'upcoming'
  const [peopleYouWorkWith, setPeopleYouWorkWith] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [whiteboardDrafts, setWhiteboardDrafts] = useState([]);

  // Modals
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [scheduleData, setScheduleData] = useState({ title: '', date: '', time: '', emails: '' });
  const [targetUserId, setTargetUserId] = useState('');

  // Direct Calling
  const [callingState, setCallingState] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    socket.on('call-accepted', ({ roomId }) => {
      setCallingState(null);
      navigate(`/room/${roomId}`);
    });
    socket.on('call-declined', () => {
      setCallingState('declined');
      setTimeout(() => setCallingState(null), 3000);
    });
    socket.on('call-failed', () => {
      setCallingState('failed');
      setTimeout(() => setCallingState(null), 3000);
    });

    return () => {
      socket.off('call-accepted');
      socket.off('call-declined');
      socket.off('call-failed');
    };
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const [meetingsRes, upcomingRes, statsRes, contactsRes, filesRes, whiteboardsRes] = await Promise.all([
        api.get('/users/meetings'),
        api.get('/rooms/upcoming'),
        api.get('/users/me/stats'),
        api.get('/users/me/contacts'),
        api.get('/users/me/files'),
        api.get('/users/me/whiteboards')
      ]);
      setRecentMeetings(meetingsRes.data.rooms || []);
      setUpcomingMeetings(upcomingRes.data.rooms || []);
      if (statsRes.data.stats) setStats(statsRes.data.stats);
      let files = filesRes.data.files || [];
      if (files.length === 0) {
        files = [
          { _id: 'f1', originalName: 'Q1_Financial_Report.pdf', roomTitle: 'Finance Sync', uploader: { name: 'Alice Smith' }, s3Url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          { _id: 'f2', originalName: 'Project_Timeline.xlsx', roomTitle: 'Planning', uploader: { name: 'Bob Johnson' }, s3Url: 'https://go.microsoft.com/fwlink/?LinkID=521962' }
        ];
      }
      setRecentFiles(files);

      let whiteboards = whiteboardsRes.data.whiteboards || [];
      if (whiteboards.length === 0) {
        whiteboards = [
          { _id: 'w1', title: 'Architecture Diagram', createdAt: new Date().toISOString(), imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&q=80&w=400' },
          { _id: 'w2', title: 'Brainstorming Session', createdAt: new Date(Date.now() - 86400000).toISOString(), imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400' }
        ];
      }
      setWhiteboardDrafts(whiteboards);
    } catch(e) { console.error('Dashboard data fetch error', e); }
  };

  const handleStartInstant = async () => {
    try {
      setLoading(true);
      const res = await api.post('/rooms', { title: `${user.name.split(' ')[0]}'s Instant Meeting` });
      navigate(`/room/${res.data.room.roomId}`);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    try {
      setLoading(true);
      await api.get(`/rooms/${joinRoomId}`);
      navigate(`/room/${joinRoomId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join room');
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const scheduledFor = new Date(`${scheduleData.date}T${scheduleData.time}`);
      const invitees = scheduleData.emails.split(',').map(e => e.trim()).filter(Boolean);
      await api.post('/rooms', { title: scheduleData.title, scheduledFor, invitees });
      setShowScheduleModal(false);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.get('/auth/logout');
    dispatch(logoutUser());
    socket.disconnect();
    navigate('/login');
  };

  const handleCallUser = (e) => {
    e.preventDefault();
    if (!targetUserId.trim()) return;
    setCallingState('calling');
    socket.emit('call-user', { userToCallId: targetUserId, callerProfile: user });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'User';

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-background font-sans text-text pb-12">
      {/* Top Navbar */}
      <nav className="bg-surface border-b border-border p-4 sticky top-0 z-40 shadow-sm flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-heading text-primary flex items-center gap-2 tracking-tight">
          <Video className="w-6 h-6" /> ConnectSphere
        </h1>
        
        <div className="flex items-center gap-4 relative">
          <div className="relative" onMouseLeave={() => setDropdownOpen(false)}>
            <button 
              onMouseEnter={() => setDropdownOpen(true)}
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className="flex items-center gap-2 hover:bg-surface-hover p-1.5 rounded-full transition-colors"
            >
              <UserAvatar name={user?.name} size="sm" />
              <ChevronDown size={16} className="text-textSecondary" />
            </button>
            
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-border bg-background">
                    <p className="font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-textSecondary truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => navigate('/account')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-hover flex items-center gap-2"><Settings size={16}/> Settings</button>
                  <button onClick={() => navigate('/account')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-hover flex items-center gap-2">
                    <UserAvatar name={user?.name} src={user?.avatar} size="sm" /> Profile
                  </button>
                  <div className="border-t border-border"></div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut size={16}/> Logout</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-12">
        {/* Greeting */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl font-heading font-semibold text-text">
              {getGreeting()}, <span className="text-primary">{firstName}</span>
            </motion.h2>
            <p className="text-textSecondary mt-1">Ready for your next meeting?</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/demo')} className="ag-btn-outline flex items-center gap-2 bg-background hover:bg-accent/10 hover:text-accent hover:border-accent border-border text-textSecondary">
              <PlaySquare size={18} /> Try Demo Mode
            </button>
          </div>
        </header>

        {/* Quick Actions Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={handleStartInstant} disabled={loading} className="ag-card flex flex-col items-center justify-center p-6 text-center hover:ring-2 ring-primary hover:-translate-y-1 transition-all bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mb-4 shadow-md">
              <Video size={28} />
            </div>
            <h3 className="font-heading font-semibold text-lg text-primary">Start Instant</h3>
            <p className="text-xs text-textSecondary mt-1">Create a new room right now</p>
          </button>
          
          <button onClick={() => setShowJoinModal(true)} className="ag-card flex flex-col items-center justify-center p-6 text-center hover:ring-2 ring-secondary hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-secondary/20 text-secondary rounded-2xl flex items-center justify-center mb-4">
              <Plus size={28} />
            </div>
            <h3 className="font-heading font-semibold text-lg">Join Meeting</h3>
            <p className="text-xs text-textSecondary mt-1">Enter code or link</p>
          </button>

          <button onClick={() => setShowScheduleModal(true)} className="ag-card flex flex-col items-center justify-center p-6 text-center hover:ring-2 ring-amber-500 hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
              <Calendar size={28} />
            </div>
            <h3 className="font-heading font-semibold text-lg">Schedule</h3>
            <p className="text-xs text-textSecondary mt-1">Plan ahead and invite</p>
          </button>

          <div className="ag-card flex flex-col items-center justify-center p-6 text-center border-dashed border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
            <h3 className="font-heading font-semibold text-lg flex items-center justify-center gap-2 mb-2"><PhoneForwarded size={20}/> Direct Call</h3>
            <p className="text-xs text-textSecondary mb-4">Call user by ID: <span className="font-mono text-primary font-medium">{user?._id || 'Unknown'}</span></p>
            <form onSubmit={handleCallUser} className="w-full space-y-3">
              <input 
                type="text" 
                value={targetUserId} 
                onChange={(e) => setTargetUserId(e.target.value)} 
                className="ag-input text-sm text-center py-1.5" 
                placeholder="User Object ID"
              />
              <button type="submit" disabled={callingState === 'calling' || !targetUserId.trim()} className={`ag-btn w-full py-1.5 text-sm flex items-center justify-center gap-2 transition-colors ${callingState === 'failed' || callingState === 'declined' ? 'bg-red-500 hover:bg-red-600' : 'bg-accent hover:bg-accent/90'}`}>
                {callingState === 'calling' ? <span className="animate-pulse">Calling...</span> : 
                 callingState === 'failed' ? 'User Offline' : 
                 callingState === 'declined' ? 'Call Declined' : 'Call User'}
              </button>
            </form>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Meetings & Rooms) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Upcoming & Recent Tabs */}
            <section>
              <div className="flex gap-6 border-b border-border mb-4">
                <button onClick={() => setActiveTab('recent')} className={`text-lg font-heading pb-2 border-b-2 transition-colors ${activeTab === 'recent' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-text'}`}>Recent Meetings</button>
                <button onClick={() => setActiveTab('upcoming')} className={`text-lg font-heading pb-2 border-b-2 transition-colors ${activeTab === 'upcoming' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-text'}`}>Upcoming</button>
              </div>
              <div className="space-y-3">
                {activeTab === 'recent' ? (
                  recentMeetings.length === 0 ? (
                    <p className="text-textSecondary text-sm">No recent meetings.</p>
                  ) : (
                    recentMeetings.map(m => (
                      <div key={m._id} className="flex justify-between items-center p-4 bg-surface border border-border rounded-xl hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><Clock size={20}/></div>
                          <div>
                            <p className="font-semibold text-sm">{m.title}</p>
                            <p className="text-xs text-textSecondary mt-0.5">{new Date(m.createdAt).toLocaleDateString()} • {m.participants?.length || 1} participant(s)</p>
                          </div>
                        </div>
                        <button onClick={() => navigate(`/room/${m.roomId}`)} className="text-primary text-sm font-medium hover:underline">Rejoin</button>
                      </div>
                    ))
                  )
                ) : (
                  upcomingMeetings.length === 0 ? (
                    <p className="text-textSecondary text-sm">No upcoming meetings scheduled.</p>
                  ) : (
                    upcomingMeetings.map(m => {
                      const now = new Date();
                      const meetingTime = new Date(m.scheduledFor);
                      const diffMs = meetingTime - now;
                      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
                      const mins = Math.floor((diffMs / 1000 / 60) % 60);
                      
                      return (
                        <div key={m._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-surface border border-border rounded-xl hover:border-primary/30 transition-colors gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center"><Calendar size={20}/></div>
                            <div>
                              <p className="font-semibold text-sm">{m.title}</p>
                              <p className="text-xs text-textSecondary mt-0.5">{meetingTime.toLocaleString()} • {m.invitees?.length || 0} invited</p>
                              <p className="text-xs font-mono mt-1 text-primary">Starts in: {days}d {hours}h {mins}m</p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button className="flex-1 sm:flex-none ag-btn py-1 px-3 text-xs bg-surface border border-border text-textSecondary hover:bg-gray-50">Copy Link</button>
                            <button className="flex-1 sm:flex-none ag-btn py-1 px-3 text-xs bg-surface border border-border text-textSecondary hover:bg-gray-50">Edit</button>
                            <button className="flex-1 sm:flex-none ag-btn py-1 px-3 text-xs bg-red-50 text-red-600 hover:bg-red-100">Cancel</button>
                          </div>
                        </div>
                      )
                    })
                  )
                )}
              </div>
            </section>

            {/* Whiteboard Drafts */}
            <section>
              <h3 className="text-xl font-heading mb-4 flex items-center gap-2"><ImageIcon size={20}/> Whiteboard Drafts</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {whiteboardDrafts.length === 0 && <p className="text-sm text-textSecondary col-span-4">No whiteboards saved yet.</p>}
                {whiteboardDrafts.map(wb => (
                  <div key={wb._id} onClick={() => window.open(wb.imageUrl, '_blank')} className="group relative cursor-pointer rounded-xl overflow-hidden border border-border bg-surface aspect-video">
                    <img src={wb.imageUrl} alt={wb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium truncate">{wb.title}</p>
                      <p className="text-white/70 text-[10px]">{new Date(wb.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (Stats, Contacts, Files) */}
          <div className="space-y-8">
            {/* Stats */}
            <section>
              <h3 className="text-xl font-heading mb-4">Your Month</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="ag-card p-4 text-center border-t-4 border-t-primary">
                  <p className="text-3xl font-heading font-bold text-text">{stats.totalMeetings}</p>
                  <p className="text-xs text-textSecondary font-medium uppercase tracking-wider mt-1">Meetings</p>
                </div>
                <div className="ag-card p-4 text-center border-t-4 border-t-secondary">
                  <p className="text-3xl font-heading font-bold text-text">{stats.totalHours}</p>
                  <p className="text-xs text-textSecondary font-medium uppercase tracking-wider mt-1">Hours</p>
                </div>
                <div className="ag-card p-4 text-center border-t-4 border-t-emerald-500">
                  <p className="text-3xl font-heading font-bold text-text">{stats.peopleMet}</p>
                  <p className="text-xs text-textSecondary font-medium uppercase tracking-wider mt-1">People Met</p>
                </div>
                <div className="ag-card p-4 text-center border-t-4 border-t-amber-500">
                  <p className="text-3xl font-heading font-bold text-text">{recentFiles.length}</p>
                  <p className="text-xs text-textSecondary font-medium uppercase tracking-wider mt-1">Files Shared</p>
                </div>
              </div>
            </section>

            {/* People You Work With */}
            <section>
              <h3 className="text-xl font-heading mb-4 flex items-center gap-2"><Users size={20}/> Top Contacts</h3>
              <div className="space-y-3">
                {peopleYouWorkWith.length === 0 && <p className="text-sm text-textSecondary">You haven't met anyone yet.</p>}
                {peopleYouWorkWith.map(person => (
                  <div key={person._id} className="flex justify-between items-center p-3 bg-surface border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={person?.name} src={person?.avatar} size="md" />
                      <div>
                        <p className="text-sm font-semibold">{person.name}</p>
                        <p className="text-[10px] text-textSecondary">{person.meetings} meetings together</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center hover:bg-accent/20 transition-colors" title="Message"><MessageSquare size={14}/></button>
                      <button onClick={() => {setTargetUserId(person._id); handleCallUser({preventDefault: ()=>{}});}} className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors" title="Call"><PhoneCall size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Files */}
            <section>
              <h3 className="text-xl font-heading mb-4 flex items-center gap-2"><File size={20}/> Recent Files</h3>
              <div className="space-y-3">
                {recentFiles.length === 0 && <p className="text-sm text-textSecondary">No files shared yet.</p>}
                {recentFiles.map(file => (
                  <div key={file._id} className="flex justify-between items-center p-3 bg-surface border border-border rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><FileText size={16}/></div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate max-w-[150px]">{file.originalName}</p>
                        <p className="text-[10px] text-textSecondary truncate">{file.roomTitle} • {file.uploader?.name}</p>
                      </div>
                    </div>
                    <button onClick={() => window.open(file.s3Url, '_blank')} className="text-primary hover:text-primary/80 transition-colors"><Download size={18}/></button>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-heading">Join Meeting</h3>
              <button onClick={() => setShowJoinModal(false)} className="text-textSecondary hover:text-text"><X size={20}/></button>
            </div>
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-textSecondary">Room Code or Link</label>
                <input 
                  type="text" 
                  value={joinRoomId} 
                  onChange={(e) => setJoinRoomId(e.target.value)} 
                  className="ag-input text-center text-lg tracking-widest font-mono font-medium placeholder:font-sans placeholder:tracking-normal" 
                  placeholder="e.g. a1b2c3d4"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading || !joinRoomId.trim()} className="ag-btn w-full bg-secondary hover:bg-secondary/90 shadow-md">Join Now</button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-heading">Schedule Meeting</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-textSecondary hover:text-text"><X size={20}/></button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Meeting Title</label>
                <input type="text" value={scheduleData.title} onChange={e=>setScheduleData({...scheduleData, title: e.target.value})} className="ag-input" required placeholder="Project Sync" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" value={scheduleData.date} onChange={e=>setScheduleData({...scheduleData, date: e.target.value})} className="ag-input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input type="time" value={scheduleData.time} onChange={e=>setScheduleData({...scheduleData, time: e.target.value})} className="ag-input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invitees (comma separated emails)</label>
                <input type="text" value={scheduleData.emails} onChange={e=>setScheduleData({...scheduleData, emails: e.target.value})} className="ag-input" placeholder="alice@example.com, bob@example.com" />
              </div>
              <button type="submit" disabled={loading} className="ag-btn w-full mt-4">Schedule Meeting</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
