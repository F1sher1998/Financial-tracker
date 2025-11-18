import z from "zod";

export const UserRegister = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
});

export type UserRegisterInput = z.infer<typeof UserRegister>;

const user = UserRegister.parse({
  username: "user_01",
  password: "159753789",
  email: "user01@test.com",
});

console.log(user);
