interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: "#3B82F6", stopOpacity: 1}} />
          <stop offset="50%" style={{stopColor: "#8B5CF6", stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: "#06B6D4", stopOpacity: 1}} />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.1)"/>
        </filter>
      </defs>
      
      {/* Основной круг */}
      <circle cx="60" cy="60" r="50" fill="url(#logoGradient)" filter="url(#shadow)"/>
      
      {/* Внутренний круг */}
      <circle cx="60" cy="60" r="35" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      
      {/* Буква "d" */}
      <path 
        d="M35 35 L35 85 L50 85 Q65 85 65 70 L65 50 Q65 35 50 35 Z M45 45 L50 45 Q55 45 55 50 L55 70 Q55 75 50 75 L45 75 Z" 
        fill="white" 
        opacity="0.95"
      />
      
      {/* Точка после "d" */}
      <circle cx="75" cy="75" r="4" fill="white" opacity="0.95"/>
      
      {/* Декоративные элементы */}
      <circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.3)"/>
      <circle cx="95" cy="25" r="1.5" fill="rgba(255,255,255,0.4)"/>
      <circle cx="25" cy="95" r="1.5" fill="rgba(255,255,255,0.4)"/>
      <circle cx="90" cy="90" r="2" fill="rgba(255,255,255,0.3)"/>
    </svg>
  );
}

export function LogoIcon({ size = 24, className = "" }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: "#3B82F6", stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: "#8B5CF6", stopOpacity: 1}} />
        </linearGradient>
      </defs>
      
      <circle cx="16" cy="16" r="14" fill="url(#iconGradient)"/>
      <path 
        d="M9 9 L9 23 L14 23 Q18 23 18 19 L18 13 Q18 9 14 9 Z M12 12 L14 12 Q15 12 15 13 L15 19 Q15 20 14 20 L12 20 Z" 
        fill="white"
      />
      <circle cx="20" cy="20" r="1.5" fill="white"/>
    </svg>
  );
}