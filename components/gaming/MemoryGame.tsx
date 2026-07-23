import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { playAudio } from '../../utils/audio';

interface GameProps {
  onBack?: () => void;
}

const MemoryGame: React.FC<GameProps> = ({ onBack }) => {
  const { t, dir } = useLanguage();
  const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
  const [cards, setCards] = useState<{id: number, emoji: string, isFlipped: boolean, isMatched: boolean}[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    resetGame(false);
  }, []);

  const resetGame = (playSound = true) => {
    if (playSound) playAudio('pop');
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
  };

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

    playAudio('pop');
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstIndex, secondIndex] = newFlipped;
      if (cards[firstIndex].emoji === cards[secondIndex].emoji) {
        playAudio('post_success');
        setMatchedPairs(p => p + 1);
        setCards(prev => prev.map((c, i) => 
          i === firstIndex || i === secondIndex ? { ...c, isMatched: true } : c
        ));
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => 
            i === firstIndex || i === secondIndex ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full relative bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 p-4" dir={dir}>
      {onBack && (
        <div className={`absolute top-4 ${dir === 'rtl' ? 'right-4' : 'left-4'} z-50`}>
          <button 
            onClick={() => {
                playAudio('pop');
                onBack();
            }}
            className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white backdrop-blur-md px-4 py-2 rounded-full font-bold flex items-center gap-2 transition border border-gray-200 dark:border-gray-700 shadow-lg text-sm active:scale-95"
          >
              <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> 
              {t.common.back}
          </button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-md mb-8 mt-12 sm:mt-0 px-2 gap-4">
        <div className="flex items-center gap-4">
            <span className="font-bold text-lg sm:text-xl bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transition-colors">
                {t.gaming.moves}: {moves}
            </span>
        </div>
        
        {matchedPairs === emojis.length && (
            <span className="text-green-600 dark:text-green-400 font-bold text-lg sm:text-xl animate-bounce drop-shadow-sm">
                {t.gaming.congrats} 🎉
            </span>
        )}
        
        <button 
            onClick={() => resetGame(true)} 
            className="flex items-center gap-2 bg-fb-blue text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-lg active:scale-95 text-sm sm:text-base border border-transparent dark:border-white/10"
        >
            <RefreshCw className="w-4 h-4" />
            {t.gaming.play_again}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 md:gap-4 bg-gray-200 dark:bg-gray-800/50 p-4 rounded-2xl shadow-xl border border-gray-300 dark:border-gray-700/50 backdrop-blur-sm">
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center text-3xl sm:text-4xl rounded-xl cursor-pointer transition-all duration-500 transform perspective-1000 shadow-md
              ${card.isFlipped || card.isMatched 
                ? 'bg-white dark:bg-gray-700 rotate-y-180 border-2 border-fb-blue shadow-inner' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-800 hover:brightness-110 border-2 border-transparent'}
            `}
          >
            <span className={`select-none transition-opacity duration-300 ${(card.isFlipped || card.isMatched) ? 'opacity-100' : 'opacity-0'}`}>
               {card.emoji}
            </span>
            {!(card.isFlipped || card.isMatched) && (
               <span className="absolute inset-0 flex items-center justify-center text-white/50 dark:text-white/30 font-bold text-2xl select-none">?</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryGame;