
import React from 'react';
import { UGO_PARALLEL_SHAFT_Y1, UGO_PARALLEL_SHAFT_Y2 } from './ugo-constants';

interface CylindricalGearUGOProps {
  width: number;
  height: number;
  z1: number;
  z2: number;
  u: number;
  strokeColor?: string;
}

export const CylindricalGearUGO: React.FC<CylindricalGearUGOProps> = ({
  width,
  height,
  z1,
  z2,
  strokeColor = '#0F0F0F',
}) => {
  const RECT_STROKE_WIDTH = 2;
  const SHAFT_STROKE_WIDTH = 2;
  const GEAR_FILL_COLOR = 'white';
  const SHAFT_STROKE_COLOR = '#0F0F0F';

  const RECT_WIDTH = Math.max(12, width * 0.40);

  const fixedYShaft1Center = UGO_PARALLEL_SHAFT_Y1;
  const fixedYShaft2Center = UGO_PARALLEL_SHAFT_Y2;
  const shaftDistance = fixedYShaft2Center - fixedYShaft1Center;

  const totalRectHeightForGears = shaftDistance * 2;
  const MIN_RECT_HEIGHT = Math.max(10, totalRectHeightForGears * 0.15);
  
  const z1Val = Number(z1) > 0 ? Number(z1) : 1;
  const z2Val = Number(z2) > 0 ? Number(z2) : 1;
  
  let H1, H2;

  if (totalRectHeightForGears < 2 * MIN_RECT_HEIGHT) {
    H1 = H2 = Math.max(10, totalRectHeightForGears / 2);
  } else if (z1Val === z2Val) {
    H1 = H2 = totalRectHeightForGears / 2;
  } else {
    const totalZ = z1Val + z2Val;
    H1 = (z1Val / totalZ) * totalRectHeightForGears;
    H2 = (z2Val / totalZ) * totalRectHeightForGears;

    if (H1 < MIN_RECT_HEIGHT) {
      H1 = MIN_RECT_HEIGHT;
      H2 = totalRectHeightForGears - H1;
    } else if (H2 < MIN_RECT_HEIGHT) {
      H2 = MIN_RECT_HEIGHT;
      H1 = totalRectHeightForGears - H2;
    }
    if (H1 < MIN_RECT_HEIGHT && H2 < MIN_RECT_HEIGHT && H1 + H2 > 0 && totalRectHeightForGears > 0) {
      H1 = H2 = totalRectHeightForGears / 2;
    } else if (H1 < MIN_RECT_HEIGHT) {
      H1 = MIN_RECT_HEIGHT;
      H2 = Math.max(MIN_RECT_HEIGHT, totalRectHeightForGears - H1);
    } else if (H2 < MIN_RECT_HEIGHT) {
      H2 = MIN_RECT_HEIGHT;
      H1 = Math.max(MIN_RECT_HEIGHT, totalRectHeightForGears - H2);
    }
  }
  if (H1 <= 0 || H2 <= 0) {
    H1 = Math.max(MIN_RECT_HEIGHT, totalRectHeightForGears / 2);
    H2 = Math.max(MIN_RECT_HEIGHT, totalRectHeightForGears / 2);
  }

  const yRect1Top = fixedYShaft1Center - H1 / 2;
  const yRect2Top = fixedYShaft2Center - H2 / 2;

  const xRectStart = (width - RECT_WIDTH) / 2;
  const xRectCenter = xRectStart + RECT_WIDTH / 2;

  const crossSize = 6;
  const crossOffset = crossSize / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <g stroke={SHAFT_STROKE_COLOR} strokeWidth={SHAFT_STROKE_WIDTH} fill="none">
        <line x1={0} y1={fixedYShaft1Center} x2={width} y2={fixedYShaft1Center} />
        <line x1={0} y1={fixedYShaft2Center} x2={width} y2={fixedYShaft2Center} />
      </g>
      <g stroke={strokeColor} strokeWidth={RECT_STROKE_WIDTH} fill="none">
        <rect x={xRectStart} y={yRect1Top} width={RECT_WIDTH} height={H1} fill={GEAR_FILL_COLOR} />
        <line x1={xRectCenter - crossOffset} y1={fixedYShaft1Center - crossOffset} x2={xRectCenter + crossOffset} y2={fixedYShaft1Center + crossOffset} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} />
        <line x1={xRectCenter - crossOffset} y1={fixedYShaft1Center + crossOffset} x2={xRectCenter + crossOffset} y2={fixedYShaft1Center - crossOffset} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} />
        <rect x={xRectStart} y={yRect2Top} width={RECT_WIDTH} height={H2} fill={GEAR_FILL_COLOR} />
        <line x1={xRectCenter - crossOffset} y1={fixedYShaft2Center - crossOffset} x2={xRectCenter + crossOffset} y2={fixedYShaft2Center + crossOffset} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} />
        <line x1={xRectCenter - crossOffset} y1={fixedYShaft2Center + crossOffset} x2={xRectCenter + crossOffset} y2={fixedYShaft2Center - crossOffset} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} />
      </g>
    </svg>
  );
};
