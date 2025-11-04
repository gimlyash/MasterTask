import { useState, useEffect, useRef, useCallback } from 'react';
import { Priority } from '../types/enums';
import type { CreateTaskData } from '../types/task';
import './InlineTaskForm.css';

import type { Task } from '../types/task';
import type { Tag } from '../api/tagsAPI';
import { getTags, createTag } from '../api/tagsAPI';

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
  const [isRepeating, setIsRepeating] = useState(initialTask?.is_repeating || false);
  const [repeatInterval, setRepeatInterval] = useState<string>(initialTask?.repeat_interval || '');
  const [isFavorite, setIsFavorite] = useState(initialTask?.is_favorite || false);
  const [showDateTimeMenu, setShowDateTimeMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'deadline' | 'reminder' | 'timer'>('deadline');
  const [reminderTime, setReminderTime] = useState<string>(initialTask?.reminder_time || '');
  const [timerHours, setTimerHours] = useState<string>(() => {
    if (initialTask?.timer_duration) {
      const [hours] = initialTask.timer_duration.split(':');
      return hours || '';
    }
    return '';
  });
  const [timerMinutes, setTimerMinutes] = useState<string>(() => {
    if (initialTask?.timer_duration) {
      const parts = initialTask.timer_duration.split(':');
      return parts.length > 1 ? parts[1] : '';
    }
    return '';
  });
  const [showMenu, setShowMenu] = useState(false);
  const [tags, setTags] = useState<string[]>(initialTask?.tags?.map(t => t.name) || []);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const dateTimeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);


  // Инициализация deadlineDisplay при монтировании или изменении deadline
  useEffect(() => {
    if (deadline) {
      setDeadlineDisplay(formatToDDMMYYYY(deadline));
    }
  }, [deadline]);

  // Загрузка доступных тегов
  useEffect(() => {
    getTags().then(setAvailableTags).catch(console.error);
  }, []);

  // Добавление тега
  const handleAddTag = async (tagName: string) => {
    const trimmedName = tagName.trim().toLowerCase();
    if (!trimmedName || tags.includes(trimmedName)) return;
    
    try {
      // Создаем или находим тег (backend нормализует имя)
      const tag = await createTag(trimmedName);
      setTags([...tags, tag.name.toLowerCase()]);
      setTagInput('');
      setShowTagSuggestions(false);
      
      // Обновляем список доступных тегов
      const updatedTags = await getTags();
      setAvailableTags(updatedTags);
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  // Удаление тега
  const handleRemoveTag = (tagName: string) => {
    setTags(tags.filter(t => t !== tagName));
  };

  // Обработка ввода тега
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  // Фильтрация предложений тегов
  const filteredTagSuggestions = availableTags.filter(
    tag => tag.name.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag.name)
  );

  // Функция для конвертации YYYY-MM-DD в DD/MM/YYYY
  const formatToDDMMYYYY = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Функция для получения читаемого названия напоминания
  const getReminderLabel = (value: string): string => {
    const labels: Record<string, string> = {
      '15min': 'За 15 мин',
      '30min': 'За 30 мин',
      '1hour': 'За 1 час',
      '2hours': 'За 2 часа',
      '1day': 'За день'
    };
    return labels[value] || value;
  };

  // Получение текста для кнопки даты/времени
  const getDateTimeButtonText = (): string => {
    if (deadlineDisplay) return `Срок: ${deadlineDisplay}`;
    if (reminderTime) return `Напоминание: ${getReminderLabel(reminderTime)}`;
    if (timerHours || timerMinutes) {
      const hours = timerHours || '0';
      const minutes = timerMinutes || '0';
      return `Таймер: ${hours}:${minutes.padStart(2, '0')}`;
    }
    return 'Срок и напоминания';
  };

  // Компонент объединенного меню для срока, напоминаний и таймера
  const DateTimeMenu = ({ 
    buttonRef, 
    activeTab, 
    onTabChange,
    deadline,
    deadlineDisplay,
    onDeadlineSelect,
    reminderTime,
    onReminderSelect,
    timerHours,
    timerMinutes,
    onTimerHoursChange,
    onTimerMinutesChange,
    onClose 
  }: { 
    buttonRef: React.RefObject<HTMLButtonElement | null>;
    activeTab: 'deadline' | 'reminder' | 'timer';
    onTabChange: (tab: 'deadline' | 'reminder' | 'timer') => void;
    deadline: string;
    deadlineDisplay: string;
    onDeadlineSelect: (date: string) => void;
    reminderTime: string;
    onReminderSelect: (time: string) => void;
    timerHours: string;
    timerMinutes: string;
    onTimerHoursChange: (hours: string) => void;
    onTimerMinutesChange: (minutes: string) => void;
    onClose: () => void;
  }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const timerHoursInputRef = useRef<HTMLInputElement>(null);
    const timerMinutesInputRef = useRef<HTMLInputElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isPositioned, setIsPositioned] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => {
      if (deadline) {
        const [year, month] = deadline.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    useEffect(() => {
      if (deadline) {
        const [year, month] = deadline.split('-');
        setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
      }
    }, [deadline]);

    // Функция для вычисления позиции
    const updatePosition = useCallback(() => {
      if (buttonRef.current && menuRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const menuHeight = menuRef.current.offsetHeight || 400;
        const menuWidth = menuRef.current.offsetWidth || 320;
        
        let top = buttonRect.bottom + 8;
        let left = buttonRect.left;
        
        if (left + menuWidth > window.innerWidth) {
          left = window.innerWidth - menuWidth - 16;
        }
        
        if (top + menuHeight > window.innerHeight) {
          top = buttonRect.top - menuHeight - 8;
        }
        
        setPosition({ top, left });
        setIsPositioned(true);
      }
    }, [buttonRef]);

    // Инициализация позиции только при монтировании
    useEffect(() => {
      if (buttonRef.current && menuRef.current && !isPositioned) {
        setIsPositioned(false);
        requestAnimationFrame(() => {
          updatePosition();
        });
      }
    }, [buttonRef, isPositioned, updatePosition]);
    
    // Пересчет позиции только при смене вкладки (не при изменении значений)
    useEffect(() => {
      if (isPositioned && buttonRef.current && menuRef.current) {
        // Небольшая задержка для пересчета размера контента после смены вкладки
        const timeoutId = setTimeout(() => {
          updatePosition();
        }, 50);
        
        return () => clearTimeout(timeoutId);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);
    
    // Обработчики для resize и scroll - только если меню уже позиционировано
    useEffect(() => {
      if (isPositioned) {
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        
        return () => {
          window.removeEventListener('resize', updatePosition);
          window.removeEventListener('scroll', updatePosition, true);
        };
      }
    }, [isPositioned, updatePosition]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          const target = event.target as HTMLElement;
          if (!target.closest('.expanded-form-btn') && !target.closest('.datetime-menu')) {
            onClose();
          }
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Календарь для выбора даты
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
    const today = new Date();
    const selectedDateObj = deadline ? new Date(deadline) : null;

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
      onDeadlineSelect(dateStr);
    };

    const reminderOptions = [
      { label: 'За 15 минут', value: '15min' },
      { label: 'За 30 минут', value: '30min' },
      { label: 'За 1 час', value: '1hour' },
      { label: 'За 2 часа', value: '2hours' },
      { label: 'За день', value: '1day' },
      { label: 'Убрать', value: '' }
    ];


    return (
      <div 
        className="datetime-menu" 
        ref={menuRef} 
        onClick={(e) => e.stopPropagation()} 
        onMouseDown={(e) => e.stopPropagation()}
        style={{ 
          top: `${position.top}px`, 
          left: `${position.left}px`,
          opacity: isPositioned ? 1 : 0,
          pointerEvents: isPositioned ? 'auto' : 'none',
          visibility: isPositioned ? 'visible' : 'hidden'
        }}
      >
        <div className="datetime-menu-tabs">
          <button
            type="button"
            className={`datetime-tab ${activeTab === 'deadline' ? 'active' : ''}`}
            onClick={() => onTabChange('deadline')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Срок
          </button>
          <button
            type="button"
            className={`datetime-tab ${activeTab === 'reminder' ? 'active' : ''}`}
            onClick={() => onTabChange('reminder')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Напоминание
          </button>
          <button
            type="button"
            className={`datetime-tab ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => onTabChange('timer')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Таймер
          </button>
        </div>

        <div className="datetime-menu-content">
          {activeTab === 'deadline' && (
            <div className="datetime-calendar">
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
              {deadlineDisplay && (
                <div className="datetime-selected">
                  <span>Выбрано: {deadlineDisplay}</span>
                  <button type="button" onClick={() => onDeadlineSelect('')} className="datetime-clear-btn">
                    Убрать
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reminder' && (
            <div className="datetime-options">
              {reminderOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`datetime-option ${reminderTime === option.value ? 'selected' : ''}`}
                  onClick={() => onReminderSelect(option.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'timer' && (
            <div className="datetime-timer-input">
              <p className="datetime-info">Таймер: если задача не выполнена за указанное время, придет уведомление</p>
              <div className="timer-input-group">
                <div className="timer-input-field">
                  <label>Часы</label>
                  <div className="timer-input-wrapper">
                    <input
                      ref={timerHoursInputRef}
                      type="number"
                      min="0"
                      max="23"
                      value={timerHours}
                      onChange={(e) => {
                        onTimerHoursChange(e.target.value);
                      }}
                      onBlur={(e) => {
                        // При потере фокуса нормализуем значение
                        const val = e.target.value.trim();
                        if (val === '') {
                          onTimerHoursChange('');
                          return;
                        }
                        const num = parseInt(val);
                        if (!isNaN(num)) {
                          if (num > 23) {
                            onTimerHoursChange('23');
                          } else if (num < 0) {
                            onTimerHoursChange('0');
                          } else {
                            onTimerHoursChange(String(num));
                          }
                        } else {
                          onTimerHoursChange('');
                        }
                      }}
                      placeholder="0"
                      className="timer-input"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="timer-arrow-btn timer-arrow-up"
                      onClick={() => {
                        const current = parseInt(timerHours) || 0;
                        if (current < 23) {
                          onTimerHoursChange(String(current + 1));
                        }
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    />
                    <button
                      type="button"
                      className="timer-arrow-btn timer-arrow-down"
                      onClick={() => {
                        const current = parseInt(timerHours) || 0;
                        if (current > 0) {
                          onTimerHoursChange(String(current - 1));
                        }
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    />
                  </div>
                </div>
                <span className="timer-separator">:</span>
                <div className="timer-input-field">
                  <label>Минуты</label>
                  <div className="timer-input-wrapper">
                    <input
                      ref={timerMinutesInputRef}
                      type="number"
                      min="0"
                      max="59"
                      value={timerMinutes}
                      onChange={(e) => {
                        onTimerMinutesChange(e.target.value);
                      }}
                      onBlur={(e) => {
                        // При потере фокуса нормализуем значение
                        const val = e.target.value.trim();
                        if (val === '') {
                          onTimerMinutesChange('');
                          return;
                        }
                        const num = parseInt(val);
                        if (!isNaN(num)) {
                          if (num > 59) {
                            onTimerMinutesChange('59');
                          } else if (num < 0) {
                            onTimerMinutesChange('0');
                          } else {
                            // Форматируем с ведущим нулем
                            onTimerMinutesChange(String(num).padStart(2, '0'));
                          }
                        } else {
                          onTimerMinutesChange('');
                        }
                      }}
                      placeholder="00"
                      className="timer-input"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="timer-arrow-btn timer-arrow-up"
                      onClick={() => {
                        const current = parseInt(timerMinutes) || 0;
                        if (current < 59) {
                          onTimerMinutesChange(String(current + 1).padStart(2, '0'));
                        }
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    />
                    <button
                      type="button"
                      className="timer-arrow-btn timer-arrow-down"
                      onClick={() => {
                        const current = parseInt(timerMinutes) || 0;
                        if (current > 0) {
                          onTimerMinutesChange(String(current - 1).padStart(2, '0'));
                        }
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    />
                  </div>
                </div>
              </div>
              {(timerHours || timerMinutes) && (
                <button
                  type="button"
                  onClick={() => {
                    setTimerHours('');
                    setTimerMinutes('');
                  }}
                  className="datetime-clear-btn"
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  Убрать таймер
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Формируем timer_duration из часов и минут
    let timerDuration: string | undefined = undefined;
    if (timerHours || timerMinutes) {
      const hours = timerHours || '0';
      const minutes = timerMinutes || '0';
      timerDuration = `${hours}:${minutes.padStart(2, '0')}`;
    }

    const submitData: CreateTaskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      deadline: deadline ? deadline : undefined,
      is_repeating: isRepeating ? true : undefined,
      repeat_interval: isRepeating && repeatInterval ? repeatInterval : undefined,
      is_favorite: isFavorite ? true : undefined,
      reminder_time: reminderTime || undefined,
      timer_duration: timerDuration,
      tagNames: tags.length > 0 ? tags : undefined,
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
    setReminderTime('');
    setTimerHours('');
    setTimerMinutes('');
    setTags([]);
    setTagInput('');
    onCancel();
  };

  // Обработка кликов вне формы
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        // Проверяем, не кликнули ли мы на календарь, меню даты/времени, меню или другие элементы формы
        const target = event.target as HTMLElement;
        if (!target.closest('.calendar-picker') && 
            !target.closest('.reminder-picker') && 
            !target.closest('.datetime-menu') &&
            !target.closest('.expanded-form-menu') &&
            !target.closest('.inbox-expanded-form')) {
          if (!title.trim() && !description.trim()) {
            onCancel();
          }
        }
      }
      // Закрываем меню при клике вне его
      if (showMenu && menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('.expanded-form-menu')) {
          setShowMenu(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [title, description, onCancel, showMenu]);

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
              ref={dateTimeButtonRef}
              type="button"
              onClick={() => setShowDateTimeMenu(!showDateTimeMenu)}
              className="expanded-form-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{getDateTimeButtonText()}</span>
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

            <div style={{ position: 'relative' }}>
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="expanded-form-btn menu-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                </svg>
              </button>
              {showMenu && (
                <div className="expanded-form-menu">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRepeating(!isRepeating);
                      setShowMenu(false);
                    }}
                    className="expanded-form-menu-item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {isRepeating ? 'Отключить повтор' : 'Повторяющаяся задача'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFavorite(!isFavorite);
                      setShowMenu(false);
                    }}
                    className="expanded-form-menu-item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L14.5 9L22 9.5L16.5 14.5L18.5 22L12 18L5.5 22L7.5 14.5L2 9.5L9.5 9L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                    {isFavorite ? 'Убрать из избранного' : 'В избранное'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {showDateTimeMenu && (
            <DateTimeMenu
              buttonRef={dateTimeButtonRef}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              deadline={deadline}
              deadlineDisplay={deadlineDisplay}
              onDeadlineSelect={(dateStr: string) => {
                setDeadline(dateStr);
                setDeadlineDisplay(formatToDDMMYYYY(dateStr));
              }}
              reminderTime={reminderTime}
              onReminderSelect={(time: string) => {
                setReminderTime(time);
              }}
              timerHours={timerHours}
              timerMinutes={timerMinutes}
              onTimerHoursChange={(hours: string) => setTimerHours(hours)}
              onTimerMinutesChange={(minutes: string) => setTimerMinutes(minutes)}
              onClose={() => setShowDateTimeMenu(false)}
            />
          )}

          {/* Поле для тегов */}
          <div className="tags-input-container" style={{ marginTop: '12px', position: 'relative' }}>
            <div className="tags-display" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {tags.map((tag, index) => (
                <span key={index} className="tag-badge" style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  padding: '4px 8px', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  gap: '6px'
                }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagSuggestions(e.target.value.length > 0);
              }}
              onKeyDown={handleTagInputKeyDown}
              onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
              placeholder="Добавить тег (Enter или запятая)"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            {showTagSuggestions && filteredTagSuggestions.length > 0 && (
              <div className="tag-suggestions" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                marginTop: '4px',
                maxHeight: '150px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {filteredTagSuggestions.map(tag => (
                  <button
                    key={tag.tag_id}
                    type="button"
                    onClick={() => handleAddTag(tag.name)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="expanded-form-footer">
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

