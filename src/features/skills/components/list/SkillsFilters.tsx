import {
  Stack,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import { FILTER_ALL } from "../../constants";

type SkillsFiltersProps = {
  query: string;
  category: string;
  categories: string[];
  onQueryChange: (value: string) => void;
  onClearQuery: () => void;
  onCategoryChange: (value: string) => void;
};

export default function SkillsFilters({
  query,
  category,
  categories,
  onQueryChange,
  onClearQuery,
  onCategoryChange,
}: SkillsFiltersProps) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
      <TextField
        size="medium"
        placeholder="Search title, category, description, coaching pointsƒ?İ"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <Tooltip title="Clear search">
                <IconButton aria-label="clear" onClick={onClearQuery}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : undefined,
        }}
        sx={{ minWidth: { xs: "100%", sm: 380 } }}
      />

      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Filter category">
          <FilterListIcon fontSize="small" />
        </Tooltip>
        <Select
          size="small"
          value={category}
          onChange={(event) => onCategoryChange(String(event.target.value))}
          displayEmpty
        >
          <MenuItem value={FILTER_ALL}>All categories</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </Stack>
    </Stack>
  );
}
