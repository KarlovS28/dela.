import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { theme } = useTheme();
  const [showLetters, setShowLetters] = useState(false);

  useEffect(() => {
    // Запускаем анимацию букв через 500мс
    const letterTimer = setTimeout(() => {
      setShowLetters(true);
    }, 500);

    // Завершаем через 4 секунды
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(letterTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      {/* Падающие капли */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className={`absolute animate-drop-fall opacity-70 ${
              theme === 'dark' 
                ? 'bg-slate-200' 
                : 'bg-orange-300'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              borderRadius: '50%',
              filter: 'blur(2px)',
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 3 + 3}s`,
            }}
          />
        ))}
        
        {/* Медленно падающие большие капли */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`big-drop-${i}`}
            className={`absolute animate-drop-fall opacity-50 ${
              theme === 'dark' 
                ? 'bg-blue-300' 
                : 'bg-amber-400'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 12 + 8}px`,
              height: `${Math.random() * 12 + 8}px`,
              borderRadius: '50%',
              filter: 'blur(3px)',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 4 + 5}s`,
            }}
          />
        ))}

        {/* Мелкие быстрые капли */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={`small-drop-${i}`}
            className={`absolute animate-drop-fall opacity-80 ${
              theme === 'dark' 
                ? 'bg-slate-100' 
                : 'bg-yellow-200'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              borderRadius: '50%',
              filter: 'blur(1px)',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Логотип и анимация текста */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Основной логотип */}
        <div className="animate-fade-in">
          <svg 
            width="120" 
            height="120" 
            viewBox="0 0 120 120" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="animate-pulse"
          >
            <defs>
              <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: "#3B82F6", stopOpacity: 1}} />
                <stop offset="50%" style={{stopColor: "#8B5CF6", stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: "#06B6D4", stopOpacity: 1}} />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#3B82F6" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            <circle cx="60" cy="60" r="50" fill="url(#splashGradient)" filter="url(#glow)"/>
            <circle cx="60" cy="60" r="35" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            <path 
              d="M35 35 L35 85 L50 85 Q65 85 65 70 L65 50 Q65 35 50 35 Z M45 45 L50 45 Q55 45 55 50 L55 70 Q55 75 50 75 L45 75 Z" 
              fill="white" 
              opacity="0.95"
              className="animate-pulse"
            />
            <circle cx="75" cy="75" r="4" fill="white" opacity="0.95" className="animate-ping"/>
          </svg>
        </div>

        {/* Анимированный текст */}
        <div className="flex items-center space-x-1">
          {showLetters && (
            <>
              {/* Буква D */}
              <div className="relative overflow-hidden">
                <span 
                  className={`inline-block text-6xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  } animate-flip-in`}
                  style={{ animationDelay: '0s' }}
                >
                  d
                </span>
              </div>

              {/* Буква E */}
              <div className="relative overflow-hidden">
                <span 
                  className={`inline-block text-6xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  } animate-flip-in`}
                  style={{ animationDelay: '0.3s' }}
                >
                  e
                </span>
              </div>

              {/* Буква L */}
              <div className="relative overflow-hidden">
                <span 
                  className={`inline-block text-6xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  } animate-flip-in`}
                  style={{ animationDelay: '0.6s' }}
                >
                  l
                </span>
              </div>

              {/* Буква A */}
              <div className="relative overflow-hidden">
                <span 
                  className={`inline-block text-6xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  } animate-flip-in`}
                  style={{ animationDelay: '0.9s' }}
                >
                  a
                </span>
              </div>

              {/* Точка */}
              <div className="relative overflow-hidden">
                <span 
                  className={`inline-block text-6xl font-bold text-blue-500 animate-flip-in`}
                  style={{ animationDelay: '1.2s' }}
                >
                  .
                </span>
              </div>
            </>
          )}
        </div>

        {/* Подзаголовок */}
        {showLetters && (
          <p className={`text-lg ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          } animate-fade-in-up opacity-0`}
            style={{ animationDelay: '1.5s', animationFillMode: 'forwards' }}
          >
            Система управления сотрудниками
          </p>
        )}
      </div>
    </div>
  );
}