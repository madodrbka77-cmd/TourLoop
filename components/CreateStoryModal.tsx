import React, { useRef, useState, useMemo, useEffect } from 'react';
import { 
  X, AlertCircle, Type, Image as ImageIcon, ChevronLeft, ChevronRight, 
  ChevronDown, ChevronUp, Music, Disc, Volume2, Search, Check, Music2, Loader2 
} from 'lucide-react';
import { User, StoryMusicTrack } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { playAudio, playStoryMusicTrack, stopStoryMusicTrack } from '../utils/audio';
import { STORY_FONTS, STORY_BACKGROUNDS, StoryFontOption, StoryBackgroundOption } from './StoryReel';

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAddStory?: (mediaUrl: string, type?: 'image' | 'text', musicTrack?: StoryMusicTrack) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAddStory
}) => {
  const { t, language, dir } = useLanguage();
  const storyInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showTextComposer, setShowTextComposer] = useState(false);

  // Text Story & Music States
  const [storyText, setStoryText] = useState('');
  const [selectedFont, setSelectedFont] = useState<StoryFontOption>(STORY_FONTS[0]);
  const [selectedBackground, setSelectedBackground] = useState<StoryBackgroundOption>(STORY_BACKGROUNDS[0]);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [isExpandedBackgrounds, setIsExpandedBackgrounds] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<StoryMusicTrack | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicCategoryFilter, setMusicCategoryFilter] = useState('الكل');
  const [liveSearchResults, setLiveSearchResults] = useState<StoryMusicTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);

  const categories = language === 'ar' 
    ? ['الكل', 'تريند', 'عربي', 'أجنبي', 'تامر حسني', 'عمرو دياب', 'شيرين', 'Pop', 'راب', 'رومانسية', 'طرب', 'هادئ'] 
    : ['All', 'Trending', 'Arabic', 'Foreign', 'Tamer Hosny', 'Amr Diab', 'Sherine', 'Pop', 'Rap', 'Romantic', 'Classics', 'Chill'];

  const handleCategoryScroll = (direction: 'left' | 'right') => {
      playAudio('pop');
      if (categoryScrollRef.current) {
          const scrollAmount = direction === 'left' ? 180 : -180;
          categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
  };

  // Live iTunes API Music Search Effect
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const query = musicSearchQuery.trim();
    const isAllCategory = musicCategoryFilter === 'الكل' || musicCategoryFilter === 'All';

    setIsSearchingMusic(true);
    const searchTimer = setTimeout(async () => {
      try {
        let searchTerm = query;
        if (!searchTerm) {
          if (isAllCategory) {
            searchTerm = 'Amr Diab Sherine Tamer Hosny Ed Sheeran Taylor Swift Adele';
          } else if (musicCategoryFilter === 'تريند' || musicCategoryFilter === 'Trending') {
            searchTerm = 'Trending Top Hits Popular 2026';
          } else if (musicCategoryFilter === 'عربي' || musicCategoryFilter === 'Arabic') {
            searchTerm = 'عمرو دياب تامر حسني شيرين حماقي أصالة نانسي عجرم حسين الجسمي';
          } else if (musicCategoryFilter === 'أجنبي' || musicCategoryFilter === 'Foreign') {
            searchTerm = 'Ed Sheeran Taylor Swift Bruno Mars Coldplay Adele Justin Bieber Drake Maroon 5 The Weeknd';
          } else if (musicCategoryFilter === 'راب' || musicCategoryFilter === 'Rap') {
            searchTerm = 'Rap Hip Hop Wegz Marwan Pablo Eminem Drake';
          } else if (musicCategoryFilter === 'رومانسية' || musicCategoryFilter === 'Romantic') {
            searchTerm = 'Love Songs Romantic Arab Hits';
          } else if (musicCategoryFilter === 'طرب' || musicCategoryFilter === 'Classics') {
            searchTerm = 'فيروز أم كلثوم عبد الحليم حافظ محمد عبد الوهاب وردة';
          } else if (musicCategoryFilter === 'هادئ' || musicCategoryFilter === 'Chill') {
            searchTerm = 'Lo-Fi Chill Relaxing Acoustic Piano';
          } else {
            searchTerm = musicCategoryFilter;
          }
        }

        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=35`);
        if (response.ok) {
          const data = await response.json();
          if (!isCancelled && data.results) {
            const mappedTracks: StoryMusicTrack[] = data.results.map((item: any) => ({
              id: `itunes_${item.trackId}`,
              title: item.trackName || 'أغنية بدون عنوان',
              artist: item.artistName || 'فنان',
              genre: item.primaryGenreName || 'موسيقى',
              audioUrl: item.previewUrl,
              coverUrl: item.artworkUrl100 || item.artworkUrl60
            }));
            setLiveSearchResults(mappedTracks);
          }
        }
      } catch (err) {
        console.error('iTunes Search Error:', err);
      } finally {
        if (!isCancelled) {
          setIsSearchingMusic(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(searchTimer);
    };
  }, [musicSearchQuery, musicCategoryFilter, isOpen]);

  const filteredMusicTracks = useMemo(() => {
    return liveSearchResults;
  }, [liveSearchResults]);

  const handleTogglePreviewAudio = (track: StoryMusicTrack) => {
      if (playingAudioId === track.id) {
          stopAudioPreview();
      } else {
          stopAudioPreview();
          if (track.audioUrl) {
              const newAudio = new Audio(track.audioUrl);
              newAudio.volume = 0.5;
              newAudio.play().then(() => {
                  audioPreviewRef.current = newAudio;
              }).catch(() => {
                  playStoryMusicTrack(track.id, 0.3);
              });
          } else {
              playStoryMusicTrack(track.id, 0.3);
          }
          setPlayingAudioId(track.id);
      }
  };

  const stopAudioPreview = () => {
      stopStoryMusicTrack();
      if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
          audioPreviewRef.current = null;
      }
      setPlayingAudioId(null);
  };

  const handleClose = () => {
      stopAudioPreview();
      setShowTextComposer(false);
      setStoryText('');
      setUploadError(null);
      onClose();
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
                  if (onAddStory) {
                      onAddStory(reader.result, 'image', selectedMusic || undefined);
                  }
                  handleClose();
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
          // Draw Selected Background
          if (selectedBackground.canvasStops && selectedBackground.canvasStops.length > 1) {
              const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
              const stops = selectedBackground.canvasStops;
              stops.forEach((color, idx) => {
                  grad.addColorStop(idx / (stops.length - 1), color);
              });
              ctx.fillStyle = grad;
          } else {
              ctx.fillStyle = selectedBackground.canvasStops?.[0] || selectedBackground.bg || '#1d4ed8';
          }
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw Text using Selected Font
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const fontBold = selectedFont.weight === '900' ? '900' : 'bold';
          ctx.font = `${fontBold} 64px ${selectedFont.family}`;

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

          const lineHeight = 95;
          const startY = (1920 - (lines.length * lineHeight)) / 2;

          lines.forEach((l, idx) => {
              ctx.fillText(l.trim(), 540, startY + (idx * lineHeight));
          });

          const dataUrl = canvas.toDataURL('image/png');
          if (onAddStory) {
              onAddStory(dataUrl, 'text', selectedMusic || undefined);
          }
          handleClose();
          playAudio('pop');
      }
  };

  if (!isOpen) return null;

  return (
    <>
      <input 
        type="file" 
        ref={storyInputRef} 
        className="hidden" 
        accept="image/*,video/mp4,video/webm" 
        onChange={handleFileChange} 
      />

      <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-14 sm:pt-16 pb-4 px-2 sm:px-4 overflow-y-auto animate-fadeIn" dir={dir}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[82vh] sm:max-h-[85vh] flex flex-col my-0">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>{language === 'ar' ? 'إنشاء قصة جديدة' : 'Create New Story'}</span>
                  </h3>
                  <button onClick={handleClose} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                      <X className="w-5 h-5" />
                  </button>
              </div>

              {uploadError && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 rounded-xl mt-2 flex items-center justify-between border border-red-100 dark:border-red-800 shadow-sm animate-fadeIn text-xs">
                      <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{uploadError}</span>
                      </div>
                      <button onClick={() => setUploadError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded-full transition">
                          <X className="w-3.5 h-3.5" />
                      </button>
                  </div>
              )}

              <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-3 py-2">
                  {/* Facebook-style Story Music Picker */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                              <Music2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                  {language === 'ar' ? 'موسيقى القصة' : 'Story Music'}
                              </span>
                          </div>
                          {selectedMusic && (
                              <button 
                                  onClick={() => { setSelectedMusic(null); stopAudioPreview(); }}
                                  className="text-xs text-red-500 hover:text-red-600 font-bold hover:underline flex items-center gap-1"
                              >
                                  <X className="w-3.5 h-3.5" />
                                  {language === 'ar' ? 'إزالة' : 'Remove'}
                              </button>
                          )}
                      </div>

                      {/* Selected Track Banner */}
                      {selectedMusic && (
                          <div className="mb-3 p-2.5 rounded-xl bg-emerald-600 text-white flex items-center justify-between shadow-md animate-fadeIn">
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                  {selectedMusic.coverUrl ? (
                                      <img src={selectedMusic.coverUrl} alt="cover" className="w-8 h-8 rounded-lg object-cover shadow-inner flex-shrink-0" />
                                  ) : (
                                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                                          <Music className="w-4 h-4 text-white" />
                                      </div>
                                  )}
                                  <div className="truncate text-left dir-ltr">
                                      <p className="text-xs font-bold truncate">{selectedMusic.title}</p>
                                      <p className="text-[10px] text-emerald-100 truncate">{selectedMusic.artist}</p>
                                  </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold flex-shrink-0 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-white" />
                                  {language === 'ar' ? 'مختارة' : 'Selected'}
                              </span>
                          </div>
                      )}

                      {/* Music Search Input */}
                      <div className="relative mb-2.5">
                          {isSearchingMusic ? (
                              <Loader2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 animate-spin" />
                          ) : (
                              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          )}
                          <input 
                              type="text"
                              value={musicSearchQuery}
                              onChange={(e) => setMusicSearchQuery(e.target.value)}
                              placeholder={language === 'ar' ? 'ابحث حي في جميع الأغاني والفنانين العالمي والعربي...' : 'Live search all global & Arabic songs...'}
                              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-8 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                          />
                          {musicSearchQuery && (
                              <button 
                                  onClick={() => setMusicSearchQuery('')} 
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                  <X className="w-3.5 h-3.5" />
                              </button>
                          )}
                      </div>

                      {/* Genre / Category Filter Pills */}
                      <div className="relative flex items-center gap-1 mb-2">
                          <button 
                              type="button"
                              onClick={() => handleCategoryScroll('left')}
                              className="p-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition flex-shrink-0 z-10"
                              title={language === 'ar' ? 'تمرير لليسار' : 'Scroll left'}
                          >
                              <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <div 
                              ref={categoryScrollRef}
                              className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar scroll-smooth flex-1"
                          >
                              {categories.map(cat => {
                                  const isActive = musicCategoryFilter === cat;
                                  return (
                                      <button
                                          key={cat}
                                          type="button"
                                          onClick={() => { playAudio('pop'); setMusicCategoryFilter(cat); }}
                                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex-shrink-0 whitespace-nowrap border ${
                                              isActive
                                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:text-emerald-600'
                                          }`}
                                      >
                                          {cat}
                                      </button>
                                  );
                              })}
                          </div>

                          <button 
                              type="button"
                              onClick={() => handleCategoryScroll('right')}
                              className="p-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition flex-shrink-0 z-10"
                              title={language === 'ar' ? 'تمرير لليمين' : 'Scroll right'}
                          >
                              <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                      </div>

                      {/* Scrollable Track Items List */}
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                          {filteredMusicTracks.length === 0 ? (
                              <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                                  {language === 'ar' ? 'لم يتم العثور على أغنية بهذا الاسم' : 'No matching tracks found'}
                              </div>
                          ) : (
                              filteredMusicTracks.map(track => {
                                  const isSelected = selectedMusic?.id === track.id;
                                  const isPlaying = playingAudioId === track.id;

                                  return (
                                      <div 
                                          key={track.id}
                                          className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                                              isSelected 
                                                  ? 'bg-emerald-100/80 dark:bg-emerald-900/40 border-emerald-500' 
                                                  : 'bg-white/90 dark:bg-gray-800/90 border-gray-100 dark:border-gray-700 hover:border-emerald-300'
                                          }`}
                                      >
                                          {/* Artist/Cover Thumbnail */}
                                          <div 
                                              className="flex items-center gap-2.5 flex-1 min-w-0"
                                              onClick={() => {
                                                  playAudio('pop');
                                                  setSelectedMusic(track);
                                                  handleTogglePreviewAudio(track);
                                              }}
                                          >
                                              <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-sm">
                                                  {track.coverUrl ? (
                                                      <img src={track.coverUrl} alt="cover" className="w-full h-full object-cover" />
                                                  ) : (
                                                      <Disc className={`w-5 h-5 ${isPlaying ? 'animate-spin text-emerald-200' : ''}`} />
                                                  )}
                                                  {isPlaying && (
                                                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                                                          <Volume2 className="w-4 h-4 text-white animate-pulse" />
                                                      </div>
                                                  )}
                                              </div>

                                              <div className="min-w-0 flex-1">
                                                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-gray-900 dark:text-white'}`}>
                                                      {track.title}
                                                  </p>
                                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                      {track.artist} • <span className="text-emerald-600 dark:text-emerald-400 font-medium">{track.genre}</span>
                                                  </p>
                                              </div>
                                          </div>

                                          {/* Play Preview & Select Actions */}
                                          <div className="flex items-center gap-1.5 ml-2">
                                              <button 
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleTogglePreviewAudio(track);
                                                  }}
                                                  className={`p-1.5 rounded-full text-xs font-semibold transition ${
                                                      isPlaying 
                                                          ? 'bg-emerald-600 text-white shadow-sm animate-pulse' 
                                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 hover:text-emerald-600'
                                                  }`}
                                                  title={isPlaying ? 'إيقاف' : 'استماع'}
                                              >
                                                  {isPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <Disc className="w-3.5 h-3.5" />}
                                              </button>

                                              <button 
                                                  onClick={() => {
                                                      playAudio('pop');
                                                      setSelectedMusic(track);
                                                      handleTogglePreviewAudio(track);
                                                  }}
                                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                                      isSelected 
                                                          ? 'bg-emerald-600 text-white shadow' 
                                                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white'
                                                  }`}
                                              >
                                                  {isSelected ? (language === 'ar' ? 'مختارة' : 'Chosen') : (language === 'ar' ? 'اختيار' : 'Select')}
                                              </button>
                                          </div>
                                      </div>
                                  );
                              })
                          )}
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
                              className="w-full h-36 sm:h-40 rounded-2xl p-4 flex flex-col items-center justify-center text-center text-white shadow-lg overflow-hidden transition-all duration-300 relative border border-white/20"
                              style={{ 
                                  background: selectedBackground.bg,
                                  fontFamily: selectedFont.family,
                                  fontWeight: selectedFont.weight || '700'
                              }}
                          >
                              {selectedMusic && (
                                  <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs flex items-center gap-1.5 text-white">
                                      <Disc className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                      <span className="truncate max-w-[140px]">{selectedMusic.title}</span>
                                  </div>
                              )}
                              <span className="text-xl sm:text-2xl leading-relaxed drop-shadow-md">
                                  {storyText.trim() ? storyText : (language === 'ar' ? 'اكتب قصتك هنا...' : 'Type your story...')}
                              </span>
                          </div>

                          {/* Font Style Selector Dropdown */}
                          <div className="relative">
                              <button
                                  type="button"
                                  onClick={() => {
                                      playAudio('pop');
                                      setShowFontDropdown(!showFontDropdown);
                                  }}
                                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl p-3 flex items-center justify-between shadow-sm hover:border-emerald-500 transition"
                              >
                                  <ChevronDown className={`w-5 h-5 text-gray-700 dark:text-gray-300 transition-transform duration-200 ${showFontDropdown ? 'rotate-180' : ''}`} />
                                  <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-gray-900 dark:text-white" style={{ fontFamily: selectedFont.family, fontWeight: selectedFont.weight }}>
                                          {language === 'ar' ? selectedFont.nameAr : selectedFont.nameEn}
                                      </span>
                                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Aa</span>
                                  </div>
                              </button>

                              {showFontDropdown && (
                                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl py-1 overflow-hidden animate-fadeIn">
                                      {STORY_FONTS.map(font => (
                                          <button
                                              key={font.id}
                                              type="button"
                                              onClick={() => {
                                                  playAudio('pop');
                                                  setSelectedFont(font);
                                                  setShowFontDropdown(false);
                                              }}
                                              className={`w-full px-4 py-2.5 flex items-center justify-between text-sm transition hover:bg-emerald-50 dark:hover:bg-emerald-950/50 ${selectedFont.id === font.id ? 'bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold' : 'text-gray-800 dark:text-gray-200'}`}
                                          >
                                              {selectedFont.id === font.id ? <Check className="w-4 h-4 text-emerald-600" /> : <div />}
                                              <div className="flex items-center gap-2">
                                                  <span style={{ fontFamily: font.family, fontWeight: font.weight }}>
                                                      {language === 'ar' ? font.nameAr : font.nameEn}
                                                  </span>
                                                  <span className="font-bold text-xs opacity-70">Aa</span>
                                              </div>
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>

                          {/* Backgrounds Selector Card Box */}
                          <div className="bg-white dark:bg-gray-800/90 border border-gray-300 dark:border-gray-700 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
                              <div className="text-right">
                                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                      {language === 'ar' ? 'الخلفيات' : 'Backgrounds'}
                                  </h4>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                      {language === 'ar' ? selectedBackground.descAr : selectedBackground.descEn}
                                  </p>
                              </div>

                              {/* Swatches Grid */}
                              <div className={`grid grid-cols-7 sm:grid-cols-8 gap-2 transition-all duration-300 ${isExpandedBackgrounds ? 'max-h-72 overflow-y-auto pr-1' : 'max-h-24 overflow-hidden'}`}>
                                  {STORY_BACKGROUNDS.map(bgOpt => {
                                      const isSelected = selectedBackground.id === bgOpt.id;
                                      return (
                                          <button
                                              key={bgOpt.id}
                                              type="button"
                                              onClick={() => {
                                                  playAudio('pop');
                                                  setSelectedBackground(bgOpt);
                                              }}
                                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all flex-shrink-0 relative flex items-center justify-center ${
                                                  isSelected 
                                                      ? 'scale-110 ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 z-10' 
                                                      : 'hover:scale-105 opacity-90 hover:opacity-100'
                                              }`}
                                              style={{ background: bgOpt.bg }}
                                              title={language === 'ar' ? bgOpt.nameAr : bgOpt.nameEn}
                                          >
                                              {isSelected && (
                                                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                                              )}
                                          </button>
                                      );
                                  })}
                              </div>

                              {/* Expand/Collapse Arrow Button */}
                              <div className="flex justify-center pt-1 border-t border-gray-100 dark:border-gray-700/60">
                                  <button
                                      type="button"
                                      onClick={() => {
                                          playAudio('pop');
                                          setIsExpandedBackgrounds(!isExpandedBackgrounds);
                                      }}
                                      className="p-1 text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition"
                                      title={isExpandedBackgrounds ? (language === 'ar' ? 'إغلاق' : 'Collapse') : (language === 'ar' ? 'عرض الكل' : 'Expand all')}
                                  >
                                      {isExpandedBackgrounds ? (
                                          <ChevronUp className="w-5 h-5" />
                                      ) : (
                                          <ChevronDown className="w-5 h-5" />
                                      )}
                                  </button>
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
                                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 transition shadow-md"
                              >
                                  {language === 'ar' ? 'نشر القصة' : 'Post Story'}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </>
  );
};
