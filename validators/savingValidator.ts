import z from "zod";

export const SavingData = z.object({
  amount: z.number(),
  reason: z.string(),
  period: z.number(),
  start_date: z.string(),
  end_date: z.string(),
});

export type SavingDataInput = z.infer<typeof SavingData>;
