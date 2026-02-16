import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from './api';
import type { CreateTeamDto } from './types';

export const teamKeys = {
    all: ['teams'] as const,
    detail: (id: string) => ['teams', id] as const,
};

export const useTeams = () =>
    useQuery({
        queryKey: teamKeys.all,
        queryFn: teamsApi.getAll,
    });

export const useTeam = (id: string) =>
    useQuery({
        queryKey: teamKeys.detail(id),
        queryFn: () => teamsApi.getById(id),
        enabled: !!id,
    });

export const useCreateTeam = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateTeamDto) => teamsApi.create(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
    });
};
