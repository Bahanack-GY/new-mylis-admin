export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    type: 'ONE_TIME' | 'RECURRENT';
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;
    date: string;
    demandId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExpenseDto {
    title: string;
    amount: number;
    category: string;
    type: 'ONE_TIME' | 'RECURRENT';
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;
    date: string;
}

export interface ExpenseStats {
    totalYear: number;
    totalCount: number;
    recurrentCount: number;
    totalSalaries: number;
    totalProjects: number;
    byCategory: { name: string; value: number }[];
    byMonth: Record<string, any>[];
    series: string[];
}
