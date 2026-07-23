import React, { useState } from 'react';
import { X, Copy, Check, Facebook, Twitter, Phone, Share2, Globe, Link as LinkIcon, Gamepad2, Video } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { playAudio } from '../../utils/audio';

interface GamingShareModalProps {
  item: {
    id: string;
    title: string;
    image?: string;
    thumbnail?: string;
    type: 'game' | 'stream';
  };
  onClose: () => void;
}

const GamingShareModal: React.FC<GamingShareModalProps> = ({ item, onClose }) => {
  const { dir, language, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const itemUrl = `${window.location.origin}/gaming/${item.type}/${item.id}`;

  const handleCopy = () => {
    playAudio('post_success');
    navigator.clipboard.writeText(itemUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClose = () => {
    playAudio('pop');
    onClose();
  };

  const handleSocialClick = () => {
    playAudio('pop');
  };

  const shareLinks = [
    { 
      name: 'Facebook', 
      icon: <Facebook className="w-6 h-6" />, 
      color: 'bg-[#1877F2]', 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(itemUrl)}` 
    },
    { 
      name: 'WhatsApp', 
      icon: <Phone className="w-6 h-6" />, 
      color: 'bg-[#25D366]', 
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(item.title + ' ' + itemUrl)}` 
    },
    { 
      name: 'X (Twitter)', 
      icon: <Twitter className="w-5 h-5" />, 
      color: 'bg-black', 
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(item.title)}` 
    },
  ];

  return (
    <div className="fixed inset-0 z-[110000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={handleClose} dir={dir}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn border border-white/20 dark:border-gray-700 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-fb-blue" />
            {item.type === 'game' ? t.gaming.share_game : t.gaming.share_stream}
          </h3>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 p-1.5 rounded-full transition active:scale-95"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Item Quick View */}
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600">
               <img src={item.image || item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  {item.type === 'game' ? <Gamepad2 className="w-6 h-6 text-white drop-shadow-md" /> : <Video className="w-6 h-6 text-white drop-shadow-md" />}
               </div>
            </div>
            <div className="flex-1 min-w-0">
               <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate mb-1">{item.title}</h4>
               <p className="text-fb-blue font-bold text-xs flex items-center gap-1">
                 {item.type === 'game' ? t.gaming.instant_games : t.gaming.live_stream}
               </p>
            </div>
          </div>

          {/* Social Icons Grid */}
          <div className="grid grid-cols-4 gap-4">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                onClick={handleSocialClick}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`${link.color} text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform group-hover:scale-110 group-active:scale-95 group-hover:shadow-lg`}>
                  {link.icon}
                </div>
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 group-hover:text-fb-blue transition-colors">{link.name}</span>
              </a>
            ))}
            
            <button 
              onClick={handleCopy} 
              className="flex flex-col items-center gap-2 group"
            >
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform group-hover:scale-110 group-active:scale-95 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                {copied ? <Check className="w-6 h-6 text-green-500 animate-bounce" /> : <Copy className="w-6 h-6" />}
              </div>
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 group-hover:text-fb-blue transition-colors">{t.common.copy}</span>
            </button>
          </div>

          {/* Copy Link Input Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                {t.post.copy_link}
            </label>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors group focus-within:ring-2 focus-within:ring-fb-blue/20 focus-within:border-fb-blue">
               <LinkIcon className="w-4 h-4 text-gray-400 ml-1 rtl:ml-0 rtl:mr-1" />
               <input 
                 type="text" 
                 readOnly 
                 value={itemUrl} 
                 className="bg-transparent border-none outline-none text-xs text-gray-600 dark:text-gray-300 flex-1 truncate font-mono direction-ltr"
                 onClick={(e) => e.currentTarget.select()}
               />
               <button 
                 onClick={handleCopy}
                 className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 shadow-sm active:scale-95 ${copied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-fb-blue text-white hover:bg-blue-700'}`}
               >
                 {copied ? t.common.done : t.common.copy}
               </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-gray-400">
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-[10px] font-medium leading-tight">
                {language === 'ar' ? 'سيتم فتح الروابط في نافذة جديدة' : 'Links will open in a new window'}
            </span>
        </div>
      </div>
    </div>
  );
};

export default GamingShareModal;