import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.61, 1, 0.88, 1], // Custom ease "easeOutQuad"-ish
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.61, 1, 0.88, 1],
    }
  }
};

const PageTransition: React.FC<PageTransitionProps> = ({ children, className, ...props }) => {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
