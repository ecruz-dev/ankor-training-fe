import { Stack, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

type ScorecardTemplatesListFiltersProps = {
  searchText: string;
  onSearchChange: (value: string) => void;
};

export default function ScorecardTemplatesListFilters({
  searchText,
  onSearchChange,
}: ScorecardTemplatesListFiltersProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ xs: "stretch", sm: "center" }}
      sx={{ mb: 1 }}
    >
      <TextField
        size="small"
        placeholder="Search name, description, creator"
        value={searchText}
        onChange={(event) => onSearchChange(event.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: 280, maxWidth: 420 }}
      />
    </Stack>
  );
}
