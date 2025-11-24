// pages/currency.tsx

'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAllCurrencies, getMyCurrencies, buyCurrency, createCurrencyWebSocket } from '../services/api';
import { ExchangeRateMessage } from '../types/interface';

interface CurrencyBalance {
  amount: number;
  code: string;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  change: number;
}

export default function CurrencyPage() {
  const router = useRouter();
  const [currencyBalances, setCurrencyBalances] = useState<Record<string, CurrencyBalance>>({});
  const [allCurrencies, setAllCurrencies] = useState<string[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);

  // Состояние для формы обмена
  const [exchangeForm, setExchangeForm] = useState({
    from: '',
    to: '',
    amount: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Загружаем список всех валют
        const currencies = await getAllCurrencies();
        setAllCurrencies(currencies);
        
        // Загружаем балансы валют
        const balances = await getMyCurrencies();
        console.log('Currency balances:', balances);
        setCurrencyBalances(balances || {});
        
      } catch (err: unknown) {
        console.error('Error fetching currency data:', err);
        setError('Не удалось загрузить данные о валютах');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // WebSocket для обновления курсов валют
  useEffect(() => {
    let ws: WebSocket;
    
    try {
      ws = createCurrencyWebSocket();
      
      ws.onopen = () => {
        console.log('WebSocket connected for currency feed');
      };
      
      ws.onmessage = (event) => {
        try {
          const data: ExchangeRateMessage = JSON.parse(event.data);
          
          if (data.type === 'EXCHANGE_RATE_CHANGE') {
            setExchangeRates(prev => {
              const existingIndex = prev.findIndex(rate => 
                rate.from === data.from && rate.to === data.to
              );
              
              if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                  from: data.from,
                  to: data.to,
                  rate: data.rate,
                  change: data.change
                };
                return updated;
              } else {
                return [...prev, {
                  from: data.from,
                  to: data.to,
                  rate: data.rate,
                  change: data.change
                }];
              }
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Обработчик обмена валют
  const handleCurrencyExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exchangeForm.from || !exchangeForm.to || !exchangeForm.amount) {
      alert('Заполните все поля');
      return;
    }

    const amount = parseFloat(exchangeForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную положительную сумму');
      return;
    }

    // Проверяем достаточно ли средств (с защитой от undefined)
    const fromBalance = currencyBalances[exchangeForm.from]?.amount || 0;
    if (amount > fromBalance) {
      alert(`Недостаточно средств. Доступно: ${fromBalance} ${exchangeForm.from}`);
      return;
    }

    setExchangeLoading(true);
    try {
      await buyCurrency(exchangeForm.from, exchangeForm.to, amount);
      
      // Обновляем балансы после успешного обмена
      const updatedBalances = await getMyCurrencies();
      setCurrencyBalances(updatedBalances || {});
      
      alert(`Обмен выполнен успешно! ${amount} ${exchangeForm.from} → ${exchangeForm.to}`);
      
      // Сбрасываем форму
      setExchangeForm({
        from: '',
        to: '',
        amount: ''
      });
      
    } catch (err: unknown) {
      console.error('Currency exchange error:', err);
      
      let errorMessage = 'Неизвестная ошибка при обмене';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      alert(`Ошибка обмена: ${errorMessage}`);
    } finally {
      setExchangeLoading(false);
    }
  };

  // Фильтруем валюты с ненулевым балансом (с защитой от undefined)
  const nonZeroBalances = Object.values(currencyBalances || {}).filter(balance => 
    balance && balance.amount > 0
  );

  const formatCurrency = (amount: number, code: string) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount) + ' ' + code;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
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
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Назад
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Валютные инструменты</h1>
          <p className="text-gray-600">
            Управление валютными счетами и обмен валют
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Балансы и обмен валют */}
          <div className="lg:col-span-2 space-y-8">
            {/* Валютные балансы */}
            <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Мои валютные счета</h2>
              
              {nonZeroBalances.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0-1v1" />
                  </svg>
                  <p className="text-lg">Нет активных валютных счетов</p>
                  <p className="text-sm mt-2">Балансы по валютам появятся после операций</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nonZeroBalances.map((balance) => (
                    <div
                      key={balance.code}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-semibold text-gray-900">{balance.code}</span>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Валюта
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(balance.amount, balance.code)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Форма обмена валют */}
            <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Обмен валют</h2>
              
              <form onSubmit={handleCurrencyExchange} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Валюта списания */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Отдаете
                    </label>
                    <select
                      value={exchangeForm.from}
                      onChange={(e) => setExchangeForm(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Выберите валюту</option>
                      {allCurrencies.map(currency => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                    {exchangeForm.from && currencyBalances[exchangeForm.from] && (
                      <p className="text-sm text-gray-500 mt-1">
                        Доступно: {formatCurrency(currencyBalances[exchangeForm.from].amount, exchangeForm.from)}
                      </p>
                    )}
                  </div>

                  {/* Валюта получения */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Получаете
                    </label>
                    <select
                      value={exchangeForm.to}
                      onChange={(e) => setExchangeForm(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Выберите валюту</option>
                      {allCurrencies
                        .filter(currency => currency !== exchangeForm.from)
                        .map(currency => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Сумма */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сумма
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={exchangeForm.amount}
                      onChange={(e) => setExchangeForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Кнопка обмена */}
                <button
                  type="submit"
                  disabled={exchangeLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {exchangeLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Выполняется обмен...
                    </div>
                  ) : (
                    'Обменять валюту'
                  )}
                </button>
              </form>

              {/* Информация о курсе */}
              {exchangeForm.from && exchangeForm.to && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Курс обмена будет рассчитан в момент выполнения операции
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - Курсы валют */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Курсы валют</h2>
              
              {exchangeRates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p>Ожидание обновления курсов...</p>
                  <p className="text-sm mt-2">Курсы появятся здесь в реальном времени</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exchangeRates.slice(0, 10).map((rate) => (
                    <div
                      key={`${rate.from}-${rate.to}`}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-900">
                          {rate.from}/{rate.to}
                        </span>
                        <span className="text-sm text-gray-600">
                          {rate.rate.toFixed(4)}
                        </span>
                      </div>
                      <div className={`flex items-center space-x-1 ${
                        rate.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {rate.change > 0 ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                        <span className="text-sm font-medium">
                          {rate.change > 0 ? '+' : ''}{rate.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Курсы обновляются в реальном времени
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}