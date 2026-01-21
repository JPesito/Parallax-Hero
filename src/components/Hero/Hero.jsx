import ParallaxContainer from '../ParallaxContainer';
import LottieLayer from '../LottieLayer';
import BackgroundGroup from '../BackgroundGroup';
import { layersConfig } from '../../config/layersConfig';

const Hero = ({
  lottiesData = {},
  imagesData = {},
  // Dimensiones de las imágenes para cálculo automático de maxOffset
  imagesDimensions = {},
  // Configuración del grupo de fondo (imagen + elementos fijos)
  backgroundGroup = null,
  title = '',
  subtitle = '',
  ctaText = '',
  onCtaClick = null,
  showScrollIndicator = false,
  sensitivity = 1,
  smoothing = 0.1,
  backgroundColor = '#0a0a0a',
  showGradient = true,
  showPlaceholders = false,
  customContent = null,
}) => {
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    background: backgroundColor,
  };

  const gradientStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(ellipse at center, rgba(30, 30, 50, 0.8) 0%, rgba(10, 10, 20, 1) 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  };

  const contentStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 50,
    textAlign: 'center',
    pointerEvents: 'auto',
  };

  const titleStyle = {
    fontSize: 'clamp(2rem, 8vw, 5rem)',
    fontWeight: 800,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '1rem',
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  };

  const subtitleStyle = {
    fontSize: 'clamp(1rem, 3vw, 1.5rem)',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '2rem',
    fontWeight: 300,
    letterSpacing: '0.05em',
  };

  const ctaStyle = {
    display: 'inline-block',
    padding: '1rem 2.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#000',
    background: '#fff',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  };

  const scrollStyle = {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 50,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.75rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  };

  // Filtrar capas que NO son parte del backgroundGroup
  const backgroundGroupIds = backgroundGroup?.elements?.map(e => e.id) || [];
  const activeLayers = layersConfig.filter(layer => {
    // Excluir layer-01 (fondo) y elementos del backgroundGroup
    if (layer.id === 'layer-01' || backgroundGroupIds.includes(layer.id)) {
      return false;
    }
    const hasContent = lottiesData[layer.id] || imagesData[layer.id];
    return hasContent || showPlaceholders;
  });

  return (
    <section style={containerStyle}>
      {showGradient && <div style={gradientStyle} />}

      <ParallaxContainer sensitivity={sensitivity} smoothing={smoothing}>
        {/* Grupo de fondo: imagen + elementos fijos */}
        {backgroundGroup && (
          <BackgroundGroup
            backgroundSrc={backgroundGroup.src}
            backgroundWidth={backgroundGroup.width}
            backgroundHeight={backgroundGroup.height}
            elements={backgroundGroup.elements}
            zIndex={1}
            invertX={true}
          />
        )}

        {/* Capas con parallax independiente */}
        {activeLayers.map(layer => {
          const dimensions = imagesDimensions[layer.id] || {};
          return (
            <LottieLayer
              key={layer.id}
              animationData={lottiesData[layer.id] || null}
              imageSrc={imagesData[layer.id] || null}
              imageWidth={dimensions.width || null}
              imageHeight={dimensions.height || null}
              depth={layer.depth}
              position={layer.position}
              offsetX={layer.offsetX}
              offsetY={layer.offsetY}
              size={layer.size}
              zIndex={layer.zIndex}
              invertX={layer.invertX}
              invertY={layer.invertY}
              maxOffset={layer.maxOffset}
              loop={layer.loop}
              onlyHorizontal={layer.onlyHorizontal || false}
            />
          );
        })}
      </ParallaxContainer>

      {(title || subtitle || ctaText || customContent) && (
        <div style={contentStyle}>
          {customContent || (
            <>
              {title && <h1 style={titleStyle}>{title}</h1>}
              {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
              {ctaText && (
                <button style={ctaStyle} onClick={onCtaClick} type="button">
                  {ctaText}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {showScrollIndicator && <div style={scrollStyle}>Scroll</div>}
    </section>
  );
};

export default Hero;
