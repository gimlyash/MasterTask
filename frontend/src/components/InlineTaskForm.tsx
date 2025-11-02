import { useState, useEffect, useRef } from 'react';
import { Priority } from '../types/enums';
import type { CreateTaskData } from '../types/task';
import './InlineTaskForm.css';

import type { Task } from '../types/task';

interface InlineTaskFormProps {
  onSubmit: (data: CreateTaskData, taskId?: number) => void;
  onCancel: () => void;
  initialTask?: Task | null;
}

export function InlineTaskForm({ onSubmit, onCancel, initialTask }: InlineTaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<Priority | undefined>(initialTask?.priority || undefined);
  const [deadline, setDeadline] = useState<string>(initialTask?.deadline ? initialTask.deadline.split('T')[0] : ''); // YYYY-MM-DD
  const [deadlineDisplay, setDeadlineDisplay] = useState<string>(''); // DD/MM/YYYY
  const [showCalendar, setShowCalendar] = useState(false);
  const [isRepeating, setIsRepeating] = useState(initialTask?.is_repeating || false);
  const [repeatInterval, setRepeatInterval] = useState<string>(initialTask?.repeat_interval || '');
  const [isFavorite, setIsFavorite] = useState(initialTask?.is_favorite || false);
  const formRef = useRef<HTMLDivElement>(null);
  const deadlineButtonRef = useRef<HTMLButtonElement>(null);

  // Инициализация deadlineDisplay при монтировании или изменении deadline
  useEffect(() => {
    if (deadline) {
      setDeadlineDisplay(formatToDDMMYYYY(deadline));
    }
  }, [deadline]);

  // Функция для конвертации YYYY-MM-DD в DD/MM/YYYY
  const formatToDDMMYYYY = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };


  // Компонент календаря
  const CalendarPicker = ({ selectedDate, onDateSelect, onClose, buttonRef }: { selectedDate: string; onDateSelect: (date: string) => void; onClose: () => void; buttonRef: React.RefObject<HTMLButtonElement | null> }) => {
    const calendarRef = useRef<HTMLDivElement>(null);
    const [currentMonth, setCurrentMonth] = useState(() => {
      if (selectedDate) {
        const [year, month] = selectedDate.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
      if (selectedDate) {
        const [year, month] = selectedDate.split('-');
        setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
      }
    }, [selectedDate]);

    useEffect(() => {
      // Позиционируем календарь относительно кнопки
      if (buttonRef.current && calendarRef.current) {
        const updatePosition = () => {
          if (buttonRef.current && calendarRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const calendarHeight = calendarRef.current.offsetHeight || 300;
            const calendarWidth = calendarRef.current.offsetWidth || 280;
            
            let top = buttonRect.bottom + 8;
            let left = buttonRect.left;
            
            // Проверяем, не выходит ли календарь за правый край экрана
            if (left + calendarWidth > window.innerWidth) {
              left = window.innerWidth - calendarWidth - 16;
            }
            
            // Проверяем, не выходит ли календарь за нижний край экрана
            if (top + calendarHeight > window.innerHeight) {
              top = buttonRect.top - calendarHeight - 8;
            }
            
            setPosition({ top, left });
          }
        };
        
        // Обновляем позицию при монтировании и при изменении размера окна
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        
        return () => {
          window.removeEventListener('resize', updatePosition);
          window.removeEventListener('scroll', updatePosition, true);
        };
      }
    }, [buttonRef]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
          const target = event.target as HTMLElement;
          if (!target.closest('.expanded-form-btn') && !target.closest('.calendar-picker')) {
            onClose();
          }
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;

    const handlePrevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      onDateSelect(dateStr);
    };

    const today = new Date();
    const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

    return (
      <div 
        className="calendar-picker" 
        ref={calendarRef} 
        onClick={(e) => e.stopPropagation()} 
        onMouseDown={(e) => e.stopPropagation()}
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        <div className="calendar-header">
          <button type="button" onClick={handlePrevMonth} className="calendar-nav-btn">
            ←
          </button>
          <span className="calendar-month-year">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button type="button" onClick={handleNextMonth} className="calendar-nav-btn">
            →
          </button>
        </div>
        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {Array.from({ length: adjustedFirstDay - 1 }, (_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty"></div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
            const isSelected = selectedDateObj && selectedDateObj.toDateString() === new Date(dateStr).toDateString();

            return (
              <button
                key={day}
                type="button"
                className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDateClick(day)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const submitData: CreateTaskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      deadline: deadline ? deadline : undefined,
      is_repeating: isRepeating ? true : undefined,
      repeat_interval: isRepeating && repeatInterval ? repeatInterval : undefined,
      is_favorite: isFavorite ? true : undefined,
    };

    onSubmit(submitData, initialTask?.task_id);
    // Сброс формы
    setTitle('');
    setDescription('');
    setPriority(undefined);
    setDeadline('');
    setDeadlineDisplay('');
    setIsRepeating(false);
    setRepeatInterval('');
    setIsFavorite(false);
    onCancel();
  };

  // Обработка кликов вне формы
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        // Проверяем, не кликнули ли мы на календарь или другие элементы формы
        const target = event.target as HTMLElement;
        if (!target.closest('.calendar-picker') && !target.closest('.inbox-expanded-form')) {
          if (!title.trim() && !description.trim()) {
            onCancel();
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [title, description, onCancel]);

  return (
    <div className="inbox-expanded-form" ref={formRef}>
      <form onSubmit={handleSubmit}>
        <div className="expanded-form-header">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название задачи"
            className="expanded-title-input"
            autoFocus
          />
        </div>

        <div className="expanded-form-body">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание"
            className="expanded-description-input"
            rows={3}
          />

          <div className="expanded-form-buttons">
            <button
              ref={deadlineButtonRef}
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="expanded-form-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Срок</span>
              {deadlineDisplay && <span className="deadline-value">{deadlineDisplay}</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                const priorities = [undefined, Priority.high, Priority.medium, Priority.low];
                const currentIndex = priorities.indexOf(priority);
                setPriority(priorities[(currentIndex + 1) % priorities.length]);
              }}
              className="expanded-form-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4L20 4M4 12L20 12M4 20L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Приоритет</span>
              {priority && <span className="priority-value">{priority === Priority.high ? 'Высокий' : priority === Priority.medium ? 'Средний' : 'Низкий'}</span>}
            </button>

            <button
              type="button"
              className="expanded-form-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Напоминания</span>
            </button>

            <button
              type="button"
              className="expanded-form-btn menu-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
              </svg>
            </button>
          </div>

          {showCalendar && (
            <CalendarPicker
              buttonRef={deadlineButtonRef}
              selectedDate={deadline}
              onDateSelect={(dateStr: string) => {
                setDeadline(dateStr);
                setDeadlineDisplay(formatToDDMMYYYY(dateStr));
                setShowCalendar(false);
              }}
              onClose={() => setShowCalendar(false)}
            />
          )}

          <div className="expanded-form-footer">
            <button type="button" className="expanded-category-btn">
              <span>Входящие</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="expanded-form-actions">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Отмена
              </button>
              <button type="submit" className="btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px', flexShrink: 0 }}>
                  <path d="M12 5V19M5 12H19" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontStyle: 'normal' }}>{initialTask ? 'Сохранить изменения' : 'Добавить задачу'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

