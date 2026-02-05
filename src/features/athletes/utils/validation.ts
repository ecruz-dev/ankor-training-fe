import type { AthleteFormState } from "./athleteForm";

type AthleteValidationOptions = {
  requirePassword?: boolean;
  requireUsername?: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAthleteForm(
  form: AthleteFormState,
  options: AthleteValidationOptions = {},
) {
  const errors: Record<string, string> = {};
  const requirePassword = options.requirePassword ?? true;
  const requireUsername = options.requireUsername ?? true;

  if (!form.firstName.trim()) {
    errors.first_name = "First name is required.";
  }

  if (!form.lastName.trim()) {
    errors.last_name = "Last name is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailRegex.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (requireUsername && !form.username.trim()) {
    errors.username = "Username is required.";
  }

  if (requirePassword && !form.password.trim()) {
    errors.password = "Password is required.";
  }

  if (form.graduationYear.trim()) {
    const n = Number(form.graduationYear.trim());
    if (!Number.isFinite(n)) {
      errors.graduation_year = "Graduation year must be a number.";
    }
  }

  return errors;
}
