import { homeForRole, roleFromToken } from './auth-role';

// A token is three parts; only the middle one matters here.
// This builds a fake one so the test does not need a real login.
function tokenWith(payload: object): string {
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${body}.signature`;
}

describe('roleFromToken', () => {
  it('reads the role the backend put in the token', () => {
    expect(roleFromToken(tokenWith({ id: 3, role: 'student' }))).toBe('student');
    expect(roleFromToken(tokenWith({ id: 4, role: 'Instructor' }))).toBe('Instructor');
    expect(roleFromToken(tokenWith({ id: 1, role: 'admin' }))).toBe('admin');
  });

  it('gives null when there is no token or it is broken', () => {
    expect(roleFromToken(null)).toBeNull();
    expect(roleFromToken('')).toBeNull();
    expect(roleFromToken('not-a-token')).toBeNull();
    expect(roleFromToken('a.%%%.c')).toBeNull();
  });

  it('gives null when the token has no role inside', () => {
    expect(roleFromToken(tokenWith({ id: 3 }))).toBeNull();
  });
});

describe('homeForRole', () => {
  it('sends a student to the courses page', () => {
    expect(homeForRole('student')).toBe('/courses');
  });

  it('sends a teacher to the teacher area, whatever the capitalisation', () => {
    expect(homeForRole('Instructor')).toBe('/teacher');
    expect(homeForRole('instructor')).toBe('/teacher');
  });

  it('sends an admin to the admin area', () => {
    expect(homeForRole('admin')).toBe('/admin');
  });

  it('falls back to the courses page when the role is missing', () => {
    expect(homeForRole(null)).toBe('/courses');
    expect(homeForRole('something-new')).toBe('/courses');
  });
});
