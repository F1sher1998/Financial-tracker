import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface JwtPayload {
  id: number;
  email: string;
}

export const SignToken = async (
  payload: JwtPayload,
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
