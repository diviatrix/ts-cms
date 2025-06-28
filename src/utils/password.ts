import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // You can configure this in your config file if needed
  return bcrypt.hash(password, saltRounds);
}
