import { useRef } from 'react';
import useParallaxCSS from '../../hooks/useParallaxCSS';
import styles from './ParallaxContainer.module.css';

const ParallaxContainer = ({
  children,
  className = '',
  sensitivity = 1,
  smoothing = 0.08,
  friction = 0.92,
  style = {},
  ...props
}) => {
  const containerRef = useRef(null);

  // Este hook actualiza las CSS custom properties directamente
  // NO causa re-renders de React
  useParallaxCSS(containerRef, { sensitivity, smoothing, friction });

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
      style={{
        '--parallax-x': 0,
        '--parallax-y': 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default ParallaxContainer;
