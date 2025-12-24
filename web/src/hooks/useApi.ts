import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiOptions {
 
  immediate?: boolean;

  deps?: any[];
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}


export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { immediate = true, deps = [] } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current && err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        setData(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall]);

  useEffect(() => {
    mountedRef.current = true;

    if (immediate) {
      execute();
    }

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, execute, ...deps]);

  return { data, loading, error, refetch: execute };
}

/**
 * Hook for paginated data with cursor-based or offset-based pagination
 */
interface UsePaginationOptions<T> {
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginationResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
  nextPage: () => void;
  prevPage: () => void;
  refetch: () => Promise<void>;
}

export function usePagination<T>(
  apiCall: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>,
  options: UsePaginationOptions<T> = {}
): UsePaginationResult<T> {
  const { pageSize = 20, initialPage = 1 } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(page, pageSize);
      if (mountedRef.current) {
        setData(result.items);
        setHasMore(result.hasMore);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, page, pageSize]);

  useEffect(() => {
    mountedRef.current = true;
    execute();

    return () => {
      mountedRef.current = false;
    };
  }, [execute]);

  const nextPage = useCallback(() => {
    if (hasMore) {
      setPage((p) => p + 1);
    }
  }, [hasMore]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  }, [page]);

  return { data, loading, error, page, hasMore, nextPage, prevPage, refetch: execute };
}
