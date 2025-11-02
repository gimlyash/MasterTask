import { useState } from 'react';
import type { Task } from '../types/task';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { TaskStatus, Priority } from '../types/enums';
import type { CreateTaskData } from '../types/task';
import './WeekView.css';

interface WeekViewProps {
  tasks: Task[];
  onToggleComplete: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onToggleFavorite: (taskId: number) => void;
  onCreateTask: (data: CreateTaskData) => void;
  filterStatus?: TaskStatus | null;
  filterPriority?: Priority | null;
  filterFavorite?: boolean;
}

export function WeekView({ 
  tasks, 
  onToggleComplete, 
  onDelete, 
  onToggleFavorite,
  onCreateTask,
  filterStatus,
  filterPriority,
  filterFavorite
}: WeekViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState<number>(0); // Смещение недели (0 = текущая неделя)

  // Фильтрация задач по статусу, приоритету и избранному
  const filteredTasks = tasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (filterFavorite && !task.is_favorite) return false;
    return true;
  });

  // Получаем неделю с учетом смещения
  const getCurrentWeek = (offset: number = 0) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Находим понедельник текущей недели
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
    const monday = new Date(today.setDate(diff));
    
    // Добавляем смещение недель
    monday.setDate(monday.getDate() + (offset * 7));

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const week = getCurrentWeek(weekOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePrevWeek = () => {
    setWeekOffset(weekOffset - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(weekOffset + 1);
  };

  const handleTodayWeek = () => {
    setWeekOffset(0);
  };

  // Форматирование для отображения диапазона недели
  const formatWeekRange = () => {
    if (week.length === 0) return '';
    const start = week[0];
    const end = week[6];
    const startMonth = start.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    const endMonth = end.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('ru-RU', { month: 'short' })}`;
    }
    return `${startMonth} - ${endMonth}`;
  };

  // Форматирование даты (используем локальное время, чтобы избежать проблем с UTC)
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDayName = (date: Date): string => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  };

  const formatDayNumber = (date: Date): string => {
    return date.getDate().toString();
  };

  const isToday = (date: Date): boolean => {
    return formatDateKey(date) === formatDateKey(today);
  };

  // Группировка задач по дням (используем отфильтрованные задачи)
  const tasksByDate = new Map<string, Task[]>();
  
  filteredTasks.forEach(task => {
    if (task.deadline) {
      const taskDate = new Date(task.deadline);
      const dateKey = formatDateKey(taskDate);
      if (!tasksByDate.has(dateKey)) {
        tasksByDate.set(dateKey, []);
      }
      tasksByDate.get(dateKey)!.push(task);
    }
  });

  // Также добавляем задачи без deadline в "Без даты" (только отфильтрованные)
  const tasksWithoutDate = filteredTasks.filter(task => !task.deadline);

  const handleAddTask = (data: CreateTaskData) => {
    onCreateTask(data);
    setSelectedDate(null);
  };

  return (
    <div className="week-view">
      {/* Навигация по неделям */}
      <div className="week-navigation">
        <button onClick={handlePrevWeek} className="week-nav-btn" title="Предыдущая неделя">
          ←
        </button>
        <div className="week-range">
          <span>{formatWeekRange()}</span>
          {weekOffset !== 0 && (
            <button onClick={handleTodayWeek} className="week-today-btn" title="Текущая неделя">
              Сегодня
            </button>
          )}
        </div>
        <button onClick={handleNextWeek} className="week-nav-btn" title="Следующая неделя">
          →
        </button>
      </div>

      {/* Шкала недели */}
      <div className="week-header">
          {week.map((date, index) => {
          const dateKey = formatDateKey(date);
          const dayTasks = tasksByDate.get(dateKey) || [];
          
          // Не показываем дни без задач если есть активный фильтр
          if (dayTasks.length === 0 && (filterStatus || filterPriority || filterFavorite)) {
            return null;
          }
          
          const isHovered = hoveredDate === dateKey;
          const isSelected = selectedDate === dateKey;

          return (
            <div
              key={index}
              className={`week-day ${isToday(date) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onMouseEnter={() => setHoveredDate(dateKey)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <div className="day-header">
                <span className="day-name">{formatDayName(date)}</span>
                <span className={`day-number ${isToday(date) ? 'today-badge' : ''}`}>
                  {formatDayNumber(date)}
                </span>
              </div>

              <div className="day-tasks-count">
                {dayTasks.length > 0 && (
                  <span className="tasks-count-badge">{dayTasks.length}</span>
                )}
              </div>

              {isHovered && (
                <button
                  className="add-task-btn"
                  onClick={() => setSelectedDate(dateKey)}
                  title="Добавить задачу на этот день"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}

            </div>
          );
        })}
      </div>

      {/* Модальное окно для добавления задачи */}
      <TaskModal
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        onSubmit={handleAddTask}
        initialDeadline={selectedDate || undefined}
      />

      {/* Задачи по дням */}
      <div className="week-tasks">
        {week.map((date, index) => {
          const dateKey = formatDateKey(date);
          const dayTasks = tasksByDate.get(dateKey) || [];

          // Не показываем дни без задач если есть активный фильтр
          if (dayTasks.length === 0 && (filterStatus || filterPriority || filterFavorite)) {
            return null;
          }

          return (
            <div key={index} className="day-section">
              <div className="day-section-header">
                <h3 className="day-title">
                  {formatDayName(date)} {formatDayNumber(date)}
                  {isToday(date) && <span className="today-label">Сегодня</span>}
                </h3>
              </div>
              <div className="day-tasks">
                {dayTasks.map(task => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onDelete={onDelete}
                    onToggleFavorite={onToggleFavorite}
                  />
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
                <TaskCard
                  key={task.task_id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

