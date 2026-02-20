import api from '../config';
import type { Log } from './types';

export const logsApi = {
    getAll: (from?: string, to?: string) => {
        const params: Record<string, string> = {};
        if (from) params.from = from;
        if (to) params.to = to;
        return api.get<Log[]>('/logs', { params }).then(r => r.data);
    },
};
