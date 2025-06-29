import jwt from 'jsonwebtoken';
import config from '../data/config';

export async function generateToken(user: any): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(user, config.jwt_secret, { expiresIn: '1h' }, (err, token) => {
            if (err) { // Change '1h' to '5m' for 5 minutes
        reject(err);
      } else if (token) {
        resolve(token);
      } else {
        reject(new Error('Token generation failed: token is undefined'));
      }
    });
  });
}

export async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Received token:', token); // Add this line

  if (token == null) {
    console.log('No token provided. Proceeding as unauthenticated.');
    req.user = undefined; // Ensure req.user is undefined if no token
    return next();
  }

  try {
    const user = await verifyToken(token); // Moved inside try block
    console.log('Token verified. User:', user); // Add this line
    req.user = user; // Moved inside try block
  } catch (err) {
    console.warn('Token invalid or expired. Proceeding as unauthenticated.', err);
    req.user = undefined; // Ensure req.user is undefined if token is invalid
  }
  next(); // Always call next to proceed
}

export async function verifyToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('Verifying token:', token); // Add this line
    jwt.verify(token, config.jwt_secret, (err, decoded) => {
      if (err) {
        console.error('jwt.verify error:', err); // Add this line
        reject(err);
      } else {
        console.log('jwt.verify successful. Decoded:', decoded); // Add this line
        resolve(decoded);
      }
    });
  });
}