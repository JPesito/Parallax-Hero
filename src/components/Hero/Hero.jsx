import { useState, useEffect } from 'react';
import ParallaxContainer from '../ParallaxContainer';
import BackgroundGroup from '../BackgroundGroup';

const Hero = ({
  backgroundGroup = null,
  sensitivity = 1,
  smoothing = 0.1,
  backgroundColor = '#0a0a0a',
  mobileInitialX = 0.8,
}) => {
  // Calcular altura real del viewport (fix para Safari móvil)
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(`${window.innerHeight}px`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: viewportHeight,
    overflow: 'hidden',
    background: backgroundColor,
  };

  return (
    <section style={containerStyle}>
      <ParallaxContainer sensitivity={sensitivity} smoothing={smoothing} mobileInitialX={mobileInitialX}>
        {backgroundGroup && (
          <BackgroundGroup
            backgroundSrc={backgroundGroup.src}
            backgroundWidth={backgroundGroup.width}
            backgroundHeight={backgroundGroup.height}
            mobileBackgroundSrc={backgroundGroup.mobileSrc}
            mobileBackgroundWidth={backgroundGroup.mobileWidth}
            mobileBackgroundHeight={backgroundGroup.mobileHeight}
            elements={backgroundGroup.elements}
            zIndex={1}
            invertX={true}
            viewportHeight={viewportHeight}
          />
        )}
      </ParallaxContainer>
    </section>
  );
};

export default Hero;
