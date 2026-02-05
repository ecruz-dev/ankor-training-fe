import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Paper,
  Grid,
  Chip,
  InputAdornment,
  MenuItem,
  Divider,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import LinkIcon from "@mui/icons-material/Link";
import type { DrillTag } from "../services/drillsService";
import type { SegmentOption } from "../utils/options";
import type { DrillFormState } from "../utils/drillForm";
import { toYouTubeThumbnailFromId } from "../utils/youtube";

type DrillFormFieldsProps = {
  form: DrillFormState;
  errors: Record<string, string>;
  segmentOptions: SegmentOption[];
  segmentsLoading: boolean;
  segmentsError: string | null;
  tagOptions: DrillTag[];
  tagsLoading: boolean;
  tagsError: string | null;
  youtubeId: string | null;
  onFieldChange: (
    field: keyof DrillFormState,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSkillTagsChange: (nextTags: DrillTag[]) => void;
  videoExtras?: React.ReactNode;
};

export default function DrillFormFields({
  form,
  errors,
  segmentOptions,
  segmentsLoading,
  segmentsError,
  tagOptions,
  tagsLoading,
  tagsError,
  youtubeId,
  onFieldChange,
  onSkillTagsChange,
  videoExtras,
}: DrillFormFieldsProps) {
  return (
    <>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            Basics
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Drill name"
              value={form.name}
              onChange={onFieldChange("name")}
              required
              fullWidth
              error={Boolean(errors.name)}
              helperText={errors.name}
            />
            <TextField
              select
              label="Segment"
              value={form.segmentId}
              onChange={onFieldChange("segmentId")}
              required
              fullWidth
              error={Boolean(errors.segmentId || segmentsError)}
              helperText={
                errors.segmentId ||
                segmentsError ||
                (segmentsLoading ? "Loading segments..." : undefined)
              }
              SelectProps={{
                MenuProps: { PaperProps: { sx: { minWidth: 320 } } },
              }}
            >
              {segmentsLoading && segmentOptions.length === 0 && (
                <MenuItem value="" disabled>
                  Loading segments...
                </MenuItem>
              )}
              {!segmentsLoading && segmentOptions.length === 0 && (
                <MenuItem value="" disabled>
                  No segments available
                </MenuItem>
              )}
              {segmentOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              value={form.description}
              onChange={onFieldChange("description")}
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            Players and Ages
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Min players"
                value={form.minPlayers}
                onChange={onFieldChange("minPlayers")}
                type="number"
                inputProps={{ min: 0 }}
                fullWidth
                error={Boolean(errors.minPlayers)}
                helperText={errors.minPlayers}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Max players"
                value={form.maxPlayers}
                onChange={onFieldChange("maxPlayers")}
                type="number"
                inputProps={{ min: 0 }}
                fullWidth
                error={Boolean(errors.maxPlayers)}
                helperText={errors.maxPlayers}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Min age"
                value={form.minAge}
                onChange={onFieldChange("minAge")}
                type="number"
                inputProps={{ min: 0 }}
                fullWidth
                error={Boolean(errors.minAge)}
                helperText={errors.minAge}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Max age"
                value={form.maxAge}
                onChange={onFieldChange("maxAge")}
                type="number"
                inputProps={{ min: 0 }}
                fullWidth
                error={Boolean(errors.maxAge)}
                helperText={errors.maxAge}
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            Skill tags
          </Typography>
          <Autocomplete
            multiple
            options={tagOptions}
            value={form.skillTags}
            onChange={(_, value) => onSkillTagsChange(value)}
            loading={tagsLoading}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.name}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add skill tags"
                placeholder="Select one or more tags"
                error={Boolean(tagsError)}
                helperText={tagsError ? "Failed to load tags." : undefined}
              />
            )}
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            Video
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              label="YouTube URL"
              value={form.youtubeUrl}
              onChange={onFieldChange("youtubeUrl")}
              fullWidth
              error={Boolean(errors.youtubeUrl)}
              helperText={errors.youtubeUrl || "Paste a YouTube link."}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <PreviewBox
              label="YouTube preview"
              imageUrl={toYouTubeThumbnailFromId(youtubeId)}
            />

            {videoExtras ? (
              <>
                <Divider />
                {videoExtras}
              </>
            ) : null}
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}

function PreviewBox({
  label,
  imageUrl,
}: {
  label: string;
  imageUrl?: string | null;
}) {
  return (
    <Box
      sx={{
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 2,
        p: 1,
        textAlign: "center",
        color: "text.secondary",
      }}
    >
      <Box sx={{ position: "relative", paddingTop: "56.25%" }}>
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={label}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption">{label}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
