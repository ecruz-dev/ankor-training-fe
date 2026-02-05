export type EvaluationStatus = 'not_started' | 'in_progress' | 'completed'

export type EvaluationStatusColor = 'default' | 'warning' | 'success'

export type EvaluationStatusUi = {
  label: string
  color: EvaluationStatusColor
}

export function getEvaluationStatusUi(status?: string | null): EvaluationStatusUi {
  switch (status as EvaluationStatus) {
    case 'in_progress':
      return { label: 'In progress', color: 'warning' }
    case 'completed':
      return { label: 'Completed', color: 'success' }
    case 'not_started':
    default:
      return { label: 'Pending', color: 'default' }
  }
}
