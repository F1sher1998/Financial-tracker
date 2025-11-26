import z from "zod";

export const UserRegister = z.object({
  username: z.string().trim().max(20),
  password: z.string().min(6),
  email: z.string().email().trim(),
});

export type UserRegisterInput = z.infer<typeof UserRegister>;
///////////////////
export const UserLogin = z.object({
  email: z.string().email().trim(),
  password: z.string().min(6),
});

export type UserLoginInput = z.infer<typeof UserLogin>;
////////////////
