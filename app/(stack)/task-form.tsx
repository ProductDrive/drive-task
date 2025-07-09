import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { cancelNotification, scheduleNowTaskNotification, scheduleTaskNotification } from '../utils/notifications';
import { loadTasks, saveTasks } from '../utils/storage';
import { Task, createEmptyTask } from '../utils/taskModel';

export default function TaskForm() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const [task, setTask] = useState<Task>(createEmptyTask());
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [focusedField, setFocusedField] = useState<string>('');

    useEffect(() => {
        loadTasks().then((tasks) => {
            setAllTasks(tasks);
            if (id) {
                const existing = tasks.find((t) => t.id === id);
                if (existing) setTask(existing);
            }
        });
    }, [id]);




    const handleSave = async () => {
        let updatedTask = task;

        // cancel old notification if rescheduling
        if (task.notificationId) {
            await cancelNotification(task.notificationId);
        }

        if (task.dueDate) {
            const newNotifId = await scheduleTaskNotification(task.id, task.title, task.dueDate);
            const notifId = await scheduleNowTaskNotification(task.id, task.title, task.dueDate);
            updatedTask = { ...task, notificationId: newNotifId, nowNotificationId: notifId };
        }

        const updatedList = id
            ? allTasks.map((t) => (t.id === id ? updatedTask : t))
            : [...allTasks, updatedTask];

        await saveTasks(updatedList);
        router.back();
    };


    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date: any) => {
        setTask((prev) => ({
            ...prev,
            dueDate: date.toISOString(),
        }));
        console.warn("A date has been picked: ", date);
        hideDatePicker();
    };


    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
                {/* Header Section */}
                <View className="px-6 pt-12 pb-6">
                    <View className="flex-row items-center mb-2">
                        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                            <Text className="text-xl">{id ? '✏️' : '➕'}</Text>
                        </View>
                        <Text className="text-3xl font-bold text-slate-800">
                            {id ? 'Edit Task' : 'New Task'}
                        </Text>
                    </View>
                    <Text className="text-slate-500 text-base ml-13">
                        {id ? 'Update your task details' : 'Create a new task to stay organized'}
                    </Text>
                </View>

                {/* Form Container */}
                <View className="flex-1 bg-white mx-4 rounded-t-3xl shadow-lg shadow-slate-200/50 px-6 py-8">

                    {/* Title Field */}
                    <View className="mb-6">
                        <Text className="text-base font-semibold text-slate-700 mb-3 ml-1">
                            📝 Task Title
                        </Text>
                        <View className={`border-2 rounded-2xl overflow-hidden ${focusedField === 'title' ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 bg-slate-50'
                            }`}>
                            <TextInput
                                className="px-4 py-4 text-base text-slate-800 bg-transparent"
                                placeholder="What needs to be done?"
                                placeholderTextColor="#94a3b8"
                                value={task.title}
                                onChangeText={(text) => setTask({ ...task, title: text })}
                                onFocus={() => setFocusedField('title')}
                                onBlur={() => setFocusedField('')}
                            />
                        </View>
                    </View>

                    {/* Description Field */}
                    <View className="mb-6">
                        <Text className="text-base font-semibold text-slate-700 mb-3 ml-1">
                            📄 Description
                        </Text>
                        <View className={`border-2 rounded-2xl overflow-hidden ${focusedField === 'description' ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 bg-slate-50'
                            }`}>
                            <TextInput
                                className="px-4 py-4 text-base text-slate-800 bg-transparent min-h-[120px]"
                                placeholder="Add more details about your task..."
                                placeholderTextColor="#94a3b8"
                                value={task.description}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                onChangeText={(text) => setTask({ ...task, description: text })}
                                onFocus={() => setFocusedField('description')}
                                onBlur={() => setFocusedField('')}
                            />
                        </View>
                    </View>

                    {/* Due Date Field */}
                    <View className="mb-8">
                        <Text className="text-base font-semibold text-slate-700 mb-3 ml-1">
                            📅 Due Date & Time
                        </Text>
                        <TouchableOpacity
                            onPress={showDatePicker}
                            className="border-2 border-slate-200 bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between"
                            activeOpacity={0.7}
                        >
                            <View className="flex-1">
                                <Text className={`text-base ${task.dueDate ? 'text-slate-800 font-medium' : 'text-slate-400'
                                    }`}>
                                    {task.dueDate
                                        ? format(new Date(task.dueDate), 'EEEE, MMM dd, yyyy • HH:mm')
                                        : 'Select date & time'}
                                </Text>
                                {task.dueDate && (
                                    <Text className="text-sm text-slate-500 mt-1">
                                        {format(new Date(task.dueDate), "'Due in' dd HH:mm")}
                                    </Text>
                                )}
                            </View>
                            <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                                <Text className="text-blue-600 text-sm">📅</Text>
                            </View>
                        </TouchableOpacity>

                        <DateTimePickerModal
                            isVisible={isDatePickerVisible}
                            mode="datetime"
                            onConfirm={handleConfirm}
                            onCancel={hideDatePicker}
                            textColor="#1e293b"
                            accentColor="#2563eb"
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl py-4 px-6 shadow-lg shadow-blue-500/30 mb-4"
                        onPress={handleSave}
                        activeOpacity={0.8}
                    >
                        <View className="flex-row items-center justify-center">
                            <Text className="text-black text-lg font-semibold mr-2">
                                {id ? 'Update Task' : 'Create Task'}
                            </Text>
                            <Text className="text-black text-lg">
                                {id ? '✏️' : '✨'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Helper Text */}
                    <Text className="text-center text-slate-400 text-sm">
                        {id ? 'Your changes will be saved automatically' : 'Your new task will be added to your list'}
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>

    );
}
