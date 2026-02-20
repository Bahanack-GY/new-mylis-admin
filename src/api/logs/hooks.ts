import { useQuery } from '@tanstack/react-query';
import { logsApi } from './api';

export const logKeys = {
    all: ['logs'] as const,
};

export const useLogs = (from?: string, to?: string) =>
    useQuery({
        queryKey: [...logKeys.all, from, to].filter(Boolean),
        queryFn: () => logsApi.getAll(from, to),
    });
