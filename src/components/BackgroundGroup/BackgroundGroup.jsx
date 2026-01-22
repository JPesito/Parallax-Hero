import { useState, useEffect, useRef, memo } from 'react';
import Lottie from 'lottie-react';

// ========================================
// COMPONENTES ESTABLES (NUNCA se re-renderizan)
// ========================================

// Lottie optimizado: usa canvas en móvil, memo estricto
const StableLottie = memo(({ animationData, loop, isMobile }) => {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={true}
      renderer={isMobile ? 'canvas' : 'svg'}
      rendererSettings={isMobile ? {
        preserveAspectRatio: 'xMidYMid slice',
        progressiveLoad: true,
      } : undefined}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambia el animationData (nunca debería)
  return prevProps.animationData === nextProps.animationData &&
         prevProps.isMobile === nextProps.isMobile;
});

// Imagen estable
const StableImage = memo(({ src }) => {
  return (
    <img
      src={src}
      alt=""
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
      }}
    />
  );
}, (prevProps, nextProps) => prevProps.src === nextProps.src);

// ========================================
// CONSTANTES
// ========================================
const ZOOM_FACTOR_DESKTOP = 1.10;
const ZOOM_FACTOR_MOBILE = 1.8;
const MOBILE_BREAKPOINT = 768;

// ========================================
// AUDIO MANAGER
// ========================================
const AudioManager = {
  audio: null,
  activeSpeakers: new Set(),
  fadeInterval: null,
  stopTimeout: null,
  targetVolume: 0.5,
  isPageVisible: true,
  isUnlocked: false,
  pendingPlay: false,

  init(soundSrc, volume = 0.5) {
    if (!this.audio) {
      this.audio = new Audio(soundSrc);
      this.audio.loop = true;
      this.audio.preload = 'auto';
      this.audio.volume = 0;
      this.targetVolume = volume;

      document.addEventListener('visibilitychange', () => {
        this.isPageVisible = !document.hidden;
        if (document.hidden) {
          this.pauseImmediately();
        } else if (this.activeSpeakers.size > 0) {
          this.resume();
        }
      });

      const unlockAudio = () => {
        if (!this.isUnlocked) {
          this.isUnlocked = true;
          if (this.pendingPlay && this.activeSpeakers.size > 0) {
            this.audio.play().catch(() => {});
            this.fadeIn();
            this.pendingPlay = false;
          }
        }
      };

      document.addEventListener('click', unlockAudio, { once: false });
      document.addEventListener('touchstart', unlockAudio, { once: false });
    }
    this.targetVolume = volume;
  },

  activate(speakerId) {
    if (!this.audio || !this.isPageVisible) return;
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    if (this.stopTimeout) clearTimeout(this.stopTimeout);

    this.activeSpeakers.add(speakerId);

    if (this.isUnlocked) {
      if (this.audio.paused) this.audio.play().catch(() => {});
      this.fadeIn();
    } else {
      this.pendingPlay = true;
    }
  },

  deactivate(speakerId, delay = 5000) {
    this.stopTimeout = setTimeout(() => {
      this.activeSpeakers.delete(speakerId);
      if (this.activeSpeakers.size === 0) this.fadeOut();
    }, delay);
  },

  fadeIn(duration = 600) {
    if (!this.audio) return;
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    const steps = 15;
    const stepTime = duration / steps;
    const currentVol = this.audio.volume;
    const volumeStep = (this.targetVolume - currentVol) / steps;
    let step = 0;

    this.fadeInterval = setInterval(() => {
      step++;
      if (step >= steps) {
        this.audio.volume = this.targetVolume;
        clearInterval(this.fadeInterval);
      } else {
        this.audio.volume = Math.min(this.targetVolume, currentVol + volumeStep * step);
      }
    }, stepTime);
  },

  fadeOut(duration = 1200) {
    if (!this.audio) return;
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    const steps = 20;
    const stepTime = duration / steps;
    const startVol = this.audio.volume;
    const volumeStep = startVol / steps;
    let step = 0;

    this.fadeInterval = setInterval(() => {
      step++;
      if (step >= steps || this.audio.volume <= 0.01) {
        this.audio.volume = 0;
        this.audio.pause();
        this.audio.currentTime = 0;
        clearInterval(this.fadeInterval);
      } else {
        this.audio.volume = Math.max(0, startVol - volumeStep * step);
      }
    }, stepTime);
  },

  pauseImmediately() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    if (this.audio && !this.audio.paused) this.audio.pause();
  },

  resume() {
    if (this.audio && this.activeSpeakers.size > 0 && this.isPageVisible) {
      this.audio.play().catch(() => {});
      this.fadeIn();
    }
  },
};

// ========================================
// INTERACTIVE ELEMENT (estático, sin re-renders por parallax)
// ========================================
const InteractiveElement = memo(({ element, styleVars, isMobile }) => {
  const [isActive, setIsActive] = useState(false);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0, scale: 1 });
  const shakeIntervalRef = useRef(null);
  const localStopTimeoutRef = useRef(null);

  useEffect(() => {
    if (element.soundSrc) {
      AudioManager.init(element.soundSrc, element.volume || 0.5);
    }
  }, [element.soundSrc, element.volume]);

  useEffect(() => {
    if (isActive && element.hoverEffect === 'shake') {
      const intensity = element.shakeIntensity || 3;
      shakeIntervalRef.current = setInterval(() => {
        setShakeOffset({
          x: (Math.random() - 0.5) * intensity,
          y: (Math.random() - 0.5) * (intensity * 0.5),
          scale: 1 + (Math.random() - 0.5) * 0.02,
        });
      }, 60);
    } else {
      if (shakeIntervalRef.current) {
        clearInterval(shakeIntervalRef.current);
        shakeIntervalRef.current = null;
      }
      setShakeOffset({ x: 0, y: 0, scale: 1 });
    }
    return () => {
      if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
    };
  }, [isActive, element.hoverEffect, element.shakeIntensity]);

  const handleMouseEnter = () => {
    if (element.interactive) {
      if (localStopTimeoutRef.current) {
        clearTimeout(localStopTimeoutRef.current);
        localStopTimeoutRef.current = null;
      }
      setIsActive(true);
      if (element.soundSrc) AudioManager.activate(element.id);
    }
  };

  const handleMouseLeave = () => {
    if (element.interactive) {
      const delay = element.stopDelay !== undefined ? element.stopDelay : 5000;
      localStopTimeoutRef.current = setTimeout(() => {
        setIsActive(false);
        if (element.soundSrc) AudioManager.deactivate(element.id, 0);
      }, delay);
    }
  };

  const defaultPadding = element.hitboxPadding || 0;
  const hitboxTop = element.hitboxTop !== undefined ? element.hitboxTop : defaultPadding;
  const hitboxBottom = element.hitboxBottom !== undefined ? element.hitboxBottom : defaultPadding;
  const hitboxLeft = element.hitboxLeft !== undefined ? element.hitboxLeft : defaultPadding;
  const hitboxRight = element.hitboxRight !== undefined ? element.hitboxRight : defaultPadding;

  // Usar CSS calc() con variables para el parallax de profundidad
  const depthTransform = styleVars.depthFactor !== 0
    ? `calc(var(--parallax-x) * ${styleVars.depthOffset}px)`
    : '0px';

  const containerStyle = {
    position: 'absolute',
    left: `${styleVars.leftPercent}%`,
    top: `${styleVars.topPercent}%`,
    width: `${styleVars.widthPercent}%`,
    height: styleVars.heightPercent === 'auto' ? 'auto' : `${styleVars.heightPercent}%`,
    zIndex: styleVars.zIndex,
    opacity: styleVars.opacity,
    transform: `translate3d(${depthTransform}, 0, 0) translate(${shakeOffset.x}px, ${shakeOffset.y}px) scale(${shakeOffset.scale})`,
    pointerEvents: 'none',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
  };

  const hitboxStyle = {
    position: 'absolute',
    top: `${hitboxTop}%`,
    left: `${hitboxLeft}%`,
    right: `${hitboxRight}%`,
    bottom: `${hitboxBottom}%`,
    cursor: element.interactive ? 'pointer' : 'default',
    pointerEvents: element.interactive ? 'auto' : 'none',
  };

  return (
    <div style={containerStyle}>
      {element.lottieData ? (
        <StableLottie
          animationData={element.lottieData}
          loop={element.loop !== false}
          isMobile={isMobile}
        />
      ) : element.imageSrc ? (
        <StableImage src={element.imageSrc} />
      ) : null}

      {element.interactive && (
        <div
          style={hitboxStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian las props esenciales
  return prevProps.element === nextProps.element &&
         prevProps.isMobile === nextProps.isMobile &&
         prevProps.styleVars.leftPercent === nextProps.styleVars.leftPercent &&
         prevProps.styleVars.topPercent === nextProps.styleVars.topPercent;
});

// ========================================
// BACKGROUND GROUP (componente principal)
// ========================================
const BackgroundGroup = ({
  backgroundSrc,
  backgroundWidth,
  backgroundHeight,
  elements = [],
  zIndex = 1,
  invertX = true,
  viewportHeight: vpHeightProp = null,
}) => {
  const [dimensions, setDimensions] = useState({
    maxOffset: 0,
    imageStyle: { height: '100vh', width: 'auto' },
    isMobile: false,
  });

  useEffect(() => {
    if (!backgroundWidth || !backgroundHeight) return;

    const calculateDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = vpHeightProp ? parseInt(vpHeightProp) : window.innerHeight;
      const imageAspectRatio = backgroundWidth / backgroundHeight;
      const isMobile = viewportWidth < MOBILE_BREAKPOINT;

      let finalWidth, finalHeight;

      if (isMobile) {
        finalHeight = viewportHeight;
        finalWidth = viewportHeight * imageAspectRatio;

        const minWidthForDrag = viewportWidth * ZOOM_FACTOR_MOBILE;
        if (finalWidth < minWidthForDrag) {
          const scale = minWidthForDrag / finalWidth;
          finalWidth = minWidthForDrag;
          finalHeight = finalHeight * scale;
        }

        setDimensions({
          maxOffset: Math.max(0, (finalWidth - viewportWidth) / 2 - 2),
          imageStyle: {
            width: `${finalWidth}px`,
            height: `${finalHeight}px`,
            maxWidth: 'none',
            objectFit: 'cover',
          },
          isMobile: true,
        });
      } else {
        const potentialWidth = viewportHeight * imageAspectRatio;

        if (potentialWidth < viewportWidth * ZOOM_FACTOR_DESKTOP) {
          finalWidth = viewportWidth * ZOOM_FACTOR_DESKTOP;
          setDimensions({
            maxOffset: Math.max(0, (finalWidth - viewportWidth) / 2 - 2),
            imageStyle: { width: `${finalWidth}px`, height: 'auto', maxWidth: 'none' },
            isMobile: false,
          });
        } else {
          finalWidth = potentialWidth;
          setDimensions({
            maxOffset: Math.max(0, (finalWidth - viewportWidth) / 2 - 2),
            imageStyle: { height: `${viewportHeight}px`, width: 'auto', maxWidth: 'none' },
            isMobile: false,
          });
        }
      }
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, [backgroundWidth, backgroundHeight, vpHeightProp]);

  const { maxOffset, imageStyle, isMobile } = dimensions;
  const xMult = invertX ? -1 : 1;

  // Usar CSS calc() para el parallax - NO React state
  const containerStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) translate3d(calc(var(--parallax-x) * ${maxOffset * xMult}px), 0, 0)`,
    zIndex,
    willChange: 'transform',
  };

  // Pre-calcular estilos de elementos (solo cuando cambian las dimensiones)
  const getElementStyleVars = (element) => {
    const x = isMobile && element.mobileX !== undefined ? element.mobileX : element.x;
    const y = isMobile && element.mobileY !== undefined ? element.mobileY : element.y;
    const width = isMobile && element.mobileWidth !== undefined ? element.mobileWidth : element.width;

    const leftPercent = (x / backgroundWidth) * 100;
    const topPercent = (y / backgroundHeight) * 100;
    const widthPercent = (width / backgroundWidth) * 100;
    const heightPercent = element.height ? (element.height / backgroundHeight) * 100 : 'auto';

    // Calcular depth offset
    let elementDepth = element.depth !== undefined ? element.depth : 1;
    if (isMobile && element.id !== 'tableleft') {
      elementDepth = 1;
    }
    const depthFactor = 1 - elementDepth;
    const depthOffset = maxOffset * xMult * depthFactor * -1;

    return {
      leftPercent,
      topPercent,
      widthPercent,
      heightPercent,
      zIndex: element.zIndex || 1,
      opacity: element.opacity !== undefined ? element.opacity : 1,
      depthFactor,
      depthOffset,
    };
  };

  return (
    <div style={containerStyle}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img src={backgroundSrc} alt="" style={{ ...imageStyle, display: 'block' }} />

        {elements.map((element) => (
          <InteractiveElement
            key={element.id}
            element={element}
            styleVars={getElementStyleVars(element)}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
};

export default BackgroundGroup;
