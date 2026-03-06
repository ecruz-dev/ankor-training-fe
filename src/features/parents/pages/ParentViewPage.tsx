import * as React from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  getGuardianById,
  guardianLabel,
  type GuardianListItem,
} from "../services/guardianService";
import {
  athleteLabel,
  listAthletes,
  type AthleteListItem,
} from "../../athletes/services/athleteService";

const formatAddress = (guardian: GuardianListItem | null) => {
  if (!guardian) return "";
  const line1 = guardian.address_line1?.trim() ?? "";
  const line2 = guardian.address_line2?.trim() ?? "";
  const city = guardian.city?.trim() ?? "";
  const region = guardian.region?.trim() ?? "";
  const postal = guardian.postal_code?.trim() ?? "";
  const country = guardian.country?.trim() ?? "";

  const cityRegion = [city, region].filter(Boolean).join(", ");
  const cityRegionPostal = [cityRegion, postal].filter(Boolean).join(" ");
  const parts = [line1, line2, cityRegionPostal, country].filter(Boolean);
  return parts.join(", ");
};

export default function ParentViewPage() {
  const { id } = useParams<{ id: string }>();
  const guardianId = id ?? "";
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [guardian, setGuardian] = React.useState<GuardianListItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [athletes, setAthletes] = React.useState<AthleteListItem[]>([]);
  const [athletesError, setAthletesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const loadGuardian = async () => {
      if (authLoading) return;
      if (!guardianId) {
        setLoadError("Missing parent id in route.");
        return;
      }
      if (!orgId) {
        setLoadError("Missing org_id. Please sign in again.");
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        const result = await getGuardianById(guardianId, { orgId });
        if (!active) return;
        setGuardian(result);
      } catch (err) {
        if (!active) return;
        setGuardian(null);
        setLoadError(
          err instanceof Error ? err.message : "Failed to load parent.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadGuardian();

    return () => {
      active = false;
    };
  }, [guardianId, authLoading, orgId]);

  React.useEffect(() => {
    if (authLoading) return;
    let active = true;

    const resolvedOrgId = orgId?.trim() || "";
    if (!resolvedOrgId) {
      setAthletes([]);
      setAthletesError("Missing org_id. Please sign in again.");
      return () => {
        active = false;
      };
    }

    setAthletesError(null);

    listAthletes({ orgId: resolvedOrgId, limit: 200, offset: 0 })
      .then(({ items }) => {
        if (!active) return;
        setAthletes(items);
      })
      .catch((err: any) => {
        if (!active) return;
        setAthletes([]);
        setAthletesError(err?.message || "Failed to load athletes.");
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId]);

  const athleteMap = React.useMemo(() => {
    const map = new Map<string, AthleteListItem>();
    athletes.forEach((athlete) => {
      if (athlete.id) map.set(athlete.id, athlete);
    });
    return map;
  }, [athletes]);

  const parentName = guardian ? guardianLabel(guardian) : "Parent";
  const addressLabel = formatAddress(guardian);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Parent Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View parent/guardian details.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/parents")}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(`/parents/${guardianId}/edit`)}
              disabled={!guardianId}
            >
              Edit
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading parent details...
          </Typography>
        )}

        {loadError && (
          <Typography color="error" variant="body2">
            {loadError}
          </Typography>
        )}

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Parent Details
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Full name"
                value={parentName}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Email"
                value={guardian?.email ?? ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Phone"
                value={guardian?.phone ?? ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="User ID"
                value={guardian?.user_id ?? ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Address
            </Typography>
            <TextField
              label="Address"
              value={addressLabel}
              fullWidth
              multiline
              minRows={2}
              InputProps={{ readOnly: true }}
            />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Athletes
            </Typography>
            {athletesError && (
              <Typography variant="body2" color="error">
                {athletesError}
              </Typography>
            )}
            {guardian?.athletes?.length ? (
              <List disablePadding>
                {guardian.athletes.map((entry) => {
                  const athlete = athleteMap.get(entry.athlete_id);
                  const name = athlete ? athleteLabel(athlete) : entry.athlete_id;
                  const relationship = entry.relationship
                    ? `Relationship: ${entry.relationship}`
                    : "Relationship: —";
                  return (
                    <ListItem key={entry.athlete_id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={name}
                        secondary={relationship}
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No athletes linked to this parent.
              </Typography>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
