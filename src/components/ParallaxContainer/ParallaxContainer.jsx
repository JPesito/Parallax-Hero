import { ParallaxContext } from './ParallaxContext';
import useParallaxInput from '../../hooks/useParallaxInput';
import styles from './ParallaxContainer.module.css';

const ParallaxContainer = ({
  children,
  className = '',
  sensitivity = 1,
  smoothing = 0.1,
  friction = 0.95,
  style = {},

  // --- TUNE SOLO MÓVIL ---
  mobileBreakpoint = 768,
  mobileSensitivityMultiplier = 1.6, // MÁS alto = se mueve MENOS por pixel (en touch)
  mobileSmoothing = 0.08,            // MÁS bajo = tarda más en “llegar” (más lento)
  mobileFriction = 0.9,              // menor = menos inercia
  mobileMaxVelocity = 0.05,          // menor = no “sale disparado”
  // -----------------------

  ...props
}) => {
  const { position } = useParallaxInput({
    sensitivity,
    smoothing,
    friction,

    mobileBreakpoint,
    mobileSensitivityMultiplier,
    mobileSmoothing,
    mobileFriction,
    mobileMaxVelocity,
  });

  return (
    <ParallaxContext.Provider value={position}>
      <div
        className={`${styles.container} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    </ParallaxContext.Provider>
  );
};

export default ParallaxContainer;
