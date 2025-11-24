// pages/account/[id]/balance-history.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAccountById } from '../../../services/api';
import { AccountDetails, Transaction } from '../../../types/interface';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BalanceHistoryItem {
  month: string;
  year: number;
  balance: number;
  monthKey: string;
  date: Date;
}

interface TransactionRatioItem {
  month: string;
  year: number;
  monthKey: string;
  date: Date;
  income: number;
  outcome: number;
  total: number;
  incomePercentage: number;
  outcomePercentage: number;
}

const BalanceHistoryPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryItem[]>([]);
  const [transactionRatio, setTransactionRatio] = useState<TransactionRatioItem[]>([]);
  const [sortedTransactions, setSortedTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transactionsPerPage = 25;

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        if (!id) return;

        setLoading(true);
        const accountData = await getAccountById(id as string);
        
        if (accountData && accountData.account) {
          setAccountDetails(accountData);
          
          // СОРТИРУЕМ ТРАНЗАКЦИИ И СОХРАНЯЕМ В ОТДЕЛЬНОЕ СОСТОЯНИЕ
          const sorted = [...(accountData.transactions || [])].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setSortedTransactions(sorted);
          
          // Генерируем историю баланса за 12 месяцев
          const history = generateBalanceHistory12Months(accountData);
          setBalanceHistory(history);
          
          // Генерируем данные для графика соотношения транзакций
          const ratioData = generateTransactionRatioData(accountData);
          setTransactionRatio(ratioData);
        } else {
          setError('Получены неверные данные счета');
        }
      } catch (err: unknown) {
        console.error('Error fetching account details:', err);
        setError('Не удалось загрузить информацию о счете');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAccountDetails();
    }
  }, [id]);

  // ИСПРАВЛЕННАЯ функция генерации истории баланса
  const generateBalanceHistory12Months = (account: AccountDetails): BalanceHistoryItem[] => {
    if (!account.transactions || account.transactions.length === 0) {
      console.log('Нет транзакций для генерации истории баланса');
      return [];
    }

    // Сортируем транзакции по дате (от старых к новым)
    const sortedTransactions = [...account.transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Получаем последние 12 месяцев
    const months: BalanceHistoryItem[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      months.push({
        month: date.toLocaleDateString('ru-RU', { month: 'short' }),
        year: date.getFullYear(),
        monthKey: monthKey,
        balance: 0,
        date
      });
    }

    // Создаем карту для хранения баланса по месяцам
    const monthlyBalances = new Map<string, number>();
    
    // Начинаем с текущего баланса и идем назад во времени
    let runningBalance = account.balance;
    
    // Проходим по транзакциям в обратном порядке (от новых к старым)
    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
      const transaction = sortedTransactions[i];
      const transactionDate = new Date(transaction.date);
      const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Отменяем транзакцию для получения баланса на начало месяца
      if (transaction.to === account.account) {
        runningBalance -= transaction.amount; // Отменяем приход
      } else if (transaction.from === account.account) {
        runningBalance += transaction.amount; // Отменяем расход
      }
      
      // Сохраняем баланс на начало месяца
      monthlyBalances.set(monthKey, runningBalance);
    }

    // Заполняем месяцы балансами
    const result = months.map(month => {
      const balance = monthlyBalances.get(month.monthKey) || account.balance;
      
      return {
        ...month,
        balance: Math.max(balance, 0) // Баланс не может быть отрицательным
      };
    });

    console.log('Сгенерированная история баланса:', result);
    return result;
  };

  // ИСПРАВЛЕННАЯ функция генерации данных для графика соотношения транзакций
  const generateTransactionRatioData = (account: AccountDetails): TransactionRatioItem[] => {
    if (!account.transactions || account.transactions.length === 0) {
      console.log('Нет транзакций для генерации соотношения');
      return [];
    }

    const months: TransactionRatioItem[] = [];
    const now = new Date();
    
    // Группируем транзакции по месяцам
    const monthlyTransactions = new Map<string, { income: number; outcome: number; total: number }>();
    
    // Создаем структуру для последних 12 месяцев
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      months.push({
        month: date.toLocaleDateString('ru-RU', { month: 'short' }),
        year: date.getFullYear(),
        monthKey: monthKey,
        date,
        income: 0,
        outcome: 0,
        total: 0,
        incomePercentage: 0,
        outcomePercentage: 0
      });
      
      monthlyTransactions.set(monthKey, {
        income: 0,
        outcome: 0,
        total: 0
      });
    }

    // Считаем транзакции по месяцам
    account.transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = monthlyTransactions.get(monthKey);
      if (monthData) {
        if (transaction.to === account.account) {
          // Входящая транзакция
          monthData.income += transaction.amount;
        } else if (transaction.from === account.account) {
          // Исходящая транзакция
          monthData.outcome += transaction.amount;
        }
        monthData.total = monthData.income + monthData.outcome;
      }
    });

    // Преобразуем в массив для графика
    const result = months.map(month => {
      const data = monthlyTransactions.get(month.monthKey) || { income: 0, outcome: 0, total: 0 };
      
      return {
        ...month,
        income: data.income,
        outcome: data.outcome,
        total: data.total,
        incomePercentage: data.total > 0 ? (data.income / data.total) * 100 : 0,
        outcomePercentage: data.total > 0 ? (data.outcome / data.total) * 100 : 0
      };
    });

    console.log('Сгенерированные данные соотношения:', result);
    return result;
  };

  // Компонент графика баланса с Chart.js
  const BalanceChart = ({ data }: { data: BalanceHistoryItem[] }) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 border border-gray-200 rounded-lg">
          Недостаточно данных для построения графика
        </div>
      );
    }

    const chartData = {
      labels: data.map(item => `${item.month} ${item.year}`),
      datasets: [
        {
          label: 'Баланс счета',
          data: data.map(item => item.balance),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
        },
      ],
    };

    const chartOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              if (value === null) return '';
              return `Баланс: ${formatBalance(value)} RUB`;
            }
          }
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12,
            },
          },
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12,
            },
            callback: function(value) {
              if (typeof value !== 'number') return '';
              return formatBalance(value);
            },
          },
        },
      },
    };

    const formatBalance = (balance: number) => {
      return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(balance);
    };

    return (
      <div className="w-full">
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
        
        {/* Статистика */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600 font-medium">Минимальный</div>
            <div className="text-lg font-bold text-blue-800">
              {formatBalance(Math.min(...data.map(d => d.balance)))} RUB
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600 font-medium">Текущий</div>
            <div className="text-lg font-bold text-green-800">
              {formatBalance(data[data.length - 1]?.balance || 0)} RUB
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600 font-medium">Максимальный</div>
            <div className="text-lg font-bold text-purple-800">
              {formatBalance(Math.max(...data.map(d => d.balance)))} RUB
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Компонент графика соотношения транзакций с Chart.js
  const TransactionRatioChart = ({ data }: { data: TransactionRatioItem[] }) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 border border-gray-200 rounded-lg">
          Недостаточно данных для построения графика
        </div>
      );
    }

    const chartData = {
      labels: data.map(item => `${item.month} ${item.year}`),
      datasets: [
        {
          label: 'Входящие транзакции',
          data: data.map(item => item.income),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(34, 197, 94, 1)',
        },
        {
          label: 'Исходящие транзакции',
          data: data.map(item => item.outcome),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(239, 68, 68, 1)',
        },
      ],
    };

    const chartOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: '#6B7280',
            font: {
              size: 12,
            },
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (value === null) return `${label}: 0.00 RUB`;
              return `${label}: ${formatCurrency(value)} RUB`;
            }
          }
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12,
            },
          },
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12,
            },
            callback: function(value) {
              if (typeof value !== 'number') return '';
              return formatCurrency(value);
            },
          },
        },
      },
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // Рассчитываем общую статистику
    const totalIncome = data.reduce((sum, month) => sum + month.income, 0);
    const totalOutcome = data.reduce((sum, month) => sum + month.outcome, 0);
    const totalTransactions = totalIncome + totalOutcome;

    return (
      <div className="w-full">
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
        
        {/* Статистика */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600 font-medium">Всего приход</div>
            <div className="text-lg font-bold text-green-800">
              {formatCurrency(totalIncome)} RUB
            </div>
            <div className="text-xs text-green-500 mt-1">
              {totalTransactions > 0 ? ((totalIncome / totalTransactions) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-sm text-red-600 font-medium">Всего расход</div>
            <div className="text-lg font-bold text-red-800">
              {formatCurrency(totalOutcome)} RUB
            </div>
            <div className="text-xs text-red-500 mt-1">
              {totalTransactions > 0 ? ((totalOutcome / totalTransactions) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 font-medium">Общий оборот</div>
            <div className="text-lg font-bold text-gray-800">
              {formatCurrency(totalTransactions)} RUB
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.length} месяцев
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ПАГИНАЦИЯ ТРАНЗАКЦИЙ
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = sortedTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  
  const totalPages = Math.ceil(sortedTransactions.length / transactionsPerPage);

  // Функция для обработки изменения страницы
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Прокрутка к верху таблицы при смене страницы
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-8">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !accountDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 font-medium">{error || 'Счет не найден'}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Заголовок и навигация */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/account/${id}`)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors font-medium cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Вернуться к счету
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">История баланса</h1>
          <div className="flex items-center space-x-4 text-gray-600">
            <p>Номер счета: <span className="font-mono font-semibold">{accountDetails?.account}</span></p>
            <span className="text-gray-300">•</span>
            <p>Транзакций: <span className="font-semibold">{sortedTransactions.length}</span></p>
          </div>
        </div>

        <div className="space-y-8">
          {/* График динамики баланса */}
          <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Динамика баланса за 12 месяцев</h2>
            <BalanceChart data={balanceHistory} />
          </div>

          {/* График соотношения транзакций */}
          <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Соотношение входящих и исходящих транзакций</h2>
            <TransactionRatioChart data={transactionRatio} />
          </div>

          {/* История переводов с пагинацией */}
          <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">История переводов</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Показано {currentTransactions.length} из {sortedTransactions.length}
                </span>
                <span className="text-sm text-gray-500">
                  Страница {currentPage} из {totalPages}
                </span>
              </div>
            </div>

            {currentTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v1" />
                </svg>
                <p className="text-lg">Транзакций нет</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Дата</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Тип операции</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Счет</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Сумма</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentTransactions.map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.to === accountDetails?.account 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.to === accountDetails?.account ? 'Приход' : 'Расход'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {transaction.to === accountDetails?.account 
                                  ? `От: ${transaction.from}`
                                  : `Кому: ${transaction.to}`
                                }
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-sm font-semibold ${
                              transaction.to === accountDetails?.account 
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {transaction.to === accountDetails?.account ? '+' : '-'}
                              {formatCurrency(transaction.amount)} RUB
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      ← Назад
                    </button>
                    
                    {/* Показываем только несколько страниц вокруг текущей */}
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 border text-sm rounded transition-colors cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      Вперед →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceHistoryPage;