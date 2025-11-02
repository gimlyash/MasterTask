import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { InlineTaskForm } from './InlineTaskForm';
import type { Task } from '../types/task';
import { TaskStatus, Priority } from '../types/enums';
import type { CreateTaskData } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onToggleFavorite: (taskId: number) => void;
  onEdit?: (task: Task) => void;
  onCreateTask?: (data: CreateTaskData, taskId?: number) => void;
  filterStatus?: TaskStatus | null;
  filterPriority?: Priority | null;
  filterFavorite?: boolean;
  isInboxView?: boolean;
  editingTaskId?: number | null;
  onStartEdit?: (task: Task | null) => void;
}

export function TaskList({ 
  tasks, 
  onToggleComplete, 
  onDelete, 
  onToggleFavorite,
  onCreateTask,
  filterStatus,
  filterPriority,
  filterFavorite,
  isInboxView = false,
  editingTaskId,
  onStartEdit
}: TaskListProps) {
  const [showExpandedForm, setShowExpandedForm] = useState(false);
  
  const editingTask = editingTaskId ? tasks.find(t => t.task_id === editingTaskId) : null;

  const filteredTasks = tasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (filterFavorite && !task.is_favorite) return false;
    return true;
  });

  const handleSubmit = (data: CreateTaskData, taskId?: number) => {
    if (onCreateTask) {
      onCreateTask(data, taskId);
    }
    setShowExpandedForm(false);
    if (onStartEdit) {
      onStartEdit(null); // Сбрасываем редактирование
    }
  };

  const handleCancel = () => {
    setShowExpandedForm(false);
    if (onStartEdit) {
      onStartEdit(null); // Сбрасываем редактирование
    }
  };
  
  const handleEditClick = (task: Task) => {
    if (onStartEdit) {
      onStartEdit(task);
    }
    setShowExpandedForm(false); // Закрываем форму добавления если открыта
  };

  return (
    <div className={isInboxView ? 'task-list inbox-list' : 'task-list'}>
      {isInboxView && (
        <>
          {!showExpandedForm && !editingTask ? (
            <div 
              className="inbox-add-task-input"
              onClick={() => setShowExpandedForm(true)}
            >
              <div className="task-bar-left">
                <div className="inbox-checkbox-placeholder"></div>
                <div className="plus-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="plus-icon">
                    <circle cx="12" cy="12" r="10" className="plus-circle"/>
                    <path d="M12 5V19M5 12H19" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="task-bar-title-input-placeholder">Добавить задачу</span>
              </div>
            </div>
          ) : (showExpandedForm || editingTask) ? (
            <InlineTaskForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              initialTask={editingTask || undefined}
            />
          ) : null}
        </>
      )}

      {filteredTasks.length === 0 && !showExpandedForm && !editingTask ? (
        <div className={isInboxView ? 'inbox-empty-state' : 'empty-state'}>
          <p>Нет задач, соответствующих выбранным фильтрам.</p>
        </div>
      ) : (
        filteredTasks.map(task => (
          editingTaskId === task.task_id ? null : (
            <TaskCard
              key={task.task_id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
              onEdit={handleEditClick}
              isInboxView={isInboxView}
            />
          )
        ))
      )}
    </div>
  );
}

