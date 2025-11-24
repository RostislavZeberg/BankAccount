// components/Account/TransactionHistory.tsx
'use client'

import { useRouter } from 'next/router';
import { Transaction } from '../../types/interface';

interface TransactionHistoryProps {
  transactions: Transaction[];
  accountId: string;
}

export const TransactionHistory = ({ transactions, accountId }: TransactionHistoryProps) => {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleRowClick = () => {
    router.push(`/account/${accountId}/balance-history`);
  };

  // Берем последние 10 транзакций
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (recentTransactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">История операций</h2>
          <button
            onClick={handleRowClick}
            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Вся история →
          </button>
        </div>
        <div className="text-center py-6 sm:py-8 text-gray-500">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v1" />
          </svg>
          <p className="text-sm sm:text-base">Операций по счету не найдено</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">История операций</h2>
        <button
          onClick={handleRowClick}
          className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
        >
          Вся история →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">Дата</th>
              <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">Описание</th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentTransactions.map((transaction, index) => (
              <tr
                key={index}
                onClick={handleRowClick}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  {formatDate(transaction.date)}
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {transaction.from === accountId ? 'Перевод' : 'Поступление'}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">
                      {transaction.from === accountId 
                        ? `На счет: ${transaction.to}`
                        : `Со счета: ${transaction.from}`
                      }
                    </p>
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                  <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                    transaction.to === accountId ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.to === accountId ? '+' : '-'}
                    {formatCurrency(transaction.amount)} RUB
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500 gap-1 sm:gap-0">
          <span>Показано {recentTransactions.length} из {transactions.length} операций</span>
          <span>Последние 10 операций</span>
        </div>
      </div>
    </div>
  );
};