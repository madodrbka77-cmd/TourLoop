import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ArrowRight, Play, VolumeX, Volume2, Minimize2, Maximize2, Users, Send, Heart, Share2, Flag, 
  AlertTriangle, Loader2, Check, AlertCircle, MessageSquare
} from 'lucide-react';
import { Stream, REACTION_EMOJIS } from '../../data/gamingData';
import { User } from '../../types';
import GamingShareModal from './GamingShareModal';
import { useLanguage } from '../../context/LanguageContext';
import { playAudio } from '../../utils/audio';

interface StreamViewerModalProps {
  stream: Stream;
  currentUser: User;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  color: string;
}

interface FloatingEmoji {
  id: number;
  char: string;
  left: number;
}

const StreamViewerModal: React.FC<StreamViewerModalProps> = ({ stream, currentUser, onClose }) => {
  const { t, dir, language } = useLanguage();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreamerFollowed, setIsStreamerFollowed] = useState(false);
  const [isStreamLiked, setIsStreamLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamFloatingEmojis, setStreamFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true); // Control chat visibility on mobile

  // --- Modals State ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const randomMessageInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check screen size for initial chat state on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsChatOpen(false);
      } else {
        setIsChatOpen(true);
      }
    };
    
    // Set initial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Chat Simulation
  useEffect(() => {
    setChatMessages([
        { id: '1', user: 'Gamer123', text: language === 'ar' ? 'هذا البث رائع جداً! استمر 🔥' : 'This stream is fire! Keep it up 🔥', color: '#E91E63' },
        { id: '2', user: 'ProPlayer', text: language === 'ar' ? 'يا له من لعب احترافي! 🚀' : 'What a pro play! 🚀', color: '#2196F3' },
        { id: '3', user: 'Watcher99', text: language === 'ar' ? 'مرحباً بالجميع 👋' : 'Hello everyone 👋', color: '#4CAF50' },
        { id: '4', user: 'FanBoy', text: language === 'ar' ? 'أفضل ستريمر ❤️' : 'Best streamer ❤️', color: '#FF9800' },
        { id: '5', user: 'NoobSlayer', text: 'GG WP', color: '#9C27B0' },
    ]);
    setIsStreamerFollowed(false);
    setIsStreamLiked(false);
    setChatInput('');
    setStreamFloatingEmojis([]);
    setShowShareModal(false);
    setShowReportModal(false);

    // Simulate random incoming chat messages
    randomMessageInterval.current = setInterval(() => {
        const randomUsers = ['Speedy', 'Ghost', 'Ninja', 'PlayerOne', 'EpicGamer'];
        const randomTexts = language === 'ar' 
          ? ['واو!', 'لعبة قوية', '😂', '🔥🔥🔥', 'كيف فعلت ذلك؟', 'تحياتي من مصر', 'Hello from KSA']
          : ['Wow!', 'Strong game', '😂', '🔥🔥🔥', 'How did you do that?', 'Greetings from USA', 'GG'];
        const randomColors = ['#F44336', '#9C27B0', '#3F51B5', '#009688', '#FF5722'];
        
        const newMsg: ChatMessage = {
            id: Date.now().toString() + Math.random(),
            user: randomUsers[Math.floor(Math.random() * randomUsers.length)],
            text: randomTexts[Math.floor(Math.random() * randomTexts.length)],
            color: randomColors[Math.floor(Math.random() * randomColors.length)]
        };
        setChatMessages(prev => [...prev, newMsg]);
    }, 3000);

    return () => {
        if (randomMessageInterval.current) clearInterval(randomMessageInterval.current);
    };
  }, [stream.id, language]);

  // Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]); // Also scroll when chat opens

  const showNotification = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (type === 'success') playAudio('post_success');
    else if (type === 'error') playAudio('notification');
    else playAudio('pop');

    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSendMessage = () => {
      if (!chatInput.trim()) return;
      playAudio('message_sent');
      
      const newMessage: ChatMessage = {
          id: Date.now().toString(),
          user: currentUser.name,
          text: chatInput,
          color: '#065F46'
      };
      
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
  };

  const handleToggleFollowStreamer = () => {
      setIsStreamerFollowed(!isStreamerFollowed);
      playAudio('pop');
      if (!isStreamerFollowed) {
          showNotification(`${t.gaming.follow} ${stream.streamerName}`, 'success');
      } else {
          showNotification(`${t.gaming.unfollow} ${stream.streamerName}`, 'info');
      }
  };

  const triggerStreamEmoji = (char: string) => {
      playAudio('react', 0.3);
      const newEmoji: FloatingEmoji = {
          id: Date.now() + Math.random(),
          char,
          left: Math.random() * 80 + 10
      };
      setStreamFloatingEmojis(prev => [...prev, newEmoji]);
      setTimeout(() => {
          setStreamFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
      }, 2000);
  };

  const handleToggleLikeStream = (e?: any) => {
      e?.preventDefault();
      e?.stopPropagation();
      setIsStreamLiked(!isStreamLiked);
      if (!isStreamLiked) {
          playAudio('like');
          showNotification(t.common.success, 'success');
          triggerStreamEmoji('💚');
      } else {
          playAudio('pop');
      }
  };

  const handleShare = (e?: any) => {
      e?.stopPropagation?.();
      playAudio('pop');
      setShowShareModal(true);
  };

  const handleReport = (e?: any) => {
      e?.stopPropagation?.();
      playAudio('pop');
      setShowReportModal(true);
  };

  const handleSubmitReport = () => {
      if (!reportReason) return;
      playAudio('pop');
      setIsReportSubmitting(true);
      setTimeout(() => {
          setIsReportSubmitting(false);
          setShowReportModal(false);
          setReportReason('');
          showNotification(t.common.success, 'success');
      }, 1000);
  };

  const toggleFullscreen = (e?: any) => {
      e?.stopPropagation?.();
      playAudio('pop');
      if (!document.fullscreenElement) {
          streamContainerRef.current?.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
          setIsFullscreen(true);
      } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
      }
  };

  const handleClose = () => {
    playAudio('pop');
    onClose();
  };

  // Helper to get localized report reasons correctly
  const getReportReasons = () => {
    // In translations.ts, report_reasons keys are Arabic and values are English.
    // So for Arabic, we use Keys. For English, we use Values.
    if (language === 'ar') {
        return Object.keys(t.report_reasons || {});
    }
    return Object.values(t.report_reasons || {});
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center animate-fadeIn" dir={dir}>
       
       {notification && (
          <div className={`fixed bottom-6 ${dir === 'rtl' ? 'right-6' : 'left-6'} px-6 py-3 rounded-xl shadow-lg z-[10000] animate-bounce-in flex items-center gap-3 text-white backdrop-blur-md border border-white/10 ${notification.type === 'error' ? 'bg-red-600' : notification.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
            {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{notification.message}</span>
          </div>
       )}

       <div className="w-full h-full bg-black overflow-hidden relative flex flex-col md:flex-row">
          
          {/* Main Video Area */}
          <div className="relative flex-1 bg-black flex items-center justify-center group overflow-hidden" ref={streamContainerRef}>
             <button 
                onClick={handleClose} 
                className={`absolute top-6 ${dir === 'rtl' ? 'left-6' : 'right-6'} z-50 p-2.5 bg-black/40 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition active:scale-90 border border-white/10`}
             >
                 <X className="w-6 h-6" />
             </button>

             {/* Back Button - UPDATED STYLE & HOVER */}
             <button 
                onClick={handleClose}
                className={`absolute top-6 ${dir === 'rtl' ? 'right-6' : 'left-6'} z-50 bg-emerald-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-2xl transition-all duration-300 border border-white/10 hover:scale-105 active:scale-95 backdrop-blur-sm`}
             >
                <ArrowRight className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> 
                <span className="hidden sm:inline">{t.gaming.back_to_menu}</span>
                <span className="sm:hidden">{t.common.back}</span>
             </button>
             
             {/* Chat Toggle (Mobile Only) */}
             {!isChatOpen && (
                 <button 
                    onClick={() => { playAudio('pop'); setIsChatOpen(true); }}
                    className={`absolute bottom-24 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-40 bg-gray-900/80 text-white p-3 rounded-full md:hidden backdrop-blur-md border border-white/20 shadow-lg animate-bounce`}
                 >
                     <MessageSquare className="w-6 h-6" />
                 </button>
             )}
             
             <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {streamFloatingEmojis.map(emoji => (
                    <div key={emoji.id} className="absolute bottom-20 text-4xl animate-float" style={{ left: `${emoji.left}%` }}>{emoji.char}</div>
                ))}
             </div>

             <div className="text-center w-full h-full relative">
                <img src={stream.thumbnail} alt="stream" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="w-20 h-20 mb-4 bg-red-600/90 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-600/30 cursor-pointer hover:scale-110 transition active:scale-95 border-4 border-white/10">
                       <Play className="w-8 h-8 text-white fill-current ml-1" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg px-4">{stream.title}</h2>
                    <p className="text-gray-200 bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md text-sm border border-white/10">
                        {t.gaming.stream_by} {stream.streamerName}
                    </p>
                </div>
             </div>

             {/* Stream Overlay Controls */}
             <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition duration-300 z-20">
                <div className="flex justify-between items-end">
                   <div className="flex items-center gap-4">
                      <button onClick={(e) => {e.stopPropagation(); playAudio('pop');}} className="text-white hover:text-fb-blue transition transform hover:scale-110 active:scale-95 hidden sm:block">
                          <Play className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); playAudio('pop'); setIsMuted(!isMuted); }} className="text-white hover:text-fb-blue transition active:scale-95">
                          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                      <div className="text-white min-w-0">
                         <div className="font-bold flex items-center gap-2 mb-1">
                            <span className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> {language === 'ar' ? 'مباشر' : 'LIVE'}
                            </span>
                            <span className="text-xs font-mono text-gray-300 bg-white/10 px-2 py-0.5 rounded">00:45:20</span>
                         </div>
                         <h3 className="font-bold text-sm md:text-lg truncate max-w-[200px] md:max-w-md">{stream.title}</h3>
                      </div>
                   </div>
                   <div className="flex gap-3 text-white">
                      <button onClick={toggleFullscreen} title={language === 'ar' ? 'ملء الشاشة' : 'Fullscreen'} className="hover:text-fb-blue transition p-2 hover:bg-white/10 rounded-full">
                          {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                      </button>
                   </div>
                </div>
             </div>
          </div>

          {/* Chat & Info Sidebar */}
          <div 
            className={`
                fixed md:relative inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} 
                w-full md:w-[400px] lg:w-[450px] 
                bg-white dark:bg-gray-900 
                flex flex-col border-l-0 ${dir === 'rtl' ? 'md:border-r' : 'md:border-l'} dark:border-gray-700 
                z-[60] shadow-2xl transform transition-transform duration-300 ease-in-out
                ${isChatOpen ? 'translate-x-0' : (dir === 'rtl' ? '-translate-x-full' : 'translate-x-full')}
                md:translate-x-0
            `}
          >
             {/* Mobile Header for Chat */}
             <div className="md:hidden flex items-center justify-between p-3 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                 <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> {t.gaming.live_stream}
                 </span>
                 <button onClick={() => setIsChatOpen(false)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                     <X className="w-5 h-5 dark:text-gray-300" />
                 </button>
             </div>

             <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3 mb-4">
                   <div className="relative">
                      <img src={stream.streamerAvatar} className="w-12 h-12 rounded-full border-2 border-red-500 object-cover p-0.5" alt="streamer" />
                      <span className="absolute -bottom-1 right-0 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm border border-white dark:border-gray-900">LIVE</span>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">{stream.streamerName}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                          <Users className="w-3.5 h-3.5" /> {stream.viewers} {t.gaming.viewers}
                      </span>
                   </div>
                   <button 
                     onClick={handleToggleFollowStreamer}
                     className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 ${isStreamerFollowed ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700' : 'bg-fb-blue text-white hover:bg-blue-700'}`}
                   >
                     {isStreamerFollowed ? t.gaming.unfollow : t.gaming.follow}
                   </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {stream.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700">#{tag}</span>
                    ))}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black/20 custom-scrollbar">
                <div className="text-center">
                    <span className="inline-block text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {t.gaming.chat_welcome}
                    </span>
                </div>
                {chatMessages.map(msg => (
                   <div key={msg.id} className="flex items-start gap-2.5 text-sm animate-slideUp">
                      <div 
                        className="font-bold whitespace-nowrap text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 h-fit"
                        style={{color: msg.color}}
                      >
                          {msg.user}
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded-r-xl rounded-bl-xl shadow-sm text-gray-700 dark:text-gray-200 text-xs leading-relaxed border border-gray-100 dark:border-gray-700 max-w-[85%]">
                          {msg.text}
                      </div>
                   </div>
                ))}
                <div ref={chatEndRef} />
             </div>

             <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 relative z-10">
                <div className="flex justify-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-1 px-1">
                    {REACTION_EMOJIS.map(emoji => (
                        <button 
                            key={emoji} 
                            onClick={() => triggerStreamEmoji(emoji)} 
                            className="text-xl hover:scale-110 transition active:scale-90 cursor-pointer bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl w-9 h-9 flex-shrink-0 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-gray-700 shadow-sm"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                <div className="relative flex items-center gap-2">
                   <input 
                     type="text" 
                     placeholder={t.gaming.send_message} 
                     className={`w-full bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-full py-3 text-sm outline-none focus:ring-2 focus:ring-fb-blue focus:bg-white dark:focus:bg-gray-900 dark:text-white transition shadow-inner ${dir === 'rtl' ? 'pl-12 pr-4' : 'pr-12 pl-4'}`} 
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                   />
                   <button 
                     onClick={handleSendMessage}
                     disabled={!chatInput.trim()}
                     className={`absolute ${dir === 'rtl' ? 'left-1.5' : 'right-1.5'} top-1/2 -translate-y-1/2 p-2 bg-fb-blue text-white rounded-full hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                   >
                      <Send className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                   </button>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex gap-1">
                        <button 
                            type="button"
                            onClick={(e) => handleShare(e)}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition active:scale-95" 
                            title={t.common.share}
                        >
                        <Share2 className="w-5 h-5" />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => handleReport(e)}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition active:scale-95" 
                            title={t.common.report}
                        >
                        <Flag className="w-5 h-5" />
                        </button>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => handleToggleLikeStream(e)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-200 active:scale-95 border ${isStreamLiked ? 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'}`}
                    >
                      <Heart className={`w-5 h-5 ${isStreamLiked ? 'fill-current' : ''}`} />
                      <span className="text-xs font-bold">{isStreamLiked ? t.pages.liked : t.pages.like}</span>
                    </button>
                </div>
             </div>
          </div>

          {/* Share Modal */}
          {showShareModal && createPortal(
              <GamingShareModal 
                item={{
                    id: stream.id,
                    title: stream.title,
                    thumbnail: stream.thumbnail,
                    type: 'stream'
                }} 
                onClose={() => setShowShareModal(false)} 
              />,
              document.body
          )}

          {/* Report Modal */}
          {showReportModal && (
              <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn border border-white/20 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                              {t.post.report}
                          </h3>
                          <button onClick={() => { playAudio('pop'); setShowReportModal(false); }} className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-1.5 transition">
                              <X className="w-5 h-5" />
                          </button>
                      </div>
                      <div className="p-6 space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">{t.groups.report_reason}:</p>
                          {/* Use helper to display correct localized strings based on current language */}
                          {getReportReasons().slice(0, 5).map((reason) => (
                              <label key={reason} onClick={() => playAudio('pop')} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition active:scale-[0.98]">
                                  <input 
                                      type="radio" 
                                      name="reportReason" 
                                      value={reason} 
                                      checked={reportReason === reason}
                                      onChange={(e) => setReportReason(e.target.value)}
                                      className="text-fb-blue focus:ring-fb-blue w-4 h-4"
                                  />
                                  <span className="text-gray-700 dark:text-gray-200 text-sm font-bold">{reason}</span>
                              </label>
                          ))}
                      </div>
                      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2">
                          <button onClick={() => { playAudio('pop'); setShowReportModal(false); }} className="px-5 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition text-sm active:scale-95">{t.common.cancel}</button>
                          <button 
                            onClick={handleSubmitReport} 
                            disabled={!reportReason || isReportSubmitting}
                            className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2 text-sm active:scale-95"
                          >
                              {isReportSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                              {t.common.send}
                          </button>
                      </div>
                  </div>
              </div>
          )}

       </div>
    </div>
  );
};

export default StreamViewerModal;