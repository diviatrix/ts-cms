import jwt from 'jsonwebtoken';
import config from '../data/config';
import IJwtPayload from '../types/IJwtPayload';
import IResolve from '../types/IResolve';
import prep from '../utils/prepare';

export async function generateToken(user: IJwtPayload): Promise<IResolve<string>> {
  return new Promise((resolve) => {
    jwt.sign(user, config.jwt_secret, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        resolve(prep.response(false, 'Token generation failed', "undefined"));
      } else if (token) {
        resolve(prep.response(true, 'Token generated successfully', token));
      } else {
        resolve(prep.response(false, 'Token generation failed: token is undefined', "undefined"));
      }
    });
  });
}

export async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    req.user = undefined; // Ensure req.user is undefined if no token
    return next();
  }

  const verificationResult = await verifyToken(token);

  if (verificationResult.success && verificationResult.data) {
    req.user = verificationResult.data; // Set req.user if token is valid
  } else {
    req.user = undefined; // Ensure req.user is undefined if token is invalid or expired
  }
  next(); // Always call next to proceed
}

export async function verifyToken(token: string): Promise<IResolve<IJwtPayload | undefined>> {
  return new Promise((resolve) => {
    jwt.verify(token, config.jwt_secret, (err, decoded) => {
      if (err) {
        resolve(prep.response(false, 'Token verification failed', undefined));
      } else {
        resolve(prep.response(true, 'Token verified successfully', decoded as IJwtPayload));
      }
    });
  });
}