// Template-based check-in questions per maturity stage

export interface CheckInQuestion {
  id: string
  question: string
  type: 'text' | 'select'
  options?: string[]
  required?: boolean
}

export interface CheckInTemplate {
  stage: string
  label: string
  description: string
  questions: CheckInQuestion[]
}

export const CHECK_IN_TEMPLATES: Record<string, CheckInTemplate> = {
  planned: {
    stage: 'planned',
    label: 'Pilot Check-in',
    description: 'Help us understand how the pilot is progressing.',
    questions: [
      {
        id: 'progress',
        question: 'How would you describe the current progress of this pilot?',
        type: 'select',
        options: ['On track', 'Minor delays', 'Significant blockers', 'Ahead of schedule'],
        required: true,
      },
      {
        id: 'blockers',
        question: 'What are the main blockers or challenges you are facing?',
        type: 'text',
      },
      {
        id: 'ready_to_scale',
        question: 'How ready is this initiative to move to scaling?',
        type: 'select',
        options: ['Not yet', 'Needs 1-2 more months', 'Almost ready', 'Ready now'],
      },
      {
        id: 'notes',
        question: 'Any additional notes or updates?',
        type: 'text',
      },
    ],
  },
  active: {
    stage: 'active',
    label: 'Scaling Check-in',
    description: 'Update on the scaling progress of this initiative.',
    questions: [
      {
        id: 'pilot_results',
        question: 'What were the key results from the pilot phase?',
        type: 'text',
        required: true,
      },
      {
        id: 'team_changes',
        question: 'Have there been any team changes since the last check-in?',
        type: 'select',
        options: ['No changes', 'Team grew', 'Team shrank', 'Key member changes'],
      },
      {
        id: 'production_readiness',
        question: 'How close is this to production readiness?',
        type: 'select',
        options: ['Early scaling', 'Mid scaling', 'Near production', 'Production ready'],
        required: true,
      },
      {
        id: 'notes',
        question: 'Any additional notes or updates?',
        type: 'text',
      },
    ],
  },
  scaling: {
    stage: 'scaling',
    label: 'Production Check-in',
    description: 'Status update on the production deployment.',
    questions: [
      {
        id: 'deployment_status',
        question: 'What is the current deployment status?',
        type: 'select',
        options: ['Rolling out', 'Partially deployed', 'Fully deployed', 'Monitoring phase'],
        required: true,
      },
      {
        id: 'key_metrics',
        question: 'What are the key performance metrics so far?',
        type: 'text',
        required: true,
      },
      {
        id: 'expansion_plans',
        question: 'Are there plans to expand to other regions or teams?',
        type: 'select',
        options: ['No plans', 'Under discussion', 'Planned for next quarter', 'Already expanding'],
      },
      {
        id: 'notes',
        question: 'Any additional notes or updates?',
        type: 'text',
      },
    ],
  },
  retired: {
    stage: 'retired',
    label: 'Sunsetting Check-in',
    description: 'Final documentation and knowledge capture.',
    questions: [
      {
        id: 'lessons_learned',
        question: 'What were the key lessons learned from this initiative?',
        type: 'text',
        required: true,
      },
      {
        id: 'documentation_status',
        question: 'Is the documentation complete?',
        type: 'select',
        options: ['Not started', 'In progress', 'Mostly complete', 'Fully documented'],
        required: true,
      },
      {
        id: 'knowledge_transfer',
        question: 'Has knowledge been transferred to relevant teams?',
        type: 'select',
        options: ['Not yet', 'Partially', 'Yes, fully transferred'],
      },
      {
        id: 'notes',
        question: 'Any additional notes or final thoughts?',
        type: 'text',
      },
    ],
  },
}

export function getCheckInTemplate(initiativeStatus?: string): CheckInTemplate {
  if (!initiativeStatus || !(initiativeStatus in CHECK_IN_TEMPLATES)) {
    return CHECK_IN_TEMPLATES.planned
  }
  return CHECK_IN_TEMPLATES[initiativeStatus]
}
