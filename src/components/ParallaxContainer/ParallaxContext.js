import { createContext, useContext } from 'react';

export const ParallaxContext = createContext({ x: 0, y: 0 });

export const useParallaxContext = () => {
  return useContext(ParallaxContext);
};
