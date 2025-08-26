import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDatePicker } from '../hooks/useDatePicker';
import { useEditing } from '../hooks/useEditing';
import { useMenu } from '../hooks/useMenu';
import { useTasks } from '../hooks/useTasks';
import { configureNotifications } from '../utils/notifications';
// import { RepeatOption } from '../types';
import { registerBackgroundTask } from '../utils/backgroundTasks';
import { TaskCard } from './task-card';


export default function HomeScreen() {
  const {
    tasks,
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
  } = useTasks();

  const { menuVisible, toggleMenu, closeMenu, setMenuVisible } = useMenu();

  const {
    editingTaskId,
    setEditingTaskId,
    editingDescId,
    setEditingDescId,
    titleDraft,
    setTitleDraft,
    descDraft,
    setDescDraft,
    showModal,
    setShowModal,
  } = useEditing();

  const datePicker = useDatePicker(tasks, updateTask);



  useFocusEffect(
    useCallback(() => {
      // run every time screen focuses
      registerBackgroundTask().catch(() => { });
      configureNotifications().catch(() => { });
      loadTasks().catch(() => { });
    }, [])
  );

  const handleMenuSelect = async (type: string) => {
    setMenuVisible(false);
    if (type === 'One-off Task') {
      const newT = await handleAddNewTask();
      // edit immediately
      setEditingTaskId(newT.id);
      setTitleDraft(newT.title);
    } else if (type === 'Routine Task') {
      const newT = await handleAddRoutineTask();
      setEditingTaskId(newT.id);
      setTitleDraft(newT.title);
    } else if (type === 'muslim' || type === 'christian' || type === 'hindu') {
      // create prayer tasks
      await handleAddPrayerTasks(type as 'muslim' | 'christian' | 'hindu');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 4 }}>Tasks</Text>
        <Text style={{ color: '#64748b' }}>Stay organized and productive</Text>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1, marginBottom: 100 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* FlatList could stay — simplified here as full FlatList in original */}
          {/* I'll use FlatList to preserve original behavior */}
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
                  openPicker={datePicker?.openPicker}
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
        </View>
      </KeyboardAwareScrollView>

      {/* Floating + Button */}
      <TouchableOpacity style={styles.addButton} onPress={toggleMenu}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Popup Menu */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPressOut={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelect('One-off Task')}>
              <Text style={styles.menuText}>➕ One-off Task</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelect('Routine Task')}>
              <Text style={styles.menuText}>↻ Routine Task</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelect('muslim')}>
              <Text style={styles.menuText}>🕌 Muslim Prayer Task</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelect('christian')}>
              <Text style={styles.menuText}>⛪ Christian Prayer Task</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelect('hindu')}>
              <Text style={styles.menuText}>🕉 Hindu Prayer Task</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DateTimePicker */}
      {datePicker.showPicker && datePicker.pickerTaskId && (
        <DateTimePicker
          value={datePicker.tempPickerDate}
          mode={datePicker.pickerMode}
          display="default"
          onChange={datePicker.onPickerChange}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    backgroundColor: '#2563eb',
    borderRadius: 28,
    padding: 14,
    elevation: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuText: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
});

