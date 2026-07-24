import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, Search, MoreHorizontal, X, ExternalLink, Volume2, VolumeX, 
  PlusCircle, Flag, EyeOff, HelpCircle, Check, PhoneCall, 
  Sparkles, ArrowRight, Bookmark, SlidersHorizontal, Shield
} from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useNotify } from '../context/NotificationContext';
import { MOCK_FRIENDS } from '../data/createPostData';

interface RightbarProps {
  onlineUsers: User[];
  onChatClick: (user: User) => void;
}

interface AdItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: string;
  category: string;
  saved?: boolean;
}

// Extended friends list with realistic online status
const INITIAL_FRIENDS: User[] = [
    ...MOCK_FRIENDS.map((f, i) => ({
        id: f.id,
        name: f.name,
        avatar: `https://picsum.photos/200/200?random=${100 + i}`,
        online: Math.random() > 0.35 // Realistic online state
    })),
    { id: '6', name: 'يوسف حسن', avatar: 'https://picsum.photos/200/200?random=105', online: true },
    { id: '7', name: 'نور الشريف', avatar: 'https://picsum.photos/200/200?random=106', online: false },
    { id: '8', name: 'ليلى علوي', avatar: 'https://picsum.photos/200/200?random=107', online: true },
    { id: '9', name: 'هند صبري', avatar: 'https://picsum.photos/200/200?random=108', online: true },
    { id: '10', name: 'عمرو دياب', avatar: 'https://picsum.photos/200/200?random=109', online: false },
    { id: '11', name: 'محمد صلاح', avatar: 'https://picsum.photos/200/200?random=110', online: true },
    { id: '12', name: 'أحمد حلمي', avatar: 'https://picsum.photos/200/200?random=111', online: true },
    { id: '13', name: 'عادل إمام', avatar: 'https://picsum.photos/200/200?random=112', online: false },
    { id: '14', name: 'يسرا', avatar: 'https://picsum.photos/200/200?random=113', online: true },
    { id: '15', name: 'كريم عبد العزيز', avatar: 'https://picsum.photos/200/200?random=114', online: true },
];

const Rightbar: React.FC<RightbarProps> = ({ onlineUsers, onChatClick }) => {
  const { language, dir } = useLanguage();
  const notify = useNotify();

  // --- Sponsored Ads State ---
  const [ads, setAds] = useState<AdItem[]>([
    {
      id: 'ad-1',
      title: language === 'ar' ? 'عروض الشتاء الكبرى - خصم 50%' : 'Winter Mega Sale - 50% Off',
      subtitle: 'fashion-store.com',
      description: language === 'ar' ? 'تشكيلة ملابس جديدة بأسعار استثنائية وشحن مجاني لجميع المحافظات' : 'New clothing collection at exceptional prices with free express shipping',
      image: 'https://picsum.photos/140/140?random=99',
      cta: language === 'ar' ? 'تسوق الآن' : 'Shop Now',
      category: language === 'ar' ? 'موضة وتسوق' : 'Shopping'
    },
    {
      id: 'ad-2',
      title: language === 'ar' ? 'دورة احتراف الذكاء الاصطناعي' : 'AI Mastery Certification',
      subtitle: 'tech-academy.io',
      description: language === 'ar' ? 'تعلم تطبيقات الذكاء الاصطناعي المتقدمة وتطوير التطبيقات الذكية مع شهادة معتمدة' : 'Master advanced AI tools & machine learning with recognized certificate',
      image: 'https://picsum.photos/140/140?random=98',
      cta: language === 'ar' ? 'سجل اليوم' : 'Enroll Now',
      category: language === 'ar' ? 'تعليم وتدريب' : 'Education'
    }
  ]);

  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [activeAdMenuId, setActiveAdMenuId] = useState<string | null>(null);
  const [adInfoModal, setAdInfoModal] = useState<AdItem | null>(null);
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdSubtitle, setNewAdSubtitle] = useState('');
  const [newAdCta, setNewAdCta] = useState('');

  // --- Contacts Controls State ---
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortAlphabetical, setSortAlphabetical] = useState(false);
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [hideContacts, setHideContacts] = useState(false);

  // --- Video Call Modal State ---
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeVideoUser, setActiveVideoUser] = useState<User | null>(null);

  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const adMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
      if (adMenuRef.current && !adMenuRef.current.contains(e.target as Node)) {
        setActiveAdMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter & Sort Contacts
  const displayUsers = INITIAL_FRIENDS
    .filter((user) => {
      if (onlineOnly && !user.online) return false;
      if (searchQuery.trim() !== '') {
        return user.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    })
    .sort((a, b) => {
      if (sortAlphabetical) {
        return a.name.localeCompare(b.name, language === 'ar' ? 'ar' : 'en');
      }
      // Default: Online users first
      return (b.online ? 1 : 0) - (a.online ? 1 : 0);
    });

  const onlineCount = INITIAL_FRIENDS.filter(u => u.online).length;

  // Ad Actions
  const handleHideAd = (adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAds(prev => prev.filter(ad => ad.id !== adId));
    setActiveAdMenuId(null);
    notify(language === 'ar' ? 'تم إخفاء الإعلان بنجاح' : 'Ad hidden successfully', 'info');
  };

  const handleReportAd = (ad: AdItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setAds(prev => prev.filter(a => a.id !== ad.id));
    setActiveAdMenuId(null);
    notify(language === 'ar' ? 'شكراً لك، تم استلام بلاغك وسيتم مراجعته' : 'Thank you, your report has been received', 'success');
  };

  const handleToggleSaveAd = (adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAds(prev => prev.map(ad => ad.id === adId ? { ...ad, saved: !ad.saved } : ad));
    setActiveAdMenuId(null);
    const ad = ads.find(a => a.id === adId);
    if (ad?.saved) {
      notify(language === 'ar' ? 'تم إزالة الإعلان من المحفوظات' : 'Removed from saved ads', 'info');
    } else {
      notify(language === 'ar' ? 'تم حفظ الإعلان في عنصر المفضلات' : 'Ad saved to favorites', 'success');
    }
  };

  const handleCreateAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdSubtitle.trim()) {
      notify(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', 'error');
      return;
    }
    const createdAd: AdItem = {
      id: 'ad-' + Date.now(),
      title: newAdTitle,
      subtitle: newAdSubtitle.replace(/^https?:\/\//, ''),
      description: language === 'ar' ? 'إعلان ممول محلي موجه لجمهورك المستهدف' : 'Targeted sponsored advertisement',
      image: `https://picsum.photos/140/140?random=${Math.floor(Math.random() * 50) + 100}`,
      cta: newAdCta || (language === 'ar' ? 'زيارة الموقع' : 'Visit Site'),
      category: language === 'ar' ? 'إعلان جديد' : 'New Campaign'
    };
    setAds(prev => [createdAd, ...prev]);
    setShowCreateAdModal(false);
    setNewAdTitle('');
    setNewAdSubtitle('');
    setNewAdCta('');
    notify(language === 'ar' ? 'تم إنشاء وحفظ الحملة الإعلانية بنجاح! 🚀' : 'Ad campaign launched successfully!', 'success');
  };

  const handleStartVideoCall = (user: User) => {
    setActiveVideoUser(user);
    setShowVideoModal(true);
    notify(language === 'ar' ? `جاري الاتصال بـ ${user.name}...` : `Calling ${user.name}...`, 'info');
  };

  return (
    <div 
      className="hidden xl:block w-[300px] h-[calc(100vh-56px)] sticky top-14 p-3 overflow-y-auto hover:overflow-y-scroll no-scrollbar bg-white/80 dark:bg-gray-900/80 backdrop-blur-md transition-colors duration-300 border-l dark:border-gray-800 select-none"
      dir={dir}
    >
      {/* --- Sponsored Ads Header & Section --- */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-[15px] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {language === 'ar' ? 'ممول' : 'Sponsored'}
          </h3>
          <button 
            onClick={() => setShowCreateAdModal(true)}
            className="text-xs text-emerald-800 dark:text-emerald-400 font-bold hover:text-blue-600 dark:hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors"
            title={language === 'ar' ? 'إنشاء إعلان ممول' : 'Create Ad'}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {language === 'ar' ? 'إنشاء إعلان' : 'Create Ad'}
          </button>
        </div>

        {ads.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
            {language === 'ar' ? 'لا توجد إعلانات ممولة حالياً' : 'No sponsored ads to show'}
          </div>
        ) : (
          <div className="space-y-2">
            {ads.map((ad) => (
              <div 
                key={ad.id}
                onClick={() => setSelectedAd(ad)}
                className="relative flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-xl cursor-pointer transition group border border-transparent hover:border-gray-200 dark:hover:border-gray-700/60"
              >
                <img 
                  src={ad.image} 
                  alt={ad.title} 
                  className="h-20 w-20 rounded-lg object-cover shadow-sm flex-shrink-0 group-hover:scale-105 transition duration-300" 
                />
                <div className="flex flex-col min-w-0 flex-1 pr-1">
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-[14px] text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {ad.title}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAdMenuId(activeAdMenuId === ad.id ? null : ad.id);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    {ad.subtitle}
                  </span>

                  <span className="mt-1.5 inline-self-start text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md w-max border border-emerald-200 dark:border-emerald-800/50">
                    {ad.cta}
                  </span>
                </div>

                {/* Ad Options Dropdown */}
                {activeAdMenuId === ad.id && (
                  <div 
                    ref={adMenuRef}
                    className="absolute top-8 left-2 z-30 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 text-xs animate-scaleIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={(e) => handleToggleSaveAd(ad.id, e)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      <Bookmark className={`w-4 h-4 ${ad.saved ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                      {ad.saved 
                        ? (language === 'ar' ? 'محفوظ في المفضلات' : 'Saved in Favorites')
                        : (language === 'ar' ? 'حفظ الإعلان' : 'Save Ad')
                      }
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdInfoModal(ad);
                        setActiveAdMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      <HelpCircle className="w-4 h-4 text-blue-500" />
                      {language === 'ar' ? 'لماذا أرى هذا الإعلان؟' : 'Why am I seeing this?'}
                    </button>

                    <button 
                      onClick={(e) => handleHideAd(ad.id, e)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      <EyeOff className="w-4 h-4 text-amber-500" />
                      {language === 'ar' ? 'إخفاء هذا الإعلان' : 'Hide this ad'}
                    </button>

                    <button 
                      onClick={(e) => handleReportAd(ad, e)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 border-t border-gray-100 dark:border-gray-700"
                    >
                      <Flag className="w-4 h-4" />
                      {language === 'ar' ? 'الإبلاغ عن الإعلان' : 'Report Ad'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 my-3 mx-1"></div>

      {/* --- Contacts Header & Controls --- */}
      <div className="px-1 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-[15px]">
              {language === 'ar' ? 'جهات الاتصال' : 'Contacts'}
            </h3>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
              {onlineCount}
            </span>
          </div>

          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            {/* Video Call Quick Launch */}
            <button 
              onClick={() => {
                const firstOnline = displayUsers.find(u => u.online) || INITIAL_FRIENDS[0];
                handleStartVideoCall(firstOnline);
              }}
              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full hover:text-emerald-600 dark:hover:text-emerald-400 transition"
              title={language === 'ar' ? 'غرفة مكالمة فيديو حية' : 'Start Video Call'}
            >
              <Video className="h-4 w-4" />
            </button>

            {/* Toggle Search */}
            <button 
              onClick={() => {
                setShowSearch(prev => !prev);
                if (showSearch) setSearchQuery('');
              }}
              className={`p-1.5 rounded-full transition ${showSearch ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'}`}
              title={language === 'ar' ? 'بحث في جهات الاتصال' : 'Search Contacts'}
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Three Dots Menu Button */}
            <div className="relative">
              <button 
                onClick={() => setShowOptionsMenu(prev => !prev)}
                className={`p-1.5 rounded-full transition ${showOptionsMenu ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'}`}
                title={language === 'ar' ? 'خيارات جهات الاتصال' : 'Contacts Options'}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {/* Contacts 3-Dots Dropdown Menu */}
              {showOptionsMenu && (
                <div 
                  ref={optionsMenuRef}
                  className="absolute top-8 left-0 z-40 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1.5 text-xs animate-scaleIn"
                >
                  <div className="px-3 py-1.5 font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100 dark:border-gray-700/50">
                    {language === 'ar' ? 'إعدادات العرض' : 'Display Options'}
                  </div>

                  <button 
                    onClick={() => {
                      setOnlineOnly(prev => !prev);
                      notify(onlineOnly ? (language === 'ar' ? 'عرض جميع جهات الاتصال' : 'Showing all contacts') : (language === 'ar' ? 'عرض المتصلين الآن فقط' : 'Showing online contacts only'), 'info');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      {language === 'ar' ? 'إظهار المتصلين الآن فقط' : 'Show Online Only'}
                    </span>
                    {onlineOnly && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </button>

                  <button 
                    onClick={() => {
                      setSortAlphabetical(prev => !prev);
                      notify(sortAlphabetical ? (language === 'ar' ? 'إلغاء الترتيب الأبجدي' : 'Normal sorting') : (language === 'ar' ? 'تم الترتيب أَبجديّاً' : 'Sorted alphabetically'), 'info');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'ar' ? 'ترتيب أبجدي (أ-ي)' : 'Sort Alphabetically'}
                    </span>
                    {sortAlphabetical && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </button>

                  <button 
                    onClick={() => {
                      setMuteNotifications(prev => !prev);
                      notify(muteNotifications ? (language === 'ar' ? 'تم تشغيل أصوات التنبيهات' : 'Sounds unmuted') : (language === 'ar' ? 'تم كتم أصوات تنبيهات جهات الاتصال' : 'Sounds muted'), 'info');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-t border-gray-100 dark:border-gray-700/50"
                  >
                    <span className="flex items-center gap-2">
                      {muteNotifications ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {language === 'ar' ? 'كتم تنبيهات الدردشة' : 'Mute Sounds'}
                    </span>
                    {muteNotifications && <span className="text-[10px] text-red-500 font-bold">{language === 'ar' ? 'مكتوم' : 'Muted'}</span>}
                  </button>

                  <button 
                    onClick={() => {
                      setHideContacts(prev => !prev);
                      setShowOptionsMenu(false);
                      notify(hideContacts ? (language === 'ar' ? 'تم إظهار جهات الاتصال' : 'Contacts unhidden') : (language === 'ar' ? 'تم إخفاء القائمة مؤقتاً' : 'Contacts hidden'), 'info');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                    {hideContacts 
                      ? (language === 'ar' ? 'إظهار القائمة' : 'Show Contacts') 
                      : (language === 'ar' ? 'طي قائمة جهات الاتصال' : 'Collapse Contacts')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Search Input */}
        {showSearch && (
          <div className="mt-2 relative animate-fadeIn">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'ابحث عن اسم صديق...' : 'Search friends...'}
              className="w-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 px-3 py-1.5 pl-7 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition"
              autoFocus
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute top-2 left-2" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute top-1.5 right-2 p-0.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- Friends List --- */}
      {!hideContacts && (
        <ul className="space-y-1">
          {displayUsers.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
              {language === 'ar' ? 'لم يتم العثور على جهات اتصال' : 'No contacts found'}
            </div>
          ) : (
            displayUsers.map((user) => (
              <li 
                key={user.id} 
                onClick={() => onChatClick(user)}
                className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-xl cursor-pointer transition group active:scale-98"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="h-9 w-9 rounded-full border border-gray-200 dark:border-gray-700 object-cover shadow-sm group-hover:border-emerald-400 transition" 
                    />
                    {user.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></span>
                    )}
                  </div>
                  <span className="font-medium text-[14px] text-gray-900 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    {user.name}
                  </span>
                </div>

                {/* Quick Action Button on Hover */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartVideoCall(user);
                  }}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full opacity-0 group-hover:opacity-100 transition"
                  title={language === 'ar' ? 'مكالمة فيديو مع ' + user.name : 'Video call ' + user.name}
                >
                  <Video className="w-3.5 h-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {/* --- MODAL: Ad Click Details Preview --- */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-scaleIn">
            <div className="relative h-48">
              <img src={selectedAd.image} alt={selectedAd.title} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedAd(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow">
                {selectedAd.category}
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                {selectedAd.title}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-3 flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" />
                {selectedAd.subtitle}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {selectedAd.description}
              </p>

              <div className="flex items-center gap-3">
                <a 
                  href={`https://${selectedAd.subtitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    notify(language === 'ar' ? 'جاري توجيهك لصفحة المعلن...' : 'Redirecting to sponsor page...', 'info');
                    setSelectedAd(null);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  {selectedAd.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>

                <button 
                  onClick={(e) => {
                    handleToggleSaveAd(selectedAd.id, e);
                    setSelectedAd(null);
                  }}
                  className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-700 dark:text-gray-200 transition"
                  title={language === 'ar' ? 'حفظ الإعلان' : 'Save Ad'}
                >
                  <Bookmark className={`w-5 h-5 ${selectedAd.saved ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Why Am I Seeing This Ad --- */}
      {adInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Shield className="w-5 h-5" />
                <span>{language === 'ar' ? 'لماذا ترى هذا الإعلان؟' : 'Why this ad?'}</span>
              </div>
              <button onClick={() => setAdInfoModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {language === 'ar'
                ? `تم استهدافك بهذا الإعلان لأن نشاطك واهتماماتك تتطابق مع الحملة الإعلانية لـ "${adInfoModal.title}".`
                : `You are seeing this ad because your interests match the campaign target for "${adInfoModal.title}".`}
            </p>

            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {language === 'ar' ? 'الاهتمام بـ: ' + adInfoModal.category : 'Interest in ' + adInfoModal.category}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {language === 'ar' ? 'الموقع الجغرافي: الشرق الأوسط' : 'Location: Middle East'}
              </li>
            </ul>

            <button 
              onClick={() => setAdInfoModal(null)}
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 rounded-xl text-xs transition"
            >
              {language === 'ar' ? 'حسناً، فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: Create Ad Campaign --- */}
      {showCreateAdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-scaleIn">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {language === 'ar' ? 'إنشاء حملة إعلانية ممولة' : 'Create Sponsored Campaign'}
              </h3>
              <button onClick={() => setShowCreateAdModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'ar' ? 'عنوان الإعلان' : 'Ad Title'}
                </label>
                <input 
                  type="text"
                  required
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: خصم 30% على المنتجات' : 'e.g., 30% Discount on Products'}
                  className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'ar' ? 'رابط الموقع / النطاق' : 'Website URL'}
                </label>
                <input 
                  type="text"
                  required
                  value={newAdSubtitle}
                  onChange={(e) => setNewAdSubtitle(e.target.value)}
                  placeholder="myshop.com"
                  className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'ar' ? 'زر الدعوة لاتخاذ إجراء (CTA)' : 'Call To Action'}
                </label>
                <input 
                  type="text"
                  value={newAdCta}
                  onChange={(e) => setNewAdCta(e.target.value)}
                  placeholder={language === 'ar' ? 'تسوق الآن / اشترك / زُر الموقع' : 'Shop Now / Join / Visit'}
                  className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateAdModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 dark:hover:text-white transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  {language === 'ar' ? 'نشر الإعلان الآن 🚀' : 'Launch Ad Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Video Call Active Interface --- */}
      {showVideoModal && activeVideoUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gray-900 text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-800 text-center relative overflow-hidden animate-scaleIn">
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="my-6 flex flex-col items-center">
              <div className="relative mb-4">
                <img 
                  src={activeVideoUser.avatar} 
                  alt={activeVideoUser.name} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-xl animate-pulse"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></span>
              </div>

              <h3 className="text-xl font-bold mb-1">{activeVideoUser.name}</h3>
              <p className="text-xs text-emerald-400 font-semibold animate-pulse">
                {language === 'ar' ? 'جاري الاتصال بمكالمة فيديو...' : 'Connecting video call...'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8">
              <button 
                onClick={() => {
                  notify(language === 'ar' ? 'تم إنهاء المكالمة' : 'Call ended', 'info');
                  setShowVideoModal(false);
                }}
                className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transform hover:scale-110 transition"
                title={language === 'ar' ? 'إنهاء المكالمة' : 'End Call'}
              >
                <PhoneCall className="w-6 h-6 rotate-[135deg]" />
              </button>

              <button 
                onClick={() => {
                  setShowVideoModal(false);
                  onChatClick(activeVideoUser);
                }}
                className="p-4 bg-emerald-600 hover:bg-emerald-700 rounded-full text-white shadow-lg transform hover:scale-110 transition"
                title={language === 'ar' ? 'فتح المحادثة النصية' : 'Open Text Chat'}
              >
                <Video className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rightbar;