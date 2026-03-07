import type { Variants, Transition } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

// ── Container (stagger children) ──

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.04 },
  },
};

export const containerVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0, delayChildren: 0 } },
};

// ── Fade-up section ──

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const fadeUpReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

// ── List (lighter stagger) ──

export const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const listVariantsReduced: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0 } },
};

// ── Individual item ──

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

// ── Sidebar (slides from left) ──

export const sidebarContainerVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: EASE,
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

export const sidebarContainerVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0, delayChildren: 0 } },
};

export const sidebarItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
};

export const sidebarItemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

// ── Bar chart transition ──

export const barTransition: Transition = {
  duration: 0.6,
  ease: EASE,
};

export const barTransitionReduced: Transition = {
  duration: 0,
};

// ── Helper: pick the right variant based on reduced-motion preference ──

export function pickVariants(reduced: boolean | null) {
  return {
    container: reduced ? containerVariantsReduced : containerVariants,
    fadeUp: reduced ? fadeUpReduced : fadeUp,
    list: reduced ? listVariantsReduced : listVariants,
    item: reduced ? itemVariantsReduced : itemVariants,
    bar: reduced ? barTransitionReduced : barTransition,
    sidebarContainer: reduced
      ? sidebarContainerVariantsReduced
      : sidebarContainerVariants,
    sidebarItem: reduced
      ? sidebarItemVariantsReduced
      : sidebarItemVariants,
  };
}
