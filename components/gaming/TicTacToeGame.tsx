import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { playAudio } from '../../utils/audio';

interface GameProps {
  onBack?: () => void;
}

const TicTacToeGame: React.FC<GameProps> = ({ onBack }) => {
  const { t, dir, language } = useLanguage();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const calculateWinner = (squares: any[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  // Sound Effects for Game States
  useEffect(() => {
    if (winner) {
      playAudio('post_success');
    } else if (isDraw) {
      playAudio('pop');
    }
  }, [winner, isDraw]);

  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    
    playAudio('pop');
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    playAudio('pop');
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  const handleBack = () => {
    playAudio('pop');
    if (onBack) onBack();
  };

  // Helper to render responsive status text
  const getStatusText = () => {
    if (winner) return `${t.gaming.congrats} ${winner} 🎉`;
    if (isDraw) return `${t.gaming.draw} 🤝`;
    return `${language === 'ar' ? 'الدور على' : 'Next Turn'}: ${xIsNext ? 'X' : 'O'}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full relative bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-4" dir={dir}>
      {onBack && (
        <div className={`absolute top-4 ${dir === 'rtl' ? 'right-4' : 'left-4'} z-50`}>
          <button 
            onClick={handleBack}
            className="bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-gray-800 dark:text-white backdrop-blur-md px-4 py-2 rounded-full font-bold flex items-center gap-2 transition border border-gray-200 dark:border-white/20 shadow-lg text-sm active:scale-95"
          >
              <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> 
              {t.common.back}
          </button>
        </div>
      )}
      
      <h3 className="text-3xl font-bold mb-8 text-fb-blue drop-shadow-sm animate-fadeIn text-center">
        {getStatusText()}
      </h3>
      
      <div className="grid grid-cols-3 gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-colors">
        {board.map((square, i) => (
          <button
            key={i}
            className={`w-20 h-20 sm:w-24 sm:h-24 text-4xl sm:text-5xl font-bold flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm active:scale-95
              ${square === 'X' 
                ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-gray-700 border border-blue-100 dark:border-blue-900/30' 
                : square === 'O' 
                  ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-gray-700 border border-red-100 dark:border-red-900/30' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent'}
            `}
            onClick={() => handleClick(i)}
            disabled={!!winner || !!square}
          >
            {square}
          </button>
        ))}
      </div>
      
      <button 
        onClick={resetGame}
        className="mt-10 flex items-center gap-2 bg-fb-blue px-8 py-3 rounded-full font-bold text-white hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:scale-95 border border-white/10"
      >
        <RefreshCw className="w-5 h-5" /> 
        {t.gaming.play_again}
      </button>
    </div>
  );
};

export default TicTacToeGame;