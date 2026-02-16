import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api';
import type { LoginDto, RegisterDto } from './types';

export const authKeys = {
    profile: ['auth', 'profile'] as const,
};

export const useProfile = (token?: string | null) =>
    useQuery({
        queryKey: authKeys.profile,
        queryFn: authApi.getProfile,
        enabled: !!token,
    });

import { useAuth } from '../../contexts/AuthContext';

export const useLogin = () => {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const { setToken } = useAuth();

    return useMutation({
        mutationFn: (dto: LoginDto) => authApi.login(dto),
        onSuccess: (data) => {
            if (!['MANAGER', 'HEAD_OF_DEPARTMENT'].includes(data.user.role)) {
                throw new Error('ACCESS_DENIED');
            }
            setToken(data.access_token);
            qc.invalidateQueries({ queryKey: authKeys.profile });
            navigate('/dashboard');
        },
    });
};

export const useRegister = () =>
    useMutation({ mutationFn: (dto: RegisterDto) => authApi.register(dto) });

export const useLogout = () => {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const { setToken } = useAuth();

    return () => {
        setToken(null);
        qc.clear();
        navigate('/login');
    };
};
