import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Lottie from 'lottie-react';
import { useParallaxContext } from '../ParallaxContainer';

const StableLottie = memo(({ animationData, loop, speed = 1 }) => {
  const lottieRef = useRef(null);

  useEffect(() => {
    const api = lottieRef.current;
    if (api && typeof api.setSpeed === 'function') {
      try { api.setSpeed(speed); } catch {}
    }
  }, [speed]);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={loop}
      autoplay={true}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.animationData === nextProps.animationData &&
    prevProps.loop === nextProps.loop &&
    prevProps.speed === nextProps.speed
  );
});


// Componente imagen que NUNCA se re-renderiza
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
}, (prevProps, nextProps) => {
  return prevProps.src === nextProps.src;
});

// Factor de seguridad para desktop: la imagen será al menos este % más ancha que la pantalla
const ZOOM_FACTOR_DESKTOP = 1.10;
// Factor para móvil: necesitamos más espacio lateral para el drag
const ZOOM_FACTOR_MOBILE = 1.8;
// Breakpoint para considerar móvil (portrait)
const MOBILE_BREAKPOINT = 768;

// ========================================
// AUDIO MANAGER - Manejo centralizado del audio
// ========================================
const AudioManager = {
  audio: null,
  activeSpeakers: new Set(),
  fadeInterval: null,
  stopTimeouts: {}, // Timeouts por speaker
  targetVolume: 0.5,
  isPageVisible: true,
  isUnlocked: false, // Audio desbloqueado por interacción del usuario
  pendingPlay: false, // Hay un play pendiente esperando desbloqueo
  isMuted: false, // Estado de mute global
  muteListeners: new Set(), // Listeners para cambios de mute

  init(soundSrc, volume = 0.5) {
    if (!this.audio) {
      this.audio = new Audio(soundSrc);
      this.audio.loop = true;
      this.audio.preload = 'auto';
      this.audio.volume = 0;
      this.targetVolume = volume;

      // Escuchar cambios de visibilidad de la página
      document.addEventListener('visibilitychange', () => {
        this.isPageVisible = !document.hidden;
        if (document.hidden) {
          this.pauseImmediately();
        } else if (this.activeSpeakers.size > 0 && !this.isMuted) {
          this.resume();
        }
      });

      // Desbloquear audio al primer clic/touch en la página
      const unlockAudio = () => {
        if (!this.isUnlocked) {
          this.isUnlocked = true;
          // Si hay un play pendiente, reproducir ahora
          if (this.pendingPlay && this.activeSpeakers.size > 0 && !this.isMuted) {
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

  // Suscribirse a cambios de mute
  onMuteChange(callback) {
    this.muteListeners.add(callback);
    return () => this.muteListeners.delete(callback);
  },

  // Notificar cambios de mute
  notifyMuteChange() {
    this.muteListeners.forEach(cb => cb(this.isMuted));
  },

  // Toggle mute
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.pauseImmediately();
    } else if (this.activeSpeakers.size > 0 && this.isPageVisible && this.isUnlocked) {
      this.audio.play().catch(() => {});
      this.fadeIn();
    }
    this.notifyMuteChange();
    return this.isMuted;
  },

  getMuted() {
    return this.isMuted;
  },

  activate(speakerId) {
    if (!this.audio || !this.isPageVisible) return;

    // Cancelar fade out
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    // Cancelar timeout de este speaker específico
    if (this.stopTimeouts[speakerId]) {
      clearTimeout(this.stopTimeouts[speakerId]);
      delete this.stopTimeouts[speakerId];
    }

    this.activeSpeakers.add(speakerId);

    // Si está muteado, no reproducir
    if (this.isMuted) return;

    // Si el audio está desbloqueado, reproducir
    if (this.isUnlocked) {
      if (this.audio.paused) {
        this.audio.play().catch(() => {});
      }
      this.fadeIn();
    } else {
      // Marcar como pendiente - se reproducirá cuando el usuario haga clic
      this.pendingPlay = true;
    }
  },

  // Para móvil: activar por un tiempo específico y luego desactivar automáticamente
  activateForDuration(speakerId, duration = 5000) {
    this.activate(speakerId);

    // Programar desactivación automática
    if (this.stopTimeouts[speakerId]) {
      clearTimeout(this.stopTimeouts[speakerId]);
    }

    this.stopTimeouts[speakerId] = setTimeout(() => {
      this.activeSpeakers.delete(speakerId);
      delete this.stopTimeouts[speakerId];

      if (this.activeSpeakers.size === 0) {
        this.fadeOut();
      }
    }, duration);
  },

  deactivate(speakerId, delay = 0) {
    // Cancelar timeout existente de este speaker
    if (this.stopTimeouts[speakerId]) {
      clearTimeout(this.stopTimeouts[speakerId]);
      delete this.stopTimeouts[speakerId];
    }

    if (delay > 0) {
      this.stopTimeouts[speakerId] = setTimeout(() => {
        this.activeSpeakers.delete(speakerId);
        delete this.stopTimeouts[speakerId];

        if (this.activeSpeakers.size === 0) {
          this.fadeOut();
        }
      }, delay);
    } else {
      this.activeSpeakers.delete(speakerId);
      if (this.activeSpeakers.size === 0) {
        this.fadeOut();
      }
    }
  },

  fadeIn(duration = 600) {
    if (!this.audio || this.isMuted) return;

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
        this.fadeInterval = null;
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
        this.fadeInterval = null;
      } else {
        this.audio.volume = Math.max(0, startVol - volumeStep * step);
      }
    }, stepTime);
  },

  pauseImmediately() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  },

  resume() {
    if (this.audio && this.activeSpeakers.size > 0 && this.isPageVisible && !this.isMuted) {
      this.audio.play().catch(() => {});
      this.fadeIn();
    }
  },

  forceStop() {
    this.activeSpeakers.clear();
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    Object.keys(this.stopTimeouts).forEach(key => {
      clearTimeout(this.stopTimeouts[key]);
    });
    this.stopTimeouts = {};
    if (this.audio) {
      this.audio.volume = 0;
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
};

// Componente para elementos interactivos
const InteractiveElement = ({ element, style, isMobile }) => {
  const [isActive, setIsActive] = useState(false);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0, scale: 1 });
  const shakeIntervalRef = useRef(null);
  const localStopTimeoutRef = useRef(null);
  const touchActiveRef = useRef(false); // Prevenir múltiples activaciones touch
  const hitboxRef = useRef(null); // Ref para el hitbox

  // Inicializar audio si el elemento lo tiene
  useEffect(() => {
    if (element.soundSrc) {
      AudioManager.init(element.soundSrc, element.volume || 0.5);
    }
  }, [element.soundSrc, element.volume]);

  // Animación de vibración
  useEffect(() => {
    if (isActive && element.hoverEffect === 'shake') {
      const intensity = element.shakeIntensity || 3;
      shakeIntervalRef.current = setInterval(() => {
        const x = (Math.random() - 0.5) * intensity;
        const y = (Math.random() - 0.5) * (intensity * 0.5);
        const scale = 1 + (Math.random() - 0.5) * 0.02;
        setShakeOffset({ x, y, scale });
      }, 60);
    } else {
      if (shakeIntervalRef.current) {
        clearInterval(shakeIntervalRef.current);
        shakeIntervalRef.current = null;
      }
      setShakeOffset({ x: 0, y: 0, scale: 1 });
    }

    return () => {
      if (shakeIntervalRef.current) {
        clearInterval(shakeIntervalRef.current);
      }
    };
  }, [isActive, element.hoverEffect, element.shakeIntensity]);

  // Handler para touch en móvil - usando useCallback para estabilidad
  const handleTouchStart = useCallback(() => {
    if (!element.interactive || !isMobile) return;

    // Si ya está activo por touch, ignorar
    if (touchActiveRef.current) return;
    touchActiveRef.current = true;

    const duration = element.stopDelay !== undefined ? element.stopDelay : 5000;

    // Cancelar timeout existente
    if (localStopTimeoutRef.current) {
      clearTimeout(localStopTimeoutRef.current);
      localStopTimeoutRef.current = null;
    }

    setIsActive(true);

    // Activar audio por duración específica (se desactiva solo automáticamente)
    if (element.soundSrc) {
      AudioManager.activateForDuration(element.id, duration);
    }

    // Desactivar efecto visual después de la duración
    localStopTimeoutRef.current = setTimeout(() => {
      setIsActive(false);
      touchActiveRef.current = false;
    }, duration);
  }, [element.interactive, element.stopDelay, element.soundSrc, element.id, isMobile]);

  // Agregar event listener de touch con passive: false para evitar warnings
  useEffect(() => {
    const hitbox = hitboxRef.current;
    if (!hitbox || !element.interactive || !isMobile) return;

    const touchHandler = (e) => {
      e.preventDefault();
      handleTouchStart();
    };

    hitbox.addEventListener('touchstart', touchHandler, { passive: false });

    return () => {
      hitbox.removeEventListener('touchstart', touchHandler);
    };
  }, [element.interactive, isMobile, handleTouchStart]);

  const handleMouseEnter = () => {
    if (element.interactive && !isMobile) {
      // Cancelar timeout de parada si existe
      if (localStopTimeoutRef.current) {
        clearTimeout(localStopTimeoutRef.current);
        localStopTimeoutRef.current = null;
      }

      setIsActive(true);

      // Activar audio
      if (element.soundSrc) {
        AudioManager.activate(element.id);
      }
    }
  };

  const handleMouseLeave = () => {
    if (element.interactive && !isMobile) {
      const delay = element.stopDelay !== undefined ? element.stopDelay : 5000;

      localStopTimeoutRef.current = setTimeout(() => {
        setIsActive(false);

        // Desactivar audio
        if (element.soundSrc) {
          AudioManager.deactivate(element.id, 0); // El delay ya se aplicó arriba
        }
      }, delay);
    }
  };

  // Hitbox con control individual por lado (en porcentaje)
  // hitboxPadding: aplica a todos los lados si no se especifica individualmente
  // hitboxTop, hitboxBottom, hitboxLeft, hitboxRight: override individual
  const defaultPadding = element.hitboxPadding || 0;
  const hitboxTop = element.hitboxTop !== undefined ? element.hitboxTop : defaultPadding;
  const hitboxBottom = element.hitboxBottom !== undefined ? element.hitboxBottom : defaultPadding;
  const hitboxLeft = element.hitboxLeft !== undefined ? element.hitboxLeft : defaultPadding;
  const hitboxRight = element.hitboxRight !== undefined ? element.hitboxRight : defaultPadding;

  // Combinar transform del parallax (del style) con el del shake
  const baseTransform = style.transform || '';
  const shakeTransform = `translate(${shakeOffset.x}px, ${shakeOffset.y}px) scale(${shakeOffset.scale})`;

  const containerStyle = {
    ...style,
    transform: baseTransform ? `${baseTransform} ${shakeTransform}` : shakeTransform,
    pointerEvents: 'none',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
  };

  // El hitbox es un div que recibe los eventos del mouse
  const hitboxStyle = {
    position: 'absolute',
    top: `${hitboxTop}%`,
    left: `${hitboxLeft}%`,
    right: `${hitboxRight}%`,
    bottom: `${hitboxBottom}%`,
    cursor: element.interactive ? 'pointer' : 'default',
    pointerEvents: element.interactive ? 'auto' : 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle}>
      {/* Contenido visual - componentes estables que no se re-renderizan */}
      {element.lottieData ? (
        <StableLottie
          animationData={element.lottieData}
          loop={element.loop !== false}
          speed={isMobile ? 0.85 : 1}
        />
      ) : element.imageSrc ? (
        <StableImage src={element.imageSrc} />
      ) : null}

      {/* Hitbox invisible */}
      {element.interactive && (
        <div
          ref={hitboxRef}
          style={hitboxStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>
  );
};

const BackgroundGroup = ({
  backgroundSrc,
  backgroundWidth,
  backgroundHeight,
  // Props para fondo móvil
  mobileBackgroundSrc,
  mobileBackgroundWidth,
  mobileBackgroundHeight,
  elements = [], // Array de { id, lottieData, x, y, width, height, zIndex, mobileX, mobileY, mobileWidth }
  zIndex = 1,
  invertX = true,
  viewportHeight: vpHeightProp = null, // Altura real del viewport desde Hero
}) => {
  const mousePosition = useParallaxContext();
  const [maxOffset, setMaxOffset] = useState(0);
  const [imageStyle, setImageStyle] = useState({ height: '100vh', width: 'auto' });
  const [isMobile, setIsMobile] = useState(false);
  const [currentBgSrc, setCurrentBgSrc] = useState(backgroundSrc);
  const [currentBgWidth, setCurrentBgWidth] = useState(backgroundWidth);
  const [currentBgHeight, setCurrentBgHeight] = useState(backgroundHeight);

  useEffect(() => {
    if (!backgroundWidth || !backgroundHeight) return;

    const calculateDimensions = () => {
      const viewportWidth = window.innerWidth;
      // Usar la altura pasada como prop o window.innerHeight
      const viewportHeight = vpHeightProp ? parseInt(vpHeightProp) : window.innerHeight;
      const isMobileDevice = viewportWidth < MOBILE_BREAKPOINT;

      // Seleccionar fondo según dispositivo
      const useMobileBg = isMobileDevice && mobileBackgroundSrc;
      const bgWidth = useMobileBg ? mobileBackgroundWidth : backgroundWidth;
      const bgHeight = useMobileBg ? mobileBackgroundHeight : backgroundHeight;
      const bgSrc = useMobileBg ? mobileBackgroundSrc : backgroundSrc;

      setCurrentBgSrc(bgSrc);
      setCurrentBgWidth(bgWidth);
      setCurrentBgHeight(bgHeight);

      const imageAspectRatio = bgWidth / bgHeight;

      let finalWidth;
      let finalHeight;

      if (isMobileDevice) {
        // MÓVIL: Primero asegurar que cubra el alto del viewport
        // Luego agregar ancho extra para permitir el drag horizontal

        // Paso 1: Calcular tamaño para cubrir el alto
        finalHeight = viewportHeight;
        finalWidth = viewportHeight * imageAspectRatio;

        // Paso 2: Verificar si necesitamos más ancho para el drag
        const minWidthForDrag = viewportWidth * ZOOM_FACTOR_MOBILE;
        if (finalWidth < minWidthForDrag) {
          // Escalar proporcionalmente para tener suficiente ancho
          const scale = minWidthForDrag / finalWidth;
          finalWidth = minWidthForDrag;
          finalHeight = finalHeight * scale;
        }

        setImageStyle({
          width: `${finalWidth}px`,
          height: `${finalHeight}px`,
          maxWidth: 'none',
          objectFit: 'cover',
        });
      } else {
        // DESKTOP: Lógica original
        const potentialWidth = viewportHeight * imageAspectRatio;

        if (potentialWidth < viewportWidth * ZOOM_FACTOR_DESKTOP) {
          finalWidth = viewportWidth * ZOOM_FACTOR_DESKTOP;
          setImageStyle({
            width: `${finalWidth}px`,
            height: 'auto',
            maxWidth: 'none',
          });
        } else {
          finalWidth = potentialWidth;
          setImageStyle({
            height: `${viewportHeight}px`,
            width: 'auto',
            maxWidth: 'none',
          });
        }
      }

      const extraWidth = finalWidth - viewportWidth;
      const newMaxOffset = Math.max(0, (extraWidth / 2) - 2);
      setMaxOffset(newMaxOffset);
      setIsMobile(isMobileDevice);
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, [backgroundWidth, backgroundHeight, mobileBackgroundSrc, mobileBackgroundWidth, mobileBackgroundHeight, backgroundSrc, vpHeightProp]);

  // Calcular transformación parallax
  const xMult = invertX ? -1 : 1;
  const translateX = mousePosition.x * maxOffset * xMult;

  const containerStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) translate3d(${translateX}px, 0, 0)`,
    zIndex,
  };

  const wrapperStyle = {
    position: 'relative',
    display: 'inline-block',
  };

  // Estilo para elementos posicionados sobre la imagen
  // x, y, width, height están en píxeles de la imagen original
  // mobileX, mobileY, mobileWidth: override para móvil (opcional)
  // depth: 1 = se mueve igual que el fondo, <1 = se mueve menos (más cerca de cámara)
  const getElementStyle = (element) => {
    // Usar posiciones móviles si existen y estamos en móvil
    const x = isMobile && element.mobileX !== undefined ? element.mobileX : element.x;
    const y = isMobile && element.mobileY !== undefined ? element.mobileY : element.y;
    const width = isMobile && element.mobileWidth !== undefined ? element.mobileWidth : element.width;

    // Usar dimensiones del fondo actual (móvil o desktop)
    const bgW = currentBgWidth;
    const bgH = currentBgHeight;

    // Convertir posición de píxeles a porcentaje de la imagen
    const leftPercent = (x / bgW) * 100;
    const topPercent = (y / bgH) * 100;
    const widthPercent = (width / bgW) * 100;
    const heightPercent = element.height ? (element.height / bgH) * 100 : 'auto';

    // Calcular offset de parallax individual si el elemento tiene depth diferente
    // En móvil: todos tienen depth=1 excepto 'tableleft'
    let elementDepth = element.depth !== undefined ? element.depth : 1;

    // En móvil: SOLO tableleft mantiene depth; el resto queda depth=1 (sin parallax individual)
    if (isMobile) {
      elementDepth = element.id === 'tableleft'
        ? (element.depth !== undefined ? element.depth : 0.3)
        : 1;
    }

    const depthDiff = 1 - elementDepth; // Cuánto menos se mueve respecto al fondo
    const elementOffsetX = translateX * depthDiff * -1; // Compensar para que se mueva menos

    return {
      position: 'absolute',
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
      width: `${widthPercent}%`,
      height: heightPercent === 'auto' ? 'auto' : `${heightPercent}%`,
      zIndex: element.zIndex || 1,
      opacity: element.opacity !== undefined ? element.opacity : 1,
      transform: elementDepth !== 1 ? `translate3d(${elementOffsetX}px, 0, 0)` : undefined,
    };
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        {/* Imagen de fondo */}
        <img src={currentBgSrc} alt="" style={{ ...imageStyle, display: 'block' }} />

        {/* Elementos posicionados sobre la imagen (Lotties o PNGs) */}
        {elements.map((element) => (
          <InteractiveElement
            key={element.id}
            element={element}
            style={getElementStyle(element)}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
};

// Botón de Mute flotante
const MuteButton = () => {
  const [isMuted, setIsMuted] = useState(() => AudioManager.getMuted());

  useEffect(() => {
    // Suscribirse a cambios de mute
    const unsubscribe = AudioManager.onMuteChange((muted) => {
      setIsMuted(muted);
    });
    return unsubscribe;
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    AudioManager.toggleMute();
  };

  const buttonStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    padding: 0,
  };

  const iconStyle = {
    width: '24px',
    height: '24px',
    fill: 'none',
    stroke: '#ffffff',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <button
      style={buttonStyle}
      onClick={handleToggle}
      onTouchEnd={handleToggle}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? (
        // Icono de mute (speaker con X)
        <svg style={iconStyle} viewBox="0 0 24 24">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(255,255,255,0.2)" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        // Icono de sonido (speaker con ondas)
        <svg style={iconStyle} viewBox="0 0 24 24">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(255,255,255,0.2)" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
};

export default BackgroundGroup;
export { MuteButton, AudioManager };
