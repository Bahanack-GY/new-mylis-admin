import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from './api';
import type { CreateDocumentDto } from './types';
import { toast } from 'sonner';

export const documentKeys = {
    all: ['documents'] as const,
    detail: (id: string) => ['documents', id] as const,
    storage: ['documents', 'storage'] as const,
};

export const useDocuments = () =>
    useQuery({
        queryKey: documentKeys.all,
        queryFn: documentsApi.getAll,
    });

export const useStorageInfo = () =>
    useQuery({
        queryKey: documentKeys.storage,
        queryFn: documentsApi.getStorageInfo,
    });

export const useDocument = (id: string) =>
    useQuery({
        queryKey: documentKeys.detail(id),
        queryFn: () => documentsApi.getById(id),
        enabled: !!id,
    });

export const useCreateDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateDocumentDto) => documentsApi.create(dto),
        onSuccess: () => {
            toast.success('Document uploaded');
            qc.invalidateQueries({ queryKey: documentKeys.all });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useDeleteDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => documentsApi.deleteDocument(id),
        onSuccess: () => {
            toast.success('Document deleted');
            qc.invalidateQueries({ queryKey: documentKeys.all });
        },
        onError: () => toast.error('Something went wrong'),
    });
};
