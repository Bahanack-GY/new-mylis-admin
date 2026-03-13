import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from './api';
import type { CreateEmployeeDto, UpdateEmployeeDto} from './types';
import { toast } from 'sonner';

export const employeeKeys = {
    all: ['employees'] as const,
    detail: (id: string) => ['employees', id] as const,
};

export const useLeaderboard = (limit?: number) =>
    useQuery({
        queryKey: ['leaderboard', limit],
        queryFn: () => employeesApi.getLeaderboard(limit),
    });

export const useEmployees = (departmentId?: string) =>
    useQuery({
        queryKey: departmentId ? [...employeeKeys.all, departmentId] : employeeKeys.all,
        queryFn: () => employeesApi.getAll(departmentId),
    });

export const useEmployee = (id: string) =>
    useQuery({
        queryKey: employeeKeys.detail(id),
        queryFn: () => employeesApi.getById(id),
        enabled: !!id,
    });

export const useCreateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateEmployeeDto) => employeesApi.create(dto),
        onSuccess: () => {
            toast.success('Employee created');
            qc.invalidateQueries({ queryKey: employeeKeys.all });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useUpdateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateEmployeeDto }) =>
            employeesApi.update(id, dto),
        onSuccess: (_, { id }) => {
            toast.success('Employee updated');
            qc.invalidateQueries({ queryKey: employeeKeys.all });
            qc.invalidateQueries({ queryKey: employeeKeys.detail(id) });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useDeleteEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => employeesApi.delete(id),
        onSuccess: () => {
            toast.success('Employee deleted');
            qc.invalidateQueries({ queryKey: employeeKeys.all });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useDismissEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => employeesApi.dismiss(id),
        onSuccess: (_, id) => {
            toast.success('Employee dismissed');
            qc.invalidateQueries({ queryKey: employeeKeys.all });
            qc.invalidateQueries({ queryKey: employeeKeys.detail(id) });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useReinstateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => employeesApi.reinstate(id),
        onSuccess: (_, id) => {
            toast.success('Employee reinstated');
            qc.invalidateQueries({ queryKey: employeeKeys.all });
            qc.invalidateQueries({ queryKey: employeeKeys.detail(id) });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useChangeEmployeePassword = () =>
    useMutation({
        mutationFn: ({ id, password }: { id: string; password: string }) =>
            employeesApi.changePassword(id, password),
        onSuccess: () => toast.success('Password changed'),
        onError: () => toast.error('Failed to change password'),
    });

export const useEmployeeStats = (id: string | number) =>
    useQuery({
        queryKey: ['employee-stats', id],
        queryFn: () => employeesApi.getStats(String(id)),
        enabled: !!id,
    });

export const useEmployeeBadges = (id: string) =>
    useQuery({
        queryKey: ['employee-badges', id],
        queryFn: () => employeesApi.getBadges(id),
        enabled: !!id,
    });
