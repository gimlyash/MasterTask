import type { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onToggleFavorite: (taskId: number) => void;
}

export function TaskCard({ task, onToggleComplete, onDelete, onToggleFavorite }: TaskCardProps) {
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'active': return 'Активна';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершена';
      case 'overdue': return 'Просрочена';
      default: return 'Не установлен';
    }
  };

  return (
    <div className="task-card">
      <div className="task-header">
        <h3>{task.title}</h3>
        <button 
          onClick={() => onToggleFavorite(task.task_id)}
          className={task.is_favorite ? 'favorite active' : 'favorite'}
        >
          ⭐
        </button>
      </div>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        {task.priority && (
          <span 
            className="priority-badge"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          >
            {task.priority}
          </span>
        )}
        {task.status && (
          <span className="status-badge">{getStatusText(task.status)}</span>
        )}
      </div>

      {task.deadline && (
        <div className="task-deadline">
          📅 {new Date(task.deadline).toLocaleDateString('ru-RU')}
        </div>
      )}

      <div className="task-actions">
        <button 
          onClick={() => onToggleComplete(task.task_id)}
          className={task.status === 'completed' ? 'completed' : ''}
        >
          {task.status === 'completed' ? '✓ Завершена' : 'Завершить'}
        </button>
        <button onClick={() => onDelete(task.task_id)} className="delete-btn">
          Удалить
        </button>
      </div>
    </div>
  );
}

