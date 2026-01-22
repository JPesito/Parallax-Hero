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
  ...props
}) => {
  const { position } = useParallaxInput({ sensitivity, smoothing, friction });

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
