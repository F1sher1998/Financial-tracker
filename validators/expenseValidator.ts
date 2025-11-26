import z from "zod";

export const ExpenseData = z.object({
  amount: z.number().min(1),
  date: z.string(),
  category: z.string().min(3)
});

export type ExpenseDataInput = z.infer<typeof ExpenseData>;
