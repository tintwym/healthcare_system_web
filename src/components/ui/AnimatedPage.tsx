import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

/** Soft page enter/exit when hospital OS tabs change. */
export function AnimatedPage({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};
