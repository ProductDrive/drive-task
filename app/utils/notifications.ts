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
  let usefulTime = new Date(notificationData.dueDate);
  console.log('incoming time in scheduleTaskNotification', usefulTime);
  
  // If the trigger time is in the past, dont schedule
  if (usefulTime <= new Date()) return;


  const taskID = notificationData.taskId;
  const triggerTime:any = {
    type: 'date',
    date: usefulTime
  }
  return await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.message,
        data: { taskID },
      },
      trigger: triggerTime,
    });
}


export async function scheduleOnlyTaskNotification(notificationData: NotificationData) {
  const ddueDate = new Date(notificationData.dueDate);
  console.log('notificationData in scheduleTaskNotification', ddueDate);
  const now = new Date();
  const taskID = notificationData.taskId;

  // If the trigger time is in the past for one-off
  if (notificationData.repeat === 'none' && ddueDate <= now) return;

  let dailyTrigger: any;
  let weeklyTrigger: any;

  if (notificationData.repeat === 'daily') {
    let triggerDate = new Date(ddueDate);
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1); // move to tomorrow
    }
    dailyTrigger = {
      date: triggerDate,
      repeats: true,
    };
  }

  if (notificationData.repeat === 'weekly') {
    let triggerDate:any = new Date(ddueDate);
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 7); // move to next week
    }
    const weekday = triggerDate.getDay() === 0 ? 7 : triggerDate.getDay();
    weeklyTrigger = {
      weekday,
      date: triggerDate,
    };
  }

  // Scheduling
  if (notificationData.repeat === 'daily') {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.message,
        data: { taskID },
      },
      trigger: dailyTrigger,
    });
  }

  if (notificationData.repeat === 'weekly') {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.message,
        data: { taskID },
      },
      trigger: weeklyTrigger,
    });
  }

  if (notificationData.repeat === 'none') {
    let triggerDate:any = new Date(ddueDate);
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.message,
        data: { taskID },
      },
      trigger: triggerDate,
    });
  }
}


// export async function scheduleTaskNotification(notificationData: NotificationData) {
//     const ddueDate:any = new Date(notificationData.dueDate);
//     // const oneOffTrigger: Notifications.NotificationTriggerInput={
//     //   date: ddueDate,
//     //   repeats: false
//     // };
    

//     const dailyTrigger: any = {
//       hour: ddueDate.getHours(),
//       minute: ddueDate.getMinutes(),
//       repeats: true
//     };
   
//     const weeklyday = new Date(notificationData.dueDate).getDay() === 0 ? 7 : moment().toDate().getDay();
//     console.log('weeklyday', weeklyday);

//     const weeklyTrigger: any = {
//       weekday: weeklyday,
//       hour: ddueDate.getHours(),
//       minute: ddueDate.getMinutes(),
//       repeats: true
//    };
//    console.log('weeklyTrigger1', weeklyTrigger);
   
//    const taskID = notificationData.taskId;

//     // If the trigger time is in the past, don't schedule
//     if (new Date(notificationData.dueDate) <= new Date()) return;

//     if (notificationData.repeat === 'daily') {
//         const identifier = await Notifications.scheduleNotificationAsync({
//           content: {
//               title: notificationData.title,
//               body: notificationData.message,
//               data: { taskID },
//           },
//         trigger: dailyTrigger
//         });
//       console.log('dailyTrigger', dailyTrigger);
//       return identifier;
//     }
//     if (notificationData.repeat === 'weekly') {
//       console.log('weekly', 'gets HERE');
//         const identifier = await Notifications.scheduleNotificationAsync({
//           content: {
//               title: notificationData.title,
//               body: notificationData.message,
//               data: { taskID },
//           },
//           trigger: weeklyTrigger
//         });
//         console.log('weeklyTrigger 2', weeklyTrigger);
//         return identifier;
//     }
//     if (notificationData.repeat === 'none') {
//       const identifier = await Notifications.scheduleNotificationAsync({
//           content: {
//               title: notificationData.title,
//               body: notificationData.message,
//               data: { taskID },
//           },
//           trigger: ddueDate
//       });
//       console.log('oneOffTrigger', ddueDate);
//       return identifier;
//   }
// }


export async function cancelNotification(identifier: string) {
    try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (e) {
        console.warn('Failed to cancel notification', e);
    }
}




// export async function scheduleTenMinutesTaskNotification(notificationData: NotificationData) {
//     const triggerTime: any = new Date(notificationData.dueDate).getTime() - 600000;
//     triggerTime.setMinutes(triggerTime.getMinutes());

//     // If the trigger time is in the past, don't schedule
//     if (triggerTime <= new Date()) return;
//     const taskID = notificationData.taskId;
//     const identifier = await Notifications.scheduleNotificationAsync({
//         content: {
//             title: `Upcoming Task: ${notificationData.title}`,
//             body: `Your task ${notificationData.title} is Due 10 min`,
//             sound: 'default',
//             data: {taskID},
//         },
//         trigger: triggerTime
//     });

//     return identifier;
// }