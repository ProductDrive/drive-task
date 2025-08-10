import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import moment from 'moment';
import {
  useCallback,
  useState
} from 'react';
import {
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { NotificationData } from '../utils/notificationModel';
import { configureNotifications, scheduleTaskNotification } from '../utils/notifications';
import { christianPrayers, hinduPrayers, muslimPrayers } from '../utils/routineTaskTimes';
import { loadTasks, saveTasks } from '../utils/storage';
import { RepeatOption, Task } from '../utils/taskModel';
import { TaskCard } from './task-card';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string>('');
  const [descDraft, setDescDraft] = useState<string>('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTaskId, setPickerTaskId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false); // new state for modal
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      configureNotifications();
      loadTasks().then(setTasks);
    }, [])
  );

   const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleMenuSelect = (type: string) => {
    setMenuVisible(false);
    if (type === 'One-off Task') {
      handleAddNewTask();
    }else if (type === 'Routine Task') {
      handleAddRoutineTask();
    }else if (type === 'christian' || type === 'muslim' || type === 'hindu') {
      const prayers = createPrayerTasks(type);
      prayers.map(prayer => {
        const tenMinBefore: NotificationData = {
          taskId: prayer.id,
          title: `Upcoming Task: ${prayer.title}`,
          message: 'Due in 10 minutes',
          dueDate: moment(prayer.dueDate).subtract(10, 'minutes').toISOString(),
          repeat: prayer.repeat?? RepeatOption.Daily
        };

        const nowNotif: NotificationData = {
          taskId: prayer.id,
          title: prayer.title,
          message: 'Due Now',
          dueDate: prayer.dueDate,
          repeat: prayer.repeat?? RepeatOption.Daily
        };

        scheduleTaskNotification(tenMinBefore);
        scheduleTaskNotification(nowNotif);
      });
      setTasks([...tasks, ...prayers]);
      saveTasks([...tasks, ...prayers]);
    }

    console.log("Selected:", type);
    // Add your task creation logic here
  };
  const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

const createPrayerTasks = (type: 'christian' | 'muslim' | 'hindu'): Task[] => {
  const prayers = type === 'christian' ? christianPrayers : type === 'muslim' ? muslimPrayers : hinduPrayers;

  return prayers.map((prayer) => ({
    id: (Date.now() + Math.random()).toString(), // unique ID
    title: prayer.title,
    description: `${prayer.title} reminder`,
    dueDate: moment().format(`YYYY-MM-DD ${prayer.time}`),
    isComplete: false,
    isPriority: true,
    repeat: prayer.repeat,
  }));

};

  const toggleComplete = async (id: string) => {
    const updatedList = await Promise.all(tasks.map(async t => {
      if (t.id !== id) return t;
      const updatedTask = { ...t, isComplete: !t.isComplete };

      if (updatedTask.isComplete) {
        if (t.notificationId) await Notifications.cancelScheduledNotificationAsync(t.notificationId).catch(() => {});
        if (t.nowNotificationId) await Notifications.cancelScheduledNotificationAsync(t.nowNotificationId).catch(() => {});
        updatedTask.notificationId = '';
        updatedTask.nowNotificationId = '';
      } else {
        const due = moment(updatedTask.dueDate);
        if (due.isAfter(moment()) && due.isAfter(moment().add(10, 'minutes'))) {
          const tenMinBefore: NotificationData = {
            taskId: updatedTask.id,
            title: `Upcoming Task: ${updatedTask.title}`,
            message: 'Due in 10 minutes',
            dueDate: due.clone().subtract(10, 'minutes').toISOString(),
            repeat: updatedTask.repeat || 'none'
          };
          updatedTask.notificationId = await scheduleTaskNotification(tenMinBefore);
          updatedTask.nowNotificationId = await scheduleTaskNotification({ ...tenMinBefore, message: 'Due Now', dueDate: due.toString() });
        }

        if (due.isAfter(moment()) && due.isBefore(moment().add(10, 'minutes'))) {
          const nowNotif: NotificationData = {
            taskId: updatedTask.id,
            title: updatedTask.title,
            message: 'Due Now',
            dueDate: due.toString(),
            repeat: updatedTask.repeat || 'none'
          };
          updatedTask.nowNotificationId = await scheduleTaskNotification(nowNotif);
        }
      }
      return updatedTask;
    }));

    setTasks(updatedList);
    await saveTasks(updatedList);
  };

  const shareTask = async (task: Task) => {
    await Share.share({
      message: `Task: ${task.title}\n${task.description || ''}\nDue: ${moment(task.dueDate).format('MMM DD, YYYY • hh:mm A')}`
    });
  };

  const togglePriority = async (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, isPriority: !t.isPriority } : t);
    setTasks(updated);
    await saveTasks(updated);
  };

  const markAsRepeat = async (task: Task) => {
    const newT = { ...task, id: `${task.id}-copy-${Date.now()}`, isComplete: false };
    const updated = [...tasks, newT];
    animateLayout();
    setTasks(updated);
    await saveTasks(updated);
  };

  const handleAddNewTask = async () => {
    const newT: Task = {
      id: Date.now().toString(),
      title: 'Next Task',
      description: '',
      isComplete: false,
      dueDate: moment().add(1, 'hour').toISOString(),
      isPriority: false,
      repeat: RepeatOption.None
    };

    const tenMinBefore: NotificationData = {
      taskId: newT.id,
      title: `Upcoming Task: ${newT.title}`,
      message: 'Due in 10 minutes',
      dueDate: moment(newT.dueDate).subtract(10, 'minutes').toISOString(),
      repeat: 'none'
    };

    const nowNotif: NotificationData = {
      taskId: newT.id,
      title: newT.title,
      message: 'Due Now',
      dueDate: newT.dueDate,
      repeat: 'none'
    };

    newT.notificationId = await scheduleTaskNotification(tenMinBefore);
    newT.nowNotificationId = await scheduleTaskNotification(nowNotif);

    const updated = [...tasks, newT];
    animateLayout();
    setTasks(updated);
    setEditingTaskId(newT.id);
    setTitleDraft(newT.title);
    await saveTasks(updated);
    setShowModal(false); // close modal after adding
  };

  const handleAddRoutineTask = async () => {
     const newT: Task = {
      id: Date.now().toString(),
      title: 'Next Task',
      description: '',
      isComplete: false,
      dueDate: moment().add(1, 'hour').toISOString(),
      isPriority: false,
      repeat: RepeatOption.Daily
    };

    const tenMinBefore: NotificationData = {
      taskId: newT.id,
      title: `Upcoming Task: ${newT.title}`,
      message: 'Due in 10 minutes',
      dueDate: moment(newT.dueDate).subtract(10, 'minutes').toISOString(),
      repeat: 'daily'
    };

    const nowNotif: NotificationData = {
      taskId: newT.id,
      title: newT.title,
      message: 'Due Now',
      dueDate: newT.dueDate,
      repeat: 'daily'
    };

    newT.notificationId = await scheduleTaskNotification(tenMinBefore);
    newT.nowNotificationId = await scheduleTaskNotification(nowNotif);

    const updated = [...tasks, newT];
    animateLayout();
    setTasks(updated);
    setEditingTaskId(newT.id);
    setTitleDraft(newT.title);
    await saveTasks(updated);
    setShowModal(false); // close modal after adding
};

  const deleteTask = async (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    animateLayout();
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const updateTask = async <K extends keyof Task>(id: string, key: K, value: Task[K]) => {
    const updatedList: Task[] = [];

    for (const t of tasks) {
      if (t.id !== id) {
        updatedList.push(t);
        continue;
      }

      const updatedTask: Task = { ...t, [key]: value };

      if (key === 'dueDate' || key === 'repeat') {
        if (t.notificationId) await Notifications.cancelScheduledNotificationAsync(t.notificationId).catch(() => {});
        if (t.nowNotificationId) await Notifications.cancelScheduledNotificationAsync(t.nowNotificationId).catch(() => {});

        const tenMinBefore: NotificationData = {
          taskId: updatedTask.id,
          title: `Upcoming Task: ${updatedTask.title}`,
          message: 'Due in 10 minutes',
          dueDate: moment(updatedTask.dueDate).subtract(10, 'minutes').toISOString(),
          repeat: updatedTask.repeat || 'none'
        };

        const nowNotif: NotificationData = {
          taskId: updatedTask.id,
          title: updatedTask.title,
          message: 'Due Now',
          dueDate: updatedTask.dueDate,
          repeat: updatedTask.repeat || 'none'
        };

        updatedTask.notificationId = await scheduleTaskNotification(tenMinBefore);
        updatedTask.nowNotificationId = await scheduleTaskNotification(nowNotif);
      }

      updatedList.push(updatedTask);
    }

    setTasks(updatedList);
    await saveTasks(updatedList);
  };

  const openPicker = (taskId: string) => {
    const t = tasks.find(t => t.id === taskId);
    const date = t ? new Date(t.dueDate) : new Date();
    setTempPickerDate(date);
    setPickerTaskId(taskId);
    setPickerMode('date');
    setShowPicker(true);
  };

  const onPickerChange = (_: any, date?: Date) => {
    if (!date) {
      setShowPicker(false);
      return;
    }
    if (pickerMode === 'date') {
      setTempPickerDate(date);
      if (Platform.OS === 'android') {
        setPickerMode('time');
        setShowPicker(true);
      } else {
        setPickerMode('time');
      }
    } else {
      const final = new Date(tempPickerDate);
      final.setHours(date.getHours());
      final.setMinutes(date.getMinutes());
      updateTask(pickerTaskId!, 'dueDate', final.toISOString());
      setShowPicker(false);
    }
  };

  return (
    <View className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
      <View className="px-6 pt-12 pb-6">
        <Text className="text-3xl font-bold text-slate-800 mb-2">Tasks</Text>
        <Text className="text-slate-500 text-base">Stay organized and productive</Text>
      </View>

      <View className="flex-1 px-4">
        <FlatList
          data={tasks}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Text className="text-4xl">📝</Text>
              </View>
              <Text className="text-xl font-semibold text-slate-600 mb-2">No tasks yet</Text>
              <Text className="text-slate-400 text-center px-8">
                Tap the + button below to create your first task
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              editingTaskId={editingTaskId}
              setEditingTaskId={setEditingTaskId}
              titleDraft={titleDraft}
              setTitleDraft={setTitleDraft}
              updateTask={updateTask}
              openPicker={openPicker}
              editingDescId={editingDescId}
              descDraft={descDraft}
              setEditingDescId={setEditingDescId}
              setDescDraft={setDescDraft}
              toggleComplete={toggleComplete}
              togglePriority={togglePriority}
              shareTask={shareTask}
              markAsRepeat={markAsRepeat}
              deleteTask={deleteTask}
            />
          )}
        />
      </View>

      {/* Floating + Button */}
      <TouchableOpacity style={styles.addButton} onPress={toggleMenu}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
      
      {/* Popup Menu */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect("One-off Task")}
            >
              <Text style={styles.menuText}>➕ One-off Task</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect("Routine Task")}
            >
              <Text style={styles.menuText}>↻ Routine Task</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect("muslim")}
            >
              <Text style={styles.menuText}>🕌 Muslim Prayer Task</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect("christian")}
            >
              <Text style={styles.menuText}>⛪ Christian Prayer Task</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect("hindu")}
            >
              <Text style={styles.menuText}>🕉 Hindu Prayer Task</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {showPicker && pickerTaskId && (
        <DateTimePicker
          value={tempPickerDate}
          mode={pickerMode}
          display="default"
          onChange={onPickerChange}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#007AFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingRight: 20,
    paddingBottom: 100,
  },

  menu: {
    backgroundColor: "white",
    borderRadius: 10,
    width: 250,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },

  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 15,
  },

  menuText: {
    fontSize: 16,
    color: "#333",
  },

  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 10,
  },
});

















// import DateTimePicker from '@react-native-community/datetimepicker';
// import * as Notifications from 'expo-notifications';
// import { useFocusEffect } from 'expo-router';
// import moment from 'moment';
// import {
//   useCallback,
//   useState
// } from 'react';
// import {
//   FlatList,
//   LayoutAnimation,
//   Platform,
//   Share,
//   Text,
//   TouchableOpacity,
//   UIManager,
//   View
// } from 'react-native';
// import { NotificationData } from '../utils/notificationModel';
// import { configureNotifications, scheduleTaskNotification } from '../utils/notifications';
// import { loadTasks, saveTasks } from '../utils/storage';
// import { RepeatOption, Task } from '../utils/taskModel';
// import { TaskCard } from './task-card';

// if (Platform.OS === 'android') {
//   UIManager.setLayoutAnimationEnabledExperimental?.(true);
// }

// export default function HomeScreen() {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
//   const [editingDescId, setEditingDescId] = useState<string | null>(null);
//   const [titleDraft, setTitleDraft] = useState<string>('');
//   const [descDraft, setDescDraft] = useState<string>('');
//   const [showPicker, setShowPicker] = useState(false);
//   const [pickerTaskId, setPickerTaskId] = useState<string | null>(null);
//   const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
//   const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());

//   useFocusEffect(
//     useCallback(() => {
//       configureNotifications();
//       loadTasks().then(setTasks);
//     }, [])
//   );

//   const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

//   const toggleComplete = async (id: string) => {
//     const updatedList = await Promise.all(tasks.map(async t => {
//       if (t.id !== id) return t;
//       const updatedTask = { ...t, isComplete: !t.isComplete };

//       if (updatedTask.isComplete) {
//         if (t.notificationId) await Notifications.cancelScheduledNotificationAsync(t.notificationId).catch(() => {});
//         if (t.nowNotificationId) await Notifications.cancelScheduledNotificationAsync(t.nowNotificationId).catch(() => {});
//         updatedTask.notificationId = '';
//         updatedTask.nowNotificationId = '';
//       } else {
//         const due = moment(updatedTask.dueDate);
//         if (due.isAfter(moment()) && due.isAfter(moment().add(10, 'minutes'))) {
//           const tenMinBefore: NotificationData = {
//             taskId: updatedTask.id,
//             title: `Upcoming Task: ${updatedTask.title}`,
//             message: 'Due in 10 minutes',
//             dueDate: due.clone().subtract(10, 'minutes').toISOString(),
//             repeat: updatedTask.repeat || 'none'
//           };
//           updatedTask.notificationId = await scheduleTaskNotification(tenMinBefore);
//           updatedTask.nowNotificationId = await scheduleTaskNotification({ ...tenMinBefore, message: 'Due Now', dueDate: due.toString() });
//         }

//         if (due.isAfter(moment()) && due.isBefore(moment().add(10, 'minutes'))) {
//           const nowNotif: NotificationData = {
//             taskId: updatedTask.id,
//             title: updatedTask.title,
//             message: 'Due Now',
//             dueDate: due.toString(),
//             repeat: updatedTask.repeat || 'none'
//           };
//           updatedTask.nowNotificationId = await scheduleTaskNotification(nowNotif);
//         }
//       }
//       return updatedTask;
//     }));

//     setTasks(updatedList);
//     await saveTasks(updatedList);
//   };

//   const shareTask = async (task: Task) => {
//     await Share.share({
//       message: `Task: ${task.title}\n${task.description || ''}\nDue: ${moment(task.dueDate).format('MMM DD, YYYY • hh:mm A')}`
//     });
//   };

//   const togglePriority = async (id: string) => {
//     const updated = tasks.map(t => t.id === id ? { ...t, isPriority: !t.isPriority } : t);
//     setTasks(updated);
//     await saveTasks(updated);
//   };

//   const markAsRepeat = async (task: Task) => {
//     const newT = { ...task, id: `${task.id}-copy-${Date.now()}`, isComplete: false };
//     const updated = [...tasks, newT];
//     animateLayout();
//     setTasks(updated);
//     await saveTasks(updated);
//   };

//   const handleAddNewTask = async () => {
//     const newT: Task = {
//       id: Date.now().toString(),
//       title: 'Next Task',
//       description: '',
//       isComplete: false,
//       dueDate: moment().add(1, 'hour').toISOString(),
//       isPriority: false,
//       repeat: RepeatOption.None
//     };

//     const tenMinBefore: NotificationData = {
//       taskId: newT.id,
//       title: `Upcoming Task: ${newT.title}`,
//       message: 'Due in 10 minutes',
//       dueDate: moment(newT.dueDate).subtract(10, 'minutes').toISOString(),
//       repeat: 'none'
//     };

//     const nowNotif: NotificationData = {
//       taskId: newT.id,
//       title: newT.title,
//       message: 'Due Now',
//       dueDate: newT.dueDate,
//       repeat: 'none'
//     };

//     newT.notificationId = await scheduleTaskNotification(tenMinBefore);
//     newT.nowNotificationId = await scheduleTaskNotification(nowNotif);

//     const updated = [...tasks, newT];
//     animateLayout();
//     setTasks(updated);
//     setEditingTaskId(newT.id);
//     setTitleDraft(newT.title);
//     await saveTasks(updated);
//   };

//   const deleteTask = async (id: string) => {
//   const updatedTasks = tasks.filter(t => t.id !== id);
//   animateLayout();
//   setTasks(updatedTasks);
//   await saveTasks(updatedTasks);
// };


//   const updateTask = async <K extends keyof Task>(id: string, key: K, value: Task[K]) => {
//     const updatedList: Task[] = [];

//     for (const t of tasks) {
//       if (t.id !== id) {
//         updatedList.push(t);
//         continue;
//       }

//       const updatedTask: Task = { ...t, [key]: value };

//       if (key === 'dueDate' || key === 'repeat') {
//         console.log('Updating notification', key);
//         if (t.notificationId) await Notifications.cancelScheduledNotificationAsync(t.notificationId).catch(() => {});
//         if (t.nowNotificationId) await Notifications.cancelScheduledNotificationAsync(t.nowNotificationId).catch(() => {});

//         const tenMinBefore: NotificationData = {
//           taskId: updatedTask.id,
//           title: `Upcoming Task: ${updatedTask.title}`,
//           message: 'Due in 10 minutes',
//           dueDate: moment(updatedTask.dueDate).subtract(10, 'minutes').toISOString(),
//           repeat: updatedTask.repeat || 'none'
//         };
//         console.log('Scheduling notification', tenMinBefore);

//         const nowNotif: NotificationData = {
//           taskId: updatedTask.id,
//           title: updatedTask.title,
//           message: 'Due Now',
//           dueDate: updatedTask.dueDate,
//           repeat: updatedTask.repeat || 'none'
//         };
//         console.log('Scheduling notification', nowNotif);

//         updatedTask.notificationId = await scheduleTaskNotification(tenMinBefore);
//         updatedTask.nowNotificationId = await scheduleTaskNotification(nowNotif);
//       }

//       updatedList.push(updatedTask);
//     }

//     setTasks(updatedList);
//     await saveTasks(updatedList);
//   };

//   const openPicker = (taskId: string) => {
//     const t = tasks.find(t => t.id === taskId);
//     const date = t ? new Date(t.dueDate) : new Date();
//     setTempPickerDate(date);
//     setPickerTaskId(taskId);
//     setPickerMode('date');
//     setShowPicker(true);
//   };

//   const onPickerChange = (_: any, date?: Date) => {
//     if (!date) {
//       setShowPicker(false);
//       return;
//     }
//     if (pickerMode === 'date') {
//       setTempPickerDate(date);
//       if (Platform.OS === 'android') {
//         setPickerMode('time');
//         setShowPicker(true);
//       } else {
//         setPickerMode('time');
//       }
//     } else {
//       const final = new Date(tempPickerDate);
//       final.setHours(date.getHours());
//       final.setMinutes(date.getMinutes());
//       updateTask(pickerTaskId!, 'dueDate', final.toISOString());
//       setShowPicker(false);
//     }
//   };

//   return (
//     <View className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
//       <View className="px-6 pt-12 pb-6">
//         <Text className="text-3xl font-bold text-slate-800 mb-2">Tasks</Text>
//         <Text className="text-slate-500 text-base">Stay organized and productive</Text>
//       </View>

//       <View className="flex-1 px-4">
//         <FlatList
//           data={tasks}
//           keyExtractor={i => i.id}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={{ paddingBottom: 100 }}
//           ListEmptyComponent={
//             <View className="items-center justify-center mt-20">
//               <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
//                 <Text className="text-4xl">📝</Text>
//               </View>
//               <Text className="text-xl font-semibold text-slate-600 mb-2">No tasks yet</Text>
//               <Text className="text-slate-400 text-center px-8">
//                 Tap the + button below to create your first task
//               </Text>
//             </View>
//           }
//           renderItem={({ item }) => (
//             <TaskCard
//               task={item}
//               editingTaskId={editingTaskId}
//               setEditingTaskId={setEditingTaskId}
//               titleDraft={titleDraft}
//               setTitleDraft={setTitleDraft}
//               updateTask={updateTask}
//               openPicker={openPicker}
//               editingDescId={editingDescId}
//               descDraft={descDraft}
//               setEditingDescId={setEditingDescId}
//               setDescDraft={setDescDraft}
//               toggleComplete={toggleComplete}
//               togglePriority={togglePriority}
//               shareTask={shareTask}
//               markAsRepeat={markAsRepeat}
//               deleteTask={deleteTask}
//             />
//           )}
//         />
//       </View>

//       <TouchableOpacity
//         className="absolute bottom-8 right-6 items-center justify-center"
//         onPress={handleAddNewTask}
//       >
//         <View className="rounded-full w-16 h-16 bg-blue-100 items-center justify-center">
//           <Text className="text-slate-600 text-5xl mb-2">+</Text>
//         </View>
//       </TouchableOpacity>

//       {showPicker && pickerTaskId && (
//         <DateTimePicker
//           value={tempPickerDate}
//           mode={pickerMode}
//           display="default"
//           onChange={onPickerChange}
//         />
//       )}
//     </View>
//   );
// }
