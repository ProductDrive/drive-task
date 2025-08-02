import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { Task } from './taskModel';

const TASKS_KEY = 'TASKS_LIST';

export const saveTasks = async (tasks: Task[]) => {
    try {
        await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('Saving tasks failed', e);
    }
};



export const loadTasks = async (): Promise<Task[]> => {
  try {
    const stored = await AsyncStorage.getItem(TASKS_KEY);
    if (!stored) return [];

    const parsed: Task[] = JSON.parse(stored);

    const updated = parsed.map(task => {
      const isOverdue = moment(task.dueDate).isBefore(moment());
      return isOverdue ? { ...task, isComplete: true } : task;
    });

    // Sort:
    // 1. Incomplete tasks before completed
    // 2. Among them, priority tasks first
    // 3. Then by earliest due date
    updated.sort((a, b) => {
      if (a.isComplete !== b.isComplete) {
        return a.isComplete ? 1 : -1; // incomplete first
      }
      if (a.isPriority !== b.isPriority) {
        return b.isPriority ? 1 : -1; // priority first
      }
      return moment(a.dueDate).valueOf() - moment(b.dueDate).valueOf(); // soonest due date first
    });

    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));

    return updated;
  } catch (e) {
    console.error('Loading tasks failed', e);
    return [];
  }
};

// webinar password kRrg&3Wn6Uh0qaa
