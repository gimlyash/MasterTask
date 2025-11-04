import { useState } from 'react';
import { loginUser, type User } from '../api/userAPI';
import './LoginPage.css';

interface LoginPageProps {
  onSuccess?: (user: User) => void;
  onCancel?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginPage({ onSuccess, onCancel, onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Проверка email
    if (!email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Некорректный формат email';
    }

    // Проверка пароля
    if (!password) {
      newErrors.password = 'Пароль обязателен для заполнения';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const user = await loginUser({
        email: email.trim(),
        password: password,
      });

      if (onSuccess) {
        onSuccess(user);
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: { detail?: string }; status: number } };
        const errorData = axiosError.response.data;
        if (errorData.detail) {
          if (axiosError.response.status === 401) {
            setErrors({ submit: 'Неверный email или пароль' });
          } else {
            setErrors({ submit: errorData.detail });
          }
        } else {
          setErrors({ submit: 'Ошибка при входе' });
        }
      } else {
        setErrors({ submit: 'Ошибка соединения с сервером' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Вход в систему</h1>
          {onCancel && (
            <button 
              onClick={onCancel} 
              className="back-button"
              disabled={isLoading}
              title="Вернуться в приложение"
            >
              ← Назад
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="example@mail.com"
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль *</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              placeholder="Введите пароль"
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {errors.submit && (
            <div className="error-message general-error">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>

          {onSwitchToRegister && (
            <div className="switch-auth">
              <span>Нет аккаунта? </span>
              <button 
                type="button"
                onClick={onSwitchToRegister}
                className="link-button"
                disabled={isLoading}
              >
                Зарегистрироваться
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

