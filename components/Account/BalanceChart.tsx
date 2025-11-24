// components/Account/BalanceChart.tsx
'use client'

import { useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { BalanceHistory } from '../../types/interface';

// Регистрируем необходимые компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BalanceChartProps {
  data: BalanceHistory[];
  accountId: string;
  chartType?: 'line' | 'bar';
}

export const BalanceChart = ({ data, accountId, chartType = 'line' }: BalanceChartProps) => {
  const router = useRouter();
  const lineChartRef = useRef<ChartJS<'line'>>(null);
  const barChartRef = useRef<ChartJS<'bar'>>(null);

  const handleChartClick = () => {
    router.push(`/account/${accountId}/balance-history`);
  };

  // Настройки для Chart.js
  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
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
            size: 10,
          },
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 10,
          },
          callback: function(value) {
            if (typeof value !== 'number') return '';
            return formatBalance(value);
          },
        },
      },
    },
    onClick: handleChartClick,
    onHover: (event, elements) => {
      const canvas = event.native?.target as HTMLCanvasElement;
      if (canvas) {
        canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
      }
    },
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance);
  };

  // Подготавливаем данные для графика
  const chartData = {
    labels: data.map(item => `${item.month} ${item.year}`),
    datasets: [
      {
        label: 'Баланс счета',
        data: data.map(item => item.balance),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: chartType === 'line' 
          ? 'rgba(59, 130, 246, 0.1)'
          : 'rgba(59, 130, 246, 0.8)',
        fill: chartType === 'line',
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  if (data.length === 0) {
    return (
      <div 
        onClick={handleChartClick}
        className="flex items-center justify-center h-48 sm:h-64 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="text-center px-4">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-base sm:text-lg font-medium mb-1">Недостаточно данных</p>
          <p className="text-xs sm:text-sm text-gray-400">Нет данных для построения графика баланса</p>
          <p className="text-xs text-blue-500 mt-2">Нажмите для просмотра детальной истории</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
        <h3 className="text-lg font-semibold text-gray-900">Динамика баланса</h3>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500">Период:</span>
          <span className="font-medium text-gray-700">
            {data.length} {data.length === 1 ? 'месяц' : data.length < 5 ? 'месяца' : 'месяцев'}
          </span>
        </div>
      </div>

      <div 
        className="relative h-48 sm:h-64 w-full cursor-pointer hover:opacity-90 transition-opacity bg-white rounded-lg p-3 sm:p-4 border border-gray-100"
        onClick={handleChartClick}
      >
        {chartType === 'line' ? (
          <Line 
            ref={lineChartRef}
            data={chartData} 
            options={chartOptions}
          />
        ) : (
          <Bar 
            ref={barChartRef}
            data={chartData} 
            options={chartOptions}
          />
        )}
        
        {/* Водяной знак для клика */}
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex items-center space-x-1 text-blue-600 text-xs font-medium opacity-0 hover:opacity-100 transition-opacity">
          <span className="hidden sm:inline">Подробнее</span>
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>

      {/* Легенда и статистика */}
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              chartType === 'line' ? 'bg-blue-500' : 'bg-blue-500'
            }`}></div>
            <span className="text-sm text-gray-600">Баланс счета (RUB)</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-4 text-sm text-gray-600 w-full sm:w-auto justify-between sm:justify-normal">
          <div className="text-center">
            <div className="text-xs text-gray-400">Текущий</div>
            <div className="font-semibold text-green-600 text-sm sm:text-base">
              {formatBalance(data[data.length - 1]?.balance || 0)} RUB
            </div>
          </div>
          <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Изменение</div>
            <div className={`font-semibold text-sm sm:text-base ${
              (data[data.length - 1]?.balance || 0) >= (data[0]?.balance || 0) 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formatBalance((data[data.length - 1]?.balance || 0) - (data[0]?.balance || 0))} RUB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};