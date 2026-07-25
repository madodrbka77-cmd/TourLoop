import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Minus, Send, Phone, Video, MoreHorizontal, ThumbsUp, Image, Smile, Mic, Trash2, 
  Check, PhoneOff, AlertCircle, Play, Maximize2, Download, 
  CheckCheck, Reply, ZoomIn, ZoomOut, Clock, Cat, Coffee, Gamepad2, Plane, Lightbulb, Flag, Sticker, Search, Heart, Zap, Ghost, Star,
  UserCircle, Palette, Bell, BellOff, ShieldBan, Archive, Type, Eye, ChevronRight,
  Share2, Globe, Pin, Bookmark, Users, UserPlus, Lock, ChevronLeft, ArrowRight, AtSign, BookmarkMinus, Link as LinkIcon, Copy, Facebook, Twitter, Loader2,
  MessageCircle, ExternalLink, Pause, Move, MoreVertical, CornerUpLeft, CornerUpRight, CheckSquare, Square
} from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { playAudio } from '../utils/audio';
import { sendWebPushNotification } from '../utils/webPush';

// --- Interfaces ---

interface ChatMessage {
  id: string;
  text?: string;
  mediaUrl?: string;
  sender: 'me' | 'them';
  timestamp: string;
  rawTimestamp: number;
  type: 'text' | 'image' | 'video' | 'emoji' | 'sticker' | 'system' | 'audio' | 'voice' | 'link';
  fileName?: string;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  replyTo?: string;
  reactions: { [emoji: string]: number };
  myReaction?: string;
  linkPreview?: LinkPreviewData;
  emojiSize?: number;
  readReceiptEnabled?: boolean;
}

interface LinkPreviewData {
  url: string;
  title?: string;
  image?: string;
  description?: string;
}

interface PendingMedia {
  file: File;
  url: string;
  type: 'image' | 'video';
}

interface ChatWindowProps {
  user: User;
  onClose: () => void;
  currentUser: User;
  index: number;
  onViewProfile?: (user: User) => void;
}

interface Theme {
  name: string;
  id: string;
  category?: 'all' | 'messenger' | 'anime' | 'abstract' | 'sports' | 'pets' | 'love' | 'geometric' | 'nature' | 'space' | 'celebration' | 'cozy' | 'travel' | 'gradients' | 'classic';
  background: string;
  bgImage?: string;
  bgStyle?: React.CSSProperties;
  bubble: string;
  sentTextColor?: string;
}

export const getThemeBgStyle = (theme?: Theme): React.CSSProperties => {
  if (!theme) return {};
  if (theme.bgStyle) return theme.bgStyle;
  if (theme.bgImage) {
    return {
      backgroundImage: `url('${theme.bgImage}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  return {};
};

// --- Constants & Data ---
const CHAT_WIDTH = 338;
const CHAT_GAP = 8;

const getThemes = (lang: string): Theme[] => [
  // ==================== 1. Messenger & Facebook Inspired (ماسنجر 💬) ====================
  { name: lang === 'ar' ? 'ماسنجر البنفسجي' : 'Messenger Purple', id: 'messenger_purple', category: 'messenger', background: 'bg-indigo-950', bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop', bubble: 'bg-indigo-600' },
  { name: lang === 'ar' ? 'فيسبوك بوب' : 'Facebook Pop', id: 'messenger_pop', category: 'messenger', background: 'bg-blue-950', bgImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop', bubble: 'bg-blue-600' },
  { name: lang === 'ar' ? 'الموجة الزرقاء' : 'Blue Wave', id: 'messenger_ocean', category: 'messenger', background: 'bg-sky-950', bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-600' },
  { name: lang === 'ar' ? 'توت الماسنجر' : 'Messenger Berry', id: 'messenger_berry', category: 'messenger', background: 'bg-fuchsia-950', bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop', bubble: 'bg-fuchsia-600' },
  { name: lang === 'ar' ? 'تدرج ماسنجر الوردي' : 'Messenger Pink Glow', id: 'messenger_pink', category: 'messenger', background: 'bg-pink-950', bgImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-500' },
  { name: lang === 'ar' ? 'ماسنجر ليل داكن' : 'Messenger Dark Night', id: 'messenger_dark', category: 'messenger', background: 'bg-slate-950', bgImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', bubble: 'bg-indigo-500' },
  { name: lang === 'ar' ? 'ماسنجر غروب الشمس' : 'Messenger Sunset Flare', id: 'messenger_sunset', category: 'messenger', background: 'bg-orange-950', bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'ماسنجر زمردي' : 'Messenger Emerald', id: 'messenger_emerald', category: 'messenger', background: 'bg-emerald-950', bgImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-600' },
  { name: lang === 'ar' ? 'ماسنجر نيون سايبر' : 'Messenger Cyber Neon', id: 'messenger_neon', category: 'messenger', background: 'bg-purple-950', bgImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop', bubble: 'bg-violet-600' },
  { name: lang === 'ar' ? 'ماسنجر سحري' : 'Messenger Magic Glow', id: 'messenger_magic', category: 'messenger', background: 'bg-blue-900', bgImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop', bubble: 'bg-sky-500' },

  // ==================== 2. Anime & Fantasy (أنمي ⛩️) ====================
  { name: lang === 'ar' ? 'أنمي سايبر' : 'Cyber Anime', id: 'anime_cyber', category: 'anime', background: 'bg-purple-950', bgImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop', bubble: 'bg-purple-600' },
  { name: lang === 'ar' ? 'ساكورا أنمي' : 'Anime Sakura', id: 'anime_cherry', category: 'anime', background: 'bg-pink-950', bgImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=800&auto=format&fit=crop', bubble: 'bg-pink-500' },
  { name: lang === 'ar' ? 'سماء الأنمي' : 'Anime Sky', id: 'anime_sky', category: 'anime', background: 'bg-amber-950', bgImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'أضواء طوكيو' : 'Anime Tokyo Neon', id: 'anime_tokyo', category: 'anime', background: 'bg-indigo-950', bgImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop', bubble: 'bg-fuchsia-600' },
  { name: lang === 'ar' ? 'غابة أنمي السحرية' : 'Anime Enchanted Forest', id: 'anime_forest', category: 'anime', background: 'bg-emerald-950', bgImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', bubble: 'bg-teal-600' },
  { name: lang === 'ar' ? 'مطر الأنمي الدافئ' : 'Anime Rain Chill', id: 'anime_rain', category: 'anime', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=800&auto=format&fit=crop', bubble: 'bg-sky-600' },
  { name: lang === 'ar' ? 'قلعة أنمي الأسطورية' : 'Fantasy Anime Castle', id: 'anime_castle', category: 'anime', background: 'bg-indigo-900', bgImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', bubble: 'bg-indigo-600' },
  { name: lang === 'ar' ? 'ليلة نجوم أنمي' : 'Anime Starlight', id: 'anime_stars', category: 'anime', background: 'bg-black', bgImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop', bubble: 'bg-violet-600' },
  { name: lang === 'ar' ? 'بوابة توريا اليابانية' : 'Japanese Torii Gate', id: 'anime_gate', category: 'anime', background: 'bg-red-950', bgImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop', bubble: 'bg-red-600' },
  { name: lang === 'ar' ? 'غروب أنمي الرومنسي' : 'Anime Romantic Sunset', id: 'anime_sunset', category: 'anime', background: 'bg-rose-950', bgImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-600' },

  // ==================== 3. Abstract Art & Neon (تجريدي ونئون 🎨) ====================
  { name: lang === 'ar' ? 'أمواج مجسمة' : '3D Fluid Waves', id: 'abstract_fluid', category: 'abstract', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop', bubble: 'bg-violet-600' },
  { name: lang === 'ar' ? 'رخام ذهبي' : 'Golden Marble', id: 'abstract_gold', category: 'abstract', background: 'bg-neutral-900', bgImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'شبكة النيون' : 'Neon Cyber', id: 'neon_cyber', category: 'abstract', background: 'bg-purple-950', bgImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop', bubble: 'bg-fuchsia-600' },
  { name: lang === 'ar' ? 'رخام أسود' : 'Dark Marble', id: 'abstract_dark', category: 'abstract', background: 'bg-black', bgImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-600' },
  { name: lang === 'ar' ? 'كروم سائل' : 'Liquid Chrome', id: 'abstract_chrome', category: 'abstract', background: 'bg-gray-900', bgImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-600' },
  { name: lang === 'ar' ? 'حبر ملون تجريدي' : 'Abstract Color Ink', id: 'abstract_ink', category: 'abstract', background: 'bg-indigo-950', bgImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800&auto=format&fit=crop', bubble: 'bg-pink-600' },
  { name: lang === 'ar' ? 'أضواء منشور زجاجية' : 'Prismatic Glass', id: 'abstract_prism', category: 'abstract', background: 'bg-purple-900', bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop', bubble: 'bg-violet-500' },
  { name: lang === 'ar' ? 'أمواج ضوئية رقمية' : 'Digital Light Waves', id: 'abstract_waves', category: 'abstract', background: 'bg-blue-950', bgImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop', bubble: 'bg-blue-600' },
  { name: lang === 'ar' ? 'هندسة تجريدية' : 'Abstract Geometry', id: 'abstract_geo', category: 'abstract', background: 'bg-stone-900', bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'دخان نيون ساحر' : 'Neon Smoke', id: 'abstract_smoke', category: 'abstract', background: 'bg-fuchsia-950', bgImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop', bubble: 'bg-fuchsia-600' },

  // ==================== 4. Sports & Action (رياضة ⚽) ====================
  { name: lang === 'ar' ? 'ملعب كرة القدم' : 'Soccer Stadium', id: 'sports_stadium', category: 'sports', background: 'bg-emerald-950', bgImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-600' },
  { name: lang === 'ar' ? 'كرة السلة' : 'Basketball Arena', id: 'sports_basketball', category: 'sports', background: 'bg-amber-950', bgImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop', bubble: 'bg-orange-600' },
  { name: lang === 'ar' ? 'سباق السرعة' : 'Motorsport Speed', id: 'sports_race', category: 'sports', background: 'bg-neutral-950', bgImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop', bubble: 'bg-red-600' },
  { name: lang === 'ar' ? 'ملعب التنس' : 'Tennis Court', id: 'sports_tennis', category: 'sports', background: 'bg-lime-950', bgImage: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop', bubble: 'bg-lime-600' },
  { name: lang === 'ar' ? 'ركوب الأمواج' : 'Ocean Surfing', id: 'sports_surf', category: 'sports', background: 'bg-sky-950', bgImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-600' },
  { name: lang === 'ar' ? 'التزلج الجبلي' : 'Mountain Skiing', id: 'sports_ski', category: 'sports', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=800&auto=format&fit=crop', bubble: 'bg-sky-500' },
  { name: lang === 'ar' ? 'حلبة الملاكمة' : 'Boxing Ring', id: 'sports_boxing', category: 'sports', background: 'bg-red-950', bgImage: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=800&auto=format&fit=crop', bubble: 'bg-red-600' },
  { name: lang === 'ar' ? 'اللياقة البدنية' : 'Fitness Gym', id: 'sports_gym', category: 'sports', background: 'bg-zinc-900', bgImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-500' },
  { name: lang === 'ar' ? 'سباق الدراجات' : 'Road Cycling', id: 'sports_cycling', category: 'sports', background: 'bg-stone-900', bgImage: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'مضمار الجري' : 'Running Track', id: 'sports_running', category: 'sports', background: 'bg-red-900', bgImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-600' },

  // ==================== 5. Pets & Animals (حيوانات أليفة 🐾) ====================
  { name: lang === 'ar' ? 'قطة لطيفة' : 'Cute Kitten', id: 'pets_kitten', category: 'pets', background: 'bg-rose-950', bgImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-500' },
  { name: lang === 'ar' ? 'كلب مرح' : 'Playful Dog', id: 'pets_puppy', category: 'pets', background: 'bg-amber-950', bgImage: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'أسماك الزينة' : 'Aquarium Fish', id: 'pets_underwater', category: 'pets', background: 'bg-sky-950', bgImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-600' },
  { name: lang === 'ar' ? 'أرنب لطيف' : 'Fluffy Bunny', id: 'pets_bunny', category: 'pets', background: 'bg-pink-950', bgImage: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=800&auto=format&fit=crop', bubble: 'bg-pink-500' },
  { name: lang === 'ar' ? 'ببغاء ملون' : 'Exotic Parrot', id: 'pets_parrot', category: 'pets', background: 'bg-emerald-950', bgImage: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?q=80&w=800&auto=format&fit=crop', bubble: 'bg-teal-600' },
  { name: lang === 'ar' ? 'باندا محبوبة' : 'Cute Panda', id: 'pets_panda', category: 'pets', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef9?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-600' },
  { name: lang === 'ar' ? 'هامستر صغير' : 'Tiny Hamster', id: 'pets_hamster', category: 'pets', background: 'bg-amber-900', bgImage: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-500' },
  { name: lang === 'ar' ? 'حصان أصيل' : 'Noble Horse', id: 'pets_horse', category: 'pets', background: 'bg-stone-950', bgImage: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=800&auto=format&fit=crop', bubble: 'bg-stone-600' },
  { name: lang === 'ar' ? 'ثعلب لطيف' : 'Cute Fox', id: 'pets_fox', category: 'pets', background: 'bg-orange-950', bgImage: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=800&auto=format&fit=crop', bubble: 'bg-orange-600' },
  { name: lang === 'ar' ? 'طيور الجنة' : 'Birds of Paradise', id: 'pets_birds', category: 'pets', background: 'bg-cyan-950', bgImage: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=800&auto=format&fit=crop', bubble: 'bg-sky-500' },

  // ==================== 6. Love & Romance (حب وقلوب ❤️) ====================
  { name: lang === 'ar' ? 'قلوب النيون' : 'Neon Hearts', id: 'love_hearts', category: 'love', background: 'bg-gray-900', bgImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop', bubble: 'bg-pink-600' },
  { name: lang === 'ar' ? 'ورود حمراء' : 'Red Roses', id: 'love_roses', category: 'love', background: 'bg-rose-950', bgImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-600' },
  { name: lang === 'ar' ? 'قلوب حالمة' : 'Dreamy Hearts', id: 'love_dreamy', category: 'love', background: 'bg-pink-950', bgImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800&auto=format&fit=crop', bubble: 'bg-pink-500' },
  { name: lang === 'ar' ? 'حب ورومانسية' : 'Love & Romance', id: 'love', category: 'love', background: 'bg-gradient-to-br from-pink-50 via-red-50 to-pink-100 dark:from-pink-900/20 dark:via-red-900/20 dark:to-pink-900/10', bubble: 'bg-pink-500' },
  { name: lang === 'ar' ? 'غروب حالم' : 'Romantic Sunset', id: 'love_romantic_sunset', category: 'love', background: 'bg-red-900', bgImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&auto=format&fit=crop', bubble: 'bg-red-500' },
  { name: lang === 'ar' ? 'سماء وردية' : 'Pink Sky', id: 'love_pink_cloud', category: 'love', background: 'bg-pink-100', bgImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-500' },
  { name: lang === 'ar' ? 'شموع رومانسية' : 'Candlelight', id: 'love_candles', category: 'love', background: 'bg-amber-950', bgImage: 'https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-700' },
  { name: lang === 'ar' ? 'العشاق في باريس' : 'Lovers in Paris', id: 'love_paris', category: 'love', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop', bubble: 'bg-pink-600' },
  { name: lang === 'ar' ? 'هدايا الحب' : 'Love Gifts', id: 'love_gifts', category: 'love', background: 'bg-red-950', bgImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-600' },
  { name: lang === 'ar' ? 'شاطئ الرومانسية' : 'Romantic Sunset Beach', id: 'love_beach', category: 'love', background: 'bg-orange-950', bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', bubble: 'bg-red-500' },

  // ==================== 7. Geometric Patterns (أشكال هندسية 📐) ====================
  { name: lang === 'ar' ? 'شبكة هيكس' : 'Cyber Hexagon', id: 'geo_hex', category: 'geometric', background: 'bg-gray-900', bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-600' },
  { name: lang === 'ar' ? 'كريستال منشور' : 'Prismatic Crystal', id: 'geo_cubes', category: 'geometric', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800&auto=format&fit=crop', bubble: 'bg-indigo-600' },
  { name: lang === 'ar' ? 'مكعبات ثلاثية' : '3D Cubes', id: 'geo_3d_cubes', category: 'geometric', background: 'bg-slate-950', bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop', bubble: 'bg-purple-600' },
  { name: lang === 'ar' ? 'خطوط ذهبية' : 'Golden Lines', id: 'geo_gold', category: 'geometric', background: 'bg-neutral-900', bgImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'تضاريس لو-بولي' : 'Low Poly Terrain', id: 'geo_lowpoly', category: 'geometric', background: 'bg-indigo-950', bgImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop', bubble: 'bg-indigo-500' },
  { name: lang === 'ar' ? 'مثلثات النيون' : 'Neon Triangles', id: 'geo_triangles', category: 'geometric', background: 'bg-purple-950', bgImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop', bubble: 'bg-fuchsia-600' },
  { name: lang === 'ar' ? 'شبكة ماتريكس' : 'Matrix Grid', id: 'geo_matrix', category: 'geometric', background: 'bg-black', bgImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-600' },
  { name: lang === 'ar' ? 'مجسمات آيزومتريك' : 'Isometric Shapes', id: 'geo_isometric', category: 'geometric', background: 'bg-blue-950', bgImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop', bubble: 'bg-blue-600' },
  { name: lang === 'ar' ? 'دوائر هندسية' : 'Geometric Circles', id: 'geo_circles', category: 'geometric', background: 'bg-stone-900', bgImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'أشعة ضوئية هندسية' : 'Geometric Light Rays', id: 'geo_rays', category: 'geometric', background: 'bg-cyan-950', bgImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-600' },

  // ==================== 8. Nature & Landscapes (طبيعة وأزهار 🌿) ====================
  { name: lang === 'ar' ? 'شاطئ استوائي' : 'Tropical Beach', id: 'ocean_beach', category: 'nature', background: 'bg-sky-900', bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', bubble: 'bg-blue-600' },
  { name: lang === 'ar' ? 'أزهار الكرز' : 'Cherry Blossom', id: 'sakura', category: 'nature', background: 'bg-pink-900', bgImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=800&auto=format&fit=crop', bubble: 'bg-pink-600' },
  { name: lang === 'ar' ? 'ضباب الغابة' : 'Mist Forest', id: 'forest_mist', category: 'nature', background: 'bg-emerald-950', bgImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-600' },
  { name: lang === 'ar' ? 'جبال القمر' : 'Moonlight Mountains', id: 'mountain_night', category: 'nature', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-700' },
  { name: lang === 'ar' ? 'شلال طبيعي' : 'Tropical Waterfall', id: 'nature_waterfall', category: 'nature', background: 'bg-teal-950', bgImage: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=800&auto=format&fit=crop', bubble: 'bg-teal-600' },
  { name: lang === 'ar' ? 'خريف دافئ' : 'Warm Autumn', id: 'autumn_leaves', category: 'nature', background: 'bg-orange-950', bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'أزهار حقلية' : 'Wild Flowers', id: 'wild_flowers', category: 'nature', background: 'bg-emerald-900', bgImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop', bubble: 'bg-teal-600' },
  { name: lang === 'ar' ? 'عباد الشمس' : 'Golden Sunflowers', id: 'nature_sunflowers', category: 'nature', background: 'bg-amber-950', bgImage: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'أوراق استوائية' : 'Tropical Leaves', id: 'nature_leaves', category: 'nature', background: 'bg-emerald-950', bgImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-600' },
  { name: lang === 'ar' ? 'بحيرة جبلية' : 'Alpine Lake', id: 'nature_lake', category: 'nature', background: 'bg-blue-950', bgImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop', bubble: 'bg-sky-600' },

  // ==================== 9. Space & Galaxies (فضاء ومجرات 🚀) ====================
  { name: lang === 'ar' ? 'مجرة ونجوم' : 'Starry Galaxy', id: 'galaxy', category: 'space', background: 'bg-black', bgImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop', bubble: 'bg-indigo-600' },
  { name: lang === 'ar' ? 'سديم كوني' : 'Cosmic Nebula', id: 'space_nebula', category: 'space', background: 'bg-black', bgImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop', bubble: 'bg-purple-600' },
  { name: lang === 'ar' ? 'سطح القمر' : 'Lunar Surface', id: 'space_moon', category: 'space', background: 'bg-slate-950', bgImage: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=800&auto=format&fit=crop', bubble: 'bg-sky-600' },
  { name: lang === 'ar' ? 'كواكب الفضاء' : 'Deep Cosmos', id: 'space_cosmos', category: 'space', background: 'bg-black', bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop', bubble: 'bg-blue-600' },
  { name: lang === 'ar' ? 'رائد الفضاء' : 'Astronaut Spacewalk', id: 'space_astronaut', category: 'space', background: 'bg-black', bgImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-600' },
  { name: lang === 'ar' ? 'كوكب الأرض' : 'Earth from Space', id: 'space_earth', category: 'space', background: 'bg-blue-950', bgImage: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop', bubble: 'bg-blue-600' },
  { name: lang === 'ar' ? 'حلقات زحل' : 'Saturn Rings', id: 'space_saturn', category: 'space', background: 'bg-neutral-950', bgImage: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'انفجار نهمي' : 'Supernova Blast', id: 'space_supernova', category: 'space', background: 'bg-purple-950', bgImage: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=800&auto=format&fit=crop', bubble: 'bg-fuchsia-600' },
  { name: lang === 'ar' ? 'الثقب الأسود' : 'Cosmic Black Hole', id: 'space_blackhole', category: 'space', background: 'bg-black', bgImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop', bubble: 'bg-violet-600' },
  { name: lang === 'ar' ? 'مسارات النجوم' : 'Star Trails Night', id: 'space_startrails', category: 'space', background: 'bg-slate-950', bgImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', bubble: 'bg-indigo-500' },

  // ==================== 10. Celebrations & Events (مناسبات واحتفالات 🎆) ====================
  { name: lang === 'ar' ? 'أضواء الاحتفال' : 'Party Lights', id: 'celebration_lights', category: 'celebration', background: 'bg-purple-950', bgImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop', bubble: 'bg-purple-600' },
  { name: lang === 'ar' ? 'ألعاب نارية' : 'Fireworks Night', id: 'fireworks', category: 'celebration', background: 'bg-black', bgImage: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-500' },
  { name: lang === 'ar' ? 'ليالي الهلال' : 'Crescent Night', id: 'crescent_moon', category: 'celebration', background: 'bg-indigo-950', bgImage: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=800&auto=format&fit=crop', bubble: 'bg-sky-600' },
  { name: lang === 'ar' ? 'بريق ذهبي' : 'Golden Shimmer', id: 'golden_glitter', category: 'celebration', background: 'bg-amber-950', bgImage: 'https://images.unsplash.com/photo-1531685250784-7569952593d2?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'بالونات ملونة' : 'Celebration Balloons', id: 'balloons', category: 'celebration', background: 'bg-pink-950', bgImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-500' },
  { name: lang === 'ar' ? 'قصاصات الاحتفال' : 'Festive Confetti', id: 'celeb_confetti', category: 'celebration', background: 'bg-fuchsia-950', bgImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop', bubble: 'bg-fuchsia-600' },
  { name: lang === 'ar' ? 'شرار ألعاب نارية' : 'Sparkler Fun', id: 'celeb_sparkles', category: 'celebration', background: 'bg-neutral-900', bgImage: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-500' },
  { name: lang === 'ar' ? 'عيد ميلاد سعيد' : 'Birthday Party', id: 'celeb_birthday', category: 'celebration', background: 'bg-purple-900', bgImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop', bubble: 'bg-pink-600' },
  { name: lang === 'ar' ? 'أضواء الكرنفال' : 'Carnival Lights', id: 'celeb_carnival', category: 'celebration', background: 'bg-blue-950', bgImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop', bubble: 'bg-indigo-600' },
  { name: lang === 'ar' ? 'أنخبة واحتفال' : 'Sparkling Celebration', id: 'celeb_cheers', category: 'celebration', background: 'bg-amber-950', bgImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },

  // ==================== 11. Cozy & Coffee (قهوة واسترخاء ☕) ====================
  { name: lang === 'ar' ? 'قهوة دافئة' : 'Warm Coffee', id: 'cozy_coffee', category: 'cozy', background: 'bg-stone-900', bgImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-700' },
  { name: lang === 'ar' ? 'نافذة المطر' : 'Rainy Window', id: 'cozy_rain', category: 'cozy', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-700' },
  { name: lang === 'ar' ? 'مكتبة ودفء' : 'Cozy Library', id: 'cozy_books', category: 'cozy', background: 'bg-amber-950', bgImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-800' },
  { name: lang === 'ar' ? 'مدفأة هادئة' : 'Warm Fireplace', id: 'cozy_fireplace', category: 'cozy', background: 'bg-orange-950', bgImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop', bubble: 'bg-orange-700' },
  { name: lang === 'ar' ? 'شاي الأعشاب' : 'Herbal Tea', id: 'cozy_tea', category: 'cozy', background: 'bg-stone-900', bgImage: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-700' },
  { name: lang === 'ar' ? 'كوخ الغابة' : 'Cabin in the Woods', id: 'cozy_cabin', category: 'cozy', background: 'bg-emerald-950', bgImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-700' },
  { name: lang === 'ar' ? 'غطاء صوفي دافئ' : 'Warm Knit Blanket', id: 'cozy_blanket', category: 'cozy', background: 'bg-stone-800', bgImage: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-700' },
  { name: lang === 'ar' ? 'مخبز دافئ' : 'Warm Bakery', id: 'cozy_bakery', category: 'cozy', background: 'bg-amber-900', bgImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'شمعة الاسترخاء' : 'Relaxing Candle', id: 'cozy_candle', category: 'cozy', background: 'bg-neutral-900', bgImage: 'https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'شرفة الغروب' : 'Sunset Balcony Cafe', id: 'cozy_balcony', category: 'cozy', background: 'bg-rose-950', bgImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-600' },

  // ==================== 12. Travel & Landmarks (سفر ومعالم ✈️) ====================
  { name: lang === 'ar' ? 'باريس الساحرة' : 'Romantic Paris', id: 'travel_paris', category: 'travel', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop', bubble: 'bg-blue-600' },
  { name: lang === 'ar' ? 'أضواء طوكيو' : 'Tokyo Lights', id: 'travel_tokyo', category: 'travel', background: 'bg-purple-950', bgImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop', bubble: 'bg-fuchsia-600' },
  { name: lang === 'ar' ? 'قنوات البندقية' : 'Venice Canals', id: 'travel_venice', category: 'travel', background: 'bg-sky-950', bgImage: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?q=80&w=800&auto=format&fit=crop', bubble: 'bg-teal-600' },
  { name: lang === 'ar' ? 'نيويورك أفق' : 'New York Skyline', id: 'travel_ny', category: 'travel', background: 'bg-indigo-950', bgImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop', bubble: 'bg-indigo-600' },
  { name: lang === 'ar' ? 'الأهرامات العريقة' : 'Ancient Pyramids', id: 'travel_pyramids', category: 'travel', background: 'bg-amber-950', bgImage: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-600' },
  { name: lang === 'ar' ? 'كولوسيوم روما' : 'Rome Colosseum', id: 'travel_rome', category: 'travel', background: 'bg-stone-900', bgImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800&auto=format&fit=crop', bubble: 'bg-amber-700' },
  { name: lang === 'ar' ? 'سانتوريني اليونان' : 'Santorini Greece', id: 'travel_santorini', category: 'travel', background: 'bg-blue-900', bgImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800&auto=format&fit=crop', bubble: 'bg-sky-500' },
  { name: lang === 'ar' ? 'تاج محل الهند' : 'Taj Mahal India', id: 'travel_taj', category: 'travel', background: 'bg-rose-950', bgImage: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop', bubble: 'bg-rose-600' },
  { name: lang === 'ar' ? 'جبال الألب السويسرية' : 'Swiss Alps', id: 'travel_alps', category: 'travel', background: 'bg-slate-900', bgImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=800&auto=format&fit=crop', bubble: 'bg-cyan-600' },
  { name: lang === 'ar' ? 'طبيعة بالي الاستوائية' : 'Bali Tropical Paradise', id: 'travel_bali', category: 'travel', background: 'bg-emerald-950', bgImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop', bubble: 'bg-emerald-600' },

  // ==================== 13. Modern Gradients (تدرجات 🌈) ====================
  { name: lang === 'ar' ? 'الشفق القطبي' : 'Aurora Borealis', id: 'aurora', category: 'gradients', background: 'bg-teal-950', bgImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop', bubble: 'bg-teal-600' },
  { name: lang === 'ar' ? 'طيف هولوجرام' : 'Hologram Spectrum', id: 'hologram', category: 'gradients', background: 'bg-purple-950', bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop', bubble: 'bg-violet-600' },
  { name: lang === 'ar' ? 'تدرج الغروب' : 'Sunset Flare Gradient', id: 'grad_sunset', category: 'gradients', background: 'bg-gradient-to-br from-purple-900 via-rose-800 to-amber-700', bubble: 'bg-rose-500' },
  { name: lang === 'ar' ? 'أعماق المحيط' : 'Ocean Deep Gradient', id: 'grad_ocean', category: 'gradients', background: 'bg-gradient-to-br from-blue-950 via-teal-900 to-emerald-950', bubble: 'bg-cyan-500' },
  { name: lang === 'ar' ? 'سايبر نيون' : 'Cyber Neon Gradient', id: 'grad_neon', category: 'gradients', background: 'bg-gradient-to-r from-fuchsia-900 via-indigo-900 to-purple-950', bubble: 'bg-fuchsia-600' },
  { name: lang === 'ar' ? 'باستيل حالم' : 'Dreamy Pastel Gradient', id: 'grad_pastel', category: 'gradients', background: 'bg-gradient-to-tr from-pink-200 via-purple-200 to-indigo-200 dark:from-pink-900/40 dark:via-purple-900/40 dark:to-indigo-900/40', bubble: 'bg-violet-500' },
  { name: lang === 'ar' ? 'شعاع الزمرد' : 'Emerald Beam Gradient', id: 'grad_emerald', category: 'gradients', background: 'bg-gradient-to-b from-emerald-900 via-teal-950 to-green-950', bubble: 'bg-emerald-500' },
  { name: lang === 'ar' ? 'الشفق الداكن' : 'Dark Dusk Gradient', id: 'grad_dusk', category: 'gradients', background: 'bg-gradient-to-b from-slate-900 via-purple-950 to-black', bubble: 'bg-purple-600' },
  { name: lang === 'ar' ? 'ذهب سائل' : 'Liquid Gold Gradient', id: 'grad_gold', category: 'gradients', background: 'bg-gradient-to-br from-amber-900 via-yellow-800 to-stone-900', bubble: 'bg-amber-500' },
  { name: lang === 'ar' ? 'بنفسجي ملكي' : 'Royal Violet Gradient', id: 'grad_violet', category: 'gradients', background: 'bg-gradient-to-tr from-violet-950 via-indigo-900 to-fuchsia-950', bubble: 'bg-violet-600' },

  // ==================== 14. Classic Color Themes (كلاسيكي 🎨) ====================
  { name: lang === 'ar' ? 'افتراضي' : 'Default', id: 'default', category: 'classic', background: 'bg-white dark:bg-gray-900', bubble: 'bg-blue-600' },
  { name: lang === 'ar' ? 'محيط' : 'Ocean', id: 'ocean', category: 'classic', background: 'bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-blue-900/20', bubble: 'bg-cyan-600' },
  { name: lang === 'ar' ? 'صداقة' : 'Friendship', id: 'friendship', category: 'classic', background: 'bg-gradient-to-tr from-yellow-50 via-orange-50 to-blue-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-blue-900/20', bubble: 'bg-indigo-500' },
  { name: lang === 'ar' ? 'هدوء' : 'Tranquility', id: 'tranquility', category: 'classic', background: 'bg-gradient-to-b from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20', bubble: 'bg-teal-600' },
  { name: lang === 'ar' ? 'غروب' : 'Sunset', id: 'sunset', category: 'classic', background: 'bg-gradient-to-b from-orange-50 to-pink-50 dark:from-gray-900 dark:to-red-900/20', bubble: 'bg-orange-600' },
  { name: lang === 'ar' ? 'توت' : 'Berry', id: 'berry', category: 'classic', background: 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-900/20', bubble: 'bg-purple-600' },
  { name: lang === 'ar' ? 'غابة' : 'Forest', id: 'forest', category: 'classic', background: 'bg-gradient-to-b from-green-50 to-emerald-50 dark:from-gray-900 dark:to-green-900/20', bubble: 'bg-emerald-600' },
  { name: lang === 'ar' ? 'ليلي' : 'Midnight', id: 'midnight', category: 'classic', background: 'bg-gray-100 dark:bg-gray-800', bubble: 'bg-gray-800 dark:bg-gray-600' },
  { name: lang === 'ar' ? 'صبغ' : 'Tie Dye', id: 'tie_dye', category: 'classic', background: 'bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20', bubble: 'bg-violet-600' },
  { name: lang === 'ar' ? 'أرض' : 'Earth', id: 'earth', category: 'classic', background: 'bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800', bubble: 'bg-stone-600' },
];

const EMOJI_CATEGORIES = {
 smileys: {
    icon: Smile,
    label: "ابتسامات",
    emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬",
             "💋","💌","💘","💝","💖","💗","💓","💞","💕","💟","❣","💔","❤","🧡","💛","💚","💙","💜","🤎","🖤","🤍","💯","💢","💥","💫","💦","💨","🕳","💣","💬","👁️‍🗨️","🗨","🗯","💭","💤","😈","👿","💀","☠","💩","🤡","👹","👺","👻","👽","👾","🤖"]                                
  },
  animals: {
    icon: Cat,
    label: "حيوانات",
    emojis: ["😺","😸","😹","😻","😼","😽","🙀","😿","😾","🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷","🕸","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🐓","🦃","🦚","🦜","🦢","🦩","🕊","🐇","🦝","🦨","🦡","🦦","🦥","🐁","🐀","🐿","🦔","🐾","🐉","🐲"]
  },
  food: {
    icon: Coffee,
    label: "طعام",
    emojis: ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶","🌽","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🥪","🥙","🧆","🌮","🌯","🥗","🥘","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","☕","🍵","🧃","🥤","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊","🥄","🍴","🍽","🥣","🥡","🥢","🧂"]
  },
  activities: {
    icon: Gamepad2,
    label: "أنشطة",
    emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸","🥌","🎿","⛷","🏂","🪂","🏋️","🤼","🤸","⛹️","🤺","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖","🏵","🎗","🎫","🎟","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🎲","♟","🎯","🎳","🎮","🎰","🧩"]
  },
  travel: {
    icon: Plane,
    label: "سفر",
    emojis: ["🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🚚","🚛","🚜","🏍","🛵","🚲","🦼","🦽","🛴","🚨","🚔","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈","🛫","🛬","🛩","💺","🛰","🚀","🛸","🚁","🛶","⛵","🚤","🛥","🛳","⛴","🚢","⚓","⛽","🚧","🚦","🚥","🚏","🗺","🗿","🗽","🗼","🏰","🏯","🏟","🎡","🎢","🎠","⛲","⛱","🏖","🏝","🏜","🌋","⛰","🏔","🗻","🏕","⛺","🏠","🏡","🏘","🏚","🏗","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏪","🏫","🏩","💒","🏛","⛪","🕌","🕍","🛕","🕋","⛩","🛤","🛣","🗾","🎑","🏞","🌅","🌄","🌠","🎇","🎆","🌇","🌆","🏙","🌃","🌌","🌉","🌁"]
  },
  objects: {
    icon: Lightbulb,
    label: "أشياء",
    emojis: ["⌚","📱","📲","💻","⌨","🖥","🖨","🖱","🖲","🕹","🗜","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📽","🎞","📞","☎","📟","📠","📺","📻","🎙","🎚","🎛","🧭","⏱","⏲","⏰","🕰","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯","🪔","🧯","🛢","💸","💵","💴","💶","💷","🪙","💰","💳","💎","⚖","🧰","🔧","🔨","⚒","🛠","⛏","🪓","🧱","⚙","🪜","🩹","🩺","💈","🧲","🔫","💣","🧨","🔪","🗡","⚔","🛡","🚬","⚰","⚱","🏺","🔮","📿","🧿","💊","💉","🩸","🧬","🦠","🧫","🧪","🌡","🧹","🧺","🧻","🚽","🚰","🚿","🛁","🛀","🧼","🪥","🪒","🧽","🪣","🧴","🛎","🔑","🗝","🚪","🪑","🛋","🛏","🛌","🧸","🪆","🖼","🪞"]
  },
  flags: {
    icon: Flag,
    label: "أعلام",
    emojis: ["🏁","🚩","🎌","🏴","🏳","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️","🇦🇩","🇦🇪","🇦🇫","🇦🇬","🇦🇮","🇦🇱","🇦🇲","🇦🇴","🇦🇶","🇦🇷","🇦🇸","🇦🇹","🇦🇺","🇦🇼","🇦🇽","🇦🇿","🇧🇦","🇧🇧","🇧🇩","🇧🇪","🇧🇫","🇧🇬","🇧🇭","🇧🇮","🇧🇯","🇧🇱","🇧🇲","🇧🇳","🇧🇴","🇧🇶","🇧🇷","🇧🇸","🇧🇹","🇧🇻","🇧🇼","🇧🇾","🇧🇿","🇨🇦","🇨🇨","🇨🇩","🇨🇫","🇨🇬","🇨🇭","🇨🇮","🇨🇰","🇨🇱","🇨🇲","🇨🇳","🇨🇴","🇨🇷","🇨🇺","🇨🇻","🇨🇼","🇨🇽","🇨🇾","🇨🇿","🇩🇪","🇩🇯","🇩🇰","🇩🇲","🇩🇴","🇩🇿","🇪🇦","🇪🇨","🇪🇪","🇪🇬","🇪Ｈ","🇪🇷","🇪🇸","🇪🇹","🇪🇺","🇫🇮","🇫🇯","🇫🇰","🇫🇲","🇫🇴","🇫🇷","🇬🇦","🇬🇧","🇬🇩","🇬🇪","🇬🇫","🇬🇬","🇬Ｈ","🇬🇮","🇬🇱","🇬🇲","🇬🇳","🇬🇵","🇬🇶","🇬🇷","🇬🇸","🇬🇹","🇬🇺","🇬🇼","🇬🇾","🇭🇰","🇭🇲","🇭🇳","🇭🇷","🇭🇹","🇭🇺","🇮🇨","🇮🇩","🇮🇱","🇮🇲","🇮🇳","🇮🇴","🇮🇶","🇮🇷","🇮🇸","🇮🇹","🇯🇪","🇯🇲","🇯🇴","🇯🇵","🇰🇪","🇰🇬","🇰🇭","🇰🇮","🇰🇲","🇰🇳","🇰🇵","🇰🇷",
              "🇰🇼","🇰🇾","🇰🇿","🇱🇦","🇱🇧","🇱🇨","🇱🇮","🇱🇰","🇱🇷","🇱🇸","🇱🇹","🇱🇺","🇱🇻","🇱🇾","🇲🇦","🇲🇨","🇲🇩","🇲🇪","🇲🇫","🇲🇬","🇲Ｈ","🇲🇰","🇲🇱","🇲🇲","🇲🇳","🇲🇴","🇲🇵","🇲🇶","🇲🇷","🇲🇸","🇲🇹","🇲🇺","🇲🇻","🇲🇼","🇲🇽","🇲🇾","🇲🇿","🇳🇦","🇳🇨","🇳🇪","🇳🇫","🇳🇬","🇳🇮","🇳🇱","🇳🇴","🇳🇵","🇳🇷","🇳🇺","🇳🇿","🇴🇲","🇵🇦","🇵🇪","🇵🇫","🇵🇬","🇵🇭","🇵🇰","🇵🇱","🇵🇲","🇵🇳","🇵🇷","🇵🇸","🇵🇹","🇵🇼","🇵🇾","🇶🇦","🇷🇪","🇷🇴","🇷🇸","🇷🇺","🇷🇼","🇸🇦","🇸🇧","🇸🇨","🇸🇩","🇸🇪","🇸🇬","🇸Ｈ","🇸🇮","🇸🇯","🇸🇰","🇸🇱","🇸🇲","🇸🇳","🇸🇴","🇸🇷","🇸🇸","🇸🇹","🇸🇻","🇸🇽","🇸🇾","🇸🇿","🇹🇦","🇹🇨","🇹🇩","🇹🇫","🇹🇬","🇹Ｈ","🇹🇯","🇹🇰","🇹🇱","🇹🇲","🇹🇳","🇹🇴","🇹🇷","🇹🇹","🇹🇻","🇹🇼","🇹🇿","🇺🇦","🇺🇬","🇺🇲","🇺🇳","🇺🇸","🇺🇾","🇺🇿","🇻🇦","🇻🇨","🇻🇪","🇻🇬","🇻🇮","🇻🇳","🇻🇺","🇼🇫","🇼🇸","🇽🇰","🇾🇪","🇾🇹","🇿🇦","🇿🇲","🇿🇼"] 
  
  }
};

const STICKER_CATEGORIES = {
  animals: {
    icon: Cat,
    label: "animals",
    stickers: [
      { id: 'st1', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png', alt: 'Happy Cat' },
      { id: 'st2', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712139.png', alt: 'Love Cat' },
      { id: 'st3', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712093.png', alt: 'Sad Cat' },
      { id: 'st4', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712128.png', alt: 'Angry Cat' },
      { id: 'st5', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712102.png', alt: 'Surprised Cat' },
      { id: 'st6', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712147.png', alt: 'Cool Cat' },
      { id: 'cat7', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712147.png', alt: 'Crying Cat' },
      { id: 'cat8', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712156.png', alt: 'Laughing Cat' },
      { id: 'cat9', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712163.png', alt: 'Sleeping Cat' },
      { id: 'cat10', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712174.png', alt: 'Scared Cat' },
      { id: 'cat11', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712182.png', alt: 'Shy Cat' },
      { id: 'cat12', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712191.png', alt: 'Smart Cat' },
      { id: 'cat13', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712200.png', alt: 'Party Cat' },
      { id: 'cat14', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712210.png', alt: 'Devil Cat' },
      { id: 'cat15', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712220.png', alt: 'Angel Cat' },
      { id: 'cat16', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712230.png', alt: 'Hungry Cat' },
      { id: 'cat17', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712240.png', alt: 'Kiss Cat' },
      { id: 'cat18', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712250.png', alt: 'Broken Heart Cat' },
      { id: 'cat19', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712260.png', alt: 'Tired Cat' },
      { id: 'cat20', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712270.png', alt: 'Excited Cat' },
      { id: 'st7', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712116.png', alt: 'Sleepy Cat' },
      { id: 'st6_dog', url: 'https://cdn-icons-png.flaticon.com/512/10603/10603770.png', alt: 'Cool Dog' },
      { id: 'st7_dog', url: 'https://cdn-icons-png.flaticon.com/512/10603/10603728.png', alt: 'Laughing Dog' },
      { id: 'dog3', url: 'https://cdn-icons-png.flaticon.com/512/10603/10603741.png', alt: 'Happy Dog' },
      { id: 'dog4', url: 'https://cdn-icons-png.flaticon.com/512/10603/10603756.png', alt: 'Love Dog' },
    ]
  },
  reactions: {
    icon: Zap,
    label: "reactions",
    stickers: [
      { id: 'st8', url: 'https://cdn-icons-png.flaticon.com/512/766/766023.png', alt: 'High Five' },
      { id: 'st9', url: 'https://cdn-icons-png.flaticon.com/512/766/766029.png', alt: 'Cheers' },
      { id: 'st10', url: 'https://cdn-icons-png.flaticon.com/512/766/766018.png', alt: 'Celebration' },
      { id: 'st13', url: 'https://cdn-icons-png.flaticon.com/512/1629/1629881.png', alt: 'Star' },
      { id: 'st14', url: 'https://cdn-icons-png.flaticon.com/512/1629/1629852.png', alt: 'Fire' },
      { id: 'st25', url: 'https://cdn-icons-png.flaticon.com/512/833/833601.png', alt: 'Thumbs Up' },
      { id: 'st26', url: 'https://cdn-icons-png.flaticon.com/512/833/833631.png', alt: 'Love' },
      { id: 'st15_party', url: 'https://cdn-icons-png.flaticon.com/512/766/766014.png', alt: 'Party' },
    ]
  },
  love: {
    icon: Heart,
    label: "love",
    stickers: [
        { id: 'st15_heart', url: 'https://cdn-icons-png.flaticon.com/512/2904/2904973.png', alt: 'Heart' },
        { id: 'st16', url: 'https://cdn-icons-png.flaticon.com/512/2904/2904843.png', alt: 'Love Letter' },
        { id: 'st17', url: 'https://cdn-icons-png.flaticon.com/512/742/742750.png', alt: 'Kiss' },
        { id: 'st18', url: 'https://cdn-icons-png.flaticon.com/512/2904/2904857.png', alt: 'Rose' },
        { id: 'st19', url: 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png', alt: 'Heart Eyes' },
        { id: 'st20', url: 'https://cdn-icons-png.flaticon.com/512/2589/2589197.png', alt: 'Laugh Cry' },
        { id: 'st21', url: 'https://cdn-icons-png.flaticon.com/512/2589/2589182.png', alt: 'Cool Emoji' },
        { id: 'st22', url: 'https://cdn-icons-png.flaticon.com/512/2589/2589214.png', alt: 'Angry Emoji' },
        
    ]
  },
  characters: {
    icon: Ghost,
    label: "characters",
    stickers: [
      { id: 'st11', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193239.png', alt: 'Ghost' },
      { id: 'st12', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193278.png', alt: 'Alien' },
      { id: 'st19_robot', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193248.png', alt: 'Robot' },
      { id: 'st20_monster', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193299.png', alt: 'Monster' },
      { id: 'fun4', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193246.png', alt: 'Devil' },
      { id: 'fun5', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193253.png', alt: 'Zombie' },
      { id: 'fun6', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193286.png', alt: 'Vampire' },
      { id: 'fun7', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193294.png', alt: 'Skull' },
      { id: 'fun8', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193301.png', alt: 'Pumpkin' },
      { id: 'fun9', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193310.png', alt: 'Witch Hat' },
      { id: 'fun11', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193331.png', alt: 'Spider' },
      { id: 'fun12', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193340.png', alt: 'UFO' },
      { id: 'fun13', url: 'https://cdn-icons-png.flaticon.com/512/4193/4193352.png', alt: 'Robot Head' },
    ]
  }
};

const FRIENDS_LIST = [
  { id: 'f1', name: 'أحمد محمد', avatar: 'https://i.pravatar.cc/150?u=f1' },
  { id: 'f2', name: 'سارة علي', avatar: 'https://i.pravatar.cc/150?u=f2' },
  { id: 'f3', name: 'خالد عمر', avatar: 'https://i.pravatar.cc/150?u=f3' },
  { id: 'f4', name: 'منى سعيد', avatar: 'https://i.pravatar.cc/150?u=f4' },
  { id: 'f5', name: 'يوسف حسن', avatar: 'https://i.pravatar.cc/150?u=f5' },
];

const REACTIONS_LIST = [
    { name: 'like', label: 'إعجاب', emoji: '👍', color: 'text-blue-600', animation: 'animate-bounce' },
    { name: 'love', label: 'أحببته', emoji: '❤️', color: 'text-red-600', animation: 'animate-pulse' },
    { name: 'care', label: 'أدعمك', emoji: '🥰', color: 'text-yellow-500', animation: 'animate-bounce' },
    { name: 'haha', label: 'هاها', emoji: '😆', color: 'text-yellow-500', animation: 'animate-bounce' },
    { name: 'wow', label: 'واو', emoji: '😮', color: 'text-yellow-500', animation: 'animate-pulse' },
    { name: 'sad', label: 'أحزنني', emoji: '😢', color: 'text-yellow-500', animation: 'animate-bounce' },
    { name: 'angry', label: 'أغضبني', emoji: '😡', color: 'text-orange-600', animation: 'animate-bounce' },
];

// --- Mock WebSocket Service ---
class MockWebSocket {
  private listeners: { [key: string]: Function[] } = {};
  
  connect() {
    console.log('Mock Socket Connected');
  }

  emit(event: string, data: any) {
    setTimeout(() => {
      if (event === 'send_message') {
        const chatId = data?.chatId || data?.userId;
        this.trigger('message_status_update', { id: data.id, status: 'delivered', chatId });
        setTimeout(() => {
          this.trigger('message_status_update', { id: data.id, status: 'seen', chatId });
        }, 3000);
      }
    }, 500);
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  trigger(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

const socket = new MockWebSocket();

// --- Audio Player Component ---
const AudioPlayer = ({ src, sender }: { src: string, sender: 'me' | 'them' }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };
  
  const formatTime = (t: number) => {
    if (!t) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const btnClass = sender === 'me' ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500';
  const textClass = sender === 'me' ? 'text-white' : 'text-gray-600 dark:text-gray-200';
  const trackClass = sender === 'me' ? 'bg-white/30' : 'bg-gray-300 dark:bg-gray-600';

  return (
    <div className="flex items-center gap-1.5 min-w-[165px] max-w-[200px] py-0.5 px-0.5">
        <audio ref={audioRef} src={src} className="hidden" preload="metadata" />
        <button onClick={togglePlay} className={`p-1.5 rounded-full transition flex-shrink-0 ${btnClass}`}>
            {isPlaying ? <Pause className={`w-3.5 h-3.5 fill-current ${textClass}`} /> : <Play className={`w-3.5 h-3.5 fill-current ${textClass}`} />}
        </button>
        <div className="flex-1 flex flex-col justify-center gap-0.5 min-w-0">
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (audioRef.current) audioRef.current.currentTime = val;
                setCurrentTime(val);
              }}
              className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${trackClass}`}
            />
            <div className={`flex justify-between items-center text-[9px] opacity-80 ${textClass}`}>
               <span>{formatTime(currentTime)}</span>
               <span>{formatTime(duration)}</span>
            </div>
        </div>
        <button 
           onClick={toggleSpeed} 
           className={`px-1 py-0.5 rounded text-[9px] font-extrabold transition shadow-sm flex-shrink-0 ${btnClass} ${textClass}`}
           title="سرعة التشغيل"
        >
           {playbackSpeed}x
        </button>
    </div>
  );
};

const ChatWindow: React.FC<ChatWindowProps> = ({ user, onClose, currentUser, index, onViewProfile }) => {
  const { t, dir, language } = useLanguage();
  const THEMES = getThemes(language);
  
  const getStorageKey = () => `chat_${currentUser.id}_${user.id}`;
  const getSettingsKey = () => `chat_settings_${currentUser.id}_${user.id}`;

  // --- Settings State ---
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(getSettingsKey());
    return saved ? JSON.parse(saved) : {
      theme: THEMES[0], // Store full theme object
      nickname: '',
      quickEmoji: '👍',
      isMuted: false,
      isBlocked: false,
      readReceipts: true,
      readReceiptText: ''
    };
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(getStorageKey());
    return saved ? JSON.parse(saved) : [
      { 
        id: '1', 
        text: language === 'ar' ? 'مرحباً! كيف حالك؟' : 'Hello! How are you?', 
        sender: 'them', 
        timestamp: '10:00 ' + (language === 'ar' ? 'م' : 'PM'), 
        rawTimestamp: Date.now(),
        type: 'text', 
        status: 'seen', 
        reactions: {},
        readReceiptEnabled: true
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Advanced Features State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerActivity, setPartnerActivity] = useState<'idle' | 'typing' | 'recording'>('idle');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  
  // Search Inside Chat State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Emoji Picker States
  const [activeEmojiTab, setActiveEmojiTab] = useState<'recent' | keyof typeof EMOJI_CATEGORIES>('recent');
  const [activeStickerTab, setActiveStickerTab] = useState<keyof typeof STICKER_CATEGORIES>('animals');
  const [pickerMode, setPickerMode] = useState<'emoji' | 'sticker'>('emoji');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [pendingEmojis, setPendingEmojis] = useState('');
  const tempRecentEmojis = useRef<string[]>([]); 

  // Reaction Mode State
  const [messageReactionTarget, setMessageReactionTarget] = useState<string | null>(null);
  const [menuPlacement, setMenuPlacement] = useState<{ v: 'above' | 'below'; h: 'left-0' | 'right-0' }>({ v: 'above', h: 'left-0' });

  // Modals State
  const [activeModal, setActiveModal] = useState<'report' | 'readReceipts' | 'theme' | 'emoji' | 'nickname' | 'deleteConfirm' | 'deleteMessageConfirm' | 'unsend' | 'forward' | 'blockConfirm' | 'profile' | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [forwardStatus, setForwardStatus] = useState<{[key: string]: 'idle' | 'sent'}>({});
  const [unsendOption, setUnsendOption] = useState<'everyone' | 'me'>('everyone');

  // Theme Preview State
  const [previewTheme, setPreviewTheme] = useState<Theme>(settings.theme);
  const [selectedThemeCategory, setSelectedThemeCategory] = useState<string>('all');
  const categoryTabsRef = useRef<HTMLDivElement>(null);

  // File Upload State
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const isRecordingRef = useRef(false);
  const isRecordingLockedRef = useRef(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const shouldDiscardRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const updateRecordingLocked = (locked: boolean) => {
    setIsRecordingLocked(locked);
    isRecordingLockedRef.current = locked;
  };

  const updateIsRecording = (rec: boolean) => {
    setIsRecording(rec);
    isRecordingRef.current = rec;
  };
  
  // Call State
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Media Viewer State
  const [viewingMedia, setViewingMedia] = useState<{ message: ChatMessage, type: 'image' | 'video' | 'sticker' } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Emoji Long Press State
  const [quickEmojiSize, setQuickEmojiSize] = useState(1);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Message Actions State
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const [confirmReactionRemove, setConfirmReactionRemove] = useState<{ msgId: string, emoji: string } | null>(null);

  // Media Modal State (for Sidebar - now unused in UI but kept for compatibility)
  const [modalCommentText, setModalCommentText] = useState('');
  const [showMediaReactions, setShowMediaReactions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleStartReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  };
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const modalCommentInputRef = useRef<HTMLInputElement>(null);
  const isMinimizedRef = useRef(isMinimized);

  // Update Position Logic for Tighter Spacing
  const positionStyle = dir === 'rtl' 
    ? { left: `${16 + index * (CHAT_WIDTH + CHAT_GAP)}px` } 
    : { right: `${16 + index * (CHAT_WIDTH + CHAT_GAP)}px` };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Effects ---

  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify(messages));
  }, [messages, currentUser.id, user.id]);

  useEffect(() => {
    localStorage.setItem(getSettingsKey(), JSON.stringify(settings));
  }, [settings, currentUser.id, user.id]);

  useEffect(() => {
      const savedRecents = localStorage.getItem('chat_recent_emojis');
      if (savedRecents) {
          setRecentEmojis(JSON.parse(savedRecents));
      }
  }, []);

  useEffect(() => {
    // Keep the ref in sync for the closure access in timeouts
    isMinimizedRef.current = isMinimized;
    // Reset unread count when opening
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  useEffect(() => {
    socket.connect();

    const handleStatusUpdate = (data: { id: string, status: 'sent'|'delivered'|'seen', chatId?: string }) => {
      if (data?.chatId && data.chatId !== user.id) return;
      setMessages(prev => prev.map(msg => msg.id === data.id ? { ...msg, status: data.status } : msg));
    };

    const handleTypingStart = (data?: { chatId?: string }) => {
      if (data?.chatId && data.chatId !== user.id) return;
      setIsTyping(true);
      setPartnerActivity(prev => prev === 'recording' ? 'recording' : 'typing');
    };
    const handleRecordingStart = (data?: { chatId?: string }) => {
      if (data?.chatId && data.chatId !== user.id) return;
      setIsTyping(true);
      setPartnerActivity('recording');
    };
    const handleTypingStop = (data?: { chatId?: string }) => {
      if (data?.chatId && data.chatId !== user.id) return;
      setIsTyping(false);
      setPartnerActivity('idle');
    };

    socket.on('message_status_update', handleStatusUpdate);
    socket.on('partner_typing_start', handleTypingStart);
    socket.on('partner_recording_start', handleRecordingStart);
    socket.on('partner_typing_stop', handleTypingStop);

    return () => {
      socket.off('message_status_update', handleStatusUpdate);
      socket.off('partner_typing_start', handleTypingStart);
      socket.off('partner_recording_start', handleRecordingStart);
      socket.off('partner_typing_stop', handleTypingStop);
    };
  }, [user.id]);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, isMinimized, callStatus, isTyping, partnerActivity, replyingTo, pendingMedia]);

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (longPressIntervalRef.current) clearInterval(longPressIntervalRef.current);
      if (localStream) localStream.getTracks().forEach(track => track.stop());
      if (remoteStream) remoteStream.getTracks().forEach(track => track.stop());
      if (pendingMedia) URL.revokeObjectURL(pendingMedia.url);
    };
  }, [localStream, remoteStream]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      setRecordingDuration(0);
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      recordingIntervalRef.current = interval;
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Global handling for menus inside chat window
      if (messageMenuOpen) {
          const target = event.target as HTMLElement;
          if (!target.closest('.message-menu-container') && !target.closest('.message-menu-trigger')) {
             setMessageMenuOpen(null);
          }
      }
      
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setShowMoreMenu(false);
        setActiveReactionId(null);
        setMessageReactionTarget(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [messageMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingMedia(null);
    };
    if (viewingMedia) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingMedia]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    } 
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream, callStatus]);

  useEffect(() => {
    if (!showEmojiPicker) {
      setPendingEmojis('');
      // Reset picker mode when closed if it was in reaction mode
      if (messageReactionTarget) {
          setMessageReactionTarget(null);
          setPickerMode('emoji');
      }
    }
  }, [showEmojiPicker]);

  useEffect(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, [viewingMedia]);

  // --- Logic Helpers ---

  const isVideo = (url: string) => {
    return url.startsWith('data:video/') || url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg');
  };

  const getFlagIsoCode = (emoji: string) => {
    const codePoints = Array.from(emoji).map(c => c.codePointAt(0));
    if (codePoints.length !== 2 || !codePoints[0] || !codePoints[1]) return null;
    const char1 = String.fromCharCode(codePoints[0] - 127397);
    const char2 = String.fromCharCode(codePoints[1] - 127397);
    return (char1 + char2).toLowerCase();
  };

  const fetchLinkPreview = async (text: string): Promise<LinkPreviewData | undefined> => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    if (match && match[0]) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            url: match[0],
            title: 'Mock Page Title for ' + match[0],
            description: 'This is a simulated link preview description that would come from OG tags.',
            image: 'https://via.placeholder.com/300x150?text=Link+Preview'
          });
        }, 500);
      });
    }
    return undefined;
  };

  const createMessage = (content: string, type: ChatMessage['type'] = 'text', mediaUrl?: string, fileName?: string, linkPreview?: LinkPreviewData, emojiSize?: number, replyToId?: string): ChatMessage => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}_${Math.random()}`,
    text: content,
    mediaUrl,
    fileName,
    sender: 'me',
    type,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    rawTimestamp: Date.now(),
    status: 'sent',
    reactions: {},
    replyTo: replyToId || (replyingTo ? replyingTo.id : undefined),
    linkPreview,
    emojiSize,
    readReceiptEnabled: settings.readReceipts
  });

  const handleSend = async (e?: React.FormEvent, overrideText?: string, overrideReplyTo?: string) => {
    e?.preventDefault();
    
    const textToSend = overrideText !== undefined ? overrideText : inputText;

    if (!textToSend.trim() && !pendingMedia) return;
    if (settings.isBlocked) {
        alert('Cannot send message to blocked user.');
        return;
    }

    let mediaUrl: string | undefined = undefined;
    let msgType: ChatMessage['type'] = 'text';
    let fileName: string | undefined = undefined;

    if (pendingMedia && !overrideText) {
       msgType = pendingMedia.type;
       fileName = pendingMedia.file.name;
       mediaUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(pendingMedia.file);
       });
    }

    const linkData = (!pendingMedia && textToSend) ? await fetchLinkPreview(textToSend) : undefined;
    if (linkData && msgType === 'text') msgType = 'link';

    const newMessage = createMessage(textToSend, msgType, mediaUrl, fileName, linkData, undefined, overrideReplyTo);
    
    setMessages(prev => [...prev, newMessage]);
    playAudio('message_sent');

    // Process Recents from Temp Buffer on Send
    if (tempRecentEmojis.current.length > 0) {
        const newRecents = [...new Set([...tempRecentEmojis.current, ...recentEmojis])].slice(0, 24);
        setRecentEmojis(newRecents);
        localStorage.setItem('chat_recent_emojis', JSON.stringify(newRecents));
        tempRecentEmojis.current = [];
    }
    
    if (!overrideText) {
        setInputText('');
        setPendingMedia(null);
        setShowEmojiPicker(false);
        setReplyingTo(null);
    }

    socket.emit('send_message', newMessage);
    simulateReply(msgType, newMessage.text);
  };

  // Emoji Long Press Handlers
  const handleQuickEmojiDown = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (settings.isBlocked) return;
      setIsLongPressing(true);
      setQuickEmojiSize(1);

      longPressIntervalRef.current = setInterval(() => {
          setQuickEmojiSize(prev => Math.min(prev + 0.1, 3.0));
      }, 100);
  };

  const handleQuickEmojiUp = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (settings.isBlocked) return;
      if (!isLongPressing) return;
      
      setIsLongPressing(false);
      if (longPressIntervalRef.current) clearInterval(longPressIntervalRef.current);

      const newMessage = createMessage(settings.quickEmoji, 'emoji', undefined, undefined, undefined, quickEmojiSize);
      setMessages(prev => [...prev, newMessage]);
      socket.emit('send_message', newMessage);
      playAudio('like');
      simulateReply('like');
      
      setTimeout(() => setQuickEmojiSize(1), 200);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (messageReactionTarget) {
        // REACTION MODE: Add reaction immediately, update recents, close picker
        toggleReaction(messageReactionTarget, emoji);
        
        const newRecents = [...new Set([emoji, ...recentEmojis])].slice(0, 24);
        setRecentEmojis(newRecents);
        localStorage.setItem('chat_recent_emojis', JSON.stringify(newRecents));
        
        setShowEmojiPicker(false);
        setMessageReactionTarget(null);
    } else {
        // INPUT MODE: Insert to input, buffer recent
        setInputText(prev => prev + emoji);
        tempRecentEmojis.current.push(emoji);
        setShowEmojiPicker(false);
    }
  };

  const handleStickerSelect = (sticker: { url: string }) => {
      if (settings.isBlocked) return;
      const newMessage = createMessage('', 'sticker', sticker.url);
      setMessages(prev => [...prev, newMessage]);
      socket.emit('send_message', newMessage);
      playAudio('message_sent');
      setShowEmojiPicker(false);
      simulateReply('sticker');
  };

  const cancelRecording = () => {
    shouldDiscardRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    updateIsRecording(false);
    updateRecordingLocked(false);
    setRecordingDuration(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const stopAndSendRecording = () => {
    shouldDiscardRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    updateIsRecording(false);
    updateRecordingLocked(false);
    setRecordingDuration(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const startRecording = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (settings.isBlocked) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(language === 'ar' ? 'ميزة التسجيل الصوتي غير مدعومة في هذا المتصفح.' : 'Voice recording is not supported in this browser.');
      return;
    }

    if (pendingMedia) return;

    if (e) {
      const clientX = 'touches' in e && e.touches.length > 0 
        ? e.touches[0].clientX 
        : ('clientX' in e ? e.clientX : null);
      const clientY = 'touches' in e && e.touches.length > 0 
        ? e.touches[0].clientY 
        : ('clientY' in e ? e.clientY : null);
      touchStartXRef.current = clientX;
      touchStartYRef.current = clientY;
    }

    try {
      shouldDiscardRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        updateIsRecording(false);
        updateRecordingLocked(false);
        setRecordingDuration(0);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        if (shouldDiscardRef.current) {
          shouldDiscardRef.current = false;
          audioChunksRef.current = [];
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const newMessage = createMessage('', 'audio', audioUrl);
        setMessages(prev => [...prev, newMessage]);
        socket.emit('send_message', newMessage);
        playAudio('message_sent');
        simulateReply('audio');
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      updateIsRecording(true); 
      updateRecordingLocked(false);
      setRecordingDuration(0);
    } catch (err: any) {
      console.error('Error recording audio:', err);
      let errorMessage = language === 'ar' ? 'حدث خطأ أثناء محاولة الوصول إلى الميكروفون.' : 'An error occurred while trying to access the microphone.';
      
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = language === 'ar' ? 'لم يتم العثور على ميكروفون متصل بجهازك.' : 'No microphone was found connected to your device.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = language === 'ar' ? 'يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.' : 'Please allow microphone access from your browser settings.';
      }
      alert(errorMessage);
      updateIsRecording(false);
      updateRecordingLocked(false);
    }
  };

  const handleRecordingTouchOrMouseMove = (clientX: number, clientY: number) => {
    if (isRecordingRef.current && !isRecordingLockedRef.current) {
      // Swipe UP -> Lock recording
      if (touchStartYRef.current !== null) {
        const deltaY = clientY - touchStartYRef.current;
        if (deltaY < -25) {
          updateRecordingLocked(true);
          return;
        }
      }
      // Swipe LEFT -> Cancel / Delete recording
      if (touchStartXRef.current !== null) {
        const deltaX = clientX - touchStartXRef.current;
        if (deltaX < -40) {
          cancelRecording();
          return;
        }
      }
    }
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!isRecordingRef.current || isRecordingLockedRef.current) return;
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : ('clientX' in e ? (e as MouseEvent).clientX : null);
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : ('clientY' in e ? (e as MouseEvent).clientY : null);
      if (clientX !== null && clientY !== null) {
        handleRecordingTouchOrMouseMove(clientX, clientY);
      }
    };

    const handleGlobalRelease = () => {
      if (isRecordingRef.current && !isRecordingLockedRef.current) {
        stopAndSendRecording();
      }
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('touchmove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
    };
  }, []);

  const toggleReaction = (msgId: string, emoji: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    if (msg.myReaction === emoji) {
        setConfirmReactionRemove({ msgId, emoji });
    } else {
        playAudio('react');
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            const newReactions = { ...m.reactions };
            
            if (m.myReaction) {
                if (newReactions[m.myReaction] > 0) newReactions[m.myReaction]--;
                if (newReactions[m.myReaction] <= 0) delete newReactions[m.myReaction];
            }
            
            newReactions[emoji] = (newReactions[emoji] || 0) + 1;
            return { ...m, reactions: newReactions, myReaction: emoji };
        }));
    }
    setActiveReactionId(null);
    setShowMediaReactions(false);
  };

  const removeReaction = (msgId: string, emoji: string) => {
      setMessages(prev => prev.map(m => {
          if (m.id !== msgId) return m;
          const newReactions = { ...m.reactions };
          if (newReactions[emoji] > 0) newReactions[emoji]--;
          if (newReactions[emoji] <= 0) delete newReactions[emoji];
          return { ...m, reactions: newReactions, myReaction: undefined };
      }));
      setConfirmReactionRemove(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        alert('يرجى اختيار ملف صورة أو فيديو صالح.');
        return;
      }
      
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`حجم الملف يجب أن لا يتجاوز ${isVideo ? '50' : '5'} ميجابايت.`);
        return;
      }

      const url = URL.createObjectURL(file);
      setPendingMedia({ 
        file,
        url,
        type: isImage ? 'image' : 'video'
      });
    }
    e.target.value = '';
  };

  const removePendingMedia = () => {
      if (pendingMedia) {
          URL.revokeObjectURL(pendingMedia.url);
          setPendingMedia(null);
      }
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (settings.isBlocked) return;
    setCallType(type);
    setCallStatus('calling');
    setCallDuration(0);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }

    callTimeoutRef.current = setTimeout(() => {
      setCallStatus('connected');
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }, 2000);
  };

  const endCall = () => {
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
       setRemoteStream(null);
    }
    
    const durationText = formatDuration(callDuration);
    const systemMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      text: `مكالمة ${callType === 'video' ? 'فيديو' : 'صوتية'} انتهت - ${durationText}`,
      sender: 'me',
      type: 'system',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rawTimestamp: Date.now(),
      status: 'seen',
      reactions: {}
    };
    
    setMessages(prev => [...prev, systemMsg]);
    setCallStatus('idle');
    setCallType(null);
    setCallDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const clearChat = () => {
      setMessages([]);
      localStorage.removeItem(getStorageKey());
      setShowMoreMenu(false);
      setActiveModal(null);
  };

  const simulateReply = (triggerType: string = 'text', content: string = '') => {
    if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
    if (settings.isBlocked) return;
    
    const isAudio = triggerType === 'audio';
    setPartnerActivity(isAudio ? 'recording' : 'typing');
    setIsTyping(true);

    replyTimeoutRef.current = setTimeout(() => {
      setPartnerActivity('idle');
      setIsTyping(false);
      let replyText = 'أنا بخير شكراً لسؤالك! 👍';
      let replyType: ChatMessage['type'] = 'text';
      let mediaUrl: string | undefined = undefined;

      if (triggerType === 'like') {
         replyText = settings.quickEmoji;
         replyType = 'emoji';
      } else if (triggerType === 'sticker') {
         replyText = '';
         replyType = 'sticker';
         mediaUrl = 'https://cdn-icons-png.flaticon.com/512/766/766023.png';
      } else {
          const randomReplies = ['صحيح!', 'اتفق معك تماماً', 'مثير للاهتمام 🤔', 'هلا وضحت أكثر؟'];
          replyText = randomReplies[Math.floor(Math.random() * randomReplies.length)];
      } 
      if (triggerType === 'audio') {
        replyText = '';
        replyType = 'audio';
        mediaUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      }

      const replyMsg: ChatMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : `rep_${Date.now()}`,
        text: replyText,
        sender: 'them',
        type: replyType,
        mediaUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawTimestamp: Date.now(),
        status: 'seen',
        reactions: {}
      };

      setMessages(prev => [...prev, replyMsg]);
      playAudio('message_received');

      // Trigger Web Push Notification for incoming message
      sendWebPushNotification(`رسالة جديدة من ${user.name}`, {
        body: replyText || (replyType === 'sticker' ? 'أرسل ملصقاً' : replyType === 'audio' ? 'أرسل تسجيلاً صوتياً' : 'أرسل وسائط'),
        icon: user.avatar,
        tag: `chat-${user.id}`
      });

      // Increment Unread Counter if Minimized
      if (isMinimizedRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    }, 4000);
  };

  const handleUnsend = () => {
      if (!selectedMessageId) return;
      
      if (unsendOption === 'me') {
          setMessages(prev => prev.filter(m => m.id !== selectedMessageId));
      } else {
          setMessages(prev => prev.filter(m => m.id !== selectedMessageId));
          socket.emit('unsend_message', { id: selectedMessageId });
      }
      setActiveModal(null);
      setSelectedMessageId(null);
  };

  const handleDeleteMessage = () => {
      if (!selectedMessageId) return;
      setMessages(prev => prev.filter(m => m.id !== selectedMessageId));
      setActiveModal(null);
      setSelectedMessageId(null);
  };

  const handleForwardToFriend = (friendId: string) => {
      setForwardStatus(prev => ({ ...prev, [friendId]: 'sent' }));
  };

  // Viewer Drag Handlers
  const handleViewerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleViewerMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleViewerMouseUp = () => {
    setIsDragging(false);
  };

  // --- Render Helpers ---

  // Reusable Emoji Picker Render Function
  const renderEmojiPickerContent = (onSelect: (val: any) => void, showStickers = true) => {
      return (
         <div className="flex flex-col h-full bg-white dark:bg-gray-800">
             {/* Picker Header */}
             <div className="flex items-center p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 gap-2 flex-shrink-0">
                {showStickers && (
                    <div className="flex bg-gray-200 dark:bg-gray-700 rounded-full p-1 flex-1">
                        <button 
                            onClick={() => setPickerMode('emoji')} 
                            className={`flex-1 text-xs font-bold py-1.5 rounded-full transition ${pickerMode === 'emoji' ? 'bg-white dark:bg-gray-600 shadow-sm text-fb-blue' : 'text-gray-500'}`}
                        >
                            {t.emoji_picker_tab_emoji || (language === 'ar' ? 'رموز' : 'Emojis')}
                        </button>
                        <button 
                            onClick={() => setPickerMode('sticker')} 
                            className={`flex-1 text-xs font-bold py-1.5 rounded-full transition ${pickerMode === 'sticker' ? 'bg-white dark:bg-gray-600 shadow-sm text-fb-blue' : 'text-gray-500'}`}
                        >
                            {t.emoji_picker_tab_stickers || (language === 'ar' ? 'ملصقات' : 'Stickers')}
                        </button>
                    </div>
                )}
                {(!showStickers || pickerMode === 'emoji') && (
                    <div className={`relative ${showStickers ? 'w-1/3' : 'w-full'}`}>
                        <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full pl-6 pr-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full outline-none dark:text-white" 
                            placeholder={t.common_search || (language === 'ar' ? 'بحث' : 'Search')}
                            value={emojiSearch}
                            onChange={(e) => setEmojiSearch(e.target.value)}
                        />
                    </div>
                )}
             </div>
             
             {/* Content Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                {(!showStickers || pickerMode === 'emoji') ? (
                    <div className="p-2">
                            {(emojiSearch ? ['search_results'] : (activeEmojiTab === 'recent' ? ['recent'] : [activeEmojiTab])).map(categoryKey => {
                                const emojis = emojiSearch 
                                ? Object.values(EMOJI_CATEGORIES).flatMap(c => c.emojis).filter(e => true).slice(0, 50)
                                : categoryKey === 'recent' 
                                    ? recentEmojis 
                                    : EMOJI_CATEGORIES[categoryKey as keyof typeof EMOJI_CATEGORIES].emojis;
                                
                                if (emojis.length === 0 && categoryKey === 'recent') {
                                    return (
                                    <div key="empty-recent" className="flex flex-col items-center justify-center h-40 text-gray-400">
                                        <Clock className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-xs">{language === 'ar' ? 'لا يوجد رموز حديثة' : 'No recent emojis'}</span>
                                    </div>
                                    );
                                }

                                return (
                                    <div key={categoryKey} className="animate-fadeIn">
                                        <div className="grid grid-cols-8 gap-1">
                                            {emojis.map((emoji, idx) => {
                                                // Special Handling for Flags to Render Real Images
                                                if (categoryKey === 'flags' || activeEmojiTab === 'flags' || (emojiSearch && getFlagIsoCode(emoji))) {
                                                    const isoCode = getFlagIsoCode(emoji);
                                                    if (isoCode && isoCode.length === 2) {
                                                        return (
                                                            <button 
                                                                key={`${categoryKey}-${idx}`} 
                                                                onClick={() => onSelect(emoji)} 
                                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition hover:scale-125"
                                                                title={isoCode.toUpperCase()}
                                                            >
                                                                <img 
                                                                    src={`https://flagcdn.com/w40/${isoCode}.png`}
                                                                    srcSet={`https://flagcdn.com/w80/${isoCode}.png 2x`} 
                                                                    alt={emoji} 
                                                                    className="w-full h-auto object-contain rounded-sm shadow-sm"
                                                                    loading="lazy"
                                                                />
                                                            </button>
                                                        );
                                                    }
                                                }
                                                return (
                                                    <button 
                                                        key={`${categoryKey}-${idx}`} 
                                                        onClick={() => onSelect(emoji)} 
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-2xl transition hover:scale-125 hover:animate-pulse"
                                                    >
                                                        {emoji}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <div className="p-2">
                            <div className="grid grid-cols-3 gap-2 animate-fadeIn">
                                {STICKER_CATEGORIES[activeStickerTab].stickers.map(sticker => (
                                    <button 
                                    key={sticker.id} 
                                    onClick={() => handleStickerSelect(sticker)}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition hover:scale-105"
                                    >
                                        <img src={sticker.url} alt={sticker.alt} className="w-full h-auto drop-shadow-sm" />
                                    </button>
                                ))}
                            </div>
                    </div>
                )}
             </div>

             {/* Footer - Category Tabs */}
             <div className="flex items-center justify-between px-2 py-1.5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto no-scrollbar flex-shrink-0">
                {(!showStickers || pickerMode === 'emoji') ? (
                    <>
                        <button 
                            type="button"
                            onClick={() => { setActiveEmojiTab('recent'); setEmojiSearch(''); }}
                            className={`p-2 rounded-lg transition ${activeEmojiTab === 'recent' ? 'text-fb-blue bg-blue-100 dark:bg-blue-900/30' : 'text-gray-400 hover:text-gray-600'}`}
                            title={language === 'ar' ? 'الأخيرة' : 'Recent'}
                        >
                            <Clock className="w-5 h-5" />
                        </button>
                        {Object.entries(EMOJI_CATEGORIES).map(([key, data]) => {
                            const Icon = data.icon;
                            const labelKey = `emoji_category_${data.label}`;
                            const translatedLabel = t[labelKey] || (language === 'ar' ? data.label : key); // Fallback logic
                            return (
                                <button 
                                    key={key} 
                                    type="button"
                                    onClick={() => { setActiveEmojiTab(key as any); setEmojiSearch(''); }}
                                    className={`p-2 rounded-lg transition ${activeEmojiTab === key ? 'text-fb-blue bg-blue-100 dark:bg-blue-900/30' : 'text-gray-400 hover:text-gray-600'}`}
                                    title={translatedLabel}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            );
                        })}
                    </>
                ) : (
                    <>
                        {Object.entries(STICKER_CATEGORIES).map(([key, data]) => {
                            const Icon = data.icon;
                            const labelKey = `sticker_category_${data.label}`;
                            const translatedLabel = t[labelKey] || (language === 'ar' ? data.label : key);
                            return (
                                <button 
                                    key={key}
                                    onClick={() => setActiveStickerTab(key as any)}
                                    className={`p-2 rounded-lg transition ${activeStickerTab === key ? 'text-fb-blue bg-blue-100 dark:bg-blue-900/30' : 'text-gray-400 hover:text-gray-600'}`}
                                    title={translatedLabel}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            );
                        })}
                    </>
                )}
             </div>
         </div>
      );
  };

  // Updated StatusIcon to use per-message ReadReceipt setting (blue double checkmarks for seen)
  const StatusIcon = ({ msg }: { msg: ChatMessage }) => {
    const { status, readReceiptEnabled } = msg;

    if (status === 'seen') {
       if (readReceiptEnabled !== false) {
          return <CheckCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" title={language === 'ar' ? 'تمت القراءة ✔✔' : 'Read'} />;
       }
       return <CheckCheck className="w-3.5 h-3.5 text-gray-300 dark:text-gray-400" title={language === 'ar' ? 'تم التسليم' : 'Delivered'} />;
    }

    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-gray-300 dark:text-gray-400" title={language === 'ar' ? 'تم التسليم' : 'Delivered'} />;
    if (status === 'sending') return <Clock className="w-3 h-3 text-gray-300 animate-spin" title={language === 'ar' ? 'جاري الإرسال' : 'Sending'} />;
    return <Check className="w-3.5 h-3.5 text-gray-300 dark:text-gray-400" title={language === 'ar' ? 'تم الإرسال' : 'Sent'} />;
  };

  const renderModal = () => {
      if (!activeModal && !confirmReactionRemove) return null;

      if (confirmReactionRemove) {
          return createPortal(
              <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4" onClick={() => setConfirmReactionRemove(null)}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl max-w-sm w-full animate-scaleIn flex flex-col items-center" onClick={e => e.stopPropagation()}>
                      <div className="text-4xl mb-4 animate-bounce">{confirmReactionRemove.emoji}</div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{t.chat_remove_reaction_confirm || (language === 'ar' ? 'إزالة التفاعل؟' : 'Remove reaction?')}</h3>
                      <div className="flex justify-center gap-3 w-full mt-4">
                          <button 
                             onClick={() => setConfirmReactionRemove(null)} 
                             className="px-4 py-2 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition flex-1"
                          >
                             {t.common_cancel}
                          </button>
                          <button 
                             onClick={() => removeReaction(confirmReactionRemove.msgId, confirmReactionRemove.emoji)} 
                             className="px-4 py-2 bg-green-700 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex-1"
                          >
                             {t.common_remove}
                          </button>
                      </div>
                  </div>
              </div>,
              document.body
          );
      }

      return createPortal(
          <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={() => setActiveModal(null)}>
              <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${activeModal === 'theme' ? 'max-w-6xl h-[680px]' : activeModal === 'emoji' ? 'max-w-5xl h-[600px]' : 'max-w-sm'} overflow-hidden animate-scaleIn border border-gray-200 dark:border-gray-700 flex flex-col`} onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          {activeModal === 'report' && <Flag className="w-5 h-5 text-red-500" />}
                          {activeModal === 'readReceipts' && <Eye className="w-5 h-5 text-blue-500" />}
                          {activeModal === 'theme' && <Palette className="w-5 h-5 text-purple-500" />}
                          {activeModal === 'emoji' && <Smile className="w-5 h-5 text-yellow-500" />}
                          {activeModal === 'nickname' && <Type className="w-5 h-5 text-green-500" />}
                          {activeModal === 'deleteConfirm' && <Trash2 className="w-5 h-5 text-red-600" />}
                          {activeModal === 'deleteMessageConfirm' && <Trash2 className="w-5 h-5 text-red-600" />}
                          {activeModal === 'unsend' && <Trash2 className="w-5 h-5 text-red-600" />}
                          {activeModal === 'forward' && <CornerUpRight className="w-5 h-5 text-blue-600" />}
                          {activeModal === 'blockConfirm' && <ShieldBan className="w-5 h-5 text-red-600" />}
                          {activeModal === 'profile' && <UserCircle className="w-5 h-5 text-emerald-600" />}
                          
                          {activeModal === 'report' ? t.common_report : 
                           activeModal === 'readReceipts' ? (language === 'ar' ? 'مؤشرات قراءة الرسائل' : 'Read Receipts') : 
                           activeModal === 'theme' ? (language === 'ar' ? 'تخصيص مظهر الدردشة' : 'Customize Chat Theme') : 
                           activeModal === 'emoji' ? (language === 'ar' ? 'الرمز التعبيري السريع' : 'Quick Emoji') : 
                           activeModal === 'deleteConfirm' ? (language === 'ar' ? 'حذف المحادثة؟' : 'Delete Conversation?') :
                           activeModal === 'deleteMessageConfirm' ? (language === 'ar' ? 'حذف الرسالة' : 'Delete Message') :
                           activeModal === 'unsend' ? (language === 'ar' ? '(إلي من تريد إلغاء إرسال هذه الرسالة؟)' : 'Unsend Message?') :
                           activeModal === 'forward' ? (language === 'ar' ? 'إعادة توجيه الرسالة' : 'Forward Message') :
                           activeModal === 'blockConfirm' ? (language === 'ar' ? 'تأكيد الحظر' : 'Confirm Block') :
                           activeModal === 'profile' ? (language === 'ar' ? 'الملف الشخصي' : 'Friend Profile') :
                           (language === 'ar' ? 'تعديل الكنية' : 'Edit Nickname')}
                      </h3>
                      <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-1 transition">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className={`p-6 overflow-y-auto ${activeModal === 'theme' ? 'flex-1 p-0 flex' : ''} ${activeModal === 'emoji' ? 'flex-1 p-0' : ''}`}>
                      {activeModal === 'report' && (
                        <div className="space-y-2">
                            {[
                              { ar: 'محتوى غير لائق', en: 'Inappropriate content' },
                              { ar: 'بريد عشوائي (Spam)', en: 'Spam' },
                              { ar: 'مضايقة', en: 'Harassment' },
                              { ar: 'إساءة', en: 'Abuse' },
                              { ar: 'خداع أو احتيال', en: 'Fraud or Scam' },
                              { ar: 'انتحال شخصية شخص آخر', en: 'Impersonation' },
                              { ar: 'غير ذلك', en: 'Other' }
                            ].map((r) => (
                                <label key={r.ar} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                                    <input 
                                        type="radio" 
                                        name="reportReason" 
                                        value={language === 'ar' ? r.ar : r.en} 
                                        checked={reportReason === (language === 'ar' ? r.ar : r.en)} 
                                        onChange={(e) => setReportReason(e.target.value)} 
                                        className="w-4 h-4 text-fb-blue"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{language === 'ar' ? r.ar : r.en}</span>
                                </label>
                            ))}
                        </div>
                      )}

                      {activeModal === 'readReceipts' && (
                          <div className="space-y-6">
                              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                  <div className="flex flex-col gap-1">
                                      <span className="text-base font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'عرض مؤشرات قراءة الرسائل' : 'Show Read Receipts'}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[240px]">
                                          {language === 'ar' ? `سيتمكن ${user.name} من معرفة أنك قرأت رسالته عندما يتم تفعيل هذا الخيار.` : `${user.name} will know when you've read their messages if enabled.`}
                                      </span>
                                  </div>
                                  <button 
                                      onClick={() => setSettings(prev => ({...prev, readReceipts: !prev.readReceipts}))}
                                      className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ease-in-out shadow-inner relative ${settings.readReceipts ? 'bg-emerald-900' : 'bg-gray-300 dark:bg-gray-600'}`}
                                  >
                                      <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 absolute top-1 ${settings.readReceipts ? (dir === 'rtl' ? 'left-1' : 'right-1') : (dir === 'rtl' ? 'right-1' : 'left-1')}`}></div>
                                  </button>
                              </div>
                          </div>
                      )}

                      {activeModal === 'theme' && (
                          <div className="flex w-full h-full">
                              {/* Left Preview Side */}
                              <div className="w-1/2 bg-white dark:bg-gray-900 flex flex-col items-center justify-center border-l dark:border-gray-700 relative overflow-hidden p-4">
                                  <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 pattern-grid opacity-10"></div>
                                  <h4 className="relative z-10 mb-3 font-bold text-gray-500 uppercase tracking-widest text-[11px]">{language === 'ar' ? 'معاينة المظهر' : 'Theme Preview'}</h4>
                                  <div 
                                      style={getThemeBgStyle(previewTheme)}
                                      className={`w-64 h-96 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col relative bg-cover bg-center ${previewTheme.background}`}
                                  >
                                      {previewTheme.bgImage && <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />}
                                      <div className="h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b dark:border-gray-700 flex items-center px-3 gap-2 relative z-10">
                                          <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                                          <div className="flex flex-col">
                                              <div className="w-20 h-2 bg-gray-300 rounded mb-1"></div>
                                              <div className="w-12 h-1.5 bg-gray-200 rounded"></div>
                                          </div>
                                      </div>
                                      <div className="flex-1 p-3 flex flex-col justify-end space-y-3 relative z-10">
                                          <div className="self-start bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl rounded-bl-none px-3 py-2 max-w-[80%] shadow-md text-xs text-gray-800 dark:text-gray-200">
                                              {language === 'ar' ? 'مرحباً، كيف حالك؟' : 'Hello, how are you?'}
                                          </div>
                                          <div className={`self-end ${previewTheme.bubble} text-white rounded-2xl rounded-br-none px-3 py-2 max-w-[80%] shadow-md text-xs`}>
                                              {language === 'ar' ? 'أنا بخير، شكراً لسؤالك! هذا المظهر رائع جداً.' : 'I am fine, thanks! This theme is awesome.'}
                                          </div>
                                      </div>
                                      <div className="h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t dark:border-gray-700 flex items-center px-2 gap-2 relative z-10">
                                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                                          <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
                                          <div className={`w-6 h-6 rounded-full ${previewTheme.bubble}`}></div>
                                      </div>
                                  </div>
                                  <p className="mt-3 font-bold text-base text-gray-800 dark:text-white flex items-center gap-2">
                                      <span>{previewTheme.name}</span>
                                      {previewTheme.bgImage && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">{language === 'ar' ? 'خلفية صورة' : 'Photo Background'}</span>}
                                  </p>
                              </div>

                              {/* Right Theme Selector Grid */}
                              <div className="w-1/2 bg-gray-50 dark:bg-gray-800 p-5 flex flex-col h-full overflow-hidden">
                                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex-shrink-0">
                                      {language === 'ar' ? 'اختر مظهراً خلفياً للدردشة' : 'Choose a Chat Background Theme'}
                                  </h4>

                                  {/* Category Tabs */}
                                  <div className="relative flex items-center mb-3 flex-shrink-0 group/tabs">
                                      <button 
                                          onClick={() => categoryTabsRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
                                          className="absolute -left-2 z-20 w-7 h-7 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full shadow-md border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                          title={language === 'ar' ? 'السابق' : 'Previous'}
                                      >
                                          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                                      </button>
                                      <div ref={categoryTabsRef} className="flex items-center gap-1.5 overflow-x-auto px-6 py-1 no-scrollbar scroll-smooth w-full">
                                          {[
                                              { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                                              { id: 'messenger', label: language === 'ar' ? 'ماسنجر 💬' : 'Messenger 💬' },
                                              { id: 'anime', label: language === 'ar' ? 'أنمي ⛩️' : 'Anime ⛩️' },
                                              { id: 'abstract', label: language === 'ar' ? 'تجريدي ونئون 🎨' : 'Abstract 🎨' },
                                              { id: 'sports', label: language === 'ar' ? 'رياضة ⚽' : 'Sports ⚽' },
                                              { id: 'pets', label: language === 'ar' ? 'حيوانات أليفة 🐾' : 'Pets 🐾' },
                                              { id: 'love', label: language === 'ar' ? 'حب وقلوب ❤️' : 'Love ❤️' },
                                              { id: 'geometric', label: language === 'ar' ? 'أشكال هندسية 📐' : 'Geometric 📐' },
                                              { id: 'nature', label: language === 'ar' ? 'طبيعة وأزهار 🌿' : 'Nature 🌿' },
                                              { id: 'space', label: language === 'ar' ? 'فضاء ومجرات 🚀' : 'Space 🚀' },
                                              { id: 'celebration', label: language === 'ar' ? 'مناسبات 🎆' : 'Celebrations 🎆' },
                                              { id: 'cozy', label: language === 'ar' ? 'قهوة واسترخاء ☕' : 'Cozy ☕' },
                                              { id: 'travel', label: language === 'ar' ? 'سفر ومعالم ✈️' : 'Travel ✈️' },
                                              { id: 'gradients', label: language === 'ar' ? 'تدرجات 🌈' : 'Gradients 🌈' },
                                              { id: 'classic', label: language === 'ar' ? 'كلاسيكي 🎨' : 'Classic 🎨' },
                                          ].map(cat => (
                                              <button
                                                  key={cat.id}
                                                  onClick={() => setSelectedThemeCategory(cat.id)}
                                                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedThemeCategory === cat.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}`}
                                              >
                                                  {cat.label}
                                              </button>
                                          ))}
                                      </div>
                                      <button 
                                          onClick={() => categoryTabsRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
                                          className="absolute -right-2 z-20 w-7 h-7 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full shadow-md border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                          title={language === 'ar' ? 'التالي' : 'Next'}
                                      >
                                          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                                      </button>
                                  </div>

                                  {/* Grid of Themes */}
                                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                      <div className="grid grid-cols-3 gap-3">
                                          {(selectedThemeCategory === 'all' ? THEMES : THEMES.filter(t => t.category === selectedThemeCategory)).map(theme => (
                                              <button 
                                                key={theme.id} 
                                                onClick={() => setPreviewTheme(theme)}
                                                style={getThemeBgStyle(theme)}
                                                className={`aspect-square rounded-xl ${theme.background} bg-cover bg-center shadow-md hover:scale-105 transition-all duration-200 flex flex-col items-center justify-end p-1.5 relative overflow-hidden group border-2 ${previewTheme.id === theme.id ? 'border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900/60' : 'border-gray-200 dark:border-gray-600'}`}
                                              >
                                                  {theme.bgImage && <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors z-0" />}
                                                  <div className={`w-6 h-6 rounded-full ${theme.bubble} mb-1 shadow-md relative z-10 border border-white/30`}></div>
                                                  <span className="bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm relative z-10 text-center truncate max-w-full">
                                                      {theme.name}
                                                  </span>
                                                  {settings.theme?.id === theme.id && (
                                                      <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-md z-20">
                                                          <Check className="w-3 h-3" />
                                                      </div>
                                                  )}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {activeModal === 'deleteConfirm' && (
                          <div className="text-center">
                              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                  <Trash2 className="w-8 h-8 text-red-600" />
                              </div>
                              <h4 className="font-bold text-gray-900 dark:text-white mb-2">{t.chat_delete_confirm_title || (language === 'ar' ? 'هل تريد حذف المحادثة؟' : 'Delete conversation?') }</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{t.chat_delete_confirm_desc || (language === 'ar' ? 'سيؤدي هذا إلى حذف نسختك من المحادثة نهائياً. لا يمكن التراجع عن هذا الإجراء.' : 'This will delete your copy of the conversation. This cannot be undone.')}</p>
                          </div>
                      )}

                      {/* New Delete Message Confirmation for 'them' messages */}
                      {activeModal === 'deleteMessageConfirm' && (
                          <div className="text-center">
                              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                  <Trash2 className="w-8 h-8 text-red-600" />
                              </div>
                              <h4 className="font-bold text-gray-900 dark:text-white mb-2">{language === 'ar' ? 'حذف الرسالة' : 'Delete Message'}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{language === 'ar' ? '(هل تريد حذف الرسالة؟)' : '(Do you want to delete the message?)'}</p>
                          </div>
                      )}

                      {activeModal === 'unsend' && (
                          <div className="space-y-4">
                              {/* Option 1: Unsend for Everyone */}
                              <button 
                                onClick={() => setUnsendOption('everyone')}
                                className="w-full text-start flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                              >
                                  <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${unsendOption === 'everyone' ? 'bg-emerald-800 border-emerald-800' : 'border-black dark:border-gray-500 bg-transparent'}`}>
                                      {unsendOption === 'everyone' && <Check className="w-4 h-4 text-white" />}
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'إلغاء إلارسال لدي الجميع' : 'Unsend for everyone'}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                          {language === 'ar' ? 'سيتم إلغاء إرسال هذه الرسالة لجميع المشاركين في المحادثة. قد يكون الآخرون قد شاهدوها أو أعادوا توجيهها.' : 'Message will be unsent for everyone. Others might have seen or forwarded it.'}
                                      </span>
                                  </div>
                              </button>

                              {/* Option 2: Unsend for You */}
                              <button 
                                onClick={() => setUnsendOption('me')}
                                className="w-full text-start flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                              >
                                  <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${unsendOption === 'me' ? 'bg-emerald-800 border-emerald-800' : 'border-black dark:border-gray-500 bg-transparent'}`}>
                                      {unsendOption === 'me' && <Check className="w-4 h-4 text-white" />}
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'إلغاء الإرسال لديك' : 'Unsend for you'}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                          {language === 'ar' ? 'ستتم إزالة هذه الرسالة من جهازك. وسيظل بإمكان الأشخاص الآخرين في الدردشة رؤيتها.' : 'This message will be removed from your device. Others in chat can still see it.'}
                                      </span>
                                  </div>
                              </button>
                          </div>
                      )}

                      {activeModal === 'forward' && (
                          <div className="space-y-2">
                              {FRIENDS_LIST.map(friend => (
                                  <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition">
                                      <div className="flex items-center gap-3">
                                          <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600" />
                                          <span className="font-semibold text-gray-900 dark:text-white">{friend.name}</span>
                                      </div>
                                      <button 
                                          onClick={() => handleForwardToFriend(friend.id)}
                                          disabled={forwardStatus[friend.id] === 'sent'}
                                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${forwardStatus[friend.id] === 'sent' 
                                            ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 cursor-default' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                      >
                                          {forwardStatus[friend.id] === 'sent' ? (language === 'ar' ? 'تم الإرسال' : 'Sent') : (language === 'ar' ? 'إرسال' : 'Send')}
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}

                      {activeModal === 'emoji' && (
                          <div className="h-full flex flex-col w-[400px] mx-auto">
                             {renderEmojiPickerContent((emoji) => {
                                setSettings(prev => ({...prev, quickEmoji: emoji}));
                                setActiveModal(null);
                             }, false)} 
                          </div>
                      )}

                      {activeModal === 'nickname' && (
                          <div>
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block uppercase">{language === 'ar' ? `كنية لـ ${user.name}` : `Nickname for ${user.name}`}</label>
                              <input 
                                type="text" 
                                value={modalInput}
                                onChange={(e) => setModalInput(e.target.value)}
                                placeholder={user.name}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                              />
                          </div>
                      )}

                      {activeModal === 'blockConfirm' && (
                          <div className="text-center p-2">
                              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                  <ShieldBan className="w-8 h-8 text-red-600" />
                              </div>
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                  {language === 'ar' ? 'تأكيد الحظر' : 'Confirm Block'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                  {language === 'ar' 
                                    ? `هل أنت تأكد من حظر ${settings.nickname || user.name}؟ لن تمكن من استقبال الرسائل أو المكالمات منه.` 
                                    : `Are you sure you want to block ${settings.nickname || user.name}? You will no longer receive messages or calls from them.`}
                              </p>
                          </div>
                      )}

                      {activeModal === 'profile' && (
                          <div className="flex flex-col items-center text-center p-1">
                              {/* Cover / Avatar Header */}
                              <div className="relative mb-3 flex flex-col items-center">
                                  <div className="relative">
                                      <img 
                                          src={user.avatar} 
                                          alt={user.name} 
                                          className="w-20 h-20 rounded-full border-4 border-emerald-500/30 shadow-xl object-cover" 
                                      />
                                      {user.online && (
                                          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-md" title={language === 'ar' ? 'متصل الآن' : 'Online'} />
                                      )}
                                  </div>
                                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white mt-2">
                                      {settings.nickname || user.name}
                                  </h3>
                                  {settings.nickname && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                          ({user.name})
                                      </span>
                                  )}
                                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                                      {user.online ? (language === 'ar' ? '● متصل الآن' : '● Online') : (language === 'ar' ? 'غير متصل' : 'Offline')}
                                  </span>
                              </div>

                              {/* Info Cards */}
                              <div className="w-full space-y-2 text-start text-xs my-2 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center justify-between py-1 border-b dark:border-gray-600">
                                      <span className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'معرّف المستخدم' : 'User ID'}:</span>
                                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200">@{user.id || 'user_102'}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-1 border-b dark:border-gray-600">
                                      <span className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'الحالة الشخصية' : 'Status Bio'}:</span>
                                      <span className="font-semibold text-gray-800 dark:text-gray-200">{language === 'ar' ? 'متوفر لـ الدردشة ✨' : 'Available to chat ✨'}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-1">
                                      <span className="text-gray-500 dark:text-gray-400 font-medium">{language === 'ar' ? 'الوسائط المشتركة' : 'Shared Media'}:</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{messages.filter(m => m.type === 'image' || m.type === 'video' || m.type === 'audio').length} {language === 'ar' ? 'عنصر' : 'items'}</span>
                                  </div>
                              </div>

                              {/* View Profile Button & Quick Actions inside Profile Modal */}
                              <button
                                  onClick={() => {
                                      setActiveModal(null);
                                      if (onViewProfile) onViewProfile(user);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-blue-700 text-white rounded-xl transition text-xs font-bold shadow-md hover:shadow-lg transform active:scale-95 my-2"
                              >
                                  <UserCircle className="w-4 h-4" />
                                  <span>{language === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}</span>
                              </button>

                              <div className="grid grid-cols-3 gap-2 w-full mt-1">
                                  <button 
                                      onClick={() => { setActiveModal(null); startCall('audio'); }}
                                      className="group flex flex-col items-center gap-1 p-2.5 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-200 dark:hover:text-white rounded-xl transition-all duration-200 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-500/40 shadow-sm"
                                  >
                                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-300 group-hover:scale-110 group-hover:text-emerald-800 dark:group-hover:text-white transition-transform" />
                                      <span>{language === 'ar' ? 'مكالمة' : 'Call'}</span>
                                  </button>
                                  <button 
                                      onClick={() => { setActiveModal(null); startCall('video'); }}
                                      className="group flex flex-col items-center gap-1 p-2.5 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-200 dark:hover:text-white rounded-xl transition-all duration-200 text-[11px] font-bold border border-blue-200/60 dark:border-blue-500/40 shadow-sm"
                                  >
                                      <Video className="w-4 h-4 text-blue-600 dark:text-blue-300 group-hover:scale-110 group-hover:text-blue-800 dark:group-hover:text-white transition-transform" />
                                      <span>{language === 'ar' ? 'فيديو' : 'Video'}</span>
                                  </button>
                                  <button 
                                      onClick={() => {
                                          setSettings(p => ({ ...p, isMuted: !p.isMuted }));
                                      }}
                                      className="group flex flex-col items-center gap-1 p-2.5 bg-gray-100 dark:bg-gray-800/90 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 dark:hover:text-white rounded-xl transition-all duration-200 text-[11px] font-bold border border-gray-200 dark:border-gray-600/80 shadow-sm"
                                  >
                                      {settings.isMuted ? (
                                          <BellOff className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:scale-110 dark:group-hover:text-red-200 transition-transform" />
                                      ) : (
                                          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-300 group-hover:scale-110 dark:group-hover:text-white transition-transform" />
                                      )}
                                      <span>{settings.isMuted ? (language === 'ar' ? 'إلغاء الكتم' : 'Unmute') : (language === 'ar' ? 'كتم' : 'Mute')}</span>
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>

                  {(activeModal !== 'emoji' && activeModal !== 'theme' && activeModal !== 'forward' && activeModal !== 'unsend' && activeModal !== 'profile') && (
                      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2 flex-shrink-0">
                          <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition text-sm">{t.common_cancel}</button>
                          <button 
                            onClick={() => {
                                if (activeModal === 'report') {
                                    alert(language === 'ar' ? 'تم إرسال البلاغ بنجاح' : 'Report submitted successfully.');
                                } else if (activeModal === 'nickname') {
                                    setSettings(prev => ({...prev, nickname: modalInput}));
                                } else if (activeModal === 'deleteConfirm') {
                                    clearChat();
                                } else if (activeModal === 'deleteMessageConfirm') {
                                    handleDeleteMessage();
                                } else if (activeModal === 'blockConfirm') {
                                    setSettings(prev => ({...prev, isBlocked: true}));
                                }
                                setActiveModal(null);
                            }} 
                            className={`px-8 py-2.5 font-bold rounded-xl transition shadow-lg text-sm text-white transform active:scale-95 ${activeModal === 'blockConfirm' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-700 hover:bg-blue-700'}`}
                          >
                              {activeModal === 'blockConfirm' ? (language === 'ar' ? 'حظر' : 'Block') : activeModal === 'deleteConfirm' || activeModal === 'deleteMessageConfirm' ? t.common_delete : (activeModal === 'report' ? t.common_send : t.common_save)}
                          </button>
                      </div>
                  )}

                  {activeModal === 'profile' && (
                      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center flex-shrink-0">
                          <button 
                            onClick={() => {
                              setActiveModal('blockConfirm');
                            }} 
                            className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 hover:underline"
                          >
                              <ShieldBan className="w-4 h-4" /> {language === 'ar' ? 'حظر المستخدم' : 'Block User'}
                          </button>
                          <button onClick={() => setActiveModal(null)} className="px-6 py-2 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition text-sm">{t.common_close}</button>
                      </div>
                  )}

                  {/* Unsend Modal Actions */}
                  {activeModal === 'unsend' && (
                       <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2 flex-shrink-0">
                           <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition text-sm">{t.common_cancel}</button>
                           <button 
                               onClick={handleUnsend} 
                               className="px-8 py-2.5 bg-emerald-700 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg text-sm transform active:scale-95"
                            >
                               {language === 'ar' ? 'إلغاء الإرسال' : 'Unsend'}
                           </button>
                       </div>
                  )}

                  {activeModal === 'forward' && (
                       <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2 flex-shrink-0">
                           <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition text-sm">{t.common_close}</button>
                       </div>
                  )}

                  {activeModal === 'theme' && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2 flex-shrink-0">
                          <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition text-sm">{t.common_cancel}</button>
                          <button 
                            onClick={() => {
                                setSettings(prev => ({...prev, theme: previewTheme}));
                                setActiveModal(null);
                            }}
                            className="px-8 py-2.5 font-bold rounded-xl transition shadow-lg text-sm text-white bg-emerald-700 hover:bg-blue-700"
                          >
                              {t.common_save}
                          </button>
                    </div>
                  )}
              </div>
          </div>,
          document.body
      );
  };

  if (isMinimized) {
    return (
      <div 
        className={`fixed bottom-0 w-60 bg-emerald-700 hover:bg-blue-700 text-white shadow-lg rounded-t-lg cursor-pointer z-50 flex items-center justify-between p-3 border border-gray-300 dark:border-gray-700 transition-colors duration-300`}
        onClick={() => setIsMinimized(false)}
        style={positionStyle}
      >
        <div className="flex items-center gap-2">
           <div className="relative">
             <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-gray-200" />
             {user.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>}
           </div>
           <span className="font-semibold text-sm truncate text-white max-w-[100px]">{settings.nickname || user.name}</span>
        </div>
        <div className="flex items-center gap-2">
            {unreadCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="text-white p-1 rounded-full hover:bg-white/20 transition"
            >
               <X className="w-4 h-4" />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div 
        ref={chatContainerRef} 
        className="fixed bottom-0 bg-white dark:bg-gray-800 shadow-2xl rounded-t-lg border border-gray-200 dark:border-gray-700 z-[200] flex flex-col animate-slideUp transition-all duration-300"
        style={{ 
            ...positionStyle, 
            width: `${CHAT_WIDTH}px`, 
            height: '455px'
        }}
   > 
      {/* Modals */}
      {renderModal()}

      {/* Header */}
      <div 
        className={`flex items-center justify-between p-2.5 border-b dark:border-gray-700 shadow-sm bg-emerald-700 hover:bg-blue-700 transition-colors duration-300 rounded-t-lg cursor-pointer text-white`}
        onClick={() => setIsMinimized(true)}
      >
        <div 
          className="flex items-center gap-2 hover:bg-white/10 p-1 rounded-md transition cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setActiveModal('profile'); }}
          title={language === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}
        >
          <div className="relative">
             <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full border border-gray-200" />
             {user.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
          </div>
          <div className="flex flex-col">
             <span className="font-bold text-sm text-white hover:underline">{settings.nickname || user.name}</span>
             <span className="text-[10px] text-gray-200">
               {partnerActivity === 'recording' ? (
                 <span className="text-emerald-200 font-bold animate-pulse flex items-center gap-1">
                   <Mic className="w-3 h-3 animate-pulse inline-block" />
                   {language === 'ar' ? 'جاري تسجيل مقطع صوتي...' : 'recording voice note...'}
                 </span>
               ) : partnerActivity === 'typing' ? (
                 <span className="text-emerald-200 font-bold animate-pulse flex items-center gap-1">
                   {language === 'ar' ? 'جاري الكتابة...' : 'typing...'}
                 </span>
               ) : (
                 user.online ? t.common_online : t.nav_offline
               )}
             </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 text-white" onClick={(e) => e.stopPropagation()}>
           <button onClick={() => setShowSearch(!showSearch)} className={`p-1.5 hover:bg-white/20 rounded-full transition ${showSearch ? 'bg-white/30' : ''}`} title={language === 'ar' ? 'البحث في المحادثة' : 'Search Chat'}>
              <Search className="w-4 h-4" />
           </button>
           <button onClick={() => startCall('audio')} className="p-1.5 hover:bg-white/20 rounded-full transition" title="مكالمة صوتية"><Phone className="w-5 h-5" /></button>
           <button onClick={() => startCall('video')} className="p-1.5 hover:bg-white/20 rounded-full transition" title="مكالمة فيديو"><Video className="w-5 h-5" /></button>
           <button className="p-1.5 hover:bg-white/20 rounded-full transition" onClick={() => setIsMinimized(true)}><Minus className="w-5 h-5" /></button>
           <button className="p-1.5 hover:bg-white/20 rounded-full transition" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Search Bar inside Chat */}
      {showSearch && (
        <div className="p-2 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 flex items-center gap-2 animate-fadeIn z-10 flex-shrink-0">
          <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <input 
            type="text" 
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'البحث في المحادثة...' : 'Search in conversation...'}
            className="w-full bg-white dark:bg-gray-700 text-xs px-3 py-1.5 rounded-full border dark:border-gray-600 outline-none focus:border-emerald-500 dark:text-white shadow-inner"
          />
          {searchQuery && (
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex-shrink-0 whitespace-nowrap">
              {messages.filter(m => m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase())).length} {language === 'ar' ? 'نتيجة' : 'results'}
            </span>
          )}
          <button 
            onClick={() => { setShowSearch(false); setSearchQuery(''); }} 
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div ref={chatScrollRef} style={getThemeBgStyle(settings.theme)} className={`flex-1 overflow-y-auto p-3 no-scrollbar relative bg-cover bg-center ${settings.theme?.background || 'bg-white dark:bg-gray-900'}`}>
        {settings.theme?.bgImage && <div className="absolute inset-0 bg-black/15 z-0 pointer-events-none" />}
        {/* Call Overlay */}
        {callStatus !== 'idle' && (
            <div className="absolute inset-0 bg-gray-900 z-30 flex flex-col items-center justify-center text-white overflow-hidden animate-fadeIn">
                {callType === 'video' && (
                  <div className="absolute inset-0 z-0">
                      <video 
                        ref={remoteVideoRef} 
                        src={callStatus === 'connected' ? "https://www.w3schools.com/html/mov_bbb.mp4" : ""}
                        autoPlay 
                        loop 
                        muted={false} 
                        className="w-full h-full object-cover opacity-80"
                      />
                  </div>
                )}
                
                {callType === 'video' && localStream && (
                  <div className="absolute top-4 right-4 w-24 h-32 bg-black rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl z-10">
                     <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                  </div>
                )}

                <div className="relative z-20 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-fb-blue mb-4 relative shadow-lg">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        {callStatus === 'calling' && (
                            <div className="absolute inset-0 bg-fb-blue/20 animate-pulse"></div>
                        )}
                    </div>
                    <h3 className="text-xl font-bold mb-1 drop-shadow-md">{settings.nickname || user.name}</h3>
                    <p className="text-gray-200 text-sm mb-8 drop-shadow-md">
                        {callStatus === 'calling' ? (language === 'ar' ? 'جار الاتصال...' : 'Calling...') : formatDuration(callDuration)}
                    </p>
                    
                    <div className="flex gap-6">
                        <button 
                            onClick={endCall}
                            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition transform hover:scale-110 shadow-lg border-2 border-red-500/50"
                        >
                            <PhoneOff className="w-7 h-7 fill-current" />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Messages List */}
        <div className="flex flex-col items-center mt-4 mb-8 text-center">
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full mb-2 shadow-sm border-2 border-white" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{settings.nickname || user.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'أنتما صديقان على Tourloop' : 'You are friends on Tourloop'}</p>
        </div>

        <div className="space-y-4">
          {messages.map((msg) => {
            const repliedMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
            const isMatch = searchQuery.trim() !== '' && msg.text && msg.text.toLowerCase().includes(searchQuery.toLowerCase());
            const hasQuery = searchQuery.trim() !== '';
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} relative group mb-2 transition-opacity ${messageMenuOpen === msg.id ? 'z-30' : 'z-1'} ${hasQuery && !isMatch ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}
                onContextMenu={(e) => { e.preventDefault(); setActiveReactionId(msg.id); }}
              >
                {msg.type === 'system' ? (
                    <div className="w-full text-center my-2">
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">{msg.text}</span>
                    </div>
                ) : (
                    <>
                      {/* Reply Preview Bubble */}
                      {repliedMsg && (
                          <div 
                             className={`text-xs text-gray-500 mb-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded border-l-2 border-fb-blue opacity-80 max-w-[70%] truncate cursor-pointer shadow-sm self-${msg.sender === 'me' ? 'end' : 'start'}`}
                             onClick={() => {
                               const el = document.getElementById(`msg-${repliedMsg.id}`);
                               el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                             }}
                          >
                             <span className="font-bold">{repliedMsg.sender === 'me' ? (language === 'ar' ? 'أنت' : 'You') : (settings.nickname || user.name)}</span>: {repliedMsg.text || (language === 'ar' ? 'مرفق وسائط' : 'Media Attachment')}
                          </div>
                      )}

                      {/* Flex container to position Menu next to Bubble */}
                      <div className={`flex items-center gap-2 max-w-full ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                          
                          {/* Message Bubble */}
                          <div 
                              id={`msg-${msg.id}`}
                               onDoubleClick={() => handleStartReply(msg)}
                              className={`px-3 py-2 rounded-2xl text-[15px] shadow-sm relative transition-all max-w-[70%] sm:max-w-[72%] ${
                                  isMatch ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-50/20' : ''
                              } ${ 
                                  msg.type === 'emoji' ? 'bg-transparent shadow-none p-0' : 
                                  msg.type === 'sticker' ? 'bg-transparent shadow-none p-0' : 
                                  msg.sender === 'me' 
                                  ? `${settings.theme.bubble} text-white rounded-br-none`
                                  : 'bg-white dark:bg-gray-700 text-black dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-600'
                              }`}
                          >
                              {msg.type === 'emoji' && (
                                  <div style={{ fontSize: `${(msg.emojiSize || 1) * 32}px` }} className="leading-none transition-all">
                                      {msg.text}
                                  </div>
                              )}

                              {msg.linkPreview && (
                                  <div className="mb-2 bg-black/5 rounded-lg overflow-hidden border border-black/5">
                                      {msg.linkPreview.image && (
                                      <img src={msg.linkPreview.image} alt="preview" className="w-full h-32 object-cover" />
                                      )}
                                      <div className="p-2 bg-white/50 dark:bg-black/20">
                                      <p className="font-bold text-xs truncate">{msg.linkPreview.title}</p>
                                      <p className="text-[10px] opacity-80 truncate">{msg.linkPreview.description}</p>
                                      </div>
                                  </div>
                              )}

                              {msg.type === 'image' && msg.mediaUrl && (
                                  <div className="flex flex-col max-w-full min-w-0">
                                      {msg.fileName && (
                                          <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80 mb-1 max-w-full overflow-hidden dir-auto">
                                              <Image className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                                              <span className="truncate max-w-[200px] block" title={msg.fileName}>
                                                  {msg.fileName}
                                              </span>
                                          </div>
                                      )}
                                      <div 
                                          className="cursor-pointer overflow-hidden rounded-lg mb-1 border border-black/10 max-w-full"
                                          onClick={() => { setViewingMedia({ message: msg, type: 'image' }); setZoomLevel(1); }}
                                      >
                                          <img src={msg.mediaUrl} alt="sent" className="w-full h-auto max-h-52 object-cover rounded-lg" />
                                      </div>
                                  </div>
                              )}

                              {msg.type === 'sticker' && msg.mediaUrl && (
                                  <div 
                                      className="cursor-pointer overflow-hidden rounded-lg mb-1 hover:scale-105 transition duration-200"
                                      onClick={() => { setViewingMedia({ message: msg, type: 'sticker' }); setZoomLevel(1); }}
                                  >
                                      <img src={msg.mediaUrl} alt="sticker" className="w-32 h-32 object-contain drop-shadow-md" />
                                  </div>
                              )}
                              
                              {msg.type === 'video' && msg.mediaUrl && (
                                  <div className="flex flex-col max-w-full min-w-0">
                                      {msg.fileName && (
                                          <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80 mb-1 max-w-full overflow-hidden dir-auto">
                                              <Video className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                                              <span className="truncate max-w-[200px] block" title={msg.fileName}>
                                                  {msg.fileName}
                                              </span>
                                          </div>
                                      )}
                                      <div 
                                          className="cursor-pointer overflow-hidden rounded-lg mb-1 border border-black/10 relative group-hover:brightness-90 transition max-w-full"
                                          onClick={() => { setViewingMedia({ message: msg, type: 'video' }); setZoomLevel(1); }}
                                      >
                                          <video src={msg.mediaUrl} className="w-full h-auto max-h-52 object-cover rounded-lg" />
                                          <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="bg-black/30 p-2 rounded-full">
                                                  <Play className="w-6 h-6 text-white fill-current" />
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {msg.type === 'audio' && msg.mediaUrl && (
                                  <AudioPlayer src={msg.mediaUrl} sender={msg.sender} />
                              )}
                              
                              {msg.type !== 'emoji' && msg.text && <div className="whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere] text-start leading-relaxed">{msg.text}</div>}
                              
                              <div className={`flex items-center justify-end gap-1 mt-1 opacity-70`}>
                                  <span className="text-[9px]">{msg.timestamp}</span>
                                  {msg.sender === 'me' && msg.type !== 'emoji' && msg.type !== 'sticker' && (
                                      <StatusIcon msg={msg} />
                                  )}
                              </div>

                              {Object.keys(msg.reactions).length > 0 && (
                                  <button 
                                      onClick={() => toggleReaction(msg.id, Object.keys(msg.reactions)[0])}
                                      className="absolute -bottom-2 right-0 bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-600 rounded-full px-1.5 py-0.5 flex gap-0.5 items-center transform translate-y-1/2 scale-75 hover:scale-105 transition"
                                  >
                                      {Object.keys(msg.reactions).map(r => <span key={r}>{r}</span>)}
                                      <span className="text-[10px] text-gray-500">{Object.values(msg.reactions).reduce((a,b) => a+b, 0)}</span>
                                  </button>
                              )}
                          </div>

                          {/* Action Menu (Visible on Hover) */}
                          <div className={`relative flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* Emoji Button */}
                              <button 
                                  onClick={(e) => { 
                                      e.stopPropagation();
                                      setMessageMenuOpen(null);
                                      setMessageReactionTarget(msg.id);
                                      setPickerMode('emoji');
                                      setShowEmojiPicker(true);
                                  }} 
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-yellow-500 message-emoji-trigger bg-white/50 dark:bg-black/20 backdrop-blur-sm"
                                  title={language === 'ar' ? 'تفاعل' : 'React'}
                              >
                                  <Smile className="w-4 h-4" />
                              </button>
                              
                              <button 
                                  onClick={(e) => { e.stopPropagation(); handleStartReply(msg); }}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-blue-500 bg-white/50 dark:bg-black/20 backdrop-blur-sm"
                                  title={language === 'ar' ? 'رد' : 'Reply'}
                              >
                                  <CornerUpLeft className="w-4 h-4" />
                              </button>

                              <button 
                                  onClick={(e) => { 
                                      e.stopPropagation(); 
                                      const btnRect = e.currentTarget.getBoundingClientRect();
                                      const scrollEl = chatScrollRef.current;
                                      const scrollRect = scrollEl ? scrollEl.getBoundingClientRect() : (chatContainerRef.current ? chatContainerRef.current.getBoundingClientRect() : null);

                                      const viewportWidth = window.innerWidth;
                                      const viewportHeight = window.innerHeight;

                                      let spaceAbove = btnRect.top;
                                      let spaceBelow = viewportHeight - btnRect.bottom;
                                      let spaceLeft = btnRect.left;
                                      let spaceRight = viewportWidth - btnRect.right;

                                      if (scrollRect) {
                                          spaceAbove = btnRect.top - scrollRect.top;
                                          spaceBelow = scrollRect.bottom - btnRect.bottom;
                                          spaceLeft = btnRect.left - scrollRect.left;
                                          spaceRight = scrollRect.right - btnRect.right;
                                      }

                                      const MENU_HEIGHT = 160;
                                      const MENU_WIDTH = 165;

                                      let v: 'above' | 'below' = 'above';
                                      if (spaceAbove < MENU_HEIGHT) {
                                          v = 'below';
                                      } else if (spaceBelow < MENU_HEIGHT) {
                                          v = 'above';
                                      } else {
                                          v = spaceAbove >= spaceBelow ? 'above' : 'below';
                                      }

                                      let h: 'left-0' | 'right-0' = 'left-0';
                                      if (spaceLeft < MENU_WIDTH) {
                                          h = 'left-0';
                                      } else if (spaceRight < MENU_WIDTH) {
                                          h = 'right-0';
                                      } else {
                                          h = msg.sender === 'me' ? 'left-0' : 'right-0';
                                      }

                                      setMenuPlacement({ v, h });
                                      setMessageMenuOpen(messageMenuOpen === msg.id ? null : msg.id);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition text-gray-400 message-menu-trigger bg-white/50 dark:bg-black/20 backdrop-blur-sm"
                                  title={t.common_more || (language === 'ar' ? 'المزيد' : 'More')}
                              >
                                  <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Specific Message Menu Dropdown directly attached to Options Bar */}
                              {messageMenuOpen === msg.id && (
                                  <div 
                                      className={`absolute ${menuPlacement.v === 'below' ? 'top-full mt-1' : 'bottom-full mb-1'} ${menuPlacement.h} z-50 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden py-1 message-menu-container`} 
                                      onClick={e => e.stopPropagation()}
                                  >
                                      {msg.sender === 'me' ? (
                                          <button 
                                              onClick={() => { 
                                                  setSelectedMessageId(msg.id);
                                                  setActiveModal('unsend');
                                                  setMessageMenuOpen(null); 
                                              }} 
                                              className="w-full text-start px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                                          >
                                              <Trash2 className="w-3.5 h-3.5" /> {language === 'ar' ? 'إلغاء الإرسال' : 'Unsend'}
                                          </button>
                                      ) : (
                                          <button 
                                              onClick={() => { 
                                                  setSelectedMessageId(msg.id);
                                                  setActiveModal('deleteMessageConfirm');
                                                  setMessageMenuOpen(null); 
                                              }} 
                                              className="w-full text-start px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                                          >
                                              <Trash2 className="w-3.5 h-3.5" /> {t.common_delete || (language === 'ar' ? 'حذف' : 'Delete')}
                                          </button>
                                      )}

                                      <button 
                                          onClick={() => { 
                                              setForwardStatus({});
                                              setActiveModal('forward');
                                              setMessageMenuOpen(null); 
                                          }} 
                                          className="w-full text-start px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
                                      >
                                          <CornerUpRight className="w-3.5 h-3.5" /> {language === 'ar' ? 'إعادة توجيه' : 'Forward'}
                                      </button>
                                      <button 
                                          onClick={() => { 
                                              setReportReason('');
                                              setActiveModal('report');
                                              setMessageMenuOpen(null);
                                          }} 
                                          className="w-full text-start px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
                                      >
                                          <Flag className="w-3.5 h-3.5" /> {t.common_report || (language === 'ar' ? 'إبلاغ' : 'Report')}
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>
                    </>
                )}
              </div>
            );
          })}

          {(isTyping || partnerActivity !== 'idle') && (
             <div className="flex justify-start items-center gap-2 animate-fadeIn my-2">
                 <img src={user.avatar} className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:opacity-80 transition" alt="" onClick={() => setActiveModal('profile')} />
                 <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-2xl rounded-bl-none flex items-center gap-2 shadow-sm border dark:border-gray-600">
                     {partnerActivity === 'recording' ? (
                       <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                         <Mic className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                         <span>{language === 'ar' ? 'جاري تسجيل مقطع صوتي...' : 'recording voice note...'}</span>
                       </div>
                     ) : (
                       <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold">
                          {language === 'ar' ? 'جاري الكتابة...' : 'typing...'}
                       </span>
                     )}
                     <div className="flex gap-1 items-center">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                     </div>
                 </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-2 border-t dark:border-gray-700 bg-white dark:bg-gray-800 relative">
         {/* Reply Preview Banner */}
         {replyingTo && (
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 p-2 rounded-t-lg border-b dark:border-gray-700 mb-1">
               <div className="flex flex-col text-xs border-l-2 rtl:border-r-2 rtl:border-l-0 border-fb-blue pl-2 rtl:pl-0 rtl:pr-2">
                  <span className="font-bold text-fb-blue">{language === 'ar' ? 'الرد على' : 'Replying to'} {replyingTo.sender === 'me' ? (language === 'ar' ? 'نفسك' : 'Yourself') : (settings.nickname || user.name)}</span>
                  <span className="truncate text-gray-500 max-w-[200px]">{replyingTo.text || (language === 'ar' ? 'مرفق وسائط' : 'Media Attachment')}</span>
               </div>
               <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                  <X className="w-3 h-3" />
               </button>
            </div>
         )}

         {/* File Upload Preview Banner */}
         {pendingMedia && (
            <div className="flex flex-col bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl border dark:border-gray-700 mb-2 relative animate-fadeIn max-w-full overflow-hidden shadow-sm">
                <button 
                    onClick={removePendingMedia} 
                    className="absolute top-2 right-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition text-gray-500 hover:text-red-500 z-10"
                    title={language === 'ar' ? 'إلغاء' : 'Cancel'}
                >
                    <X className="w-4 h-4" />
                </button>
                <div className="flex gap-3 items-center min-w-0 pr-7">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black flex-shrink-0">
                        {pendingMedia.type === 'image' ? (
                            <img src={pendingMedia.url} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                            <video src={pendingMedia.url} className="w-full h-full object-cover" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block">
                            {pendingMedia.type === 'image' ? (language === 'ar' ? 'صورة محددة' : 'Selected Image') : (language === 'ar' ? 'فيديو محدد' : 'Selected Video')}
                        </span>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-full block" title={pendingMedia.file.name}>
                            {pendingMedia.file.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5 truncate">
                            {language === 'ar' ? 'أضف شرحاً أدناه أو اضغط إرسال...' : 'Add a caption below or click send...'}
                        </p>
                    </div>
                </div>
            </div>
         )}

         {/* Enhanced Emoji/Sticker Picker (Main Input) - Also used for reactions now */}
         {showEmojiPicker && (
             <div className="absolute bottom-full left-0 mb-2 ml-2 bg-white dark:bg-gray-800 shadow-2xl rounded-lg border border-gray-200 dark:border-gray-700 w-80 z-50 overflow-hidden flex flex-col h-96 animate-slideUp">
                 {/* If reaction mode, hide stickers. Otherwise show stickers (true). */}
                 {renderEmojiPickerContent(handleEmojiSelect, !messageReactionTarget)}
             </div>
         )}

         {/* Enhanced More Menu */}
         {showMoreMenu && (
             <div className={`absolute bottom-full mb-2 w-64 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-100 dark:border-gray-700 z-[60] overflow-hidden animate-fadeIn pb-1 ${dir === 'rtl' ? 'right-0 mr-2 origin-bottom-right' : 'left-0 ml-2 origin-bottom-left'}`}>
                 <div className="p-2 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 mb-1">
                    <img src={user.avatar} className="w-10 h-10 rounded-full" alt="" />
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-800 dark:text-white">{settings.nickname || user.name}</span>
                        <span className="text-xs text-gray-500">{language === 'ar' ? 'تخصيص الدردشة' : 'Customize Chat'}</span>
                    </div>
                 </div>

                 {[ 
                    { id: 'profile', icon: UserCircle, label: t.profile_view_profile || (language === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'), action: () => { if (onViewProfile) onViewProfile(user); else setActiveModal('profile'); } },
                    { id: 'theme', icon: Palette, label: language === 'ar' ? 'تغيير السمة' : 'Change Theme', action: () => { setPreviewTheme(settings.theme); setActiveModal('theme'); } },
                    { id: 'emoji', icon: Smile, label: language === 'ar' ? 'الرمز التعبيري' : 'Quick Emoji', action: () => { setModalInput(settings.quickEmoji); setActiveModal('emoji'); } },
                    { id: 'nicknames', icon: Type, label: language === 'ar' ? 'الكنيات' : 'Nicknames', action: () => { setModalInput(settings.nickname || user.name); setActiveModal('nickname'); } },
                    { id: 'mute', icon: settings.isMuted ? BellOff : Bell, label: settings.isMuted ? (t.common_unmute || (language === 'ar' ? 'تفعيل الإشعارات' : 'Unmute')) : (t.common_mute || (language === 'ar' ? 'كتم الإشعارات' : 'Mute')), action: () => setSettings(p => ({...p, isMuted: !p.isMuted})) },
                    { id: 'block', icon: ShieldBan, label: settings.isBlocked ? (language === 'ar' ? 'إلغاء الحظر' : 'Unblock') : (t.profile_block || (language === 'ar' ? 'حظر' : 'Block')), action: () => { if (!settings.isBlocked) { setActiveModal('blockConfirm'); } else { setSettings(p => ({...p, isBlocked: false})); } } },
                    { id: 'read_receipts', icon: CheckCheck, label: language === 'ar' ? 'مؤشرات القراءة' : 'Read Receipts', action: () => setActiveModal('readReceipts') },
                    { id: 'archive', icon: Archive, label: language === 'ar' ? 'أرشفة المحادثة' : 'Archive Chat', action: () => { alert('Chat archived'); onClose(); } },
                    { id: 'delete', icon: Trash2, label: language === 'ar' ? 'حذف المحادثة' : 'Delete Chat', action: () => setActiveModal('deleteConfirm'), color: 'text-red-600' },
                    { id: 'report', icon: Flag, label: t.common_report || (language === 'ar' ? 'إبلاغ' : 'Report'), action: () => setActiveModal('report'), color: 'text-red-600' },
                 ].map((item) => (
                     <button 
                        key={item.id} 
                        onClick={() => { setShowMoreMenu(false); item.action(); }}
                        className={`w-full text-start px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm transition ${item.color || 'text-gray-700 dark:text-gray-200'}`}
                     >
                         <item.icon className="w-4 h-4" /> {item.label}
                     </button>
                 ))}
             </div>
         )}

         <div className="flex items-center gap-1.5 w-full min-w-0">
             {isRecording ? (
                 <div 
                    className="w-full flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-full px-3 py-1.5 border border-red-200 dark:border-red-800/40 select-none transition-all min-w-0 max-w-full overflow-hidden"
                    onTouchMove={(e) => { if (e.touches.length > 0) handleRecordingTouchOrMouseMove(e.touches[0].clientX, e.touches[0].clientY); }}
                    onMouseMove={(e) => { if (e.buttons === 1) handleRecordingTouchOrMouseMove(e.clientX, e.clientY); }}
                 >
                    <div className="flex items-center gap-2 text-red-500 min-w-0 overflow-hidden">
                       <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping flex-shrink-0"></div>
                       <span className="text-xs font-mono font-bold flex-shrink-0">{formatDuration(recordingDuration)}</span>
                       {isRecordingLocked ? (
                         <span className="text-[10px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 whitespace-nowrap flex-shrink-0">
                           <Lock className="w-3 h-3" /> {language === "ar" ? "مثبّت" : "Locked"}
                         </span>
                       ) : (
                         <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold animate-pulse truncate min-w-0 flex items-center gap-0.5 whitespace-nowrap">
                           {language === "ar" ? "⬆️ للتثبيت | ⬅️ للإلغاء" : "⬆️ Lock | ⬅️ Cancel"}
                         </span>
                       )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                       {!isRecordingLocked && (
                         <button 
                           onClick={() => updateRecordingLocked(true)} 
                           className="p-1.5 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                           title={language === "ar" ? "تثبيت التسجيل" : "Lock Recording"}
                         >
                           <Lock className="w-3.5 h-3.5" />
                         </button>
                       )}
                       <button 
                         onClick={cancelRecording} 
                         className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                         title={language === "ar" ? "إلغاء التسجيل" : "Cancel"}
                       >
                          <Trash2 className="w-4 h-4 text-red-500" />
                       </button>
                       <button 
                         onClick={stopAndSendRecording} 
                         className="p-1.5 bg-emerald-600 hover:bg-blue-600 text-white rounded-full transition shadow-sm"
                         title={language === "ar" ? "إرسال التسجيل" : "Send Recording"}
                       >
                          <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                       </button>
                    </div>
                 </div>
             ) : (
                 <>
                   <div className="flex items-center gap-0.5 flex-shrink-0">
                       <button 
                          onClick={() => setShowMoreMenu(!showMoreMenu)} 
                          className={`text-emerald-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-700 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full transition-colors ${showMoreMenu ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                       >
                           <MoreHorizontal className="w-6 h-6" />
                       </button>
                       
                       <div className="relative">
                           <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept="image/*,video/*" 
                              onChange={handleFileUpload} 
                           />
                           <button 
                              onClick={() => fileInputRef.current?.click()} 
                              className={`text-emerald-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-700 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full transition-colors ${pendingMedia ? "bg-emerald-100 dark:bg-emerald-900/30" : ""}`}
                              title={language === "ar" ? "إرسال صورة/فيديو" : "Send Photo/Video"}
                           >
                               <Image className="w-6 h-6" />
                           </button>
                       </div>
                       
                       <button 
                          onClick={() => { setShowEmojiPicker(!showEmojiPicker); setMessageMenuOpen(null); }}
                          className={`text-emerald-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-700 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full transition-colors ${showEmojiPicker ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                       >
                           <Smile className="w-6 h-6" />
                       </button>
                   </div>

                   <form onSubmit={(e) => handleSend(e)} className="flex-1 flex items-center min-w-0">
                      <input 
                        type="text" 
                        className="w-full bg-gray-100 dark:bg-gray-700 dark:text-white rounded-full px-4 py-2 text-sm outline-none focus:bg-gray-50 dark:focus:bg-gray-600 transition border border-transparent focus:border-emerald-500"
                        ref={textInputRef}
                         placeholder={pendingMedia ? (language === "ar" ? "أضف شرحاً..." : "Add caption...") : (replyingTo ? (language === "ar" ? "الرد على رسالة..." : "Reply to message...") : (t.placeholders_type_message || (language === "ar" ? "اكتب رسالة..." : "Type a message...")))}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onFocus={() => { setShowEmojiPicker(false); setShowMoreMenu(false); setMessageMenuOpen(null); }}
                        disabled={settings.isBlocked}
                      />
                   </form>

                   {inputText || pendingMedia ? (
                       <button 
                          className="text-emerald-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-700 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition transform hover:scale-110 flex-shrink-0" 
                          onClick={(e) => handleSend(e)}
                       >
                           <Send className="w-5 h-5 rtl:rotate-180" />
                       </button>
                   ) : (
                       <div className="flex items-center flex-shrink-0">
                          <button 
                             className="text-emerald-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-700 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition transform hover:scale-110 active:scale-95" 
                             onMouseDown={(e) => startRecording(e)}
                             onTouchStart={(e) => startRecording(e)}
                             onClick={(e) => { if (!isRecording) startRecording(e); }}
                             title={language === "ar" ? "تسجيل صوتي (اسحب للأعلى للتثبيت | لليسار للإلغاء)" : "Voice Record (Swipe up to lock | Left to cancel)"}
                          >
                              <Mic className="w-5 h-5" />
                          </button>
                          <button 
                             className="p-2 rounded-full transition transform hover:scale-110 active:scale-90 text-blue-600"
                             onMouseDown={handleQuickEmojiDown}
                             onMouseUp={handleQuickEmojiUp}
                             onMouseLeave={(e) => { if(isLongPressing) handleQuickEmojiUp(e); }}
                             onTouchStart={handleQuickEmojiDown}
                             onTouchEnd={handleQuickEmojiUp}
                          >
                              {/* Render the Quick Emoji with Scaling Animation */}
                              <span 
                                  className="text-xl leading-none inline-block transition-transform duration-75 ease-out"
                                  style={{ transform: `scale(${isLongPressing ? quickEmojiSize : 1})` }}
                              >
                                  {settings.quickEmoji}
                              </span>
                          </button>
                       </div>
                   )}
                 </>
             )}
         </div>
      </div>

      {/* Media Viewer Lightbox */}
      {viewingMedia && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center animate-fadeIn"
          onMouseDown={handleViewerMouseDown}
          onMouseMove={handleViewerMouseMove}
          onMouseUp={handleViewerMouseUp}
          onMouseLeave={handleViewerMouseUp}
        >
           {/* TOP LEFT CONTROLS (Fixed Order) */}
           {/* In LTR mode, apply reverse to make visual order: Close, Download, Forward */}
           <div className={`absolute top-4 left-4 flex items-center gap-4 z-[10002] ${dir === 'ltr' ? 'flex-row-reverse' : ''}`}>
             <button 
               className="p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition backdrop-blur-sm"
               onClick={(e) => {
                  e.stopPropagation();
                  setForwardStatus({});
                  setActiveModal('forward');
               }}
               title={language === 'ar' ? "إعادة توجيه" : "Forward"}
             >
                <CornerUpRight className="w-6 h-6" />
             </button>
             <a 
               href={viewingMedia.message.mediaUrl} 
               download={`media_${Date.now()}`}
               className="p-2 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition"
               onClick={(e) => e.stopPropagation()}
               title={t.common_download || (language === 'ar' ? "تنزيل" : "Download")}
             >
                <Download className="w-6 h-6" />
             </a>
             <button 
               className="p-2 bg-black/50 hover:bg-red-500/50 rounded-full text-white transition backdrop-blur-sm"
               onClick={(e) => { e.stopPropagation(); setViewingMedia(null); }}
               title={t.common_close || (language === 'ar' ? "إغلاق (Esc)" : "Close (Esc)")}
             >
                <X className="w-6 h-6" />
             </button>
           </div>

           {/* TOP RIGHT CONTROLS */}
           <div className="absolute top-4 right-4 flex items-center gap-4 z-[10002]">
              <button 
                 className="p-2 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition"
                 onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.max(0.5, z - 0.25)); }}
                 title="تصغير"
              >
                 <ZoomOut className="w-6 h-6" />
              </button>
              <button 
                 className="p-2 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition"
                 onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.min(3, z + 0.25)); }}
                 title="تكبير"
              >
                 <ZoomIn className="w-6 h-6" />
              </button>
           </div>

           <div 
             className="w-full h-full flex items-center justify-center relative overflow-hidden cursor-move"
             onClick={(e) => e.stopPropagation()}
           >
               {viewingMedia.type === 'video' ? (
                  <div 
                      className="relative w-full h-full flex items-center justify-center"
                      style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`, transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}
                  >
                      <video 
                        src={viewingMedia.message.mediaUrl} 
                        controls 
                        autoPlay 
                        draggable={false}
                        className="max-w-full max-h-full object-contain shadow-2xl"
                      />
                  </div>
               ) : viewingMedia.type === 'sticker' ? (
                   <img 
                     src={viewingMedia.message.mediaUrl} 
                     alt="Sticker View"
                     className="max-w-md max-h-[80vh] object-contain animate-bounce-in select-none"
                     draggable={false}
                     style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`, transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}
                   />
               ) : (
                   <img 
                     src={viewingMedia.message.mediaUrl} 
                     alt="Full View" 
                     className="max-w-full max-h-full object-contain shadow-2xl select-none"
                     draggable={false}
                     style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`, transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}
                   />
               )}
            </div>

            {/* Media Viewer Caption / File Name Overlay */}
            {(viewingMedia.message.text || viewingMedia.message.fileName) && (
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-xl w-[90%] bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-2xl text-white text-center z-[10002] border border-white/10 shadow-2xl animate-fadeIn">
                   {viewingMedia.message.fileName && (
                       <p className="text-xs text-gray-300 truncate max-w-full font-medium mb-0.5" title={viewingMedia.message.fileName}>
                           📎 {viewingMedia.message.fileName}
                       </p>
                   )}
                   {viewingMedia.message.text && (
                       <p className="text-sm font-normal break-words max-h-24 overflow-y-auto leading-relaxed dir-auto">{viewingMedia.message.text}</p>
                   )}
               </div>
            )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ChatWindow;