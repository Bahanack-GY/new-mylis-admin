import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from './api';
import type { CreateClientDto, UpdateClientDto } from './types';

export const clientKeys = {
    all: ['clients'] as const,
    detail: (id: string) => ['clients', id] as const,
    byDepartment: (deptId: string) => ['clients', 'department', deptId] as const,
};

export const useClients = (departmentId?: string) =>
    useQuery({
        queryKey: departmentId ? [...clientKeys.all, departmentId] : clientKeys.all,
        queryFn: () => clientsApi.getAll(departmentId),
    });

export const useClient = (id: string) =>
    useQuery({
        queryKey: clientKeys.detail(id),
        queryFn: () => clientsApi.getById(id),
        enabled: !!id,
    });

export const useClientsByDepartment = (departmentId: string) =>
    useQuery({
        queryKey: clientKeys.byDepartment(departmentId),
        queryFn: () => clientsApi.getByDepartment(departmentId),
        enabled: !!departmentId,
    });

export const useCreateClient = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateClientDto) => clientsApi.create(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }),
    });
};

export const useUpdateClient = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateClientDto }) =>
            clientsApi.update(id, dto),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: clientKeys.all });
            qc.invalidateQueries({ queryKey: clientKeys.detail(id) });
        },
    });
};

export const useDeleteClient = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => clientsApi.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }),
    });
};
