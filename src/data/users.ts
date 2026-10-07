export type UserKey = 'standard' | 'locked';

export const users = {
  standard: { username: 'standard_user', password: 'lagom2026', firstName: 'Alva' },
  locked: { username: 'locked_user', password: 'lagom2026', firstName: 'Nils' },
} as const;
