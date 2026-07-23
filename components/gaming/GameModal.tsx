import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Maximize2, Minimize2, Share2, Star, Users, ArrowRight, Gamepad2, Play, Check, AlertCircle, Volume2, VolumeX, Flag 
} from 'lucide-react';
import { Game } from '../../data/gamingData';
import TicTacToeGame from './TicTacToeGame';
import SnakeGame from './SnakeGame';
import MemoryGame from './MemoryGame';
import RockPaperScissors from './RockPaperScissors';
import MathQuiz from './MathQuiz';
import GamingShareModal from './GamingShareModal';
import { useLanguage } from '../../context/LanguageContext';
import { playAudio } from '../../utils/audio';

interface GameModalProps {
  game: Game;
  onClose: () => void;
}

const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  const { t, dir, language } = useLanguage();
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [gameLoadingProgress, setGameLoadingProgress] = useState(0);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameLoadInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Game Loading Simulation
  useEffect(() => {
      // Only simulate loading for NON-playable games (the mock ones)
      if (game && isPlayingGame && !game.isPlayable) {
          setGameLoadingProgress(0);
          playAudio('upload_start');
          gameLoadInterval.current = setInterval(() => {
              setGameLoadingProgress(prev => {
                  if (prev >= 100) {
                      if (gameLoadInterval.current) clearInterval(gameLoadInterval.current);
                      playAudio('post_success');
                      return 100;
                  }
                  return prev + 10;
              });
          }, 200);
      } else if (!isPlayingGame) {
          setGameLoadingProgress(0);
      }
      return () => {
          if (gameLoadInterval.current) clearInterval(gameLoadInterval.current);
      };
  }, [game, isPlayingGame]);

  const showNotification = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (type === 'success') playAudio('post_success');
    else if (type === 'error') playAudio('notification');
    else playAudio('pop');

    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePlayGame = (e?: any) => {
      e?.stopPropagation?.();
      playAudio('pop');
      setIsPlayingGame(true);
  };

  const handleCloseGame = (e?: any) => {
      e?.stopPropagation?.();
      playAudio('pop');
      // If playing, go back to details, else close modal
      if (isPlayingGame) {
          setIsPlayingGame(false);
      } else {
          onClose();
      }
  };

  const handleCloseModal = (e?: any) => {
      e?.stopPropagation?.();
      playAudio('pop');
      onClose();
  };

  const toggleGameFullscreen = (e?: any) => {
    e?.stopPropagation?.();
    playAudio('pop');
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  const handleShare = () => {
    playAudio('pop');
    setShowShareModal(true);
  };

  const handleReport = () => {
    playAudio('pop');
    showNotification(t.common.success, 'success');
  };

  const toggleMute = () => {
      playAudio('pop');
      setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-2 md:p-4 animate-fadeIn backdrop-blur-sm" dir={dir}>
      
      {notification && (
          <div className={`fixed bottom-6 ${dir === 'rtl' ? 'right-6' : 'left-6'} px-6 py-3 rounded-xl shadow-lg z-[10000] animate-bounce-in flex items-center gap-3 text-white backdrop-blur-md border border-white/10 ${notification.type === 'error' ? 'bg-red-600' : notification.type === 'info' ? 'bg-blue-600' : 'bg-green-600'}`}>
            {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{notification.message}</span>
          </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] md:h-[85vh] flex flex-col overflow-hidden relative animate-scaleIn border border-white/10 dark:border-gray-700 transition-colors duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
                 onClick={handleCloseModal}
                 className="hidden sm:flex bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-3 py-1.5 rounded-full font-bold items-center gap-2 transition text-sm active:scale-95"
               >
                   <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> 
                   {t.gaming.back_to_menu}
               </button>
            <img src={game.image} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover shadow-sm border border-gray-200 dark:border-gray-600 flex-shrink-0" alt="icon" />
            <div className="min-w-0">
              <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white truncate pr-2">{game.title}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> {game.players} {language === 'ar' ? 'لاعب' : 'Players'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <button 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition active:scale-95 text-gray-600 dark:text-gray-300" 
                onClick={toggleGameFullscreen}
                title={language === 'ar' ? 'ملء الشاشة' : 'Fullscreen'}
            >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button 
                onClick={handleShare} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition active:scale-95 text-gray-600 dark:text-gray-300"
                title={t.common.share}
            >
                <Share2 className="w-5 h-5" />
            </button>
            <button 
                onClick={handleCloseModal} 
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition active:scale-95 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                title={t.common.close}
            >
                <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 bg-black relative flex items-center justify-center group overflow-hidden" ref={gameContainerRef}>
          {/* If game is playable, render actual component. Else use simulation */}
          {game.isPlayable && isPlayingGame ? (
              <div className="w-full h-full bg-gray-900 overflow-auto relative">
                  {/* Back Button within Game Area (Z-Index increased) */}
                  <div className={`absolute top-4 ${dir === 'rtl' ? 'right-4' : 'left-4'} z-[50]`}>
                       <button 
                         onClick={handleCloseGame}
                         className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-3 py-1.5 rounded-full font-bold flex items-center gap-2 transition border border-white/20 shadow-lg text-sm active:scale-95"
                       >
                           <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> {t.common.back}
                       </button>
                  </div>

                  {game.id === 'tic-tac-toe' && <TicTacToeGame onBack={() => handleCloseGame()} />}
                  {game.id === 'snake' && <SnakeGame onBack={() => handleCloseGame()} />}
                  {game.id === 'memory' && <MemoryGame onBack={() => handleCloseGame()} />}
                  {game.id === 'rock-paper-scissors' && <RockPaperScissors onBack={() => handleCloseGame()} />}
                  {game.id === 'math-quiz' && <MathQuiz onBack={() => handleCloseGame()} />}
              </div>
          ) : isPlayingGame ? (
              // Original Simulation Logic for Commercial Games
              <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gray-900 p-4">
                  {gameLoadingProgress < 100 ? (
                      <div className="text-center w-full max-w-xs">
                          <div className="w-16 h-16 border-4 border-fb-blue border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                          <h3 className="text-xl font-bold mb-4">{t.gaming.loading_game}</h3>
                          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-fb-blue transition-all duration-200 ease-out" style={{ width: `${gameLoadingProgress}%` }}></div>
                          </div>
                          <p className="mt-2 text-sm text-gray-400 font-mono">{gameLoadingProgress}%</p>
                      </div>
                  ) : (
                      <div className="text-center animate-fadeIn">
                          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-fb-blue drop-shadow-lg">{game.title}</h2>
                          <p className="text-lg md:text-xl text-gray-300 mb-8">{t.gaming.game_ready}</p>
                          <Gamepad2 className="w-24 h-24 md:w-32 md:h-32 text-gray-700 mx-auto animate-bounce" />
                      </div>
                  )}
              </div>
          ) : (
              // Pre-Play Screen (Shared)
              <div className="text-center text-white animate-pulse relative z-10 p-4">
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-fb-blue rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 hover:scale-110 transition duration-500">
                    <Gamepad2 className="w-10 h-10 md:w-12 md:h-12" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-md">{game.title}</h2>
                <p className="text-gray-300 text-sm md:text-base">{language === 'ar' ? 'استعد للمرح!' : 'Get ready for fun!'}</p>
            </div>
          )}
          
          {/* Background Image Effect (Only when NOT playing) */}
          {!isPlayingGame && (
              <div className="absolute inset-0">
                  <img src={game.image} className="w-full h-full object-cover opacity-30 blur-md scale-105" alt="bg" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>
          )}

          {/* Controls Overlay (Only when NOT playing) */}
          {!isPlayingGame && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-20 w-full justify-center px-4">
                <button 
                    onClick={toggleMute}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white w-12 h-12 flex items-center justify-center rounded-full font-bold border border-white/20 transition active:scale-95"
                    title={isMuted ? t.common.unmute : t.common.mute}
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button 
                    onClick={handlePlayGame}
                    className="bg-fb-blue hover:bg-blue-600 text-white px-8 md:px-10 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/10"
                >
                    <Play className="w-5 h-5 fill-current" /> 
                    {t.gaming.play_now}
                </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 transition-colors">
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex flex-wrap gap-4 md:gap-6 items-center">
                 <span className="flex items-center gap-1 font-bold text-gray-800 dark:text-white">
                     <Star className="w-4 h-4 text-yellow-500 fill-current" /> {game.rating}/5
                 </span>
                 <span className="flex items-center gap-1">
                     <span className="opacity-70">{t.common.category}:</span>
                     <span className="font-medium">{t.gaming.cats[game.category.toLowerCase() as keyof typeof t.gaming.cats] || game.category}</span>
                 </span>
                 {game.description && <span className="text-gray-500 dark:text-gray-400 hidden md:inline truncate max-w-md">- {game.description}</span>}
              </div>
              <button 
                onClick={handleReport} 
                className="text-fb-blue hover:underline font-medium flex items-center gap-1.5 self-start sm:self-auto transition"
              >
                  <Flag className="w-4 h-4" />
                  {t.common.report}
              </button>
           </div>
        </div>
      </div>

      {/* Advanced Share Modal for Gaming rendered via Portal */}
      {showShareModal && createPortal(
          <GamingShareModal 
            item={{
                id: game.id,
                title: game.title,
                image: game.image,
                type: 'game'
            }} 
            onClose={() => setShowShareModal(false)} 
          />,
          document.body
      )}
    </div>
  );
};

export default GameModal;