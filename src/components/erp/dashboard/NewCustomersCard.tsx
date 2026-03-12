import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import avatarImg from '@/assets/avatar-user.png';

interface ClientAvatar {
  id: number;
  name: string;
  initial: string;
  color: string;
  img?: string;
}

const allClients: ClientAvatar[] = [
  { id: 1, name: 'Anderson Silva', initial: 'A', color: 'bg-emerald-500' },
  { id: 2, name: 'Sandra Costa', initial: 'S', color: 'bg-cyan-500', img: avatarImg },
  { id: 3, name: 'Paulo Mendes', initial: 'P', color: 'bg-amber-500' },
  { id: 4, name: 'Roberta Lima', initial: 'R', color: 'bg-rose-500' },
  { id: 5, name: 'Felipe Oliveira', initial: 'F', color: 'bg-violet-500' },
  { id: 6, name: 'Carla Souza', initial: 'C', color: 'bg-blue-500' },
  { id: 7, name: 'Diego Martins', initial: 'D', color: 'bg-orange-500' },
  { id: 8, name: 'Juliana Rocha', initial: 'J', color: 'bg-pink-500' },
  { id: 9, name: 'Marcos Almeida', initial: 'M', color: 'bg-teal-500' },
  { id: 10, name: 'Tatiane Ribeiro', initial: 'T', color: 'bg-indigo-500' },
  { id: 11, name: 'Lucas Pereira', initial: 'L', color: 'bg-lime-600' },
  { id: 12, name: 'Natália Ferreira', initial: 'N', color: 'bg-fuchsia-500' },
  { id: 13, name: 'Eduardo Santos', initial: 'E', color: 'bg-sky-500' },
  { id: 14, name: 'Vanessa Pinto', initial: 'V', color: 'bg-red-500' },
  { id: 15, name: 'Bruno Cardoso', initial: 'B', color: 'bg-yellow-600' },
  { id: 16, name: 'Gabriela Nunes', initial: 'G', color: 'bg-emerald-600' },
];

const VISIBLE_COUNT = 4;

const NewCustomersCard = () => {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);

  const totalPages = Math.ceil(allClients.length / VISIBLE_COUNT);
  const startIdx = (page % totalPages) * VISIBLE_COUNT;
  const visibleClients = allClients.slice(startIdx, startIdx + VISIBLE_COUNT);
  const remaining = allClients.length - (startIdx + VISIBLE_COUNT);

  const handleNext = useCallback(() => {
    setDirection(1);
    setPage((p) => p + 1);
  }, []);

  // Position configs for 3D effect: index 0 = leftmost/back, last = front-right
  const getPositionStyle = (index: number, total: number) => {
    const center = (total - 1) / 2;
    const offset = index - center;
    const zOffset = -Math.abs(offset) * 30;
    const xOffset = offset * 28;
    const scale = 1 - Math.abs(offset) * 0.08;
    const brightness = 1 - Math.abs(offset) * 0.12;
    return { zOffset, xOffset, scale, brightness };
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full overflow-hidden">
        <div className="mb-4">
          <span className="text-3xl font-bold text-foreground">6.3k</span>
          <p className="text-sm text-muted-foreground mt-1">Novos Clientes no Mês</p>
        </div>

        <div className="mt-auto">
          <p className="text-sm font-semibold text-foreground mb-3">Destaques do Dia</p>

          {/* 3D Carousel Container */}
          <div
            className="relative flex items-center justify-center h-12"
            style={{ perspective: '800px' }}
          >
            <AnimatePresence mode="popLayout" custom={direction}>
              {visibleClients.map((client, i) => {
                const pos = getPositionStyle(i, visibleClients.length);
                return (
                  <Tooltip key={`${page}-${client.id}`}>
                    <TooltipTrigger asChild>
                      <motion.div
                        custom={direction}
                        initial={{
                          opacity: 0,
                          rotateY: direction > 0 ? 55 : -55,
                          translateX: direction > 0 ? 60 : -60,
                          translateZ: -80,
                          scale: 0.6,
                        }}
                        animate={{
                          opacity: 1,
                          rotateY: 0,
                          translateX: pos.xOffset,
                          translateZ: pos.zOffset,
                          scale: pos.scale,
                          filter: `brightness(${pos.brightness})`,
                        }}
                        exit={{
                          opacity: 0,
                          rotateY: direction > 0 ? -55 : 55,
                          translateX: direction > 0 ? -60 : 60,
                          translateZ: -80,
                          scale: 0.5,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 22,
                          mass: 0.8,
                          duration: 0.7,
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-card ${client.color} overflow-hidden cursor-pointer -ml-2 first:ml-0`}
                        style={{ transformStyle: 'preserve-3d', zIndex: visibleClients.length - Math.abs(i - Math.floor(visibleClients.length / 2)) }}
                        whileHover={{ scale: 1.18, translateZ: 15, transition: { duration: 0.2 } }}
                      >
                        {client.img ? (
                          <img src={client.img} alt={client.name} className="w-full h-full object-cover" />
                        ) : (
                          client.initial
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {client.name}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </AnimatePresence>

            {/* "+N" button */}
            {remaining > 0 ? (
              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-card -ml-2 cursor-pointer transition-colors hover:bg-muted-foreground/20 relative z-10"
              >
                +{remaining}
              </motion.button>
            ) : totalPages > 1 ? (
              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-card -ml-2 cursor-pointer transition-colors hover:bg-muted-foreground/20 relative z-10"
              >
                ↻
              </motion.button>
            ) : null}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default NewCustomersCard;
