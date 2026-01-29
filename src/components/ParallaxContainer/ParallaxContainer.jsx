import { ParallaxContext } from './ParallaxContext';
import useParallaxInput from '../../hooks/useParallaxInput';
import styles from './ParallaxContainer.module.css';

const ParallaxContainer = ({
  children,
  className = '',
  sensitivity = 1,
  smoothing = 0.1,
  style = {},
  mobileBreakpoint = 768,
  mobileSensitivityMultiplier = 1.8,
  mobileInitialX = 0.8,
  ...props
}) => {
  const { position } = useParallaxInput({
    sensitivity,
    smoothing,
    mobileBreakpoint,
    mobileSensitivityMultiplier,
    mobileInitialX,
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
