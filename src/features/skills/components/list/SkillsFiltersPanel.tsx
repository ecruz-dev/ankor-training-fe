import {
  Stack,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Divider,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { SkillListFilters } from "../../types";

type SkillsFiltersPanelProps = {
  query: string;
  filters: SkillListFilters;
  categoryOptions: string[];
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

export default function SkillsFiltersPanel({
  query,
  filters,
  categoryOptions,
  onQueryChange,
  onCategoryChange,
}: SkillsFiltersPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Category
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={filters.category}
            onChange={(event) => onCategoryChange(String(event.target.value))}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All categories</MenuItem>
            {categoryOptions.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Divider />

        <TextField
          fullWidth
          size="small"
          placeholder="Search skills"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Paper>
  );
}
