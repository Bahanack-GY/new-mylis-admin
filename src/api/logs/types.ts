export interface Log {
    id: string;
    action: string;
    userId: string;
    details: Record<string, unknown>;
    timestamp: string;
    user?: {
        id: string;
        email: string;
        role: string;
        employee?: {
            firstName: string;
            lastName: string;
            avatarUrl?: string;
        };
    };
}
