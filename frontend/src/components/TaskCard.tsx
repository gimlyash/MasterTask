import type { Task } from "../types/task";
import { TaskBarMenu } from "./TaskBarMenu";
import { formatDate, type DateFormat } from "../utils/dateFormat";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onToggleFavorite: (taskId: number) => void;
  onEdit?: (task: Task) => void;
  isInboxView?: boolean;
  dateFormat?: DateFormat;
  onTagClick?: (tagName: string) => void;
  hideEditButton?: boolean;
}

export function TaskCard({ task, onToggleComplete, onDelete, onToggleFavorite, onEdit, isInboxView = false, dateFormat = 'DD/MM/YYYY', onTagClick, hideEditButton = false }: TaskCardProps) {
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

  const isCompleted = task.status === 'completed';
  const priorityClass = task.priority ? `priority-${task.priority}` : '';

  // Простой бар для "Входящее" - как в Todoist
  if (isInboxView) {
    return (
      <div 
        className={`inbox-task-bar ${isCompleted ? 'completed' : ''}`}
        onClick={(e) => {
          // Открываем редактирование при клике на карточку, если не кликнули по кнопке
          if (onEdit && !(e.target as HTMLElement).closest('button')) {
            onEdit(task);
          }
        }}
        style={{ cursor: onEdit ? 'pointer' : 'default' }}
      >
        <div className="task-bar-left">
          <div 
            className={`inbox-checkbox ${isCompleted ? 'completed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.task_id);
            }}
          />
          {task.is_favorite && (
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="star-icon filled"
              style={{ 
                marginRight: '6px',
                flexShrink: 0,
                color: 'var(--text-primary, #000000)'
              }}
            >
              <path d="M12 1.5L14.5 9L22.5 9.5L16.5 14.5L18.5 22.5L12 18.5L5.5 22.5L7.5 14.5L1.5 9.5L9.5 9L12 1.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          )}
          <span className="task-bar-title">{task.title}</span>
          {task.tags && task.tags.length > 0 && (
            <span style={{ 
              marginLeft: '10px', 
              fontSize: '11px', 
              color: '#9ca3af',
              fontWeight: 'normal',
              opacity: 0.8
            }}>
              {task.tags.map(tag => `#${tag.name}`).join(' ')}
            </span>
          )}
        </div>
        <div className="task-bar-actions">
          {onEdit && !hideEditButton && (
            <button 
              className="task-bar-icon-btn"
              onClick={() => onEdit(task)}
              title="Редактировать"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {task.deadline && (
            <button 
              className="task-bar-icon-btn calendar-btn"
              title="Срок выполнения"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <TaskBarMenu 
            task={task}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  // Обычная карточка для остальных видов
  return (
    <div 
      className={`task-card ${isCompleted ? 'completed' : ''} ${priorityClass}`}
      onClick={(e) => {
        // Открываем редактирование при клике на карточку, если не кликнули по кнопке
        if (onEdit && !(e.target as HTMLElement).closest('button')) {
          onEdit(task);
        }
      }}
      style={{ cursor: onEdit ? 'pointer' : 'default' }}
    >
      <div className="task-priority-section">
        <div 
          className={`task-checkbox ${isCompleted ? 'completed' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task.task_id);
          }}
        />

        <div className="task-content">
          <div className="task-header">
            <h3 className="task-title">{task.title}</h3>
          </div>
          
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          {/* Теги отображаются отдельно, мелким шрифтом */}
          {task.tags && task.tags.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '6px', 
              flexWrap: 'wrap', 
              marginTop: '6px',
              marginBottom: '8px',
              fontSize: '11px',
              color: '#6b7280',
              lineHeight: '1.4'
            }}>
              {task.tags.map((tag) => (
                <span
                  key={tag.tag_id}
                  className="task-tag"
                  style={{
                    cursor: onTagClick ? 'pointer' : 'default',
                    textDecoration: onTagClick ? 'underline' : 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTagClick) {
                      onTagClick(tag.name);
                    }
                  }}
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="task-meta">
            {task.priority && (
              <>
                <div className={`priority-indicator priority-${task.priority}`}></div>
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(task.priority) }}
                >
                  {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                </span>
              </>
            )}
            
            {task.deadline && (
              <span className="task-deadline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {formatDate(task.deadline, dateFormat)}
              </span>
            )}
            
            {task.reminder_time && (
              <span className="task-reminder">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Напоминание: {task.reminder_time === '15min' ? 'За 15 мин' : 
                               task.reminder_time === '30min' ? 'За 30 мин' : 
                               task.reminder_time === '1hour' ? 'За 1 час' : 
                               task.reminder_time === '2hours' ? 'За 2 часа' : 
                               task.reminder_time === '1day' ? 'За день' : task.reminder_time}
              </span>
            )}
            
            {task.timer_duration && (
              <span className="task-timer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Таймер: {task.timer_duration}
              </span>
            )}
            
            {task.status && !isCompleted && (
              <span className="status-badge">{getStatusText(task.status)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="task-actions">
        <button 
          onClick={() => onToggleFavorite(task.task_id)}
          className={`favorite-btn ${task.is_favorite ? 'active' : ''}`}
          title="Избранное"
        >
          {task.is_favorite ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="star-icon filled">
              <path d="M12 1.5L14.5 9L22.5 9.5L16.5 14.5L18.5 22.5L12 18.5L5.5 22.5L7.5 14.5L1.5 9.5L9.5 9L12 1.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="star-icon outline">
              <path d="M12 1.5L14.5 9L22.5 9.5L16.5 14.5L18.5 22.5L12 18.5L5.5 22.5L7.5 14.5L1.5 9.5L9.5 9L12 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        {onEdit && !hideEditButton && (
          <button 
            onClick={() => onEdit(task)}
            className="edit-btn"
            title="Редактировать"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button 
          onClick={() => onDelete(task.task_id)} 
          className="delete-btn"
          title="Удалить"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="trash-icon">
            <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 11V17M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

