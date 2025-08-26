import { useState } from 'react';
import { Platform } from 'react-native';
import { Task } from '../utils/taskModel';

export function useDatePicker(tasks: Task[], updateTask: (id: string, key: keyof Task, value: any) => Promise<void>) {
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
    const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());
    const [pickerTaskId, setPickerTaskId] = useState<string | null>(null);

    const openPicker = (taskId: string) => {
        const t = tasks.find((x) => x.id === taskId);
        const date = t ? new Date(t.dueDate) : new Date();
        setTempPickerDate(date);
        setPickerTaskId(taskId);
        setPickerMode('date');
        setShowPicker(true);
    };

    const closePicker = () => {
        setShowPicker(false);
        setPickerTaskId(null);
        setPickerMode('date');
    };

    const onPickerChange = (_: any, date?: Date) => {
        if (!date) {
            // user dismissed
            closePicker();
            return;
        }

        if (pickerMode === 'date') {
            // first selection is date -> store and open time (Android needs explicit time picker)
            setTempPickerDate(date);
            if (Platform.OS === 'android') {
                setPickerMode('time');
                setShowPicker(true);
            } else {
                setPickerMode('time');
            }
            return;
        }

        // pickerMode === 'time' (final)
        const final = new Date(tempPickerDate);
        final.setHours(date.getHours());
        final.setMinutes(date.getMinutes());
        final.setSeconds(0);
        final.setMilliseconds(0);

        if (!pickerTaskId) {
            closePicker();
            return;
        }

        // update the task via provided updater
        updateTask(pickerTaskId, 'dueDate', final.toISOString()).catch((err) => console.warn('updateTask error', err));
        closePicker();
    };

    return {
        showPicker,
        pickerMode,
        tempPickerDate,
        pickerTaskId,
        openPicker,
        closePicker,
        onPickerChange,
        setTempPickerDate,
        setPickerMode,
    };
}
