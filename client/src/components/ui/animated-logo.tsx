import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
  autoStart?: boolean;
  onComplete?: () => void;
}

export function AnimatedLogo({ 
  size = 80, 
  className = "", 
  autoStart = true,
  onComplete 
}: AnimatedLogoProps) {
  const { theme } = useTheme();
  const [currentLetter, setCurrentLetter] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  const letters = ['d', 'e', 'l', 'a', '.'];

  useEffect(() => {
    if (!autoStart) return;

    const startAnimation = () => {
      setIsAnimating(true);
      setCurrentLetter(0);
    };

    const timer = setTimeout(startAnimation, 500);
    return () => clearTimeout(timer);
  }, [autoStart]);

  useEffect(() => {
    if (!isAnimating || currentLetter === -1) return;

    if (currentLetter < letters.length - 1) {
      const timer = setTimeout(() => {
        setCurrentLetter(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      // Анимация завершена
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 800);
      return () => clearTimeout(completeTimer);
    }
  }, [currentLetter, isAnimating, letters.length, onComplete]);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Основной логотип-круг */}
      <div className="relative mr-4">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="animate-pulse"
        >
          <defs>
            <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: "#3B82F6", stopOpacity: 1}} />
              <stop offset="50%" style={{stopColor: "#8B5CF6", stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: "#06B6D4", stopOpacity: 1}} />
            </linearGradient>
            <filter id="animatedGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#3B82F6" floodOpacity="0.4"/>
            </filter>
          </defs>
          
          <circle cx="60" cy="60" r="50" fill="url(#animatedGradient)" filter="url(#animatedGlow)"/>
          <circle cx="60" cy="60" r="35" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
          <path 
            d="M42 45 L42 75 L54 75 Q66 75 66 63 L66 57 Q66 45 54 45 Z M50 53 L54 53 Q58 53 58 57 L58 63 Q58 67 54 67 L50 67 Z" 
            fill="white" 
            opacity="0.95"
          />
          <circle cx="70" cy="70" r="2.5" fill="white" opacity="0.95"/>
        </svg>
      </div>

      {/* Анимированный текст */}
      <div className="flex items-center gap-0.5">
        {letters.map((letter, index) => (
          <div key={index} className="relative inline-block perspective-1000">
            {/* Страница, которая перелистывается */}
            <div
              className={`
                absolute inset-0 
                ${index <= currentLetter ? 'animate-page-flip' : 'opacity-0'}
                ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}
                rounded-sm shadow-lg transform-gpu
              `}
              style={{
                width: letter === '.' ? '6px' : '30px',
                height: '48px',
                animationDelay: `${index * 0.4}s`,
                transformOrigin: 'left center',
                backfaceVisibility: 'hidden'
              }}
            />
            
            {/* Буква */}
            <span
              className={`
                relative z-10 inline-block text-5xl font-bold tracking-tight
                ${theme === 'dark' ? 'text-white' : 'text-slate-800'}
                ${index <= currentLetter ? 'animate-letter-reveal' : 'opacity-0'}
                ${letter === '.' ? 'text-blue-500' : ''}
              `}
              style={{
                animationDelay: `${index * 0.4 + 0.2}s`,
                animationFillMode: 'forwards',
                width: letter === '.' ? '6px' : '30px',
                textAlign: 'center'
              }}
            >
              {letter}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}