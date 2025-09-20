import React from 'react';

export const JOINT_UGO_WIDTH = 22;
export const JOINT_UGO_HEIGHT = 20;

const JOINT_STUB_LENGTH = 12;
const JOINT_RADIUS = 8;
const STROKE_COLOR = '#0F0F0F';
const STROKE_WIDTH = 2;

interface UniversalJointUGOProps {
  orientation: 'start' | 'end';
}

export const UniversalJointUGO: React.FC<UniversalJointUGOProps> = ({ orientation }) => {
  const transform = orientation === 'end' ? 'scale(-1, 1)' : '';

  // Центрируем по вертикали относительно точки (0,0)
  const arcTopY = -JOINT_RADIUS;
  const arcBottomY = JOINT_RADIUS;

  const pathD = `M ${JOINT_STUB_LENGTH},${arcTopY} A ${JOINT_RADIUS},${JOINT_RADIUS} 0 0 1 ${JOINT_STUB_LENGTH},${arcBottomY}`;
  const tangentLineX = JOINT_STUB_LENGTH + JOINT_RADIUS;

  return (
    <g transform={transform} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} fill="none">
      {/* Вал-хвостовик */}
      <line x1={0} y1={0} x2={JOINT_STUB_LENGTH} y2={0} />
      {/* Полукруг */}
      <path d={pathD} />
      {/* Линия, закрывающая полукруг (часть "D") */}
      <line x1={JOINT_STUB_LENGTH} y1={arcTopY} x2={JOINT_STUB_LENGTH} y2={arcBottomY} />
      {/* Касательная линия к центру дуги */}
      <line x1={tangentLineX} y1={arcTopY} x2={tangentLineX} y2={arcBottomY} />
    </g>
  );
};
