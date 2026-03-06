import * as React from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  athleteLabel,
  listAthletes,
  type AthleteListItem,
} from "../../athletes/services/athleteService";
import { createGuardian } from "../services/guardianService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewParentPage() {
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [addressLine1, setAddressLine1] = React.useState("");
  const [addressLine2, setAddressLine2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [athletes, setAthletes] = React.useState<AthleteListItem[]>([]);
  const [athletesLoading, setAthletesLoading] = React.useState(false);
  const [athletesError, setAthletesError] = React.useState<string | null>(null);
  const [selectedAthletes, setSelectedAthletes] = React.useState<
    AthleteListItem[]
  >([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedAthletes([]);
  }, [orgId]);

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

  const athleteOptions = React.useMemo(() => {
    return [...athletes].sort((a, b) =>
      athleteLabel(a).localeCompare(athleteLabel(b)),
    );
  }, [athletes]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      nextErrors.full_name = "Full name is required.";
    }
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    }
    if (!confirmPassword.trim()) {
      nextErrors.confirm_password = "Confirm your password.";
    } else if (password.trim() !== confirmPassword.trim()) {
      nextErrors.confirm_password = "Passwords do not match.";
    }
    if (selectedAthletes.length === 0) {
      nextErrors.athlete_ids = "Select at least one athlete.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      await createGuardian({
        org_id: orgId,
        athlete_ids: selectedAthletes.map((athlete) => athlete.id),
        full_name: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim() || null,
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        region: region.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country.trim() || null,
        relationship: relationship.trim() || null,
      });

      navigate("/parents");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create parent.";
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
              New Parent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a parent/guardian account and link it to athletes.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/parents")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </Stack>

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
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
                fullWidth
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
                helperText="Optional"
                fullWidth
              />
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Account
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={Boolean(errors.password)}
                helperText={errors.password}
                required
                fullWidth
              />
              <TextField
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={Boolean(errors.confirm_password)}
                helperText={errors.confirm_password}
                required
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
              onChange={(_, value) => setSelectedAthletes(value)}
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
    </Box>
  );
}
