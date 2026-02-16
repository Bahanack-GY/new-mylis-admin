import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextValue {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    isConnected: false,
    onlineUsers: new Set(),
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
                setOnlineUsers(new Set());
            }
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        const socket = io(apiUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Receive full online users list on connect
        socket.on('users:online', (userIds: string[]) => {
            setOnlineUsers(new Set(userIds));
        });

        socket.on('user:online', (data: { userId: string }) => {
            setOnlineUsers(prev => new Set([...prev, data.userId]));
        });

        socket.on('user:offline', (data: { userId: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(data.userId);
                return next;
            });
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, isConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
