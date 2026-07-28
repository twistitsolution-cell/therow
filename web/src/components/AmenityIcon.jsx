import {
  Banknote,
  Bed,
  Car,
  CarFront,
  ChefHat,
  Coffee,
  ConciergeBell,
  Croissant,
  Dumbbell,
  Flower2,
  Lock,
  MoveVertical,
  PenTool,
  Phone,
  Plane,
  Presentation,
  Printer,
  Refrigerator,
  ShieldCheck,
  Shirt,
  ShowerHead,
  Sparkles,
  Tv,
  Utensils,
  WashingMachine,
  Wifi,
  Wine,
  Star,
} from 'lucide-react'

/**
 * Maps the `icon` key stored on an amenity to a Lucide component. Unknown keys fall back to a
 * star rather than rendering nothing, so a typo in the admin panel is visible instead of silent.
 */
const ICONS = {
  banknote: Banknote,
  bed: Bed,
  car: Car,
  'car-front': CarFront,
  'chef-hat': ChefHat,
  coffee: Coffee,
  'concierge-bell': ConciergeBell,
  croissant: Croissant,
  dumbbell: Dumbbell,
  'flower-2': Flower2,
  lock: Lock,
  'move-vertical': MoveVertical,
  'pen-tool': PenTool,
  phone: Phone,
  plane: Plane,
  presentation: Presentation,
  printer: Printer,
  refrigerator: Refrigerator,
  'shield-check': ShieldCheck,
  shirt: Shirt,
  'shower-head': ShowerHead,
  sparkles: Sparkles,
  tv: Tv,
  utensils: Utensils,
  'washing-machine': WashingMachine,
  wifi: Wifi,
  wine: Wine,
}

export default function AmenityIcon({ name, className = 'h-5 w-5', strokeWidth = 1.5 }) {
  const Icon = ICONS[name] ?? Star
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />
}
