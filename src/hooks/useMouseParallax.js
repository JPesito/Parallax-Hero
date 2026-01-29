import { useState, useEffect, useRef } from 'react';

const useMouseParallax = (options = {}) => {
  const {
    sensitivity = 1,
    smoothing = 0.05,  // Más suave (antes era 0.1)
    resetOnLeave = false,  // NO resetear cuando el mouse sale
    initialX = 0,
    initialY = 0,
  } = options;

  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const targetPos = useRef({ x: initialX, y: initialY });
  const currentPos = useRef({ x: initialX, y: initialY });
  const hasInitialized = useRef(false);

  // FORZAR posición inicial al montar
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      targetPos.current.x = initialX;
      targetPos.current.y = initialY;
      currentPos.current.x = initialX;
      currentPos.current.y = initialY;
      setPosition({ x: initialX, y: initialY });
    }
  }, [initialX, initialY]);

  useEffect(() => {
    let running = true;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const animate = () => {
      if (!running) return;

      currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, smoothing);
      currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, smoothing);

      setPosition({
        x: currentPos.current.x,
        y: currentPos.current.y,
      });

      requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      targetPos.current = {
        x: ((clientX / innerWidth) * 2 - 1) * sensitivity,
        y: ((clientY / innerHeight) * 2 - 1) * sensitivity,
      };
    };

    const handleMouseLeave = () => {
      // Solo resetear si resetOnLeave es true
      if (resetOnLeave) {
        targetPos.current = { x: 0, y: 0 };
      }
      // Si es false, mantiene la última posición
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    requestAnimationFrame(animate);

    return () => {
      running = false;
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [sensitivity, smoothing, resetOnLeave]);

  return { position };
};

export default useMouseParallax;
