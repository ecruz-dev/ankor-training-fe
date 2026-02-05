import { Box, Stack, Typography, Button } from "@mui/material";

type DrillsListHeaderProps = {
  totalCount: number;
  onCreate: () => void;
  onClear: () => void;
};

export default function DrillsListHeader({
  totalCount,
  onCreate,
  onClear,
}: DrillsListHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ sm: "center" }}
      justifyContent="space-between"
    >
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Drills
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {totalCount} drills
        </Typography>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button variant="contained" onClick={onCreate}>
          Create drill
        </Button>
        <Button variant="outlined" onClick={onClear}>
          Clear filters
        </Button>
      </Stack>
    </Stack>
  );
}
