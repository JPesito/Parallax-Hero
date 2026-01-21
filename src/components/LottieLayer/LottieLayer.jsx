import { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import ParallaxLayer from '../ParallaxLayer';

// Factor de seguridad: la imagen será al menos este % más ancha que la pantalla
const ZOOM_FACTOR_SEGURIDAD = 1.10;

const LottieLayer = ({
  animationData,
  imageSrc,
  imageAlt = '',
  // Dimensiones de la imagen para calcular maxOffset automático
  imageWidth = null,
  imageHeight = null,
  loop = true,
  autoplay = true,
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
  const imgRef = useRef(null);

  // Calcular dimensiones y maxOffset dinámicamente para size='cover'
  useEffect(() => {
    if (size === 'cover' && imageWidth && imageHeight) {
      const calculateDimensions = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Aspect ratio de la imagen
        const imageAspectRatio = imageWidth / imageHeight;

        // Calcular qué ancho tendría la imagen si la altura fuera 100vh
        const potentialWidth = viewportHeight * imageAspectRatio;

        let finalWidth, finalHeight;

        // ¿Ese ancho es suficiente para moverse?
        if (potentialWidth < viewportWidth * ZOOM_FACTOR_SEGURIDAD) {
          // NO ES SUFICIENTE: Forzamos el ancho para que sobre espacio lateral
          // Esto hace zoom in en la imagen
          finalWidth = viewportWidth * ZOOM_FACTOR_SEGURIDAD;
          finalHeight = finalWidth / imageAspectRatio;
          setImageDimensions({
            width: `${finalWidth}px`,
            height: 'auto'
          });
        } else {
          // SÍ ES SUFICIENTE: Ajustamos altura al 100vh
          finalWidth = potentialWidth;
          finalHeight = viewportHeight;
          setImageDimensions({
            width: 'auto',
            height: '100vh'
          });
        }

        // Calcular maxOffset basado en el ancho final
        // El espacio sobrante total es (AnchoImagen - AnchoPantalla)
        // Dividimos por 2 porque queremos movernos desde el centro
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

  return (
    <ParallaxLayer
      depth={depth}
      position={coverPosition}
      invertX={invertX}
      invertY={invertY}
      maxOffset={calculatedMaxOffset}
      zIndex={zIndex}
      onlyHorizontal={onlyHorizontal}
    >
      <div style={wrapperStyle}>
        {renderContent()}
      </div>
    </ParallaxLayer>
  );
};

export default LottieLayer;
