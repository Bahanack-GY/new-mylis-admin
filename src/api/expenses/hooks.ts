import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from './api';
import type { CreateExpenseDto } from './types';

export const expenseKeys = {
    all: ['expenses'] as const,
    detail: (id: string) => ['expenses', id] as const,
    stats: (year?: number) => ['expenses', 'stats', year] as const,
};

export const useExpenses = () =>
    useQuery({
        queryKey: expenseKeys.all,
        queryFn: () => expensesApi.getAll(),
    });

export const useExpense = (id: string) =>
    useQuery({
        queryKey: expenseKeys.detail(id),
        queryFn: () => expensesApi.getById(id),
        enabled: !!id,
    });

export const useExpenseStats = (year?: number) =>
    useQuery({
        queryKey: expenseKeys.stats(year),
        queryFn: () => expensesApi.getStats(year),
    });

export const useCreateExpense = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateExpenseDto) => expensesApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};

export const useUpdateExpense = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpenseDto> }) => expensesApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};

export const useDeleteExpense = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => expensesApi.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
};
