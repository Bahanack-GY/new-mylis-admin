import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entretiensApi } from './api';
import type { CreateEntretienDto } from './types';

export const entretienKeys = {
    all: ['entretiens'] as const,
    detail: (id: string) => ['entretiens', id] as const,
};

export const useEntretiens = () =>
    useQuery({
        queryKey: entretienKeys.all,
        queryFn: entretiensApi.getAll,
    });

export const useEntretien = (id: string) =>
    useQuery({
        queryKey: entretienKeys.detail(id),
        queryFn: () => entretiensApi.getById(id),
        enabled: !!id,
    });

export const useCreateEntretien = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateEntretienDto) => entretiensApi.create(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: entretienKeys.all }),
    });
};
