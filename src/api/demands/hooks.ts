import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demandsApi } from './api';

export const demandKeys = {
    all: ['demands'] as const,
    detail: (id: string) => ['demands', id] as const,
    stats: ['demands', 'stats'] as const,
};

export const useDemands = (departmentId?: string) =>
    useQuery({
        queryKey: departmentId ? [...demandKeys.all, departmentId] : demandKeys.all,
        queryFn: () => demandsApi.getAll(departmentId),
    });

export const useDemand = (id: string) =>
    useQuery({
        queryKey: demandKeys.detail(id),
        queryFn: () => demandsApi.getById(id),
        enabled: !!id,
    });

export const useDemandStats = (departmentId?: string, from?: string, to?: string) =>
    useQuery({
        queryKey: [...demandKeys.stats, departmentId, from, to].filter(Boolean),
        queryFn: () => demandsApi.getStats(departmentId, from, to),
    });

export const useValidateDemand = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => demandsApi.validate(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: demandKeys.all });
            qc.invalidateQueries({ queryKey: demandKeys.stats });
        },
    });
};

export const useRejectDemand = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => demandsApi.reject(id, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: demandKeys.all });
            qc.invalidateQueries({ queryKey: demandKeys.stats });
        },
    });
};
