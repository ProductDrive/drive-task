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
  
      if (isOverdue) {
        let updatedTask = { ...task, isComplete: true };
        const originalTime = moment(task.dueDate).format("HH:mm"); // Extract time
        // If daily repeat, move dueDate to today (keep original time)
        if (task.repeat === 'daily') {
          task.isComplete = false;
          updatedTask.dueDate = moment().format(`YYYY-MM-DD ${originalTime}`);
        }else if (task.repeat === 'weekly') {
          // Move to the same weekday next week
          updatedTask.dueDate = moment(task.dueDate)
            .add(1, 'weeks')
            .format(`YYYY-MM-DD ${originalTime}`);
            task.isComplete = false;
        } else if (task.repeat === 'monthly') {
          // Move to the same day next month
          updatedTask.dueDate = moment(task.dueDate)
          .add(1, 'months')
          .format(`YYYY-MM-DD ${originalTime}`);
          task.isComplete = false;
        }
        return updatedTask;
      }
      return task;
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
