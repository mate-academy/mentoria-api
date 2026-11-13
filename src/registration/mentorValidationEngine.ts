/**
 * @fileoverview Enterprise-grade validation strategy engine for Mentoria mentor registration.
 * Provides an extensible, decoupled, object-oriented validation architecture following
 * the Strategy and Factory design patterns to support future mentor tiers and rules.
 */

/**
 * Generic interface representing a validation strategy contract.
 */
export interface IValidationStrategy<TInput> {
  /**
   * Executes the validation logic for the given input value.
   * @param {TInput} value - The input value to validate.
   * @returns {string[]} An array of validation error messages, or an empty array if valid.
   */
  validateValue(value: TInput): string[];
}

/**
 * Abstract base class for all field validation handlers in the mentor subsystem.
 */
export abstract class BaseValidationHandler<TInput> implements IValidationStrategy<TInput> {
  protected readonly errors: string[] = [];

  /**
   * Validates the provided value by delegating to concrete strategy implementations.
   */
  public abstract validateValue(value: TInput): string[];

  /**
   * Helper method to defensively check whether a value is defined.
   */
  protected isDefined(value: unknown): boolean {
    return value !== undefined && value !== null;
  }
}

/**
 * Deeply clones a validation payload to prevent accidental mutation during pipeline execution.
 */
export function cloneValidationPayload<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload)) as T;
}

/**
 * Concrete validation strategy for mentor URL slugs.
 */
export class MentorSlugValidationStrategy extends BaseValidationHandler<string> {
  private static readonly SLUG_REGEX = /^[a-z0-9-]+$/;
  private static readonly RESERVED_SLUGS = ["admin", "api", "mentors", "settings"];

  public validateValue(value: string): string[] {
    const collectedErrors: string[] = [];

    // Defensively verify runtime type of the slug string
    if (typeof value !== "string") {
      collectedErrors.push("must be a valid string");
      return collectedErrors;
    }

    // Step 1: Validate slug length constraints (3 to 30 characters)
    if (value.length < 3 || value.length > 30) {
      collectedErrors.push("must be between 3 and 30 characters");
    }

    // Step 2: Validate slug format against regular expression pattern
    if (!MentorSlugValidationStrategy.SLUG_REGEX.test(value)) {
      collectedErrors.push("must contain only lowercase letters, numbers, and hyphens");
    }

    // Step 3: Ensure slug is not in the reserved system paths list
    if (MentorSlugValidationStrategy.RESERVED_SLUGS.includes(value)) {
      collectedErrors.push("is reserved");
    }

    return collectedErrors;
  }
}

/**
 * Concrete validation strategy for mentor hourly rate in PLN.
 */
export class HourlyRateValidationStrategy extends BaseValidationHandler<number> {
  private static readonly MIN_RATE = 50;
  private static readonly MAX_RATE = 1000;

  public validateValue(value: number): string[] {
    const collectedErrors: string[] = [];

    // Defensively verify runtime type of the hourly rate number
    if (typeof value !== "number" || Number.isNaN(value)) {
      collectedErrors.push("must be a valid number");
      return collectedErrors;
    }

    // Validate that the rate falls within the allowed range (50 to 1000 PLN)
    if (
      value <= HourlyRateValidationStrategy.MIN_RATE ||
      value >= HourlyRateValidationStrategy.MAX_RATE
    ) {
      collectedErrors.push("must be an integer between 50 and 1000");
    }

    return collectedErrors;
  }
}

/**
 * Orchestrates mentor registration validation strategies.
 */
export class MentorValidationEngine {
  constructor(
    private readonly slugStrategy: IValidationStrategy<string>,
    private readonly rateStrategy: IValidationStrategy<number>,
  ) {}

  public validateSlug(slug: string): string[] {
    return this.slugStrategy.validateValue(slug);
  }

  public validateHourlyRate(rate: number): string[] {
    return this.rateStrategy.validateValue(rate);
  }
}

/**
 * Factory for instantiating the default MentorValidationEngine with standard strategies.
 */
export class MentorValidationEngineFactory {
  public static createDefaultEngine(): MentorValidationEngine {
    return new MentorValidationEngine(
      new MentorSlugValidationStrategy(),
      new HourlyRateValidationStrategy(),
    );
  }
}

