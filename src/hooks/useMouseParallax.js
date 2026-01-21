import { useState, useEffect, useRef, useCallback } from 'react';

const useMouseParallax = (options = {}) => {
  const {
    sensitivity = 1,
    smoothing = 0.05,  // Más suave (antes era 0.1)
    resetOnLeave = false,  // NO resetear cuando el mouse sale
  } = options;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

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

  const getTransform = useCallback((depth, maxOffset = 50, invertX = false, invertY = false) => {
    const xMult = invertX ? -1 : 1;
    const yMult = invertY ? -1 : 1;
    const x = position.x * depth * maxOffset * xMult;
    const y = position.y * depth * maxOffset * yMult;
    return { x, y };
  }, [position.x, position.y]);

  return { position, getTransform };
};

export default useMouseParallax;
