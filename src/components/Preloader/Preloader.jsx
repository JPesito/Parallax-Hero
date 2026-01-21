import { useState, useEffect, useRef } from 'react';

// Inyectar estilos de animación en el head
const injectStyles = () => {
  if (document.getElementById('preloader-styles')) return;

  const style = document.createElement('style');
  style.id = 'preloader-styles';
  style.textContent = `
    @keyframes slideUp {
      0% {
        transform: translateY(0);
      }
      100% {
        transform: translateY(-100%);
      }
    }

    .preloader-sliding {
      animation: slideUp 1s cubic-bezier(0.76, 0, 0.24, 1) forwards !important;
    }
  `;
  document.head.appendChild(style);
};

const Preloader = ({ assets = [], onComplete, minDisplayTime = 2000 }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'waiting' | 'sliding' | 'done'
  const containerRef = useRef(null);

  // Inyectar estilos al montar
  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    const startTime = Date.now();

    if (assets.length === 0) {
      setTimeout(() => {
        setProgress(100);
        setPhase('waiting');
      }, minDisplayTime);
      return;
    }

    let loadedCount = 0;
    const totalAssets = assets.length;

    const updateProgress = () => {
      loadedCount++;
      const newProgress = Math.round((loadedCount / totalAssets) * 100);
      setProgress(newProgress);

      if (loadedCount === totalAssets) {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);

        setTimeout(() => {
          setPhase('waiting');
        }, remainingTime);
      }
    };

    assets.forEach((asset) => {
      if (typeof asset === 'string') {
        if (asset.match(/\.(mp3|wav|ogg|m4a)$/i)) {
          const audio = new Audio();
          audio.oncanplaythrough = updateProgress;
          audio.onerror = updateProgress;
          audio.src = asset;
        } else {
          const img = new Image();
          img.onload = updateProgress;
          img.onerror = updateProgress;
          img.src = asset;
        }
      } else if (asset && typeof asset === 'object') {
        setTimeout(updateProgress, 50 + Math.random() * 150);
      }
    });
  }, [assets, minDisplayTime]);

  // Cuando llegamos a 'waiting', iniciamos el slide
  useEffect(() => {
    if (phase === 'waiting') {
      // Pequeña pausa para que se vea el 100%
      const timer = setTimeout(() => {
        onComplete?.();
        setPhase('sliding');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // Cuando termina la animación de sliding
  useEffect(() => {
    if (phase === 'sliding') {
      const timer = setTimeout(() => {
        setPhase('done');
      }, 1100); // Un poco más que la duración de la animación
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (phase === 'done') return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };

  const percentageStyle = {
    fontSize: 'clamp(3rem, 10vw, 6rem)',
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: '-0.02em',
  };

  const barContainerStyle = {
    width: 'clamp(200px, 50vw, 400px)',
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    marginTop: '2rem',
    overflow: 'hidden',
  };

  const barFillStyle = {
    width: `${progress}%`,
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '2px',
    transition: 'width 0.3s ease-out',
  };

  return (
    <div
      ref={containerRef}
      style={overlayStyle}
      className={phase === 'sliding' ? 'preloader-sliding' : ''}
    >
      <div style={percentageStyle}>{progress}%</div>
      <div style={barContainerStyle}>
        <div style={barFillStyle} />
      </div>
    </div>
  );
};

export default Preloader;
