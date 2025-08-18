
import React from 'react';
import { UGO_PARALLEL_SHAFT_Y1, UGO_PARALLEL_SHAFT_Y2 } from './ugo-constants';

interface ToothedBeltDriveUGOProps {
  width: number;
  height: number;
  z1: number; // Число зубьев ведущего шкива
  z2: number; // Число зубьев ведомого шкива
  u: number;  // Передаточное число
  strokeColor?: string;
}

export const ToothedBeltDriveUGO: React.FC<ToothedBeltDriveUGOProps> = ({
  width,
  height,
  z1,
  z2,
  strokeColor = '#0F0F0F',
}) => {
  const RECT_STROKE_WIDTH = 2;
  const SHAFT_STROKE_WIDTH = 2;
  const BELT_STROKE_WIDTH = 2;
  const PULLEY_FILL_COLOR = 'white';
  const SHAFT_STROKE_COLOR = '#0F0F0F';
  
  const HATCH_PATTERN_ID = `hatchPatternToothedBelt-${strokeColor.replace(/[^a-zA-Z0-9]/g, '')}`;

  const PULLEY_RECT_WIDTH = Math.max(12, width * 0.40);
  const PULLEY_VERTICAL_GAP_FACTOR = 0.08;
  const PULLEY_VERTICAL_GAP = Math.max(4, height * PULLEY_VERTICAL_GAP_FACTOR);

  const fixedYShaft1Center = UGO_PARALLEL_SHAFT_Y1;
  const fixedYShaft2Center = UGO_PARALLEL_SHAFT_Y2;
  const shaftDistance = fixedYShaft2Center - fixedYShaft1Center;

  const totalRectHeightForPulleys = 2 * (shaftDistance - PULLEY_VERTICAL_GAP);
  const MIN_RECT_HEIGHT = Math.max(8, totalRectHeightForPulleys * 0.15);

  const z1Val = Number(z1) > 0 ? Number(z1) : 1;
  const z2Val = Number(z2) > 0 ? Number(z2) : 1;

  let H1, H2;

  if (totalRectHeightForPulleys <= 2 * MIN_RECT_HEIGHT) {
    H1 = H2 = Math.max(MIN_RECT_HEIGHT, shaftDistance - PULLEY_VERTICAL_GAP);
    if (H1 <= 0) H1 = MIN_RECT_HEIGHT;
    if (H2 <= 0) H2 = MIN_RECT_HEIGHT;
  } else if (z1Val === z2Val) {
    H1 = H2 = totalRectHeightForPulleys / 2;
  } else {
    const totalZ = z1Val + z2Val;
    H1 = (z1Val / totalZ) * totalRectHeightForPulleys;
    H2 = (z2Val / totalZ) * totalRectHeightForPulleys;

    if (H1 < MIN_RECT_HEIGHT) {
      H1 = MIN_RECT_HEIGHT;
      H2 = totalRectHeightForPulleys - H1;
    } else if (H2 < MIN_RECT_HEIGHT) {
      H2 = MIN_RECT_HEIGHT;
      H1 = totalRectHeightForPulleys - H2;
    }
    if (H1 < MIN_RECT_HEIGHT && H2 < MIN_RECT_HEIGHT && H1 + H2 > 0 && totalRectHeightForPulleys > 0) {
      H1 = H2 = totalRectHeightForPulleys / 2;
    } else if (H1 < MIN_RECT_HEIGHT) {
      H1 = MIN_RECT_HEIGHT;
      H2 = Math.max(MIN_RECT_HEIGHT, totalRectHeightForPulleys - H1);
    } else if (H2 < MIN_RECT_HEIGHT) {
      H2 = MIN_RECT_HEIGHT;
      H1 = Math.max(MIN_RECT_HEIGHT, totalRectHeightForPulleys - H2);
    }
  }
  if (H1 <= 0 || H2 <= 0) {
    H1 = Math.max(MIN_RECT_HEIGHT, (shaftDistance - PULLEY_VERTICAL_GAP) / 2);
    H2 = Math.max(MIN_RECT_HEIGHT, (shaftDistance - PULLEY_VERTICAL_GAP) / 2);
  }

  const yRect1Top = fixedYShaft1Center - H1 / 2;
  const yRect2Top = fixedYShaft2Center - H2 / 2;

  const xRectStart = (width - PULLEY_RECT_WIDTH) / 2;
  const xRectCenter = xRectStart + PULLEY_RECT_WIDTH / 2;

  const crossSize = 6;
  const crossOffset = crossSize / 2;

  const BELT_RECT_WIDTH_FACTOR = 0.7;
  const beltRectWidth = PULLEY_RECT_WIDTH * BELT_RECT_WIDTH_FACTOR;
  const beltRectX = xRectStart + (PULLEY_RECT_WIDTH - beltRectWidth) / 2;
  const beltRectY = yRect1Top;
  const beltRectHeight = (yRect2Top + H2) - yRect1Top;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={HATCH_PATTERN_ID} patternUnits="userSpaceOnUse" width="4" height="4">
          <line x1="0" y1="2" x2="4" y2="2" stroke={strokeColor} strokeWidth="0.7" />
        </pattern>
      </defs>
      <g stroke={SHAFT_STROKE_COLOR} strokeWidth={SHAFT_STROKE_WIDTH} fill="none">
        <line x1={0} y1={fixedYShaft1Center} x2={width} y2={fixedYShaft1Center} />
        <line x1={0} y1={fixedYShaft2Center} x2={width} y2={fixedYShaft2Center} />
      </g>
      <g stroke={strokeColor} strokeWidth={RECT_STROKE_WIDTH} fill="none">
        <rect x={xRectStart} y={yRect1Top} width={PULLEY_RECT_WIDTH} height={H1} fill={PULLEY_FILL_COLOR} />
        <rect x={xRectStart} y={yRect2Top} width={PULLEY_RECT_WIDTH} height={H2} fill={PULLEY_FILL_COLOR} />
        <rect
          x={beltRectX}
          y={beltRectY}
          width={beltRectWidth}
          height={beltRectHeight}
          fill={`url(#${HATCH_PATTERN_ID})`}
          strokeWidth={BELT_STROKE_WIDTH}
        />
        <line x1={xRectCenter - crossOffset} y1={fixedYShaft1Center - crossOffset} x2={xRectCenter + crossOffset} y2={fixedYShaft1Center + crossOffset} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} />
        <line x1={xRectCenter - crossOffset} y1={fixedYShaft1Center + crossOffset} x2={xRectCenter + crossOffset} y2={fixedYShaft1Center - crossOffset} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} />
        <line x1={xRectCenter - crossOffset} y1={fixedYShaft2Center - crossOffset} x2={xRectCenter + crossOffset} y2={fixedYShaft2Center + crossOffset} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} />
        <line x1={xRectCenter - crossOffset} y1={fixedYShaft2Center + crossOffset} x2={xRectCenter + crossOffset} y2={fixedYShaft2Center - crossOffset} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} />
      </g>
    </svg>
  );
};
