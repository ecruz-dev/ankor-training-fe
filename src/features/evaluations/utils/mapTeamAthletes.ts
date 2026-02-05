import type { TeamAthlete } from '../../teams/services/teamsService'
import type { Athlete } from '../types'

export function mapTeamAthletesToAthletes(rows: TeamAthlete[]): Athlete[] {
  return (rows ?? [])
    .filter((row) => row?.id)
    .map((row) => {
      const fallbackName = [row.first_name, row.last_name]
        .filter(Boolean)
        .join(' ')
      const fullName = (row.full_name ?? fallbackName) || 'Unnamed athlete'

      return {
        id: row.id,
        full_name: fullName,
        team_id: row.team_id,
        position: row.position ?? null,
      }
    })
}
