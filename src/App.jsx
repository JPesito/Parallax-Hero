import Hero from './components/Hero';
import Preloader from './components/Preloader';
import './styles/global.css';

// ============================================
// IMÁGENES
// ============================================
import background from './assets/images/HV-MTL_01_Background.jpg';
import lightFilter from './assets/images/Light filter.png';
import filterOverlay from './assets/images/Filter.png';
import robot1 from './assets/images/Robot 1.png';
import robot2 from './assets/images/Robot 2.png';
import tablelittle from './assets/images/Tablelittle.png';

// ============================================
// SONIDOS
// ============================================
import bassSound from './assets/sounds/bass.mp3';

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
import test from './assets/lotties/Table left.json';

// ============================================
// CONFIGURACIÓN DEL FONDO Y ELEMENTOS FIJOS
// ============================================
// Dimensiones de la imagen de fondo original (en píxeles)
const BACKGROUND_WIDTH = 1771;
const BACKGROUND_HEIGHT = 865;

// Elementos fijos al fondo
// x, y = posición en píxeles desde esquina superior izquierda de la imagen original
// width = ancho en píxeles de la imagen original
// height = alto en píxeles (opcional, si no se pone mantiene proporción)
const backgroundGroup = {
  src: background,
  width: BACKGROUND_WIDTH,
  height: BACKGROUND_HEIGHT,
  elements: [
    { id: 'fan1', lottieData: fan1, x: 265, y: 127, width: 120, zIndex: 2 },
    { id: 'fan2', lottieData: fan2, x: 500, y: 155, width: 115, zIndex: 2 },
    { id: 'fan3', lottieData: fan3, x: 725, y: 182, width: 120, zIndex: 2 },
    { id: 'fan4', lottieData: fan4, x: 1060, y: 180, width: 110, zIndex: 2 },
    { id: 'fan5', lottieData: fan5, x: 1583, y: 130, width: 140, zIndex: 2 },
    { id: 'speakerLeft', lottieData: speakerLeft, x: 55, y: 100, width: 240, zIndex: 2, interactive: true, hoverEffect: 'shake', soundSrc: bassSound, volume: 0.3, shakeIntensity: 2, hitboxPadding: 15, hitboxTop: 10, hitboxBottom: 25, hitboxLeft: 10, hitboxRight: 6 },
    { id: 'speakerRight', lottieData: speakerRight, x: 1290, y: 125, width: 260, zIndex: 4, interactive: true, hoverEffect: 'shake', soundSrc: bassSound, volume: 0.3, shakeIntensity: 2, hitboxPadding: 15, hitboxTop: 15, hitboxBottom: 30, hitboxLeft: 12, hitboxRight: 25 },
    { id: 'main', lottieData: main, x: -20, y: 110, width: 1800, zIndex: 3, depth: 0.95 },
    { id: 'lights', lottieData: lights, x: 210, y: -90, width: 1600, zIndex: 5 },
    { id: 'arm1', lottieData: arm1, x: 280, y: 185, width: 450, zIndex: 2, depth: 0.95 },
    { id: 'arm2', lottieData: arm2, x: 655, y: 160, width: 350, zIndex: 2, depth: 0.95 },
    { id: 'tableleft', lottieData: tableleft, x: -40, y: 538, width: 560, zIndex: 4, depth: 0.3, mobileX: 300 },
    { id: 'test', lottieData: test, x: 1205, y: 535, width: 600, zIndex: 5, depth: 0.95 },
    // Filtros PNG
    { id: 'lightFilter1', imageSrc: lightFilter, opacity: 0.1, x: 30, y: 20, width: 800, zIndex: 6 },
    { id: 'lightFilter2', imageSrc: lightFilter, opacity: 0.1, x: 585, y: 90, width: 500, zIndex: 6 },
    { id: 'lightFilter3', imageSrc: lightFilter, opacity: 0.1, x: 900, y: 0, width: 1000, zIndex: 6 },
    { id: 'filterOverlay', imageSrc: filterOverlay, opacity: 0.6, x: 0, y: 0, width: 1771, zIndex: 1 }, // Overlay general
    // Imagenes PNG
    { id: 'robot1', imageSrc: robot1, x: -198, y: 190, width: 560, zIndex: 2, depth: 0.95 },
    { id: 'robot2', imageSrc: robot2, x: 1290, y: 195, width: 560, zIndex: 4, depth: 0.95 },
    { id: 'tablelittle', imageSrc: tablelittle, x: 1245, y: 535, width: 100, zIndex: 4, depth: 0.95 },
  ],
};

// ============================================
// LOTTIES/IMÁGENES con parallax independiente (capas que SÍ se mueven diferente)
// ============================================
const lottiesData = {};
const imagesData = {};
const imagesDimensions = {};

// Lista de assets para precargar
const assetsToPreload = [
  // Imágenes
  background,
  lightFilter,
  filterOverlay,
  robot1,
  robot2,
  tablelittle,
  // Audio
  // bassSound,
  // Lotties (ya están cargados como JSON)
  fan1, fan2, fan3, fan4, fan5,
  speakerLeft, speakerRight,
  main, lights, arm1, arm2,
  tableleft, test,
];

function App() {
  return (
    <>
      <Preloader
        assets={assetsToPreload}
        onComplete={() => {}}
      />
      <div>
        <Hero
          backgroundGroup={backgroundGroup}
          lottiesData={lottiesData}
          imagesData={imagesData}
          imagesDimensions={imagesDimensions}
          sensitivity={1}
          smoothing={0.1}
          backgroundColor="#0a0a0a"
          showGradient={false}
          showPlaceholders={false}
        />
      </div>
    </>
  );
}

export default App;
