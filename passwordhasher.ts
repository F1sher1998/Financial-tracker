import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
  const hashed = await bcrypt.hash(password, 10);
  console.log(hashed);
  return hashed;
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  const verify = await bcrypt.compare(password, hashedPassword);
  if (verify !== true) {
    return false;
  }
  return true;
};

//hashPassword("159753789");
//
verifyPassword(
  "159753789",
  "$2b$10$ycd5KtmrOds.r9EMiXDO0uJwFZ5Zwret72ZzmR9ifYmiZ.jE2WDFG",
);
