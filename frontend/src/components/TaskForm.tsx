import { useState } from 'react';
import { Priority } from '../types/enums';
import type { CreateTaskData } from '../types/task';

interface TaskFormProps {
  onSubmit: (data: CreateTaskData) => void;
  onCancel?: () => void;
}

export function TaskForm({ onSubmit, onCancel }: TaskFormProps) {
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
    });

    setTitle('');
    setDescription('');
    setPriority(undefined);
    setIsFavorite(false);
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <h2>Новая задача</h2>
      
      <div className="form-group">
        <label htmlFor="title">Название *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введите название задачи..."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Описание</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Введите описание задачи..."
          rows={3}
        />
      </div>

      <div className="form-group">
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

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
          />
          Избранная задача
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Создать задачу
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

