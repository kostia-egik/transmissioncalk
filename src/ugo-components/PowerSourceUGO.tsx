import React from 'react';
import { PowerSourceDirection } from '../types';

interface PowerSourceUGOProps {
  width: number;
  height: number;
  direction: PowerSourceDirection;
}

export const PowerSourceUGO: React.FC<PowerSourceUGOProps> = ({
  width,
  height,
  direction,
}) => {
  const STROKE_COLOR = '#0F0F0F';
  const FILL_COLOR = 'white';
  const STROKE_WIDTH = 2;
  const TEXT_COLOR = '#0F0F0F';
  const FONT_FAMILY = 'Calibri, sans-serif';

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35; // Радиус круга

  const fontSize = radius * 1.2; // Размер буквы "М"

  let lineX1 = centerX;
  let lineY1 = centerY;
  let lineX2 = centerX;
  let lineY2 = centerY;

  switch (direction) {
    case PowerSourceDirection.Right:
      lineX1 = centerX + radius;
      lineX2 = width;
      break;
    case PowerSourceDirection.Left:
      lineX1 = centerX - radius;
      lineX2 = 0;
      break;
    case PowerSourceDirection.Up:
      lineY1 = centerY - radius;
      lineY2 = 0;
      break;
    case PowerSourceDirection.Down:
      lineY1 = centerY + radius;
      lineY2 = height;
      break;
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <g stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} fill="none">
        {/* Выходной вал */}
        <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} />

        {/* Круг двигателя */}
        <circle cx={centerX} cy={centerY} r={radius} fill={FILL_COLOR} />

        {/* Буква "М" */}
        <text
          x={centerX}
          y={centerY}
          fontFamily={FONT_FAMILY}
          fontSize={fontSize}
          fontWeight="bold"
          fill={TEXT_COLOR}
          textAnchor="middle"
          dominantBaseline="central"
          stroke="none"
        >
          М
        </text>
      </g>
    </svg>
  );
};