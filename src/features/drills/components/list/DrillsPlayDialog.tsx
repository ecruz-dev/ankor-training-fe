import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type DrillsPlayDialogProps = {
  open: boolean;
  drillName?: string | null;
  loading: boolean;
  error: string | null;
  playUrl: string | null;
  onClose: () => void;
};

export default function DrillsPlayDialog({
  open,
  drillName,
  loading,
  error,
  playUrl,
  onClose,
}: DrillsPlayDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6, position: "relative" }}>
        {drillName ?? "Drill video"}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box
            sx={{
              minHeight: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        ) : playUrl ? (
          <Box
            component="video"
            key={playUrl}
            src={playUrl}
            controls
            autoPlay
            playsInline
            sx={{
              width: "100%",
              maxHeight: "70vh",
              display: "block",
              bgcolor: "grey.900",
            }}
          />
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No playable media available.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
