import { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import ParallaxLayer from '../ParallaxLayer';

const ZOOM_FACTOR_SEGURIDAD = 1.10;

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const coarse = window.matchMedia('(pointer: coarse)');

    const compute = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(mq.matches && (coarse.matches || hasTouch));
    };

    compute();
    mq.addEventListener('change', compute);
    coarse.addEventListener('change', compute);

    return () => {
      mq.removeEventListener('change', compute);
      coarse.removeEventListener('change', compute);
    };
  }, [breakpoint]);

  return isMobile;
};

const LottieLayer = ({
  animationData,
  imageSrc,
  imageAlt = '',
  imageWidth = null,
  imageHeight = null,
  loop = true,
  autoplay = true,

  // NUEVO: velocidad
  speed = 1,
  mobileSpeedMultiplier = 0.85,   // “un poquito más lento”
  mobileDepthMultiplier = 0.85,   // opcional: parallax un poco menor SOLO en Lottie

  size = 'md',
  width = null,
  height = null,
  depth = 0.5,
  position = 'center',
  invertX = false,
  invertY = false,
  maxOffset = 50,
  zIndex = 0,
  offsetX = 0,
  offsetY = 0,
  onlyHorizontal = false,
  style = {},
}) => {
  const [calculatedMaxOffset, setCalculatedMaxOffset] = useState(maxOffset);
  const [imageDimensions, setImageDimensions] = useState({ width: 'auto', height: '100vh' });

  const isMobile = useIsMobile(768);
  const lottieRef = useRef(null);

  // Ajuste de velocidad SOLO móvil
  const effectiveLottieSpeed = isMobile ? speed * mobileSpeedMultiplier : speed;

  useEffect(() => {
    if (!animationData) return;
    const api = lottieRef.current;
    if (api && typeof api.setSpeed === 'function') {
      try {
        api.setSpeed(effectiveLottieSpeed);
      } catch {}
    }
  }, [animationData, effectiveLottieSpeed]);

  // Calcular dimensiones y maxOffset dinámicamente para size='cover'
  useEffect(() => {
    if (size === 'cover' && imageWidth && imageHeight) {
      const calculateDimensions = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const imageAspectRatio = imageWidth / imageHeight;
        const potentialWidth = viewportHeight * imageAspectRatio;

        let finalWidth, finalHeight;

        if (potentialWidth < viewportWidth * ZOOM_FACTOR_SEGURIDAD) {
          finalWidth = viewportWidth * ZOOM_FACTOR_SEGURIDAD;
          finalHeight = finalWidth / imageAspectRatio;
          setImageDimensions({ width: `${finalWidth}px`, height: 'auto' });
        } else {
          finalWidth = potentialWidth;
          finalHeight = viewportHeight;
          setImageDimensions({ width: 'auto', height: '100vh' });
        }

        const extraWidth = finalWidth - viewportWidth;
        const safeMaxOffset = Math.max(0, (extraWidth / 2) - 2);
        setCalculatedMaxOffset(safeMaxOffset);
      };

      calculateDimensions();
      window.addEventListener('resize', calculateDimensions);
      return () => window.removeEventListener('resize', calculateDimensions);
    } else {
      setCalculatedMaxOffset(maxOffset);
    }
  }, [size, imageWidth, imageHeight, maxOffset]);

  const sizes = {
    xs: 'clamp(40px, 8vw, 80px)',
    sm: 'clamp(60px, 12vw, 120px)',
    md: 'clamp(100px, 18vw, 200px)',
    lg: 'clamp(150px, 25vw, 300px)',
    xl: 'clamp(200px, 35vw, 450px)',
    '2xl': 'clamp(280px, 45vw, 600px)',
    full: '100%',
  };

  const isCover = size === 'cover';
  const coverPosition = isCover ? 'cover' : position;

  const wrapperStyle = isCover
    ? {
        width: 'auto',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: width || sizes[size] || sizes.md,
        height: height || 'auto',
        marginLeft: offsetX ? `${offsetX}%` : undefined,
        marginTop: offsetY ? `${offsetY}%` : undefined,
        ...style,
      };

  const imageStyle = isCover
    ? {
        height: imageDimensions.height,
        width: imageDimensions.width,
        maxWidth: 'none',
      }
    : {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      };

  const placeholderStyle = {
    width: '100%',
    height: '100%',
    minWidth: '50px',
    minHeight: '50px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    border: '2px dashed rgba(255, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '12px',
  };

  const renderContent = () => {
    if (animationData) {
      return (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          style={{ width: '100%', height: '100%' }}
        />
      );
    }

    if (imageSrc) {
      return <img src={imageSrc} alt={imageAlt} style={imageStyle} />;
    }

    return <div style={placeholderStyle}>Lottie/IMG</div>;
  };

  // Opcional: SOLO si es Lottie, que el parallax sea un poco menos agresivo en móvil
  const effectiveDepth = isMobile && animationData ? depth * mobileDepthMultiplier : depth;

  return (
    <ParallaxLayer
      depth={effectiveDepth}
      position={coverPosition}
      invertX={invertX}
      invertY={invertY}
      maxOffset={calculatedMaxOffset}
      zIndex={zIndex}
      onlyHorizontal={onlyHorizontal}
    >
      <div style={wrapperStyle}>{renderContent()}</div>
    </ParallaxLayer>
  );
};

export default LottieLayer;
