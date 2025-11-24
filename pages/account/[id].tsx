// pages/account/[id].tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAccountById, transferFunds } from '../../services/api';
import { BalanceChart } from '../../components/Account/BalanceChart';
import { TransferForm } from '../../components/Account/TransferForm';
import { TransactionHistory } from '../../components/Account/TransactionHistory';
import { generateBalanceHistory } from '../../utils/balanceHistory';
import { AccountDetails } from '../../types/interface';

const AccountDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<ReturnType<typeof generateBalanceHistory>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTransferLoading] = useState(false); 

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        if (!id) return;

        setLoading(true);

        const accountData = await getAccountById(id as string);

        if (accountData && accountData.account) {
          setAccountDetails(accountData);
          const history = generateBalanceHistory(accountData);
          setBalanceHistory(history);
        } else {
          setError('Получены неверные данные счета');
        }
      } catch (err: unknown) {
        console.error('Error fetching account details:', err);

        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { status: number } };
          if (axiosError.response?.status === 404) {
            setError('Счет не найден');
          } else if (axiosError.response?.status === 401) {
            setError('Необходима авторизация');
            router.push('/login');
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Не удалось загрузить информацию о счете');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAccountDetails();
    }
  }, [id, router]);

  // Функция для выполнения перевода
  const handleTransfer = async (to: string, amount: number) => {
    if (!accountDetails) return;

    setTransferLoading(true);
    try {
      // Проверяем, достаточно ли средств
      if (amount > accountDetails.balance) {
        throw new Error('Недостаточно средств на счете');
      }

      await transferFunds(accountDetails.account, to, amount);

      // Обновляем данные счета после перевода
      const updatedAccount = await getAccountById(accountDetails.account);
      if (updatedAccount) {
        setAccountDetails(updatedAccount);

        // Обновляем историю баланса
        const history = generateBalanceHistory(updatedAccount);
        setBalanceHistory(history);
      }

      // Показываем уведомление об успехе
      alert(`Перевод на сумму ${formatCurrency(amount)} RUB выполнен успешно!`);
    } catch (err: unknown) {
      console.error('Transfer error:', err);

      let errorMessage = 'Неизвестная ошибка';

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      alert(`Ошибка перевода: ${errorMessage}`);
      throw err;
    } finally {
      setTransferLoading(false);
    }
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-2 space-y-8">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
            >
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!accountDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-yellow-600 font-medium">Счет не найден</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors cursor-pointer"
            >
              К списку счетов
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Назад
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Детали счета</h1>
          <div className="flex items-center space-x-4 text-gray-600">
            <p>Номер счета: <span className="font-mono font-semibold">{accountDetails.account}</span></p>
            <span className="text-gray-300">•</span>
            <p>Транзакций: <span className="font-semibold">{accountDetails.transactions?.length || 0}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Форма перевода и информация */}
          <div className="lg:col-span-1 space-y-6">
            {/* Форма перевода */}
            <TransferForm
              accountId={accountDetails.account}
              onTransfer={handleTransfer}
            />

            {/* Информация о счете */}
            <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Информация о счете</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(accountDetails.balance)} RUB
                  </p>
                  <p className="text-sm text-gray-500">Текущий баланс</p>
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Входящие операции:</span>
                    <span className="font-semibold text-green-600">
                      {accountDetails.transactions?.filter(t => t.to === accountDetails.account).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Исходящие операции:</span>
                    <span className="font-semibold text-red-600">
                      {accountDetails.transactions?.filter(t => t.from === accountDetails.account).length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - График и история */}
          <div className="lg:col-span-2 space-y-8">
            {/* График истории баланса */}
            <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">История баланса</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {balanceHistory.length} месяцев
                </span>
              </div>

              <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-6">
                <BalanceChart
                  data={balanceHistory}
                  accountId={accountDetails.account}
                  chartType="line"
                />
              </div>
            </div>

            {/* История транзакций */}
            <TransactionHistory
              transactions={accountDetails.transactions || []}
              accountId={accountDetails.account}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailPage;