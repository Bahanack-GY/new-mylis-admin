import api from '../config';
import type { Expense, CreateExpenseDto, ExpenseStats } from './types';

export const expensesApi = {
    getAll: () =>
        api.get<Expense[]>('/expenses').then(res => res.data),

    getById: (id: string) =>
        api.get<Expense>(`/expenses/${id}`).then(res => res.data),

    getStats: (year?: number) =>
        api.get<ExpenseStats>('/expenses/stats', { params: { year } }).then(res => res.data),

    create: (data: CreateExpenseDto) =>
        api.post<Expense>('/expenses', data).then(res => res.data),

    update: (id: string, data: Partial<CreateExpenseDto>) =>
        api.patch<Expense>(`/expenses/${id}`, data).then(res => res.data),

    delete: (id: string) =>
        api.delete<{ success: boolean }>(`/expenses/${id}`).then(res => res.data),
};
