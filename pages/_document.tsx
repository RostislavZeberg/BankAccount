// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ru">
      <Head>
        {/* Предзагрузка шрифтов для оптимизации производительности */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />

        {/* PWA манифест */}
        <link rel="manifest" href="/manifest.json" />

        {/* Favicon в разных форматах */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* PWA theme-color (дублируется для Safari) */}
        <meta name="theme-color" content="#2c3e50" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}