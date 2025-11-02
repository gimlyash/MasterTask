import { useState, useEffect, useRef } from 'react';
import type { Task } from '../types/task';

interface TaskBarMenuProps {
  task: Task;
  onToggleFavorite: (taskId: number) => void;
  onDelete: (taskId: number) => void;
}

export function TaskBarMenu({ task, onToggleFavorite, onDelete }: TaskBarMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showMenu) return;

    const updatePosition = () => {
      if (menuButtonRef.current && menuDropdownRef.current) {
        const buttonRect = menuButtonRef.current.getBoundingClientRect();
        const dropdown = menuDropdownRef.current;
        
        // Вычисляем позицию: справа вниз от кнопки
        // Добавляем небольшое перекрытие, чтобы при переходе курсора меню не исчезало
        let top = buttonRect.bottom - 2;
        let left = buttonRect.right;
        
        // Проверяем границы экрана
        if (left + dropdown.offsetWidth > window.innerWidth) {
          left = window.innerWidth - dropdown.offsetWidth - 10;
        }
        if (top + dropdown.offsetHeight > window.innerHeight) {
          top = buttonRect.top - dropdown.offsetHeight - 4;
        }
        if (top < 0) {
          top = 10;
        }
        if (left < 0) {
          left = 10;
        }
        
        dropdown.style.top = `${top}px`;
        dropdown.style.left = `${left}px`;
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showMenu]);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowMenu(false);
    }, 150); // Небольшая задержка перед закрытием
  };

  return (
    <div 
      className="task-bar-menu"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        ref={menuButtonRef}
        className="task-bar-icon-btn menu-btn"
        title="Дополнительно"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
        </svg>
      </button>
      {showMenu && (
        <div 
          ref={menuDropdownRef}
          className="task-bar-menu-dropdown"
        >
          <button onClick={() => {
            onToggleFavorite(task.task_id);
            setShowMenu(false);
          }} className="menu-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill={task.is_favorite ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9L22 9.5L16.5 14.5L18.5 22L12 18L5.5 22L7.5 14.5L2 9.5L9.5 9L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            {task.is_favorite ? 'Убрать из избранного' : 'В избранное'}
          </button>
          <button onClick={() => {
            onDelete(task.task_id);
            setShowMenu(false);
          }} className="menu-item delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}
