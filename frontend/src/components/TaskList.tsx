import { useState, useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { InlineTaskForm } from './InlineTaskForm';
import type { Task } from '../types/task';
import { TaskStatus, Priority } from '../types/enums';
import type { CreateTaskData } from '../types/task';
import type { DateFormat } from '../utils/dateFormat';
import './WeekView.css';

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
  dateFormat?: DateFormat;
  onTagClick?: (tagName: string) => void;
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
  onStartEdit,
  dateFormat = 'DD/MM/YYYY',
  onTagClick,
  onEdit
}: TaskListProps) {
  const [showExpandedForm, setShowExpandedForm] = useState(false);
  
  const editingTask = editingTaskId ? tasks.find(t => t.task_id === editingTaskId) : null;

  const filteredTasks = tasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (filterFavorite) {
      // Избранные: исключаем завершенные задачи
      if (!task.is_favorite) return false;
      if (task.status === 'completed') return false;
    }
    return true;
  });

  // Группировка задач по дням (только для не-inbox view)
  const tasksByDate = useMemo(() => {
    if (isInboxView) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDateKey = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const grouped = new Map<string, Task[]>();
    
    filteredTasks.forEach(task => {
      if (task.deadline) {
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        const dateKey = formatDateKey(taskDate);
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(task);
      }
    });

    // Сортируем ключи дат
    const sortedDates = Array.from(grouped.keys()).sort();
    
    return { grouped, sortedDates, formatDateKey };
  }, [filteredTasks, isInboxView]);

  // Задачи без даты
  const tasksWithoutDate = useMemo(() => {
    if (isInboxView) return [];
    return filteredTasks.filter(task => !task.deadline);
  }, [filteredTasks, isInboxView]);

  const formatDayName = (date: Date): string => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[date.getDay()];
  };

  const isToday = (dateKey: string): boolean => {
    if (!tasksByDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateKey === tasksByDate.formatDateKey(today);
  };

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
      ) : isInboxView ? (
        // Простой список для inbox view
        filteredTasks.map(task => (
          editingTaskId === task.task_id ? null : (
            <TaskCard
              key={task.task_id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
              onTagClick={onTagClick}
              onEdit={onEdit || handleEditClick}
              isInboxView={isInboxView}
              dateFormat={dateFormat}
              hideEditButton={!!onEdit}
            />
          )
        ))
      ) : (
        // Группированный список по дням
        <>
          {tasksByDate && tasksByDate.sortedDates.map(dateKey => {
            const dayTasks = tasksByDate.grouped.get(dateKey) || [];
            if (dayTasks.length === 0) return null;
            
            const date = new Date(dateKey);
            const dayName = formatDayName(date);
            const dayNumber = date.getDate();
            const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
            const monthName = monthNames[date.getMonth()];
            
            return (
              <div key={dateKey} className="day-section">
                <div className="day-section-header">
                  <h3 className="day-title">
                    {dayName}, {dayNumber} {monthName}
                    {isToday(dateKey) && <span className="today-label">Сегодня</span>}
                  </h3>
                </div>
                <div className="day-tasks">
                  {dayTasks.map(task => (
                    editingTaskId === task.task_id ? null : (
                      <TaskCard
                        key={task.task_id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onDelete={onDelete}
                        onToggleFavorite={onToggleFavorite}
                        onEdit={onEdit || handleEditClick}
                        isInboxView={false}
                        dateFormat={dateFormat}
                        onTagClick={onTagClick}
                        hideEditButton={!!onEdit}
                      />
                    )
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Задачи без даты */}
          {tasksWithoutDate.length > 0 && (
            <div className="day-section">
              <div className="day-section-header">
                <h3 className="day-title">Без даты</h3>
              </div>
              <div className="day-tasks">
                {tasksWithoutDate.map(task => (
                  editingTaskId === task.task_id ? null : (
                    <TaskCard
                      key={task.task_id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onDelete={onDelete}
                      onToggleFavorite={onToggleFavorite}
                      onEdit={onEdit || handleEditClick}
                      isInboxView={false}
                      dateFormat={dateFormat}
                      onTagClick={onTagClick}
                      hideEditButton={!!onEdit}
                    />
                  )
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

