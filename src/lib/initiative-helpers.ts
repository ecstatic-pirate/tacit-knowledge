// Initiative helper utilities for Mercedes AI Portfolio

export type InitiativeType = 'tool' | 'platform' | 'process' | 'integration'
export type InitiativeStatus = 'planned' | 'active' | 'scaling' | 'retired'
export type RoleType = 'management' | 'builder' | 'both'

// Maturity stage display mapping (DB → UI labels)
export const MATURITY_STAGES: Record<InitiativeStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  planned: { label: 'Pilot', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  active: { label: 'Scaling', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  scaling: { label: 'Production', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  retired: { label: 'Sunsetting', color: 'text-stone-500', bgColor: 'bg-stone-50', borderColor: 'border-stone-200' },
}

// Initiative type labels
export const INITIATIVE_TYPES: Record<InitiativeType, { label: string; icon: string }> = {
  tool: { label: 'Tool', icon: 'Wrench' },
  platform: { label: 'Platform', icon: 'Stack' },
  process: { label: 'Process', icon: 'ArrowsClockwise' },
  integration: { label: 'Integration', icon: 'Plugs' },
}

// Region options
export const REGIONS = [
  'Europe-Stuttgart',
  'North America',
  'Asia Pacific',
] as const

export type Region = typeof REGIONS[number]

// Expertise areas for onboarding
export const EXPERTISE_AREAS = [
  'Machine Learning',
  'NLP/LLMs',
  'Computer Vision',
  'Cloud Architecture',
  'MLOps/Deployment',
  'Process Automation',
  'Data Engineering',
  'Edge Computing',
  'Robotics',
  'Simulation',
] as const

// Get maturity display info
export function getMaturityInfo(status?: string) {
  if (!status || !(status in MATURITY_STAGES)) {
    return MATURITY_STAGES.planned
  }
  return MATURITY_STAGES[status as InitiativeStatus]
}

// Get initiative type label
export function getInitiativeTypeLabel(type?: string) {
  if (!type || !(type in INITIATIVE_TYPES)) return null
  return INITIATIVE_TYPES[type as InitiativeType].label
}

// Calculate time since last check-in
export function getCheckInStatus(lastCheckIn?: string): { label: string; isStale: boolean } {
  if (!lastCheckIn) return { label: 'Never', isStale: true }
  const days = Math.floor((Date.now() - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return { label: 'Today', isStale: false }
  if (days === 1) return { label: 'Yesterday', isStale: false }
  if (days < 14) return { label: `${days} days ago`, isStale: false }
  return { label: `${days} days ago`, isStale: true }
}

// Simple initiative similarity scoring
export function calculateSimilarity(
  a: { techStack?: string[]; businessUnit?: string; region?: string; initiativeStatus?: string },
  b: { techStack?: string[]; businessUnit?: string; region?: string; initiativeStatus?: string }
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Tech stack overlap: +20 per shared tech
  const sharedTech = (a.techStack ?? []).filter(t => (b.techStack ?? []).includes(t))
  if (sharedTech.length > 0) {
    score += sharedTech.length * 20
    reasons.push(`Shared tech: ${sharedTech.join(', ')}`)
  }

  // Same business unit: +15
  if (a.businessUnit && b.businessUnit && a.businessUnit === b.businessUnit) {
    score += 15
    reasons.push(`Same business unit: ${a.businessUnit}`)
  }

  // Same region: +10
  if (a.region && b.region && a.region === b.region) {
    score += 10
    reasons.push(`Same region: ${a.region}`)
  }

  // Same maturity stage: +5
  if (a.initiativeStatus && b.initiativeStatus && a.initiativeStatus === b.initiativeStatus) {
    score += 5
    reasons.push(`Same maturity stage`)
  }

  return { score, reasons }
}
