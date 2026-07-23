/**
 * Centralized Audio Utility for Tourloop
 * Handles UI sound effects for various user interactions.
 * 
 * DEVELOPED:
 * - Sound library updated to match Facebook/Messenger UI sound profiles (Short, crisp, and high quality).
 * - Caching mechanism to ensure zero-latency.
 * - Audio cloning to allow multiple sounds to play simultaneously without cutoff.
 * - Autoplay policy compliance with silent failure handling.
 */

export type AudioAction = 
  | 'like' 
  | 'react' 
  | 'comment' 
  | 'post_success' 
  | 'upload_start' 
  | 'notification' 
  | 'message_sent' 
  | 'message_received'
  | 'share'
  | 'pop';

// Updated Audio Sources with high-quality social-media grade sound effects
const AUDIO_SOURCES: Record<AudioAction, string> = {
  // Sharp & crisp "Pop" for Likes (Facebook style)
  like: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  
  // Springy "Twinkle" for Reactions
  react: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  
  // Bubble "Pluck" for Comments
  comment: 'https://assets.mixkit.co/active_storage/sfx/1111/1111-preview.mp3',
  
  // Celebratory Chime for successful posts
  post_success: 'https://assets.mixkit.co/active_storage/sfx/1487/1487-preview.mp3',
  
  // Fast "Zip" for upload initialization
  upload_start: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  
  // Classic high-pitched "Ding" for notifications
  notification: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3',
  
  // Iconic "Messenger Sent" slip sound
  message_sent: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  
  // Iconic "Messenger Received" tri-tone notification
  message_received: 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3',
  
  // Clean "Swoosh" for sharing
  share: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',

  // General generic interaction click/pop used in Profile Header
  pop: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
};

// Internal cache for HTMLAudioElement instances
const audioCache: Map<string, HTMLAudioElement> = new Map();
const preloadedLinks: Set<string> = new Set();

/**
 * Preloads all sound effects into browser cache and memory.
 * Ensures that sounds trigger instantly when the user clicks.
 */
export const preloadSounds = (): void => {
  if (typeof window === 'undefined') return;

  Object.values(AUDIO_SOURCES).forEach((url) => {
    // Memory Cache
    if (!audioCache.has(url)) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioCache.set(url, audio);
    }

    // Browser Cache (Resource Hint)
    if (!preloadedLinks.has(url)) {
      const existingLink = document.querySelector(`link[href="${url}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'audio';
        link.href = url;
        document.head.appendChild(link);
      }
      preloadedLinks.add(url);
    }
  });
};

/**
 * Plays a UI sound based on the action type.
 * Uses .cloneNode() to allow overlapping sounds if multiple events occur rapidly.
 * 
 * @param type - The action triggering the sound.
 * @param volume - Target volume (0.0 to 1.0).
 */
export const playAudio = (type: AudioAction, volume: number = 0.4): void => {
  if (typeof window === 'undefined') return;

  try {
    const audioUrl = AUDIO_SOURCES[type];
    if (!audioUrl) return;

    let baseAudio = audioCache.get(audioUrl);
    if (!baseAudio) {
      baseAudio = new Audio(audioUrl);
      audioCache.set(audioUrl, baseAudio);
    }

    // Clone node allows us to play the same sound multiple times simultaneously
    // without resetting the current playing sound.
    const audioInstance = baseAudio.cloneNode() as HTMLAudioElement;
    audioInstance.volume = Math.max(0, Math.min(1, volume));
    
    const playPromise = audioInstance.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Silently handle autoplay prevention by the browser
        if (error.name !== 'NotAllowedError') {
          console.debug(`[Audio] Playback interrupted for ${type}:`, error.message);
        }
      });
    }
  } catch (error) {
    console.error('[Audio Utility] Error playing sound:', error);
  }
};