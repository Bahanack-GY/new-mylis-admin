import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formationsApi } from './api';
import type { CreateFormationDto } from './types';
import { toast } from 'sonner';

export const formationKeys = {
    all: ['formations'] as const,
    detail: (id: string) => ['formations', id] as const,
};

export const useFormations = () =>
    useQuery({
        queryKey: formationKeys.all,
        queryFn: formationsApi.getAll,
    });

export const useFormation = (id: string) =>
    useQuery({
        queryKey: formationKeys.detail(id),
        queryFn: () => formationsApi.getById(id),
        enabled: !!id,
    });

export const useCreateFormation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateFormationDto) => formationsApi.create(dto),
        onSuccess: () => {
            toast.success('Training created');
            qc.invalidateQueries({ queryKey: formationKeys.all });
        },
        onError: () => toast.error('Something went wrong'),
    });
};
