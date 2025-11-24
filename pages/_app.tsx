// pages/_app.tsx
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { Header } from '../components/Header';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Head>
        {/* Базовые мета-теги для всех страниц */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2c3e50" />
        
        {/* Fallback мета-теги (будут переопределяться на страницах) */}
        <title>BankAccount</title>
        <meta name="description" content="Личный кабинет для банковской системы." />
        <meta name="keywords" content="Банк, аккаунт, личный кабинет, Банк-онлайн" />
        <meta property="og:title" content="BankAccount" />
        <meta property="og:description" content="Личный кабинет для банковской системы" />
        <meta property="og:type" content="website" />
      </Head>
      
      {/* Общий layout для всех страниц */}
      <Header />
      <main className='relative h-[calc(100vh-115px)]'>
        <Component {...pageProps} />
      </main>
    </Provider>
  );
}

export default MyApp;