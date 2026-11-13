import { RegistrationError, FieldErrors } from "./errors";
import { userRepository, User } from "../users/userRepository";
import { lengthBetween, matches, validate } from "../validation/rules";
import { EMAIL_PATTERN } from "../validation/patterns";
import {
  MentorValidationEngineFactory,
  cloneValidationPayload,
} from "./mentorValidationEngine";

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  mentorSlug?: string;
  hourlyRatePln?: number;
}

/**
 * Registers a new user or mentor in the Mentoria platform.
 * Normalizes input fields, runs validation rules, and persists the entity in the repository.
 */
export function registerUser(rawInput: RegisterInput): User {
  // Clone input payload to ensure immutability across the registration pipeline
  const input = cloneValidationPayload(rawInput);

  // Step 1: Normalize email and username strings
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();

  // Step 2: Validate base registration fields
  const fields: FieldErrors = {};
  const emailErrors = validate(email, [matches(EMAIL_PATTERN, "must be a valid email")]);
  const passwordErrors = validate(input.password, [lengthBetween(8, 72)]);
  if (emailErrors.length) fields.email = emailErrors;
  if (passwordErrors.length) fields.password = passwordErrors;

  // Step 3: Validate optional mentor profile fields if provided
  const hasMentorSlug = input.mentorSlug !== undefined;
  const hasHourlyRate = input.hourlyRatePln !== undefined;
  let normalizedMentorSlug: string | undefined;

  if (hasMentorSlug || hasHourlyRate) {
    const mentorEngine = MentorValidationEngineFactory.createDefaultEngine();

    if (!hasMentorSlug) {
      fields.mentorSlug = ["is required when registering as a mentor"];
    } else {
      normalizedMentorSlug = input.mentorSlug!.trim();
      const slugErrors = mentorEngine.validateSlug(normalizedMentorSlug);
      if (slugErrors.length) fields.mentorSlug = slugErrors;
    }

    if (!hasHourlyRate) {
      fields.hourlyRatePln = ["is required when registering as a mentor"];
    } else {
      const rateErrors = mentorEngine.validateHourlyRate(input.hourlyRatePln!);
      if (rateErrors.length) fields.hourlyRatePln = rateErrors;
    }
  }

  // Step 4: Throw validation error if any field failed validation
  if (Object.keys(fields).length) {
    throw new RegistrationError("INVALID_INPUT", fields);
  }

  // Step 5: Check uniqueness constraints in the repository
  if (userRepository.findByEmail(email)) {
    throw new RegistrationError("EMAIL_TAKEN");
  }

  if (normalizedMentorSlug && userRepository.findByMentorSlug(normalizedMentorSlug)) {
    throw new RegistrationError("SLUG_TAKEN");
  }

  // Step 6: Persist and return the created user record
  return userRepository.create({
    email,
    username,
    ...(normalizedMentorSlug
      ? { mentorSlug: normalizedMentorSlug, hourlyRatePln: input.hourlyRatePln }
      : {}),
  });
}
