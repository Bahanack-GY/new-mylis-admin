import api from '../config';
import type { Employee, CreateEmployeeDto, UpdateEmployeeDto } from './types';

export const employeesApi = {
    getAll: (departmentId?: string) =>
        api.get<Employee[]>('/employees', { params: departmentId ? { departmentId } : {} }).then(r => r.data),

    getById: (id: string) =>
        api.get<Employee>(`/employees/${id}`).then(r => r.data),

    create: (dto: CreateEmployeeDto) =>
        api.post<Employee>('/employees', dto).then(r => r.data),

    update: (id: string, dto: UpdateEmployeeDto) =>
        api.patch<Employee>(`/employees/${id}`, dto).then(r => r.data),

    delete: (id: string) =>
        api.delete(`/employees/${id}`).then(r => r.data),

    getStats: (id: string) =>
        api.get<{ weeklyActivity: any[]; productivityData: any[]; points: number }>(`/employees/${id}/stats`).then(r => r.data),

    getBadges: (id: string) =>
        api.get<{ id: string; badgeNumber: number; title: string; milestone: number; earnedAt: string }[]>(`/employees/${id}/badges`).then(r => r.data),

    dismiss: (id: string) =>
        api.patch<Employee>(`/employees/${id}/dismiss`).then(r => r.data),

    reinstate: (id: string) =>
        api.patch<Employee>(`/employees/${id}/reinstate`).then(r => r.data),
};
