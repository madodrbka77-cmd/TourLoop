import React, { useState, useEffect } from 'react';
import { ArrowRight, Calculator, Timer, Trophy } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { playAudio } from '../../utils/audio';

interface GameProps {
  onBack?: () => void;
}

const MathQuiz: React.FC<GameProps> = ({ onBack }) => {
  const { t, dir, language } = useLanguage();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setGameOver(true);
      setIsActive(false);
      playAudio('notification');
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const generateQuestion = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    // Adjust difficulty based on operation
    const maxNum = op === '*' ? 12 : 50;
    const a = Math.floor(Math.random() * maxNum) + 1;
    const b = Math.floor(Math.random() * maxNum) + 1;
    
    // Ensure larger number first for subtraction to avoid negatives for simplicity
    const num1 = op === '-' ? Math.max(a, b) : a;
    const num2 = op === '-' ? Math.min(a, b) : b;

    setQuestion(`${num1} ${op} ${num2}`);
    
    if (op === '+') setAnswer(num1 + num2);
    if (op === '-') setAnswer(num1 - num2);
    if (op === '*') setAnswer(num1 * num2);
  };

  const startGame = () => {
    playAudio('upload_start');
    setScore(0);
    setTimeLeft(30);
    setIsActive(true);
    setGameOver(false);
    setUserAnswer('');
    setFeedback(null);
    generateQuestion();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer) return;

    if (parseInt(userAnswer) === answer) {
      playAudio('post_success');
      setScore(s => s + 10);
      setTimeLeft(t => t + 2); // Bonus time
      setFeedback('correct');
      setUserAnswer('');
      generateQuestion();
    } else {
      playAudio('notification');
      setTimeLeft(t => Math.max(0, t - 5)); // Penalty
      setFeedback('wrong');
      setUserAnswer('');
      // Reset feedback animation
      setTimeout(() => setFeedback(null), 500);
    }
  };

  const handleBack = () => {
    if (onBack) {
      playAudio('pop');
      onBack();
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center h-full text-white bg-gray-900 w-full relative p-4 overflow-hidden"
      dir={dir}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-9xl animate-pulse">+</div>
        <div className="absolute bottom-10 right-10 text-9xl animate-pulse delay-700">×</div>
        <div className="absolute top-1/2 left-1/4 text-8xl animate-bounce delay-300">-</div>
      </div>

      {onBack && (
        <div className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-50`}>
          <button 
            onClick={handleBack}
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-4 py-2 rounded-full font-bold flex items-center gap-2 transition border border-white/20 shadow-lg text-sm active:scale-95"
          >
              <ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> 
              {t.common.back}
          </button>
        </div>
      )}

      {!isActive && !gameOver ? (
        <div className="text-center relative z-10 animate-fadeIn max-w-md mx-auto">
          <div className="w-24 h-24 bg-fb-blue rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-6 transition duration-500">
            <Calculator className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-fb-blue drop-shadow-md">{t.gaming.math_challenge}</h3>
          <p className="text-gray-300 mb-8 text-lg px-4 leading-relaxed">{t.gaming.math_desc}</p>
          <button 
            onClick={startGame} 
            className="bg-green-600 hover:bg-green-500 text-white px-10 py-3.5 rounded-2xl font-bold text-lg md:text-xl transition-all shadow-xl transform hover:scale-105 active:scale-95 border border-white/10"
          >
            {t.gaming.play_now}
          </button>
        </div>
      ) : gameOver ? (
        <div className="text-center relative z-10 animate-bounce-in max-w-md mx-auto">
          <div className="w-24 h-24 bg-red-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
            <Timer className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-2 text-red-500">{t.gaming.game_over}</h3>
          <p className="text-xl md:text-2xl text-white mb-8 flex items-center justify-center gap-2">
            {t.gaming.score}: <span className="font-bold text-yellow-400 text-3xl">{score}</span>
          </p>
          <button 
            onClick={startGame} 
            className="bg-fb-blue hover:bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-lg transition shadow-lg active:scale-95 border border-white/10"
          >
            {t.gaming.play_again}
          </button>
        </div>
      ) : (
        <div className="text-center w-full max-w-sm relative z-10 animate-slideUp">
          <div className="flex justify-between items-center mb-8 gap-4">
            <div className={`flex items-center gap-2 bg-gray-800/80 backdrop-blur px-5 py-3 rounded-2xl border border-gray-700 shadow-lg transition-colors ${timeLeft < 10 ? 'text-red-500 border-red-500/50' : 'text-yellow-400'}`}>
                <Timer className="w-5 h-5" />
                <span className="text-xl font-bold font-mono">{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur px-5 py-3 rounded-2xl border border-gray-700 shadow-lg text-green-400">
                <Trophy className="w-5 h-5" />
                <span className="text-xl font-bold font-mono">{score}</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-5xl md:text-6xl font-black py-12 rounded-3xl mb-6 shadow-2xl border-4 border-gray-100 dark:border-gray-700 tracking-wider font-mono relative overflow-hidden">
             <span className="relative z-10">{question}</span>
             {/* Feedback Overlay */}
             {feedback && (
                 <div className={`absolute inset-0 flex items-center justify-center z-20 transition-all duration-300 ${feedback === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {feedback === 'correct' ? (
                        <span className="text-green-500 text-6xl animate-scaleIn">✓</span>
                    ) : (
                        <span className="text-red-500 text-6xl animate-shake">✗</span>
                    )}
                 </div>
             )}
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <input 
              type="number" 
              autoFocus
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full bg-gray-800/80 backdrop-blur-sm border-2 border-gray-600 rounded-2xl py-4 px-6 text-3xl text-center text-white outline-none focus:border-fb-blue focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner font-mono"
              placeholder="?"
            />
            <button 
                type="submit" 
                className={`absolute ${dir === 'rtl' ? 'left-2' : 'right-2'} top-2 bottom-2 bg-fb-blue hover:bg-blue-600 text-white px-4 rounded-xl font-bold transition active:scale-95 flex items-center justify-center`}
            >
                <ArrowRight className={`w-6 h-6 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            </button>
          </form>
          <p className="text-gray-500 mt-6 text-sm font-medium opacity-70 animate-pulse">
             {language === 'ar' ? 'اضغط Enter للإجابة' : 'Press Enter to submit'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MathQuiz;