

import React from 'react';
import { PlanetaryGearConfigType } from '../types';

interface PlanetaryGearUGOProps {
  width: number;
  height: number;
  zSun: number;
  zPlanet: number;
  configType: PlanetaryGearConfigType;
  mirrored?: boolean;
}

export const PlanetaryGearUGO: React.FC<PlanetaryGearUGOProps> = ({
  width,
  height,
  zSun,
  zPlanet,
  configType,
  mirrored = false,
}) => {
  const STROKE_COLOR = '#0F0F0F';
  const RECT_STROKE_WIDTH = 2;
  const SHAFT_STROKE_WIDTH = 2;
  const FILL_COLOR = 'white';
  const HATCH_PATTERN_ID = `planetary-hatch-${width}-${height}-${configType}`;

  const effWidth = width;
  const effHeight = height;

  // --- 1. Определение констант и размеров ---
  const gearWidth = effWidth * 0.20;
  const gearX = (effWidth - gearWidth) / 2;

  const ringSegmentHeight = effHeight * 0.05;
  const paddingY = effHeight * 0.05;
  const centerY = effHeight / 2;
  const SHAFT_GEAR_GAP = 5;

  const HORIZONTAL_END_PADDING = 10;
  const RADIAL_SHAFT_CLEARANCE = 4;
  
  // --- 2. Расчет пропорциональных высот Солнца и Сателлита ---
  const availableHeight = centerY - paddingY - ringSegmentHeight;
  const zSunVal = zSun > 0 ? zSun : 1;
  const zPlanetVal = zPlanet > 0 ? zPlanet : 1;
  let satelliteHeight = availableHeight / (1 + zSunVal / (2 * zPlanetVal));
  let sunHeight = satelliteHeight * (zSunVal / zPlanetVal);

  const minHeight = 5;
  if (sunHeight < minHeight || satelliteHeight < minHeight) {
    if (sunHeight < minHeight) {
        sunHeight = minHeight;
        satelliteHeight = availableHeight - (sunHeight / 2);
    }
    if (satelliteHeight < minHeight) {
        satelliteHeight = minHeight;
        sunHeight = 2 * (availableHeight - satelliteHeight);
    }
    if (sunHeight < minHeight) sunHeight = minHeight;
  }
   if (sunHeight <= 0) sunHeight = minHeight;
   if (satelliteHeight <= 0) satelliteHeight = minHeight;

  // --- 3. Расчет координат ---
  const topRingY = paddingY;
  const bottomRingY = effHeight - paddingY - ringSegmentHeight;
  const sunY = centerY - sunHeight / 2;
  const satelliteY = topRingY + ringSegmentHeight;
  const satelliteCenterY = satelliteY + satelliteHeight / 2;

  const sunCenterX = gearX + gearWidth / 2;
  const sunCenterY = sunY + sunHeight / 2;
  const crossSize = 6;
  
  const satelliteCenterX = gearX + gearWidth / 2;
  const lineLength = crossSize;

  // --- 4. Рендеринг в зависимости от типа конфигурации ---
  let mainGeometry: React.ReactNode = null;

  if (configType === PlanetaryGearConfigType.FixedRing) {
    const housingArmOffset = 15;
    const HATCH_THICKNESS = 8; 

    const topArmPath = `M ${gearX},${topRingY} L ${gearX - housingArmOffset},${topRingY} L ${gearX - housingArmOffset},${centerY - RADIAL_SHAFT_CLEARANCE} L ${HORIZONTAL_END_PADDING},${centerY - RADIAL_SHAFT_CLEARANCE}`;
    const bottomArmPath = `M ${gearX},${bottomRingY + ringSegmentHeight} L ${gearX - housingArmOffset},${bottomRingY + ringSegmentHeight} L ${gearX - housingArmOffset},${centerY + RADIAL_SHAFT_CLEARANCE} L ${HORIZONTAL_END_PADDING},${centerY + RADIAL_SHAFT_CLEARANCE}`;
    
    const topHatchPathD = `M ${gearX + gearWidth}, ${topRingY - HATCH_THICKNESS} L ${gearX - housingArmOffset - HATCH_THICKNESS}, ${topRingY - HATCH_THICKNESS} L ${gearX - housingArmOffset - HATCH_THICKNESS}, ${centerY - RADIAL_SHAFT_CLEARANCE - HATCH_THICKNESS} L ${HORIZONTAL_END_PADDING}, ${centerY - RADIAL_SHAFT_CLEARANCE - HATCH_THICKNESS} L ${HORIZONTAL_END_PADDING}, ${centerY - RADIAL_SHAFT_CLEARANCE} L ${gearX - housingArmOffset}, ${centerY - RADIAL_SHAFT_CLEARANCE} L ${gearX - housingArmOffset}, ${topRingY} L ${gearX + gearWidth}, ${topRingY} Z`;
    const bottomHatchPathD = `M ${gearX + gearWidth}, ${bottomRingY + ringSegmentHeight + HATCH_THICKNESS} L ${gearX - housingArmOffset - HATCH_THICKNESS}, ${bottomRingY + ringSegmentHeight + HATCH_THICKNESS} L ${gearX - housingArmOffset - HATCH_THICKNESS}, ${centerY + RADIAL_SHAFT_CLEARANCE + HATCH_THICKNESS} L ${HORIZONTAL_END_PADDING}, ${centerY + RADIAL_SHAFT_CLEARANCE + HATCH_THICKNESS} L ${HORIZONTAL_END_PADDING}, ${centerY + RADIAL_SHAFT_CLEARANCE} L ${gearX - housingArmOffset}, ${centerY + RADIAL_SHAFT_CLEARANCE} L ${gearX - housingArmOffset}, ${bottomRingY + ringSegmentHeight} L ${gearX + gearWidth}, ${bottomRingY + ringSegmentHeight} Z`;

    const carrierPathMirrored = `M ${gearX},${satelliteCenterY} H ${gearX - SHAFT_GEAR_GAP} V ${centerY} H 0`;
    const carrierPathNonMirrored = `M ${gearX + gearWidth},${satelliteCenterY} H ${gearX + gearWidth + SHAFT_GEAR_GAP} V ${centerY} H ${effWidth}`;

    mainGeometry = (
      <>
        <path d={topHatchPathD} fill={`url(#${HATCH_PATTERN_ID})`} stroke="none" />
        <path d={bottomHatchPathD} fill={`url(#${HATCH_PATTERN_ID})`} stroke="none" />
        <g stroke={STROKE_COLOR} strokeWidth={RECT_STROKE_WIDTH} fill={FILL_COLOR}>
          <path d={topArmPath} fill="none"/>
          <path d={bottomArmPath} fill="none"/>
          {mirrored ? (
            <>
              <line x1={gearX + gearWidth} y1={centerY} x2={effWidth} y2={centerY} />
              <path d={carrierPathMirrored} fill="none" />
            </>
          ) : (
            <>
              <line x1={0} y1={centerY} x2={gearX} y2={centerY} />
              <path d={carrierPathNonMirrored} fill="none" />
            </>
          )}
           {mirrored ? (
            <line x1={gearX + gearWidth} y1={satelliteCenterY} x2={gearX + gearWidth + SHAFT_GEAR_GAP} y2={satelliteCenterY} fill="none" />
          ) : (
            <line x1={gearX} y1={satelliteCenterY} x2={gearX - SHAFT_GEAR_GAP} y2={satelliteCenterY} fill="none" />
          )}
        </g>
      </>
    );

  } else if (configType === PlanetaryGearConfigType.FixedCarrier) {
    const housingArmOffset = 15;
    const HATCH_THICKNESS = 8;
    const topArmY = topRingY + ringSegmentHeight / 2;
    const bottomArmY = bottomRingY + ringSegmentHeight / 2;

    if (mirrored) {
      const carrierHousingConnectionPath = `M ${gearX + gearWidth},${satelliteCenterY} L ${gearX + gearWidth + housingArmOffset},${satelliteCenterY}`;
      const topHousingPath = `M ${gearX + gearWidth + housingArmOffset},${topRingY} L ${gearX + gearWidth + housingArmOffset},${centerY - RADIAL_SHAFT_CLEARANCE} L ${effWidth - HORIZONTAL_END_PADDING},${centerY - RADIAL_SHAFT_CLEARANCE}`;
      const bottomHousingPath = `M ${gearX + gearWidth + housingArmOffset},${bottomRingY + ringSegmentHeight} L ${gearX + gearWidth + housingArmOffset},${centerY + RADIAL_SHAFT_CLEARANCE} L ${effWidth - HORIZONTAL_END_PADDING},${centerY + RADIAL_SHAFT_CLEARANCE}`;
      const topHatchPathD = `M ${gearX + gearWidth + housingArmOffset},${topRingY} L ${gearX + gearWidth + housingArmOffset + HATCH_THICKNESS},${topRingY} L ${gearX + gearWidth + housingArmOffset + HATCH_THICKNESS},${centerY - RADIAL_SHAFT_CLEARANCE - HATCH_THICKNESS} L ${effWidth - HORIZONTAL_END_PADDING},${centerY - RADIAL_SHAFT_CLEARANCE - HATCH_THICKNESS} L ${effWidth - HORIZONTAL_END_PADDING},${centerY - RADIAL_SHAFT_CLEARANCE} L ${gearX + gearWidth + housingArmOffset},${centerY - RADIAL_SHAFT_CLEARANCE} Z`;
      const bottomHatchPathD = `M ${gearX + gearWidth + housingArmOffset},${bottomRingY + ringSegmentHeight} L ${gearX + gearWidth + housingArmOffset + HATCH_THICKNESS},${bottomRingY + ringSegmentHeight} L ${gearX + gearWidth + housingArmOffset + HATCH_THICKNESS},${centerY + RADIAL_SHAFT_CLEARANCE + HATCH_THICKNESS} L ${effWidth - HORIZONTAL_END_PADDING},${centerY + RADIAL_SHAFT_CLEARANCE + HATCH_THICKNESS} L ${effWidth - HORIZONTAL_END_PADDING},${centerY + RADIAL_SHAFT_CLEARANCE} L ${gearX + gearWidth + housingArmOffset},${centerY + RADIAL_SHAFT_CLEARANCE} Z`;
      const outputShaftX_L = gearX - SHAFT_GEAR_GAP * 2;
      const outputBracket_L = `M ${gearX}, ${topArmY} H ${outputShaftX_L} V ${bottomArmY} H ${gearX}`;
      mainGeometry = (
        <>
          <path d={topHatchPathD} fill={`url(#${HATCH_PATTERN_ID})`} stroke="none" />
          <path d={bottomHatchPathD} fill={`url(#${HATCH_PATTERN_ID})`} stroke="none" />
          <g stroke={STROKE_COLOR} strokeWidth={RECT_STROKE_WIDTH} fill="none">
            <path d={topHousingPath} />
            <path d={bottomHousingPath} />
            <path d={carrierHousingConnectionPath} />
            <line x1={gearX} y1={satelliteCenterY} x2={gearX - SHAFT_GEAR_GAP} y2={satelliteCenterY} />
            <path d={outputBracket_L} />
            <line x1={outputShaftX_L} y1={centerY} x2={0} y2={centerY} />
            <line x1={gearX + gearWidth} y1={centerY} x2={effWidth} y2={centerY} />
          </g>
        </>
      );
    } else {
      const carrierHousingConnectionPath = `M ${gearX},${satelliteCenterY} L ${gearX - housingArmOffset},${satelliteCenterY}`;
      const topHousingPath = `M ${gearX - housingArmOffset},${topRingY} L ${gearX - housingArmOffset},${centerY - RADIAL_SHAFT_CLEARANCE} L ${HORIZONTAL_END_PADDING},${centerY - RADIAL_SHAFT_CLEARANCE}`;
      const bottomHousingPath = `M ${gearX - housingArmOffset},${bottomRingY + ringSegmentHeight} L ${gearX - housingArmOffset},${centerY + RADIAL_SHAFT_CLEARANCE} L ${HORIZONTAL_END_PADDING},${centerY + RADIAL_SHAFT_CLEARANCE}`;
      const topHatchPathD = `M ${gearX - housingArmOffset},${topRingY} L ${gearX - housingArmOffset - HATCH_THICKNESS},${topRingY} L ${gearX - housingArmOffset - HATCH_THICKNESS},${centerY - RADIAL_SHAFT_CLEARANCE - HATCH_THICKNESS} L ${HORIZONTAL_END_PADDING},${centerY - RADIAL_SHAFT_CLEARANCE - HATCH_THICKNESS} L ${HORIZONTAL_END_PADDING},${centerY - RADIAL_SHAFT_CLEARANCE} L ${gearX - housingArmOffset},${centerY - RADIAL_SHAFT_CLEARANCE} Z`;
      const bottomHatchPathD = `M ${gearX - housingArmOffset},${bottomRingY + ringSegmentHeight} L ${gearX - housingArmOffset - HATCH_THICKNESS},${bottomRingY + ringSegmentHeight} L ${gearX - housingArmOffset - HATCH_THICKNESS},${centerY + RADIAL_SHAFT_CLEARANCE + HATCH_THICKNESS} L ${HORIZONTAL_END_PADDING},${centerY + RADIAL_SHAFT_CLEARANCE + HATCH_THICKNESS} L ${HORIZONTAL_END_PADDING},${centerY + RADIAL_SHAFT_CLEARANCE} L ${gearX - housingArmOffset},${centerY + RADIAL_SHAFT_CLEARANCE} Z`;
      const outputShaftX_R = gearX + gearWidth + SHAFT_GEAR_GAP * 2;
      const outputBracket_R = `M ${gearX + gearWidth}, ${topArmY} H ${outputShaftX_R} V ${bottomArmY} H ${gearX + gearWidth}`;
      mainGeometry = (
        <>
          <path d={topHatchPathD} fill={`url(#${HATCH_PATTERN_ID})`} stroke="none" />
          <path d={bottomHatchPathD} fill={`url(#${HATCH_PATTERN_ID})`} stroke="none" />
          <g stroke={STROKE_COLOR} strokeWidth={RECT_STROKE_WIDTH} fill="none">
            <path d={topHousingPath} />
            <path d={bottomHousingPath} />
            <path d={carrierHousingConnectionPath} />
            <line x1={gearX + gearWidth} y1={satelliteCenterY} x2={gearX + gearWidth + SHAFT_GEAR_GAP} y2={satelliteCenterY} />
            <line x1={0} y1={centerY} x2={gearX} y2={centerY} />
            <path d={outputBracket_R} />
            <line x1={outputShaftX_R} y1={centerY} x2={effWidth} y2={centerY} />
          </g>
        </>
      );
    }
  } else if (configType === PlanetaryGearConfigType.FixedSun) {
    const housingWidth = 10;
    const housingHeight = effHeight * 0.4;
    const housingY = sunCenterY - housingHeight / 2;

    if (mirrored) {
        const HOUSING_SUN_GAP = 4;
        const LOCAL_C_BRACKET_GAP = 2;
        const housingXM = gearX + gearWidth + HOUSING_SUN_GAP;
        const inputShaftX_R = housingXM + housingWidth + LOCAL_C_BRACKET_GAP;
        const inputBracket_R = `M ${gearX + gearWidth}, ${topRingY + ringSegmentHeight/2} H ${inputShaftX_R} V ${bottomRingY + ringSegmentHeight/2} H ${gearX + gearWidth}`;
        const outputShaft_L_d = `M ${gearX},${satelliteCenterY} H ${gearX - SHAFT_GEAR_GAP} V ${centerY} H 0`;
        
        mainGeometry = (
          <g stroke={STROKE_COLOR} strokeWidth={RECT_STROKE_WIDTH} fill="none">
            <rect x={housingXM} y={housingY} width={housingWidth} height={housingHeight} fill={`url(#${HATCH_PATTERN_ID})`} stroke="none" />
            <line x1={housingXM} y1={housingY} x2={housingXM} y2={housingY + housingHeight} stroke={STROKE_COLOR} strokeWidth={RECT_STROKE_WIDTH} />
            <line x1={housingXM} y1={sunCenterY} x2={gearX + gearWidth} y2={sunCenterY} />
            <path d={inputBracket_R} />
            <line x1={inputShaftX_R} y1={centerY} x2={effWidth} y2={centerY} />
            <path d={outputShaft_L_d} />
            <line x1={gearX + gearWidth} y1={satelliteCenterY} x2={gearX + gearWidth + SHAFT_GEAR_GAP} y2={satelliteCenterY} />
          </g>
        );
    } else {
        const HOUSING_SUN_GAP = 4;
        const LOCAL_C_BRACKET_GAP = 2;
        const housingX = gearX - housingWidth - HOUSING_SUN_GAP;
        const inputShaftX_L = housingX - LOCAL_C_BRACKET_GAP;
        const inputBracket_L = `M ${gearX}, ${topRingY + ringSegmentHeight/2} H ${inputShaftX_L} V ${bottomRingY + ringSegmentHeight/2} H ${gearX}`;
        const outputShaft_R_d = `M ${gearX + gearWidth},${satelliteCenterY} H ${gearX + gearWidth + SHAFT_GEAR_GAP} V ${centerY} H ${effWidth}`;
        mainGeometry = (
          <g stroke={STROKE_COLOR} strokeWidth={RECT_STROKE_WIDTH} fill="none">
            <rect x={housingX} y={housingY} width={housingWidth} height={housingHeight} fill={`url(#${HATCH_PATTERN_ID})`} stroke="none" />
            <line x1={housingX + housingWidth} y1={housingY} x2={housingX + housingWidth} y2={housingY + housingHeight} stroke={STROKE_COLOR} strokeWidth={RECT_STROKE_WIDTH}/>
            <line x1={housingX + housingWidth} y1={sunCenterY} x2={gearX} y2={sunCenterY} />
            <path d={inputBracket_L} />
            <line x1={0} y1={centerY} x2={inputShaftX_L} y2={centerY} />
            <path d={outputShaft_R_d} />
            <line x1={gearX} y1={satelliteCenterY} x2={gearX - SHAFT_GEAR_GAP} y2={satelliteCenterY} />
          </g>
        );
    }
  }


  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={HATCH_PATTERN_ID} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={STROKE_COLOR} strokeWidth="1" />
        </pattern>
      </defs>

      <g>
          {mainGeometry}
          {/* Шестерни (рисуются поверх всего остального) */}
          <g stroke={STROKE_COLOR} strokeWidth={RECT_STROKE_WIDTH} fill={FILL_COLOR}>
            <rect x={gearX} y={sunY} width={gearWidth} height={sunHeight} />
            <rect x={gearX} y={satelliteY} width={gearWidth} height={satelliteHeight} />
            <rect x={gearX} y={topRingY} width={gearWidth} height={ringSegmentHeight} />
            <rect x={gearX} y={bottomRingY} width={gearWidth} height={ringSegmentHeight} />
            
            <g strokeWidth={SHAFT_STROKE_WIDTH * 0.8}>
                <line x1={sunCenterX - crossSize / 2} y1={sunCenterY - crossSize / 2} x2={sunCenterX + crossSize / 2} y2={sunCenterY + crossSize / 2} />
                <line x1={sunCenterX - crossSize / 2} y1={sunCenterY + crossSize / 2} x2={sunCenterX + crossSize / 2} y2={sunCenterY - crossSize / 2} />
                <line x1={satelliteCenterX - lineLength / 2} y1={satelliteCenterY} x2={satelliteCenterX + lineLength / 2} y2={satelliteCenterY} />
            </g>
          </g>
      </g>
    </svg>
  );
};