
import {
  registerSchema,
  signInSchema,
} from './schemas';

describe('Authentication validation', () => {
  test('accepts valid registration details', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      level: 'junior',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  test('rejects an invalid email address', () => {
    const result = signInSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });

  test('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      level: 'junior',
      email: 'john@example.com',
      password: 'pass1',
    });

    expect(result.success).toBe(false);
  });

  test('rejects an invalid developer level', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      level: 'beginner',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });
});
