import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from './taskModel';
import moment from 'moment';

const TASKS_KEY = 'TASKS_LIST';

export const saveTasks = async (tasks: Task[]) => {
    try {
        await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('Saving tasks failed', e);
    }
};

// export const loadTasks = async (): Promise<Task[]> => {
//     try {
//         const stored = await AsyncStorage.getItem(TASKS_KEY);
//         return stored ? JSON.parse(stored) : [];
//     } catch (e) {
//         console.error('Loading tasks failed', e);
//         return [];
//     }
// };

export const loadTasks = async (): Promise<Task[]> => {
  try {
    const stored = await AsyncStorage.getItem(TASKS_KEY);
    if (!stored) return [];

    const parsed: Task[] = JSON.parse(stored);

    const updated = parsed.map(task => {
      const isOverdue = moment(task.dueDate).isBefore(moment());
      return isOverdue ? { ...task, isComplete: true } : task;
    });

    // Optionally save the updated tasks back to storage
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));

    return updated;
  } catch (e) {
    console.error('Loading tasks failed', e);
    return [];
  }
};
