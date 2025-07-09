export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    isComplete: boolean;
    notificationId?: string; // NEW
    nowNotificationId?: string;
    isPriority?: boolean;
}


export const createEmptyTask = (): Task => ({
    id: Date.now().toString(),
    title: '',
    description: '',
    dueDate: '',
    isComplete: false,
    isPriority: true
});