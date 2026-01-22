import { useState, useEffect } from 'react';
import useMouseParallax from './useMouseParallax';
import useTouchParallax from './useTouchParallax';

// Detectar si es dispositivo táctil
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Método 1: matchMedia para pointer coarse (más confiable)
    const touchQuery = window.matchMedia('(pointer: coarse)');

    // Método 2: Fallback
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    setIsTouch(touchQuery.matches || hasTouch);

    // Listener para cambios (ej: conectar mouse a tablet)
    const handler = (e) => setIsTouch(e.matches);
    touchQuery.addEventListener('change', handler);

    return () => touchQuery.removeEventListener('change', handler);
  }, []);

  return isTouch;
};

const useParallaxInput = (options = {}) => {
  const {
    sensitivity = 1,
    smoothing = 0.05,
    friction = 0.95,
    resetOnLeave = false,
  } = options;

  const isTouchDevice = useIsTouchDevice();

  // Ejecutar ambos hooks siempre (regla de hooks)
  const mouseParallax = useMouseParallax({
    sensitivity,
    smoothing,
    resetOnLeave,
  });

  const touchParallax = useTouchParallax({
    sensitivity,
    friction,
    onlyHorizontal: true,
  });

  // Retornar el apropiado según el dispositivo
  return isTouchDevice ? touchParallax : mouseParallax;
};

export default useParallaxInput;
