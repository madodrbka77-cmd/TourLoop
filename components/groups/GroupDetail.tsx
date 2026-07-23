import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowRight, ArrowLeft, Camera, Globe, Lock, Plus, Check, ChevronDown, 
  LogOut, UserPlus, MoreHorizontal, PinOff, Pin, BellOff, Bell, Link as LinkIcon, 
  Edit3, Trash2, Flag, Grid, Info, Users, Image as ImageIcon, Video, FileText, 
  Shield, BarChart3, Calendar, UserCog, MessageCircle, Play, Upload, Clock,
  Search, Download, CheckCircle, MapPin
} from 'lucide-react';
import { Group, GroupFile, GroupEvent } from '../../data/groupsData';
import { Post, User, GroupPageTab } from '../../types';
import CreatePost from '../CreatePost';
import PostCard from '../PostCard';
import { useLanguage } from '../../context/LanguageContext';
import GroupAdminDashboard from './GroupAdminDashboard';
import { CreateGroupEventModal } from './GroupModals';
import { playAudio } from '../../utils/audio';

interface GroupDetailProps {
  viewingGroup: Group;
  currentUser: User;
  groupPosts: Post[];
  activeGroupTab: GroupPageTab;
  setActiveGroupTab: (tab: GroupPageTab) => void;
  onBack: () => void;
  onJoin: (id: string, e?: React.MouseEvent) => void;
  onLeave: (id: string) => void;
  onMenuAction: (action: any, id: string) => void;
  onCoverChangeMain: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreatePost: (content: string, image?: string) => void;
  onPostTogglePin: (postId: string) => void;
  onPostDelete: (postId: string) => void;
  onPostLike: (postId: string) => void;
  onPostSave: (post: Post) => void;
  onPostCopyLink: (link: string) => void;
  onMediaClick: (url: string, type: 'image' | 'video', postId?: string) => void;
  onMediaUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditGroup: () => void;
  onInviteClick: () => void;
  onManageMembers: () => void;
  onRemoveMember: (id: string) => void;
  onPostComment?: (postId: string, text: string) => void;
  onDeletePostComment?: (postId: string, commentId: string) => void;
  onLikePostComment?: (postId: string, commentId: string) => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({
  viewingGroup, currentUser, groupPosts, activeGroupTab, setActiveGroupTab,
  onBack, onJoin, onLeave, onMenuAction, onCoverChangeMain,
  onCreatePost, onPostTogglePin, onPostDelete, onPostLike, onPostSave, onPostCopyLink,
  onMediaClick, onMediaUpload, onEditGroup, onInviteClick, onManageMembers, onRemoveMember,
  onPostComment, onDeletePostComment, onLikePostComment
}) => {
  const { t, dir } = useLanguage();
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showJoinedMenu, setShowJoinedMenu] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  
  // --- Admin Dashboard State --- 
  const [adminRequests, setAdminRequests] = useState([
      { id: 'req1', name: 'سارة خالد', avatar: 'https://picsum.photos/50/50?random=101', time: 'منذ ساعتين' },
      { id: 'req2', name: 'كريم محمود', avatar: 'https://picsum.photos/50/50?random=102', time: 'منذ 5 ساعات' },
      { id: 'req3', name: 'مستخدم جديد', avatar: 'https://picsum.photos/50/50?random=103', time: 'منذ يوم' }
  ]);

  const [adminReports, setAdminReports] = useState([
      { id: 'rep1', type: 'spam', content: 'منشور مخالف للقواعد', reporter: 'أحمد علي', status: 'pending' },
      { id: 'rep2', type: 'abuse', content: 'تعليق غير لائق', reporter: 'منى زكي', status: 'pending' }
  ]);

  const [adminLogs, setAdminLogs] = useState([
      { id: 'log1', action: t.groups_change_cover || 'Change Cover', admin: t.privacy_only_me, time: '1h' },
      { id: 'log2', action: t.groups_remove_member || 'Remove Member', admin: t.privacy_only_me, time: '2d' }
  ]);

  // Files & Events State
  const [localFiles, setLocalFiles] = useState<GroupFile[]>(viewingGroup.files || []);
  const [localEvents, setLocalEvents] = useState<(GroupEvent & { isInterested?: boolean })[]>(
    (viewingGroup.events || []).map(ev => ({ ...ev, isInterested: false }))
  );
  const [showEventModal, setShowEventModal] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Admin Settings State
  const [requirePostApproval, setRequirePostApproval] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState(true);

  // Notification for local actions
  const [localNotification, setLocalNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);

  const headerMenuRef = useRef<HTMLDivElement>(null);
  const joinedMenuRef = useRef<HTMLDivElement>(null);
  const groupCoverInputMainRef = useRef<HTMLInputElement>(null);
  const mediaUploadInputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  // Derived Media for Group Tabs
  const groupPhotos = useMemo(() => groupPosts.filter(p => p.image && !p.image.startsWith('data:video') && !p.image.endsWith('.mp4')), [groupPosts]);
  const groupVideos = useMemo(() => groupPosts.filter(p => p.image && (p.image.startsWith('data:video') || p.image.endsWith('.mp4'))), [groupPosts]);

  // Filter posts based on in-group search
  const filteredPosts = useMemo(() => {
      if (!groupSearchTerm.trim()) return groupPosts;
      return groupPosts.filter(p => p.content.toLowerCase().includes(groupSearchTerm.toLowerCase()));
  }, [groupPosts, groupSearchTerm]);

  // --- Theme Helper ---
  const getThemeClasses = (element: 'text' | 'bg' | 'border' | 'lightBg' | 'tab' | 'badge') => {
    const color = viewingGroup.themeColor || 'emerald';
    switch(color) {
        case 'emerald': return {
            text: 'text-emerald-700 dark:text-emerald-400',
            bg: 'bg-emerald-700 hover:bg-blue-700',
            border: 'border-emerald-700 dark:border-emerald-400',
            lightBg: 'bg-green-50 dark:bg-green-900/20',
            tab: 'border-green-700 dark:border-green-500 text-green-700 dark:text-emerald-400 bg-green-50/50 dark:bg-green-900/10',
            badge: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
        }[element];
        case 'purple': return {
            text: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-600 hover:bg-blue-700',
            border: 'border-purple-600 dark:border-purple-400',
            lightBg: 'bg-purple-50 dark:bg-purple-900/20',
            tab: 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10',
            badge: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
        }[element];
        case 'red': return {
            text: 'text-red-600 dark:text-red-500',
            bg: 'bg-red-600 hover:bg-blue-700',
            border: 'border-red-600 dark:border-red 500',
            lightBg: 'bg-red-50 dark:bg-red-900/20',
            tab: 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-500 bg-red-50/50 dark:bg-red-900/10',
            badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500'
        }[element];
        case 'orange': return {
            text: 'text-orange-700 dark:text-orange-500',
            bg: 'bg-orange-600 hover:bg-blue-700',
            border: 'border-orange-600 dark:border-orange-500',
            lightBg: 'bg-orange-50 dark:bg-orange-900/20',
            tab: 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-500 bg-orange-50/50 dark:bg-orange-900/10',
            badge: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-500'
        }[element];
       case 'blue': 
       default: return {
            text: 'text-blue-700 dark:text-blue-500',
            bg: 'bg-blue-600 hover:bg-blue-700',
            border: 'border-blue-600 dark:border-blue-500',
            lightBg: 'bg-blue-50 dark:bg-blue-900/20',
            tab: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
            badge: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500'
        }[element];
    }
  };

  useEffect(() => {
    setLocalFiles(viewingGroup.files || []);
    setLocalEvents((viewingGroup.events || []).map(ev => ({ ...ev, isInterested: false })));
  }, [viewingGroup]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setShowHeaderMenu(false);
      }
      if (joinedMenuRef.current && !joinedMenuRef.current.contains(event.target as Node)) {
        setShowJoinedMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showLocalNotification = (msg: string, type: 'success' | 'info' = 'success') => {
      if(type === 'success') playAudio('notification');
      setLocalNotification({ msg, type });
      setTimeout(() => setLocalNotification(null), 3000);
  };

  // --- Admin Actions --- 
  const handleApproveRequest = (reqId: string, name: string) => {
      setAdminRequests(prev => prev.filter(r => r.id !== reqId));
      setAdminLogs(prev => [{ id: `log_${Date.now()}`, action: `${t.groups_approve} ${name}`, admin: t.privacy_only_me, time: t.date_now }, ...prev]);
      showLocalNotification(`${t.groups_approve} ${name}`, 'success');
  };

  const handleRejectRequest = (reqId: string, name: string) => {
      setAdminRequests(prev => prev.filter(r => r.id !== reqId));
      setAdminLogs(prev => [{ id: `log_${Date.now()}`, action: `${t.groups_reject} ${name}`, admin: t.privacy_only_me, time: t.date_now }, ...prev]);
      showLocalNotification(`${t.groups_reject} ${name}`, 'info');
  };

  const handleResolveReport = (repId: string, action: 'keep' | 'delete') => {
      setAdminReports(prev => prev.filter(r => r.id !== repId));
      const actionText = action === 'keep' ? t.groups_keep_content : t.groups_delete_content;
      setAdminLogs(prev => [{ id: `log_${Date.now()}`, action: actionText, admin: t.privacy_only_me, time: t.date_now }, ...prev]);
      showLocalNotification(action === 'keep' ? t.common_done : t.common_success, 'success');
  };

  const handleLogAction = (action: string) => {
      setAdminLogs(prev => [{ id: `log_${Date.now()}`, action, admin: t.privacy_only_me, time: t.date_now }, ...prev]);
  };

  const getBadgeColor = (badge: string) => {
      switch(badge) {
          case 'Admin': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
          case 'Moderator': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
          case 'Top Contributor': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
          default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const newFile: GroupFile = {
          id: `file_${Date.now()}`,
          name: file.name,
          type: file.name.split('.').pop() as any || 'doc',
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          uploadedBy: currentUser.name,
          date: new Date().toISOString().split('T')[0],
          url: URL.createObjectURL(file)
      };

      setLocalFiles(prev => [newFile, ...prev]);
      playAudio('upload_start');
      showLocalNotification(t.common_success);
      e.target.value = '';
  };

  const handleFileDownload = (file: GroupFile) => {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      playAudio('notification');
      showLocalNotification(`${t.common_download} ${file.name}...`);
  };

  const handleCreateEvent = (eventData: any) => {
      setIsCreatingEvent(true);
      setTimeout(() => {
          const newEvent: GroupEvent & { isInterested: boolean } = {
              id: `ge_${Date.now()}`,
              title: eventData.title,
              date: eventData.date,
              location: eventData.location,
              description: eventData.description,
              attendees: 1,
              isInterested: true
          };
          setLocalEvents(prev => [newEvent, ...prev]);
          playAudio('post_success');
          showLocalNotification(t.common_success);
          setIsCreatingEvent(false);
          setShowEventModal(false);
      }, 1000);
  };

  const toggleEventInterest = (eventId: string) => {
      setLocalEvents(prev => prev.map(ev => {
          if(ev.id === eventId) {
             const newInterest = !ev.isInterested;
             if (newInterest) {
                 playAudio('like');
                 showLocalNotification(t.groups_interested, 'success');
             } else {
                 showLocalNotification(t.common_cancel, 'info');
             }
             return { ...ev, isInterested: newInterest, attendees: ev.attendees + (newInterest ? 1 : -1) };
          }
          return ev;
      }));
  }

  return (
    <div className="animate-fadeIn relative pb-10">
        {localNotification && (
             <div className="fixed bottom-20 md:bottom-10 right-4 md:right-10 z-[200] bg-gray-900 dark:bg-gray-700 text-white px-5 py-3 rounded-lg shadow-xl animate-bounce-in flex items-center gap-3 backdrop-blur-md border border-white/10">
                 <CheckCircle className="w-5 h-5 text-green-400" />
                 <span className="font-bold text-sm">{localNotification.msg}</span>
             </div>
        )}

        <input 
          type="file" 
          ref={mediaUploadInputRef} 
          className="hidden" 
          accept="image/*,video/*"
          onChange={onMediaUpload} 
        />

        {/* Back Button */}
        <div className="mb-4 px-2 md:px-0">
            <button 
              onClick={onBack} 
          className="flex items-center gap-2 text-black hover:text-blue-700 dark:text-green-500 hover:text-blue-700 dark:hover:text-blue-700 px-3 py-2 rounded-lg transition font-bold text-sm"
            >
                {dir === 'rtl' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                {t.common_back} {t.nav_groups}
            </button>
        </div>

        {/* Cover Image */}
        <div className="w-full h-48 sm:h-64 md:h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl overflow-hidden relative group shadow-md border border-gray-100 dark:border-gray-700">
            <img 
              key={viewingGroup.coverUrl}
              src={viewingGroup.coverUrl} 
              alt={viewingGroup.name} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            {/* Direct Cover Edit Button */}
            {viewingGroup.role === 'admin' && (
                <>
                  <button 
                      onClick={() => groupCoverInputMainRef.current?.click()}
                      className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 left-auto bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm flex items-center gap-2 transition z-10 backdrop-blur-sm border border-gray-200 dark:border-gray-600"
                  >
                      <Camera className="w-4 h-4" />
                      {t.groups_change_cover}
                  </button>
                  <input type="file" ref={groupCoverInputMainRef} className="hidden" accept="image/*" onChange={onCoverChangeMain} />
                </>
            )}
        </div>

        {/* Group Info Header */}
        <div className="mt-6 mb-4 px-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">{viewingGroup.name}</h1>
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm font-medium">
                        <div className="flex items-center gap-1">
                            {viewingGroup.privacy === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            <span>{viewingGroup.privacy === 'public' ? t.groups_public_group : t.groups_private_group}</span>
                        </div>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        <span className="font-bold text-gray-900 dark:text-white">{viewingGroup.membersCount}</span> {t.groups_member_count}
                    </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto mb-4 md:mb-0">
                    {!viewingGroup.isJoined ? (
                        <button 
                          onClick={(e) => onJoin(viewingGroup.id, e)} 
                          className={`flex-1 sm:flex-none w-full sm:w-auto ${getThemeClasses('bg')} text-white px-8 py-3 rounded-lg font-bold transition shadow-md flex items-center justify-center gap-2 text-sm md:text-base`}
                        >
                            <Plus className="w-5 h-5" /> {t.groups_join}
                        </button>
                    ) : (
                        <div className="flex gap-3 w-full">
                            {/* "Joined" Button with Dropdown for Leave */}
                            <div className="relative flex-1 sm:flex-none" ref={joinedMenuRef}>
                                <button 
                                  onClick={() => setShowJoinedMenu(!showJoinedMenu)}
                                  className="w-full sm:w-auto bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2 border border-transparent dark:border-gray-600"
                                >
                                    <Check className="w-5 h-5" /> 
                                    <span>{t.groups_joined}</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                {showJoinedMenu && (
                                    <div className={`absolute top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn origin-top-left ${dir === 'rtl' ? 'right-0' : 'left-0'}`}>
                                        <button 
                                            onClick={() => { onLeave(viewingGroup.id); setShowJoinedMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium transition"
                                        >
                                            <LogOut className="w-4 h-4" /> {t.groups_leave}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button 
                              onClick={onInviteClick}
                              className={`flex-1 md:flex-none ${getThemeClasses('bg')} text-white px-6 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-sm border border-transparent`}
                            >
                                <UserPlus className="w-5 h-5" /> {t.groups_invite}
                            </button>
                        </div>
                    )}
                    
                    {/* Header Menu */}
                    <div className="relative" ref={headerMenuRef}>
                        <button 
                          onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                          className={`bg-gray-100 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition border border-transparent dark:border-gray-600 ${showHeaderMenu ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        {showHeaderMenu && (
                            <div className={`absolute top-full mt-2 w-60 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn origin-top-left ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
                                <button onClick={() => { onMenuAction('pin', viewingGroup.id); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition">
                                    {viewingGroup.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                    {viewingGroup.isPinned ? t.groups_unpin_group : t.groups_pin_group}
                                </button>
                                
                                <button onClick={() => { onMenuAction('notification', viewingGroup.id); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition">
                                    {viewingGroup.notifications ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                    {viewingGroup.notifications ? t.post_turn_off_notif : t.post_turn_on_notif}
                                </button>

                                <button onClick={() => { onMenuAction('copy', viewingGroup.id); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition">
                                    <LinkIcon className="w-4 h-4" /> {t.groups_copy_link}
                                </button>

                                {viewingGroup.role === 'admin' && (
                                    <button onClick={() => { onEditGroup(); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition">
                                        <Edit3 className="w-4 h-4" /> {t.groups_edit_group}
                                    </button>
                                )}

                                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                                {viewingGroup.role === 'admin' ? (
                                    <button onClick={() => { onMenuAction('delete', viewingGroup.id); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium transition">
                                        <Trash2 className="w-4 h-4" /> {t.groups_delete_confirm_title}
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => { onMenuAction('leave', viewingGroup.id); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium transition">
                                            <LogOut className="w-4 h-4" /> {t.groups_leave}
                                        </button>
                                        <button onClick={() => { onMenuAction('report', viewingGroup.id); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition">
                                            <Flag className="w-4 h-4" /> {t.common_report}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Internal Navigation Tabs */}
            <div className="flex items-center gap-4 mt-6 px-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
               {[
                 { id: 'posts', label: t.groups_discussion, icon: Grid },
                 { id: 'about', label: t.groups_about, icon: Info },
                 { id: 'members', label: t.groups_members, icon: Users },
                 { id: 'files', label: t.groups_files, icon: FileText },
                 { id: 'events', label: t.groups_events, icon: Calendar },
                 { id: 'photos', label: t.groups_photos, icon: ImageIcon },
                 { id: 'videos', label: t.groups_videos, icon: Video },
                 ...(viewingGroup.role === 'admin' ? [{ id: 'admin', label: t.groups_admin_tools, icon: Shield }] : [])
               ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveGroupTab(tab.id as GroupPageTab)}
                    className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-bold text-sm border-b-[3px] transition whitespace-nowrap ${
                      activeGroupTab === tab.id
                        ? getThemeClasses('tab') 
                        : 'border-transparent text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 rounded-t-lg hover:text-blue-700 dark:hover:text-blue-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
               ))}
            </div>
        </div>

        {/* Content Tabs */}
        <div className="mt-6">
            {/* POSTS TAB */}
            {activeGroupTab === 'posts' && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar Info */}
                    <div className="w-full lg:w-1/3 space-y-4">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{t.groups_about}</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5 break-words">
                                {viewingGroup.description || t.profile_about_no_details}
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                    <Globe className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{viewingGroup.privacy === 'public' ? t.groups_public_group : t.groups_private_group}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{viewingGroup.privacy === 'public' ? t.groups_privacy_hint : 'Private group content hidden'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{t.common_date}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{t.groups_joined} 2023</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rules Widget */}
                        {viewingGroup.rules && viewingGroup.rules.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Shield className={`w-5 h-5 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} />
                                    {t.groups_rules}
                                </h3>
                                <ul className="space-y-3">
                                    {viewingGroup.rules.slice(0, 3).map((rule, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2">
                                            <span className={`font-bold ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 rtl:ml-2 ltr:mr-2`}>{idx + 1}.</span>
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => setActiveGroupTab('about')} className={`text-xs ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 font-bold mt-2 hover:underline w-full text-center`}>{t.common_view_all}</button>
                            </div>
                        )}
                        
                        {/* Related Groups Widget */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hidden md:block">
                             <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{t.groups_discover} {t.nav_groups}</h3>
                             <div className="space-y-4">
                                 {[1,2].map(i => (
                                     <div key={i} className="flex items-center gap-3">
                                         <img src={`https://picsum.photos/60/60?random=${i+900}`} className="w-12 h-12 rounded-lg object-cover" alt="Group" />
                                         <div>
                                             <div className="font-bold text-sm text-gray-900 dark:text-white truncate w-32">Group {i}</div>
                                             <div className="text-xs text-gray-500 dark:text-gray-400">12K {t.groups_member_count}</div>
                                             <button className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded mt-1 transition">{t.groups_join}</button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>

                    {/* Right Feed */}
                    <div className="w-full lg:w-2/3">
                        <CreatePost currentUser={currentUser} onPostCreate={onCreatePost} />

                        {/* In-Group Search */}
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 flex items-center gap-2">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder={`${t.common_search}...`} 
                                className="bg-transparent flex-1 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-500"
                                value={groupSearchTerm}
                                onChange={(e) => setGroupSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 mt-4">
                            {filteredPosts.length > 0 ? (
                                filteredPosts.map(post => (
                                    <PostCard 
                                      key={post.id} 
                                      post={post} 
                                      currentUser={currentUser} 
                                      onTogglePin={onPostTogglePin}
                                      onDelete={onPostDelete}
                                      onToggleSave={onPostSave}
                                      onMediaClick={(url, type) => onMediaClick(url, type, post.id)}
                                      onCopyLink={onPostCopyLink}
                                      onLike={onPostLike}
                                      onComment={onPostComment}
                                      onDeleteComment={onDeletePostComment}
                                      onLikeComment={onLikePostComment}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                        <Grid className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-1">{t.groups_no_posts}</h3>
                                    <p className="text-sm">{t.groups_be_first}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ADMIN TAB */}
            {activeGroupTab === 'admin' && (
                <GroupAdminDashboard 
                  viewingGroup={viewingGroup}
                  currentUser={currentUser}
                  groupPosts={groupPosts}
                  adminRequests={adminRequests}
                  adminReports={adminReports}
                  adminLogs={adminLogs}
                  requirePostApproval={requirePostApproval}
                  setRequirePostApproval={setRequirePostApproval}
                  adminNotifications={adminNotifications}
                  setAdminNotifications={setAdminNotifications}
                  onApproveRequest={handleApproveRequest}
                  onRejectRequest={handleRejectRequest}
                  onResolveReport={handleResolveReport}
                  onEditGroup={onEditGroup}
                  showLocalNotification={showLocalNotification}
                  logAction={handleLogAction}
                />
            )}

            {/* FILES TAB */}
            {activeGroupTab === 'files' && (
                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className={`w-6 h-6 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} />
                            {t.groups_files_tab}
                        </h3>
                        <div>
                             <input 
                                type="file" 
                                ref={fileUploadInputRef} 
                                className="hidden" 
                                onChange={handleFileUpload} 
                             />
                             <button 
                                onClick={() => fileUploadInputRef.current?.click()}
                                className={`px-4 py-2 ${getThemeClasses('bg')} text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm`}
                             >
                                <Upload className="w-4 h-4" /> <span className="hidden sm:inline">{t.groups_upload_file}</span>
                             </button>
                        </div>
                    </div>
                    {localFiles && localFiles.length > 0 ? (
                        <div className="space-y-2">
                            {localFiles.map(file => (
                                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-red-100 dark:bg-red-100 p-3 rounded-lg text-red-500 dark:text-red-400">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className={`font-bold ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 transition`}>{file.name}</div>
                                            <div className="text-xs text-red-500 dark:text-red-400 flex items-center gap-2 flex-wrap">
                                                <span className="uppercase">{file.type}</span>
                                                <span>•</span>
                                                <span>{file.size}</span>
                                                <span>•</span>
                                                <span>{file.date}</span>
                                                <span>•</span>
                                                <span>{t.profile_about_from} {file.uploadedBy}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleFileDownload(file)}
                                        className={`p-2 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition`}
                                        title={t.common_download}
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>{t.common_no_results}</p>
                        </div>
                    )}
                </div>
            )}

            {/* EVENTS TAB */}
            {activeGroupTab === 'events' && (
                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className={`w-6 h-6 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} />
                            {t.groups_events}
                        </h3>
                        <button 
                            onClick={() => setShowEventModal(true)}
                            className={`px-4 py-2 ${getThemeClasses('bg')} text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm`}
                        >
                            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t.groups_create_event}</span>
                        </button>
                    </div>
                    {localEvents && localEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {localEvents.map(event => (
                                <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition bg-white dark:bg-gray-800">
                                    <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                                        <div className="absolute bottom-3 left-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg text-center shadow-sm">
                                            <span className="block text-xs text-red-500 font-bold uppercase">EVENT</span>
                                            <span className="block text-lg font-bold text-gray-900 dark:text-white">{event.date.split('-')[2] || '20'}</span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1 truncate">{event.title}</h4>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {event.date} • <MapPin className="w-3 h-3" /> {event.location}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{event.attendees} {t.groups_interested}</div>
                                            <button 
                                                onClick={() => toggleEventInterest(event.id)}
                                                className={`px-4 py-1.5 rounded-lg font-bold transition text-xs ${event.isInterested ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                            >
                                                {event.isInterested ? t.groups_interested : t.groups_interested}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>{t.common_no_results}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ABOUT TAB */}
            {activeGroupTab === 'about' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                <h4 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className={`w-6 h-6 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} />
                                    {t.common_description}
                                </h4>
                                {viewingGroup.role === 'admin' && (
                                    <button 
                                      onClick={onEditGroup}
                                      className={`${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 text-sm hover:underline font-bold flex items-center gap-1`}
                                    >
                                        <Edit3 className="w-4 h-4" /> {t.common_edit}
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-base">
                                {viewingGroup.description || t.profile_about_no_details}
                            </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                <Shield className={`w-6 h-6 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} />
                                {t.groups_rules}
                            </h4>
                            <ul className="space-y-4">
                                {(viewingGroup.rules || [
                                    "احترم جميع الأعضاء ولا تستخدم ألفاظاً نابية.",
                                    "يمنع نشر المحتوى الإعلاني أو السبام.",
                                    "احرص على أن تكون المنشورات ذات صلة بموضوع المجموعة.",
                                    "يمنع نشر المعلومات الشخصية للآخرين."
                                ]).map((rule, i) => (
                                    <li key={i} className="flex gap-4 text-[15px] text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                        <span className={`font-bold ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 ${getThemeClasses('lightBg')} w-7 h-7 flex items-center justify-center rounded-full text-sm flex-shrink-0`}>{i+1}</span>
                                        <span>{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                <BarChart3 className={`w-5 h-5 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} />
                                {t.groups_overview}
                            </h4>
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-full text-fb-blue"><Grid className="w-5 h-5" /></div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 dark:text-white text-lg">{groupPosts.length}</span>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.groups_posts_this_month}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-full text-purple-600"><Users className="w-5 h-5" /></div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 dark:text-white text-lg">{viewingGroup.membersCount}</span>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.groups_total_members}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-full text-orange-600"><Calendar className="w-5 h-5" /></div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm">{t.common_date}</span>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">2023</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    <UserCog className={`w-5 h-5 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} />
                                    {t.common_admin}
                                </h4>
                                <button onClick={() => setActiveGroupTab('members')} className={`text-xs ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 hover:underline font-bold`}>{t.common_view_all}</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {viewingGroup.membersList?.filter(m => m.role === 'admin' || m.role === 'moderator').slice(0, 5).map(admin => (
                                    <div key={admin.userId} className="relative group cursor-pointer" title={admin.name}>
                                        <img src={admin.avatar} alt={admin.name} className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700 object-cover" />
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[8px] p-0.5 rounded-full border-2 border-white dark:border-gray-800">
                                            <Shield className="w-2.5 h-2.5 fill-current" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MEMBERS TAB */}
            {activeGroupTab === 'members' && (
                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className={`w-6 h-6 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} />
                            {t.groups_members} ({viewingGroup.membersCount})
                        </h3>
                        {viewingGroup.role === 'admin' && (
                            <button 
                              onClick={onManageMembers}
                              className={`w-full sm:w-auto px-5 py-2.5 ${getThemeClasses('lightBg')} ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 rounded-lg font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition flex items-center justify-center gap-2`}
                            >
                                <UserCog className="w-5 h-5" /> {t.groups_manage_members}
                            </button>
                        )}
                    </div>
                    
                    <div className="mb-10">
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 px-1">{t.pages_admin_roles}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {viewingGroup.role === 'admin' && (
                                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <div className="flex items-center gap-4">
                                        <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-full object-cover" />
                                        <div>
                                            <div className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                                                {currentUser.name}
                                                <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/50">Admin</span>
                                            </div>
                                            <div className={`text-xs ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full w-fit mt-1`}>{t.common_admin} ({t.privacy_only_me})</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {viewingGroup.membersList?.filter(m => m.role === 'admin' || m.role === 'moderator').map(member => (
                                <div key={member.userId} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <div className="flex items-center gap-4">
                                        <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                                        <div>
                                            <div className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                                                {member.name}
                                                {member.badges?.map(badge => (
                                                    <span key={badge} className={`text-[10px] px-1.5 py-0.5 rounded border ${getBadgeColor(badge)}`}>{badge}</span>
                                                ))}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                                                {member.role === 'admin' ? t.common_admin : t.common_moderator}
                                            </div>
                                        </div>
                                    </div>
                                    {viewingGroup.role === 'admin' && (
                                        <button 
                                            onClick={() => onRemoveMember(member.userId)}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 px-1">{t.groups_members}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {viewingGroup.membersList?.filter(m => m.role === 'member').map(member => (
                                <div key={member.userId} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <div className="flex items-center gap-3">
                                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <div className={`font-bold text-sm ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700 flex items-center gap-1`}>
                                                {member.name}
                                                {member.badges?.map(badge => (
                                                    <span key={badge} className={`text-[8px] px-1 py-0.5 rounded ${getBadgeColor(badge)}`}>{badge}</span>
                                                ))}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.profile_joined_date} {member.joinedAt}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button className="text-gray-400 hover:text-fb-blue p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                        {viewingGroup.role === 'admin' && (
                                            <button 
                                                onClick={() => onRemoveMember(member.userId)}
                                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!viewingGroup.membersList || viewingGroup.membersList.filter(m => m.role === 'member').length === 0) && Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <div className="flex items-center gap-3">
                                        <img src={`https://picsum.photos/50/50?random=${i + 100}`} alt="Member" className="w-10 h-10 rounded-full" />
                                        <div>
                                            <div className="font-bold text-sm text-gray-900 dark:text-white">{t.common_member} {i + 1}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.groups_joined} 1m ago</div>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-fb-blue p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PHOTOS TAB */}
            {activeGroupTab === 'photos' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ImageIcon className={`w-5 h-5 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} /> {t.groups_photos}
                        </h3>
                        <button 
                          onClick={() => mediaUploadInputRef.current?.click()}
                          className={`px-5 py-2.5 ${getThemeClasses('bg')} text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm`}
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.common_add} {t.groups_photos}</span>
                        </button>
                    </div>
                    {groupPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {groupPhotos.map((post, idx) => (
                                <div 
                                    key={post.id} 
                                    className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition relative group border border-gray-200 dark:border-gray-600"
                                    onClick={() => onMediaClick(post.image!, 'image', post.id)}
                                >
                                    <img src={post.image} alt="group photo" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                            <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">{t.profile_no_photos}</p>
                        </div>
                    )}
                </div>
            )}

            {/* VIDEOS TAB */}
            {activeGroupTab === 'videos' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Video className={`w-5 h-5 ${getThemeClasses('text')} hover:text-blue-700 dark:hover:text-blue-700`} /> {t.groups_videos}
                        </h3>
                        <button 
                          onClick={() => mediaUploadInputRef.current?.click()}
                          className={`px-5 py-2.5 ${getThemeClasses('bg')} text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm`}
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.common_add} {t.groups_videos}</span>
                        </button>
                    </div>
                    {groupVideos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {groupVideos.map((post, idx) => (
                                <div 
                                    key={post.id} 
                                    className="aspect-video bg-black rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition relative group shadow-md border border-gray-200 dark:border-gray-700"
                                    onClick={() => onMediaClick(post.image!, 'video', post.id)}
                                >
                                    <video src={post.image} className="w-full h-full object-cover pointer-events-none" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-transparent transition">
                                        <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm group-hover:scale-110 transition border border-white/30">
                                            <Play className="w-8 h-8 text-white fill-current" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                            <Video className="w-16 h-16 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">{t.profile_no_videos}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {/* Modals */}
        {showEventModal && (
            <CreateGroupEventModal
                onClose={() => setShowEventModal(false)}
                onCreate={handleCreateEvent}
                isLoading={isCreatingEvent}
            />
        )}
    </div>
  );
};

export default GroupDetail;