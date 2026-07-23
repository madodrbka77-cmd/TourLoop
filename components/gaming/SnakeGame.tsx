import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RefreshCw, ArrowRight, Volume2, VolumeX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { playAudio } from '../../utils/audio';

interface GameProps {
  onBack?: () => void;
}

const SnakeGame: React.FC<GameProps> = ({ onBack }) => {
  const { t, dir } = useLanguage();
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([15, 15]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(150);
  const [isMuted, setIsMuted] = useState(false);
  
  const directionRef = useRef([0, -1]); // Start moving up
  const lastProcessedDirectionRef = useRef([0, -1]); // Prevent double-turn suicide
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boardSize = 20;

  // Generate food, ensuring it doesn't land on the snake
  const generateFood = useCallback((currentSnake: number[][] = snake) => {
    let newFood;
    let isColliding;
    // Safety break to prevent infinite loops
    let attempts = 0;
    do {
      newFood = [
        Math.floor(Math.random() * boardSize),
        Math.floor(Math.random() * boardSize)
      ];
      // eslint-disable-next-line no-loop-func
      isColliding = currentSnake.some(s => s[0] === newFood[0] && s[1] === newFood[1]);
      attempts++;
    } while (isColliding && attempts < 100);
    return newFood;
  }, [snake]);

  const resetGame = () => {
    if (!isMuted) playAudio('pop');
    const initialSnake = [[10, 10]];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    directionRef.current = [0, -1];
    lastProcessedDirectionRef.current = [0, -1];
    setScore(0);
    setSpeed(150);
    setGameOver(false);
    setIsPaused(false);
  };

  const changeDirection = useCallback((newDx: number, newDy: number) => {
    const [currentDx, currentDy] = lastProcessedDirectionRef.current;
    // Prevent reversing direction directly (e.g., cannot go Down if moving Up)
    if (newDx !== -currentDx && newDy !== -currentDy) {
        directionRef.current = [newDx, newDy];
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': changeDirection(0, -1); break;
        case 'ArrowDown': changeDirection(0, 1); break;
        case 'ArrowLeft': changeDirection(-1, 0); break;
        case 'ArrowRight': changeDirection(1, 0); break;
        case ' ': // Spacebar to pause/resume
          setIsPaused(prev => !prev);
          if (!isMuted) playAudio('pop');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, isMuted]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    gameLoopRef.current = setInterval(() => {
      setSnake(prev => {
        const head = prev[0];
        const [dx, dy] = directionRef.current;
        
        // Update last processed direction for input validation
        lastProcessedDirectionRef.current = [dx, dy];

        const newHead = [head[0] + dx, head[1] + dy];

        // Wall Collision
        if (
          newHead[0] < 0 || newHead[0] >= boardSize ||
          newHead[1] < 0 || newHead[1] >= boardSize ||
          prev.some(s => s[0] === newHead[0] && s[1] === newHead[1])
        ) {
          if (!isMuted && !gameOver) playAudio('notification');
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];
        
        // Food Collision
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          if (!isMuted) playAudio('post_success', 0.6);
          setScore(s => s + 1);
          setFood(generateFood(newSnake));
          setSpeed(s => Math.max(50, s - 2)); // Increase speed
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, isPaused, food, speed, generateFood, isMuted]);

  const handleBack = () => {
    if (!isMuted) playAudio('pop');
    if (onBack) onBack();
  };

  const toggleMute = () => {
    playAudio('pop');
    setIsMuted(!isMuted);
  };

  const togglePause = () => {
    playAudio('pop');
    setIsPaused(!isPaused);
  };

  // Determine status text based on game state
  const getStatusText = () => {
    if (gameOver) return t.gaming.game_over;
    if (isPaused) return t.gaming.snake_paused;
    return t.gaming.snake_playing;
  };

  const getStatusColor = () => {
    if (gameOver) return 'text-red-500';
    if (isPaused) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-white bg-gray-900 w-full relative overflow-y-auto custom-scrollbar p-2" dir={dir}>
      {onBack && (
        <div className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-50`}>
          <button 
            onClick={handleBack}
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-3 py-1.5 rounded-full font-bold flex items-center gap-2 transition border border-white/20 shadow-lg text-xs md:text-sm active:scale-95"
          >
              <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> {t.common.back}
          </button>
        </div>
      )}
      
      {/* Header Info */}
      <div className="flex justify-between w-full max-w-[320px] mb-4 text-lg md:text-xl font-bold px-4">
        <span className="drop-shadow-md">{t.gaming.score}: {score}</span>
        <span className={`${getStatusColor()} drop-shadow-md animate-pulse`}>{getStatusText()}</span>
      </div>
      
      {/* Game Board */}
      <div 
        className="grid bg-gray-800 border-4 border-gray-700 rounded-xl shadow-2xl relative mx-auto"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 15px)`,
          gridTemplateRows: `repeat(${boardSize}, 15px)`,
        }}
      >
        {Array.from({ length: boardSize * boardSize }).map((_, i) => {
          const x = i % boardSize;
          const y = Math.floor(i / boardSize);
          const isSnake = snake.some(s => s[0] === x && s[1] === y);
          const isFood = food[0] === x && food[1] === y;
          const isHead = snake[0][0] === x && snake[0][1] === y;
          
          return (
            <div 
              key={i}
              className={`w-full h-full border border-gray-800/10 transition-all duration-100
                ${isHead 
                    ? 'bg-green-400 rounded-sm z-10 shadow-[0_0_10px_rgba(74,222,128,0.5)]' 
                    : isSnake 
                        ? 'bg-green-600 rounded-sm' 
                        : isFood 
                            ? 'bg-red-500 rounded-full scale-75 animate-bounce shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                            : 'bg-gray-900'}
              `}
            />
          );
        })}
        
        {/* Game Over Overlay */}
        {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col z-20 rounded-lg backdrop-blur-sm animate-fadeIn">
                <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-lg">{t.gaming.game_over}</h3>
                <p className="text-gray-300 mb-6 font-medium">{t.gaming.score}: {score}</p>
                <button 
                    onClick={resetGame} 
                    className="bg-fb-blue px-6 py-2.5 rounded-full font-bold hover:bg-blue-600 transition shadow-lg active:scale-95 flex items-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" />
                    {t.gaming.play_again}
                </button>
            </div>
        )}

        {/* Pause Overlay */}
        {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 backdrop-blur-sm">
                <Play className="w-16 h-16 text-white opacity-80 animate-pulse" />
            </div>
        )}
      </div>

      {/* Controls & Stats */}
      <div className="mt-6 flex flex-col items-center w-full max-w-[320px]">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
            <button 
                onClick={togglePause} 
                disabled={gameOver} 
                className="flex items-center gap-2 bg-gray-700/80 hover:bg-gray-600 text-white px-5 py-2.5 rounded-full font-bold transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border border-white/10"
            >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            {isPaused ? t.gaming.play_now : t.gaming.snake_paused}
            </button>

            <button 
                onClick={toggleMute}
                className="p-2.5 bg-gray-700/80 hover:bg-gray-600 rounded-full transition active:scale-95 border border-white/10"
                title={isMuted ? t.common.unmute : t.common.mute}
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button 
                onClick={resetGame} 
                className="flex items-center gap-2 bg-fb-blue px-5 py-2.5 rounded-full font-bold hover:bg-blue-600 transition shadow-lg active:scale-95 border border-white/10"
            >
            <RefreshCw className="w-5 h-5" /> {gameOver ? t.gaming.play_again : t.common.reset}
            </button>
        </div>

        {/* Mobile D-Pad (Touch Controls) */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-gray-800/50 rounded-2xl border border-white/5 md:hidden">
            <div className="col-start-2">
                <button 
                    className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center active:bg-fb-blue transition shadow-lg"
                    onTouchStart={(e) => { e.preventDefault(); changeDirection(0, -1); }}
                    onClick={() => changeDirection(0, -1)}
                >
                    <ChevronUp className="w-8 h-8" />
                </button>
            </div>
            <div className="col-start-1 row-start-2">
                <button 
                    className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center active:bg-fb-blue transition shadow-lg"
                    onTouchStart={(e) => { e.preventDefault(); changeDirection(-1, 0); }}
                    onClick={() => changeDirection(-1, 0)}
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            </div>
            <div className="col-start-2 row-start-2">
                <button 
                    className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center active:bg-fb-blue transition shadow-lg"
                    onTouchStart={(e) => { e.preventDefault(); changeDirection(0, 1); }}
                    onClick={() => changeDirection(0, 1)}
                >
                    <ChevronDown className="w-8 h-8" />
                </button>
            </div>
            <div className="col-start-3 row-start-2">
                <button 
                    className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center active:bg-fb-blue transition shadow-lg"
                    onTouchStart={(e) => { e.preventDefault(); changeDirection(1, 0); }}
                    onClick={() => changeDirection(1, 0)}
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>
        </div>

        <p className="text-xs text-gray-500 mt-4 hidden md:block opacity-60 font-mono">
            {t.gaming.snake_controls}
        </p>
      </div>
    </div>
  );
};

export default SnakeGame;