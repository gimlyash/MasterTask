import { useState } from 'react';
import { createUser, type User } from '../api/userAPI';
import './RegisterPage.css';

interface RegisterPageProps {
  onSuccess?: (user: User) => void;
  onCancel?: () => void;
}

export function RegisterPage({ onSuccess, onCancel }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

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
    } else if (password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    } else if (password.length > 128) {
      newErrors.password = 'Пароль не должен превышать 128 символов';
    }

    // Проверка подтверждения пароля
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const passwordHash = await hashPassword(password);
      const newUser = await createUser({
        email: email.trim(),
        password_hash: passwordHash,
      });

      setSuccessMessage('Пользователь успешно создан!');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(newUser);
        }, 1500);
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: { detail?: string } } };
        const errorData = axiosError.response.data;
        if (errorData.detail) {
          if (errorData.detail.includes('already registered') || errorData.detail.includes('Email')) {
            setErrors({ email: 'Этот email уже зарегистрирован' });
          } else {
            setErrors({ submit: errorData.detail });
          }
        } else {
          setErrors({ submit: 'Ошибка при создании пользователя' });
        }
      } else {
        setErrors({ submit: 'Ошибка соединения с сервером' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Регистрация пользователя</h1>
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

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
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
              placeholder="Минимум 6 символов"
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль *</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              placeholder="Повторите пароль"
              className={errors.confirmPassword ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
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
              {isLoading ? 'Создание...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

