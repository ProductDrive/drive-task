// utils/taskCardModel.ts
import { Task } from './taskModel';

export interface TaskCardProps {
  task: Task;
  editingTaskId: string | null;
  editingDescId: string | null;
  titleDraft: string;
  descDraft: string;
  setEditingTaskId: (id: string | null) => void;
  setEditingDescId: (id: string | null) => void;
  setTitleDraft: (title: string) => void;
  setDescDraft: (desc: string) => void;
  updateTask: <K extends keyof Task>(id: string, key: K, value: Task[K]) => void;
  openPicker: (id: string) => void;
  toggleComplete: (id: string) => void;
  togglePriority: (id: string) => void;
  shareTask: (task: Task) => void;
  markAsRepeat: (task: Task) => void;
  deleteTask: (id: string) => void;
}
