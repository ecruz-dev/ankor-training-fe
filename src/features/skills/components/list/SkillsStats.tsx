import { Chip, Stack } from "@mui/material";
import { STATS_LIMIT } from "../../constants";
import type { SkillCategoryCount } from "../../types";

type SkillsStatsProps = {
  total: number;
  countsByCategory: SkillCategoryCount[];
  limit?: number;
};

export default function SkillsStats({
  total,
  countsByCategory,
  limit = STATS_LIMIT,
}: SkillsStatsProps) {
  return (
    <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap sx={{ mb: 2 }}>
      <Chip label={`Total: ${total}`} color="primary" variant="outlined" />
      {countsByCategory.slice(0, limit).map((entry) => (
        <Chip
          key={entry.category}
          label={`${entry.category}: ${entry.count}`}
          variant="outlined"
        />
      ))}
    </Stack>
  );
}
