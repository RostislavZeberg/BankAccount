// pages/index.tsx

import Head from 'next/head';
import { useRouter } from 'next/router';
import { getAccessKey } from '../services/api';
import { useState, useEffect } from 'react';

interface LoginResponse {
  status: number;
  data?: {
    payload?: {
      token?: string;
    };
    error?: string;
  };
  token?: string | null;
  success?: boolean;
}

export default function Home() {
  const [input, setInput] = useState({ login: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [touched, setTouched] = useState({ login: false, password: false });

  const validateForm = () => {
    if (!input.login.trim()) return 'Введите логин';
    if (!input.password.trim()) return 'Введите пароль';
    if (input.password.length < 4) return 'Пароль должен содержать не менее 4 символов';
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({
      ...prev,
      [name]: value
    }));

    // Сбрасываем ошибку при изменении поля
    if (error) {
      setError(null);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;

    // Сбрасываем ошибку при фокусе на поле
    if (error) {
      setError(null);
    }

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result: LoginResponse = await getAccessKey(input.login, input.password);

      // Проверяем и статус и наличие токена
      if (result.status === 200 && result.token) {
        router.push('/account');
      } else {
        // Более точная обработка ошибок
        if (result.data?.error) {
          setError(result.data.error);
        } else if (result.status === 401) {
          setError('Неверный логин или пароль');
        } else if (result.status === 404) {
          setError('Пользователь не найден');
        } else {
          setError('Ошибка авторизации');
        }
      }
    } catch (err: unknown) {
      console.error('Login error:', err);

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number } };
        if (axiosError.response?.status === 401) {
          setError('Неверный логин или пароль');
        } else if (axiosError.response?.status === 404) {
          setError('Пользователь не найден');
        } else if (axiosError.response?.status && axiosError.response.status >= 500) {
          setError('Ошибка сервера. Попробуйте позже');
        }
      } else {
        setError('Произошла ошибка при подключении к серверу');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !loading) {
      // Предотвращаем стандартное поведение, чтобы не вызвать двойной сабмит
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Очистка состояний при размонтировании
  useEffect(() => {
    return () => {
      setError(null);
      setLoading(false);
    };
  }, []);

  return (
    <>
      <Head>
        <title>BankAccount | Главная</title>
        <meta name="description" content="Банк, аккаунт, личный кабинет, Банк-онлайн. Управляйте своими финансами онлайн." />
        <meta property="og:title" content="BankAccount | Главная - Банк-онлайн" />
        <meta property="og:description" content="Управляйте своими финансами через личный кабинет BankAccount" />
      </Head>
      <div className="flex flex-col gap-[30px] center-absolute p-[50px] bg-custom-gray max-w-[500px] rounded-[50px]">
        <h1 className='title-custom'>Вход в аккаунт</h1>
        {loading && <div className='absolute top-4 left-1/2 transform -translate-x-1/2 w-full text-center'>Первая загрузка может занять 60 секунд</div>}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-red-500 text-center max-w-[90%]"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className='flex items-center gap-2.5 mb-4'>
            <label className='flex justify-end min-w-[60px]' htmlFor="login">
              Логин
            </label>
            <input
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              value={input.login}
              id="login"
              name='login'
              type="text"
              placeholder='guest'
              className='input-custom'
              disabled={loading}
              required
              aria-required="true"
              aria-invalid={touched.login && !input.login.trim()}
            />
          </div>

          <div className='flex items-center gap-2.5 mb-4'>
            <label className='flex justify-end min-w-[60px]' htmlFor="password">
              Пароль
            </label>
            <input
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              value={input.password}
              id="password"
              name='password'
              type="password"
              placeholder='viewing'
              className='input-custom'
              disabled={loading}
              required
              aria-required="true"
              aria-invalid={touched.password && !input.password.trim()}
              minLength={4}
            />
          </div>

          <button
            type='submit'
            className='btn-blue w-full mb-2'
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </>
  );
}