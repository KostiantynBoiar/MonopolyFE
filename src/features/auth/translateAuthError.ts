type AuthTranslator = (key: string) => string;

/**
 * Maps the machine-readable codes our zod schemas emit (e.g. `invalid_email`) onto
 * the `Auth.validation.*` i18n keys. Shared by LoginForm and RegisterForm — the map
 * is a superset, so a code that can't occur on one form is simply never looked up.
 */
const VALIDATION_KEY_MAP: Record<string, string> = {
  invalid_email: 'validation.invalidEmail',
  required: 'validation.required',
  max_128: 'validation.max128',
  password_min_8: 'validation.passwordMin8',
  display_name_min_2: 'validation.displayNameMin2',
  display_name_max_32: 'validation.displayNameMax32',
};

export function translateAuthError(t: AuthTranslator, message: string): string {
  const key = VALIDATION_KEY_MAP[message];
  return key ? t(key) : message;
}
