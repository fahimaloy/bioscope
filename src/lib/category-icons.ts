// Shared curated registry of Lucide icons usable for category glyphs.
// Used by the admin icon picker, the admin categories table and the shop category grid.
import {
  Anchor, Bike, Box, Camera, Car, Cat, Coffee, Dog, Flame, Gem, Ghost, Heart,
  Image as ImageIcon, Moon, Music, Package, Palette, Percent, Rocket, Scissors, Shield,
  ShoppingBag, Smile, Snowflake, Sparkles, Star, Sun, Tag, Tags, Truck, Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Package, Scissors, Gem, Image: ImageIcon, Box, Tag, Tags, Palette, Sparkles, Truck,
  Shield, Star, Heart, Smile, Ghost, Flame, Snowflake, Zap, Sun, Moon, Rocket,
  Anchor, Car, Bike, Dog, Cat, Coffee, Music, Camera, ShoppingBag, Percent,
}

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS)

/** Resolve a stored icon name to a component. Returns null when unknown/empty. */
export function getCategoryIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null
  return CATEGORY_ICONS[name] ?? null
}
