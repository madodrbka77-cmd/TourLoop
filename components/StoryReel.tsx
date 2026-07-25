import React, { useRef, useState } from 'react';
import { Plus, X, AlertCircle, Type, Image as ImageIcon, ChevronLeft, ChevronRight, Palette, Music, Disc, Volume2 } from 'lucide-react';
import { User, Story, StoryMusicTrack } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { playAudio } from '../utils/audio';

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];

const GRADIENTS = [
    { id: 'emerald', name: 'زمردي', class: 'from-emerald-600 to-teal-900', bg: 'linear-gradient(to bottom right, #059669, #134e4a)' },
    { id: 'sunset', name: 'غروب', class: 'from-orange-500 to-pink-600', bg: 'linear-gradient(to bottom right, #f97316, #db2777)' },
    { id: 'midnight', name: 'ليل', class: 'from-slate-900 to-indigo-950', bg: 'linear-gradient(to bottom right, #0f172a, #1e1b4b)' },
    { id: 'purple', name: 'بنفسجي', class: 'from-purple-600 to-indigo-800', bg: 'linear-gradient(to bottom right, #9333ea, #3730a3)' },
    { id: 'ocean', name: 'محيط', class: 'from-cyan-500 to-blue-700', bg: 'linear-gradient(to bottom right, #06b6d4, #1d4ed8)' },
    { id: 'neon', name: 'نيون', class: 'from-fuchsia-600 to-rose-600', bg: 'linear-gradient(to bottom right, #c026d3, #e11d48)' }
];

export const STORY_MUSIC_TRACKS: StoryMusicTrack[] = [
    {
      id: 'track_1',
      title: 'نغمة هادئة (Chill Lo-Fi)',
      artist: 'Lofi Beats',
      genre: 'Lo-Fi',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3'
    },
    {
      id: 'track_2',
      title: 'عزف جيتار (Acoustic Sun)',
      artist: 'Acoustic Vibes',
      genre: 'Acoustic',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-sun-and-sky-567.mp3'
    },
    {
      id: 'track_3',
      title: 'بيانو كلاسيك (Soft Piano)',
      artist: 'Classical Dreams',
      genre: 'Piano',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-gospel-114.mp3'
    },
    {
      id: 'track_4',
      title: 'إيقاع حماسي (Upbeat Energy)',
      artist: 'Pop Energy',
      genre: 'Pop',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3'
    },
    {
      id: 'track_5',
      title: 'رومانسية (Sweet Moment)',
      artist: 'Romantic Strings',
      genre: 'Romantic',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-feeling-happy-5.mp3'
    }
];

export interface UserStoryGroup {
    userId: string;
    userName: string;
    userAvatar: string;
    stories: Story[];
    latestTimestamp: number;
}

interface StoryReelProps {
  currentUser: User;
  groups: UserStoryGroup[];
  onAddStory: (mediaUrl: string, type?: 'image' | 'text', musicTrack?: StoryMusicTrack) => void;
  onViewStory: (index: number) => void;
}

const StoryReel: React.FC<StoryReelProps> = ({ currentUser, groups, onAddStory, onViewStory }) => {
  const { t, language, dir } = useLanguage();
  const storyInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTextComposer, setShowTextComposer] = useState(false);
  
  // Text Story States
  const [storyText, setStoryText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [selectedMusic, setSelectedMusic] = useState<StoryMusicTrack | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleScroll = (direction: 'left' | 'right') => {
      playAudio('pop');
      if (scrollContainerRef.current) {
          const scrollAmount = direction === 'left' ? -280 : 280;
          scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
  };

  const handleTogglePreviewAudio = (track: StoryMusicTrack) => {
      if (playingAudioId === track.id) {
          if (audioPreviewRef.current) {
              audioPreviewRef.current.pause();
          }
          setPlayingAudioId(null);
      } else {
          if (audioPreviewRef.current) {
              audioPreviewRef.current.pause();
          }
          const newAudio = new Audio(track.audioUrl);
          newAudio.volume = 0.5;
          newAudio.play().catch(() => {});
          audioPreviewRef.current = newAudio;
          setPlayingAudioId(track.id);
      }
  };

  const stopAudioPreview = () => {
      if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
          audioPreviewRef.current = null;
      }
      setPlayingAudioId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadError(null);
      const file = e.target.files?.[0];
      if (file) {
          if (!ALLOWED_FILE_TYPES.includes(file.type)) {
              setUploadError(language === 'ar' ? 'نوع الملف غير مدعوم. يرجى اختيار صورة أو فيديو صالح.' : 'Unsupported file type. Please choose a valid image or video.');
              playAudio('notification');
              e.target.value = '';
              return;
          }

          if (file.size > MAX_FILE_SIZE) {
              setUploadError(language === 'ar' ? 'حجم الملف كبير جداً. الحد الأقصى هو 1 جيجابايت.' : 'File size too large. Max is 1GB.');
              playAudio('notification');
              e.target.value = '';
              return;
          }

          playAudio('upload_start');
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  onAddStory(reader.result, 'image', selectedMusic || undefined);
                  stopAudioPreview();
                  setShowCreateModal(false);
              }
          };
          reader.readAsDataURL(file);
      }
      e.target.value = ''; 
  };

  const handleCreateTextStory = () => {
      if (!storyText.trim()) return;
      playAudio('upload_start');

      // Create a canvas element to render the text story into a dataURL image
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      if (ctx) {
          // Draw Gradient Background
          const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
          if (selectedGradient.id === 'emerald') {
              grad.addColorStop(0, '#059669');
              grad.addColorStop(1, '#134e4a');
          } else if (selectedGradient.id === 'sunset') {
              grad.addColorStop(0, '#f97316');
              grad.addColorStop(1, '#db2777');
          } else if (selectedGradient.id === 'midnight') {
              grad.addColorStop(0, '#0f172a');
              grad.addColorStop(1, '#1e1b4b');
          } else if (selectedGradient.id === 'purple') {
              grad.addColorStop(0, '#9333ea');
              grad.addColorStop(1, '#3730a3');
          } else if (selectedGradient.id === 'ocean') {
              grad.addColorStop(0, '#06b6d4');
              grad.addColorStop(1, '#1d4ed8');
          } else {
              grad.addColorStop(0, '#c026d3');
              grad.addColorStop(1, '#e11d48');
          }

          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw Text
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 64px Tajawal, Cairo, sans-serif';

          // Word Wrap Logic
          const words = storyText.split(' ');
          let line = '';
          const lines: string[] = [];
          const maxWidth = 880;

          for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > maxWidth && n > 0) {
                  lines.push(line);
                  line = words[n] + ' ';
              } else {
                  line = testLine;
              }
          }
          lines.push(line);

          const lineHeight = 90;
          const startY = (1920 - (lines.length * lineHeight)) / 2;

          lines.forEach((l, idx) => {
              ctx.fillText(l.trim(), 540, startY + (idx * lineHeight));
          });

          const dataUrl = canvas.toDataURL('image/png');
          onAddStory(dataUrl, 'text', selectedMusic || undefined);
          stopAudioPreview();
          setStoryText('');
          setShowTextComposer(false);
          setShowCreateModal(false);
          playAudio('pop');
      }
  };

  const isVideo = (url: string) => {
      return url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
  };

  const renderSegmentedCircle = (count: number, avatarUrl: string) => {
      const strokeColor = '#047857'; // Emerald-700
      const radius = 22;
      const circumference = 2 * Math.PI * radius;
      const gap = count > 1 ? 5 : 0;
      const totalGap = gap * count;
      const dashLength = (circumference - totalGap) / count;

      return (
          <div className="relative w-10 h-10 flex-shrink-0">
              <svg viewBox="0 0 52 52" className="absolute inset-0 w-full h-full transform -rotate-90">
                  <defs>
                      <linearGradient id="storyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#047857" />
                          <stop offset="100%" stopColor="#065F46" />
                      </linearGradient>
                  </defs>
                  {count === 1 ? (
                      <circle cx="26" cy="26" r={radius} fill="none" stroke="url(#storyGradient)" strokeWidth="3" />
                  ) : (
                      Array.from({ length: count }).map((_, i) => (
                          <circle
                              key={i}
                              cx="26" cy="26" r={radius}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="3"
                              strokeDasharray={`${Math.max(0, dashLength)} ${gap}`}
                              strokeDashoffset={-((dashLength + gap) * i)}
                              strokeLinecap="round"
                          />
                      ))
                  )}
              </svg>
              <img 
                  src={avatarUrl} 
                  className="absolute inset-[5px] w-[calc(100%-10px)] h-[calc(100%-10px)] rounded-full object-cover border-2 border-white dark:border-gray-800"
                  alt="avatar"
              />
          </div>
      );
  };

  return (
    <>
      <input 
        type="file" 
        ref={storyInputRef} 
        className="hidden" 
        accept="image/*,video/mp4,video/webm" 
        onChange={handleFileChange} 
      />

      {uploadError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center justify-between border border-red-100 dark:border-red-800 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{uploadError}</span>
              </div>
              <button onClick={() => setUploadError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded-full transition">
                  <X className="w-4 h-4" />
              </button>
          </div>
      )}

      {/* Reel Wrapper with Desktop Scroll Controls */}
      <div className="relative group/reel mb-4">
          <button 
              onClick={() => handleScroll('left')} 
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition opacity-0 group-hover/reel:opacity-100"
          >
              <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
              onClick={() => handleScroll('right')} 
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition opacity-0 group-hover/reel:opacity-100"
          >
              <ChevronRight className="w-6 h-6" />
          </button>

          <div 
              ref={scrollContainerRef}
              className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar px-1 scroll-smooth"
          >
             {/* Add Story Card */}
             <div 
                className="relative h-48 w-28 md:w-32 rounded-2xl overflow-hidden cursor-pointer shadow-md flex-shrink-0 group bg-gray-100 dark:bg-gray-800 border border-emerald-100 dark:border-gray-700 hover:scale-[1.02] transition duration-200"
                onClick={() => { playAudio('pop'); setShowCreateModal(true); }}
             >
                 <div className="h-2/3 w-full relative">
                     <img src={currentUser.avatar} className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-85" alt="My Story" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                 </div>
                 <div className="h-1/3 bg-white dark:bg-gray-800 relative z-10 flex flex-col items-center justify-end pb-2">
                     <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 rounded-full p-1.5 border-4 border-white dark:border-gray-800 shadow-md">
                         <Plus className="h-4 w-4 text-white" />
                     </div>
                     <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {t.story_create || (language === 'ar' ? 'إنشاء قصة' : 'Create Story')}
                     </span>
                 </div>
             </div>

             {/* Render Grouped Stories */}
             {groups.map((group, index) => (
                 <div 
                    key={group.userId} 
                    onClick={() => { playAudio('pop'); onViewStory(index); }}
                    className="relative h-48 w-28 md:w-32 rounded-2xl overflow-hidden cursor-pointer shadow-md flex-shrink-0 group border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 hover:scale-[1.02] transition duration-200"
                 >
                    {/* Show LATEST story thumbnail */}
                    {group.stories.length > 0 && (
                        isVideo(group.stories[0].mediaUrl) ? (
                            <video 
                                src={group.stories[0].mediaUrl} 
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                muted
                            />
                        ) : (
                            <img 
                                src={group.stories[0].mediaUrl} 
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105" 
                                alt="Story" 
                            />
                        )
                    )}
                    
                    <div className="absolute top-2 left-2 z-20">
                        {renderSegmentedCircle(group.stories.length, group.userAvatar)}
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/75 group-hover:to-black/85 transition"></div>
                    
                    {/* Music Indicator Badge if music is attached */}
                    {group.stories[0]?.musicTrack && (
                        <div className="absolute top-2 right-2 bg-emerald-600/90 text-white p-1 rounded-full shadow-md backdrop-blur-sm animate-pulse">
                            <Music className="w-3 h-3" />
                        </div>
                    )}

                    <div className="absolute bottom-2 right-2 text-white font-bold text-xs drop-shadow-md truncate w-11/12 text-right pr-2">
                        {group.userId === currentUser.id ? (t.story_your_story || (language === 'ar' ? 'قصتك' : 'Your Story')) : group.userName}
                    </div>
                 </div>
             ))}
          </div>
      </div>

      {/* Select Story Type Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" dir={dir}>
              <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>{language === 'ar' ? 'إنشاء قصة جديدة' : 'Create New Story'}</span>
                      </h3>
                      <button onClick={() => { stopAudioPreview(); setShowCreateModal(false); }} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {/* Story Music Selector */}
                  <div className="my-4 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50">
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                              <Music className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                  {language === 'ar' ? 'إضافة خلفية موسيقية (اختياري)' : 'Add Background Music (Optional)'}
                              </span>
                          </div>
                          {selectedMusic && (
                              <button 
                                  onClick={() => { setSelectedMusic(null); stopAudioPreview(); }}
                                  className="text-xs text-red-500 hover:underline font-semibold"
                              >
                                  {language === 'ar' ? 'إلغاء الموسيقى' : 'Remove'}
                              </button>
                          )}
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {STORY_MUSIC_TRACKS.map(track => {
                              const isSelected = selectedMusic?.id === track.id;
                              const isPlaying = playingAudioId === track.id;
                              return (
                                  <div 
                                      key={track.id}
                                      onClick={() => {
                                          playAudio('pop');
                                          setSelectedMusic(track);
                                          handleTogglePreviewAudio(track);
                                      }}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer text-xs font-bold transition flex-shrink-0 border ${
                                          isSelected 
                                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-emerald-400'
                                      }`}
                                  >
                                      <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin text-emerald-300' : ''}`} />
                                      <span>{track.title}</span>
                                      {isPlaying && <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />}
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                  {!showTextComposer ? (
                      <div className="grid grid-cols-2 gap-4 py-4">
                          <button 
                              onClick={() => { playAudio('pop'); storyInputRef.current?.click(); }}
                              className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/40 border border-emerald-200 dark:border-emerald-800 hover:scale-105 transition shadow-sm text-emerald-800 dark:text-emerald-200"
                          >
                              <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                  <ImageIcon className="w-7 h-7" />
                              </div>
                              <span className="font-bold text-sm">
                                  {language === 'ar' ? 'قصة وسائط' : 'Media Story'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  {language === 'ar' ? 'صورة أو فيديو' : 'Photo or Video'}
                              </span>
                          </button>

                          <button 
                              onClick={() => { playAudio('pop'); setShowTextComposer(true); }}
                              className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/40 dark:to-pink-900/40 border border-purple-200 dark:border-purple-800 hover:scale-105 transition shadow-sm text-purple-800 dark:text-purple-200"
                          >
                              <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                  <Type className="w-7 h-7" />
                              </div>
                              <span className="font-bold text-sm">
                                  {language === 'ar' ? 'قصة نصية' : 'Text Story'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  {language === 'ar' ? 'نص وخلفيات ملونة' : 'Text & Colors'}
                              </span>
                          </button>
                      </div>
                  ) : (
                      <div className="py-2 space-y-4">
                          {/* Live Text Story Preview */}
                          <div 
                              className={`w-full h-56 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-white font-bold text-xl shadow-inner overflow-hidden transition-all duration-300 relative ${selectedGradient.class}`}
                              style={{ background: selectedGradient.bg }}
                          >
                              {selectedMusic && (
                                  <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs flex items-center gap-1.5 text-white">
                                      <Disc className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                      <span>{selectedMusic.title}</span>
                                  </div>
                              )}
                              <span>{storyText.trim() ? storyText : (language === 'ar' ? 'اكتب قصتك هنا...' : 'Type your story...')}</span>
                          </div>

                          {/* Gradient Selector */}
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                  <Palette className="w-4 h-4 text-emerald-600" />
                                  {language === 'ar' ? 'اختر الخلفية:' : 'Select Gradient:'}
                              </label>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                  {GRADIENTS.map(grad => (
                                      <button 
                                          key={grad.id}
                                          onClick={() => setSelectedGradient(grad)}
                                          className={`w-9 h-9 rounded-full flex-shrink-0 border-2 transition ${selectedGradient.id === grad.id ? 'border-emerald-600 scale-110 shadow' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                          style={{ background: grad.bg }}
                                      />
                                  ))}
                              </div>
                          </div>

                          {/* Text Input */}
                          <textarea 
                              value={storyText}
                              onChange={(e) => setStoryText(e.target.value)}
                              placeholder={language === 'ar' ? 'اكتب نص القصة...' : 'Type story text...'}
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600 resize-none h-20"
                          />

                          <div className="flex gap-2 pt-1">
                              <button 
                                  onClick={() => setShowTextComposer(false)}
                                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                  {language === 'ar' ? 'تراجع' : 'Back'}
                              </button>
                              <button 
                                  onClick={handleCreateTextStory}
                                  disabled={!storyText.trim()}
                                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition shadow-md"
                              >
                                  {language === 'ar' ? 'نشر القصة' : 'Post Story'}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </>
  );
};

export default StoryReel;
