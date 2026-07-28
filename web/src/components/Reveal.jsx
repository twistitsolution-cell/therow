import { motion } from 'framer-motion'

const OFFSETS = {
  up: { y: 36, x: 0 },
  down: { y: -36, x: 0 },
  left: { x: 48, y: 0 },
  right: { x: -48, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * Scroll-triggered entrance. `once` keeps content still after it has been read — re-animating
 * on every pass makes long pages feel restless rather than refined.
 */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  className = '',
  amount = 0.25,
}) {
  const offset = OFFSETS[direction] ?? OFFSETS.up

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Staggers direct children. Pair with <Reveal.Item> for lists and grids. */
export function RevealGroup({ children, className = '', stagger = 0.09, amount = 0.2 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  )
}
