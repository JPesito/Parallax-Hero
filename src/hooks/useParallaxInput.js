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
  // Fallback antiguo
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

// Detectar “móvil” por ancho + touch/coarse pointer
const useIsMobileViewport = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.(`(max-width: ${breakpoint}px)`);
    const coarse = window.matchMedia?.('(pointer: coarse)');

    const compute = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(!!(mq?.matches && ((coarse?.matches ?? false) || hasTouch)));
    };

    compute();

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
    friction = 0.95,
    resetOnLeave = false,

    // ==== SOLO MÓVIL (defaults para “super fluido pero lento”) ====
    mobileBreakpoint = 768,

    // MÁS alto = se mueve MENOS por pixel (más lento)
    mobileSensitivityMultiplier = 2.6,

    // MÁS bajo = tarda más en llegar al target (más lento). Muy bajo puede sentirse “pegajoso”.
    mobileSmoothing = 0.06,

    // Más alto = más estable/suave (menos jitter)
    mobileFriction = 0.96,

    // Más bajo = evita picos bruscos (más controlado)
    mobileMaxVelocity = 0.03,
    // =============================================================
  } = options;

  const isTouchDevice = useIsTouchDevice();
  const isMobile = useIsMobileViewport(mobileBreakpoint);

  // Hooks SIEMPRE se ejecutan (regla de hooks)
  const mouseParallax = useMouseParallax({
    sensitivity,
    smoothing,
    resetOnLeave,
  });

  const touchParallax = useTouchParallax({
    sensitivity: isMobile ? sensitivity * mobileSensitivityMultiplier : sensitivity,
    smoothing: isMobile ? mobileSmoothing : 0.12,
    friction: isMobile ? mobileFriction : friction,
    maxVelocity: isMobile ? mobileMaxVelocity : 0.08,
    onlyHorizontal: true,
    mode: isMobile ? 'dry' : 'smooth',
  });

  // Debug global para el overlay ?debug
  useEffect(() => {
    window.__PARALLAX_DEBUG__ = {
      engine: isTouchDevice ? 'touch' : 'mouse',
      isTouchDevice,
      isMobile,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      pointerCoarse: window.matchMedia?.('(pointer: coarse)')?.matches ?? null,
      hasTouch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints ?? null,

      // inputs
      sensitivity,
      smoothing,
      friction,

      // mobile tuning
      mobileBreakpoint,
      mobileSensitivityMultiplier,
      mobileSmoothing,
      mobileFriction,
      mobileMaxVelocity,

      // efectivos
      effectiveSensitivity: isMobile ? sensitivity * mobileSensitivityMultiplier : sensitivity,
      effectiveSmoothing: isMobile ? mobileSmoothing : 0.12,
      effectiveFriction: isMobile ? mobileFriction : friction,
      effectiveMaxVelocity: isMobile ? mobileMaxVelocity : 0.08,

      ts: Date.now(),
    };
  }, [
    isTouchDevice,
    isMobile,
    sensitivity,
    smoothing,
    friction,
    mobileBreakpoint,
    mobileSensitivityMultiplier,
    mobileSmoothing,
    mobileFriction,
    mobileMaxVelocity,
  ]);

  return isTouchDevice ? touchParallax : mouseParallax;
};

export default useParallaxInput;
