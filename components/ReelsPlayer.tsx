import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, Heart, MessageCircle, Share2, Volume2, VolumeX, ChevronUp, ChevronDown, 
  Send, Bookmark, Play, Pause, Music, Sparkles, AlertCircle
} from 'lucide-react';
import { Post, User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ReelsPlayerProps {
  posts: Post[];
  currentUser: User;
  onClose: () => void;
  onLike: (postId: string, reactionType?: string) => void;
  onComment: (postId: string, text: string) => void;
}

// Fallback high quality video reels for rich demonstration if posts don't contain videos
const DEFAULT_REELS = [
  {
    id: 'reel_1',
    author: {
      id: 'u101',
      name: 'أحمد علي',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    content: 'جمال الطبيعة في الخريف! 🍂✨ #طبيعة #هدوء #مناظر',
    likes: 1240,
    commentsCount: 89,
    isLiked: false,
    timestamp: 'قبل ساعتين',
    musicTrack: 'الصوت الأصلي - أحمد علي 🎵'
  },
  {
    id: 'reel_2',
    author: {
      id: 'u102',
      name: 'سارة محمود',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-shot-of-a-waterfall-in-a-forest-42898-large.mp4',
    content: 'شلالات السحرية وسط الغابة 🌊🌲 #سفر #مغامرة #طبيعة',
    likes: 3520,
    commentsCount: 240,
    isLiked: true,
    timestamp: 'قبل 5 ساعات',
    musicTrack: 'موسيقى الاسترخاء العميقة 🎼'
  },
  {
    id: 'reel_3',
    author: {
      id: 'u103',
      name: 'عالم التقنية',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41529-large.mp4',
    content: 'أحدث التطورات في عالم تطبيقات الهاتف! 📱🚀 #برمجة #تقنية #ابتكار',
    likes: 980,
    commentsCount: 45,
    isLiked: false,
    timestamp: 'قبل يوم',
    musicTrack: 'صوت التقنية المستقبلية ⚡'
  }
];

export const ReelsPlayer: React.FC<ReelsPlayerProps> = ({
  posts,
  currentUser,
  onClose,
  onLike,
  onComment
}) => {
  const { language, dir } = useLanguage();

  // Combine video posts from main feed and DEFAULT_REELS
  const reelPosts = useMemo(() => {
    const videoPostsFromFeed = posts.filter(p => 
      p.image && (p.image.startsWith('data:video') || p.image.endsWith('.mp4') || p.image.endsWith('.webm') || p.image.includes('mixkit'))
    );

    if (videoPostsFromFeed.length > 0) {
      return videoPostsFromFeed;
    }

    // Map default reels to Post format
    return DEFAULT_REELS.map(r => ({
      id: r.id,
      author: r.author,
      content: r.content,
      image: r.videoUrl,
      likes: r.likes,
      comments: [],
      shares: 12,
      isLiked: r.isLiked,
      timestamp: r.timestamp,
      musicTrack: r.musicTrack
    })) as Post[];
  }, [posts]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [shareFeedback, setShareFeedback] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const activePost = reelPosts[currentIndex] || reelPosts[0];

  // Auto-play active video and pause others
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === currentIndex) {
          video.currentTime = 0;
          video.play().catch(() => {});
          setIsPlaying(true);
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < reelPosts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause();
        setIsPlaying(false);
      } else {
        currentVideo.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activePost) return;
    onComment(activePost.id, commentInput.trim());
    setCommentInput('');
  };

  const handleShare = () => {
    setShareFeedback(true);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setTimeout(() => setShareFeedback(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center animate-fadeIn text-white select-none">
      {/* Top Controls Header */}
      <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-xs sm:text-sm tracking-wide">
            {language === 'ar' ? 'المقاطع القصيرة (Reels)' : 'Reels Shorts'}
          </span>
        </div>

        <button 
          onClick={onClose}
          className="bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full border border-white/20 backdrop-blur-md transition hover:scale-105 active:scale-95"
          aria-label="Close Reels"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Reels Vertical Container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[420px] h-full max-h-[92vh] bg-gray-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-center border border-white/10"
      >
        {reelPosts.map((post, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div 
              key={post.id}
              className={`absolute inset-0 transition-opacity duration-300 flex items-center justify-center bg-black ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Video Element */}
              <video
                ref={el => videoRefs.current[idx] = el}
                src={post.image}
                loop
                playsInline
                muted={isMuted}
                onClick={togglePlayPause}
                className="w-full h-full object-cover cursor-pointer"
              />

              {/* Play/Pause Overlay Indicator */}
              {!isPlaying && isActive && (
                <div 
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] cursor-pointer"
                >
                  <div className="bg-black/60 p-5 rounded-full text-white backdrop-blur-md border border-white/20 animate-scaleIn">
                    <Play className="w-10 h-10 fill-current translate-x-0.5" />
                  </div>
                </div>
              )}

              {/* Bottom Details Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-auto flex flex-col gap-2.5">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover shadow-lg" 
                  />
                  <div className="flex flex-col text-start">
                    <span className="font-bold text-sm text-white drop-shadow">
                      {post.author.name}
                    </span>
                    <span className="text-[11px] text-gray-300 drop-shadow">
                      {post.timestamp}
                    </span>
                  </div>
                </div>

                {/* Caption Text */}
                <p className="text-xs sm:text-sm text-gray-100 line-clamp-2 leading-relaxed text-start drop-shadow">
                  {post.content}
                </p>

                {/* Audio Track Tag */}
                <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-semibold drop-shadow">
                  <Music className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="truncate">
                    {/* @ts-ignore */}
                    {post.musicTrack || (language === 'ar' ? 'صوت أصلي - Tourloop Reels' : 'Original Sound - Tourloop Reels')}
                  </span>
                </div>
              </div>

              {/* Floating Action Bar (Right side in LTR, Left in RTL) */}
              <div className={`absolute bottom-20 z-30 flex flex-col gap-5 items-center ${
                dir === 'rtl' ? 'left-3' : 'right-3'
              }`}>
                {/* Like Button */}
                <button
                  onClick={() => onLike(post.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={`p-3 rounded-full backdrop-blur-md border border-white/20 transition-all transform active:scale-75 ${
                    post.isLiked 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/40' 
                      : 'bg-black/40 text-white hover:bg-black/60'
                  }`}>
                    <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                  </div>
                  <span className="text-[11px] font-bold drop-shadow">
                    {post.likes}
                  </span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white transition transform active:scale-75">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold drop-shadow">
                    {post.comments?.length || 0}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white transition transform active:scale-75">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold drop-shadow">
                    {post.shares || 0}
                  </span>
                </button>

                {/* Mute / Unmute Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white transition transform active:scale-75 mt-2"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
                </button>
              </div>
            </div>
          );
        })}

        {/* Up / Down Scroll Navigation Controls */}
        <div className="absolute right-1/2 translate-x-1/2 top-4 z-30 flex gap-2">
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full border border-white/20 backdrop-blur-md transition active:scale-90"
              title={language === 'ar' ? 'الفيديو السابق' : 'Previous Video'}
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          )}
          {currentIndex < reelPosts.length - 1 && (
            <button
              onClick={handleNext}
              className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full border border-white/20 backdrop-blur-md transition active:scale-90"
              title={language === 'ar' ? 'الفيديو التالي' : 'Next Video'}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Share Toast Notification */}
        {shareFeedback && (
          <div className="absolute top-16 right-1/2 translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl animate-fadeIn flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {language === 'ar' ? 'تم نسخ رابط المقطع بنجاح!' : 'Reel link copied!'}
          </div>
        )}

        {/* Slide-Up Comments Drawer */}
        {showComments && activePost && (
          <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gray-900/95 backdrop-blur-xl z-40 rounded-t-3xl border-t border-white/20 p-4 flex flex-col justify-between animate-slideUp shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h4 className="font-bold text-sm text-gray-100">
                {language === 'ar' ? 'التعليقات' : 'Comments'} ({activePost.comments?.length || 0})
              </h4>
              <button 
                onClick={() => setShowComments(false)}
                className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto my-3 space-y-3 custom-scrollbar">
              {activePost.comments && activePost.comments.length > 0 ? (
                activePost.comments.map(c => (
                  <div key={c.id} className="flex gap-2.5 text-xs text-start">
                    <img 
                      src={c.author.avatar} 
                      alt={c.author.name} 
                      className="w-7 h-7 rounded-full border border-gray-700 object-cover"
                    />
                    <div className="flex-1 bg-gray-800/80 p-2.5 rounded-2xl border border-gray-700/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-emerald-400">{c.author.name}</span>
                        <span className="text-[10px] text-gray-400">{c.timestamp}</span>
                      </div>
                      <p className="text-gray-200 leading-normal">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs flex flex-col items-center gap-2">
                  <MessageCircle className="w-8 h-8 opacity-40" />
                  <span>{language === 'ar' ? 'لا توجد تعليقات بعد. كن أول من يعلّق!' : 'No comments yet. Be the first to comment!'}</span>
                </div>
              )}
            </div>

            {/* Input Field */}
            <form onSubmit={handleSendComment} className="flex gap-2 pt-2 border-t border-gray-800">
              <input 
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...'}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-xs text-white placeholder-gray-400 outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-full disabled:opacity-40 transition"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelsPlayer;
