import { useEffect, useState } from 'react';
import { getTasks, createTask, deleteTask, updateTask } from './api/taskAPI';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import type { Task } from './api/taskAPI';
import { TaskStatus, Priority } from './types/enums';
import './App.css';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const fetchedTasks = await getTasks();
    setTasks(fetchedTasks);
  };

  const handleAdd = async (data: { title: string; description?: string; priority?: Priority; is_favorite?: boolean }) => {
    await createTask(data);
    await loadTasks();
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    await loadTasks();
  };

  const handleToggleComplete = async (taskId: number) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? TaskStatus.active : TaskStatus.completed;
    await updateTask(taskId, { status: newStatus });
    await loadTasks();
  };

  const handleToggleFavorite = async (taskId: number) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (!task) return;
    
    await updateTask(taskId, { is_favorite: !task.is_favorite });
    await loadTasks();
  };

  const clearFilters = () => {
    setFilterStatus(null);
    setFilterPriority(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📋 MasterTask</h1>
        <p>Управление вашими задачами</p>
      </header>

      <div className="app-content">
        <aside>
          <TaskForm onSubmit={handleAdd} />

          <div className="filters">
            <h3>Фильтры</h3>
            
            <div className="filter-group">
              <label htmlFor="filter-status">Статус</label>
              <select
                id="filter-status"
                value={filterStatus || ''}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus || null)}
              >
                <option value="">Все</option>
                <option value={TaskStatus.active}>Активна</option>
                <option value={TaskStatus.in_progress}>В работе</option>
                <option value={TaskStatus.completed}>Завершена</option>
                <option value={TaskStatus.overdue}>Просрочена</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-priority">Приоритет</label>
              <select
                id="filter-priority"
                value={filterPriority || ''}
                onChange={(e) => setFilterPriority(e.target.value as Priority || null)}
              >
                <option value="">Все</option>
                <option value={Priority.high}>Высокий</option>
                <option value={Priority.medium}>Средний</option>
                <option value={Priority.low}>Низкий</option>
              </select>
            </div>

            {(filterStatus || filterPriority) && (
              <button onClick={clearFilters} className="clear-filters">
                Сбросить фильтры
              </button>
            )}
          </div>
        </aside>

        <main>
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            filterStatus={filterStatus}
            filterPriority={filterPriority}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
