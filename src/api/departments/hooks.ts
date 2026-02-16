import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, departmentGoalsApi } from './api';
import type { CreateDepartmentDto, UpdateDepartmentDto, CreateDepartmentGoalDto, UpdateDepartmentGoalDto } from './types';

export const departmentKeys = {
    all: ['departments'] as const,
    detail: (id: string) => ['departments', id] as const,
    goals: ['department-goals'] as const,
    goalsByDept: (deptId: string) => ['department-goals', deptId] as const,
};

export const useDepartments = () =>
    useQuery({
        queryKey: departmentKeys.all,
        queryFn: departmentsApi.getAll,
    });

export const useDepartment = (id: string) =>
    useQuery({
        queryKey: departmentKeys.detail(id),
        queryFn: () => departmentsApi.getById(id),
        enabled: !!id,
    });

export const useCreateDepartment = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateDepartmentDto) => departmentsApi.create(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: departmentKeys.all }),
    });
};

export const useUpdateDepartment = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateDepartmentDto }) =>
            departmentsApi.update(id, dto),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: departmentKeys.all });
            qc.invalidateQueries({ queryKey: departmentKeys.detail(id) });
        },
    });
};

export const useDepartmentGoals = (departmentId?: string) =>
    useQuery({
        queryKey: departmentId ? departmentKeys.goalsByDept(departmentId) : departmentKeys.goals,
        queryFn: () => departmentId
            ? departmentGoalsApi.getByDepartment(departmentId)
            : departmentGoalsApi.getAll(),
    });

export const useCreateDepartmentGoal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateDepartmentGoalDto) => departmentGoalsApi.create(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: departmentKeys.goals }),
    });
};

export const useUpdateDepartmentGoal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateDepartmentGoalDto }) =>
            departmentGoalsApi.update(id, dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: departmentKeys.goals }),
    });
};

export const useDeleteDepartmentGoal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => departmentGoalsApi.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: departmentKeys.goals }),
    });
};
