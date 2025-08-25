import moment from "moment";

export enum NotificationKind {
  Warning,
  Final
}


export interface NotificationData {
    taskId: string;
    title: string;
    message: string;
    dueDate: Date;
    repeat: string;
    kind?: NotificationKind
}

export const createEmptyNotificationData = (): NotificationData => ({
    taskId: moment().toString(),
    title: 'New Task',
    message: 'My task is due',
    dueDate: new Date(),
    repeat: 'none',
    kind: NotificationKind.Final
});