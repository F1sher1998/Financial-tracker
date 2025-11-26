import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
  const hashed = await bcrypt.hash(password, 10);
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



///////////////////////////////////////////////////////////////////


export const hashToken = async (token: string): Promise<string> => {
  const hashed = await bcrypt.hash(token, 10);
  return hashed;
};



// const password = await hashPassword("159753789");
// console.log(password)
const verified = await verifyPassword("159753789", "$2b$10$dXeU5YO.5LyhZV5f/OTeyetCWVdYHJkcxk1dzmAvfuaonm0.zQ1Da");
console.log(verified)
