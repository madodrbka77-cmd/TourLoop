import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Video, 
  Image, 
  Smile, 
  Sparkles, 
  X, 
  Camera, 
  Activity, 
  MapPin, 
  UserPlus, 
  Search, 
  Check,
  MoreHorizontal,
  Globe, 
  Lock, 
  Users, 
  ChevronDown, 
  Trash2, 
  Bell, 
  BellOff, 
  AlertTriangle,
  BarChart2,
  Plus
} from 'lucide-react';
import { User, Poll } from '../types';
import { generatePostContent } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import { 
  MAX_FILE_SIZE_MB, 
  ALLOWED_IMAGE_TYPES, 
  ALLOWED_VIDEO_TYPES, 
  THEME_CONFIG, 
  FEELINGS_LIST, 
  ACTIVITIES_LIST, 
  MOCK_FRIENDS, 
  MOCK_LOCATIONS 
} from '../data/createPostData';
import { generateId } from '../data/initialData';

interface CreatePostProps {
  currentUser: User;
  onPostCreate: (content: string, image?: string, skipPhotoAdd?: boolean, forcedId?: string, poll?: Poll) => void;
  onShowNotification?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onProfileClick?: () => void;
}

// --- Types ---
type PrivacyLevel = 'public' | 'friends' | 'friends_of_friends' | 'only_me';

// --- Components ---
const PrivacyIcon = ({ type }: { type: PrivacyLevel }) => {
    if (type === 'public') return <Globe className="w-3 h-3" />;
    if (type === 'friends') return <Users className="w-3 h-3" />;
    if (type === 'friends_of_friends') return <UserPlus className="w-3 h-3" />;
    return <Lock className="w-3 h-3" />;
};

const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPostCreate, onShowNotification, onProfileClick }) => {
  const { t, language, dir } = useLanguage();
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Features State
  const [showFeelingModal, setShowFeelingModal] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<{label: string, emoji: string} | null>(null);
  const [activityType, setActivityType] = useState<'feeling' | 'activity'>('feeling');

  const [showTagModal, setShowTagModal] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Post Settings State
  const [privacy, setPrivacy] = useState<PrivacyLevel>('public');
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);

  // Live Video State
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Poll State
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Prevents double submission which causes repeated notifications
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (privacyRef.current && !privacyRef.current.contains(event.target as Node)) {
        setShowPrivacyMenu(false);
      }
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Validation & Security ---
  const validateFile = (file: File): boolean => {
    setErrorMsg(null);
    // Using imported constant for size check
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const msg = language === 'ar' 
        ? `حجم الملف كبير جداً. الحد الأقصى هو ${MAX_FILE_SIZE_MB} ميجابايت.`
        : `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
      setErrorMsg(msg);
      // Optional: Trigger toast if prop is available for consistency
      // if (onShowNotification) onShowNotification(msg, 'error');
      return false;
    }
    const fileType = file.type;
    if (!ALLOWED_IMAGE_TYPES.includes(fileType) && !ALLOWED_VIDEO_TYPES.includes(fileType)) {
      const msg = t.errors_unsupported_file || (language === 'ar' ? 'نوع الملف غير مدعوم.' : 'Unsupported file type.');
      setErrorMsg(msg);
      return false;
    }
    return true;
  };

  // --- AI Handler ---
  const handleMagicPost = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    let prompt = content;
    if (!prompt.trim()) {
        const topics = language === 'ar' 
          ? ["يوم جميل", "حكمة اليوم", "تكنولوجيا", "قهوة الصباح", "النجاح", "الأمل"]
          : ["Beautiful day", "Quote of the day", "Technology", "Morning coffee", "Success", "Hope"];
        prompt = topics[Math.floor(Math.random() * topics.length)];
    }
    try {
        const aiContent = await generatePostContent(prompt);
        setContent(aiContent);
    } catch (err) {
        setErrorMsg(t.errors_generic || "Error generating content.");
    }
    setIsGenerating(false);
  };

  // --- Image/Video Handler ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFile(file)) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        if (result.startsWith('data:video/') || file.type.startsWith('video/')) {
            setMediaType('video');
        } else {
            setMediaType('image');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // --- Live Video Handlers ---
  const startCamera = async () => {
      setCameraError(null);
      try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              throw new Error("API_NOT_SUPPORTED");
          }
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setCameraStream(stream);
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (err: any) {
          console.error("Error accessing camera:", err);
          let msg = language === 'ar' ? "حدث خطأ أثناء تشغيل الكاميرا." : "Error accessing camera.";
          if (err.message === "API_NOT_SUPPORTED") msg = language === 'ar' ? "المتصفح لا يدعم تشغيل الكاميرا." : "Browser does not support camera.";
          else if (err.name === 'NotAllowedError') msg = language === 'ar' ? "تم رفض إذن الوصول للكاميرا." : "Camera access denied.";
          else if (err.name === 'NotFoundError') msg = language === 'ar' ? "لم يتم العثور على كاميرا." : "No camera found.";
          setCameraError(msg);
      }
  };

  const stopCamera = () => {
      if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
      }
  };

  useEffect(() => {
      if (showLiveModal) startCamera();
      else stopCamera();
      return () => stopCamera();
  }, [showLiveModal]);

  const handleGoLive = () => {
      if (cameraStream) {
          const liveText = language === 'ar' ? 'بدأ بثاً مباشراً الآن!' : 'is live now!';
          // Delegate to parent - Parent handles notification
          onPostCreate(`🎥 **${t.post_live_video}:** ${currentUser.name} ${liveText}`, undefined);
          setShowLiveModal(false);
      } else {
          setErrorMsg(language === 'ar' ? "لا يمكن بدء البث بدون كاميرا." : "Cannot start stream without camera.");
      }
  };

  const handleClearPost = () => {
      setContent('');
      setSelectedImage(null);
      setMediaType(null);
      setSelectedFeeling(null);
      setTaggedUsers([]);
      setSelectedLocation(null);
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollModal(false);
      setErrorMsg(null);
      setShowOptionsMenu(false);
      setIsSubmitting(false);
  };

  // --- Submit Handler ---
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;

    // Security: Sanitize input (basic prevention)
    let finalContent = content.replace(/<[^>]*>?/gm, '');
    
    // Append Metadata to content string
    const metaParts = [];
    if (selectedFeeling) {
         const feelingLabel = activityType === 'feeling' ? (t.post_feeling_label || 'Feeling') : '';
         const activityString = `${feelingLabel} ${selectedFeeling.label} ${selectedFeeling.emoji}`;
         metaParts.push(activityString.trim());
    }
    if (taggedUsers.length > 0) {
        const names = MOCK_FRIENDS.filter(f => taggedUsers.includes(f.id)).map(f => f.name).join(language === 'ar' ? '، ' : ', ');
        metaParts.push(`${t.post_with || 'with'} ${names}`);
    }
    if (selectedLocation) {
        metaParts.push(`${t.post_at || 'at'} 📍 ${selectedLocation}`);
    }

    if (metaParts.length > 0) {
        finalContent = `${metaParts.join(' ')}\n\n${finalContent}`;
    }

    // Build Poll object if valid
    let pollData: Poll | undefined = undefined;
    const validOptions = pollOptions.filter(o => o.trim().length > 0);
    if (pollQuestion.trim() && validOptions.length >= 2) {
      pollData = {
        id: `poll_${generateId()}`,
        question: pollQuestion.trim(),
        options: validOptions.map((optText, index) => ({
          id: `opt_${index + 1}_${generateId()}`,
          text: optText.trim(),
          votes: 0,
          voters: []
        })),
        totalVotes: 0
      };
    }

    if (finalContent.trim() || selectedImage || pollData) {
      setIsSubmitting(true);
      onPostCreate(finalContent, selectedImage || undefined, false, undefined, pollData);
      handleClearPost();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4 relative z-10 border border-gray-100 dark:border-gray-700 animate-fadeIn transition-colors duration-300">
      
      {/* Error Toast - Keeping inline design as requested */}
      {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-md mb-3 text-sm flex items-center gap-2 animate-fadeIn border border-red-100 dark:border-red-800">
              <AlertTriangle className="w-4 h-4" />
              {errorMsg}
              <button onClick={() => setErrorMsg(null)} className="ml-auto rtl:mr-auto hover:bg-red-100 dark:hover:bg-red-800 rounded-full p-1 transition">
                  <X className="w-3 h-3" />
              </button>
          </div>
      )}

      {/* Header: Avatar, Name, Privacy, Options */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="h-10 w-10 rounded-full cursor-pointer hover:opacity-90 object-cover border border-gray-200 dark:border-gray-600 transition hover:scale-105"
              onClick={onProfileClick}
            />
            <div className="flex flex-col">
                <span 
                  className="font-bold text-gray-900 dark:text-white text-sm cursor-pointer hover:underline"
                  onClick={onProfileClick}
                >
                  {currentUser.name}
                </span>
                
                {/* Privacy Selector */}
                <div className="relative" ref={privacyRef}>
                    <button 
                        onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                        className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 transition mt-0.5"
                    >
                        <PrivacyIcon type={privacy} />
                        <span>
                          {privacy === 'public' ? t.privacy_public : 
                           privacy === 'friends' ? t.privacy_friends : 
                           privacy === 'friends_of_friends' ? t.privacy_friends_of_friends : 
                           t.privacy_only_me}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                    </button>

                    {showPrivacyMenu && (
                        <div className={`absolute top-full mt-1 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn ${dir === 'rtl' ? 'right-0' : 'left-0'}`}>
                            <button onClick={() => { setPrivacy('public'); setShowPrivacyMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${privacy === 'public' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : ''}`}><Globe className="w-3.5 h-3.5" /> {t.privacy_public}</button>
                            <button onClick={() => { setPrivacy('friends'); setShowPrivacyMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${privacy === 'friends' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : ''}`}><Users className="w-3.5 h-3.5" /> {t.privacy_friends}</button>
                            <button onClick={() => { setPrivacy('friends_of_friends'); setShowPrivacyMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${privacy === 'friends_of_friends' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : ''}`}><UserPlus className="w-3.5 h-3.5" /> {t.privacy_friends_of_friends}</button>
                            <button onClick={() => { setPrivacy('only_me'); setShowPrivacyMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${privacy === 'only_me' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : ''}`}><Lock className="w-3.5 h-3.5" /> {t.privacy_only_me}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* 3-Dot Options Menu */}
        <div className="relative" ref={optionsRef}>
            <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition">
                <MoreHorizontal className="w-5 h-5" />
            </button>
            {showOptionsMenu && (
                <div className={`absolute top-full mt-1 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn ${dir === 'rtl' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}>
                    <button onClick={() => { setNotificationsOn(!notificationsOn); setShowOptionsMenu(false); }} className="w-full text-start px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        {notificationsOn ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        {notificationsOn ? t.post_turn_off_notif : t.post_turn_on_notif}
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button onClick={handleClearPost} className="w-full text-start px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-red-600 font-medium">
                        <Trash2 className="w-4 h-4" /> {t.common_remove || (language === 'ar' ? 'مسح المنشور' : 'Clear Post')}
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Input Area */}
      <div className="mb-3">
            {/* Metadata Preview */}
            {(selectedFeeling || taggedUsers.length > 0 || selectedLocation) && (
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1.5 flex flex-wrap items-center gap-1 animate-fadeIn bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                    <span className="font-semibold text-black dark:text-white">{currentUser.name}</span>
                    {selectedFeeling && (
                        <span className={`${THEME_CONFIG.COLOR} font-bold`}>
                            {activityType === 'feeling' ? (t.post_feeling_label || (language === 'ar' ? 'يشعر بـ' : 'Feeling')) : ''} {selectedFeeling.label} {selectedFeeling.emoji}
                        </span>
                    )}
                    {taggedUsers.length > 0 && (
                        <span className="text-gray-500 dark:text-gray-400">
                            {t.post_with} {taggedUsers.length} {language === 'ar' ? 'من الأصدقاء' : 'friends'}
                        </span>
                    )}
                    {selectedLocation && (
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                            {t.post_at} 📍 {selectedLocation}
                        </span>
                    )}
                    <button 
                        onClick={() => { setSelectedFeeling(null); setTaggedUsers([]); setSelectedLocation(null); }}
                        className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 ml-auto rtl:mr-auto"
                        title={language === 'ar' ? 'مسح التحديد' : 'Clear selection'}
                    >
                        <X className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                    </button>
                </div>
            )}
            
            <div className={`bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-within:bg-white dark:focus-within:bg-gray-800 focus-within:ring-2 ${THEME_CONFIG.RING} dark:focus-within:ring-emerald-600`}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-transparent w-full outline-none placeholder-gray-500 dark:placeholder-gray-400 text-base resize-none overflow-hidden min-h-[60px] text-gray-900 dark:text-white"
                    placeholder={`${t.post_create_placeholder} ${currentUser.name.split(' ')[0]}؟`}
                    rows={Math.min(content.split('\n').length, 5) || 2}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
            </div>
      </div>
      
      {/* Media Preview */}
      {selectedImage && (
        <div className="relative mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 animate-fadeIn">
           {mediaType === 'video' ? (
               <video src={selectedImage} controls className="max-h-80 w-full object-contain" />
           ) : (
               <img src={selectedImage} alt="Selected" className="max-h-80 w-full object-contain" />
           )}
           <button 
             onClick={() => setSelectedImage(null)}
             className="absolute top-2 left-2 bg-white/80 dark:bg-black/60 p-1.5 rounded-full hover:bg-white dark:hover:bg-black shadow-sm z-10 transition hover:scale-110"
           >
             <X className="h-5 w-5 text-gray-700 dark:text-gray-200" />
           </button>
        </div>
      )}

      {/* Poll Preview */}
      {pollQuestion.trim() && (
        <div className="relative mb-3 p-3.5 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold text-sm">
              <BarChart2 className="w-4 h-4" />
              <span>{pollQuestion}</span>
            </div>
            <button 
              onClick={() => { setPollQuestion(''); setPollOptions(['', '']); }}
              className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full text-purple-700 dark:text-purple-300 transition"
              title={language === 'ar' ? 'إلغاء الاستطلاع' : 'Remove poll'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            {pollOptions.filter(o => o.trim()).map((opt, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-900 text-xs font-medium text-gray-800 dark:text-gray-200 flex items-center justify-between">
                <span>{opt}</span>
                <span className="text-purple-600 dark:text-purple-400 text-[11px]">0%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2 w-full overflow-x-auto pb-1 no-scrollbar scrollbar-none">
          
          <button 
            onClick={() => setShowLiveModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
            title={t.post_live_video}
          >
            <Video className="h-5 w-5 text-red-500" />
            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm whitespace-nowrap">{t.post_live_video}</span>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors flex-shrink-0"
            title={t.post_photo_video}
          >
            <Image className="h-5 w-5 text-emerald-600" />
            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm whitespace-nowrap">{t.post_photo_video}</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*"
              onChange={handleImageChange}
            />
          </button>

          <button 
            onClick={() => setShowFeelingModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors flex-shrink-0"
            title={t.post_feeling_activity}
          >
            <Smile className="h-5 w-5 text-yellow-500" />
            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm whitespace-nowrap">{t.post_feeling_activity}</span>
          </button>

          <button 
            onClick={() => setShowTagModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0"
            title={t.post_tag_button}
          >
            <UserPlus className="h-5 w-5 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm whitespace-nowrap">{t.post_tag_button}</span>
          </button>

          <button 
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors flex-shrink-0"
            title={t.post_location_button}
          >
            <MapPin className="h-5 w-5 text-orange-500" />
            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm whitespace-nowrap">{t.post_location_button}</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button 
              onClick={() => setShowPollModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex-shrink-0"
              title={language === 'ar' ? 'استطلاع رأي' : 'Poll'}
            >
              <BarChart2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm whitespace-nowrap">{language === 'ar' ? 'استطلاع رأي' : 'Poll'}</span>
            </button>

            <button 
              onClick={handleMagicPost}
              disabled={isGenerating}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 ${isGenerating ? 'bg-purple-100 dark:bg-purple-900/40' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
              title={t.post_magic_ai}
            >
              <Sparkles className={`h-5 w-5 text-purple-600 dark:text-purple-400 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="text-purple-600 dark:text-purple-400 font-medium text-xs sm:text-sm whitespace-nowrap">
                  {isGenerating ? t.post_ai_thinking : t.post_magic_ai}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      {(content || selectedImage || selectedFeeling || taggedUsers.length > 0 || selectedLocation) && (
          <div className="mt-3 flex justify-end animate-fadeIn">
               <button 
                 onClick={() => handleSubmit()}
                 disabled={isSubmitting}
                 className={`${THEME_CONFIG.BG} text-white px-8 py-2 rounded-md font-bold hover:bg-emerald-800 transition shadow-sm flex items-center gap-2 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
               >
                   {t.post_publish}
               </button>
          </div>
      )}

      {/* --- Live Video Modal --- */}
      {showLiveModal && createPortal(
          <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                      <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                          <div className={`w-3 h-3 rounded-full ${cameraStream ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                          {t.post_live_video}
                      </h3>
                      <button onClick={() => setShowLiveModal(false)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"><X className="w-5 h-5 dark:text-white" /></button>
                  </div>
                  <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                      {cameraError ? (
                          <div className="text-white text-center p-6 flex flex-col items-center">
                              <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                              <p className="text-lg font-semibold mb-2 text-red-400">{language === 'ar' ? 'تعذر الوصول للكاميرا' : 'Cannot access camera'}</p>
                              <p className="text-sm text-gray-300 max-w-xs">{cameraError}</p>
                              <button onClick={startCamera} className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition">
                                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                              </button>
                          </div>
                      ) : cameraStream ? (
                          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                      ) : (
                          <div className="text-white text-center flex flex-col items-center animate-pulse">
                              <Camera className="w-12 h-12 mb-2 opacity-50" />
                              <p>{language === 'ar' ? 'جاري تشغيل الكاميرا...' : 'Starting camera...'}</p>
                          </div>
                      )}
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                          <button 
                            onClick={handleGoLive} 
                            disabled={!cameraStream}
                            className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700 shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100 disabled:bg-gray-600 flex items-center gap-2"
                          >
                              <Activity className="w-5 h-5" /> {language === 'ar' ? 'بدء البث المباشر' : 'Go Live'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* --- Feeling Modal --- */}
      {showFeelingModal && createPortal(
          <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden h-[500px] flex flex-col animate-scaleIn">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-lg dark:text-white">{t.post_feeling_activity}</h3>
                      <button onClick={() => setShowFeelingModal(false)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"><X className="w-5 h-5 dark:text-white" /></button>
                  </div>
                  <div className="flex border-b dark:border-gray-700">
                      <button onClick={() => setActivityType('feeling')} className={`flex-1 py-3 font-semibold text-sm transition ${activityType === 'feeling' ? `${THEME_CONFIG.COLOR} border-b-2 ${THEME_CONFIG.BORDER}` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-400'}`}>
                          {t.post_feeling_label || (language === 'ar' ? 'مشاعر' : 'Feelings')}
                      </button>
                      <button onClick={() => setActivityType('activity')} className={`flex-1 py-3 font-semibold text-sm transition ${activityType === 'activity' ? `${THEME_CONFIG.COLOR} border-b-2 ${THEME_CONFIG.BORDER}` : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-400'}`}>
                          {t.post_activity_label || (language === 'ar' ? 'أنشطة' : 'Activities')}
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-800 custom-scrollbar">
                      <div className="grid grid-cols-2 gap-2">
                          {(activityType === 'feeling' ? FEELINGS_LIST : ACTIVITIES_LIST).map((item, idx) => (
                              <div key={idx} onClick={() => { setSelectedFeeling(item); setShowFeelingModal(false); }} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition">
                                  <div className="w-9 h-9 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xl">{item.emoji}</div>
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{item.label}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* --- Tag Friends Modal --- */}
      {showTagModal && createPortal(
          <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleIn">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-lg dark:text-white">{t.post_tag_button}</h3>
                      <button onClick={() => setShowTagModal(false)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"><X className="w-5 h-5 dark:text-white" /></button>
                  </div>
                  <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <div className="relative mb-3">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                              type="text" 
                              placeholder={language === 'ar' ? "بحث عن أصدقاء..." : "Search friends..."} 
                              className="w-full bg-gray-100 dark:bg-gray-700 rounded-full py-2 pr-10 pl-4 text-sm outline-none dark:text-white transition" 
                          />
                      </div>
                      {MOCK_FRIENDS.map(friend => {
                          const isSelected = taggedUsers.includes(friend.id);
                          return (
                              <div 
                                key={friend.id} 
                                onClick={() => {
                                    setTaggedUsers(prev => isSelected ? prev.filter(id => id !== friend.id) : [...prev, friend.id]);
                                }}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer transition"
                              >
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{friend.name}</span>
                                  {isSelected && <Check className={`w-5 h-5 ${THEME_CONFIG.COLOR}`} />}
                              </div>
                          )
                      })}
                  </div>
                  <div className="p-3 border-t dark:border-gray-700 flex justify-end">
                      <button onClick={() => setShowTagModal(false)} className={`${THEME_CONFIG.BG} text-white px-6 py-1.5 rounded-md text-sm font-semibold transition hover:opacity-90`}>{t.common_done || 'Done'}</button>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* --- Location Modal --- */}
      {showLocationModal && createPortal(
          <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleIn">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-lg dark:text-white">{t.post_location_button}</h3>
                      <button onClick={() => setShowLocationModal(false)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"><X className="w-5 h-5 dark:text-white" /></button>
                  </div>
                  <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <div className="relative mb-3">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                              type="text" 
                              placeholder={language === 'ar' ? "بحث عن أماكن..." : "Search places..."} 
                              className="w-full bg-gray-100 dark:bg-gray-700 rounded-full py-2 pr-10 pl-4 text-sm outline-none dark:text-white transition" 
                          />
                      </div>
                      {MOCK_LOCATIONS.map(location => (
                          <div 
                            key={location} 
                            onClick={() => {
                                setSelectedLocation(location);
                                setShowLocationModal(false);
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer transition"
                          >
                              <div className="bg-gray-200 dark:bg-gray-600 p-1.5 rounded-full"><MapPin className="w-4 h-4 text-gray-600 dark:text-gray-300" /></div>
                              <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{location}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* --- Poll Modal --- */}
      {showPollModal && createPortal(
          <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn border border-gray-100 dark:border-gray-700">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-purple-50/50 dark:bg-purple-950/20">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-bold text-lg dark:text-white">{language === 'ar' ? 'إنشاء استطلاع رأي' : 'Create a Poll'}</h3>
                      </div>
                      <button onClick={() => setShowPollModal(false)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"><X className="w-5 h-5 dark:text-white" /></button>
                  </div>
                  <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          {language === 'ar' ? 'سؤال الاستطلاع' : 'Poll Question'}
                        </label>
                        <input 
                          type="text"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          placeholder={language === 'ar' ? 'ما رأيك في...' : 'Ask a question...'}
                          className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-2.5 text-sm outline-none border border-gray-200 dark:border-gray-600 focus:border-purple-500 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                          {language === 'ar' ? 'خيارات التصويت' : 'Options'}
                        </label>
                        {pollOptions.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOpts = [...pollOptions];
                                newOpts[idx] = e.target.value;
                                setPollOptions(newOpts);
                              }}
                              placeholder={`${language === 'ar' ? 'الخيار' : 'Option'} ${idx + 1}`}
                              className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-sm outline-none border border-gray-200 dark:border-gray-600 focus:border-purple-500 text-gray-900 dark:text-white"
                            />
                            {pollOptions.length > 2 && (
                              <button 
                                onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {pollOptions.length < 4 && (
                          <button 
                            onClick={() => setPollOptions([...pollOptions, ''])}
                            className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline pt-1"
                          >
                            <Plus className="w-4 h-4" />
                            {language === 'ar' ? 'إضافة خيار آخر' : 'Add Option'}
                          </button>
                        )}
                      </div>
                  </div>
                  <div className="p-3 border-t dark:border-gray-700 flex justify-end gap-2 bg-gray-50 dark:bg-gray-800/50">
                    <button 
                      onClick={() => setShowPollModal(false)}
                      className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button 
                      onClick={() => {
                        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
                          setErrorMsg(language === 'ar' ? 'يرجى كتابة السؤال وخيارين على الأقل' : 'Please provide a question and at least two options');
                          return;
                        }
                        setShowPollModal(false);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
                    >
                      {language === 'ar' ? 'حفظ الاستطلاع' : 'Save Poll'}
                    </button>
                  </div>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default CreatePost;