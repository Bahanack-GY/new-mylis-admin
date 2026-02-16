import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from './api';
import type { CreateEmployeeDto, UpdateEmployeeDto } from './types';

export const employeeKeys = {
    all: ['employees'] as const,
    detail: (id: string) => ['employees', id] as const,
};

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
        onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
    });
};

export const useUpdateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateEmployeeDto }) =>
            employeesApi.update(id, dto),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: employeeKeys.all });
            qc.invalidateQueries({ queryKey: employeeKeys.detail(id) });
        },
    });
};

export const useDeleteEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => employeesApi.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
    });
};

export const useDismissEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => employeesApi.dismiss(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: employeeKeys.all });
            qc.invalidateQueries({ queryKey: employeeKeys.detail(id) });
        },
    });
};

export const useReinstateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => employeesApi.reinstate(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: employeeKeys.all });
            qc.invalidateQueries({ queryKey: employeeKeys.detail(id) });
        },
    });
};

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
