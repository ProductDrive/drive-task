import AsyncStorage from '@react-native-async-storage/async-storage';
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
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Loading tasks failed', e);
        return [];
    }
};
