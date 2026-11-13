import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import Toast from './components/ui/Toast';
import GameScreen from './pages/GameScreen';
import GameSetup from './pages/GameSetup';
import HowToPlay from './pages/HowToPlay';
import MainMenu from './pages/MainMenu';
import Settings from './pages/Settings';
import Statistics from './pages/Statistics';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const game = useGameStore((s) => s.game);
  const reduced = useGameStore((s) => s.settings.reducedMotion);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduced);
  }, [reduced]);

  let page;
  switch (screen) {
    case 'setup':
      page = <GameSetup />;
      break;
    case 'game':
      page = game ? <GameScreen /> : <MainMenu />;
      break;
    case 'stats':
      page = <Statistics />;
      break;
    case 'howto':
      page = <HowToPlay />;
      break;
    case 'settings':
      page = <Settings />;
      break;
    default:
      page = <MainMenu />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={screen} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {page}
        </motion.div>
      </AnimatePresence>
      <Toast />
    </>
  );
}
