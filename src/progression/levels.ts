export interface LevelDefinition {
  level: number
  name: string
  icon: string
  xpRequired: number
  shapeRequirement?: {
    minShapeCount?: number
    requiredShapeIds?: string[]
    minGridSize?: number
  }
  bonusDescription?: string
  xpMultiplier?: number
  speedBonusMultiplier?: number
  streakStepBonus?: number
}

export const LEVELS: LevelDefinition[] = [
  {
    level: 1,
    name: 'Beginner',
    icon: '🌱',
    xpRequired: 0,
  },
  {
    level: 2,
    name: 'Observer',
    icon: '👁️',
    xpRequired: 100,
  },
  {
    level: 3,
    name: 'Tracker',
    icon: '🔍',
    xpRequired: 300,
    bonusDescription: '+5% XP on all answers',
    xpMultiplier: 1.05,
  },
  {
    level: 4,
    name: 'Identifier',
    icon: '🏷️',
    xpRequired: 600,
    shapeRequirement: { minShapeCount: 4 },
  },
  {
    level: 5,
    name: 'Apprentice',
    icon: '⚗️',
    xpRequired: 1000,
    shapeRequirement: { minShapeCount: 5 },
    bonusDescription: '+10% board bonus XP',
    xpMultiplier: 1.10,
  },
  {
    level: 6,
    name: 'Shape Scout',
    icon: '🗺️',
    xpRequired: 1500,
  },
  {
    level: 7,
    name: 'Combiner',
    icon: '🔗',
    xpRequired: 2100,
    shapeRequirement: { requiredShapeIds: ['star'] },
    bonusDescription: '+15% speed bonus XP',
    speedBonusMultiplier: 1.15,
  },
  {
    level: 8,
    name: 'Navigator',
    icon: '🧭',
    xpRequired: 2800,
  },
  {
    level: 9,
    name: 'Analyst',
    icon: '📊',
    xpRequired: 3600,
    shapeRequirement: { minShapeCount: 8 },
  },
  {
    level: 10,
    name: 'Pattern Seeker',
    icon: '🌀',
    xpRequired: 4500,
    bonusDescription: 'Streak step +0.05',
    streakStepBonus: 0.05,
  },
  {
    level: 11,
    name: 'Geometrician',
    icon: '📐',
    xpRequired: 5500,
    shapeRequirement: { requiredShapeIds: ['crescent', 'heart'] },
  },
  {
    level: 12,
    name: 'Sharpshooter',
    icon: '🎯',
    xpRequired: 6600,
    bonusDescription: '+50 XP on perfect board',
  },
  {
    level: 13,
    name: 'Visionary',
    icon: '🔭',
    xpRequired: 7800,
    shapeRequirement: { minGridSize: 4 },
  },
  {
    level: 14,
    name: 'Tactician',
    icon: '♟️',
    xpRequired: 9100,
    bonusDescription: "Wrong answers don't reduce XP",
  },
  {
    level: 15,
    name: 'Master',
    icon: '🏅',
    xpRequired: 10500,
    shapeRequirement: { minShapeCount: 10 },
    bonusDescription: 'Speed XP doubled',
    speedBonusMultiplier: 2.0,
  },
  {
    level: 16,
    name: 'Luminary',
    icon: '✨',
    xpRequired: 12000,
    shapeRequirement: { minGridSize: 5 },
    bonusDescription: '+20% all XP',
    xpMultiplier: 1.20,
  },
  {
    level: 17,
    name: 'Sage',
    icon: '🦉',
    xpRequired: 13600,
    shapeRequirement: { requiredShapeIds: ['star', 'crescent', 'heart'] },
  },
  {
    level: 18,
    name: 'Architect',
    icon: '🏛️',
    xpRequired: 15300,
    shapeRequirement: { minShapeCount: 12 },
  },
  {
    level: 19,
    name: 'Virtuoso',
    icon: '🎻',
    xpRequired: 17100,
    shapeRequirement: { minGridSize: 5, minShapeCount: 10 },
    bonusDescription: 'Streak step +0.10 total',
    streakStepBonus: 0.10,
  },
  {
    level: 20,
    name: 'Champion',
    icon: '🏆',
    xpRequired: 19000,
    bonusDescription: 'All bonuses ×1.5',
    xpMultiplier: 1.50,
    speedBonusMultiplier: 1.50,
  },
]

export function getLevelForXP(totalXP: number): LevelDefinition {
  let current = LEVELS[0]
  for (const level of LEVELS) {
    if (totalXP >= level.xpRequired) {
      current = level
    } else {
      break
    }
  }
  return current
}

export function getNextLevel(totalXP: number): LevelDefinition | null {
  const current = getLevelForXP(totalXP)
  const next = LEVELS.find((l) => l.level === current.level + 1)
  return next ?? null
}

export function xpToNextLevel(totalXP: number): number {
  const next = getNextLevel(totalXP)
  if (!next) return 0
  return Math.max(0, next.xpRequired - totalXP)
}

export function xpProgressInLevel(totalXP: number): number {
  const current = getLevelForXP(totalXP)
  return totalXP - current.xpRequired
}

export function xpRangeForLevel(level: number): number {
  const current = LEVELS.find((l) => l.level === level)
  const next = LEVELS.find((l) => l.level === level + 1)
  if (!current) return 0
  if (!next) return 1
  return next.xpRequired - current.xpRequired
}
