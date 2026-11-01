export const ROLE_LABELS = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Researcher',
  WORKER: 'Worker',
};

/** Where each role lands after signing in. */
export function homePathFor(role) {
  if (role === 'SUPERADMIN') return '/superadmin';
  if (role === 'ADMIN') return '/admin';
  return '/worker';
}
