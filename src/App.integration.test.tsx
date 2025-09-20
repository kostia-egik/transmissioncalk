import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('Интеграция компонента App', () => {
  it('должен пересчитывать итоговые результаты при изменении параметров ступени', async () => {
    render(<App />);

    // Начальные значения по умолчанию
    // Двигатель: 100 Нм, Ступень: z1=пусто, z2=пусто. Итогов нет.
    // Сначала проверим, что блока итогов нет или он пуст
    expect(screen.queryByText(/Общее передаточное отношение/)).not.toBeInTheDocument();

    // Находим поля ввода для первой (и единственной) ступени
    const z1Input = screen.getByLabelText('z₁ (ведущая)');
    const z2Input = screen.getByLabelText('z₂ (ведомая)');

    // Заполняем поля для первой ступени
    fireEvent.change(z1Input, { target: { value: '20' } });
    fireEvent.change(z2Input, { target: { value: '60' } });

    // Теперь блок с итоговыми параметрами должен появиться и содержать правильные значения
    // u = 60/20 = 3. eta = 0.98. torque = 100 * 3 * 0.98 = 294
    
    // Ищем текст "Выходной крутящий момент, Нм:" и проверяем, что рядом есть "294.00"
    // Используем `findByText` чтобы дождаться асинхронного обновления DOM
    const torqueOutput = await screen.findByText((_content, element) => {
        if (!element) return false;
        const hasText = (node: Element) => node.textContent === 'Выходной крутящий момент, Нм:';
        const elementHasText = hasText(element);
        const childrenDontHaveText = Array.from(element.children).every(
          (child) => !hasText(child as Element)
        );
        return elementHasText && childrenDontHaveText;
    });

    // Родительский элемент содержит и лейбл, и значение
    const torqueParentElement = torqueOutput.parentElement;
    expect(torqueParentElement).toHaveTextContent('294.00');

    // Проверяем передаточное число более надежным способом, чтобы избежать неоднозначности
    const gearRatioLabel = await screen.findByText('Общее передаточное отношение (кинематическое):');
    const gearRatioParentElement = gearRatioLabel.parentElement;
    expect(gearRatioParentElement).toHaveTextContent('3.0000');
  });
});