import { useState, useEffect, useRef, useCallback } from 'react';

const useTouchParallax = (options = {}) => {
  const {
    sensitivity = 1,
    bounds = { min: -1, max: 1 },
    onlyHorizontal = true,
    initialX = 0,
    initialY = 0,
  } = options;

  const [position, setPosition] = useState({ x: initialX, y: initialY });

  const isDragging = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });
  const startTouch = useRef({ x: 0, y: 0 });

  const targetPos = useRef({ x: initialX, y: initialY });
  const currentPos = useRef({ x: initialX, y: initialY });

  const hasInitialized = useRef(false);

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

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const pixelsToNormalized = useCallback((deltaPixels, viewportSize) => {
    const maxDrag = viewportSize * 0.35 * sensitivity;
    return deltaPixels / maxDrag;
  }, [sensitivity]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    isDragging.current = true;

    startTouch.current = { x: touch.clientX, y: touch.clientY };
    startPosition.current = { ...targetPos.current };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();

    const touch = e.touches[0];

    const deltaX = touch.clientX - startTouch.current.x;
    const deltaY = onlyHorizontal ? 0 : (touch.clientY - startTouch.current.y);

    const normalizedDeltaX = -pixelsToNormalized(deltaX, window.innerWidth);
    const normalizedDeltaY = -pixelsToNormalized(deltaY, window.innerHeight);

    const newX = clamp(startPosition.current.x + normalizedDeltaX, bounds.min, bounds.max);
    const newY = clamp(startPosition.current.y + normalizedDeltaY, bounds.min, bounds.max);

    targetPos.current = { x: newX, y: newY };
    currentPos.current.x = newX;
    currentPos.current.y = newY;
    setPosition({ x: newX, y: newY });
  }, [bounds, onlyHorizontal, pixelsToNormalized]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

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
