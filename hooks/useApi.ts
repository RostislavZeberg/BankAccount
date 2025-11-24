// hooks/useApi.ts
import { useState, useEffect } from 'react';

interface UseApiOptions<T> {
  url: string;
  initialData?: T;
}

export const useApi = <T>({ url, initialData }: UseApiOptions<T>) => {
  const [data, setData] = useState<T>(initialData as T);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.payload) {
          setData(result.payload);
        } else {
          setData(result);
        }
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : 'Неизвестная ошибка';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  const refetch = () => {
    window.location.reload();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
};