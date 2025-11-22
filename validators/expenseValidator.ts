import z from "zod";

export const ExpenseData = z.object({
  category: z.string(),
  date: z.string(),
  amount: z.number(),
});

export type ExpenseDataInput = z.infer<typeof ExpenseData>;
