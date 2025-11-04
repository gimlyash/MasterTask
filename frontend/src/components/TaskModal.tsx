import { useState, useEffect, useRef, useCallback } from 'react';
import { Priority } from '../types/enums';
import type { CreateTaskData } from '../types/task';
import type { DateFormat } from '../utils/dateFormat';
import { formatDate } from '../utils/dateFormat';
import './TaskModal.css';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskData) => void;
  initialDeadline?: string;
  dateFormat?: DateFormat;
}

export function TaskModal({ isOpen, onClose, onSubmit, initialDeadline, dateFormat = 'DD/MM/YYYY' }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [deadline, setDeadline] = useState<string>(''); // YYYY-MM-DD для бэкенда
  const [deadlineDisplay, setDeadlineDisplay] = useState<string>(''); // Для отображения в выбранном формате
  const [showCalendar, setShowCalendar] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Функция для конвертации YYYY-MM-DD в выбранный формат
  const formatToDisplayFormat = useCallback((isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return formatDate(date, dateFormat);
  }, [dateFormat]);

  // Функция для парсинга даты из выбранного формата в YYYY-MM-DD
  const parseFromDisplayFormat = (displayDate: string): string | null => {
    if (!displayDate) return null;
    
    // Определяем разделители на основе формата
    let separator = '/';
    if (dateFormat.includes('.')) separator = '.';
    if (dateFormat.includes('-')) separator = '-';
    
    const parts = displayDate.split(separator);
    if (parts.length !== 3) return null;
    
    let day: string, month: string, year: string;
    
    // Определяем порядок в зависимости от формата
    if (dateFormat.startsWith('DD')) {
      // DD/MM/YYYY или DD.MM.YYYY
      [day, month, year] = parts;
    } else if (dateFormat.startsWith('MM')) {
      // MM/DD/YYYY или MM.DD.YYYY
      [month, day, year] = parts;
    } else {
      // YYYY-MM-DD
      [year, month, day] = parts;
    }
    
    // Валидация
    if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return `${year}-${month}-${day}`;
      }
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      // Устанавливаем deadline при открытии модалки
      let dateToSet: string;
      if (initialDeadline) {
        dateToSet = initialDeadline;
      } else {
        // Если нет initialDeadline, устанавливаем сегодняшнюю дату по умолчанию
        // Используем локальное время, чтобы избежать проблем с UTC
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateToSet = `${year}-${month}-${day}`;
      }
      setDeadline(dateToSet);
      setDeadlineDisplay(formatToDisplayFormat(dateToSet));
    } else {
      // Сброс формы при закрытии
      setTitle('');
      setDescription('');
      setPriority(undefined);
      setDeadline('');
      setDeadlineDisplay('');
      setIsRepeating(false);
      setRepeatInterval('');
      setIsFavorite(false);
    }
  }, [isOpen, initialDeadline, formatToDisplayFormat]);

  // Компонент календаря
  const CalendarPicker = ({ selectedDate, onDateSelect, onClose }: { selectedDate: string; onDateSelect: (date: string) => void; onClose: () => void }) => {
    const calendarRef = useRef<HTMLDivElement>(null);
    const [currentMonth, setCurrentMonth] = useState(() => {
      if (selectedDate) {
        const [year, month] = selectedDate.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      // Если нет selectedDate, показываем текущий месяц (1-е число для правильного отображения календаря)
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    // Синхронизируем currentMonth с selectedDate когда она изменяется
    useEffect(() => {
      if (selectedDate) {
        const [year, month] = selectedDate.split('-');
        const newMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
        setCurrentMonth(newMonth);
      } else {
        // Если selectedDate пустая, показываем текущий месяц
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      }
    }, [selectedDate]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        // Проверяем, что клик был вне календаря И не внутри модального окна
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
          // Также проверяем, что клик не был внутри modal-content
          const modalContent = document.querySelector('.modal-content');
          if (modalContent && !modalContent.contains(event.target as Node)) {
            onClose();
          }
        }
      };
      // Используем capture phase, чтобы сработать раньше обработчика overlay
      document.addEventListener('mousedown', handleClickOutside, true);
      return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, [onClose]);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    const goToPreviousMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      onDateSelect(`${year}-${month}-${dayStr}`);
    };

    const isSelected = (day: number): boolean => {
      if (!selectedDate) return false;
      const [year, month, dateDay] = selectedDate.split('-');
      return (
        parseInt(year) === currentMonth.getFullYear() &&
        parseInt(month) === currentMonth.getMonth() + 1 &&
        day === parseInt(dateDay)
      );
    };

    const isToday = (day: number): boolean => {
      const today = new Date();
      return (
        today.getFullYear() === currentMonth.getFullYear() &&
        today.getMonth() === currentMonth.getMonth() &&
        day === today.getDate()
      );
    };

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    return (
      <div 
        ref={calendarRef} 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          zIndex: 1001,
          minWidth: '280px'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPreviousMonth();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px 8px'
            }}
          >
            ←
          </button>
          <span style={{ fontWeight: 600, fontSize: '16px', color: '#1f2937' }}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNextMonth();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px 8px'
            }}
          >
            →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {days.map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', padding: '4px' }}>
              {day}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
            <button
              key={day}
              onClick={(e) => {
                e.stopPropagation();
                handleDateClick(day);
              }}
              style={{
                border: 'none',
                background: isSelected(day) ? '#ea580c' : isToday(day) ? '#ffe4e6' : 'transparent',
                color: isSelected(day) ? 'white' : isToday(day) ? '#dc2626' : '#1f2937',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: isToday(day) ? 700 : 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isSelected(day)) {
                  e.currentTarget.style.background = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected(day)) {
                  e.currentTarget.style.background = isToday(day) ? '#ffe4e6' : 'transparent';
                }
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const submitData: CreateTaskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      is_favorite: isFavorite,
      is_repeating: isRepeating,
      repeat_interval: isRepeating && repeatInterval ? repeatInterval : undefined,
    };

    // Форматируем deadline правильно для бэкенда
    if (deadline) {
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(12, 0, 0, 0); // Устанавливаем полдень для корректного времени
      submitData.deadline = deadlineDate.toISOString();
    }

    onSubmit(submitData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать задачу</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="modal-title">Название *</label>
            <input
              id="modal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название задачи..."
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-description">Описание</label>
            <textarea
              id="modal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавьте описание..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="modal-deadline">Срок выполнения</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <input
                  id="modal-deadline"
                  type="text"
                  value={deadlineDisplay}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    
                    // Определяем разделитель на основе формата
                    const separator = dateFormat.includes('.') ? '.' : dateFormat.includes('-') ? '-' : '/';
                    
                    // Разрешаем только цифры и разделитель
                    const cleaned = inputValue.replace(new RegExp(`[^\\d${separator === '.' ? '\\.' : separator}]`, 'g'), '');
                    
                    // Автоматически добавляем разделители в зависимости от формата
                    let formatted = cleaned;
                    const maxLength = 10; // DD/MM/YYYY format length
                    
                    if (dateFormat.startsWith('DD') || dateFormat.startsWith('MM')) {
                      // DD/MM/YYYY или MM/DD/YYYY
                      if (cleaned.length > 2 && cleaned.charAt(2) !== separator) {
                        formatted = cleaned.slice(0, 2) + separator + cleaned.slice(2);
                      }
                      if (formatted.length > 5 && formatted.charAt(5) !== separator) {
                        formatted = formatted.slice(0, 5) + separator + formatted.slice(5);
                      }
                    } else if (dateFormat.startsWith('YYYY')) {
                      // YYYY-MM-DD
                      if (cleaned.length > 4 && cleaned.charAt(4) !== separator) {
                        formatted = cleaned.slice(0, 4) + separator + cleaned.slice(4);
                      }
                      if (formatted.length > 7 && formatted.charAt(7) !== separator) {
                        formatted = formatted.slice(0, 7) + separator + formatted.slice(7);
                      }
                    }
                    
                    // Ограничиваем длину
                    if (formatted.length > maxLength) {
                      formatted = formatted.slice(0, maxLength);
                    }
                    
                    setDeadlineDisplay(formatted);
                    
                    // Парсим в YYYY-MM-DD для внутреннего состояния только если дата полная
                    const parsed = parseFromDisplayFormat(formatted);
                    if (parsed) {
                      setDeadline(parsed);
                    }
                  }}
                  placeholder={dateFormat.replace('DD', 'ДД').replace('MM', 'ММ').replace('YYYY', 'ГГГГ')}
                  maxLength={10}
                  style={{ flex: 1, height: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  style={{
                    padding: '8px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Открыть календарь"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              {showCalendar && (
                <CalendarPicker
                  selectedDate={deadline}
                  onDateSelect={(dateStr: string) => {
                    setDeadline(dateStr);
                    setDeadlineDisplay(formatToDisplayFormat(dateStr));
                    setShowCalendar(false);
                  }}
                  onClose={() => setShowCalendar(false)}
                />
              )}
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="modal-priority">Приоритет</label>
              <select
                id="modal-priority"
                value={priority || ''}
                onChange={(e) => setPriority(e.target.value as Priority || undefined)}
                style={{ height: '42px' }}
              >
                <option value="">Не установлен</option>
                <option value={Priority.high}>Высокий</option>
                <option value={Priority.medium}>Средний</option>
                <option value={Priority.low}>Низкий</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>
              <input
                type="checkbox"
                checked={isRepeating}
                onChange={(e) => setIsRepeating(e.target.checked)}
              />
              Повторяющаяся задача
            </label>
          </div>

          {isRepeating && (
            <div className="form-group">
              <label htmlFor="modal-repeat-interval">Интервал повторения</label>
              <select
                id="modal-repeat-interval"
                value={repeatInterval}
                onChange={(e) => setRepeatInterval(e.target.value)}
              >
                <option value="">Выберите интервал</option>
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
                <option value="yearly">Ежегодно</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <path d="M12 2L14.5 9L22 9.5L16.5 14.5L18.5 22L12 18L5.5 22L7.5 14.5L2 9.5L9.5 9L12 2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              Избранная задача
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Создать задачу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

