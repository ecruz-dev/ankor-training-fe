import * as React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

type SkillRecordingControlsProps = {
  canRecord: boolean;
  recording: boolean;
  uploading: boolean;
  recordingError: string | null;
  uploadError: string | null;
  uploadedUrl: string | null;
  recordedUrl: string | null;
  onStart: () => void;
  onStop: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
};

export default function SkillRecordingControls({
  canRecord,
  recording,
  uploading,
  recordingError,
  uploadError,
  uploadedUrl,
  recordedUrl,
  onStart,
  onStop,
  videoRef,
}: SkillRecordingControlsProps) {
  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "center" }}
      >
        <Button
          variant={recording ? "contained" : "outlined"}
          color={recording ? "error" : "primary"}
          onClick={recording ? onStop : onStart}
          disabled={!canRecord || uploading}
        >
          {recording ? "Stop & upload" : "Record video"}
        </Button>

        {uploading && (
          <Typography variant="body2" color="text.secondary">
            Uploading video...
          </Typography>
        )}

        {!canRecord && (
          <Typography variant="body2" color="text.secondary">
            Recording requires a skill id and org id.
          </Typography>
        )}
      </Stack>

      {(recordingError || uploadError) && (
        <Typography color="error" variant="body2">
          {recordingError || uploadError}
        </Typography>
      )}

      {uploadedUrl && (
        <Typography variant="body2" color="text.secondary">
          Uploaded video attached to this skill.
        </Typography>
      )}

      <VideoPreviewBox
        label="Recorded video preview"
        recording={recording}
        recordedUrl={recordedUrl}
        videoRef={videoRef}
      />
    </Stack>
  );
}

function VideoPreviewBox({
  label,
  recording,
  recordedUrl,
  videoRef,
}: {
  label: string;
  recording: boolean;
  recordedUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
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
        {recording ? (
          <Box
            component="video"
            ref={videoRef}
            muted
            playsInline
            autoPlay
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
        ) : recordedUrl ? (
          <Box
            component="video"
            src={recordedUrl}
            controls
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
