import * as React from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import AthleteFormFields from "../components/AthleteFormFields";
import {
  getAthleteById,
  updateAthlete,
  type AthleteListItem,
} from "../services/athleteService";
import {
  createInitialAthleteForm,
  toAthleteFormState,
  type AthleteFormState,
} from "../utils/athleteForm";
import { validateAthleteForm } from "../utils/validation";

export default function EditAthletePage() {
  const { id } = useParams<{ id: string }>();
  const athleteId = id ?? "";
  const navigate = useNavigate();
  const { orgId, loading: authLoading } = useAuth();
  const [form, setForm] = React.useState<AthleteFormState>(
    createInitialAthleteForm(),
  );
  const [parentFullName, setParentFullName] = React.useState("");
  const [parentEmail, setParentEmail] = React.useState("");
  const [parentMobilePhone, setParentMobilePhone] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [athlete, setAthlete] = React.useState<AthleteListItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const initializedRef = React.useRef(false);

  const toOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  React.useEffect(() => {
    initializedRef.current = false;
    setForm(createInitialAthleteForm());
    setParentFullName("");
    setParentEmail("");
    setParentMobilePhone("");
    setRelationship("");
    setErrors({});
    setSubmitError(null);
    setLoadError(null);
  }, [athleteId]);

  React.useEffect(() => {
    let active = true;

    const loadAthlete = async () => {
      if (authLoading) return;
      if (!athleteId) {
        setLoadError("Missing athlete id in route.");
        return;
      }
      if (!orgId) {
        setLoadError("Missing org_id. Please sign in again.");
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        const result = await getAthleteById(athleteId, { orgId });
        if (!active) return;
        setAthlete(result);
      } catch (err) {
        if (!active) return;
        setAthlete(null);
        setLoadError(
          err instanceof Error ? err.message : "Failed to load athlete.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadAthlete();

    return () => {
      active = false;
    };
  }, [athleteId, authLoading, orgId]);

  React.useEffect(() => {
    if (!athlete || initializedRef.current) return;
    setForm(toAthleteFormState(athlete));
    setParentFullName(athlete.parent_full_name ?? "");
    setParentEmail(athlete.parent_email ?? "");
    setParentMobilePhone(athlete.parent_mobile_phone ?? "");
    setRelationship(athlete.relationship ?? "");
    initializedRef.current = true;
  }, [athlete]);

  const handleChange = (field: keyof AthleteFormState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateAthleteForm(form, {
      requirePassword: false,
      requireUsername: false,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!athleteId) {
      setSubmitError("Missing athlete id in route.");
      return;
    }
    if (!orgId) {
      setSubmitError("Missing org_id. Please sign in again.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        full_name: [form.firstName, form.lastName].filter(Boolean).join(" ").trim(),
        cell_number: form.cellNumber.trim() || null,
        graduation_year: toOptionalNumber(form.graduationYear),
        parent_email: parentEmail.trim() || null,
        parent_full_name: parentFullName.trim() || null,
        parent_mobile_phone: parentMobilePhone.trim() || null,
        relationship: relationship.trim() || null,
      };

      const updated = await updateAthlete(athleteId, payload, { orgId });
      setAthlete(updated);
      setSubmitError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update athlete.";
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  };

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
              Edit Athlete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update athlete details.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate("/athletes")}>
              Back
            </Button>
            <Button type="submit" variant="contained" disabled={saving || loading}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading athlete details...
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

        <TextField
          label="User ID"
          value={athlete?.user_id ?? ""}
          fullWidth
          InputProps={{ readOnly: true }}
        />

        <AthleteFormFields
          form={form}
          errors={errors}
          onFieldChange={handleChange}
          showPassword={false}
          showUsername={false}
        >
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Parent/Guardian
            </Typography>
          </Box>
          <TextField
            label="Parent full name"
            value={parentFullName}
            onChange={(event) => setParentFullName(event.target.value)}
            error={Boolean(errors.parent_full_name)}
            helperText={errors.parent_full_name || "Optional"}
            fullWidth
          />
          <TextField
            label="Parent email"
            type="email"
            value={parentEmail}
            onChange={(event) => setParentEmail(event.target.value)}
            error={Boolean(errors.parent_email)}
            helperText={errors.parent_email || "Optional"}
            fullWidth
          />
          <TextField
            label="Parent mobile phone"
            value={parentMobilePhone}
            onChange={(event) => setParentMobilePhone(event.target.value)}
            error={Boolean(errors.parent_mobile_phone)}
            helperText={errors.parent_mobile_phone || "Optional"}
            fullWidth
          />
          <TextField
            label="Relationship"
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            error={Boolean(errors.relationship)}
            helperText={errors.relationship || "Optional"}
            fullWidth
          />
        </AthleteFormFields>
      </Stack>
    </Box>
  );
}
