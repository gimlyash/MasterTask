import { useState, useEffect, useMemo } from 'react';
import { updatePreferences, getPreferences, type User } from '../api/userAPI';
import { type DateFormat } from '../utils/dateFormat';
import './Settings.css';

interface SettingsProps {
  user: User;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

export function Settings({ user, onClose, onUpdate }: SettingsProps) {
  const getCurrentThemeFromDocument = (): 'light' | 'dark' => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    return (currentTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  };

  const initialTheme = useMemo(() => {
    if (user.preferences?.theme) {
      return user.preferences.theme as 'light' | 'dark';
    }
    return getCurrentThemeFromDocument();
  }, [user.preferences?.theme]);

  const initialDateFormat = useMemo(() => {
    return (user.preferences?.dateFormat as DateFormat) || 'DD/MM/YYYY';
  }, [user.preferences?.dateFormat]);

  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const [dateFormat, setDateFormat] = useState<DateFormat>(initialDateFormat);
  const [isSaving, setIsSaving] = useState(false);

  // Применяем тему при изменении в Settings
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Синхронизируем состояние при изменении user.preferences
  useEffect(() => {
    if (user.preferences) {
      if (user.preferences.theme) {
        setTheme(user.preferences.theme as 'light' | 'dark');
      }
      if (user.preferences.dateFormat) {
        setDateFormat(user.preferences.dateFormat as DateFormat);
      }
    } else {
      // Если preferences нет, загружаем из API
      const loadSettings = async () => {
        try {
          const { preferences } = await getPreferences(user.user_id);
          if (preferences) {
            if (preferences.theme) {
              setTheme(preferences.theme as 'light' | 'dark');
            } else {
              setTheme(getCurrentThemeFromDocument());
            }
            if (preferences.dateFormat) {
              setDateFormat(preferences.dateFormat as DateFormat);
            }
          }
        } catch (error) {
          console.error('Ошибка загрузки настроек:', error);
        }
      };
      loadSettings();
    }
  }, [user.user_id, user.preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await updatePreferences(user.user_id, {
        theme,
        dateFormat
      });
      
      // Применяем настройки сразу после сохранения
      document.documentElement.setAttribute('data-theme', theme);
      
      // Обновляем пользователя через callback
      onUpdate(updatedUser);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      alert('Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Настройки</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <div className="settings-toggle-row">
              <div>
                <h3>Тема оформления</h3>
                <p className="settings-hint">Переключение между светлой и темной темой</p>
              </div>
              <label className="theme-toggle">
                <input
                  type="checkbox"
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                />
                <span className="theme-toggle-slider"></span>
              </label>
            </div>
            <div className="theme-preview">
              <span className="theme-label">{theme === 'dark' ? 'Темная' : 'Светлая'}</span>
            </div>
          </div>

          <div className="settings-section">
            <h3>Формат даты</h3>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as DateFormat)}
              className="settings-select"
            >
              <option value="DD/MM/YYYY">ДД/ММ/ГГГГ (31/12/2024)</option>
              <option value="MM/DD/YYYY">ММ/ДД/ГГГГ (12/31/2024)</option>
              <option value="YYYY-MM-DD">ГГГГ-ММ-ДД (2024-12-31)</option>
              <option value="DD.MM.YYYY">ДД.ММ.ГГГГ (31.12.2024)</option>
              <option value="MM.DD.YYYY">ММ.ДД.ГГГГ (12.31.2024)</option>
            </select>
            <p className="settings-hint">Пример: {dateFormat.replace('DD', '31').replace('MM', '12').replace('YYYY', '2024')}</p>
          </div>

        </div>

        <div className="settings-footer">
          <button onClick={onClose} className="btn-secondary" disabled={isSaving}>
            Отмена
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

