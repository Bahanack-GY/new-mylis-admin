import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from './api';
import type { CreateMeetingDto, UpdateMeetingDto } from './types';
import { toast } from 'sonner';

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
        onSuccess: () => {
            toast.success('Meeting scheduled');
            qc.invalidateQueries({ queryKey: meetingKeys.all });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useUpdateMeeting = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateMeetingDto }) =>
            meetingsApi.update(id, dto),
        onSuccess: () => {
            toast.success('Meeting updated');
            qc.invalidateQueries({ queryKey: meetingKeys.all });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useDeleteMeeting = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => meetingsApi.remove(id),
        onSuccess: () => {
            toast.success('Meeting deleted');
            qc.invalidateQueries({ queryKey: meetingKeys.all });
        },
        onError: () => toast.error('Something went wrong'),
    });
};
