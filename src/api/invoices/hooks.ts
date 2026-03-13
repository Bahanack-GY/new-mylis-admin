import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, invoiceTemplatesApi } from './api';
import type { CreateInvoiceDto, UpdateInvoiceDto, UpsertInvoiceTemplateDto } from './types';
import { toast } from 'sonner';

export const invoiceKeys = {
    all: ['invoices'] as const,
    detail: (id: string) => ['invoices', id] as const,
    stats: ['invoices', 'stats'] as const,
    template: (deptId: string) => ['invoice-template', deptId] as const,
};

export const useInvoices = (departmentId?: string) =>
    useQuery({
        queryKey: departmentId ? [...invoiceKeys.all, departmentId] : invoiceKeys.all,
        queryFn: () => invoicesApi.getAll(departmentId),
    });

export const useInvoice = (id: string) =>
    useQuery({
        queryKey: invoiceKeys.detail(id),
        queryFn: () => invoicesApi.getById(id),
        enabled: !!id,
    });

export const useInvoiceStats = (departmentId?: string, from?: string, to?: string) =>
    useQuery({
        queryKey: [...invoiceKeys.stats, departmentId, from, to].filter(Boolean),
        queryFn: () => invoicesApi.getStats(departmentId, from, to),
    });

export const useCreateInvoice = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateInvoiceDto) => invoicesApi.create(dto),
        onSuccess: () => {
            toast.success('Invoice created');
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.stats });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useUpdateInvoice = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateInvoiceDto }) => invoicesApi.update(id, dto),
        onSuccess: (_, { id }) => {
            toast.success('Invoice updated');
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
            qc.invalidateQueries({ queryKey: invoiceKeys.stats });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useSendInvoice = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => invoicesApi.send(id),
        onSuccess: () => {
            toast.success('Invoice sent');
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.stats });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const usePayInvoice = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => invoicesApi.pay(id),
        onSuccess: () => {
            toast.success('Invoice marked as paid');
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.stats });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useRejectInvoice = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => invoicesApi.reject(id),
        onSuccess: () => {
            toast.success('Invoice rejected');
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.stats });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useDeleteInvoice = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => invoicesApi.remove(id),
        onSuccess: () => {
            toast.success('Invoice deleted');
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.stats });
        },
        onError: () => toast.error('Something went wrong'),
    });
};

export const useInvoiceTemplate = (departmentId: string) =>
    useQuery({
        queryKey: invoiceKeys.template(departmentId),
        queryFn: () => invoiceTemplatesApi.getByDepartment(departmentId),
        enabled: !!departmentId,
    });

export const useUpsertInvoiceTemplate = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ departmentId, dto }: { departmentId: string; dto: UpsertInvoiceTemplateDto }) =>
            invoiceTemplatesApi.upsert(departmentId, dto),
        onSuccess: (_, { departmentId }) => {
            toast.success('Template saved');
            qc.invalidateQueries({ queryKey: invoiceKeys.template(departmentId) });
        },
        onError: () => toast.error('Something went wrong'),
    });
};
