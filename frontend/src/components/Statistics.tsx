import { useState, useEffect, useMemo } from 'react';
import { getAnalyticsStats, type AnalyticsStats } from '../api/statisticsAPI';
import type { Task } from '../api/taskAPI';
import { TaskStatus } from '../types/enums';
import './Statistics.css';

interface StatisticsProps {
  userId: number;
  tasks: Task[];
  onClose: () => void;
}

export function Statistics({ userId, tasks, onClose }: StatisticsProps) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const data = await getAnalyticsStats(userId);
        setStats(data);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [userId, tasks]); // Перезагружаем статистику при изменении задач

  // Фильтруем выполненные задачи по периоду (включая задачи из входящих)
  const completedTasksByPeriod = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return tasks.filter(task => {
      // Фильтруем только выполненные задачи (включая из входящих)
      if (task.status !== TaskStatus.completed) return false;
      
      // Если выбрано "все время", показываем все выполненные задачи
      if (timeRange === 'all') return true;
      
      // Проверяем дату выполнения (используем completed_at или updated_at как fallback)
      let completedAt: Date | null = null;
      if (task.completed_at) {
        completedAt = new Date(task.completed_at);
      } else if (task.updated_at && task.status === TaskStatus.completed) {
        // Если completed_at нет, но задача выполнена, используем updated_at
        completedAt = new Date(task.updated_at);
      }
      
      // Если нет даты выполнения, но задача выполнена и выбрано "все время", включаем
      // Если нет даты выполнения и выбран период, не включаем
      if (!completedAt) return false;
      
      // Проверяем, что дата в пределах периода (с небольшой погрешностью для учета времени)
      if (timeRange === 'week') {
        return completedAt >= weekAgo && completedAt <= now;
      } else if (timeRange === 'month') {
        return completedAt >= monthAgo && completedAt <= now;
      }
      return false;
    });
  }, [tasks, timeRange]);

  // Статистика по выполненным задачам
  const completedCount = completedTasksByPeriod.length || 0;
  
  // Для "Всего задач" считаем все задачи в выбранном периоде (включая из входящих)
  const totalTasksByPeriod = useMemo(() => {
    if (timeRange === 'all') {
      return tasks.length;
    }
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => {
      const createdAt = task.created_at ? new Date(task.created_at) : null;
      if (!createdAt) return false;
      
      if (timeRange === 'week') {
        return createdAt >= weekAgo && createdAt <= now;
      } else if (timeRange === 'month') {
        return createdAt >= monthAgo && createdAt <= now;
      }
      return false;
    }).length;
  }, [tasks, timeRange]);

  // Статистика из аналитики
  const analyticsCompleted = stats?.by_action?.completed || 0;
  const createdCount = stats?.by_action?.created || 0;
  const updatedCount = stats?.by_action?.updated || 0;
  const totalActions = stats?.total_actions || 0;

  // Вычисляем проценты для диаграммы (используем данные из аналитики)
  const completedPercent = totalActions > 0 ? (analyticsCompleted / totalActions) * 100 : 0;
  const createdPercent = totalActions > 0 ? (createdCount / totalActions) * 100 : 0;
  const updatedPercent = totalActions > 0 ? (updatedCount / totalActions) * 100 : 0;

  return (
    <div className="statistics-overlay" onClick={onClose}>
      <div className="statistics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="statistics-header">
          <h2>Статистика</h2>
          <button className="statistics-close" onClick={onClose}>×</button>
        </div>

        <div className="statistics-content">
          {isLoading ? (
            <div className="statistics-loading">Загрузка...</div>
          ) : (
            <>
              {/* Выбор периода */}
              <div className="statistics-time-range">
                <button
                  className={timeRange === 'week' ? 'active' : ''}
                  onClick={() => setTimeRange('week')}
                >
                  Неделя
                </button>
                <button
                  className={timeRange === 'month' ? 'active' : ''}
                  onClick={() => setTimeRange('month')}
                >
                  Месяц
                </button>
                <button
                  className={timeRange === 'all' ? 'active' : ''}
                  onClick={() => setTimeRange('all')}
                >
                  Все время
                </button>
              </div>

              {/* Общая статистика */}
              <div className="statistics-summary">
                <div className="stat-summary-item">
                  <div className="stat-summary-label">Выполнено задач ({timeRange === 'week' ? 'неделя' : timeRange === 'month' ? 'месяц' : 'все время'})</div>
                  <div className="stat-summary-value completed">{completedCount}</div>
                </div>
                <div className="stat-summary-item">
                  <div className="stat-summary-label">Всего задач ({timeRange === 'week' ? 'неделя' : timeRange === 'month' ? 'месяц' : 'все время'})</div>
                  <div className="stat-summary-value">{totalTasksByPeriod}</div>
                </div>
                <div className="stat-summary-item">
                  <div className="stat-summary-label">Всего действий</div>
                  <div className="stat-summary-value">{totalActions}</div>
                </div>
                <div className="stat-summary-item">
                  <div className="stat-summary-label">Создано задач</div>
                  <div className="stat-summary-value created">{createdCount}</div>
                </div>
              </div>

              {/* Круговая диаграмма */}
              <div className="statistics-pie">
                <h3>Распределение действий</h3>
                <div className="pie-chart-container">
                  <div className="pie-chart">
                    <svg viewBox="0 0 200 200" className="pie-svg">
                      {completedPercent > 0 && (
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#86efac"
                          strokeWidth="40"
                          strokeDasharray={`${completedPercent * 5.026} 502.6`}
                          strokeDashoffset="0"
                          transform="rotate(-90 100 100)"
                        />
                      )}
                      {createdPercent > 0 && (
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#60a5fa"
                          strokeWidth="40"
                          strokeDasharray={`${createdPercent * 5.026} 502.6`}
                          strokeDashoffset={`-${completedPercent * 5.026}`}
                          transform="rotate(-90 100 100)"
                        />
                      )}
                      {updatedPercent > 0 && (
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="40"
                          strokeDasharray={`${updatedPercent * 5.026} 502.6`}
                          strokeDashoffset={`-${(completedPercent + createdPercent) * 5.026}`}
                          transform="rotate(-90 100 100)"
                        />
                      )}
                    </svg>
                  </div>
                  <div className="pie-legend">
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: '#86efac' }}></span>
                      <span>Выполнено ({analyticsCompleted})</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: '#60a5fa' }}></span>
                      <span>Создано ({createdCount})</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: '#fbbf24' }}></span>
                      <span>Обновлено ({updatedCount})</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="statistics-footer">
          <button onClick={onClose} className="btn-primary">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

