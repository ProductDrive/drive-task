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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { registerBackgroundTask } from '../utils/backgroundTasks';
import { NotificationData, NotificationKind } from '../utils/notificationModel';
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
      registerBackgroundTask();
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
        let prayerTime = new Date(prayer.dueDate);
        const nowNotif: NotificationData = {
          taskId: prayer.id,
          title: prayer.title,
          message: 'Due Now',
          dueDate: prayerTime,
          repeat: prayer.repeat?? RepeatOption.Daily,
          kind: NotificationKind.Final
        };
        //remove 10 minutes
        prayerTime.setMinutes(prayerTime.getMinutes() - 10);
        const tenMinBefore: NotificationData = {
          taskId: prayer.id,
          title: `Upcoming Task: ${prayer.title}`,
          message: 'Due in 10 minutes',
          dueDate: prayerTime,
          repeat: prayer.repeat?? RepeatOption.Daily,
          kind: NotificationKind.Warning
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
        const due = new Date(updatedTask.dueDate);
        const nowNotif: NotificationData = {
          taskId: updatedTask.id,
          title: updatedTask.title,
          message: 'Due Now',
          dueDate: due,
          repeat: updatedTask.repeat || 'none',
          kind: NotificationKind.Final
        };
        //remove 10 minutes
        due.setMinutes(due.getMinutes() - 10);
        const tenMinBefore: NotificationData = {
          taskId: updatedTask.id,
          title: `Upcoming Task: ${updatedTask.title}`,
          message: 'Due in 10 minutes',
          dueDate: due,
          repeat: updatedTask.repeat || 'none',
          kind: NotificationKind.Warning
        };
        updatedTask.notificationId = await scheduleTaskNotification(tenMinBefore);
        updatedTask.nowNotificationId = await scheduleTaskNotification(nowNotif);
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
    // dueDate is 1 hour from now
    const newTaskDue = new Date();
    console.log('new current time in index', newTaskDue);
    newTaskDue.setMinutes(newTaskDue.getMinutes() + 15);
    console.log('15 minutes in future in index', newTaskDue);

    //newTaskDue.setHours(newTaskDue.getHours() + 1);
    //console.log('ONE hours in future in index', newTaskDue);
    const newT: Task = {
      id: Date.now().toString(),
      title: 'Next Task',
      description: '',
      isComplete: false,
      dueDate: newTaskDue.toISOString(),
      isPriority: false,
      repeat: RepeatOption.None
    };
    console.log('saved date in index', newT.dueDate);
    const nowNotif: NotificationData = {
      taskId: newT.id,
      title: newT.title,
      message: 'Due Now',
      dueDate: new Date(newT.dueDate),
      repeat: 'none',
      kind: NotificationKind.Final
    };
    newT.nowNotificationId = await scheduleTaskNotification(nowNotif);
    // remove 10 minutes
    newTaskDue.setMinutes(newTaskDue.getMinutes() - 10);
    const tenMinBefore: NotificationData = {
      taskId: newT.id,
      title: `Upcoming Task: ${newT.title}`,
      message: 'Due in 10 minutes',
      dueDate: newTaskDue,
      repeat: 'none',
      kind: NotificationKind.Warning
    };
    console.log('10 min before in index', tenMinBefore.dueDate);
    newT.notificationId = await scheduleTaskNotification(tenMinBefore);

    const updated = [...tasks, newT];
    animateLayout();
    setTasks(updated);
    setEditingTaskId(newT.id);
    setTitleDraft(newT.title);
    await saveTasks(updated);
    setShowModal(false); // close modal after adding
  };

  const handleAddRoutineTask = async () => {
    const due = new Date();
    console.log('new taskduedate for routine in index', due);
    // dueDate is 1 hour from now
    due.setMinutes(due.getMinutes() + 15);
    console.log('ONE hours in future for routine in index', due);
     const newT: Task = {
      id: Date.now().toString(),
      title: 'Next Task',
      description: '',
      isComplete: false,
      dueDate: due.toISOString(),
      isPriority: false,
      repeat: RepeatOption.Daily
    };

    const nowNotif: NotificationData = {
      taskId: newT.id,
      title: newT.title,
      message: 'Due Now',
      dueDate: new Date(newT.dueDate),
      repeat: 'daily',
      kind: NotificationKind.Final
    };
    
    newT.nowNotificationId = await scheduleTaskNotification(nowNotif);

    // Remove 10 minutes
    due.setMinutes(due.getMinutes() - 10);
    const tenMinBefore: NotificationData = {
      taskId: newT.id,
      title: `Upcoming Task: ${newT.title}`,
      message: 'Due in 10 minutes',
      dueDate: due,
      repeat: 'daily',
      kind: NotificationKind.Warning
    };
    newT.notificationId = await scheduleTaskNotification(tenMinBefore);

    console.log(newT.notificationId, newT.nowNotificationId);
    const updated = [...tasks, newT];
    animateLayout();
    setTasks(updated);
    setEditingTaskId(newT.id);
    setTitleDraft(newT.title);
    await saveTasks(updated);
    setShowModal(false); // close modal after adding
};

  const deleteTask = async (id: string) => {
    if (tasks.find(t => t.id === id)?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(tasks.find(t => t.id === id)?.notificationId ?? '').catch(() => {});
    }
    if (tasks.find(t => t.id === id)?.nowNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(tasks.find(t => t.id === id)?.nowNotificationId ?? '').catch(() => {});
    }
    
    const updatedTasks = tasks.filter(t =>  t.id !== id);
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

      if (key === 'dueDate' || key === 'repeat' || key === 'title') {
        if (t.notificationId) await Notifications.cancelScheduledNotificationAsync(t.notificationId).catch(() => {});
        if (t.nowNotificationId) await Notifications.cancelScheduledNotificationAsync(t.nowNotificationId).catch(() => {});
        console.log(t.notificationId, t.nowNotificationId);
        const due = new Date(updatedTask.dueDate);
        // THIS SHUOLD BE CHECKED
        console.log('updated taskduedate in index', updatedTask.dueDate);
        const nowNotif: NotificationData = {
          taskId: updatedTask.id,
          title: updatedTask.title,
          message: 'Due Now',
          dueDate: due,
          repeat: updatedTask.repeat || 'none',
          kind: NotificationKind.Final
        };
        updatedTask.nowNotificationId = await scheduleTaskNotification(nowNotif);

        const tenMinBefore: NotificationData = {
          taskId: updatedTask.id,
          title: `Upcoming Task: ${updatedTask.title}`,
          message: 'Due in 10 minutes',
          dueDate: due,
          repeat: updatedTask.repeat || 'none',
          kind: NotificationKind.Warning
        };
        tenMinBefore.dueDate.setMinutes(tenMinBefore.dueDate.getMinutes() - 10);
        updatedTask.notificationId = await scheduleTaskNotification(tenMinBefore);
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

      <KeyboardAwareScrollView
        style={{ flex: 1, marginBottom: 100 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
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
      </KeyboardAwareScrollView>
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

