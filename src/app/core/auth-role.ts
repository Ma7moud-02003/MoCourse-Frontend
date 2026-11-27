// The token the backend sends is a JWT: three parts separated by dots, and the
// middle part is the "payload" - a small JSON object. For MoCourse it looks like
// { id: 3, role: "student", iat: ..., exp: ... }.
// These two small functions read that role and say where each role should land.

// Read the role from a token. Returns null when there is no token or it is broken.
export function roleFromToken(token: string | null): string | null {
  if (!token) return null;

  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    // The token is base64url (it uses - and _ instead of + and /), and the
    // browser's atob wants the normal characters plus the right padding.
    const normal = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normal + '='.repeat((4 - (normal.length % 4)) % 4);
    const data = JSON.parse(atob(padded));
    return typeof data.role === 'string' ? data.role : null;
  } catch {
    // A token we cannot read is the same as no role: fall back to the student page.
    return null;
  }
}

// Where each role goes right after login.
//   student    -> the courses page
//   Instructor -> the teacher area (the backend writes it with a capital I)
//   admin      -> the admin area
// Anything else goes to the courses page, so a missing role never leaves
// someone stuck on a blank screen.
export function homeForRole(role: string | null): string {
  switch ((role ?? '').toLowerCase()) {
    case 'instructor':
      return '/teacher';
    case 'admin':
      return '/admin';
    default:
      return '/courses';
  }
}
