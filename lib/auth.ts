import { getOne, query } from './db';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface User {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  status: string;
  created_at: string;
  email_verified: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  full_name: string;
  company_name?: string;
}

interface AuthToken {
  token: string;
  user: User;
  expiresIn: number;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, expiresIn = '7d'): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return getOne(
    'SELECT id, email, full_name, company_name, status, created_at, email_verified FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  return getOne(
    'SELECT id, email, full_name, company_name, status, created_at, email_verified FROM users WHERE id = $1',
    [userId]
  );
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData): Promise<AuthToken> {
  const { email, password, full_name, company_name = '' } = data;

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Insert user
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name, company_name, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING id, email, full_name, company_name, status, created_at, email_verified`,
    [email.toLowerCase(), passwordHash, full_name, company_name]
  );

  const user = result.rows[0];
  const token = generateToken(user.id);

  return { token, user, expiresIn: 7 * 24 * 60 * 60 };
}

/**
 * Login user
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthToken> {
  const { email, password } = credentials;

  const result = await getOne(
    'SELECT id, email, full_name, company_name, status, created_at, email_verified, password_hash FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (!result) {
    throw new Error('Invalid credentials');
  }

  const isValid = await verifyPassword(password, result.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  if (result.status !== 'active') {
    throw new Error('User account is not active');
  }

  const user: User = {
    id: result.id,
    email: result.email,
    full_name: result.full_name,
    company_name: result.company_name,
    status: result.status,
    created_at: result.created_at,
    email_verified: result.email_verified,
  };

  const token = generateToken(user.id);

  // Update last_login_at
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

  return { token, user, expiresIn: 7 * 24 * 60 * 60 };
}

/**
 * Verify and get user from token
 */
export async function verifyUserFromToken(token: string): Promise<User | null> {
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  return getUserById(decoded.userId);
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<User> {
  const fields: string[] = [];
  const values: any[] = [userId];
  let paramIndex = 2;

  if (updates.full_name !== undefined) {
    fields.push(`full_name = $${paramIndex++}`);
    values.push(updates.full_name);
  }
  if (updates.company_name !== undefined) {
    fields.push(`company_name = $${paramIndex++}`);
    values.push(updates.company_name);
  }

  if (fields.length === 0) {
    return (await getUserById(userId))!;
  }

  const result = await query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = now() WHERE id = $1 RETURNING id, email, full_name, company_name, status, created_at, email_verified`,
    values
  );

  return result.rows[0];
}

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getUserByEmail,
  getUserById,
  registerUser,
  loginUser,
  verifyUserFromToken,
  updateUserProfile,
};
