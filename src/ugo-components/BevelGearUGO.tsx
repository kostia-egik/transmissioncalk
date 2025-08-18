
import React from 'react';
import { BevelGearConfigType, BevelGearPlacement } from '../types';

interface BevelGearUGOProps {
  width: number;
  height: number;
  z1: number;
  z2: number;
  config: BevelGearConfigType; 
  placement?: BevelGearPlacement;
}

export const BevelGearUGO: React.FC<BevelGearUGOProps> = ({
  width,
  height,
  z1,
  z2,
  config,
  placement = BevelGearPlacement.LeftBottom, // Оставлено для обратной совместимости, но не влияет на текст
}) => {
  const STROKE_COLOR = '#0F0F0F';
  const SHAFT_STROKE_WIDTH = 2;
  const LINE_SEGMENT_LENGTH = Math.min(width, height) * 0.18; 
  const LINE_SEGMENT_OFFSET = 0.45; 


  const centerX = width / 2;
  const centerY = height / 2;

  const ratio = z1 > 0 && z2 > 0 ? z1 / z2 : 1; 
  const minAngleRad = (15 * Math.PI) / 180;
  const maxAngleRad = (75 * Math.PI) / 180;
  let alpha = Math.atan(ratio);
  alpha = Math.max(minAngleRad, Math.min(alpha, maxAngleRad));

  const y_at_x0 = centerY + Math.tan(alpha) * centerX;
  const x_at_y_height = centerX - (height - centerY) / Math.tan(alpha);

  let x1_vec_start = 0;
  let y1_vec_start = y_at_x0;

  if (y_at_x0 > height) {
    x1_vec_start = x_at_y_height;
    y1_vec_start = height;
  }
  
  const totalDashLength = Math.sqrt(Math.pow(centerX - x1_vec_start, 2) + Math.pow(centerY - y1_vec_start, 2));
  const segmentMidpointDistance = totalDashLength * LINE_SEGMENT_OFFSET;
  
  const segmentVectorX = (centerX - x1_vec_start) / totalDashLength;
  const segmentVectorY = (centerY - y1_vec_start) / totalDashLength;

  const segmentMidpointX = x1_vec_start + segmentVectorX * segmentMidpointDistance;
  const segmentMidpointY = y1_vec_start + segmentVectorY * segmentMidpointDistance;
  
  const x1_solid_base = segmentMidpointX - segmentVectorX * (LINE_SEGMENT_LENGTH / 2);
  const y1_solid_base = segmentMidpointY - segmentVectorY * (LINE_SEGMENT_LENGTH / 2);
  const x2_solid_base = segmentMidpointX + segmentVectorX * (LINE_SEGMENT_LENGTH / 2);
  const y2_solid_base = segmentMidpointY + segmentVectorY * (LINE_SEGMENT_LENGTH / 2);

  const y1_refl_h_base = 2 * centerY - y1_solid_base;
  const y2_refl_h_base = 2 * centerY - y2_solid_base;
  const x1_refl_v_base = 2 * centerX - x1_solid_base;
  const x2_refl_v_base = 2 * centerX - x2_solid_base;
  
  const crossSize = 6;
  const crossOffset = crossSize / 2;

  let shaftH_x1, shaftH_y1, shaftH_x2, shaftH_y2;
  let shaftV_x1, shaftV_y1, shaftV_x2, shaftV_y2;
  let trapV_p, trapH_p; 
  let crossH_center, crossV_center;

  switch(config) {
    case BevelGearConfigType.Config2: // Схема в верхнем левом квадранте
      shaftH_x1 = 0; shaftH_y1 = centerY; shaftH_x2 = 2 * centerX - x1_solid_base; shaftH_y2 = centerY;
      shaftV_x1 = centerX; shaftV_y1 = height;  shaftV_x2 = centerX; shaftV_y2 = y1_solid_base;
      
      trapV_p = { p1: {x: 2*centerX-x1_solid_base, y: y1_solid_base}, p2: {x: 2*centerX-x2_solid_base, y: y2_solid_base}, p3: {x: 2*centerX-x2_solid_base, y: y2_refl_h_base}, p4: {x: 2*centerX-x1_solid_base, y: y1_refl_h_base}};
      trapH_p = { p1: {x: 2*centerX-x1_solid_base, y: y1_solid_base}, p2: {x: 2*centerX-x2_solid_base, y: y2_solid_base}, p3: {x: 2*centerX-x2_refl_v_base, y: y2_solid_base}, p4: {x: 2*centerX-x1_refl_v_base, y: y1_solid_base}};

      crossH_center = { x: 2*centerX-((x1_solid_base + x1_refl_v_base) / 2), y: (y1_solid_base + y2_solid_base) / 2 };
      crossV_center = { x: 2*centerX-((x1_solid_base + x2_solid_base) / 2), y: (y1_solid_base + y1_refl_h_base) / 2 };
      break;

    case BevelGearConfigType.Config3: // Схема в нижнем правом квадранте
      shaftH_x1 = 0; shaftH_y1 = centerY; shaftH_x2 = x1_solid_base; shaftH_y2 = centerY;
      shaftV_x1 = centerX; shaftV_y1 = height; shaftV_x2 = centerX; shaftV_y2 = 2 * centerY - y1_solid_base;

      trapV_p = { p1: {x: x1_solid_base, y: 2*centerY-y1_solid_base}, p2: {x: x2_solid_base, y: 2*centerY-y2_solid_base}, p3: {x: x2_solid_base, y: 2*centerY-y2_refl_h_base}, p4: {x: x1_solid_base, y: 2*centerY-y1_refl_h_base}};
      trapH_p = { p1: {x: x1_solid_base, y: 2*centerY-y1_solid_base}, p2: {x: x2_solid_base, y: 2*centerY-y2_solid_base}, p3: {x: x2_refl_v_base, y: 2*centerY-y2_solid_base}, p4: {x: x1_refl_v_base, y: 2*centerY-y1_solid_base}};
      
      crossH_center = { x: (x1_solid_base + x1_refl_v_base) / 2, y: 2*centerY-((y1_solid_base + y2_solid_base) / 2) };
      crossV_center = { x: (x1_solid_base + x2_solid_base) / 2, y: 2*centerY-((y1_solid_base + y1_refl_h_base) / 2) };
      break;

    default: // Config1: Базовая отрисовка для LeftBottom - вход слева, выход снизу
      shaftH_x1 = 0; shaftH_y1 = centerY; shaftH_x2 = x1_solid_base; shaftH_y2 = centerY;
      shaftV_x1 = centerX; shaftV_y1 = height; shaftV_x2 = centerX; shaftV_y2 = y1_solid_base;

      trapV_p = { p1: {x: x1_solid_base, y: y1_solid_base}, p2: {x: x2_solid_base, y: y2_solid_base}, p3: {x: x2_solid_base, y: y2_refl_h_base}, p4: {x: x1_solid_base, y: y1_refl_h_base}};
      trapH_p = { p1: {x: x1_solid_base, y: y1_solid_base}, p2: {x: x2_solid_base, y: y2_solid_base}, p3: {x: x2_refl_v_base, y: y2_solid_base}, p4: {x: x1_refl_v_base, y: y1_solid_base}};
      
      crossH_center = { x: (x1_solid_base + x1_refl_v_base) / 2, y: (y1_solid_base + y2_solid_base) / 2 };
      crossV_center = { x: (x1_solid_base + x2_solid_base) / 2, y: (y1_solid_base + y1_refl_h_base) / 2 };
      break;
  }
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <g stroke={STROKE_COLOR} strokeWidth={SHAFT_STROKE_WIDTH}>
        {/* Валы */}
        <line x1={shaftH_x1} y1={shaftH_y1} x2={shaftH_x2} y2={shaftH_y2} />
        <line x1={shaftV_x1} y1={shaftV_y1} x2={shaftV_x2} y2={shaftV_y2} />
        
        {/* Трапеция 1 (на вертикальном валу) */}
        <path d={`M ${trapV_p.p1.x},${trapV_p.p1.y} L ${trapV_p.p2.x},${trapV_p.p2.y} L ${trapV_p.p3.x},${trapV_p.p3.y} L ${trapV_p.p4.x},${trapV_p.p4.y} Z`} fill="white" />
        
        {/* Трапеция 2 (на горизонтальном валу) */}
        <path d={`M ${trapH_p.p1.x},${trapH_p.p1.y} L ${trapH_p.p2.x},${trapH_p.p2.y} L ${trapH_p.p3.x},${trapH_p.p3.y} L ${trapH_p.p4.x},${trapH_p.p4.y} Z`} fill="white" />

        {/* Крестики фиксации */}
        <line x1={crossH_center.x - crossOffset} y1={crossH_center.y - crossOffset} x2={crossH_center.x + crossOffset} y2={crossH_center.y + crossOffset} />
        <line x1={crossH_center.x - crossOffset} y1={crossH_center.y + crossOffset} x2={crossH_center.x + crossOffset} y2={crossH_center.y - crossOffset} />
        
        <line x1={crossV_center.x - crossOffset} y1={crossV_center.y - crossOffset} x2={crossV_center.x + crossOffset} y2={crossV_center.y + crossOffset} />
        <line x1={crossV_center.x - crossOffset} y1={crossV_center.y + crossOffset} x2={crossV_center.x + crossOffset} y2={crossV_center.y - crossOffset} />
      </g>
    </svg>
  );
};
