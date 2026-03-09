import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!isAuthenticated) {
            setSocket(prev => {
                prev?.disconnect();
                return null;
            });
            setIsConnected(false);
            setOnlineUsers(new Set());
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        const newSocket = io(apiUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Receive full online users list on connect
        newSocket.on('users:online', (userIds: string[]) => {
            setOnlineUsers(new Set(userIds));
        });

        newSocket.on('user:online', (data: { userId: string }) => {
            setOnlineUsers(prev => new Set([...prev, data.userId]));
        });

        newSocket.on('user:offline', (data: { userId: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(data.userId);
                return next;
            });
        });

        return () => {
            newSocket.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
