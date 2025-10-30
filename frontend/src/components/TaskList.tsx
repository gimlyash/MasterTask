import { TaskCard } from './TaskCard';
import type { Task } from '../types/task';
import { TaskStatus, Priority } from '../types/enums';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onToggleFavorite: (taskId: number) => void;
  filterStatus?: TaskStatus | null;
  filterPriority?: Priority | null;
}

export function TaskList({ 
  tasks, 
  onToggleComplete, 
  onDelete, 
  onToggleFavorite,
  filterStatus,
  filterPriority 
}: TaskListProps) {
  const filteredTasks = tasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    return true;
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="empty-state">
        <p>Нет задач, соответствующих выбранным фильтрам.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {filteredTasks.map(task => (
        <TaskCard
          key={task.task_id}
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

