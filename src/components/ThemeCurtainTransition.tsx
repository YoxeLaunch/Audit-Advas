import React from 'react';

interface ThemeCurtainTransitionProps {
  phase: 'IDLE' | 'CLOSING' | 'HOLD' | 'OPENING';
  targetTheme: 'light' | 'dark';
}

export const ThemeCurtainTransition: React.FC<ThemeCurtainTransitionProps> = ({
  phase,
  targetTheme
}) => {
  if (phase === 'IDLE') return null;

  const isClosed = phase === 'CLOSING' || phase === 'HOLD';
  const isDarkTarget = targetTheme === 'dark';

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-auto overflow-hidden flex items-center justify-center"
      aria-hidden="true"
    >
      {/* Cortina Izquierda */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1/2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDarkTarget ? 'bg-slate-950' : 'bg-sky-50'
        }`}
        style={{
          transform: isClosed ? 'translateX(0%)' : 'translateX(-102%)'
        }}
      />

      {/* Cortina Derecha */}
      <div
        className={`absolute top-0 bottom-0 right-0 w-1/2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDarkTarget ? 'bg-slate-950' : 'bg-sky-50'
        }`}
        style={{
          transform: isClosed ? 'translateX(0%)' : 'translateX(102%)'
        }}
      />

      {/* Figura Central Minimalista */}
      <div
        className={`relative z-10 flex items-center justify-center transition-all duration-300 ${
          isClosed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        {isDarkTarget ? (
          /* ================================================================ */
          /* MODO OSCURO: MEDIA LUNA SIMPLE DE LADO QUE CIERRA LOS OJOS       */
          /* ================================================================ */
          <svg
            viewBox="0 0 140 140"
            className="w-36 h-36 animate-[moonTilt_1.1s_ease-in-out_forwards]"
          >
            {/* Media luna simple y limpia de lado */}
            <path
              d="M 88 18 C 50 18, 22 46, 22 80 C 22 114, 50 132, 88 132 C 102 132, 114 127, 122 118 C 92 120, 68 100, 68 75 C 68 50, 92 30, 122 32 C 112 22, 100 18, 88 18 Z"
              fill="#FACC15"
            />

            {/* Ojo abierto que se cierra suavemente */}
            <g
              style={{ transformOrigin: '48px 68px' }}
              className="animate-[eyeCloseOpen_0.9s_ease-in-out_forwards]"
            >
              <circle cx="48" cy="68" r="4.5" fill="#1E293B" />
            </g>

            {/* Párpado cerrado simple que aparece al cerrar el ojo */}
            <path
              d="M 41 68 Q 48 75 55 68"
              fill="none"
              stroke="#1E293B"
              strokeWidth="3.2"
              strokeLinecap="round"
              className="animate-[eyelidShow_0.9s_ease-in-out_forwards]"
            />

            {/* Sonrisa simple y tranquila */}
            <path
              d="M 43 88 Q 50 94 58 88"
              fill="none"
              stroke="#1E293B"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          /* ================================================================ */
          /* MODO CLARO: SOL SIMPLE QUE SE MUEVE, SONRÍE Y GUIÑA EL OJO       */
          /* ================================================================ */
          <svg
            viewBox="0 0 140 140"
            className="w-36 h-36 animate-[sunMove_1.1s_ease-out_forwards]"
          >
            {/* 8 rayos simples y limpios */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
              <line
                key={angle}
                x1="70"
                y1="10"
                x2="70"
                y2="22"
                stroke="#F59E0B"
                strokeWidth="5"
                strokeLinecap="round"
                transform={`rotate(${angle} 70 70)`}
              />
            ))}

            {/* Círculo solar simple */}
            <circle cx="70" cy="70" r="38" fill="#FBBF24" />

            {/* Ojo izquierdo abierto */}
            <circle cx="56" cy="63" r="4.2" fill="#1E293B" />

            {/* Ojo derecho: empieza abierto y guiña */}
            <g
              style={{ transformOrigin: '84px 63px' }}
              className="animate-[eyeCloseOpen_0.85s_ease-in-out_forwards]"
            >
              <circle cx="84" cy="63" r="4.2" fill="#1E293B" />
            </g>

            {/* Arco del guiño del ojo derecho */}
            <path
              d="M 78 64 Q 84 57 90 64"
              fill="none"
              stroke="#1E293B"
              strokeWidth="3.4"
              strokeLinecap="round"
              className="animate-[eyelidShow_0.85s_ease-in-out_forwards]"
            />

            {/* Sonrisa simple que se dibuja y anima */}
            <path
              d="M 54 78 Q 70 92 86 78"
              fill="none"
              stroke="#1E293B"
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ transformOrigin: '70px 82px' }}
              className="animate-[sunSmile_0.9s_ease-out_forwards]"
            />
          </svg>
        )}
      </div>
    </div>
  );
};
