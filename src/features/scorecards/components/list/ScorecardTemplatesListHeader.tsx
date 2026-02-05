import { Stack, Typography } from "@mui/material";

export default function ScorecardTemplatesListHeader() {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 2 }}
    >
      <Typography variant="h5" fontWeight={700}>
        Score Card Templates
      </Typography>
    </Stack>
  );
}
