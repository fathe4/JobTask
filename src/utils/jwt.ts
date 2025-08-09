import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  sub: string; // userId
  role?: string;
}

export function signAccessToken(userId: string, role?: string): string {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  const options: SignOptions = {
    expiresIn: "15m",
  };

  const payload: any = { sub: userId };
  if (role) {
    payload.role = role;
  }

  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(userId: string): string {
  const secret =
    process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me";
  const options: SignOptions = {
    expiresIn: "7d",
  };

  const payload = { sub: userId };
  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  return jwt.verify(token, secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret =
    process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me";
  return jwt.verify(token, secret) as JwtPayload;
}
