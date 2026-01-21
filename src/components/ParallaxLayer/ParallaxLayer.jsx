import { useParallaxContext } from '../ParallaxContainer';

const ParallaxLayer = ({
  children,
  depth = 0.5,
  position = 'center',
  invertX = false,
  invertY = false,
  maxOffset = 50,
  zIndex = 0,
  onlyHorizontal = false, // Solo movimiento horizontal
  style = {},
}) => {
  const mousePosition = useParallaxContext();

  const xMult = invertX ? -1 : 1;
  const yMult = invertY ? -1 : 1;

  const translateX = mousePosition.x * depth * maxOffset * xMult;
  // Si onlyHorizontal, no hay movimiento vertical
  const translateY = onlyHorizontal ? 0 : mousePosition.y * depth * maxOffset * yMult;

  const positionStyles = {
    center: { top: '50%', left: '50%' },
    topLeft: { top: 0, left: 0 },
    topRight: { top: 0, right: 0 },
    topCenter: { top: 0, left: '50%' },
    bottomLeft: { bottom: 0, left: 0 },
    bottomRight: { bottom: 0, right: 0 },
    bottomCenter: { bottom: 0, left: '50%' },
    centerLeft: { top: '50%', left: 0 },
    centerRight: { top: '50%', right: 0 },
    cover: { top: '50%', left: '50%' },
  };

  let baseTransform = '';
  if (position === 'center' || position === 'cover') {
    baseTransform = 'translate(-50%, -50%)';
  } else if (position === 'topCenter' || position === 'bottomCenter') {
    baseTransform = 'translateX(-50%)';
  } else if (position === 'centerLeft' || position === 'centerRight') {
    baseTransform = 'translateY(-50%)';
  }

  const parallaxTransform = `translate3d(${translateX}px, ${translateY}px, 0)`;
  const finalTransform = baseTransform
    ? `${baseTransform} ${parallaxTransform}`
    : parallaxTransform;

  const layerStyle = {
    position: 'absolute',
    ...positionStyles[position],
    transform: finalTransform,
    zIndex,
    ...style,
  };

  return (
    <div style={layerStyle}>
      {children}
    </div>
  );
};

export default ParallaxLayer;
