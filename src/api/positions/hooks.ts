import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { positionsApi } from './api';
import type { CreatePositionDto } from './types';

export const positionKeys = {
    all: ['positions'] as const,
    detail: (id: string) => ['positions', id] as const,
};

export const usePositions = () =>
    useQuery({
        queryKey: positionKeys.all,
        queryFn: positionsApi.getAll,
    });

export const usePosition = (id: string) =>
    useQuery({
        queryKey: positionKeys.detail(id),
        queryFn: () => positionsApi.getById(id),
        enabled: !!id,
    });

export const useCreatePosition = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreatePositionDto) => positionsApi.create(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: positionKeys.all }),
    });
};
