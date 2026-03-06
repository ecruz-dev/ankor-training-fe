import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  athleteLabel,
  listAthletes,
  type AthleteListItem,
} from "../../athletes/services/athleteService";
import {
  getGuardianById,
  updateGuardian,
  type GuardianListItem,
} from "../services/guardianService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const makePlaceholderAthlete = (athleteId: string): AthleteListItem => ({
  id: athleteId,
  org_id: null,
  user_id: null,
  first_name: null,
  last_name: null,
  full_name: "Unknown athlete",
  email: null,
  phone: null,
  cell_number: null,
  graduation_year: null,
  teams: [],
});

export default function EditParentPage() {
  const { id } = useParams<{ id: string }>();
  const guardianId = id ?? "";
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [guardian, setGuardian] = React.useState<GuardianListItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [athletes, setAthletes] = React.useState<AthleteListItem[]>([]);
  const [athletesLoading, setAthletesLoading] = React.useState(false);
  const [athletesError, setAthletesError] = React.useState<string | null>(null);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [addressLine1, setAddressLine1] = React.useState("");
  const [addressLine2, setAddressLine2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [selectedAthleteIds, setSelectedAthleteIds] = React.useState<string[]>(
    [],
  );
  const [initialAthleteIds, setInitialAthleteIds] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [toastOpen, setToastOpen] = React.useState(false);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    initializedRef.current = false;
    setGuardian(null);
    setLoadError(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setRelationship("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setRegion("");
    setPostalCode("");
    setCountry("");
    setSelectedAthleteIds([]);
    setInitialAthleteIds([]);
    setErrors({});
    setSubmitError(null);
    setToastOpen(false);
  }, [guardianId]);

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
      setAthletesLoading(false);
      return () => {
        active = false;
      };
    }

    setAthletesLoading(true);
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
      })
      .finally(() => {
        if (active) setAthletesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, orgId]);

  React.useEffect(() => {
    if (!guardian || initializedRef.current) return;
    setFullName(guardian.full_name ?? "");
    setEmail(guardian.email ?? "");
    setPhone(guardian.phone ?? "");
    setAddressLine1(guardian.address_line1 ?? "");
    setAddressLine2(guardian.address_line2 ?? "");
    setCity(guardian.city ?? "");
    setRegion(guardian.region ?? "");
    setPostalCode(guardian.postal_code ?? "");
    setCountry(guardian.country ?? "");
    const athleteIds = guardian.athletes
      .map((entry) => entry.athlete_id)
      .filter(Boolean);
    setSelectedAthleteIds(athleteIds);
    setInitialAthleteIds(athleteIds);

    const relationships = guardian.athletes
      .map((entry) => entry.relationship?.trim())
      .filter((value): value is string => Boolean(value));
    const uniqueRelationships = Array.from(new Set(relationships));
    setRelationship(uniqueRelationships.length === 1 ? uniqueRelationships[0] : "");

    initializedRef.current = true;
  }, [guardian]);

  const athleteOptions = React.useMemo(() => {
    return [...athletes].sort((a, b) =>
      athleteLabel(a).localeCompare(athleteLabel(b)),
    );
  }, [athletes]);

  const athleteMap = React.useMemo(() => {
    const map = new Map<string, AthleteListItem>();
    athleteOptions.forEach((athlete) => {
      if (athlete.id) map.set(athlete.id, athlete);
    });
    return map;
  }, [athleteOptions]);

  const selectedAthletes = React.useMemo(() => {
    return selectedAthleteIds.map((idValue) => {
      return athleteMap.get(idValue) ?? makePlaceholderAthlete(idValue);
    });
  }, [selectedAthleteIds, athleteMap]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      nextErrors.full_name = "Full name is required.";
    }
    if (selectedAthleteIds.length === 0) {
      nextErrors.athlete_ids = "Select at least one athlete.";
    }

    const trimmedRelationship = relationship.trim();
    const initialSet = new Set(initialAthleteIds);
    const addedAthleteIds = selectedAthleteIds.filter(
      (idValue) => !initialSet.has(idValue),
    );
    if (addedAthleteIds.length > 0 && !trimmedRelationship) {
      nextErrors.relationship =
        "Relationship is required for newly added athletes.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!guardianId) {
      setSubmitError("Missing parent id in route.");
      return;
    }
    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      const initialSet = new Set(initialAthleteIds);
      const selectedSet = new Set(selectedAthleteIds);
      const addAthleteIds = selectedAthleteIds.filter(
        (idValue) => !initialSet.has(idValue),
      );
      const removeAthleteIds = initialAthleteIds.filter(
        (idValue) => !selectedSet.has(idValue),
      );
      const trimmedRelationship = relationship.trim();

      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        region: region.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country.trim() || null,
        ...(addAthleteIds.length > 0
          ? {
              add_athletes: addAthleteIds.map((athleteId) => ({
                athlete_id: athleteId,
                relationship: trimmedRelationship || null,
              })),
            }
          : {}),
        ...(removeAthleteIds.length > 0
          ? { remove_athlete_ids: removeAthleteIds }
          : {}),
      };

      const updated = await updateGuardian(guardianId, payload, { orgId });
      setGuardian(updated);
      setSubmitError(null);
      setToastOpen(true);
      const refreshedIds = updated.athletes
        .map((entry) => entry.athlete_id)
        .filter(Boolean);
      setInitialAthleteIds(refreshedIds);
      setSelectedAthleteIds(refreshedIds);
      if (addAthleteIds.length > 0) {
        setRelationship("");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update parent.";
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  };

  const athleteHelperText = errors.athlete_ids
    ? errors.athlete_ids
    : athletesError
      ? athletesError
      : athletesLoading
        ? "Loading athletes..."
        : "Select one or more athletes.";

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack
        spacing={3}
        component="form"
        onSubmit={handleSubmit}
        sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Edit Parent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update parent/guardian details.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/parents")}>
              Back
            </Button>
            <Button type="submit" variant="contained" disabled={saving || loading}>
              {saving ? "Saving..." : "Update"}
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

        {submitError && (
          <Typography color="error" variant="body2">
            {submitError}
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
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                error={Boolean(errors.full_name)}
                helperText={errors.full_name}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={email}
                helperText={
                  email && emailRegex.test(email.trim())
                    ? "Email cannot be edited here."
                    : "Email cannot be edited here."
                }
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                helperText="Optional"
                fullWidth
              />
              <TextField
                label="Relationship"
                value={relationship}
                onChange={(event) => setRelationship(event.target.value)}
                error={Boolean(errors.relationship)}
                helperText={
                  errors.relationship ||
                  "Applies to newly added athletes."
                }
                fullWidth
              />
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Athletes
            </Typography>
            <Autocomplete
              multiple
              options={athleteOptions}
              value={selectedAthletes}
              onChange={(_, value) =>
                setSelectedAthleteIds(value.map((athlete) => athlete.id))
              }
              loading={athletesLoading}
              getOptionLabel={(option) => athleteLabel(option)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={athleteLabel(option)}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select athletes"
                  placeholder="Select one or more athletes"
                  error={Boolean(errors.athlete_ids || athletesError)}
                  helperText={athleteHelperText}
                />
              )}
              disabled={Boolean(athletesError)}
            />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Address
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Address line 1"
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
                helperText="Optional"
                fullWidth
              />
              <TextField
                label="Address line 2"
                value={addressLine2}
                onChange={(event) => setAddressLine2(event.target.value)}
                helperText="Optional"
                fullWidth
              />
              <TextField
                label="City"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                helperText="Optional"
                fullWidth
              />
              <TextField
                label="State/Region"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                helperText="Optional"
                fullWidth
              />
              <TextField
                label="Postal code"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                helperText="Optional"
                fullWidth
              />
              <TextField
                label="Country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                helperText="Optional"
                fullWidth
              />
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Parent record saved successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
}
