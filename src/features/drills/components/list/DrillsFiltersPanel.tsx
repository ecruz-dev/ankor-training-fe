import * as React from "react";
import {
  Stack,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Divider,
  Chip,
  Button,
  Collapse,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { DrillTag } from "../../services/drillsService";
import type { SegmentOption } from "../../utils/options";
import type { DrillFilterField, DrillFilters } from "../../types";

type DrillsFiltersPanelProps = {
  query: string;
  filters: DrillFilters;
  segmentOptions: SegmentOption[];
  segmentsLoading: boolean;
  segmentsError: string | null;
  tagOptions: DrillTag[];
  tagsLoading: boolean;
  tagsError: string | null;
  levelOptions: Array<{ id: string; label: string }>;
  onQueryChange: (value: string) => void;
  onFilterChange: (field: DrillFilterField, value: string) => void;
  onToggleTag: (tagId: string) => void;
  onToggleLevel: (levelId: string) => void;
};

export default function DrillsFiltersPanel({
  query,
  filters,
  segmentOptions,
  segmentsLoading,
  segmentsError,
  tagOptions,
  tagsLoading,
  tagsError,
  levelOptions,
  onQueryChange,
  onFilterChange,
  onToggleTag,
  onToggleLevel,
}: DrillsFiltersPanelProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const handleFilterChange =
    (field: DrillFilterField) => (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange(field, event.target.value);
    };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack spacing={2}>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Segment
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={filters.segmentId}
              onChange={handleFilterChange("segmentId")}
              error={Boolean(segmentsError)}
              helperText={
                segmentsError ||
                (segmentsLoading ? "Loading segments..." : undefined)
              }
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">All segments</MenuItem>
              {segmentOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Level
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {levelOptions.map((level) => {
                const active = filters.levels.has(level.id);
                return (
                  <Chip
                    key={level.id}
                    label={level.label}
                    size="small"
                    color={active ? "primary" : "default"}
                    variant={active ? "filled" : "outlined"}
                    onClick={() => onToggleLevel(level.id)}
                  />
                );
              })}
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" color="text.secondary">
              Advanced filters
            </Typography>
            <Button
              size="small"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: "none" }}
              aria-expanded={showAdvancedFilters}
              aria-controls="drills-advanced-filters"
            >
              {showAdvancedFilters ? "Hide" : "Show"}
            </Button>
          </Stack>

          <Collapse in={showAdvancedFilters} timeout="auto" unmountOnExit>
            <Stack spacing={2} id="drills-advanced-filters" sx={{ pt: 0.5 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Age range
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Min"
                    type="number"
                    size="small"
                    value={filters.minAge}
                    onChange={handleFilterChange("minAge")}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                  <TextField
                    label="Max"
                    type="number"
                    size="small"
                    value={filters.maxAge}
                    onChange={handleFilterChange("maxAge")}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Stack>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Players
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Min"
                    type="number"
                    size="small"
                    value={filters.minPlayers}
                    onChange={handleFilterChange("minPlayers")}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                  <TextField
                    label="Max"
                    type="number"
                    size="small"
                    value={filters.maxPlayers}
                    onChange={handleFilterChange("maxPlayers")}
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Stack>
              </Stack>
            </Stack>
          </Collapse>
        </Stack>

        <Divider />

        <TextField
          fullWidth
          size="small"
          placeholder="Search drills"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Divider />

        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <Typography variant="subtitle2" color="text.secondary">
            Tags
          </Typography>
          {tagsLoading && tagOptions.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              Loading tags...
            </Typography>
          )}
          {!tagsLoading && tagsError && (
            <Typography variant="caption" color="error">
              {tagsError}
            </Typography>
          )}
          {!tagsLoading && !tagsError && tagOptions.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              No tags available
            </Typography>
          )}
          {tagOptions.map((tag) => {
            const active = filters.tags.has(tag.id);
            return (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                color={active ? "primary" : "default"}
                variant={active ? "filled" : "outlined"}
                onClick={() => onToggleTag(tag.id)}
              />
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}
