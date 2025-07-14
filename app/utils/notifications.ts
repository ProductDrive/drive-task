import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { NotificationData } from '../utils/notificationModel';



export async function configureNotifications() {
  if (Device.isDevice) {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      await Notifications.requestPermissionsAsync();
    }
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });
}

export async function scheduleTaskNotification(notificationData: NotificationData) {
    const triggerTime: any = new Date(notificationData.dueDate);
    const taskID = notificationData.taskId;
    // If the trigger time is in the past, don't schedule
    if (triggerTime <= new Date()) return;

    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: notificationData.title,
            body: notificationData.message,
            data: { taskID },
        },
        trigger: triggerTime
    });

    return identifier;
}
export async function scheduleTenMinutesTaskNotification(notificationData: NotificationData) {
    const triggerTime: any = new Date(notificationData.dueDate).getTime() - 600000;
    triggerTime.setMinutes(triggerTime.getMinutes());

    // If the trigger time is in the past, don't schedule
    if (triggerTime <= new Date()) return;
    const taskID = notificationData.taskId;
    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: `Upcoming Task: ${notificationData.title}`,
            body: `Your task ${notificationData.title} is Due 10 min`,
            sound: 'default',
            data: {taskID},
        },
        trigger: triggerTime
    });

    return identifier;
}


export async function cancelNotification(identifier: string) {
    try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (e) {
        console.warn('Failed to cancel notification', e);
    }
}
