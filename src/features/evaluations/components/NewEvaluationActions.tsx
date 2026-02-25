import { Box, Button } from '@mui/material'

type NewEvaluationActionsProps = {
  onSave: () => void
  saving: boolean
  disableSave: boolean
}

export default function NewEvaluationActions({
  onSave,
  saving,
  disableSave,
}: NewEvaluationActionsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
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
