
import React from 'react';

/**
 * @file BearingUGO.tsx
 * @description Этот файл содержит React-компонент для отрисовки Условного Графического Обозначения (УГО) подшипника.
 * Компонент способен отрисовывать подшипник для горизонтального или вертикального вала.
 * Компонент также отрисовывает сегмент вала, который проходит через центр подшипника.
 */

interface BearingUGOProps {
  /** Ширина SVG-контейнера для УГО. */
  width: number;
  /** Высота SVG-контейнера для УГО. */
  height: number;
  /**
   * Определяет ориентацию подшипника в зависимости от вала, на котором он установлен.
   * 'horizontal-shaft': Для горизонтального вала. Линии подшипника будут горизонтальными.
   * 'vertical-shaft': Для вертикального вала. Линии подшипника будут вертикальными.
   */
  orientation: 'horizontal-shaft' | 'vertical-shaft';
}

/**
 * УГО подшипника. Отрисовывает две параллельные линии, ПАРАЛЛЕЛЬНЫЕ валу, и сам вал между ними.
 * @param orientation - 'horizontal-shaft' (для горизонтального вала, линии горизонтальные)
 *                      'vertical-shaft' (для вертикального вала, линии вертикальные)
 */
export const BearingUGO: React.FC<BearingUGOProps> = ({
  width,
  height,
  orientation,
}) => {
  // --- Константы для стилизации УГО ---
  const STROKE_COLOR = '#0F0F0F'; // Цвет линий
  const STROKE_WIDTH = 2;         // Толщина линий
  const LINE_GAP = 8;             // Расстояние между линиями подшипника

  // Центр SVG-контейнера
  const centerX = width / 2;
  const centerY = height / 2;

  // --- Логика для подшипника на ГОРИЗОНТАЛЬНОМ валу ---
  if (orientation === 'horizontal-shaft') {
    // Рассчитываем Y-координаты для двух горизонтальных линий подшипника
    const line1Y = centerY - LINE_GAP / 2;
    const line2Y = centerY + LINE_GAP / 2;

    // Линии подшипника делаем на 2px короче общей ширины, чтобы вал выступал на 1px с каждой стороны.
    const bearingLineX1 = 1;
    const bearingLineX2 = width - 1;

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        {/* Отрисовка УГО */}
        <g stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH}>
          {/* 1. Вал, проходящий через центр. Он занимает всю ширину компонента. */}
          <line x1={0} y1={centerY} x2={width} y2={centerY} />
          
          {/* 2. Верхняя и нижняя линии подшипника. Они короче вала. */}
          <line x1={bearingLineX1} y1={line1Y} x2={bearingLineX2} y2={line1Y} />
          <line x1={bearingLineX1} y1={line2Y} x2={bearingLineX2} y2={line2Y} />
        </g>
      </svg>
    );
  } 
  // --- Логика для подшипника на ВЕРТИКАЛЬНОМ валу ---
  else { // 'vertical-shaft'
    // Рассчитываем X-координаты для двух вертикальных линий подшипника
    const line1X = centerX - LINE_GAP / 2;
    const line2X = centerX + LINE_GAP / 2;
    
    // Линии подшипника делаем на 2px короче общей высоты.
    const bearingLineY1 = 1;
    const bearingLineY2 = height - 1;

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        {/* Отрисовка УГО */}
        <g stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH}>
          {/* 1. Вал, проходящий через центр. Он занимает всю высоту компонента. */}
          <line x1={centerX} y1={0} x2={centerX} y2={height} />

          {/* 2. Левая и правая линии подшипника. Они короче вала. */}
          <line x1={line1X} y1={bearingLineY1} x2={line1X} y2={bearingLineY2} />
          <line x1={line2X} y1={bearingLineY1} x2={line2X} y2={bearingLineY2} />
        </g>
      </svg>
    );
  }
};