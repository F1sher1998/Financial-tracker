export interface SalaryBreakdown {
  week: number;
  month: number;
  quarter: number;
  year: number;
}

const calcSalary = async (amount: number): Promise<SalaryBreakdown> => {
  const base = amount;

  const week = Math.ceil(base / 4);
  const month = Math.ceil(base);
  const quarter = Math.ceil(base * 3);
  const year = Math.ceil(base * 12);

  return { week, month, quarter, year };
};

export const calcsalaryAsync = async (
  amount: number,
): Promise<SalaryBreakdown> => {
  return calcSalary(amount);
};
