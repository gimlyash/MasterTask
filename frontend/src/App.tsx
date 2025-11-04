import { useEffect, useState, useCallback, useRef } from 'react';
import { getTasks, createTask, deleteTask, updateTask } from './api/taskAPI';
import { addTagToTask, getTags, createTag, getTaskTags, removeTagFromTask } from './api/tagsAPI';
import { TaskList } from './components/TaskList';
import { WeekView } from './components/WeekView';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { TaskModal } from './components/TaskModal';
import { Settings } from './components/Settings';
import { Notifications } from './components/Notifications';
import type { Task } from './api/taskAPI';
import type { User } from './api/userAPI';
import { getPreferences } from './api/userAPI';
import { TaskStatus, Priority } from './types/enums';
import type { CreateTaskData } from './types/task';
import { type DateFormat } from './utils/dateFormat';
import './App.css';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [filterFavorite, setFilterFavorite] = useState<boolean>(false);
  const [filterView, setFilterView] = useState<'inbox' | 'today' | 'upcoming' | 'all' | 'notifications'>('inbox');
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>('DD/MM/YYYY');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ tag_id: number; name: string }>>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Загрузка доступных тегов
  useEffect(() => {
    if (currentUser) {
      import('./api/tagsAPI').then(({ getTags }) => {
        getTags().then(tags => {
          setAvailableTags(tags);
        }).catch(console.error);
      });
    }
  }, [currentUser]);
  
  // Обработчик клика по тегу для фильтрации
  const handleTagClick = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };
  
  // Фильтрация тегов для автодополнения
  const filteredTagSuggestions = availableTags.filter((tag: { tag_id: number; name: string }) => {
    if (searchQuery.startsWith('#')) {
      const tagQuery = searchQuery.slice(1).toLowerCase();
      return tag.name.toLowerCase().includes(tagQuery) && !selectedTags.includes(tag.name);
    }
    return false;
  });

  // Загрузка пользователя из localStorage при запуске
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        
        // Загружаем настройки пользователя
        if (user.user_id) {
          loadUserPreferences(user.user_id);
        }
      } catch (e) {
        console.error('Error parsing saved user:', e);
      }
    }
  }, []);

  // Загрузка настроек пользователя
  const loadUserPreferences = async (userId: number) => {
    try {
      const { preferences } = await getPreferences(userId);
      if (preferences) {
        if (preferences.theme) {
          setTheme(preferences.theme as 'light' | 'dark');
          document.documentElement.setAttribute('data-theme', preferences.theme as string);
        }
        if (preferences.dateFormat) {
          setDateFormat(preferences.dateFormat as DateFormat);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  // Применение темы при изменении
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  // Состояние для принудительного обновления счетчика просроченных задач
  const [, setRefreshCounter] = useState(0);

  // Периодическое обновление счетчика просроченных задач (каждую минуту)
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 60000); // Обновление каждую минуту

    return () => clearInterval(interval);
  }, []);

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
        // Теги уже включены в ответ от backend через from_orm_with_tags
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

  const handleAdd = async (data: CreateTaskData, taskId?: number) => {
    if (currentUser) {
      // Если пользователь зарегистрирован - сохраняем на бэкенд
      try {
        if (taskId) {
          // Обновление существующей задачи
          await updateTask(taskId, {
            title: data.title,
            description: data.description,
            priority: data.priority || null,
            deadline: data.deadline || null,
            is_repeating: data.is_repeating,
            repeat_interval: data.repeat_interval || null,
            is_favorite: data.is_favorite,
          }, currentUser.user_id);
          
          // Обрабатываем теги - синхронизируем старые и новые теги
          // Получаем текущие теги задачи
          const currentTaskTags = await getTaskTags(taskId);
          const currentTagIds = new Set(currentTaskTags.map(tt => tt.tag_id));
          
          // Определяем новые теги
          const newTagNames = (data.tagNames || []).map(name => name.trim().toLowerCase()).filter(Boolean);
          const newTagIds = new Set<number>();
          
          if (newTagNames.length > 0) {
            // Получаем все доступные теги
            const allTags = await getTags();
            const tagMap = new Map(allTags.map(t => [t.name.toLowerCase(), t.tag_id]));
            
            // Создаем или находим теги и собираем их ID
            for (const tagName of newTagNames) {
              let tagId = tagMap.get(tagName);
              if (!tagId) {
                const newTag = await createTag(tagName);
                tagId = newTag.tag_id;
                // Обновляем map для последующих итераций
                tagMap.set(tagName, tagId);
              }
              newTagIds.add(tagId);
            }
          }
          
          // Удаляем теги, которых нет в новом списке
          const tagsToRemove = Array.from(currentTagIds).filter(tagId => !newTagIds.has(tagId));
          for (const tagId of tagsToRemove) {
            try {
              await removeTagFromTask(taskId, tagId);
            } catch (error) {
              console.error(`Ошибка при удалении тега ${tagId} из задачи ${taskId}:`, error);
            }
          }
          
          // Добавляем новые теги, которых нет в старом списке
          const tagsToAdd = Array.from(newTagIds).filter(tagId => !currentTagIds.has(tagId));
          for (const tagId of tagsToAdd) {
            try {
              await addTagToTask(taskId, tagId);
            } catch (error) {
              console.error(`Ошибка при добавлении тега ${tagId} к задаче ${taskId}:`, error);
            }
          }
          
          // Перезагружаем задачи, чтобы получить обновленные данные
          await loadTasks();
        } else {
          // Создание новой задачи
          const newTask = await createTask(data, currentUser.user_id);
          
          // Обрабатываем теги
          if (data.tagNames && data.tagNames.length > 0) {
            // Сначала загружаем все существующие теги
            const allTags = await getTags();
            const tagMap = new Map(allTags.map(t => [t.name.toLowerCase(), t.tag_id]));
            
            // Обрабатываем каждый тег последовательно
            const tagPromises = data.tagNames.map(async (tagName) => {
              const normalizedTagName = tagName.trim().toLowerCase();
              if (!normalizedTagName) return;
              
              let tagId = tagMap.get(normalizedTagName);
              if (!tagId) {
                // Создаем новый тег, если его нет (backend нормализует имя)
                const newTag = await createTag(normalizedTagName);
                tagId = newTag.tag_id;
              }
              
              // Связываем тег с задачей
              try {
                await addTagToTask(newTask.task_id, tagId);
              } catch {
                // Игнорируем ошибку, если связь уже существует (backend возвращает существующую связь)
                // Ошибка может быть только если задача или тег не найдены
              }
            });
            
            // Ждем завершения всех операций с тегами
            await Promise.all(tagPromises);
          }
          
          // Перезагружаем задачи, чтобы получить их с тегами
          await loadTasks();
        }
      } catch (error) {
        console.error('Ошибка при создании/обновлении задачи:', error);
        alert(`Не удалось ${taskId ? 'обновить' : 'создать'} задачу. Проверьте консоль для подробностей.`);
      }
    } else {
      // Если пользователь не зарегистрирован - сохраняем локально
      if (taskId) {
        // Обновление локальной задачи
        const updatedTasks = tasks.map(t =>
          t.task_id === taskId
            ? {
                ...t,
                title: data.title,
                description: data.description || null,
                priority: data.priority || null,
                deadline: data.deadline || null,
                is_repeating: data.is_repeating || false,
                repeat_interval: data.repeat_interval || null,
                is_favorite: data.is_favorite || false,
                updated_at: new Date().toISOString(),
              }
            : t
        );
        setTasks(updatedTasks);
      } else {
        // Создание новой локальной задачи
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
      }
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
    // Фильтрация по поисковому запросу (обычный поиск)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      // Проверяем, это поиск по тегу (#тег) или обычный поиск
      const isTagSearch = query.startsWith('#');
      const searchTerm = isTagSearch ? query.slice(1).trim() : query;
      
      if (isTagSearch && searchTerm) {
        // Поиск только по тегам
        const matchesTags = task.tags?.some(tag => 
          tag.name.toLowerCase().includes(searchTerm)
        ) || false;
        if (!matchesTags) {
          return false;
        }
      } else if (searchTerm) {
        // Обычный поиск по названию и описанию
        const matchesTitle = task.title.toLowerCase().includes(searchTerm);
        const matchesDescription = task.description?.toLowerCase().includes(searchTerm) || false;
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }
    }
    
    // Фильтрация по выбранным тегам
    if (selectedTags.length > 0) {
      const taskTagNames = task.tags?.map(t => t.name.toLowerCase()) || [];
      const hasAllSelectedTags = selectedTags.every(selectedTag => 
        taskTagNames.includes(selectedTag.toLowerCase())
      );
      if (!hasAllSelectedTags) {
        return false;
      }
    }
    
    if (filterView === 'inbox') {
      // Входящее: только задачи без категории И без deadline (созданные во входящих)
      // Задачи с deadline попадают в "Сегодня", "Предстоящее" или "Все задачи", но не во "Входящие"
      // Дополнительно проверяем, что это задачи текущего пользователя
      if (currentUser && task.user_id !== currentUser.user_id) {
        return false;
      }
      // Входящие: задачи без категории и без deadline
      return task.category_id === null && !task.deadline;
    }
    if (filterView === 'today') {
      // Сегодня: задачи с дедлайном сегодня (включая задачи из входящего, если у них есть deadline)
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      const today = getTodayDate();
      return formatDateKey(deadline) === formatDateKey(today);
    }
    if (filterView === 'upcoming') {
      // Предстоящее: задачи на текущей неделе (включая задачи из входящего, если у них есть deadline)
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();
      return deadline >= weekStart && deadline <= weekEnd;
    }
    if (filterView === 'all') {
      // Все задачи: все задачи пользователя
      if (currentUser && task.user_id !== currentUser.user_id) {
        return false;
      }
      // Если есть активные фильтры (статус, приоритет, избранное), показываем все задачи включая входящее
      if (filterStatus || filterPriority || filterFavorite) {
        return true;
      }
      // Без фильтров: показываем задачи с категориями + все задачи из входящего с deadline (без фильтрации по датам)
      if (task.category_id !== null) {
        return true; // Задачи с категориями всегда показываем
      }
      // Задачи из входящего показываем если у них есть deadline (любой, не только сегодня или на неделе)
      if (task.category_id === null && task.deadline) {
        return true; // Все задачи из входящего с deadline, независимо от даты
      }
      // Остальные задачи из входящего без deadline не показываем
      return false;
    }
    return true;
  });

  const handleUserLoggedIn = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setShowLogin(false);
    // После входа очищаем локальные задачи и загружаем задачи пользователя из БД
    setTasks([]);
    await loadTasks();
    // Загружаем настройки пользователя
    await loadUserPreferences(user.user_id);
  };

  const handleUserRegistered = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setShowRegister(false);
    // После регистрации очищаем локальные задачи и загружаем задачи пользователя из БД
    setTasks([]);
    await loadTasks();
    // Загружаем настройки нового пользователя
    await loadUserPreferences(user.user_id);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    // Обновляем настройки из обновленного пользователя и применяем их
    if (updatedUser.preferences) {
      if (updatedUser.preferences.theme) {
        const newTheme = updatedUser.preferences.theme as 'light' | 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
      if (updatedUser.preferences.dateFormat) {
        setDateFormat(updatedUser.preferences.dateFormat as DateFormat);
      }
    }
  };

  if (showLogin) {
    return (
      <LoginPage
        onSuccess={handleUserLoggedIn}
        onCancel={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
    );
  }

  if (showRegister) {
    return (
      <RegisterPage
        onSuccess={handleUserRegistered}
        onCancel={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    );
  }

  if (showSettings && currentUser) {
    return (
      <Settings
        key={`settings-${currentUser.user_id}-${JSON.stringify(currentUser.preferences)}`}
        user={currentUser}
        onClose={() => setShowSettings(false)}
        onUpdate={handleUserUpdate}
      />
    );
  }

  // Счетчики для боковой панели
  const activeTasks = tasks.filter(t => {
    if (currentUser && t.user_id !== currentUser.user_id) return false;
    if (t.category_id === null) return false; // Исключаем входящее
    return t.status === 'active' || t.status === 'in_progress';
  }).length;
  
  // Завершенные: все задачи (включая входящее), так как фильтр показывает все
  const completedTasks = tasks.filter(t => {
    if (currentUser && t.user_id !== currentUser.user_id) return false;
    return t.status === 'completed';
  }).length;
  
  // Избранные: все задачи (включая входящее), но исключаем завершенные
  const favoriteTasks = tasks.filter(t => {
    if (currentUser && t.user_id !== currentUser.user_id) return false;
    if (t.status === 'completed') return false; // Исключаем завершенные
    return t.is_favorite;
  }).length;
  
  // Все задачи: используем точно такую же логику, что и в фильтре filteredTasksByView для filterView === 'all'
  // Считаем задачи, которые будут показаны во вкладке "Все задачи" БЕЗ дополнительных фильтров и поиска
  const totalTasks = tasks.filter(t => {
    // Проверка пользователя (как в фильтре filterView === 'all')
    if (currentUser && t.user_id !== currentUser.user_id) {
      return false;
    }
    
    // Без дополнительных фильтров (filterStatus, filterPriority, filterFavorite):
    // Показываем задачи с категориями + все задачи из входящего с deadline (без фильтрации по датам)
    // Это точно такая же логика, как в блоке filterView === 'all' в filteredTasksByView
    
    // Задачи с категориями всегда показываем
    if (t.category_id !== null) {
      return true;
    }
    
    // Задачи из входящего показываем если у них есть deadline (любой, не только сегодня или на неделе)
    if (t.category_id === null && t.deadline) {
      return true; // Все задачи из входящего с deadline, независимо от даты
    }
    
    // Остальные задачи из входящего без deadline не учитываем
    return false;
  }).length;

  // Подсчет просроченных задач (пересчитывается при каждом рендере и каждую минуту)
  const overdueTasks = tasks.filter(task => {
    // Пропускаем завершенные задачи
    if (task.status === 'completed') return false;
    // Проверяем, что есть deadline
    if (!task.deadline) return false;
    // Проверяем, что deadline в прошлом
    const deadline = new Date(task.deadline);
    const today = getTodayDate();
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  }).length;

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
              if (currentUser && t.user_id !== currentUser.user_id) return false;
              return t.category_id === null && !t.deadline;
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

          {currentUser && (
            <button 
              className={`nav-item nav-item-notifications ${filterView === 'notifications' ? 'active' : ''}`}
              onClick={() => {
                setFilterView('notifications');
                setFilterStatus(null);
                setFilterPriority(null);
                setFilterFavorite(false);
              }}
            >
              <span className="nav-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>Уведомления</span>
              <span className="nav-count">{overdueTasks}</span>
            </button>
          )}

          <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0' }}></div>

          <button 
            className={`nav-item nav-item-completed ${filterStatus === TaskStatus.completed ? 'active' : ''}`}
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
            className={`nav-item nav-item-favorite ${filterFavorite ? 'active' : ''}`}
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
            onClick={() => {
              setFilterView('all');
              setFilterStatus(null);
              setFilterPriority(null);
              setFilterFavorite(false);
            }}
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
                onClick={() => setShowLogin(true)} 
                className="nav-item add-user-btn"
              >
                <span className="nav-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span>Войти</span>
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
        {/* Поисковая строка */}
        <div className="search-container" style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'var(--bg-primary, #ffffff)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '500px' }}>
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowTagSuggestions(e.target.value.startsWith('#') && e.target.value.length > 1);
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ea580c';
                    if (searchQuery.startsWith('#') && searchQuery.length > 1) {
                      setShowTagSuggestions(true);
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    // Задержка для обработки клика по предложению
                    setTimeout(() => setShowTagSuggestions(false), 200);
                  }}
                  placeholder="Поиск задач... (используйте # для поиска по тегам)"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                {/* Выпадающее меню с тегами */}
                {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {filteredTagSuggestions.map(tag => (
                      <button
                        key={tag.tag_id}
                        type="button"
                        onClick={() => {
                          setSearchQuery(`#${tag.name}`);
                          setShowTagSuggestions(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#333'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Выбранные теги */}
            {selectedTags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {selectedTags.map((tag, index) => (
                  <span 
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      backgroundColor: '#ea580c',
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      gap: '6px'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
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
            )}
          </div>
        </div>
        
        {filterView !== 'inbox' && filterView !== 'notifications' && (
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#86efac' }}>
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="completed-highlight" style={{ color: '#86efac' }}>Завершённые задачи</span>
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#fbbf24' }}>
                    <path d="M12 2L14.5 9L22 9.5L16.5 14.5L18.5 22L12 18L5.5 22L7.5 14.5L2 9.5L9.5 9L12 2Z" fill="currentColor"/>
                  </svg>
                  <span className="favorite-highlight" style={{ color: '#fbbf24' }}>Избранные задачи</span>
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
          {filterView === 'notifications' && currentUser ? (
            <Notifications userId={currentUser.user_id} dateFormat={dateFormat} />
          ) : filterView === 'inbox' ? (
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

              {/* Список задач на сплошном фоне - всегда список для входящих */}
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
                  dateFormat={dateFormat}
                  onTagClick={handleTagClick}
                />
              </div>
            </div>
          ) : filterView !== 'notifications' && viewMode === 'week' ? (
            <WeekView
              tasks={filteredTasksByView}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onCreateTask={handleAdd}
              filterStatus={filterStatus}
              filterPriority={filterPriority}
              filterFavorite={filterFavorite}
              dateFormat={dateFormat}
              onTagClick={handleTagClick}
              onEdit={(task: Task) => {
                setEditingTask(task);
              }}
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
                dateFormat={dateFormat}
                onTagClick={handleTagClick}
                onEdit={(task: Task) => {
                  setEditingTask(task);
                }}
              />

              {/* Модальное окно для добавления задачи */}
              <TaskModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={(taskData: CreateTaskData) => {
                  handleAdd(taskData);
                  setShowAddModal(false);
                }}
                dateFormat={dateFormat}
              />

              {/* Модальное окно для редактирования задачи */}
              <TaskModal
                isOpen={editingTask !== null}
                onClose={() => setEditingTask(null)}
                onSubmit={(taskData: CreateTaskData) => {
                  if (editingTask) {
                    handleAdd(taskData, editingTask.task_id);
                  } else {
                    handleAdd(taskData);
                  }
                  setEditingTask(null);
                }}
                initialTask={editingTask}
                dateFormat={dateFormat}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
