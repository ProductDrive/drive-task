import moment from "moment";

export interface NotificationData {
    taskId: string;
    title: string;
    message: string;
    dueDate: string;
}

export const createEmptyNotificationData = (): NotificationData => ({
    taskId: moment().toString(),
    title: 'New Task',
    message: 'My task is due',
    dueDate: Date.now().toString(),
});