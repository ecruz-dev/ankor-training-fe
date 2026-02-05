import { Stack, Typography, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

type ScorecardTemplateHeaderProps = {
  templateId?: string;
  onBack: () => void;
};

export default function ScorecardTemplateHeader({
  templateId,
  onBack,
}: ScorecardTemplateHeaderProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
      <IconButton onClick={onBack} size="small">
        <ArrowBackIosNewIcon fontSize="small" />
      </IconButton>
      <Typography variant="h5" fontWeight={600}>
        {templateId === "new" ? "New Scorecard Template" : "Scorecard Template Detail"}
      </Typography>
    </Stack>
  );
}
