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

// Web Audio Synthesizer for Story Background Music Tracks
let activeMusicAudioContext: AudioContext | null = null;
let activeMusicInterval: any = null;

export const playStoryMusicTrack = (trackId: string, volume: number = 0.25): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  stopStoryMusicTrack();

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return () => {};

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    activeMusicAudioContext = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Frequencies: C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88, C5=523.25, D5=587.33, E5=659.25, G5=783.99
    let notes: number[] = [];
    let tempo = 300;
    let type: OscillatorType = 'sine';

    if (trackId === 'track_1') { // Lo-Fi Chill
      notes = [261.63, 329.63, 392.00, 493.88, 220.00, 261.63, 329.63, 392.00, 293.66, 349.23, 440.00, 523.25, 196.00, 246.94, 293.66, 392.00];
      tempo = 350;
      type = 'sine';
    } else if (trackId === 'track_2') { // Acoustic Guitar
      notes = [196.00, 246.94, 293.66, 392.00, 493.88, 392.00, 293.66, 246.94, 164.81, 220.00, 261.63, 329.63, 440.00, 329.63, 261.63, 220.00];
      tempo = 220;
      type = 'triangle';
    } else if (trackId === 'track_3') { // Soft Piano
      notes = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 293.66, 392.00, 329.63, 261.63, 220.00, 196.00, 261.63, 329.63, 392.00, 523.25];
      tempo = 400;
      type = 'sine';
    } else if (trackId === 'track_4') { // Upbeat Pop
      notes = [329.63, 329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66, 293.66, 349.23, 392.00, 440.00, 392.00, 349.23, 293.66];
      tempo = 180;
      type = 'square';
    } else if (trackId === 'track_5') { // Romantic
      notes = [220.00, 261.63, 329.63, 440.00, 392.00, 329.63, 261.63, 196.00, 174.61, 220.00, 261.63, 349.23, 329.63, 261.63, 220.00, 196.00];
      tempo = 450;
      type = 'sine';
    } else {
      // Generate unique harmonic note scale based on trackId hash
      const scale = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25];
      let hash = 0;
      for (let i = 0; i < trackId.length; i++) {
        hash = (hash << 5) - hash + trackId.charCodeAt(i);
      }
      hash = Math.abs(hash);
      
      notes = [];
      for (let i = 0; i < 16; i++) {
        const notePos = (hash + i * 7) % scale.length;
        notes.push(scale[notePos]);
      }
      tempo = 200 + (hash % 200);
      const waveTypes: OscillatorType[] = ['sine', 'triangle', 'sine', 'square'];
      type = waveTypes[hash % waveTypes.length];
    }

    let noteIdx = 0;

    const playNextNote = () => {
      if (!activeMusicAudioContext || activeMusicAudioContext.state === 'closed') return;
      const now = activeMusicAudioContext.currentTime;
      const freq = notes[noteIdx % notes.length];
      noteIdx++;

      const osc = activeMusicAudioContext.createOscillator();
      const gain = activeMusicAudioContext.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (tempo / 1000) * 0.9);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + (tempo / 1000));
    };

    playNextNote();
    activeMusicInterval = setInterval(playNextNote, tempo);

    return () => {
      stopStoryMusicTrack();
    };
  } catch (err) {
    console.error('Error playing Web Audio story track:', err);
    return () => {};
  }
};

export const stopStoryMusicTrack = (): void => {
  if (activeMusicInterval) {
    clearInterval(activeMusicInterval);
    activeMusicInterval = null;
  }
  if (activeMusicAudioContext) {
    try {
      activeMusicAudioContext.close().catch(() => {});
    } catch (e) {}
    activeMusicAudioContext = null;
  }
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