import { Box, Button } from '@mui/material'

type NewEvaluationActionsProps = {
  showPastPanel: boolean
  onTogglePastPanel: () => void
  disablePastPanelToggle: boolean
  onSave: () => void
  saving: boolean
  disableSave: boolean
}

export default function NewEvaluationActions({
  showPastPanel,
  onTogglePastPanel,
  disablePastPanelToggle,
  onSave,
  saving,
  disableSave,
}: NewEvaluationActionsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Button
        variant={showPastPanel ? 'outlined' : 'text'}
        size="small"
        onClick={onTogglePastPanel}
        disabled={disablePastPanelToggle}
      >
        {showPastPanel ? 'Hide past evaluations' : 'Past evaluations'}
      </Button>

      <Button
        variant="contained"
        color="primary"
        onClick={onSave}
        disabled={saving || disableSave}
      >
        {saving ? 'Saving...' : 'Save evaluations'}
      </Button>
    </Box>
  )
}
