
import React from 'react';
import { WormGearConfigType } from '../types';
import { UGO_COAXIAL_TURNING_DIM, UGO_COAXIAL_TURNING_CENTER_XY } from './ugo-constants';

interface WormDriveUGOProps {
  width: number;
  height: number;
  z1: number; // Число заходов червяка
  z2: number; // Число зубьев колеса
  u: number;  // Передаточное число
  config: WormGearConfigType; // Червяк сверху / снизу
  cuttingDirection: 'left' | 'right'; // Направление нарезки червяка
}

export const WormDriveUGO: React.FC<WormDriveUGOProps> = ({
  width,
  height,
  z2,
  config,
  cuttingDirection,
}) => {
  const STROKE_COLOR = '#0F0F0F';
  const RECT_STROKE_WIDTH = 2;
  const SHAFT_STROKE_WIDTH = 2;
  const WHEEL_FILL_COLOR = 'white'; 

  // Используем константы для внутреннего пространства SVG, чтобы УГО был всегда одинаковым
  const effWidth = UGO_COAXIAL_TURNING_DIM;
  const effHeight = UGO_COAXIAL_TURNING_DIM;
  const centerX = UGO_COAXIAL_TURNING_CENTER_XY;
  const centerY = UGO_COAXIAL_TURNING_CENTER_XY;

  const wheelRectActualHeight = effHeight * 0.22;
  const z2Val = Number(z2) > 0 ? Number(z2) : 20;
  const z2MinForScale = 10;
  const z2MaxForScale = 100;
  let scaleRatio = (z2Val - z2MinForScale) / (z2MaxForScale - z2MinForScale);
  scaleRatio = Math.max(0, Math.min(1, scaleRatio)); 
  
  const wheelMinDiameter = effWidth * 0.45; 
  const wheelMaxDiameter = effWidth * 0.85; 
  const wheelRectActualWidth = wheelMinDiameter + scaleRatio * (wheelMaxDiameter - wheelMinDiameter);
  
  const wheelTopY = centerY - wheelRectActualHeight / 2;
  const wheelBottomY = centerY + wheelRectActualHeight / 2;
  const wheelLeftX = centerX - wheelRectActualWidth / 2;
  const wheelRightX = centerX + wheelRectActualWidth / 2;

  const WORM_DIAMETER_RATIO_OF_WHEEL_THICKNESS = 0.70;
  const WORM_LENGTH_RATIO_OF_EFFECTIVE_WIDTH = 0.35;  
  
  const wormLength = effWidth * WORM_LENGTH_RATIO_OF_EFFECTIVE_WIDTH;
  const wormDiameter = wheelRectActualHeight * WORM_DIAMETER_RATIO_OF_WHEEL_THICKNESS;
  
  const isWormHidden = config === WormGearConfigType.BottomApproach;
  const wormDashArray = isWormHidden ? "4 2" : "none";

  const scoopDepth = wheelRectActualHeight * 0.28; 
  const wheelPathD = `
    M ${wheelLeftX},${wheelTopY}
    L ${wheelRightX},${wheelTopY}
    Q ${wheelRightX - scoopDepth},${centerY} ${wheelRightX},${wheelBottomY}
    L ${wheelLeftX},${wheelBottomY}
    Q ${wheelLeftX + scoopDepth},${centerY} ${wheelLeftX},${wheelTopY}
    Z
  `;
  
  const wormShaftY = centerY;
  const wormBodyLeftX = centerX - wormLength / 2;
  const wormBodyRightX = centerX + wormLength / 2;
  
  const wormShaftSegments: {x1:number, y1:number, x2:number, y2:number, dash: string}[] = [];
  const wheelRegionForWormShaft_X1 = wheelLeftX;
  const wheelRegionForWormShaft_X2 = wheelRightX;

  if (isWormHidden) { 
    if (wheelRegionForWormShaft_X1 > 0) {
      wormShaftSegments.push({ x1: 0, y1: wormShaftY, x2: wheelRegionForWormShaft_X1, y2: wormShaftY, dash: "none" });
    }
    if (wormBodyLeftX > wheelRegionForWormShaft_X1) {
      wormShaftSegments.push({ x1: wheelRegionForWormShaft_X1, y1: wormShaftY, x2: wormBodyLeftX, y2: wormShaftY, dash: wormDashArray });
    }
    if (wheelRegionForWormShaft_X2 > wormBodyRightX) {
      wormShaftSegments.push({ x1: wormBodyRightX, y1: wormShaftY, x2: wheelRegionForWormShaft_X2, y2: wormShaftY, dash: wormDashArray });
    }
    if (effWidth > wheelRegionForWormShaft_X2) {
      wormShaftSegments.push({ x1: wheelRegionForWormShaft_X2, y1: wormShaftY, x2: effWidth, y2: wormShaftY, dash: "none" });
    }
  } else { 
    if (wormBodyLeftX > 0) {
      wormShaftSegments.push({ x1: 0, y1: wormShaftY, x2: wormBodyLeftX, y2: wormShaftY, dash: "none" });
    }
    if (effWidth > wormBodyRightX) {
      wormShaftSegments.push({ x1: wormBodyRightX, y1: wormShaftY, x2: effWidth, y2: wormShaftY, dash: "none" });
    }
  }

  const wormCuttingLines = [];
  const numCuttingLines = 3;
  const cuttingLineY1_internal = centerY - wormDiameter / 2; 
  const cuttingLineY2_internal = centerY + wormDiameter / 2;
  const cuttingLineTiltX = wormDiameter * 0.25; 

  const cuttingLinesRegionWidth = wormLength * 0.5; 
  const cuttingLinesRegionStartX = wormBodyLeftX + wormLength - cuttingLinesRegionWidth;

  for (let i = 0; i < numCuttingLines; i++) {
    const lineCenterX_internal = cuttingLinesRegionStartX + (cuttingLinesRegionWidth / (numCuttingLines + 1)) * (i + 1);
    let x1_cl, x2_cl; 
    if (cuttingDirection === 'left') {
      x1_cl = lineCenterX_internal + cuttingLineTiltX / 2;
      x2_cl = lineCenterX_internal - cuttingLineTiltX / 2;
    } else {
      x1_cl = lineCenterX_internal - cuttingLineTiltX / 2;
      x2_cl = lineCenterX_internal + cuttingLineTiltX / 2;
    }
    wormCuttingLines.push({ x1: x1_cl, y1: cuttingLineY1_internal, x2: x2_cl, y2: cuttingLineY2_internal });
  }

  const crossSize = 6;
  const crossCenterX_internal = wormBodyLeftX + wormLength * 0.25; 
  const crossCenterY_internal = wormShaftY;
  
  const crossLine1 = {
    x1: crossCenterX_internal - crossSize / 2, y1: crossCenterY_internal - crossSize / 2,
    x2: crossCenterX_internal + crossSize / 2, y2: crossCenterY_internal + crossSize / 2,
  };
  const crossLine2 = {
    x1: crossCenterX_internal - crossSize / 2, y1: crossCenterY_internal + crossSize / 2,
    x2: crossCenterX_internal + crossSize / 2, y2: crossCenterY_internal - crossSize / 2,
  };

  const geometryGroup = (
    <g stroke={STROKE_COLOR} strokeWidth={RECT_STROKE_WIDTH} fill="none">
      {/* Вал колеса */}
      <line x1={centerX} y1={0} x2={centerX} y2={wheelTopY} strokeWidth={SHAFT_STROKE_WIDTH}/>
      <line x1={centerX} y1={wheelBottomY} x2={centerX} y2={effHeight} strokeWidth={SHAFT_STROKE_WIDTH}/>
      
      {/* Колесо */}
      <path 
        d={wheelPathD}
        fill={WHEEL_FILL_COLOR}
        stroke={STROKE_COLOR}
        strokeWidth={RECT_STROKE_WIDTH}
      />

      {/* Вал червяка */}
      {wormShaftSegments.map((seg, idx) => (
        <line key={`worm-shaft-seg-${idx}`} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={STROKE_COLOR} strokeWidth={SHAFT_STROKE_WIDTH} strokeDasharray={seg.dash} />
      ))}
      
      {/* Тело червяка */}
      <rect 
        x={wormBodyLeftX}
        y={centerY - wormDiameter / 2}
        width={wormLength}
        height={wormDiameter}
        fill="none"
        stroke={STROKE_COLOR}
        strokeWidth={RECT_STROKE_WIDTH}
        strokeDasharray={wormDashArray}
      />

      {/* Линии нарезки */}
      {wormCuttingLines.map((line, idx) => (
        <line 
          key={`cutting-line-${idx}`} 
          x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} 
          stroke={STROKE_COLOR} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} strokeDasharray={wormDashArray} 
        />
      ))}

      {/* Крест фиксации */}
      <line 
        x1={crossLine1.x1} y1={crossLine1.y1} x2={crossLine1.x2} y2={crossLine1.y2} 
        stroke={STROKE_COLOR} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} strokeDasharray={wormDashArray} 
      />
      <line 
        x1={crossLine2.x1} y1={crossLine2.y1} x2={crossLine2.x2} y2={crossLine2.y2} 
        stroke={STROKE_COLOR} strokeWidth={SHAFT_STROKE_WIDTH * 0.8} strokeDasharray={wormDashArray} 
      />
    </g>
  );

  return (
    <svg width={width} height={height} viewBox={`0 0 ${effWidth} ${effHeight}`} xmlns="http://www.w3.org/2000/svg">
      {geometryGroup}
    </svg>
  );
};
