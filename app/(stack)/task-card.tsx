import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TaskCardProps } from '../utils/taskcardModel';

import { RepeatOption } from '../utils/taskModel';

const repeatOptions = Object.values(RepeatOption);

export function TaskCard(taskUtils: TaskCardProps) {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // reset dirty state when task changes or edit mode changes
    setIsDirty(false);
  }, [taskUtils.task.id, taskUtils.editingTaskId]);

  const handleSave = () => {
    if (isDirty) {
      taskUtils.updateTask(taskUtils.task.id, 'title', taskUtils.titleDraft);
      taskUtils.setEditingTaskId(null);
      setIsDirty(false);
    }
  };

  return (
    <View className="mb-4">
      <TouchableOpacity
        className={`rounded-2xl overflow-hidden ${taskUtils.task.isComplete ? 'bg-slate-100' : 'bg-white shadow-lg'}`}
        onPress={() => taskUtils.toggleComplete(taskUtils.task.id)}
        activeOpacity={0.7}
      >
        <View className="p-5 relative">
          <View className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 items-center justify-center border-slate-300 bg-white z-10">
            {taskUtils.task.isComplete && (
              <View className="bg-green-500 w-full h-full rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
            )}
          </View>

          {taskUtils.editingTaskId === taskUtils.task.id ? (
            <View className="flex-row items-center mt-3">
              <TextInput
                value={taskUtils.titleDraft}
                onChangeText={(text) => {
                  taskUtils.setTitleDraft(text);
                  setIsDirty(text !== taskUtils.task.title);
                }}
                autoFocus
                className="flex-1 text-lg font-semibold mb-1 text-slate-800 border-b mr-2"
              />
              <TouchableOpacity
                onPress={handleSave}
                disabled={!isDirty}
                className={`px-3 py-1 rounded-lg ${isDirty ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <Text className="text-white font-small">Update</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text
              onPress={() => {
                taskUtils.setEditingTaskId(taskUtils.task.id);
                taskUtils.setTitleDraft(taskUtils.task.title);
              }}
              className={`text-lg font-semibold mb-1 ${taskUtils.task.isComplete ? 'line-through text-slate-400' : 'text-slate-800'}`}
            >
              {taskUtils.task.title}
            </Text>
          )}

          {taskUtils.editingDescId === taskUtils.task.id ? (
            <TextInput
              value={taskUtils.descDraft}
              onChangeText={taskUtils.setDescDraft}
              onBlur={() => {
                taskUtils.updateTask(taskUtils.task.id, 'description', taskUtils.descDraft);
                taskUtils.setEditingDescId(null);
              }}
              className="text-sm mb-3 text-slate-600 border-b pb-1"
              placeholder="Description..."
            />
          ) : (
            <Text
              onPress={() => {
                taskUtils.setEditingDescId(taskUtils.task.id);
                taskUtils.setDescDraft(taskUtils.task.description);
              }}
              className={`text-sm mb-3 leading-5 ${taskUtils.task.isComplete ? 'text-slate-400' : 'text-slate-600'}`}
            >
              {taskUtils.task.description || 'Tap to add description...'}
            </Text>
          )}

          <TouchableOpacity
            className="px-3 py-1 rounded-full mb-4"
            onPress={() => taskUtils.openPicker(taskUtils.task.id)}
          >
            <Text className={`text-l font-medium ${taskUtils.task.isComplete ? 'text-slate-400' : 'text-blue-600'}`}>
              📅 {moment(taskUtils.task.dueDate).format('MMM DD, YYYY • hh:mm A')}
            </Text>
          </TouchableOpacity>
          <View className="flex-row mb-4">
            {repeatOptions.map((repeatOption) => {
              const isActive = taskUtils.task.repeat === repeatOption;
              return (
                <TouchableOpacity
                  key={repeatOption}
                  onPress={() => taskUtils.updateTask(taskUtils.task.id, 'repeat', repeatOption)}
                  className={`px-3 py-1 mx-1 rounded-full border ${isActive ? 'bg-blue-100 border-blue-500' : 'bg-white border-slate-300'
                    }`}
                >
                  <Text className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                    {repeatOption.charAt(0).toUpperCase() + repeatOption.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="flex-row justify-between mt-2">
            {['✉️', '↻', taskUtils.task.isPriority ? '⭐' : '☆', '✏️', '🗑️'].map((icon, i) => {
              const handlers = [
                () => taskUtils.shareTask(taskUtils.task),
                () => taskUtils.markAsRepeat(taskUtils.task),
                () => taskUtils.togglePriority(taskUtils.task.id),
                () => {
                  taskUtils.setEditingTaskId(taskUtils.task.id);
                  taskUtils.setTitleDraft(taskUtils.task.title);
                },
                () => {
                  Alert.alert('Delete Task', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => taskUtils.deleteTask(taskUtils.task.id) },
                  ]);
                },
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
  );
}





















// import moment from 'moment';
// import React from 'react';
// import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { TaskCardProps } from '../utils/taskcardModel';

// import { useDebounce } from "use-debounce";
// import { RepeatOption } from '../utils/taskModel';

// const repeatOptions = Object.values(RepeatOption);

// export function TaskCard(taskUtils: TaskCardProps) {
//   const [debouncedTitle] = useDebounce(taskUtils.titleDraft, 500);

//   const handleChange = () => {
//     taskUtils.updateTask(taskUtils.task.id, 'title', debouncedTitle);
//     taskUtils.setEditingTaskId(null);
//   }

//   return (
//     <View className="mb-4">
//       <TouchableOpacity
//         className={`rounded-2xl overflow-hidden ${taskUtils.task.isComplete ? 'bg-slate-100' : 'bg-white shadow-lg'}`}
//         onPress={() => taskUtils.toggleComplete(taskUtils.task.id)}
//         activeOpacity={0.7}
//       >
//         <View className="p-5 relative">
//           <View className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 items-center justify-center border-slate-300 bg-white z-10">
//             {taskUtils.task.isComplete && (
//               <View className="bg-green-500 w-full h-full rounded-full items-center justify-center">
//                 <Text className="text-white text-xs font-bold">✓</Text>
//               </View>
//             )}
//           </View>

//           {taskUtils.editingTaskId === taskUtils.task.id ? (
//             <TextInput
//               value={taskUtils.titleDraft}
//               onChangeText={taskUtils.setTitleDraft}
//               onChange={() => {
//                 handleChange
//               }}
//               autoFocus
//               className="text-lg font-semibold mb-1 text-slate-800 border-b"
//             />
//           ) : (
//             <Text
//               onPress={() => {
//                 taskUtils.setEditingTaskId(taskUtils.task.id);
//                 taskUtils.setTitleDraft(taskUtils.task.title);
//               }}
//               className={`text-lg font-semibold mb-1 ${taskUtils.task.isComplete ? 'line-through text-slate-400' : 'text-slate-800'}`}
//             >
//               {taskUtils.task.title}
//             </Text>
//           )}

//           {taskUtils.editingDescId === taskUtils.task.id ? (

//             <TextInput
//               value={taskUtils.descDraft}
//               onChangeText={taskUtils.setDescDraft}
//               onBlur={() => {
//                 taskUtils.updateTask(taskUtils.task.id, 'description', taskUtils.descDraft);
//                 taskUtils.setEditingDescId(null);
//               }}
//               className="text-sm mb-3 text-slate-600 border-b pb-1"
//               placeholder="Description..."
//             />
//           ) : (
//             <Text
//               onPress={() => {
//                 taskUtils.setEditingDescId(taskUtils.task.id);
//                 taskUtils.setDescDraft(taskUtils.task.description);
//               }}
//               className={`text-sm mb-3 leading-5 ${taskUtils.task.isComplete ? 'text-slate-400' : 'text-slate-600'}`}
//             >
//               {taskUtils.task.description || 'Tap to add description...'}
//             </Text>
//           )}

//           <TouchableOpacity
//             className="px-3 py-1 rounded-full mb-4"
//             onPress={() => taskUtils.openPicker(taskUtils.task.id)}
//           >
//             <Text className={`text-l font-medium ${taskUtils.task.isComplete ? 'text-slate-400' : 'text-blue-600'}`}>
//               📅 {moment(taskUtils.task.dueDate).format('MMM DD, YYYY • hh:mm A')}
//             </Text>
//           </TouchableOpacity>
//           <View className="flex-row mb-4">
//             {repeatOptions.map((repeatOption) => {
//               const isActive = taskUtils.task.repeat === repeatOption;
//               return (
//                 <TouchableOpacity
//                   key={repeatOption}
//                   onPress={() => taskUtils.updateTask(taskUtils.task.id, 'repeat', repeatOption)}
//                   className={`px-3 py-1 mx-1 rounded-full border ${isActive ? 'bg-blue-100 border-blue-500' : 'bg-white border-slate-300'
//                     }`}
//                 >
//                   <Text className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
//                     {repeatOption.charAt(0).toUpperCase() + repeatOption.slice(1)}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//           <View className="flex-row justify-between mt-2">
//             {['✉️', '↻', taskUtils.task.isPriority ? '⭐' : '☆', '✏️', '🗑️'].map((icon, i) => {
//               const handlers = [
//                 () => taskUtils.shareTask(taskUtils.task),
//                 () => taskUtils.markAsRepeat(taskUtils.task),
//                 () => taskUtils.togglePriority(taskUtils.task.id),
//                 () => {
//                   taskUtils.setEditingTaskId(taskUtils.task.id);
//                   taskUtils.setTitleDraft(taskUtils.task.title);
//                 },
//                 () => {
//                   Alert.alert('Delete Task', 'Are you sure?', [
//                     { text: 'Cancel', style: 'cancel' },
//                     { text: 'Delete', style: 'destructive', onPress: () => taskUtils.deleteTask(taskUtils.task.id) },
//                   ]);
//                 },
//               ];
//               return (
//                 <TouchableOpacity key={i} className="flex-1 items-center" onPress={handlers[i]}>
//                   <Text className="text-xl">{icon}</Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         </View>
//       </TouchableOpacity>
//     </View>
//   );
// }
