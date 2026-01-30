import { useEffect, useMemo, useState } from 'react';
import Hero from './components/Hero';
import Preloader from './components/Preloader';
import { MuteButton, BackgroundAudioManager } from './components/BackgroundGroup';
import './styles/global.css';

// Cambia este string cada vez que quieras comprobar que el móvil cargó el JS nuevo
const BUILD = 'debug-mobile-scrub-v1';

// Control global del preloader - se reinicia SOLO al recargar página
const PRELOADER_KEY = "__PRELOADER_DONE__";
const isPreloaderDone = () => window[PRELOADER_KEY] === true;
const setPreloaderDone = () => { window[PRELOADER_KEY] = true; };

// ============================================
// IMÁGENES
// ============================================
import background from './assets/images/HV-MTL_01_Background.jpg';
import backgroundMobile from './assets/images/Fondo mobile.jpeg';
import lightFilter from './assets/images/Light filter.png';
import filterOverlay from './assets/images/Filter.png';
import robot1 from './assets/images/Robot 1.png';
import robot2 from './assets/images/Robot 2.png';
import tablelittle from './assets/images/Tablelittle.png';
import Encubadora from './assets/images/Encubadora.png';

// ============================================
// SONIDOS
// ============================================
import bassSound from './assets/sounds/bass.mp3';

// ============================================
// SONIDOS DE FONDO (ambient)
// ============================================
import ambientSound from './assets/sounds/ambient.mp3';
// import factorySound from './assets/sounds/factory.mp3'; // Descomentar cuando exista el archivo
const factorySound = null;

// ============================================
// LOTTIES - Elementos fijos al fondo
// ============================================
import fan1 from './assets/lotties/Fan 1.json';
import fan2 from './assets/lotties/Fan 2.json';
import fan3 from './assets/lotties/Fan 3.json';
import fan4 from './assets/lotties/Fan 4.json';
import fan5 from './assets/lotties/Fan 5.json';
import speakerLeft from './assets/lotties/Speaker left.json';
import speakerRight from './assets/lotties/Speaker right.json';
import main from './assets/lotties/Main.json';
import lights from './assets/lotties/Lights.json';
import arm1 from './assets/lotties/Brazo_01.json';
import arm2 from './assets/lotties/Arm 2.json';
import tableleft from './assets/lotties/Main table left.json';
import tableRight from './assets/lotties/Table left.json';
import Tarjeta from './assets/lotties/Tarjeta.json';

// ============================================
// CONFIGURACIÓN DEL FONDO Y ELEMENTOS FIJOS
// ============================================
const BACKGROUND_WIDTH = 1771;
const BACKGROUND_HEIGHT = 865;

// Dimensiones del fondo móvil
const BACKGROUND_WIDTH_MOBILE = 1120;
const BACKGROUND_HEIGHT_MOBILE = 751;

const backgroundGroup = {
  src: background,
  width: BACKGROUND_WIDTH,
  height: BACKGROUND_HEIGHT,
  // Configuración para móvil
  mobileSrc: backgroundMobile,
  mobileWidth: BACKGROUND_WIDTH_MOBILE,
  mobileHeight: BACKGROUND_HEIGHT_MOBILE,
  elements: [
    // Fans - posiciones móviles escaladas + offset Y de 177
    { id: 'fan1', lottieData: fan1, x: 265, y: 127, width: 120, zIndex: 2, mobileX: 167, mobileY: 255, mobileWidth: 76 },
    { id: 'fan2', lottieData: fan2, x: 500, y: 155, width: 115, zIndex: 2, mobileX: 316, mobileY: 270, mobileWidth: 73 },
    { id: 'fan3', lottieData: fan3, x: 725, y: 182, width: 120, zIndex: 2, mobileX: 458, mobileY: 290, mobileWidth: 76 },
    { id: 'fan4', lottieData: fan4, x: 1060, y: 180, width: 110, zIndex: 2, mobileX: 670, mobileY: 288, mobileWidth: 70 },
    { id: 'fan5', lottieData: fan5, x: 1583, y: 110, width: 140, zIndex: 2, mobileX: 1000, mobileY: 245, mobileWidth: 88 },

    {
      id: 'speakerLeft',
      lottieData: speakerLeft,
      x: 55,
      y: 100,
      width: 240,
      zIndex: 2,
      interactive: true,
      hoverEffect: 'shake',
      soundSrc: bassSound,
      volume: 0.3,
      shakeIntensity: 2,
      hitboxPadding: 15,
      hitboxTop: 10,
      hitboxBottom: 25,
      hitboxLeft: 10,
      hitboxRight: 6,
      mobileX: 35,
      mobileY: 235,
      mobileWidth: 152,
    },
    {
      id: 'speakerRight',
      lottieData: speakerRight,
      x: 1290,
      y: 125,
      width: 260,
      zIndex: 4,
      interactive: true,
      hoverEffect: 'shake',
      soundSrc: bassSound,
      volume: 0.3,
      shakeIntensity: 2,
      hitboxPadding: 15,
      hitboxTop: 15,
      hitboxBottom: 30,
      hitboxLeft: 12,
      hitboxRight: 25,
      mobileX: 815,
      mobileY: 255,
      mobileWidth: 164,
    },

    { id: 'main', lottieData: main, x: -20, y: 110, width: 1800, zIndex: 3, depth: 0.95, mobileX: -13, mobileY: 272, mobileWidth: 1138 },
    { id: 'lights', lottieData: lights, x: 210, y: -90, width: 1600, zIndex: 5, mobileX: 133, mobileY: 120, mobileWidth: 1011 },
    { id: 'arm1', lottieData: arm1, x: 280, y: 185, width: 450, zIndex: 2, depth: 0.95, mobileX: 177, mobileY: 300, mobileWidth: 284 },
    { id: 'arm2', lottieData: arm2, x: 655, y: 160, width: 350, zIndex: 2, depth: 0.95, mobileX: 414, mobileY: 300, mobileWidth: 221 },
    { id: 'tableleft', lottieData: tableleft, x: -40, y: 538, width: 560, zIndex: 4, depth: 0.5, mobileX: 180, mobileY: 545, mobileWidth: 354 },
    { id: 'tableRight', lottieData: tableRight, x: 1205, y: 535, width: 600, zIndex: 5, depth: 0.95, mobileX: 762, mobileY: 530, mobileWidth: 379 },
    { id: 'Tarjeta', lottieData: Tarjeta, x: 1335, y: 500, width: 110, zIndex: 6, mobileX: 843, mobileY: 500, mobileWidth: 70 },

    // Filtros PNG
    { id: 'lightFilter1', imageSrc: lightFilter, opacity: 0.1, x: 30, y: 20, width: 800, zIndex: 6, mobileX: 19, mobileY: 194, mobileWidth: 505 },
    { id: 'lightFilter2', imageSrc: lightFilter, opacity: 0.1, x: 585, y: 90, width: 500, zIndex: 6, mobileX: 370, mobileY: 255, mobileWidth: 316 },
    { id: 'lightFilter3', imageSrc: lightFilter, opacity: 0.1, x: 900, y: 0, width: 1000, zIndex: 6, mobileX: 569, mobileY: 177, mobileWidth: 632 },
    // filterOverlay se renderiza directamente en App.jsx (fuera del transform del Hero)

    // Imagenes PNG
    { id: 'robot1', imageSrc: robot1, x: -198, y: 190, width: 560, zIndex: 2, depth: 0.95, mobileX: -125, mobileY: 300, mobileWidth: 354 },
    { id: 'robot2', imageSrc: robot2, x: 1290, y: 195, width: 560, zIndex: 4, depth: 0.95, mobileX: 815, mobileY: 300, mobileWidth: 354 },
    { id: 'tablelittle', imageSrc: tablelittle, x: 1245, y: 535, width: 100, zIndex: 4, depth: 0.95, mobileX: 787, mobileY: 530, mobileWidth: 63 },
    { id: 'Encubadora', imageSrc: Encubadora, x: 1290, y: 470, width: 200, zIndex: 5, mobileX: 815, mobileY: 485, mobileWidth: 126 }
  ],
};

// Assets para precargar
const assetsToPreload = [
  background,
  backgroundMobile,
  lightFilter,
  filterOverlay,
  robot1,
  robot2,
  tablelittle,
  bassSound,

  // Lotties (JSON)
  fan1, fan2, fan3, fan4, fan5,
  speakerLeft, speakerRight,
  main, lights, arm1, arm2,
  tableleft, tableRight, Tarjeta,
  Encubadora,
];

function DebugOverlay({ enabled }) {
  const [dbg, setDbg] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      const data = window.__PARALLAX_DEBUG__ || {};
      setDbg({
        build: BUILD,
        ...data,
      });
    };

    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        zIndex: 1000000,
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: 10,
        fontSize: 12,
        maxWidth: '92vw',
        whiteSpace: 'pre-wrap',
        pointerEvents: 'none',
        lineHeight: 1.25,
      }}
    >
      {dbg ? JSON.stringify(dbg, null, 2) : 'debug...'}
    </div>
  );
}

function App() {
  // Estado para controlar si mostrar el preloader
  const [showPreloader, setShowPreloader] = useState(() => !isPreloaderDone());

  // Inicializar audio ambiental de fondo
  useEffect(() => {
    BackgroundAudioManager.init({ ambient: ambientSound, factory: factorySound });
    return () => BackgroundAudioManager.destroy();
  }, []);

  const debugEnabled = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).has('debug');
    } catch {
      return false;
    }
  }, []);

  // Handler cuando el preloader termina
  const handlePreloaderComplete = () => {
    setPreloaderDone();
    setShowPreloader(false);
  };

  return (
    <>
      <DebugOverlay enabled={debugEnabled} />

      {showPreloader && (
        <Preloader
          assets={assetsToPreload}
          onComplete={handlePreloaderComplete}
        />
      )}

      <div>
        <Hero
          backgroundGroup={backgroundGroup}
          sensitivity={1}
          smoothing={0.1}
          backgroundColor="#0a0a0a"
        />

        {/* Filter overlay - fuera del Hero para que position:fixed funcione */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <img
            src={filterOverlay}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.6,
            }}
          />
        </div>

        <MuteButton />
      </div>
    </>
  );
}

export default App;
