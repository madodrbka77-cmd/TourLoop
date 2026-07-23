import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, 
  X, 
  Download, 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  Send, 
  Smile, 
  Globe, 
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { User, Post, Comment } from '../types';
import { INITIAL_GROUPS, Group, GroupMember } from '../data/groupsData';
import { CreateGroupModal, EditGroupModal, GroupMembersModal, InviteFriendsModal, ConfirmModal } from './groups/GroupModals';
import GroupList from './groups/GroupList';
import GroupDetail from './groups/GroupDetail';
import ProfileMediaLightbox from './ProfileMediaLightbox';
import { safeSetItem, safeGetItem } from '../utils/safeStorage';
import MarketplaceShareModal from './marketplace/MarketplaceShareModal';
import { useLanguage } from '../context/LanguageContext';
import { playAudio } from '../utils/audio';

interface ProfileGroupsProps {
  currentUser: User;
  onToggleSave?: (item: any) => void;
  onLike?: (id: string, reactionType?: string) => void;
  onComment?: (id: string, text: string) => void;
  onDeleteComment?: (id: string, commentId: string) => void;
  onLikeComment?: (id: string, commentId: string) => void;
  onDeletePostExternal?: (id: string, skipConfirm?: boolean) => void;
  onRemoveMember?: (id: string) => void;
  groupPostsStore: Record<string, Post[]>;
  setGroupPostsStore: React.Dispatch<React.SetStateAction<Record<string, Post[]>>>;
  showNotification?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

type TabType = 'all' | 'admin' | 'member' | 'discover';
type ModalActionType = 'leave' | 'delete' | 'delete_post' | null;
type GroupPageTab = 'posts' | 'about' | 'members' | 'photos' | 'videos' | 'files' | 'events' | 'admin';

const ProfileGroups: React.FC<ProfileGroupsProps> = ({ 
  currentUser,
  onToggleSave,
  onLike,
  onComment,
  onDeleteComment,
  onLikeComment,
  onDeletePostExternal,
  onRemoveMember,
  groupPostsStore,
  setGroupPostsStore,
  showNotification: propShowNotification
}) => {
  const { t, dir, language } = useLanguage();
  
  // Sync local store alias with global store passed in Props
  const postsStore = groupPostsStore;
  const setPostsStore = setGroupPostsStore;

  // Load groups from safe storage or use INITIAL
  const [groups, setGroups] = useState<Group[]>(() => {
      const saved = safeGetItem('tourloop_groups');
      return Array.isArray(saved) ? saved : INITIAL_GROUPS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  // Interaction States
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Group Detail View State
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
  const [groupPosts, setGroupPosts] = useState<Post[]>([]);
  const [activeGroupTab, setActiveGroupTab] = useState<GroupPageTab>('posts'); 

  // Edit Group State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editGroupCover, setEditGroupCover] = useState('');
  const [editGroupPrivacy, setEditGroupPrivacy] = useState<'public' | 'private'>('public');
  const [editGroupEmail, setEditGroupEmail] = useState('');
  const [editGroupWebsite, setEditGroupWebsite] = useState('');
  const [editGroupWebsite_State, setEditGroupWebsite_State] = useState('');
  const [editGroupLocation, setEditGroupLocation] = useState('');
  const [editGroupThemeColor, setEditGroupThemeColor] = useState<string>('emerald'); // Added state for theme color
  
  // Create Group Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private'>('public');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Invite Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);

  // Member Management States
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedRoleType, setSelectedRoleType] = useState<'admin' | 'moderator' | 'member'>('member');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: ModalActionType; groupId: string | null; groupName: string; targetPostId?: string }>(
    { isOpen: false, type: null, groupId: null, groupName: '', targetPostId: undefined }
  );

  // Lightbox State
  const [viewingMedia, setViewingMedia] = useState<{ url: string, type: 'image' | 'video', postId?: string } | null>(null);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null);

  // --- Persistence Effects using safe storage ---
  useEffect(() => {
      safeSetItem('tourloop_groups', JSON.stringify(groups));
  }, [groups]);

  // Sync posts display when global store changes
  useEffect(() => {
      if (viewingGroup) {
          const loadedPosts = postsStore[viewingGroup.id] || [];
          if (Array.isArray(loadedPosts) && loadedPosts.length > 0) {
              setGroupPosts(loadedPosts);
          } else if (viewingGroup.postsCount && viewingGroup.postsCount > 0 && !postsStore[viewingGroup.id]) {
               const mockPost: Post = {
                  id: `mock_${viewingGroup.id}_1`,
                  author: { id: 'admin', name: 'Admin User', avatar: `https://ui-avatars.com/api/?name=${viewingGroup.name}&background=random` },
                  content: `${t.groups_be_first}\n\n${t.groups_discussion}`,
                  timestamp: t.date_now,
                  likes: 15,
                  comments: [],
                  shares: 2,
                  isPinned: true
              };
              setPostsStore(prev => ({ ...prev, [viewingGroup.id]: [mockPost] }));
              setGroupPosts([mockPost]);
          } else {
              setGroupPosts([]);
          }
      }
  }, [viewingGroup?.id, postsStore, setPostsStore, t]); 

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    // Play appropriate sound
    if (type === 'success') playAudio('notification');
    else if (type === 'error') playAudio('notification');
    else playAudio('notification');

    if (propShowNotification) {
      propShowNotification(message, type);
    } else {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const sanitizeInput = (input: string) => {
    return input.replace(/<[^>]*>?/gm, '').trim();
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateGroupPost = (content: string, image?: string) => {
      if (!viewingGroup) return;

      const newPost: Post = {
          id: `gp_${Date.now()}`,
          author: currentUser,
          content,
          image,
          timestamp: t.date_now,
          likes: 0,
          comments: [],
          shares: 0,
          isPinned: false
      };
      
      setPostsStore(prev => ({
          ...prev,
          [viewingGroup.id]: [newPost, ...(prev[viewingGroup.id] || [])]
      }));
      
      if (viewingGroup) {
          const updated = { ...viewingGroup, postsCount: (viewingGroup.postsCount || 0) + 1 };
          setViewingGroup(updated);
          setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
      }
      
      playAudio('post_success');
      
      // Custom notification logic based on content type
      if (image) {
          const isVideo = image.startsWith('data:video') || image.endsWith('.mp4');
          if (isVideo) {
              showNotification(language === 'ar' ? 'تم نشر الفيديو بنجاح' : 'Video posted successfully', 'success');
          } else {
              showNotification(language === 'ar' ? 'تم نشر الصورة بنجاح' : 'Image posted successfully', 'success');
          }
      } else {
          showNotification(language === 'ar' ? 'تم نشر المنشور بنجاح' : 'Post published successfully', 'success');
      }
  };

  const handleCreateGroup = () => {
    const sanitizedName = sanitizeInput(newGroupName);
    if (!sanitizedName) { showNotification(`${t.groups_group_name} ${t.errors_required}`, 'error'); return; }
    if (sanitizedName.length < 3) { showNotification(t.errors_generic, 'error'); return; }

    const newGroup: Group = {
        id: Date.now().toString(),
        name: sanitizedName,
        coverUrl: `https://picsum.photos/800/300?random=${Math.floor(Math.random() * 1000)}`,
        membersCount: '1',
        role: 'admin',
        lastActive: t.date_now,
        privacy: newGroupPrivacy,
        notifications: true,
        isPinned: false,
        description: newGroupDescription || t.groups_about,
        postsCount: 0,
        isJoined: true,
        membersList: [{ userId: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, role: 'admin', joinedAt: new Date().toISOString().split('T')[0] }],
        themeColor: 'emerald'
    };

    setGroups(prevGroups => [newGroup, ...prevGroups]);
    setShowCreateModal(false);
    setNewGroupName('');
    setNewGroupPrivacy('public');
    setNewGroupDescription('');
    
    playAudio('post_success');
    showNotification(t.common_success, 'success');
    setViewingGroup(newGroup);
    setActiveGroupTab('posts');
    setGroupPosts([]);
  };

  const handleJoinGroup = (groupId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setGroups(prev => prev.map(g => {
          if (g.id === groupId) {
              const currentCount = parseInt(g.membersCount.replace(/[^0-9]/g, '')) || 0;
              const newMember: GroupMember = { userId: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, role: 'member', joinedAt: new Date().toISOString().split('T')[0] };
              const updatedGroup = { ...g, role: 'member' as const, isJoined: true, membersCount: String(currentCount + 1), membersList: [...(g.membersList || []), newMember] };
              if (viewingGroup && viewingGroup.id === groupId) setViewingGroup(updatedGroup);
              return updatedGroup;
          }
          return g;
      }));
      playAudio('like');
      showNotification(t.groups_joined, 'success');
  };

  const handleLeaveGroup = (groupId: string) => {
      const group = groups.find(g => g.id === groupId);
      if (group) {
          setGroups(prev => prev.map(g => {
              if (g.id === groupId) {
                  const currentCount = parseInt(g.membersCount.replace(/[^0-9]/g, '')) || 1;
                  const updatedGroup = { ...g, role: 'guest' as const, isJoined: false, membersCount: String(Math.max(0, currentCount - 1)), membersList: (g.membersList || []).filter(m => m.userId !== currentUser.id) };
                  if (viewingGroup && viewingGroup.id === groupId) setViewingGroup(updatedGroup);
                  return updatedGroup;
              }
              return g;
          }));
          showNotification(`${t.groups_leave}: ${group.name}`, 'info');
      }
  };

  const handleUpdateGroup = () => {
      if (!viewingGroup) return;
      if (!editGroupName.trim()) { showNotification(t.errors_required, 'error'); return; }
      const isCoverChanged = editGroupCover && editGroupCover !== viewingGroup.coverUrl;
      const updatedGroup: Group = { 
          ...viewingGroup, 
          name: editGroupName, 
          description: editGroupDescription, 
          coverUrl: editGroupCover || viewingGroup.coverUrl, 
          privacy: editGroupPrivacy, 
          email: editGroupEmail, 
          website: editGroupWebsite, 
          location: editGroupLocation,
          themeColor: editGroupThemeColor // Added theme color update
      };
      
      setGroups(prev => prev.map(g => g.id === viewingGroup.id ? updatedGroup : g));
      setViewingGroup(updatedGroup);
      setShowEditModal(false);
      if (isCoverChanged) handleCreateGroupPost(`${currentUser.name} ${t.common_update} ${t.groups_cover_photo}`, editGroupCover);
      showNotification(t.common_success, 'success');
  };

  const handleInvite = (userId: string) => {
      setInvitedUsers(prev => [...prev, userId]);
      showNotification(t.groups_invite + ' ' + t.common_success, 'success');
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.size > 5 * 1024 * 1024) { showNotification(t.errors_file_too_large, 'error'); return; }
          const base64 = await readFileAsBase64(file);
          setEditGroupCover(base64);
          e.target.value = '';
      }
  };

  const handleCoverChangeMain = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && viewingGroup) {
          const file = e.target.files[0];
          const base64 = await readFileAsBase64(file);
          const newPostsCount = (viewingGroup.postsCount || 0) + 1;
          const updatedGroup = { ...viewingGroup, coverUrl: base64, postsCount: newPostsCount };
          
          const newPost: Post = { 
              id: `gp_${Date.now()}`, 
              author: currentUser, 
              content: `${currentUser.name} ${t.common_update} ${t.groups_cover_photo}`,
              image: base64,
              timestamp: t.date_now,
              likes: 0,
              comments: [],
              shares: 0,
              isPinned: false
          };

          setPostsStore(prev => ({
              ...prev,
              [viewingGroup.id]: [newPost, ...(prev[viewingGroup.id] || [])]
          }));

          setGroups(prev => prev.map(g => g.id === viewingGroup.id ? updatedGroup : g));
          setViewingGroup(updatedGroup);
          
          playAudio('upload_start');
          showNotification(t.common_success, 'success');
          e.target.value = '';
      }
  };

  const handleConfirmAction = () => {
      if (confirmModal.type === 'leave' && confirmModal.groupId) {
          handleLeaveGroup(confirmModal.groupId);
      } else if (confirmModal.type === 'delete' && confirmModal.groupId) {
          setGroups(prev => prev.filter(g => g.id !== confirmModal.groupId));
          if (viewingGroup && viewingGroup.id === confirmModal.groupId) setViewingGroup(null);
          showNotification(t.common_success, 'info');
      } else if (confirmModal.type === 'delete_post' && confirmModal.targetPostId && viewingGroup) {
          const postId = confirmModal.targetPostId;
          if (onDeletePostExternal) onDeletePostExternal(postId, true);
      }
      setConfirmModal({ isOpen: false, type: null, groupId: null, groupName: '', targetPostId: undefined });
  };

  const handleMenuAction = (action: any, id: string) => {
      const group = groups.find(g => g.id === id);
      if (!group) return;

      if (action === 'leave') {
          setConfirmModal({ isOpen: true, type: 'leave', groupId: id, groupName: group.name });
      } else if (action === 'delete') {
          setConfirmModal({ isOpen: true, type: 'delete', groupId: id, groupName: group.name });
      } else if (action === 'pin') {
          const updated = { ...group, isPinned: !group.isPinned };
          setGroups(prev => prev.map(g => g.id === id ? updated : g));
          if (viewingGroup && viewingGroup.id === id) setViewingGroup(updated);
          showNotification(updated.isPinned ? t.groups_pinned_group : t.groups_unpin_group, 'success');
      } else if (action === 'notification') {
          const updated = { ...group, notifications: !group.notifications };
          setGroups(prev => prev.map(g => g.id === id ? updated : g));
          if (viewingGroup && viewingGroup.id === id) setViewingGroup(updated);
          showNotification(updated.notifications ? t.post_turn_on_notif : t.post_turn_off_notif, 'info');
      } else if (action === 'copy') {
          navigator.clipboard.writeText(window.location.href); 
          showNotification(t.common_copied, 'success');
      } else if (action === 'report') {
          showNotification(t.groups_report_reason, 'info');
      }
  };

  const handleAddMember = () => {
      if (!viewingGroup || !memberSearchTerm.trim()) return;
      const newMember = {
          userId: `u_${Date.now()}`,
          name: memberSearchTerm,
          avatar: `https://ui-avatars.com/api/?name=${memberSearchTerm}&background=random`,
          role: selectedRoleType,
          joinedAt: new Date().toISOString().split('T')[0]
      };
      
      const currentCount = parseInt(viewingGroup.membersCount.replace(/[^0-9]/g, '')) || 0;
      const updatedGroup = { 
          ...viewingGroup, 
          membersList: [...(viewingGroup.membersList || []), newMember],
          membersCount: String(currentCount + 1)
      };
      
      setGroups(prev => prev.map(g => g.id === viewingGroup.id ? updatedGroup : g));
      setViewingGroup(updatedGroup);
      setMemberSearchTerm('');
      showNotification(`${t.common_add} ${newMember.name} - ${t.common_success}`, 'success');
  };

  const handleRemoveMemberInternal = (id: string) => {
      if (!viewingGroup) return;
      if (onRemoveMember) {
          onRemoveMember(id);
      } else {
          const currentCount = parseInt(viewingGroup.membersCount.replace(/[^0-9]/g, '')) || 0;
          const updatedGroup = { 
              ...viewingGroup, 
              membersList: (viewingGroup.membersList || []).filter(m => m.userId !== id),
              membersCount: String(Math.max(0, currentCount - 1))
          };
          setGroups(prev => prev.map(g => g.id === viewingGroup.id ? updatedGroup : g));
          setViewingGroup(updatedGroup);
          showNotification(t.common_success, 'info');
      }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && viewingGroup) {
          const file = e.target.files[0];
          
          if(file.size > 50 * 1024 * 1024) { // 50MB limit
             showNotification(t.errors_file_too_large, 'error');
             e.target.value = '';
             return;
          }

          showNotification(t.common_loading, 'info');

          try {
              const base64 = await readFileAsBase64(file);
              const isVideo = file.type.startsWith('video/');
              
              const newPost: Post = {
                  id: `gp_media_${Date.now()}`,
                  author: currentUser,
                  content: `${currentUser.name} ${t.common_share} ${isVideo ? t.post_live_video : t.profile_photos}`,
                  image: base64,
                  timestamp: t.date_now,
                  likes: 0,
                  comments: [],
                  shares: 0,
                  isPinned: false
              };

              setPostsStore(prev => ({
                  ...prev,
                  [viewingGroup.id]: [newPost, ...(prev[viewingGroup.id] || [])]
              }));
              
              const updatedGroup = { ...viewingGroup, postsCount: (viewingGroup.postsCount || 0) + 1 };
              setViewingGroup(updatedGroup);
              setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
              
              playAudio('upload_start');

              // Custom notification logic for media uploads
              if (isVideo) {
                  showNotification(language === 'ar' ? 'تم نشر الفيديو بنجاح' : 'Video posted successfully', 'success');
              } else {
                  showNotification(language === 'ar' ? 'تم نشر الصورة بنجاح' : 'Image posted successfully', 'success');
              }

          } catch (error) {
              console.error("Upload error", error);
              showNotification(t.errors_generic, 'error');
          }
          e.target.value = '';
      }
  };

  // --- Handlers for Likes & Comments ---
  const handlePostLike = (postId: string, reactionType?: string) => {
      if (onLike) onLike(postId, reactionType);
  };

  const handlePostComment = (postId: string, text: string) => {
      if (onComment) onComment(postId, text);
  };

  const handleDeletePostComment = (postId: string, commentId: string) => {
      if (onDeleteComment) onDeleteComment(postId, commentId);
  };

  const handleLikePostComment = (postId: string, commentId: string) => {
      if (onLikeComment) onLikeComment(postId, commentId);
  };

  const handlePostTogglePin = (postId: string) => {
      // Added logic to show notification when pinning/unpinning
      if (viewingGroup) {
          const currentPosts = postsStore[viewingGroup.id] || [];
          const targetPost = currentPosts.find(p => p.id === postId);
          
          if (targetPost) {
               const isNowPinned = !targetPost.isPinned;
               const msg = isNowPinned 
                   ? (language === 'ar' ? 'تم تثبيت المنشور في الأعلى 📌' : 'Post pinned to top') 
                   : (language === 'ar' ? 'تم إلغاء تثبيت المنشور' : 'Post unpinned');
               showNotification(msg, 'success');
          }
      }

      const updatePosts = (posts: Post[]) => posts.map(p => p.id === postId ? { ...p, isPinned: !p.isPinned } : p);
      if (viewingGroup) {
          setPostsStore(prev => ({
              ...prev,
              [viewingGroup.id]: updatePosts(prev[viewingGroup.id] || [])
          }));
      }
  };

  const handlePostDelete = (postId: string) => {
      if (onDeletePostExternal) {
          onDeletePostExternal(postId);
      }
  };

  const handlePostSave = (post: Post) => {
      if (onToggleSave) onToggleSave(post);
  };
  
  const handlePostCopyLink = (link: string) => {
      navigator.clipboard.writeText(link || window.location.href);
      showNotification(t.common_copied, 'success');
  };

  const handleShareClick = (post: Post) => {
      setPostToShare(post);
      setShowShareModal(true);
  }

  // --- Lightbox Logic ---
  const groupMediaList = useMemo(() => {
    return groupPosts.filter(p => p.image).map(p => p.image!);
  }, [groupPosts]);

  const viewingPost = useMemo(() => {
    if (!viewingMedia?.postId) return null;
    return groupPosts.find(p => p.id === viewingMedia.postId) || null;
  }, [groupPosts, viewingMedia]);

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewingMedia) return;
    const currentIdx = groupMediaList.indexOf(viewingMedia.url);
    const nextIdx = (currentIdx + 1) % groupMediaList.length;
    const nextUrl = groupMediaList[nextIdx];
    const nextPost = groupPosts.find(p => p.image === nextUrl);
    if (nextPost) {
        setViewingMedia({ 
            url: nextUrl, 
            type: (nextUrl.startsWith('data:video') || nextUrl.endsWith('.mp4')) ? 'video' : 'image', 
            postId: nextPost.id 
        });
    }
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewingMedia) return;
    const currentIdx = groupMediaList.indexOf(viewingMedia.url);
    const prevIdx = (currentIdx - 1 + groupMediaList.length) % groupMediaList.length;
    const prevUrl = groupMediaList[prevIdx];
    const prevPost = groupPosts.find(p => p.image === prevUrl);
    if (prevPost) {
        setViewingMedia({ 
            url: prevUrl, 
            type: (prevUrl.startsWith('data:video') || prevUrl.endsWith('.mp4')) ? 'video' : 'image', 
            postId: prevPost.id 
        });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm min-h-[500px] animate-fadeIn p-4 md:p-6 relative transition-colors duration-300" dir={dir}>
      
      {/* --- CONTENT AREA --- */}
      {viewingGroup ? (
          <GroupDetail 
            viewingGroup={viewingGroup}
            currentUser={currentUser}
            groupPosts={groupPosts}
            activeGroupTab={activeGroupTab}
            setActiveGroupTab={setActiveGroupTab}
            onBack={() => setViewingGroup(null)}
            onJoin={handleJoinGroup}
            onLeave={(id) => setConfirmModal({ isOpen: true, type: 'leave', groupId: id, groupName: viewingGroup.name })}
            onMenuAction={handleMenuAction}
            onCoverChangeMain={handleCoverChangeMain}
            onCreatePost={handleCreateGroupPost}
            onPostTogglePin={handlePostTogglePin}
            onPostDelete={handlePostDelete}
            onPostLike={handlePostLike}
            onPostSave={handlePostSave}
            onPostCopyLink={handlePostCopyLink}
            onMediaClick={(url, type, postId) => setViewingMedia({ url, type, postId })}
            onMediaUpload={handleMediaUpload}
            onEditGroup={() => {
               setEditGroupName(viewingGroup.name);
               setEditGroupDescription(viewingGroup.description || '');
               setEditGroupCover(viewingGroup.coverUrl);
               setEditGroupPrivacy(viewingGroup.privacy);
               setEditGroupEmail(viewingGroup.email || '');
               setEditGroupWebsite_State(viewingGroup.website || '');
               setEditGroupLocation(viewingGroup.location || '');
               setEditGroupThemeColor(viewingGroup.themeColor || 'emerald'); // Initialize theme color
               setShowEditModal(true);
            }}
            onInviteClick={() => setShowInviteModal(true)}
            onManageMembers={() => setShowMembersModal(true)}
            onRemoveMember={handleRemoveMemberInternal}
            onPostComment={handlePostComment}
            onDeletePostComment={handleDeletePostComment}
            onLikePostComment={handleLikePostComment}
          />
      ) : (
        <GroupList 
          groups={groups}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onJoinGroup={handleJoinGroup}
          onVisitGroup={(g) => { setViewingGroup(g); setActiveGroupTab('posts'); }}
          onMenuAction={handleMenuAction}
          onCreateGroupClick={() => setShowCreateModal(true)}
        />
      )}

      {/* --- MODALS --- */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
          isLoading={isLoading}
          groupName={newGroupName}
          setGroupName={setNewGroupName}
          privacy={newGroupPrivacy}
          setPrivacy={setNewGroupPrivacy}
          description={newGroupDescription}
          setDescription={setNewGroupDescription}
        />
      )}

      {showEditModal && viewingGroup && (
        <EditGroupModal 
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateGroup}
          isLoading={isLoading}
          name={editGroupName} setName={setEditGroupName}
          description={editGroupDescription} setDescription={setEditGroupDescription}
          coverUrl={editGroupCover} onCoverUpload={handleCoverUpload}
          privacy={editGroupPrivacy} setPrivacy={setEditGroupPrivacy}
          email={editGroupEmail} setEmail={setEditGroupEmail}
          website={editGroupWebsite_State} setWebsite={setEditGroupWebsite_State}
          location={editGroupLocation} setLocation={setEditGroupLocation}
          themeColor={editGroupThemeColor} setThemeColor={setEditGroupThemeColor} // Linked theme color props
        />
      )}

      {showMembersModal && viewingGroup && (
        <GroupMembersModal 
          group={viewingGroup}
          onClose={() => setShowMembersModal(false)}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMemberInternal}
          searchTerm={memberSearchTerm}
          setSearchTerm={setMemberSearchTerm}
          roleType={selectedRoleType}
          setRoleType={setSelectedRoleType}
        />
      )}

      {showInviteModal && (
        <InviteFriendsModal 
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
          search={inviteSearch}
          setSearch={setInviteSearch}
          invitedUsers={invitedUsers}
        />
      )}

      {confirmModal.isOpen && (confirmModal.type === 'leave' || confirmModal.type === 'delete') && (
        <ConfirmModal 
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={handleConfirmAction}
          isLoading={isLoading}
          type={confirmModal.type as 'leave' | 'delete'}
          groupName={confirmModal.groupName}
        />
      )}
      
      {/* Post Deletion Custom Modal - Enhanced for Dark Mode */}
      {confirmModal.type === 'delete_post' && confirmModal.isOpen && (
           <div className="fixed inset-0 z-[500000] flex items-center justify-center bg-black/60 p-4 animate-fadeIn backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl w-[90%] md:w-full max-w-sm border border-gray-200 dark:border-gray-700 animate-scaleIn">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    {t.post_delete_confirm_title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                    {t.groups_delete_post_confirm_desc}
                  </p>
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setConfirmModal({...confirmModal, isOpen: false})} className="px-5 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-bold transition">{t.common_cancel}</button>
                      <button 
                          onClick={handleConfirmAction} 
                          className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg"
                      >
                          {t.common_delete}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MEDIA VIEWER LIGHTBOX --- */}
      {viewingMedia && typeof document !== 'undefined' && createPortal(
        <ProfileMediaLightbox
            viewingMedia={viewingMedia}
            viewingPost={viewingPost}
            profileImagesList={groupMediaList}
            currentUser={currentUser}
            isOwnProfile={viewingPost?.author.id === currentUser.id || viewingGroup?.role === 'admin'}
            isSaved={false} 
            onClose={() => setViewingMedia(null)}
            onNext={handleNextMedia}
            onPrev={handlePrevMedia}
            onLike={(reaction) => viewingPost && handlePostLike(viewingPost.id, reaction)}
            onComment={(text) => viewingPost && handlePostComment(viewingPost.id, text)}
            onDeleteComment={(commentId) => viewingPost && handleDeletePostComment(viewingPost.id, commentId)}
            onDeletePost={() => {
                 if (viewingPost) {
                     handlePostDelete(viewingPost.id);
                     setViewingMedia(null);
                 }
            }}
            onToggleSave={() => viewingPost && handlePostSave(viewingPost)}
            onTogglePin={() => viewingPost && handlePostTogglePin(viewingPost.id)}
            onUpdateAvatar={() => {}} 
            onLikeComment={(commentId) => viewingPost && handleLikePostComment(viewingPost.id, commentId)}
        />,
        document.body
      )}

      {/* --- ADVANCED SHARE MODAL --- */}
      {showShareModal && postToShare && (
           <MarketplaceShareModal 
                product={{
                    id: postToShare.id,
                    title: postToShare.content ? postToShare.content.substring(0, 30) : t.post_publish,
                    image: postToShare.image || '',
                    price: 0,
                    currency: '',
                    category: '',
                    location: '',
                    seller: postToShare.author,
                    description: postToShare.content,
                    condition: 'new',
                    date: postToShare.timestamp,
                    timestamp: Date.now()
                }}
                onClose={() => setShowShareModal(false)}
           />
      )}

      {/* Local Notification Portal - Enhanced for Mobile & Dark Mode */}
      {notification && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-20 md:bottom-6 right-0 md:right-6 w-full md:w-auto flex justify-center md:block z-[999999] pointer-events-none px-4">
            <div className={`pointer-events-auto animate-bounce-in w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white border border-white/10 backdrop-blur-md ${notification.type === 'success' ? 'bg-emerald-600 dark:bg-emerald-700' : notification.type === 'error' ? 'bg-red-600 dark:bg-red-700' : 'bg-blue-600 dark:bg-blue-700'}`}>
                {notification.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : notification.type === 'error' ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <Info className="w-5 h-5 flex-shrink-0" />}
                <span className="font-bold text-sm flex-1 break-words">{notification.message}</span>
                <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/20 rounded-full transition">
                    <X className="w-4 h-4 text-white/90" />
                </button>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProfileGroups;