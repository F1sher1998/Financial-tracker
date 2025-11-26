interface SalaryPayload{
  weekly: number,
  monthly:number,
  quarterly: number,
  yearly: number
}


export const CalculateSalary = async (amount: number): Promise<SalaryPayload> => {
  const week = amount / 4;
  const month = amount;
  const quarter = amount * 3;
  const year = amount * 12;

  return {weekly: week, monthly: month, quarterly:quarter, yearly: year}
}
