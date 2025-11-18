import jwt from "jsonwebtoken";
import type { SignOptions, JwtPayload, VerifyOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface AppJwtPayload extends JwtPayload {
  id: number;
  email: string;
}

export const SignToken = async (
  payload: AppJwtPayload,
  secret: string | Buffer,
  options?: SignOptions,
): Promise<string> => {
  const token = jwt.sign(payload, secret, {
    algorithm: options?.algorithm ?? "HS256",
    ...(options ?? {}),
  });
  console.log(token);
  return token.toString();
};

export function VerifyToken<T extends JwtPayload = AppJwtPayload>(
  token: string,
  secret: string | Buffer,
  options?: VerifyOptions,
): T {
  const decoded = jwt.verify(token, secret, options) as string | JwtPayload;
  return decoded as T;
}
