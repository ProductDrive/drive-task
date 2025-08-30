
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';
import { LayoutAnimation, Platform, Share, UIManager } from 'react-native';
import { NotificationData, NotificationKind } from '../utils/notificationModel';
import { cancelNotification, configureNotifications, scheduleTaskNotification } from '../utils/notifications';
import { christianPrayers, hinduPrayers, muslimPrayers } from '../utils/routineTaskTimes';
import { loadTasks as _loadTasks, saveTasks as _saveTasks } from '../utils/storage';
import { RepeatOption, Task } from '../utils/taskModel';
// enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    // @ts-ignore
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

function animateLayout() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);

    const loadTasks = useCallback(async () => {
        try {
            const loaded = await _loadTasks();
            persistAndSet(await resetRecurringTasks(loaded));
        } catch (err) {
            console.warn('loadTasks failed', err);
        }
    }, []);

    // keep load on mount as well
    useEffect(() => {
        loadTasks();
        configureNotifications().catch(() => { });
    }, [loadTasks]);

    const persistAndSet = async (next: Task[]) => {
        setTasks(next);
        await _saveTasks(next);
    };

    const createPrayerTasks = (type: 'christian' | 'muslim' | 'hindu'): Task[] => {
        const prayers = type === 'christian' ? christianPrayers : type === 'muslim' ? muslimPrayers : hinduPrayers;
        return prayers.map((prayer) => {
            const [hh, mm] = prayer.time.split(':').map(Number);
            const due = new Date();
            due.setHours(hh, mm, 0, 0);

            return {
                id: (Date.now() + Math.random()).toString(),
                title: prayer.title,
                description: `${prayer.title} reminder`,
                dueDate: due.toISOString(),
                isComplete: false,
                isPriority: true,
                repeat: prayer.repeat,
            } as Task;
        });
    };

    const handleAddNewTask = async () => {
        const newTaskDue = new Date();
        newTaskDue.setMinutes(newTaskDue.getMinutes() + 15);

        const newT: Task = {
            id: Date.now().toString(),
            title: 'Next Task',
            description: '',
            isComplete: false,
            dueDate: newTaskDue.toISOString(),
            isPriority: false,
            repeat: RepeatOption.None,
        };

        // Now schedule notifications
        const nowNotif: NotificationData = {
            taskId: newT.id,
            title: newT.title,
            message: 'Due Now',
            dueDate: new Date(newT.dueDate),
            repeat: RepeatOption.None,
            kind: NotificationKind.Final,
        };
        newT.nowNotificationId = await scheduleTaskNotification(nowNotif);

        // Ten minutes before
        const tenBefore = new Date(newTaskDue);
        tenBefore.setMinutes(tenBefore.getMinutes() - 10);
        const tenMinBefore: NotificationData = {
            taskId: newT.id,
            title: `Upcoming Task: ${newT.title}`,
            message: 'Due in 10 minutes',
            dueDate: tenBefore,
            repeat: RepeatOption.None,
            kind: NotificationKind.Warning,
        };
        newT.notificationId = await scheduleTaskNotification(tenMinBefore);

        const updated = [...tasks, newT];
        animateLayout();
        await persistAndSet(updated);
        return newT;
    };

    const handleAddRoutineTask = async () => {
        const due = new Date();
        due.setMinutes(due.getMinutes() + 15);

        const newT: Task = {
            id: Date.now().toString(),
            title: 'Next Task',
            description: '',
            isComplete: false,
            dueDate: due.toISOString(),
            isPriority: false,
            repeat: RepeatOption.Daily,
        };

        const nowNotif: NotificationData = {
            taskId: newT.id,
            title: newT.title,
            message: 'Due Now',
            dueDate: new Date(newT.dueDate),
            repeat: RepeatOption.Daily,
            kind: NotificationKind.Final,
        };
        newT.nowNotificationId = await scheduleTaskNotification(nowNotif);

        // 10min before
        const tenBefore = new Date(due);
        tenBefore.setMinutes(tenBefore.getMinutes() - 10);
        const tenMinBefore: NotificationData = {
            taskId: newT.id,
            title: `Upcoming Task: ${newT.title}`,
            message: 'Due in 10 minutes',
            dueDate: tenBefore,
            repeat: RepeatOption.Daily,
            kind: NotificationKind.Warning,
        };
        newT.notificationId = await scheduleTaskNotification(tenMinBefore);

        const updated = [...tasks, newT];
        animateLayout();
        await persistAndSet(updated);
        return newT;
    };

    const handleAddPrayerTasks = async (type: 'christian' | 'muslim' | 'hindu') => {
        const prayers = createPrayerTasks(type);
        for (const prayer of prayers) {
            const prayerTime = new Date(prayer.dueDate);

            const nowNotif: NotificationData = {
                taskId: prayer.id,
                title: prayer.title,
                message: 'Due Now',
                dueDate: prayerTime,
                repeat: prayer.repeat ?? RepeatOption.Daily,
                kind: NotificationKind.Final,
            };

            const tenBefore = new Date(prayerTime);
            tenBefore.setMinutes(tenBefore.getMinutes() - 10);
            const tenMinBefore: NotificationData = {
                taskId: prayer.id,
                title: `Upcoming Task: ${prayer.title}`,
                message: 'Due in 10 minutes',
                dueDate: tenBefore,
                repeat: prayer.repeat ?? RepeatOption.Daily,
                kind: NotificationKind.Warning,
            };

            prayer.notificationId = await scheduleTaskNotification(tenMinBefore);
            prayer.nowNotificationId = await scheduleTaskNotification(nowNotif);
        }

        const updated = [...tasks, ...prayers];
        animateLayout();
        await persistAndSet(updated);
    };

    const toggleComplete = async (id: string) => {
        const updatedList = await Promise.all(
            tasks.map(async (t) => {
                if (t.id !== id) return t;
                const updatedTask = { ...t, isComplete: !t.isComplete };

                if (updatedTask.isComplete) {
                    // cancel notifications
                    await cancelNotification(t?.notificationId ?? '');
                    await cancelNotification(t?.nowNotificationId ?? '');
                    updatedTask.notificationId = '';
                    updatedTask.nowNotificationId = '';
                } else {
                    // reschedule
                    const due = new Date(updatedTask.dueDate);
                    const nowNotif: NotificationData = {
                        taskId: updatedTask.id,
                        title: updatedTask.title,
                        message: 'Due Now',
                        dueDate: due,
                        repeat: updatedTask.repeat ?? RepeatOption.None,
                        kind: NotificationKind.Final,
                    };

                    const tenBefore = new Date(due);
                    tenBefore.setMinutes(tenBefore.getMinutes() - 10);
                    const tenMinBefore: NotificationData = {
                        taskId: updatedTask.id,
                        title: `Upcoming Task: ${updatedTask.title}`,
                        message: 'Due in 10 minutes',
                        dueDate: tenBefore,
                        repeat: updatedTask.repeat ?? RepeatOption.None,
                        kind: NotificationKind.Warning,
                    };

                    updatedTask.notificationId = await scheduleTaskNotification(tenMinBefore);
                    updatedTask.nowNotificationId = await scheduleTaskNotification(nowNotif);
                }
                return updatedTask;
            })
        );

        animateLayout();
        await persistAndSet(updatedList);
    };

    const shareTask = async (task: Task) => {
        try {
            await Share.share({
                message: `Task: ${task.title}\n${task.description || ''}\nDue: ${moment(task.dueDate).format('MMM DD, YYYY • hh:mm A')}`,
            });
        } catch (err) {
            console.warn('shareTask err', err);
        }
    };

    const togglePriority = async (id: string) => {
        const updated = tasks.map((t) => (t.id === id ? { ...t, isPriority: !t.isPriority } : t));
        animateLayout();
        await persistAndSet(updated);
    };

    const markAsRepeat = async (task: Task) => {
        const newT: Task = { ...task, id: `${task.id}-copy-${Date.now()}`, isComplete: false };
        const updated = [...tasks, newT];
        animateLayout();
        await persistAndSet(updated);
    };

    const deleteTask = async (id: string) => {
        const t = tasks.find((x) => x.id === id);
        if (t?.notificationId) {
            await cancelNotification(t.notificationId);
        }
        if (t?.nowNotificationId) {
            await cancelNotification(t.nowNotificationId);
        }
        const updatedTasks = tasks.filter((x) => x.id !== id);
        animateLayout();
        await persistAndSet(updatedTasks);
    };

    const updateTask = async <K extends keyof Task>(id: string, key: K, value: Task[K]) => {
        const updatedList: Task[] = [];

        for (const t of tasks) {
            if (t.id !== id) {
                updatedList.push(t);
                continue;
            }

            const updatedTask: Task = { ...t, [key]: value };

            // If key affects scheduling, cancel + reschedule
            if (key === 'dueDate' || key === 'repeat' || key === 'title') {
                console.log('reschedule');
                if (t.notificationId) await cancelNotification(t.notificationId);
                if (t.nowNotificationId) await cancelNotification(t.nowNotificationId);

                const due = new Date(updatedTask.dueDate);

                const nowNotif: NotificationData = {
                    taskId: updatedTask.id,
                    title: updatedTask.title,
                    message: 'Due Now',
                    dueDate: due,
                    repeat: updatedTask.repeat ?? RepeatOption.None,
                    kind: NotificationKind.Final,
                };
                updatedTask.nowNotificationId = await scheduleTaskNotification(nowNotif);

                const tenMinBefore: NotificationData = {
                    taskId: updatedTask.id,
                    title: `Upcoming Task: ${updatedTask.title}`,
                    message: 'Due in 10 minutes',
                    dueDate: new Date(due),
                    repeat: updatedTask.repeat ?? RepeatOption.None,
                    kind: NotificationKind.Warning,
                };
                tenMinBefore.dueDate.setMinutes(tenMinBefore.dueDate.getMinutes() - 10);
                updatedTask.notificationId = await scheduleTaskNotification(tenMinBefore);
            }

            updatedList.push(updatedTask);
        }

        animateLayout();
        await persistAndSet(updatedList);
    };

    const resetRecurringTasks = async (tasks: Task[]) => {
        const updated = tasks.map(task => {
            const isOverdue = moment(task.dueDate).isBefore(moment());
            if (isOverdue && task.repeat !== 'none') {
                let updatedTask = { ...task };
                const originalTime = moment(task.dueDate).format("HH:mm"); // Extract time
                // If daily repeat, move dueDate to today (keep original time)
                if (task.repeat === 'daily') {
                    updatedTask.isComplete = false;
                    updatedTask.dueDate = moment(task.dueDate).add(1, 'days').format(`YYYY-MM-DD ${originalTime}`);
                } else if (task.repeat === 'weekly') {
                    // Move to the same weekday next week
                    updatedTask.dueDate = moment(task.dueDate).add(1, 'weeks').format(`YYYY-MM-DD ${originalTime}`);
                    updatedTask.isComplete = false;
                } else if (task.repeat === 'monthly') {
                    // Move to the same day next month
                    updatedTask.dueDate = moment(task.dueDate).add(1, 'months').format(`YYYY-MM-DD ${originalTime}`);
                    updatedTask.isComplete = false;
                } else {
                    updatedTask.isComplete = true;
                }
                    return updatedTask;
            }
            return task;
        });
        updated.sort((a, b) => {
              if (a.isComplete !== b.isComplete) {
                return a.isComplete ? 1 : -1; // incomplete first
              }
              if (a.isPriority !== b.isPriority) {
                return b.isPriority ? 1 : -1; // priority first
              }
              return moment(a.dueDate).valueOf() - moment(b.dueDate).valueOf(); // soonest due date first
            });
        
        return updated;
    };

    return {
        tasks,
        setTasks,
        loadTasks,
        handleAddNewTask,
        handleAddRoutineTask,
        handleAddPrayerTasks,
        toggleComplete,
        togglePriority,
        markAsRepeat,
        deleteTask,
        updateTask,
        shareTask,
        resetRecurringTasks,
    };
}
