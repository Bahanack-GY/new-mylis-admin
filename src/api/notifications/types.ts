export type NotificationType = 'system' | 'task' | 'project' | 'meeting' | 'document' | 'ticket';

export interface Notification {
    id: string;
    title: string;
    body: string;
    type: NotificationType;
    read: boolean;
    userId: string;
    createdAt: string;
    updatedAt: string;
}
