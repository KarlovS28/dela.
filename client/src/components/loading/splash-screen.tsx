import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { AnimatedLogo } from "@/components/ui/animated-logo";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { theme } = useTheme();

  useEffect(() => {
    // Завершаем через 6 секунд
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => {
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center splash-screen ${
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

      {/* Анимированный логотип */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        <AnimatedLogo 
          size={120} 
          className="animate-fade-in animated-logo" 
          autoStart={true}
        />

        {/* Подзаголовок */}
        <div className="text-center space-y-4">
          <p className={`text-lg ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          } animate-fade-in-up opacity-0`}
            style={{ animationDelay: '2.5s', animationFillMode: 'forwards' }}
          >
            Система управления сотрудниками
          </p>
          <div className={`flex justify-center space-x-1 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '3s' }}></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '3.2s' }}></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '3.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}