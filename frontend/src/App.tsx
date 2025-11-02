import { useEffect, useState, useCallback, useRef } from 'react';
import { getTasks, createTask, deleteTask, updateTask } from './api/taskAPI';
import { TaskList } from './components/TaskList';
import { WeekView } from './components/WeekView';
import { RegisterPage } from './pages/RegisterPage';
import { TaskModal } from './components/TaskModal';
import type { Task } from './api/taskAPI';
import type { User } from './api/userAPI';
import { TaskStatus, Priority } from './types/enums';
import type { CreateTaskData } from './types/task';
import './App.css';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [filterFavorite, setFilterFavorite] = useState<boolean>(false);
  const [filterView, setFilterView] = useState<'inbox' | 'today' | 'upcoming' | 'all'>('inbox');
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Загрузка пользователя из localStorage при запуске
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing saved user:', e);
      }
    }
  }, []);

  // Закрытие меню при клике вне его
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!showUserMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Загрузка локальных задач (для незарегистрированных пользователей)
  // Локальные задачи НЕ сохраняются - они существуют только в текущей сессии
  const loadLocalTasks = useCallback(() => {
    // При загрузке без пользователя - всегда пустой список
    setTasks([]);
  }, []);

  // Генерация временного ID для локальных задач
  const generateLocalTaskId = useCallback(() => {
    return Date.now() + Math.random();
  }, []);

  // Загрузка задач (с бэкенда или локальных)
  const loadTasks = useCallback(async () => {
    if (currentUser) {
      // Если пользователь зарегистрирован - загружаем с бэкенда
      try {
        const fetchedTasks = await getTasks(currentUser.user_id);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Ошибка загрузки задач:', error);
        setTasks([]);
      }
    } else {
      // Если пользователь не зарегистрирован - загружаем из localStorage
      loadLocalTasks();
    }
  }, [currentUser, loadLocalTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAdd = async (data: CreateTaskData) => {
    if (currentUser) {
      // Если пользователь зарегистрирован - сохраняем на бэкенд
      try {
        await createTask(data, currentUser.user_id);
        await loadTasks();
      } catch (error) {
        console.error('Ошибка при создании задачи:', error);
        alert('Не удалось создать задачу. Проверьте консоль для подробностей.');
      }
    } else {
      // Если пользователь не зарегистрирован - сохраняем локально
      const newTask: Task = {
        task_id: generateLocalTaskId(),
        user_id: 0,
        title: data.title,
        description: data.description || null,
        category_id: null,
        priority: data.priority || null,
        deadline: data.deadline || null,
        is_repeating: data.is_repeating || false,
        repeat_interval: data.repeat_interval || null,
        status: TaskStatus.active,
        is_favorite: data.is_favorite || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      // Локальные задачи НЕ сохраняются - они только в памяти текущей сессии
    }
  };

  const handleDelete = async (id: number) => {
    if (currentUser) {
      // Если пользователь зарегистрирован - удаляем на бэкенде
      try {
        await deleteTask(id, currentUser.user_id);
        await loadTasks();
      } catch (error) {
        console.error('Ошибка при удалении задачи:', error);
      }
    } else {
      // Если пользователь не зарегистрирован - удаляем локально
      const updatedTasks = tasks.filter(t => t.task_id !== id);
      setTasks(updatedTasks);
      // Локальные задачи НЕ сохраняются - только в памяти
    }
  };

  const handleToggleComplete = async (taskId: number) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (!task) return;

    if (currentUser) {
      // Если пользователь зарегистрирован - обновляем на бэкенде
      try {
        // Правильно определяем новый статус
        const newStatus = task.status === TaskStatus.completed ? TaskStatus.active : TaskStatus.completed;
        await updateTask(taskId, { status: newStatus }, currentUser.user_id);
        await loadTasks();
      } catch (error) {
        console.error('Ошибка при обновлении задачи:', error);
        alert('Не удалось обновить статус задачи. Проверьте консоль для подробностей.');
      }
    } else {
      // Если пользователь не зарегистрирован - обновляем локально
      const newStatus = task.status === TaskStatus.completed ? TaskStatus.active : TaskStatus.completed;
      const updatedTasks = tasks.map(t =>
        t.task_id === taskId
          ? {
              ...t,
              status: newStatus,
              completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            }
          : t
      );
      setTasks(updatedTasks);
      // Локальные задачи НЕ сохраняются - только в памяти
    }
  };

  const handleToggleFavorite = async (taskId: number) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (!task) return;

    if (currentUser) {
      // Если пользователь зарегистрирован - обновляем на бэкенде
      try {
        await updateTask(taskId, { is_favorite: !task.is_favorite }, currentUser.user_id);
        await loadTasks();
      } catch (error) {
        console.error('Ошибка при обновлении задачи:', error);
      }
    } else {
      // Если пользователь не зарегистрирован - обновляем локально
      const updatedTasks = tasks.map(t =>
        t.task_id === taskId
          ? {
              ...t,
              is_favorite: !t.is_favorite,
              updated_at: new Date().toISOString(),
            }
          : t
      );
      setTasks(updatedTasks);
      // Локальные задачи НЕ сохраняются - только в памяти
    }
  };

  const clearFilters = () => {
    setFilterStatus(null);
    setFilterPriority(null);
    setFilterFavorite(false);
    setFilterView('all');
  };

  // Функции для фильтрации задач
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getWeekStart = (date: Date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date = new Date()) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredTasksByView = tasks.filter(task => {
    if (filterView === 'inbox') {
      // Входящее: активные задачи без дедлайна или с дедлайном сегодня/завтра
      if (task.status !== 'completed' && task.status !== 'overdue') {
        if (!task.deadline) return true; // Без дедлайна
        const deadline = new Date(task.deadline);
        const today = getTodayDate();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deadlineKey = formatDateKey(deadline);
        const todayKey = formatDateKey(today);
        const tomorrowKey = formatDateKey(tomorrow);
        return deadlineKey === todayKey || deadlineKey === tomorrowKey;
      }
      return false;
    }
    if (filterView === 'today') {
      // Сегодня: задачи с дедлайном сегодня
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      const today = getTodayDate();
      return formatDateKey(deadline) === formatDateKey(today);
    }
    if (filterView === 'upcoming') {
      // Предстоящее: задачи на текущей неделе
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();
      return deadline >= weekStart && deadline <= weekEnd;
    }
    // 'all' - все задачи
    return true;
  });

  const handleUserRegistered = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setShowRegister(false);
    // После регистрации очищаем локальные задачи и загружаем задачи пользователя из БД
    setTasks([]);
    await loadTasks();
  };

  if (showRegister) {
    return (
      <RegisterPage
        onSuccess={handleUserRegistered}
        onCancel={() => setShowRegister(false)}
      />
    );
  }

  if (showSettings) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        background: '#fff1f2'
      }}>
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 1V3M12 21V23M23 12H21M3 12H1M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Настройки
        </h2>
        <p>Функционал настроек будет добавлен позже</p>
        <button 
          onClick={() => setShowSettings(false)}
          className="btn-primary"
          style={{ padding: '12px 24px' }}
        >
          Закрыть
        </button>
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.status === 'active' || t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const favoriteTasks = tasks.filter(t => t.is_favorite).length;
  const totalTasks = tasks.length;

  return (
    <div className="todoist-app">
      {/* Сайдбар */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M9 12H15M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            MasterTask
          </h1>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${filterView === 'inbox' ? 'active' : ''}`}
            onClick={() => {
              setFilterView('inbox');
              setFilterStatus(null);
              setFilterPriority(null);
              setFilterFavorite(false);
            }}
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>Входящее</span>
            <span className="nav-count">{tasks.filter(t => {
              if (t.status === 'completed' || t.status === 'overdue') return false;
              if (!t.deadline) return true;
              const deadline = new Date(t.deadline);
              const today = getTodayDate();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const deadlineKey = formatDateKey(deadline);
              const todayKey = formatDateKey(today);
              const tomorrowKey = formatDateKey(tomorrow);
              return deadlineKey === todayKey || deadlineKey === tomorrowKey;
            }).length}</span>
          </button>

          <button 
            className={`nav-item ${filterView === 'today' ? 'active' : ''}`}
            onClick={() => {
              setFilterView('today');
              setFilterStatus(null);
              setFilterPriority(null);
              setFilterFavorite(false);
            }}
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="8" cy="15" r="1" fill="currentColor"/>
                <circle cx="12" cy="15" r="1" fill="currentColor"/>
                <circle cx="16" cy="15" r="1" fill="currentColor"/>
              </svg>
            </span>
            <span>Сегодня</span>
            <span className="nav-count">{tasks.filter(t => {
              if (!t.deadline) return false;
              const deadline = new Date(t.deadline);
              return formatDateKey(deadline) === formatDateKey(getTodayDate());
            }).length}</span>
          </button>

          <button 
            className={`nav-item ${filterView === 'upcoming' ? 'active' : ''}`}
            onClick={() => {
              setFilterView('upcoming');
              setFilterStatus(null);
              setFilterPriority(null);
              setFilterFavorite(false);
            }}
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 2V6M8 2V6M3 10H21M7 14H7.01M11 14H11.01M15 14H15.01M7 18H7.01M11 18H11.01M15 18H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Предстоящее</span>
            <span className="nav-count">{tasks.filter(t => {
              if (!t.deadline) return false;
              const deadline = new Date(t.deadline);
              const weekStart = getWeekStart();
              const weekEnd = getWeekEnd();
              return deadline >= weekStart && deadline <= weekEnd;
            }).length}</span>
          </button>

          <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0' }}></div>

          <button 
            className={`nav-item ${filterStatus === TaskStatus.completed ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus(TaskStatus.completed);
              setFilterPriority(null);
              setFilterFavorite(false);
              setFilterView('all');
            }}
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>Завершённые</span>
            <span className="nav-count">{completedTasks}</span>
          </button>

          <button 
            className={`nav-item ${filterFavorite ? 'active' : ''}`}
            onClick={() => {
              setFilterFavorite(true);
              setFilterStatus(null);
              setFilterPriority(null);
              setFilterView('all');
            }}
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.5 9L22 9.5L16.5 14.5L18.5 22L12 18L5.5 22L7.5 14.5L2 9.5L9.5 9L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
              </svg>
            </span>
            <span>Избранные</span>
            <span className="nav-count">{favoriteTasks}</span>
          </button>

          <button 
            className={`nav-item ${filterView === 'all' && !filterStatus && !filterPriority && !filterFavorite ? 'active' : ''}`}
            onClick={clearFilters}
          >
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M9 12H15M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Все задачи</span>
            <span className="nav-count">{totalTasks}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-menu-container" ref={userMenuRef}>
            {currentUser ? (
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)} 
                className="nav-item add-user-btn user-menu-trigger"
                title="Меню пользователя"
              >
                <span className="nav-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>{currentUser.email}</span>
                <span className="menu-arrow" style={{ marginLeft: '8px', fontSize: '12px', transition: 'transform 0.2s' }}>▼</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowRegister(true)} 
                className="nav-item add-user-btn"
              >
                <span className="nav-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>Гость</span>
                <span style={{ marginLeft: '8px', fontSize: '12px' }}>+</span>
              </button>
            )}
            
            {showUserMenu && currentUser && (
              <div className="user-menu-dropdown">
                <button 
                  onClick={() => {
                    setShowSettings(true);
                    setShowUserMenu(false);
                  }}
                  className="user-menu-item"
                >
                  <span className="nav-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 1V3M12 21V23M23 12H21M3 12H1M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <span>Настройки</span>
                </button>
                <button 
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('currentUser');
                    setTasks([]);
                    loadTasks();
                    setShowUserMenu(false);
                  }}
                  className="user-menu-item logout-item"
                >
                  <span className="nav-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="main-content">
        {filterView !== 'inbox' && (
          <header className="main-header">
            <div className="header-title">
              <h2>
                {filterView === 'today' && (
                  <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="8" cy="15" r="1" fill="currentColor"/>
                    <circle cx="12" cy="15" r="1" fill="currentColor"/>
                    <circle cx="16" cy="15" r="1" fill="currentColor"/>
                  </svg>
                  Сегодня
                </>
              )}
              {filterView === 'upcoming' && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6M8 2V6M3 10H21M7 14H7.01M11 14H11.01M15 14H15.01M7 18H7.01M11 18H11.01M15 18H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Предстоящее
                </>
              )}
              {filterStatus === TaskStatus.completed && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Завершённые задачи
                </>
              )}
              {filterPriority === Priority.high && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#f87171' }}>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  Высокий приоритет
                </>
              )}
              {filterPriority === Priority.medium && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#fbbf24' }}>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  Средний приоритет
                </>
              )}
              {filterPriority === Priority.low && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#34d399' }}>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  Низкий приоритет
                </>
              )}
              {filterFavorite && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                    <path d="M12 2L14.5 9L22 9.5L16.5 14.5L18.5 22L12 18L5.5 22L7.5 14.5L2 9.5L9.5 9L12 2Z" fill="currentColor"/>
                  </svg>
                  Избранные задачи
                </>
              )}
              {filterView === 'all' && !filterStatus && !filterPriority && !filterFavorite && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M9 12H15M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Все задачи
                </>
              )}
              </h2>
              <p className="tasks-summary">
                {activeTasks} активных, {completedTasks} завершённых из {totalTasks}
              </p>
            </div>
            <div className="view-switcher">
              <button
                className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="8" cy="15" r="1" fill="currentColor"/>
                  <circle cx="12" cy="15" r="1" fill="currentColor"/>
                  <circle cx="16" cy="15" r="1" fill="currentColor"/>
                </svg>
                Неделя
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M9 12H15M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Список
              </button>
            </div>
          </header>
        )}

        <div className="content-area">
          {filterView === 'inbox' ? (
            <div className="inbox-view">
              {/* Заголовок на самом листе */}
              <div className="inbox-header">
                <h1 className="inbox-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '10px' }}>
                    <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Входящее
                </h1>
              </div>

              {/* Список задач на сплошном фоне */}
              <div className="inbox-tasks-container">
                <TaskList
                  tasks={filteredTasksByView}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                  onCreateTask={handleAdd}
                  onEdit={(task: Task) => {
                    setEditingTask(task);
                  }}
                  onStartEdit={setEditingTask}
                  editingTaskId={editingTask?.task_id || null}
                  filterStatus={filterStatus}
                  filterPriority={filterPriority}
                  filterFavorite={filterFavorite}
                  isInboxView={true}
                />
              </div>
            </div>
          ) : viewMode === 'week' ? (
            <WeekView
              tasks={filteredTasksByView}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onCreateTask={handleAdd}
              filterStatus={filterStatus}
              filterPriority={filterPriority}
              filterFavorite={filterFavorite}
            />
          ) : (
            <div className="task-list-view">
              {/* Кнопка добавления задачи */}
              <button 
                className="inbox-add-btn"
                onClick={() => setShowAddModal(true)}
                title="Добавить задачу"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Добавить задачу</span>
              </button>

              {/* Список задач */}
              <TaskList
                tasks={filteredTasksByView}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                filterStatus={filterStatus}
                filterPriority={filterPriority}
                filterFavorite={filterFavorite}
              />

              {/* Модальное окно для добавления задачи */}
              <TaskModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={(taskData: CreateTaskData) => {
                  handleAdd(taskData);
                  setShowAddModal(false);
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
