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
          /* MODO OSCURO: MEDIA LUNA DE PERFIL (DE LADO) CON NARIZ, BOCA      */
          /* DE LADO Y OJO DE PERFIL QUE SE CIERRA                            */
          /* ================================================================ */
          <svg
            viewBox="0 0 140 140"
            className="w-36 h-36 animate-[moonTilt_1.1s_ease-in-out_forwards]"
          >
            {/* Silueta de media luna de lado con nariz y barbilla en el perfil interior */}
            <path
              d="M 102 16
                 C 50 14, 20 42, 20 72
                 C 20 102, 50 126, 102 124
                 C 82 118, 68 108, 67 96
                 C 66 90, 66 84, 66 79
                 C 75 79, 84 76, 84 70
                 C 84 64, 72 58, 64 52
                 C 64 36, 80 22, 102 16 Z"
              fill="#FACC15"
            />

            {/* Línea sutil de definición de la nariz de lado */}
            <path
              d="M 64 52 C 72 58, 84 64, 84 70 C 84 76, 75 79, 63 79"
              fill="none"
              stroke="#1E293B"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Ojo de perfil (de lado) mirando hacia la derecha, que se cierra */}
            <g
              style={{ transformOrigin: '53px 56px' }}
              className="animate-[eyeCloseOpen_0.9s_ease-in-out_forwards]"
            >
              {/* Contorno del ojo visto de lado */}
              <path
                d="M 59 52 Q 51 51 46 56 Q 51 60 59 59"
                fill="none"
                stroke="#1E293B"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              {/* Pupila mirando hacia el frente del perfil (derecha) */}
              <circle cx="55.5" cy="55.5" r="3" fill="#1E293B" />
            </g>

            {/* Párpado cerrado de lado (con pestaña hacia el perfil) al cerrar el ojo */}
            <path
              d="M 46 56 Q 53 62 61 56"
              fill="none"
              stroke="#1E293B"
              strokeWidth="3"
              strokeLinecap="round"
              className="animate-[eyelidShow_0.9s_ease-in-out_forwards]"
            />

            {/* Boca de lado: nace en el borde del perfil bajo la nariz y sonríe de lado */}
            <path
              d="M 66.5 87 Q 55 88 49 82"
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
