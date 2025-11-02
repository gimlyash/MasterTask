import { useState } from 'react';
import { Priority } from '../types/enums';
import type { CreateTaskData } from '../types/task';

interface TaskFormProps {
  onSubmit: (data: CreateTaskData) => void;
  onCancel?: () => void;
  initialDeadline?: string;
}

export function TaskForm({ onSubmit, onCancel, initialDeadline }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      is_favorite: isFavorite,
      deadline: initialDeadline,
    });

    setTitle('');
    setDescription('');
    setPriority(undefined);
    setIsFavorite(false);
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="form-group">
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Добавить задачу..."
          required
          className="quick-input"
        />
      </div>

      <div className="form-expanded" style={{ display: title ? 'block' : 'none' }}>
        <div className="form-group">
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание (необязательно)..."
            rows={3}
          />
        </div>

        <div className="form-group form-row">
          <div className="form-group-inline">
            <label htmlFor="priority">Приоритет</label>
            <select
              id="priority"
              value={priority || ''}
              onChange={(e) => setPriority(e.target.value as Priority || undefined)}
            >
              <option value="">Не установлен</option>
              <option value={Priority.high}>Высокий</option>
              <option value={Priority.medium}>Средний</option>
              <option value={Priority.low}>Низкий</option>
            </select>
          </div>

          <div className="form-group-inline">
            <label>
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <path d="M12 2L14.5 9L22 9.5L16.5 14.5L18.5 22L12 18L5.5 22L7.5 14.5L2 9.5L9.5 9L12 2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              Избранная
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Добавить задачу
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              Отмена
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

