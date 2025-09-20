import React from 'react';
import { UniversalJointUGO, JOINT_UGO_WIDTH, JOINT_UGO_HEIGHT } from './UniversalJointUGO';

export { JOINT_UGO_WIDTH, JOINT_UGO_HEIGHT };

interface CardanShaftUGOProps {
  centralLength: number;
}

const STROKE_COLOR = '#0F0F0F';
const STROKE_WIDTH = 2;

export const CardanShaftUGO: React.FC<CardanShaftUGOProps> = ({ centralLength }) => {
  const centerY = JOINT_UGO_HEIGHT / 2;
  
  // Координаты для центральной линии
  const centralLineX1 = JOINT_UGO_WIDTH;
  const centralLineX2 = centralLineX1 + centralLength;
  
  // Координата X для начала второго (конечного) шарнира.
  // Он должен быть смещен на всю свою ширину от конца центральной линии.
  const secondJointOriginX = centralLineX2 + JOINT_UGO_WIDTH;


  return (
    <g>
      {/* Первый (начальный) шарнир. Рисуется от x=0 до x=JOINT_UGO_WIDTH */}
      <g transform={`translate(0, ${centerY})`}>
        <UniversalJointUGO orientation="start" />
      </g>

      {/* Центральный вал. Соединяет два шарнира. */}
      <line
        x1={centralLineX1}
        y1={centerY}
        x2={centralLineX2}
        y2={centerY}
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />

      {/* Второй (конечный) шарнир. 
          Его начало координат смещено в самый конец сборки.
          За счет scale(-1, 1) он будет рисоваться "назад", 
          стыкуясь с концом центрального вала. */}
      <g transform={`translate(${secondJointOriginX}, ${centerY})`}>
        <UniversalJointUGO orientation="end" />
      </g>
    </g>
  );
};
