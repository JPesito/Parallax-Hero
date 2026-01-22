import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook que maneja el parallax usando CSS Custom Properties
 * NO usa React state = CERO re-renders = CERO parpadeos
 *
 * Actualiza las variables CSS:
 * --parallax-x: valor normalizado de -1 a 1
 * --parallax-y: valor normalizado de -1 a 1
 */

const useParallaxCSS = (containerRef, options = {}) => {
  const {
    sensitivity = 1,
    smoothing = 0.08,
    friction = 0.92,
    maxVelocity = 0.08,
    bounds = { min: -1, max: 1 },
    onlyHorizontal = true,
  } = options;

  // Detección de dispositivo táctil
  const isTouchDevice = useRef(false);

  // Estado interno (refs, no state)
  const isDragging = useRef(false);
  const startTouch = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });
  const startPosition = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const animationId = useRef(null);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (start, end, factor) => start + (end - start) * factor;

  // Actualizar las CSS custom properties directamente
  const updateCSSProperties = useCallback(() => {
    if (!containerRef.current) return;

    containerRef.current.style.setProperty('--parallax-x', currentPos.current.x.toFixed(4));
    containerRef.current.style.setProperty('--parallax-y', currentPos.current.y.toFixed(4));
  }, [containerRef]);

  const pixelsToNormalized = useCallback((deltaPixels, viewportSize) => {
    const maxDrag = viewportSize * 0.35 * sensitivity;
    return deltaPixels / maxDrag;
  }, [sensitivity]);

  // === MOUSE HANDLERS (Desktop) ===
  const handleMouseMove = useCallback((e) => {
    if (isTouchDevice.current) return;

    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    targetPos.current = {
      x: ((clientX / innerWidth) * 2 - 1) * sensitivity,
      y: onlyHorizontal ? 0 : ((clientY / innerHeight) * 2 - 1) * sensitivity,
    };
  }, [sensitivity, onlyHorizontal]);

  // === TOUCH HANDLERS (Mobile/Tablet) ===
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    isDragging.current = true;
    startTouch.current = { x: touch.clientX, y: touch.clientY };
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
    startPosition.current = { ...targetPos.current };
    velocity.current = { x: 0, y: 0 };
    lastTime.current = performance.now();
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const now = performance.now();
    const deltaTime = Math.max(now - lastTime.current, 1);

    const deltaX = touch.clientX - startTouch.current.x;
    const deltaY = onlyHorizontal ? 0 : (touch.clientY - startTouch.current.y);

    const normalizedDeltaX = -pixelsToNormalized(deltaX, window.innerWidth);
    const normalizedDeltaY = -pixelsToNormalized(deltaY, window.innerHeight);

    const newX = clamp(startPosition.current.x + normalizedDeltaX, bounds.min, bounds.max);
    const newY = clamp(startPosition.current.y + normalizedDeltaY, bounds.min, bounds.max);
    targetPos.current = { x: newX, y: newY };

    // Calcular velocidad con límite
    const instantDeltaX = touch.clientX - lastTouch.current.x;
    const instantDeltaY = touch.clientY - lastTouch.current.y;
    const rawVelX = -pixelsToNormalized(instantDeltaX, window.innerWidth) / deltaTime * 16;
    const rawVelY = onlyHorizontal ? 0 : -pixelsToNormalized(instantDeltaY, window.innerHeight) / deltaTime * 16;

    velocity.current = {
      x: clamp(rawVelX, -maxVelocity, maxVelocity),
      y: clamp(rawVelY, -maxVelocity, maxVelocity),
    };

    lastTouch.current = { x: touch.clientX, y: touch.clientY };
    lastTime.current = now;
  }, [bounds, onlyHorizontal, pixelsToNormalized, maxVelocity]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // === ANIMATION LOOP ===
  useEffect(() => {
    let running = true;

    // Detectar dispositivo táctil
    const touchQuery = window.matchMedia('(pointer: coarse)');
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    isTouchDevice.current = touchQuery.matches || hasTouch;

    const animate = () => {
      if (!running) return;

      // Aplicar inercia en touch cuando no está arrastrando
      if (isTouchDevice.current && !isDragging.current) {
        const vx = velocity.current.x;
        const vy = velocity.current.y;

        if (Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001) {
          const newX = clamp(targetPos.current.x + vx, bounds.min, bounds.max);
          const newY = clamp(targetPos.current.y + vy, bounds.min, bounds.max);
          targetPos.current = { x: newX, y: newY };

          velocity.current.x *= friction;
          velocity.current.y *= friction;

          // Reducir velocidad al llegar a los límites
          if (newX === bounds.min || newX === bounds.max) {
            velocity.current.x *= 0.3;
          }
        }
      }

      // Interpolación suave hacia el target
      currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, smoothing);
      currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, smoothing);

      // Actualizar CSS (NO React state)
      updateCSSProperties();

      animationId.current = requestAnimationFrame(animate);
    };

    // Iniciar animación
    animationId.current = requestAnimationFrame(animate);

    // Event listeners
    const touchOpts = { passive: false };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, touchOpts);
    window.addEventListener('touchmove', handleTouchMove, touchOpts);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      running = false;
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    bounds, friction, smoothing,
    handleMouseMove, handleTouchStart, handleTouchMove, handleTouchEnd,
    updateCSSProperties
  ]);

  // Retornar función para obtener posición actual (si se necesita)
  return {
    getPosition: () => ({ ...currentPos.current }),
  };
};

export default useParallaxCSS;
