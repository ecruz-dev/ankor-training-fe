import { useEffect, useState } from 'react'
import { listScorecardTemplates } from '../../scorecards/services/scorecardService'
import { getAllTeams } from '../../teams/services/teamsService'
import type { ScorecardTemplate, TeamOption } from '../types'

export type UseEvaluationLookupsResult = {
  scorecards: ScorecardTemplate[]
  teams: TeamOption[]
}

export function useEvaluationLookups(orgId: string | null): UseEvaluationLookupsResult {
  const [scorecards, setScorecards] = useState<ScorecardTemplate[]>([])
  const [teams, setTeams] = useState<TeamOption[]>([])

  useEffect(() => {
    async function loadLookups() {
      if (!orgId) {
        setScorecards([])
        setTeams([])
        return
      }
      try {
        const templates = await listScorecardTemplates({
          orgId,
          limit: 50,
          offset: 0,
        })
        setScorecards(templates ?? [])
      } catch (err) {
        console.error('Failed to load scorecard templates', err)
      }

      try {
        const teamList = await getAllTeams({ orgId })
        const mappedTeams: TeamOption[] = (teamList ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
        }))
        setTeams(mappedTeams)
      } catch (err) {
        console.error('Failed to load teams', err)
      }
    }

    void loadLookups()
  }, [orgId])

  return { scorecards, teams }
}
