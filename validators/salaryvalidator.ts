import z from "zod";

export const SalaryData = z.object({
  amount: z.number().min(1),
  issue_date: z.string()
});

export type SalaryDataInput = z.infer<typeof SalaryData>;
//////////////////////////////////
