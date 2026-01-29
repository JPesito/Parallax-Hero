import { useState, useEffect, useRef } from "react";

// Inyectar estilos de animación en el head
const injectStyles = () => {
  if (document.getElementById("preloader-styles")) return;

  const style = document.createElement("style");
  style.id = "preloader-styles";
  style.textContent = `
    @keyframes slideUp {
      0% { transform: translateY(0); }
      100% { transform: translateY(-100%); }
    }
    .preloader-sliding {
      animation: slideUp 1s cubic-bezier(0.76, 0, 0.24, 1) forwards !important;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .start-button {
      background: transparent;
      border: 2px solid #ffffff;
      color: #ffffff;
      padding: 16px 48px;
      font-size: 1.2rem;
      font-weight: 600;
      font-family: system-ui, -apple-system, sans-serif;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 2rem;
      text-transform: uppercase;
    }
    .start-button:hover {
      background: #ffffff;
      color: #0a0a0a;
    }
    .start-button:active {
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(style);
};

const isAudio = (url) => /\.(mp3|wav|ogg|m4a)$/i.test(url);
const isImage = (url) => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(url);

/**
 * Preloader robusto:
 * - Mantiene referencias a Image/Audio para evitar GC agresivo en Safari.
 * - Audio: escucha canplay/loadeddata/loadedmetadata + error + timeout.
 * - Siempre resuelve (success/error/timeout), así nunca se queda en 95%.
 */
const Preloader = ({
  assets = [],
  onComplete,
  minDisplayTime = 2000,
  maxAssetWait = 8000,     // timeout por asset
  maxTotalWait = 15000,    // fail-safe total (por si algo se cuelga)
}) => {
  const [progress, setProgress] = useState(0);         // progreso real de assets
  const [displayProgress, setDisplayProgress] = useState(0); // progreso visual suavizado
  const [phase, setPhase] = useState("loading"); // loading | ready | sliding
  const keepAliveRef = useRef([]); // guarda Image/Audio para Safari
  const mountedRef = useRef(true); // Track si el componente está montado

  useEffect(() => injectStyles(), []);

  // Animación suave del progreso visual hacia el progreso real
  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= progress) return prev;
        // Avanzar más rápido cuando la diferencia es grande
        const diff = progress - prev;
        const step = Math.max(1, Math.ceil(diff * 0.15));
        return Math.min(progress, prev + step);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [progress, phase]);

  // Solo ejecutar una vez al montar
  useEffect(() => {
    mountedRef.current = true;

    const startTime = Date.now();
    let completedCount = 0;
    const total = assets.length;

    keepAliveRef.current = [];

    const finish = () => {
      if (!mountedRef.current) return;
      const elapsed = Date.now() - startTime;
      // Esperar minDisplayTime + un poco más para que el contador visual alcance 100
      const remaining = Math.max(0, minDisplayTime - elapsed) + 600;
      setTimeout(() => {
        if (mountedRef.current) {
          setProgress(100);
          setPhase("ready");
        }
      }, remaining);
    };

    if (total === 0) {
      setTimeout(() => {
        if (mountedRef.current) {
          setProgress(100);
          setPhase("ready");
        }
      }, minDisplayTime);
      return () => { mountedRef.current = false; };
    }

    const markOneDone = () => {
      completedCount += 1;
      if (mountedRef.current) {
        const pct = Math.round((completedCount / total) * 100);
        setProgress(pct);
      }
      if (completedCount >= total) finish();
    };

    const withTimeout = (promise, ms) => {
      let t;
      const timeoutPromise = new Promise((resolve) => {
        t = setTimeout(resolve, ms);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(t));
    };

    const preloadString = (url) => {
      // Imágenes
      if (isImage(url)) {
        return new Promise((resolve) => {
          const img = new Image();
          keepAliveRef.current.push(img);

          const done = () => resolve();
          img.onload = done;
          img.onerror = done;
          img.src = url;
        });
      }

      // Audio
      if (isAudio(url)) {
        return new Promise((resolve) => {
          const audio = new Audio();
          keepAliveRef.current.push(audio);

          const done = () => resolve();

          // En Safari/iOS canplaythrough puede no disparar; usamos varios.
          const events = ["canplay", "loadeddata", "loadedmetadata", "canplaythrough", "error", "stalled", "abort"];
          events.forEach((ev) => audio.addEventListener(ev, done, { once: true }));

          audio.preload = "auto";
          audio.src = url;

          // Fuerza el intento de carga (importante en Safari)
          try {
            audio.load();
          } catch (e) {
            resolve();
          }
        });
      }

      // Otros: no bloquear el preloader (resuelve rápido)
      return Promise.resolve();
    };

    const preloadAny = (asset) => {
      if (typeof asset === "string") return preloadString(asset);
      if (asset && typeof asset === "object") return Promise.resolve();
      return Promise.resolve();
    };

    // Fail-safe total
    const totalFailSafe = setTimeout(() => {
      if (mountedRef.current) {
        setProgress(100);
        setPhase("ready");
      }
    }, maxTotalWait);

    assets.forEach((asset) => {
      withTimeout(preloadAny(asset), maxAssetWait)
        .catch(() => {})
        .finally(() => markOneDone());
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(totalFailSafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Handler para el botón Start
  const handleStart = () => {
    setPhase("sliding");
    // Llamar onComplete después de la animación
    setTimeout(() => {
      onComplete?.();
    }, 1000);
  };


  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#0a0a0a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const percentageStyle = {
    fontSize: "clamp(3rem, 10vw, 6rem)",
    fontWeight: 700,
    color: "#ffffff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    letterSpacing: "-0.02em",
  };

  const barContainerStyle = {
    width: "clamp(200px, 50vw, 400px)",
    height: "4px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "2px",
    marginTop: "2rem",
    overflow: "hidden",
  };

  const barFillStyle = {
    width: `${phase === "ready" || phase === "sliding" ? 100 : displayProgress}%`,
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "2px",
    transition: "width 0.3s ease-out",
  };

  return (
    <div style={overlayStyle} className={phase === "sliding" ? "preloader-sliding" : ""}>
      <div style={percentageStyle}>{phase === "ready" || phase === "sliding" ? 100 : displayProgress}%</div>
      <div style={barContainerStyle}>
        <div style={barFillStyle} />
      </div>
      {phase === "ready" && (
        <button
          className="start-button"
          onClick={handleStart}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleStart();
          }}
        >
          Start
        </button>
      )}
    </div>
  );
};

export default Preloader;
