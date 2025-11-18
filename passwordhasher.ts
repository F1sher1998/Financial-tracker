import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
  const hashed = await bcrypt.hash(password, 10);
  console.log(hashed);
  return hashed;
};

hashPassword("foahbgoaewboigieba");
