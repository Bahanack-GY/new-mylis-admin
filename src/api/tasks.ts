import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './config';

export interface Task {
    id: string;
    title: string;
    description: string;
    assignedToId?: string;
    assignedTo?: { firstName: string; lastName: string };
    projectId?: string;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    startTime?: string;
    endTime?: string;
    state: 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'REVIEWED';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    status?: string;
    deadline?: string;
    time?: string;
    assignee?: string;
    repeat?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    assignedToId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    deadline?: string;
    startTime?: string;
    endTime?: string;
    priority?: string;
    difficulty?: string;
}

export const useTasks = () => {
    return useQuery<Task[]>({
        queryKey: ['tasks'],
        queryFn: async () => {
            const { data } = await api.get('/tasks');
            return data;
        },
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreateTaskDto) => {
            const { data } = await api.post('/tasks', dto);
            return data;
        },
        onSuccess: () => {
            // Invalidate all task queries to refresh the list
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useTasksByEmployee = (employeeId: string | number | undefined) => {
    return useQuery<Task[]>({
        queryKey: ['tasks', 'employee', employeeId],
        queryFn: async () => {
            if (!employeeId) return [];
            const { data } = await api.get(`/tasks/employee/${employeeId}`);
            return data;
        },
        enabled: !!employeeId,
    });
};
