export type RegistrationErrorCode = "INVALID_INPUT" | "EMAIL_TAKEN" | "SLUG_TAKEN";

export const REGISTRATION_MESSAGES: Record<RegistrationErrorCode, string> = {
  INVALID_INPUT: "Please check the highlighted fields",
  EMAIL_TAKEN: "Email already registered",
  SLUG_TAKEN: "Mentor slug already taken",
};

export type FieldErrors = Record<string, string[]>;

export class RegistrationError extends Error {
  constructor(
    public readonly code: RegistrationErrorCode,
    public readonly fields: FieldErrors = {},
  ) {
    super(REGISTRATION_MESSAGES[code]);
    this.name = "RegistrationError";
  }
}
