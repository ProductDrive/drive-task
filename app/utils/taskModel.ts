export enum RepeatOption {
  None = 'none',
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
}

export interface Task {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    isComplete: boolean;
    notificationId?: string; // NEW
    nowNotificationId?: string;
    isPriority?: boolean;
    repeat?: RepeatOption;
}


export const createEmptyTask = (): Task => ({
    id: Date.now().toString(),
    title: '',
    description: '',
    dueDate: '',
    isComplete: false,
    isPriority: true,
    notificationId: '',
    nowNotificationId: '',
    repeat: RepeatOption.None
});