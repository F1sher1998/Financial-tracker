export interface SalaryBreakdown {
  week: number;
  month: number;
  quarter: number;
  year: number;
}

const calcSalary = async (amount: number): Promise<SalaryBreakdown> => {
  const base = amount;

  const week = base / 4;
  const month = base;
  const quarter = base * 3;
  const year = base * 12;

  return { week, month, quarter, year };
};

export const calcsalaryAsync = async (
  amount: number,
): Promise<SalaryBreakdown> => {
  return calcSalary(amount);
};
