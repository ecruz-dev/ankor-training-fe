import { Box, Button, Stack, Typography } from "@mui/material";

type SkillsListHeaderProps = {
  totalCount?: number;
  onCreate?: () => void;
  onClear?: () => void;
};

export default function SkillsListHeader({
  totalCount,
  onCreate,
  onClear,
}: SkillsListHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ sm: "center" }}
      justifyContent="space-between"
    >
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Skills
        </Typography>
        {typeof totalCount === "number" && (
          <Typography variant="body2" color="text.secondary">
            {totalCount} skills
          </Typography>
        )}
      </Box>
      {(onCreate || onClear) && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {onCreate && (
            <Button variant="contained" onClick={onCreate}>
              Create skill
            </Button>
          )}
          {onClear && (
            <Button variant="outlined" onClick={onClear}>
              Clear filters
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}
