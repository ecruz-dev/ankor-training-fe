export const POSITION_OPTIONS = [
  { label: 'Attack', value: 'attack' },
  { label: 'Midfield', value: 'midfield' },
  { label: 'Defense', value: 'defense' },
  { label: 'Goalie', value: 'goalie' },
] as const

export type PositionOption = (typeof POSITION_OPTIONS)[number]
