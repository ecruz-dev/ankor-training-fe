import { Button, Stack, Typography } from '@mui/material'

type EvaluationsListHeaderProps = {
  isMobile: boolean
  onCreate: () => void
}

export default function EvaluationsListHeader({
  isMobile,
  onCreate,
}: EvaluationsListHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ xs: 1.5, sm: 0 }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
    >
      <Typography variant="h5" fontWeight={700}>
        Evaluations
      </Typography>

      <Button fullWidth={isMobile} variant="contained" onClick={onCreate}>
        Create Evaluation
      </Button>
    </Stack>
  )
}
