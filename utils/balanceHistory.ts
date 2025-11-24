// utils/balanceHistory.ts

import { AccountDetails, BalanceHistory } from "../types/interface";

export const generateBalanceHistory = (account: AccountDetails): BalanceHistory[] => {
  if (!account.transactions || account.transactions.length === 0) {
    return [];
  }

  // Сортируем транзакции по дате (от старых к новым)
  const sortedTransactions = [...account.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Получаем последние 6 месяцев
  const months: BalanceHistory[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: date.toLocaleDateString('ru-RU', { month: 'short' }),
      year: date.getFullYear(),
      balance: 0,
    });
  }

  // Симулируем историю баланса
  let runningBalance = 0;
  const monthlyBalances = new Map();

  // Проходим по всем транзакциям и вычисляем баланс на конец каждого месяца
  sortedTransactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    const monthKey = transactionDate.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
    
    // Обновляем баланс
    if (transaction.to === account.account) {
      runningBalance += transaction.amount;
    } else if (transaction.from === account.account) {
      runningBalance -= transaction.amount;
    }
    
    // Сохраняем баланс на конец месяца транзакции
    monthlyBalances.set(monthKey, runningBalance);
  });

  // Заполняем данные по месяцам
  const result = months.map(month => {
    const monthKey = `${month.month} ${month.year}`;
    const balance = monthlyBalances.get(monthKey) || 0;
    
    return {
      ...month,
      balance: balance > 0 ? balance : account.balance // fallback на текущий баланс
    };
  });

  // Если все балансы нулевые, используем текущий баланс для последнего месяца
  if (result.every(m => m.balance === 0)) {
    result[result.length - 1].balance = account.balance;
  }

  return result.filter(month => month.balance > 0);
};