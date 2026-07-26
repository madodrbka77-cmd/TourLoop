import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Pause, Play, Heart, Send, Smile, ChevronLeft, ChevronRight, Check, Eye, Trash2, Volume2, VolumeX, Users, Music, Disc } from 'lucide-react';
import { User, Story, StoryMusicTrack } from '../types';
import { UserStoryGroup } from './StoryReel';
import { useLanguage } from '../context/LanguageContext';
import { playAudio, playStoryMusicTrack, stopStoryMusicTrack } from '../utils/audio';

interface StoryViewerProps {
  initialGroupIndex: number;
  groups: UserStoryGroup[];
  currentUser: User;
  onClose: () => void;
  onAddStory: (mediaUrl: string, type?: 'image' | 'text', musicTrack?: StoryMusicTrack) => void;
  onDeleteStory?: (storyId: string) => void;
}

interface FloatingEmoji {
    id: number;
    char: string;
    left: number; 
}

interface StoryViewerUser {
    name: string;
    avatar: string;
    time: string;
    reaction?: string;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "👏", "🎉", "😍", "🙌", "💯"];
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];

// Mock viewers list generator for own stories
const MOCK_VIEWERS: StoryViewerUser[] = [
    { name: 'أحمد محمود', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', time: 'منذ دقيقة', reaction: '❤️' },
    { name: 'سارة علي', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', time: 'منذ 5 دقائق', reaction: '🔥' },
    { name: 'محمد خالد', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', time: 'منذ 12 دقيقة' },
    { name: 'نور الدين', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', time: 'منذ 20 دقيقة', reaction: '👏' },
    { name: 'عمر شريف', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', time: 'منذ 35 دقيقة' },
];

const StoryViewer: React.FC<StoryViewerProps> = ({ 
    initialGroupIndex, 
    groups, 
    currentUser, 
    onClose, 
    onAddStory,
    onDeleteStory 
}) => {
  const { t, dir, language } = useLanguage();
  const [activeGroupIndex, setActiveGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStoryLiked, setIsStoryLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [showSentNotification, setShowSentNotification] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmojiQuickBar, setShowEmojiQuickBar] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  const isVideo = (url: string) => {
      return url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
  };

  // Safe boundary check for groups & active group
  useEffect(() => {
      if (!groups || groups.length === 0) {
          onClose();
          return;
      }
      if (activeGroupIndex >= groups.length) {
          setActiveGroupIndex(Math.max(0, groups.length - 1));
      }
  }, [groups, activeGroupIndex, onClose]);

  const currentGroup = groups[activeGroupIndex] || groups[0];
  const safeStoryIndex = Math.min(currentStoryIndex, currentGroup ? currentGroup.stories.length - 1 : 0);
  const currentStory = currentGroup && currentGroup.stories ? currentGroup.stories[safeStoryIndex] : null;
  const isOwnStory = currentStory ? currentStory.userId === currentUser.id : false;

  // Next and Prev Groups for desktop side previews
  const prevGroup = activeGroupIndex > 0 ? groups[activeGroupIndex - 1] : null;
  const nextGroup = activeGroupIndex < groups.length - 1 ? groups[activeGroupIndex + 1] : null;

  // Background Music Playback Control
  useEffect(() => {
      stopStoryMusicTrack();

      if (musicAudioRef.current) {
          musicAudioRef.current.pause();
          musicAudioRef.current = null;
      }

      if (currentStory?.musicTrack && !isMuted && !isPaused) {
          if (currentStory.musicTrack.audioUrl) {
              const music = new Audio(currentStory.musicTrack.audioUrl);
              music.loop = true;
              music.volume = 0.5;
              music.play().catch(() => {
                  // Fallback to Web Audio synthesizer if media playback fails
                  if (currentStory.musicTrack) {
                      playStoryMusicTrack(currentStory.musicTrack.id, 0.25);
                  }
              });
              musicAudioRef.current = music;
          } else {
              playStoryMusicTrack(currentStory.musicTrack.id, 0.25);
          }
      }

      return () => {
          stopStoryMusicTrack();
          if (musicAudioRef.current) {
              musicAudioRef.current.pause();
              musicAudioRef.current = null;
          }
      };
  }, [currentStory, isMuted, isPaused]);

  // Sync music pause/play when pausing or muting
  useEffect(() => {
      if (isPaused || isMuted) {
          stopStoryMusicTrack();
          if (musicAudioRef.current) {
              musicAudioRef.current.pause();
          }
      } else if (currentStory?.musicTrack) {
          if (musicAudioRef.current) {
              musicAudioRef.current.play().catch(() => {});
          } else if (!currentStory.musicTrack.audioUrl) {
              playStoryMusicTrack(currentStory.musicTrack.id, 0.25);
          }
      }
  }, [isPaused, isMuted, currentStory]);

  // Video Playback Control
  useEffect(() => {
      if (videoRef.current) {
          videoRef.current.muted = isMuted;
          if (isPaused) {
              videoRef.current.pause();
          } else {
              videoRef.current.play().catch(() => {});
          }
      }
  }, [isPaused, isMuted, currentStory]);

  // Story Progress Timer Logic
  useEffect(() => {
      let interval: any;
      const isCurrentVideo = currentStory ? isVideo(currentStory.mediaUrl) : false;

      if (currentStory && !isPaused && !showViewersModal && !showDeleteConfirm) {
          interval = setInterval(() => {
              setStoryProgress(prev => {
                  if (prev >= 100) {
                      navigateStory('next');
                      return 0;
                  }
                  if (isCurrentVideo && videoRef.current && !videoRef.current.paused && videoRef.current.duration) {
                      return (videoRef.current.currentTime / videoRef.current.duration) * 100;
                  }

                  if (musicAudioRef.current && musicAudioRef.current.duration && !musicAudioRef.current.paused) {
                      const totalDuration = Math.min(15, musicAudioRef.current.duration);
                      return Math.min(100, (musicAudioRef.current.currentTime / totalDuration) * 100);
                  }

                  // 15s for stories with music, 8s for standard image/text stories (smooth and non-rushed)
                  const storyDuration = currentStory.musicTrack ? 15000 : 8000;
                  const tickRate = (50 / storyDuration) * 100;
                  return prev + tickRate;
              });
          }, 50); 
      }
      return () => clearInterval(interval);
  }, [activeGroupIndex, currentStoryIndex, isPaused, showViewersModal, showDeleteConfirm, currentStory]);

  // Reset local state when story changes
  useEffect(() => {
      setStoryProgress(0);
      setIsStoryLiked(false);
      setCommentText('');
      setFloatingEmojis([]);
      setShowViewersModal(false);
      setShowDeleteConfirm(false);
  }, [activeGroupIndex, currentStoryIndex]);

  const navigateStory = (direction: 'next' | 'prev') => {
      if (!currentGroup) {
          onClose();
          return;
      }

      if (direction === 'next') {
          if (currentStoryIndex < currentGroup.stories.length - 1) {
              setCurrentStoryIndex(prev => prev + 1);
              setStoryProgress(0);
          } else if (activeGroupIndex < groups.length - 1) {
              setActiveGroupIndex(prev => prev + 1);
              setCurrentStoryIndex(0);
              setStoryProgress(0);
          } else {
              playAudio('pop');
              onClose();
          }
      } else {
          if (currentStoryIndex > 0) {
              setCurrentStoryIndex(prev => prev - 1);
              setStoryProgress(0);
          } else if (activeGroupIndex > 0) {
              setActiveGroupIndex(prev => prev - 1);
              const pGroup = groups[activeGroupIndex - 1];
              setCurrentStoryIndex(pGroup.stories.length - 1);
              setStoryProgress(0);
          } else {
              playAudio('pop');
              onClose();
          }
      }
  };

  const triggerEmoji = (char: string) => {
      playAudio('react');
      // If heart, float a green heart 💚
      const emojiChar = (char === "❤️" || char === "💚") ? "💚" : char;
      const newEmoji: FloatingEmoji = {
          id: Date.now() + Math.random(),
          char: emojiChar,
          left: Math.random() * 60 + 20 
      };
      setFloatingEmojis(prev => [...prev, newEmoji]);
      
      setTimeout(() => {
          setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
      }, 2000);
      
      if ((char === "❤️" || char === "💚") && !isStoryLiked) {
          setIsStoryLiked(true);
      }
  };

  const handleDeleteCurrentStory = () => {
      if (!currentStory) return;
      playAudio('pop');
      const deletingId = currentStory.id;
      
      if (onDeleteStory) {
          onDeleteStory(deletingId);
      }
      setShowDeleteConfirm(false);

      // Check remaining stories in current group
      const remainingInGroup = currentGroup.stories.filter(s => s.id !== deletingId);
      if (remainingInGroup.length === 0) {
          // If no stories left in this group, check if other groups exist
          if (groups.length <= 1) {
              onClose();
          } else if (activeGroupIndex < groups.length - 1) {
              setCurrentStoryIndex(0);
          } else {
              setActiveGroupIndex(Math.max(0, activeGroupIndex - 1));
              setCurrentStoryIndex(0);
          }
      } else {
          setCurrentStoryIndex(prev => Math.min(prev, remainingInGroup.length - 1));
          setStoryProgress(0);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (!ALLOWED_FILE_TYPES.includes(file.type)) {
              alert(language === 'ar' ? 'نوع الملف غير مدعوم' : 'Unsupported file type');
              playAudio('notification');
              return;
          }
          if (file.size > MAX_FILE_SIZE) {
              alert(language === 'ar' ? 'حجم الملف كبير جداً. الحد الأقصى هو 1 جيجابايت.' : 'File size too large. Max is 1GB.');
              playAudio('notification');
              return;
          }
          playAudio('upload_start');
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  onAddStory(reader.result);
                  playAudio('pop');
                  onClose(); 
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleClose = () => {
      if (musicAudioRef.current) {
          musicAudioRef.current.pause();
          musicAudioRef.current = null;
      }
      playAudio('pop');
      onClose();
  };

  const handleSendComment = () => {
      if (!commentText.trim()) return;
      playAudio('message_sent');
      setCommentText(''); 
      setIsPaused(false); 
      setShowSentNotification(true);
      setTimeout(() => setShowSentNotification(false), 2500);
  };

  const toggleLike = () => {
      if (!isStoryLiked) {
          playAudio('like');
          setIsStoryLiked(true);
          triggerEmoji("💚");
      } else {
          playAudio('pop');
          setIsStoryLiked(false);
      }
  };

  if (!currentStory) {
      return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 text-white flex flex-col animate-fadeIn overflow-hidden select-none touch-none backdrop-blur-md" dir={dir}>
        <input 
            type="file" 
            ref={storyInputRef} 
            className="hidden" 
            accept="image/*,video/mp4,video/webm" 
            onChange={handleFileChange} 
        />

        {/* Floating Emojis */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {floatingEmojis.map(emoji => (
                <div key={emoji.id} className="absolute bottom-28 text-5xl animate-float" style={{ left: `${emoji.left}%` }}>{emoji.char}</div>
            ))}
            
            {showSentNotification && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-float flex flex-col items-center">
                    <div className="bg-emerald-500 p-3 rounded-full shadow-2xl border-2 border-white/20 mb-2">
                        <Check className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white text-xs font-bold bg-black/80 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                        {t.story_reply_sent || (language === 'ar' ? 'تم إرسال الرد بنجاح' : 'Reply sent successfully')}
                    </span>
                </div>
            )}
        </div>

        {/* Top Header & Progress Bars */}
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-40">
            {/* Story Progress Indicators */}
            <div className="flex gap-1.5 mb-3">
                {currentGroup.stories.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-white transition-all duration-100 ease-linear ${idx === currentStoryIndex ? '' : idx < currentStoryIndex ? 'w-full' : 'w-0'}`}
                          style={{ width: idx === currentStoryIndex ? `${storyProgress}%` : undefined }}
                        ></div>
                    </div>
                ))}
            </div>

            {/* Author Info, Music Badge & Control Buttons */}
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-3">
                    <img src={currentStory.userAvatar} className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-lg object-cover" alt="avatar" />
                    <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                             <span className="font-bold text-sm hover:underline cursor-pointer drop-shadow-md">{currentStory.userName}</span>
                             {currentStory.musicTrack && (
                                 <div className="flex items-center gap-1 bg-emerald-600/90 text-white text-[11px] px-2 py-0.5 rounded-full shadow backdrop-blur-sm animate-pulse">
                                     <Disc className="w-3 h-3 animate-spin text-emerald-200" />
                                     <span className="max-w-[110px] truncate">{currentStory.musicTrack.title}</span>
                                 </div>
                             )}
                         </div>
                         <span className="text-xs text-white/80 drop-shadow-md">{currentStory.timestamp}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Video / Music Mute Button */}
                    {(isVideo(currentStory.mediaUrl) || currentStory.musicTrack) && (
                        <button 
                            onClick={() => { playAudio('pop'); setIsMuted(!isMuted); }} 
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white"
                            title={isMuted ? (language === 'ar' ? 'تشغيل الصوت' : 'Unmute') : (language === 'ar' ? 'كتم الصوت' : 'Mute')}
                        >
                            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
                        </button>
                    )}

                    {/* Delete Story Button (Own Story) */}
                    {isOwnStory && (
                        <button 
                            onClick={() => { playAudio('pop'); setIsPaused(true); setShowDeleteConfirm(true); }} 
                            className="p-2 bg-red-600/30 hover:bg-red-600/60 rounded-full transition text-red-200 hover:text-white"
                            title={language === 'ar' ? 'حذف القصة' : 'Delete Story'}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}

                    {/* Add Story Button (Own Story) */}
                    {isOwnStory && (
                        <button 
                            onClick={() => { playAudio('pop'); storyInputRef.current?.click(); }} 
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition" 
                            title={language === 'ar' ? 'إضافة قصة جديدة' : 'Add story'}
                        >
                            <Plus className="w-5 h-5 text-white" />
                        </button>
                    )}

                    {/* Pause / Play */}
                    <button onClick={() => { playAudio('pop'); setIsPaused(!isPaused); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
                        {isPaused ? <Play className="w-5 h-5 fill-current text-emerald-400" /> : <Pause className="w-5 h-5 fill-current" />}
                    </button>

                    {/* Close Viewer */}
                    <button onClick={handleClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition hover:rotate-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>

        {/* Main Content Area with Side Previews on Desktop */}
        <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden px-4 md:px-16">
            
            {/* Desktop Left Side Preview */}
            {prevGroup && (
                <div 
                    onClick={() => { playAudio('pop'); setActiveGroupIndex(activeGroupIndex - 1); setCurrentStoryIndex(0); }}
                    className="hidden lg:flex flex-col items-center justify-center absolute left-8 top-1/2 -translate-y-1/2 z-20 w-44 h-80 rounded-2xl overflow-hidden cursor-pointer opacity-40 hover:opacity-80 transition transform hover:scale-105 border border-white/20 bg-gray-900 shadow-2xl"
                >
                    {isVideo(prevGroup.stories[0].mediaUrl) ? (
                        <video src={prevGroup.stories[0].mediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                        <img src={prevGroup.stories[0].mediaUrl} className="w-full h-full object-cover" alt="prev" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 text-center">
                        <img src={prevGroup.userAvatar} className="w-10 h-10 rounded-full border border-white mb-2" alt="avatar" />
                        <span className="text-xs font-bold text-white drop-shadow">{prevGroup.userName}</span>
                    </div>
                </div>
            )}

            {/* Active Story Card Container */}
            <div className="max-w-md w-full h-full flex items-center justify-center relative z-10">
                {isVideo(currentStory.mediaUrl) ? (
                    <video 
                      ref={videoRef} 
                      src={currentStory.mediaUrl} 
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                      autoPlay 
                      playsInline 
                      onEnded={() => navigateStory('next')}
                    />
                ) : (
                    <img src={currentStory.mediaUrl} alt="Story" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl pointer-events-none" draggable={false}/>
                )}
            </div>

            {/* Desktop Right Side Preview */}
            {nextGroup && (
                <div 
                    onClick={() => { playAudio('pop'); setActiveGroupIndex(activeGroupIndex + 1); setCurrentStoryIndex(0); }}
                    className="hidden lg:flex flex-col items-center justify-center absolute right-8 top-1/2 -translate-y-1/2 z-20 w-44 h-80 rounded-2xl overflow-hidden cursor-pointer opacity-40 hover:opacity-80 transition transform hover:scale-105 border border-white/20 bg-gray-900 shadow-2xl"
                >
                    {isVideo(nextGroup.stories[0].mediaUrl) ? (
                        <video src={nextGroup.stories[0].mediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                        <img src={nextGroup.stories[0].mediaUrl} className="w-full h-full object-cover" alt="next" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 text-center">
                        <img src={nextGroup.userAvatar} className="w-10 h-10 rounded-full border border-white mb-2" alt="avatar" />
                        <span className="text-xs font-bold text-white drop-shadow">{nextGroup.userName}</span>
                    </div>
                </div>
            )}
            
            {/* Navigation Click Hotspots */}
            <div className="absolute inset-0 flex z-30 pointer-events-auto">
                <div className="w-1/3 h-full cursor-pointer" onClick={() => navigateStory('prev')}></div>
                <div className="w-1/3 h-full cursor-pointer" onClick={() => { playAudio('pop'); setIsPaused(!isPaused); }}></div>
                <div className="w-1/3 h-full cursor-pointer" onClick={() => navigateStory('next')}></div>
            </div>

            {/* Visual Nav Arrows */}
            <button 
                className={`hidden md:flex absolute ${dir === 'rtl' ? 'right-12' : 'left-12'} top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full z-50 text-white transition hover:scale-110 active:scale-95 border border-white/10`} 
                onClick={() => navigateStory('prev')}
            >
                {dir === 'rtl' ? <ChevronRight className="w-7 h-7" /> : <ChevronLeft className="w-7 h-7" />}
            </button>
            <button 
                className={`hidden md:flex absolute ${dir === 'rtl' ? 'left-12' : 'right-12'} top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full z-50 text-white transition hover:scale-110 active:scale-95 border border-white/10`} 
                onClick={() => navigateStory('next')}
            >
                {dir === 'rtl' ? <ChevronLeft className="w-7 h-7" /> : <ChevronRight className="w-7 h-7" />}
            </button>
        </div>

        {/* Footer / Interaction Bar */}
        <div className="w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-10 pb-6 px-4 z-40 flex flex-col gap-3">
            {/* Quick Reaction Emojis Bar */}
            {showEmojiQuickBar && (
                <div className="flex justify-center gap-2 mb-1 overflow-x-auto no-scrollbar pb-1 px-4 animate-fadeIn">
                    {REACTION_EMOJIS.map(emoji => (
                        <button 
                            key={emoji} 
                            onClick={() => triggerEmoji(emoji)} 
                            className="text-2xl hover:scale-125 transition active:scale-90 cursor-pointer bg-white/10 backdrop-blur-md rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center hover:bg-white/20 border border-white/10"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Permanent Comment Input + Fixed Heart Button */}
            <div className="flex items-center gap-2.5 max-w-xl mx-auto w-full">
                {/* Permanent Comment Input Field */}
                <div className="flex-1 relative flex items-center">
                    <input 
                      type="text" 
                      placeholder={t.story_reply_placeholder || (language === 'ar' ? "رد على القصة..." : "Reply to story...")} 
                      className={`w-full bg-white/15 backdrop-blur-md border border-white/20 rounded-full py-3 ${dir === 'rtl' ? 'pr-4 pl-24' : 'pl-4 pr-24'} text-white placeholder-white/60 focus:border-emerald-500/80 focus:bg-white/20 outline-none transition text-sm shadow-inner`}
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)} 
                      onFocus={() => setIsPaused(true)} 
                      onBlur={() => !commentText && setIsPaused(false)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendComment(); }}
                      dir={dir}
                    />
                    
                    <div className={`absolute ${dir === 'rtl' ? 'left-2' : 'right-2'} flex items-center gap-1`}>
                        {commentText.trim() ? (
                            <button 
                                onClick={handleSendComment} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full transition transform active:scale-95 shadow-md flex items-center justify-center"
                                title={language === 'ar' ? 'إرسال' : 'Send'}
                            >
                                <Send className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : 'rotate-0'}`} />
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={() => { playAudio('pop'); setShowEmojiQuickBar(!showEmojiQuickBar); }}
                                className="p-2 text-white/70 hover:text-white transition rounded-full hover:bg-white/10"
                                title={language === 'ar' ? 'التفاعلات' : 'Reactions'}
                            >
                                <Smile className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* FIXED Heart-Shaped Like Button (Turns Dark Green when liked) */}
                <button 
                    type="button"
                    onClick={toggleLike} 
                    className={`p-3 rounded-full transition-all duration-300 transform active:scale-90 shadow-xl flex-shrink-0 flex items-center justify-center border ${
                        isStoryLiked 
                          ? 'bg-emerald-800 text-white border-emerald-600 shadow-emerald-950/80 ring-2 ring-emerald-500/50' 
                          : 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'
                    }`}
                    title={isStoryLiked ? (language === 'ar' ? 'تم الإعجاب' : 'Liked') : (language === 'ar' ? 'إعجاب' : 'Like')}
                >
                    <Heart className={`w-6 h-6 transition-all ${isStoryLiked ? 'fill-white text-white scale-110' : 'text-white'}`} />
                </button>

                {/* Story Viewers Counter Button for Story Owner */}
                {isOwnStory && (
                    <button 
                        type="button"
                        onClick={() => { playAudio('pop'); setIsPaused(true); setShowViewersModal(true); }}
                        className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full text-white font-bold text-xs flex items-center justify-center gap-1.5 transition flex-shrink-0 shadow-lg"
                        title={language === 'ar' ? 'المشاهدات' : 'Views'}
                    >
                        <Eye className="w-5 h-5 text-emerald-400" />
                        <span className="hidden sm:inline">5</span>
                    </button>
                )}
            </div>
        </div>

        {/* Viewers List Modal for Owner */}
        {showViewersModal && (
            <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn" dir={dir}>
                <div className="bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[80vh] flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-base font-bold text-white">
                                {language === 'ar' ? 'من شاهد قصتك' : 'Story Viewers'}
                            </h3>
                        </div>
                        <button onClick={() => { setShowViewersModal(false); setIsPaused(false); }} className="p-1 text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
                        {MOCK_VIEWERS.map((v, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition">
                                <div className="flex items-center gap-3">
                                    <img src={v.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-700" alt="avatar" />
                                    <div>
                                        <div className="font-bold text-sm text-white">{v.name}</div>
                                        <div className="text-xs text-gray-400">{v.time}</div>
                                    </div>
                                </div>
                                {v.reaction && (
                                    <span className="text-xl bg-white/10 px-2.5 py-1 rounded-full border border-white/10">{v.reaction}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
            <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" dir={dir}>
                <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                        {language === 'ar' ? 'حذف القصة؟' : 'Delete Story?'}
                    </h3>
                    <p className="text-xs text-gray-400">
                        {language === 'ar' ? 'هل أنت تأكد من أنك تريد حذف هذه القصة؟ لا يمكن التراجع عن هذه الخطوة.' : 'Are you sure you want to delete this story?'}
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => { setShowDeleteConfirm(false); setIsPaused(false); }}
                            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 font-bold text-sm hover:bg-gray-800 transition"
                        >
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button 
                            onClick={handleDeleteCurrentStory}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition shadow-lg"
                        >
                            {language === 'ar' ? 'حذف' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>,
    document.body
  );
};

export default StoryViewer;
