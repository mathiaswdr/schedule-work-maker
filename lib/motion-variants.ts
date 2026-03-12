import type { Variants, Transition } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

// ── Container (single quick reveal) ──

export const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE },
  },
};

export const containerVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.14 } },
};

// ── Child sections (no extra entrance animation) ──

export const fadeUp: Variants = {
  hidden: {},
  show: {},
};

export const fadeUpReduced: Variants = {
  hidden: {},
  show: {},
};

// ── Lists (no stagger on page load) ──

export const listVariants: Variants = {
  hidden: {},
  show: {},
};

export const listVariantsReduced: Variants = {
  hidden: {},
  show: {},
};

// ── Individual items (static on initial load) ──

export const itemVariants: Variants = {
  hidden: {},
  show: {},
};

export const itemVariantsReduced: Variants = {
  hidden: {},
  show: {},
};

// ── Sidebar (single quick reveal) ──

export const sidebarContainerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: EASE,
    },
  },
};

export const sidebarContainerVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.14 } },
};

export const sidebarItemVariants: Variants = {
  hidden: {},
  show: {},
};

export const sidebarItemVariantsReduced: Variants = {
  hidden: {},
  show: {},
};

// ── Bar chart transition ──

export const barTransition: Transition = {
  duration: 0.35,
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
