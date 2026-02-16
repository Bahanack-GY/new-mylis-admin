import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from './api';
import type { CreateMeetingDto, UpdateMeetingDto } from './types';

export const meetingKeys = {
    all: ['meetings'] as const,
    detail: (id: string) => ['meetings', id] as const,
};

export const useMeetings = (departmentId?: string) =>
    useQuery({
        queryKey: departmentId ? [...meetingKeys.all, departmentId] : meetingKeys.all,
        queryFn: () => meetingsApi.getAll(departmentId),
    });

export const useMeeting = (id: string) =>
    useQuery({
        queryKey: meetingKeys.detail(id),
        queryFn: () => meetingsApi.getById(id),
        enabled: !!id,
    });

export const useCreateMeeting = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateMeetingDto) => meetingsApi.create(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: meetingKeys.all }),
    });
};

export const useUpdateMeeting = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateMeetingDto }) =>
            meetingsApi.update(id, dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: meetingKeys.all }),
    });
};

export const useDeleteMeeting = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => meetingsApi.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: meetingKeys.all }),
    });
};
