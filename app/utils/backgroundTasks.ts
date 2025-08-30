// backgroundTasks.ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import moment from 'moment';
import { useTasks } from '../hooks/useTasks';
import { NotificationData, NotificationKind } from './notificationModel';
import { cancelNotification, configureNotifications, scheduleTaskNotification } from './notifications';

const TASK_NAME = 'DAILY_TASK_CHECK';

// Define the background task
TaskManager.defineTask(TASK_NAME, async () => {
  console.log('Background task is running');

  try {
    await configureNotifications();
    const {tasks} = useTasks();

    if (!tasks || tasks.length === 0) {
      return 'NoData';
    }

    const today = moment().format('YYYY-MM-DD HH:mm');

    for (let task of tasks) {
      if (task.repeat === 'daily') {
        const taskTime = moment(task.dueDate, 'YYYY-MM-DD HH:mm');
        if (taskTime.isAfter(moment())) {
          // Notification: Due Now
          const nowNotif: NotificationData = {
            taskId: task.id,
            title: task.title,
            message: 'Due Now',
            dueDate: new Date(task.dueDate),
            repeat: 'none',
            kind: NotificationKind.Final,
          };
          await cancelNotification(task.nowNotificationId??'');
          task.nowNotificationId = await scheduleTaskNotification(nowNotif);

          // Notification: 10 minutes before
          const newTenTaskDue = new Date(task.dueDate);
          newTenTaskDue.setMinutes(newTenTaskDue.getMinutes() - 10);
          const tenMinBefore: NotificationData = {
            taskId: task.id,
            title: `Upcoming Task: ${task.title}`,
            message: 'Due in 10 minutes',
            dueDate: newTenTaskDue,
            repeat: 'none',
            kind: NotificationKind.Warning,
          };
          await cancelNotification(task.notificationId??'');
          task.notificationId = await scheduleTaskNotification(tenMinBefore);

          console.log(`Scheduled notifications for task ${task.id} at ${task.dueDate}`);
        }
      }
    }

    return 'NewData';
  } catch (err) {
    console.error('Background task failed', err);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Register the background task
export async function registerBackgroundTask() {
  try {
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 60, // every hour
    });
    const today = moment().format('YYYY-MM-DD HH:mm');
    console.log('Background task registered', today);
  } catch (err) {
    console.error('Failed to register background task', err);
  }
}

