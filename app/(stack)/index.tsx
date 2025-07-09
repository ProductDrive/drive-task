import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import moment from 'moment';
import {
    useCallback,
    useState
} from 'react';
import {
    Alert,
    FlatList,
    LayoutAnimation,
    Platform,
    Share,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import { configureNotifications, scheduleTaskNotification } from '../utils/notifications';
import { loadTasks, saveTasks } from '../utils/storage';
import { Task } from '../utils/taskModel';


if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTaskId, setPickerTaskId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());

  useFocusEffect(
    useCallback(() => {
      configureNotifications();
      loadTasks().then(setTasks);
    }, [])
  );

  const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const toggleComplete = async (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, isComplete: !t.isComplete } : t);
    setTasks(updated);
    await saveTasks(updated);
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
    };
    await scheduleTaskNotification(newT.id, newT.title, newT.dueDate);
    const updated = [...tasks, newT];
    animateLayout();
    setTasks(updated);
    setEditingTaskId(newT.id);
    await saveTasks(updated);
  };

  const updateTask = async <K extends keyof Task>(id: string, key: K, value: Task[K]) => {
    const updated = tasks.map(t => t.id === id ? { ...t, [key]: value } : t);
    setTasks(updated);
    await saveTasks(updated);
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
            <View className="mb-4">
              <TouchableOpacity
                className={`rounded-2xl overflow-hidden ${item.isComplete ? 'bg-slate-100' : 'bg-white shadow-lg'}`}
                onPress={() => toggleComplete(item.id)}
                activeOpacity={0.7}
              >
                <View className="p-5 relative">
                  {/* ✅ Green Checkmark */}
                  <View className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 items-center justify-center
                                  border-slate-300 bg-white z-10">
                    {item.isComplete && (
                      <View className="bg-green-500 w-full h-full rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">✓</Text>
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  {editingTaskId === item.id ? (
                    <TextInput
                      value={item.title}
                      onChangeText={t => updateTask(item.id, 'title', t)}
                      onBlur={() => setEditingTaskId(null)}
                      autoFocus
                      className="text-lg font-semibold mb-1 text-slate-800 border-b"
                    />
                  ) : (
                    <Text
                      className={`text-lg font-semibold mb-1 ${item.isComplete ? 'line-through text-slate-400' : 'text-slate-800'}`}
                    >
                      {item.title}
                    </Text>
                  )}

                  {/* Description */}
                  {editingDescId === item.id ? (
                    <TextInput
                      value={item.description}
                      onChangeText={t => updateTask(item.id, 'description', t)}
                      onBlur={() => setEditingDescId(null)}
                      autoFocus
                      className="text-sm mb-3 text-slate-600 border-b pb-1"
                      placeholder="Description..."
                    />
                  ) : (
                    <Text
                      onPress={() => setEditingDescId(item.id)}
                      className={`text-sm mb-3 leading-5 ${item.isComplete ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      {item.description || 'Tap to add description...'}
                    </Text>
                  )}

                  {/* Due Date */}
                  <TouchableOpacity
                    className={`px-3 py-1 rounded-full mb-4`}
                    onPress={() => openPicker(item.id)}
                  >
                    <Text className={`text-l font-medium ${item.isComplete ? 'text-slate-400' : 'text-blue-600'}`}>
                      📅 {moment(item.dueDate).format('MMM DD, YYYY • hh:mm A')}
                    </Text>
                  </TouchableOpacity>

                  {/* Actions */}
                  <View className="flex-row justify-between mt-2">
                    {['✉️', '🔁', item.isPriority ? '⭐' : '☆', '✏️', '🗑️'].map((icon, i) => {
                      const handlers = [
                        () => shareTask(item),
                        () => markAsRepeat(item),
                        () => togglePriority(item.id),
                        () => setEditingTaskId(item.id),
                        () => Alert.alert('Delete Task', 'Are you sure?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const upd = tasks.filter(t => t.id !== item.id);
                              animateLayout();
                              setTasks(upd);
                              await saveTasks(upd);
                            },
                          },
                        ]),
                      ];
                      return (
                        <TouchableOpacity key={i} className="flex-1 items-center" onPress={handlers[i]}>
                          <Text className="text-xl">{icon}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Floating Add Task Button */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 items-center justify-center"
        onPress={handleAddNewTask}
      >
        <View className="rounded-full w-16 h-16 bg-blue-100 items-center justify-center">
          <Text className="text-slate-600 text-5xl mb-2">+</Text>
        </View>
      </TouchableOpacity>

      {/* Date / Time Picker */}
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