// services/api.ts

import axios from 'axios'
import { Account, AccountDetails } from '../types/interface';

const API_URL = 'https://bank-application-backend-api.onrender.com'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Интерцептор для добавления accessKey к запросам
api.interceptors.request.use(config => {
  // Работаем только в браузере
  if (typeof window !== 'undefined') {
    const accessKey = localStorage.getItem('accessKey');
    if (accessKey) {
      config.headers.Authorization = `Basic ${accessKey}`;
    }
  }
  return config;
})

// Добавляем интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessKey');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Методы API
export const getAccounts = async (params = {}): Promise<Account[]> => {
  const response = await api.get('/accounts', { params })
  return response.data.payload
}

export const getAccountById = async (accountId: string): Promise<AccountDetails> => {
  const response = await api.get(`/account/${accountId}`)
  console.log('res:', response)
  return response.data.payload
}

export const transferFunds = async (from: string, to: string, amount: number): Promise<Account> => {
  const response = await api.post('/transfer-funds', { 
    from, 
    to, 
    amount: Number(amount) 
  })
  return response.data.payload
}

export const getAccessKey = async (login: string, password: string) => {
  try {
    const response = await api.post('/login', {
      login: login,
      password: password
    });

    // Проверяем успешный ответ
    if (response.data && response.data.payload?.token) {
      // Сохраняем под правильным ключом
      localStorage.setItem('accessKey', response.data.payload.token);

      return {
        status: response.status,
        data: response.data,
        token: response.data.payload.token,
        success: true
      };
    } else {
      // Если токена нет в ответе
      return {
        status: response.status,
        data: response.data,
        token: null,
        success: false
      };
    }

  } catch (error) {
    console.error('Login error:', error);

    if (axios.isAxiosError(error)) {
      return {
        status: error.response?.status || 500,
        data: error.response?.data || null,
        token: null,
        success: false
      };
    }

    return {
      status: 500,
      data: null,
      token: null,
      success: false
    };
  }
}

// Дополнительные методы API
export const createAccount = async (): Promise<Account> => {
  const response = await api.post('/create-account')
  return response.data.payload
}

export const getAllCurrencies = async (): Promise<string[]> => {
  const response = await api.get('/all-currencies')
  return response.data.payload
}

export const getMyCurrencies = async (): Promise<Record<string, any>> => {
  const response = await api.get('/currencies')
  console.log('currencies:', response)
  return response.data.payload
}

export const buyCurrency = async (from: string, to: string, amount: number): Promise<Record<string, any>> => {
  const response = await api.post('/currency-buy', { from, to, amount })
  return response.data.payload
}

export const getBanks = async (): Promise<Array<{lat: number, lon: number}>> => {
  const response = await api.get('/banks')
  return response.data.payload
}

// WebSocket для курсов валют
export const createCurrencyWebSocket = (): WebSocket => {
  return new WebSocket(`wss://bank-application-backend-api.onrender.com/currency-feed`);
}