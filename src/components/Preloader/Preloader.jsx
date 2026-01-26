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
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading | waiting | sliding | done
  const keepAliveRef = useRef([]); // guarda Image/Audio para Safari
  const completedRef = useRef(0);

  useEffect(() => injectStyles(), []);

  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();

    completedRef.current = 0;
    setProgress(0);
    setPhase("loading");
    keepAliveRef.current = [];

    const total = assets.length;

    const finish = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      setTimeout(() => {
        if (!cancelled) {
          setProgress(100);
          setPhase("waiting");
        }
      }, remaining);
    };

    if (total === 0) {
      setTimeout(() => {
        if (!cancelled) {
          setProgress(100);
          setPhase("waiting");
        }
      }, minDisplayTime);
      return () => {
        cancelled = true;
      };
    }

    const markOneDone = () => {
      if (cancelled) return;
      completedRef.current += 1;
      const pct = Math.round((completedRef.current / total) * 100);
      setProgress(pct);

      if (completedRef.current >= total) finish();
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
            // si falla, igual resolvemos
            resolve();
          }
        });
      }

      // Otros: no bloquear el preloader (resuelve rápido)
      return Promise.resolve();
    };

    const preloadAny = (asset) => {
      // strings: urls
      if (typeof asset === "string") return preloadString(asset);

      // objetos (ej. lotties JSON ya importados): no bloquear
      if (asset && typeof asset === "object") return Promise.resolve();

      return Promise.resolve();
    };

    // Fail-safe total: si algo raro pasa, no te quedas colgado
    const totalFailSafe = setTimeout(() => {
      if (!cancelled && phase === "loading") {
        // fuerza salida
        setProgress(100);
        setPhase("waiting");
      }
    }, maxTotalWait);

    assets.forEach((asset) => {
      withTimeout(preloadAny(asset), maxAssetWait)
        .catch(() => {}) // no nos importa el error, solo avanzar
        .finally(() => markOneDone());
    });

    return () => {
      cancelled = true;
      clearTimeout(totalFailSafe);
      keepAliveRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, minDisplayTime, maxAssetWait, maxTotalWait]);

  // Cuando llegamos a 'waiting', iniciamos el slide
  useEffect(() => {
    if (phase === "waiting") {
      const timer = setTimeout(() => {
        onComplete?.();
        setPhase("sliding");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // Cuando termina la animación de sliding
  useEffect(() => {
    if (phase === "sliding") {
      const timer = setTimeout(() => setPhase("done"), 1100);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (phase === "done") return null;

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
    width: `${progress}%`,
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "2px",
    transition: "width 0.3s ease-out",
  };

  return (
    <div style={overlayStyle} className={phase === "sliding" ? "preloader-sliding" : ""}>
      <div style={percentageStyle}>{progress}%</div>
      <div style={barContainerStyle}>
        <div style={barFillStyle} />
      </div>
    </div>
  );
};

export default Preloader;
