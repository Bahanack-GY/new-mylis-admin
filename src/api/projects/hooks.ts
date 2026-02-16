import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from './api';
import type { CreateProjectDto, UpdateProjectDto } from './types';

export const projectKeys = {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
    byClient: (clientId: string) => ['projects', 'client', clientId] as const,
};

export const useProjects = (departmentId?: string) =>
    useQuery({
        queryKey: departmentId ? [...projectKeys.all, departmentId] : projectKeys.all,
        queryFn: () => projectsApi.getAll(departmentId),
    });

export const useProject = (id: string) =>
    useQuery({
        queryKey: projectKeys.detail(id),
        queryFn: () => projectsApi.getById(id),
        enabled: !!id,
    });

export const useProjectsByClient = (clientId: string) =>
    useQuery({
        queryKey: projectKeys.byClient(clientId),
        queryFn: () => projectsApi.getByClient(clientId),
        enabled: !!clientId,
    });

export const useCreateProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateProjectDto) => projectsApi.create(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
    });
};

export const useUpdateProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateProjectDto }) =>
            projectsApi.update(id, dto),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: projectKeys.all });
            qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
        },
    });
};

export const useDeleteProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => projectsApi.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
    });
};
