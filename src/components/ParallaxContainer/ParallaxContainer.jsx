import { ParallaxContext } from './ParallaxContext';
import useMouseParallax from '../../hooks/useMouseParallax';
import styles from './ParallaxContainer.module.css';

const ParallaxContainer = ({
  children,
  className = '',
  sensitivity = 1,
  smoothing = 0.1,
  style = {},
  ...props
}) => {
  const { position } = useMouseParallax({ sensitivity, smoothing });

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
