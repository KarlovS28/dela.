export function AnimatedBackground() {
  return (
    <div 
      id="bg-wrap" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.6,
        pointerEvents: 'none',
        overflow: 'hidden',
        animation: 'backgroundPulse 12s ease-in-out infinite alternate'
      }}
      className="dark:opacity-80 dark:brightness-150 dark:saturate-[1.8] dark:contrast-120 
                 light:opacity-40 light:brightness-110 light:saturate-120 light:contrast-90"
    >
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%'
        }}
      >
        <defs>
          <radialGradient id="Gradient1" cx="50%" cy="50%" fx="0.441602%" fy="50%" r=".7">
            <animate attributeName="fx" dur="34s" values="0%;5%;0%" repeatCount="indefinite"></animate>
            <animate attributeName="fy" dur="28s" values="25%;75%;25%" repeatCount="indefinite"></animate>
            <stop offset="0%" stopColor="rgba(147, 51, 234, 1)"></stop>
            <stop offset="70%" stopColor="rgba(147, 51, 234, 0.3)"></stop>
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0)"></stop>
          </radialGradient>
          <radialGradient id="Gradient2" cx="50%" cy="50%" fx="2.68147%" fy="50%" r=".7">
            <animate attributeName="fx" dur="23.5s" values="0%;8%;0%" repeatCount="indefinite"></animate>
            <animate attributeName="fy" dur="32s" values="75%;25%;75%" repeatCount="indefinite"></animate>
            <stop offset="0%" stopColor="rgba(59, 130, 246, 1)"></stop>
            <stop offset="70%" stopColor="rgba(59, 130, 246, 0.3)"></stop>
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)"></stop>
          </radialGradient>
          <radialGradient id="Gradient3" cx="50%" cy="50%" fx="0.836536%" fy="50%" r=".7">
            <animate attributeName="fx" dur="21.5s" values="0%;6%;0%" repeatCount="indefinite"></animate>
            <animate attributeName="fy" dur="26s" values="50%;0%;50%" repeatCount="indefinite"></animate>
            <stop offset="0%" stopColor="rgba(34, 197, 94, 1)"></stop>
            <stop offset="70%" stopColor="rgba(34, 197, 94, 0.3)"></stop>
            <stop offset="100%" stopColor="rgba(34, 197, 94, 0)"></stop>
          </radialGradient>
          <radialGradient id="Gradient4" cx="50%" cy="50%" fx="4.56417%" fy="50%" r=".6">
            <animate attributeName="fx" dur="23s" values="0%;7%;0%" repeatCount="indefinite"></animate>
            <animate attributeName="fy" dur="30s" values="0%;100%;0%" repeatCount="indefinite"></animate>
            <stop offset="0%" stopColor="rgba(251, 146, 60, 1)"></stop>
            <stop offset="70%" stopColor="rgba(251, 146, 60, 0.3)"></stop>
            <stop offset="100%" stopColor="rgba(251, 146, 60, 0)"></stop>
          </radialGradient>
          <radialGradient id="Gradient5" cx="50%" cy="50%" fx="2.65405%" fy="50%" r=".6">
            <animate attributeName="fx" dur="24.5s" values="0%;9%;0%" repeatCount="indefinite"></animate>
            <animate attributeName="fy" dur="22s" values="100%;50%;100%" repeatCount="indefinite"></animate>
            <stop offset="0%" stopColor="rgba(236, 72, 153, 1)"></stop>
            <stop offset="70%" stopColor="rgba(236, 72, 153, 0.3)"></stop>
            <stop offset="100%" stopColor="rgba(236, 72, 153, 0)"></stop>
          </radialGradient>
          <radialGradient id="Gradient6" cx="50%" cy="50%" fx="0.981338%" fy="50%" r=".6">
            <animate attributeName="fx" dur="25.5s" values="0%;4%;0%" repeatCount="indefinite"></animate>
            <animate attributeName="fy" dur="35s" values="25%;100%;25%" repeatCount="indefinite"></animate>
            <stop offset="0%" stopColor="rgba(99, 102, 241, 1)"></stop>
            <stop offset="70%" stopColor="rgba(99, 102, 241, 0.3)"></stop>
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)"></stop>
          </radialGradient>
        </defs>
        <rect 
          x="13.744%" 
          y="1.18473%" 
          width="120%" 
          height="120%" 
          fill="url(#Gradient1)" 
          transform="rotate(334.41 50 50)"
        >
          <animate attributeName="x" dur="20s" values="25%;-10%;25%" repeatCount="indefinite"></animate>
          <animate attributeName="y" dur="21s" values="0%;30%;0%" repeatCount="indefinite"></animate>
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 50 50" 
            to="360 50 50" 
            dur="45s" 
            repeatCount="indefinite"
          ></animateTransform>
        </rect>
        <rect 
          x="-2.17916%" 
          y="35.4267%" 
          width="120%" 
          height="120%" 
          fill="url(#Gradient2)" 
          transform="rotate(255.072 50 50)"
        >
          <animate attributeName="x" dur="23s" values="-25%;10%;-25%" repeatCount="indefinite"></animate>
          <animate attributeName="y" dur="24s" values="0%;50%;0%" repeatCount="indefinite"></animate>
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 50 50" 
            to="360 50 50" 
            dur="38s" 
            repeatCount="indefinite"
          ></animateTransform>
        </rect>
        <rect 
          x="9.00483%" 
          y="14.5733%" 
          width="120%" 
          height="120%" 
          fill="url(#Gradient3)" 
          transform="rotate(139.903 50 50)"
        >
          <animate attributeName="x" dur="25s" values="0%;30%;0%" repeatCount="indefinite"></animate>
          <animate attributeName="y" dur="12s" values="0%;35%;0%" repeatCount="indefinite"></animate>
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="360 50 50" 
            to="0 50 50" 
            dur="52s" 
            repeatCount="indefinite"
          ></animateTransform>
        </rect>
        <rect 
          x="25%" 
          y="60%" 
          width="120%" 
          height="120%" 
          fill="url(#Gradient4)" 
          transform="rotate(45 50 50)"
        >
          <animate attributeName="x" dur="18s" values="25%;-5%;25%" repeatCount="indefinite"></animate>
          <animate attributeName="y" dur="19s" values="60%;20%;60%" repeatCount="indefinite"></animate>
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="45 50 50" 
            to="405 50 50" 
            dur="60s" 
            repeatCount="indefinite"
          ></animateTransform>
        </rect>
        <rect 
          x="-10%" 
          y="80%" 
          width="120%" 
          height="120%" 
          fill="url(#Gradient5)" 
          transform="rotate(180 50 50)"
        >
          <animate attributeName="x" dur="22s" values="-10%;20%;-10%" repeatCount="indefinite"></animate>
          <animate attributeName="y" dur="27s" values="80%;10%;80%" repeatCount="indefinite"></animate>
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="180 50 50" 
            to="-180 50 50" 
            dur="48s" 
            repeatCount="indefinite"
          ></animateTransform>
        </rect>
        <rect 
          x="70%" 
          y="30%" 
          width="120%" 
          height="120%" 
          fill="url(#Gradient6)" 
          transform="rotate(270 50 50)"
        >
          <animate attributeName="x" dur="26s" values="70%;40%;70%" repeatCount="indefinite"></animate>
          <animate attributeName="y" dur="15s" values="30%;70%;30%" repeatCount="indefinite"></animate>
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="270 50 50" 
            to="630 50 50" 
            dur="42s" 
            repeatCount="indefinite"
          ></animateTransform>
        </rect>
      </svg>
    </div>
  );
}