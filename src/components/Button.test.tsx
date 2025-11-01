import { render, screen, fireEvent } from '@testing-library/react';
// FIX: Import `expect` from `vitest` to resolve 'Cannot find name' errors.
import { describe, it, vi, expect } from 'vitest';
import Button from './Button';

// FIX: Import vitest-specific matchers from jest-dom to extend vitest's `expect` and fix TypeScript errors.
import '@testing-library/jest-dom/vitest';

describe('Компонент Button', () => {
  it('должен отображаться и быть кликабельным', () => {
    const handleClick = vi.fn();
    const buttonText = 'Нажми меня';

    render(<Button onClick={handleClick}>{buttonText}</Button>);

    // Находим кнопку по тексту
    const buttonElement = screen.getByText(buttonText);
    expect(buttonElement).toBeInTheDocument();

    // Симулируем клик
    fireEvent.click(buttonElement);

    // Проверяем, что обработчик был вызван
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('должен быть неактивным, если disabled=true', () => {
    const handleClick = vi.fn();
    const buttonText = 'Неактивная кнопка';

    render(<Button onClick={handleClick} disabled>{buttonText}</Button>);

    const buttonElement = screen.getByText(buttonText);
    expect(buttonElement).toBeDisabled();

    // Пытаемся кликнуть
    fireEvent.click(buttonElement);

    // Обработчик не должен был вызваться
    expect(handleClick).not.toHaveBeenCalled();
  });
});