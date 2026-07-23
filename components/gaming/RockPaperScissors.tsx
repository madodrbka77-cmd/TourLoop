import React, { useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { playAudio } from '../../utils/audio';

interface GameProps {
  onBack?: () => void;
}

const RockPaperScissors: React.FC<GameProps> = ({ onBack }) => {
  const { t, dir } = useLanguage();
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [computerChoice, setComputerChoice] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState({ player: 0, computer: 0 });

  const choices = [
    { id: 'rock', label: t.gaming.rock, icon: '✊' },
    { id: 'paper', label: t.gaming.paper, icon: '✋' },
    { id: 'scissors', label: t.gaming.scissors, icon: '✌️' }
  ];

  const playGame = (choice: string) => {
    playAudio('pop');
    const computer = choices[Math.floor(Math.random() * choices.length)].id;
    setPlayerChoice(choice);
    setComputerChoice(computer);
    determineWinner(choice, computer);
  };

  const determineWinner = (player: string, computer: string) => {
    if (player === computer) {
      setResult(t.gaming.draw);
      playAudio('pop'); // Neutral sound for draw
    } else if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      setResult(t.gaming.you_won + ' 🎉');
      setScore(s => ({ ...s, player: s.player + 1 }));
      playAudio('post_success');
    } else {
      setResult(t.gaming.computer_won + ' 🤖');
      setScore(s => ({ ...s, computer: s.computer + 1 }));
      playAudio('notification'); // Failure/Lose sound
    }
  };

  const resetGame = () => {
    playAudio('pop');
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  const handleBack = () => {
    if (onBack) {
      playAudio('pop');
      onBack();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full relative bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 p-4" dir={dir}>
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
      
      <h3 className="text-2xl md:text-3xl font-bold mb-8 text-fb-blue drop-shadow-sm">{t.gaming.rps_title}</h3>
      
      <div className="flex justify-between w-full max-w-md px-4 md:px-10 mb-8 md:mb-10 gap-4">
        <div className="text-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex-1 transition-colors">
          <span className="block text-3xl md:text-4xl font-bold text-fb-blue mb-1">{score.player}</span>
          <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{t.gaming.your_choice}</span>
        </div>
        <div className="text-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex-1 transition-colors">
          <span className="block text-3xl md:text-4xl font-bold text-red-500 mb-1">{score.computer}</span>
          <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{t.gaming.computer_choice}</span>
        </div>
      </div>

      {playerChoice && computerChoice ? (
        <div className="text-center animate-fadeIn w-full max-w-lg">
          <div className="flex justify-center items-center gap-4 md:gap-10 mb-8">
            <div className="text-center flex-1">
              <div className="text-5xl md:text-6xl mb-3 animate-bounce-in">{choices.find(c => c.id === playerChoice)?.icon}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">{t.gaming.your_choice}</p>
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-300 dark:text-gray-600">VS</div>
            <div className="text-center flex-1">
              <div className="text-5xl md:text-6xl mb-3 animate-bounce-in" style={{ animationDelay: '0.2s' }}>{choices.find(c => c.id === computerChoice)?.icon}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">{t.gaming.computer_choice}</p>
            </div>
          </div>
          <h2 className={`text-2xl md:text-3xl font-bold mb-8 drop-shadow-md transition-colors ${
              result?.includes(t.gaming.you_won) ? 'text-green-600 dark:text-green-400' : 
              result?.includes(t.gaming.computer_won) ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
          }`}>
            {result}
          </h2>
          <button 
            onClick={resetGame} 
            className="bg-fb-blue px-8 py-3 rounded-full font-bold text-white hover:bg-blue-700 transition shadow-lg flex items-center gap-2 mx-auto active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            {t.gaming.play_again}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {choices.map(choice => (
            <button 
              key={choice.id} 
              onClick={() => playGame(choice.id)}
              className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 transition-all duration-300 shadow-md hover:shadow-xl border-2 border-gray-100 dark:border-gray-700 hover:border-fb-blue dark:hover:border-fb-blue group"
            >
              <span className="text-4xl md:text-5xl mb-2 transition-transform group-hover:scale-110">{choice.icon}</span>
              <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-fb-blue">{choice.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RockPaperScissors;