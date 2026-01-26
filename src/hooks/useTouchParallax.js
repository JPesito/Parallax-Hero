import { useState, useEffect, useRef, useCallback } from 'react';

const useTouchParallax = (options = {}) => {
  const {
    sensitivity = 1,
    smoothing = 0.12,
    friction = 0.92,
    maxVelocity = 0.08,
    bounds = { min: -1, max: 1 },
    onlyHorizontal = true,

    // NUEVO:
    // "smooth" = como lo tienes hoy (lerp + inercia)
    // "dry"   = en seco (sin lerp + sin inercia)
    mode = 'smooth',

    // setState throttling (si quieres más “fino”, baja a 16)
    updateInterval = 32,
  } = options;

  const [position, setPosition] = useState({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });
  const startTouch = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });

  const velocity = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  const lastTime = useRef(0);
  const animationId = useRef(null);
  const lastUpdateTime = useRef(0);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (start, end, factor) => start + (end - start) * factor;

  const clampVelocity = (vel) => clamp(vel, -maxVelocity, maxVelocity);

  const pixelsToNormalized = useCallback((deltaPixels, viewportSize) => {
    const maxDrag = viewportSize * 0.35 * sensitivity;
    return deltaPixels / maxDrag;
  }, [sensitivity]);

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

    // ===== MODO "DRY" (EN SECO) =====
    if (mode === 'dry') {
      // Nada de inercia, nada de lerp: posición directa
      currentPos.current.x = newX;
      currentPos.current.y = newY;
      velocity.current = { x: 0, y: 0 };

      const interval = updateInterval === 32 ? 16 : updateInterval; // recomendado en dry
      if (now - lastUpdateTime.current >= interval) {
        setPosition({ x: newX, y: newY });
        lastUpdateTime.current = now;
      }

      lastTime.current = now;
      lastTouch.current = { x: touch.clientX, y: touch.clientY };
      return;
    }
    // ===============================

    // ===== MODO SMOOTH (como estabas) =====
    const instantDeltaX = touch.clientX - lastTouch.current.x;
    const instantDeltaY = touch.clientY - lastTouch.current.y;

    const rawVelX = -pixelsToNormalized(instantDeltaX, window.innerWidth) / deltaTime * 16;
    const rawVelY = onlyHorizontal ? 0 : -pixelsToNormalized(instantDeltaY, window.innerHeight) / deltaTime * 16;

    velocity.current = {
      x: clampVelocity(rawVelX),
      y: clampVelocity(rawVelY),
    };

    lastTouch.current = { x: touch.clientX, y: touch.clientY };
    lastTime.current = now;
  }, [bounds, onlyHorizontal, pixelsToNormalized, maxVelocity, mode, updateInterval]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;

    // En seco: cortar en 0 (sin frenado)
    if (mode === 'dry') {
      velocity.current = { x: 0, y: 0 };
    }
  }, [mode]);

  // Animation loop SOLO para mode="smooth"
  useEffect(() => {
    if (mode === 'dry') return;

    let running = true;
    const UPDATE_INTERVAL = updateInterval; // ~30fps por defecto

    const animate = () => {
      if (!running) return;

      // Inercia cuando sueltas (solo smooth)
      if (!isDragging.current) {
        const vx = velocity.current.x;
        const vy = velocity.current.y;

        if (Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001) {
          const newX = clamp(targetPos.current.x + vx, bounds.min, bounds.max);
          const newY = clamp(targetPos.current.y + vy, bounds.min, bounds.max);
          targetPos.current = { x: newX, y: newY };

          velocity.current.x *= friction;
          velocity.current.y *= friction;

          if (newX === bounds.min || newX === bounds.max) {
            velocity.current.x *= 0.3;
          }
        }
      }

      // Lerping suave (solo smooth)
      currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, smoothing);
      currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, smoothing);

      const now = performance.now();
      if (now - lastUpdateTime.current >= UPDATE_INTERVAL) {
        setPosition({ x: currentPos.current.x, y: currentPos.current.y });
        lastUpdateTime.current = now;
      }

      animationId.current = requestAnimationFrame(animate);
    };

    animationId.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animationId.current) cancelAnimationFrame(animationId.current);
    };
  }, [bounds, friction, smoothing, mode, updateInterval]);

  // Event listeners
  useEffect(() => {
    const opts = { passive: false };

    window.addEventListener('touchstart', handleTouchStart, opts);
    window.addEventListener('touchmove', handleTouchMove, opts);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { position };
};

export default useTouchParallax;
