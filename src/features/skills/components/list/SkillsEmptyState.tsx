import { Box, Typography } from "@mui/material";

export default function SkillsEmptyState() {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h6">No skills match your search.</Typography>
      <Typography variant="body2" color="text.secondary">
        Try a different keyword or clear filters.
      </Typography>
    </Box>
  );
}
