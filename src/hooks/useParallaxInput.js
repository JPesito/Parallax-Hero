import { useState, useEffect } from 'react';
import useMouseParallax from './useMouseParallax';
import useTouchParallax from './useTouchParallax';

// Helper: soporta navegadores donde matchMedia NO tiene addEventListener (Safari viejo, etc.)
const listenMQ = (mq, handler) => {
  if (!mq) return () => {};
  if (mq.addEventListener) {
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }
  mq.addListener(handler);
  return () => mq.removeListener(handler);
};

// Detectar si es dispositivo táctil
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia?.('(pointer: coarse)');
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    setIsTouch((coarse?.matches ?? false) || hasTouch);

    const handler = (e) => setIsTouch(!!e.matches);
    const off = coarse ? listenMQ(coarse, handler) : () => {};

    return () => off();
  }, []);

  return isTouch;
};

// Detectar "móvil" por ancho + touch/coarse pointer
const useIsMobileViewport = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const mq = window.matchMedia?.(`(max-width: ${breakpoint}px)`);
    const coarse = window.matchMedia?.('(pointer: coarse)');
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return !!(mq?.matches && ((coarse?.matches ?? false) || hasTouch));
  });

  useEffect(() => {
    const mq = window.matchMedia?.(`(max-width: ${breakpoint}px)`);
    const coarse = window.matchMedia?.('(pointer: coarse)');

    const compute = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(!!(mq?.matches && ((coarse?.matches ?? false) || hasTouch)));
    };

    const off1 = mq ? listenMQ(mq, compute) : () => {};
    const off2 = coarse ? listenMQ(coarse, compute) : () => {};

    return () => {
      off1();
      off2();
    };
  }, [breakpoint]);

  return isMobile;
};

const useParallaxInput = (options = {}) => {
  const {
    sensitivity = 1,
    smoothing = 0.05,
    resetOnLeave = false,
    mobileBreakpoint = 768,
    mobileSensitivityMultiplier = 1.8,
    mobileInitialX = 0.8,
  } = options;

  const isTouchDevice = useIsTouchDevice();
  const isMobileViewport = useIsMobileViewport(mobileBreakpoint);

  // Para testing: forzar modo móvil si hay ?forceMobile en la URL
  const [forceTouch] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).has('forceMobile');
    } catch {
      return false;
    }
  });

  const isMobile = isMobileViewport || forceTouch;
  const useTouch = isTouchDevice || forceTouch;

  const effectiveSensitivity = isMobile ? sensitivity * mobileSensitivityMultiplier : sensitivity;

  // Hooks SIEMPRE se ejecutan (regla de hooks)
  const mouseParallax = useMouseParallax({
    sensitivity: effectiveSensitivity,
    smoothing,
    resetOnLeave,
    initialX: isMobile ? mobileInitialX : 0,
    initialY: 0,
  });

  const touchParallax = useTouchParallax({
    sensitivity: effectiveSensitivity,
    onlyHorizontal: true,
    mode: 'dry',
    initialX: isMobile ? mobileInitialX : 0,
  });

  // Debug global para el overlay ?debug
  useEffect(() => {
    window.__PARALLAX_DEBUG__ = {
      engine: useTouch ? 'touch' : 'mouse',
      isTouchDevice,
      isMobileViewport,
      isMobile,
      forceTouch,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      sensitivity,
      effectiveSensitivity,
      mobileInitialX,
      ts: Date.now(),
    };
  }, [
    isTouchDevice, isMobileViewport, isMobile, forceTouch, useTouch,
    sensitivity, effectiveSensitivity, mobileInitialX,
  ]);

  return useTouch ? touchParallax : mouseParallax;
};

export default useParallaxInput;
