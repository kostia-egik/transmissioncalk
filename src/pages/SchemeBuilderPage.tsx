import React, { useState, useLayoutEffect, useRef, useCallback, useEffect, forwardRef } from 'react';
import { EngineParams, ModuleCalculationData, StageCalculationData, GearType, WormGearConfigType, PowerSourceDirection, ParallelLayoutType, BevelGearConfigType, BevelGearPlacement, PlanetaryShaftType, PlanetaryGearConfigType, PlanetaryInputParams, SchemeElement, SpacerShaft, SpacerStyle, RotationDirection, ShaftOrientation } from '../types';
import { PowerSourceUGO } from '../ugo-components/PowerSourceUGO';
import { CylindricalGearUGO } from '../ugo-components/CylindricalGearUGO';
import { BeltDriveUGO } from '../ugo-components/BeltDriveUGO';
import { ToothedBeltDriveUGO } from '../ugo-components/ToothedBeltDriveUGO';
import { ChainDriveUGO } from '../ugo-components/ChainDriveUGO';
import { PlanetaryGearUGO } from '../ugo-components/PlanetaryGearUGO';
import { WormDriveUGO } from '../ugo-components/WormDriveUGO';
import { BevelGearUGO } from '../ugo-components/BevelGearUGO';
import { BearingUGO } from '../ugo-components/BearingUGO';
import { CardanShaftUGO, JOINT_UGO_WIDTH, JOINT_UGO_HEIGHT as CARDAN_UGO_HEIGHT } from '../ugo-components/CardanShaftUGO';
import { UGO_PARALLEL_WIDTH, UGO_PARALLEL_HEIGHT, UGO_PARALLEL_SHAFT_Y1, UGO_PARALLEL_SHAFT_Y2, UGO_PARALLEL_SHAFT_DISTANCE, UGO_COAXIAL_TURNING_DIM, UGO_COAXIAL_TURNING_CENTER_XY } from '../ugo-components/ugo-constants';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import ZoomControls from '../components/ZoomControls';
import { UgoContextMenu } from '../components/UgoContextMenu';
import { InfoModal } from '../components/InfoModal';
import { PlanetaryConfig } from '../types';
import { ProjectActionsModal } from '../components/ProjectActionsModal';
import { FolderIcon } from '../assets/icons/FolderIcon';
import { InfoIcon } from '../assets/icons/InfoIcon';

// --- Начало Констант для Отрисовки ---
const SVG_PADDING = 50;
const CALLOUT_COLOR = '#475569'; // slate-600
const CALLOUT_FONT_SIZE = 11;
const CALLOUT_ELBOW_LENGTH = 20;
const CALLOUT_TEXT_HEIGHT = 12; 
const CALLOUT_TEXT_Y_OFFSET = 4;
const BEARING_UGO_WIDTH = 12;
const BEARING_UGO_HEIGHT = 20;
const AUTO_SPACER_LENGTH = 20; // Длина авто-вставляемого вала-проставки
const INACTIVE_UGO_COLOR = '#A0AEC0'; // Tailwind gray-400
// --- Конец Констант для Отрисовки ---

// --- Типы и хелперы для системы сносок ---
type Bbox = { x: number; y: number; width: number; height: number; ownerId?: string };
type Point = { x: number; y: number };

type UgoTransform = {
    translateX: number;
    translateY: number;
    rotation: number;
    internalOffsetY: number; 
    rotationCenterX: number; 
    rotationCenterY: number; 
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
};

type UgoDataForCallout = {
    id: string;
    transform: UgoTransform;
    bbox: Bbox;
    type: GearType | 'Источник';
    u: number;
    inputs: any;
    flowDirection: 'right' | 'left' | 'up' | 'down';
};

type Terminal = {
    id: string;
    point: Point;
    orientation: 'horizontal-shaft' | 'vertical-shaft';
    isConnectionPoint: boolean; // Является ли клемма точкой входа/выхода ступени
};

const getUgoSubBboxes = (type: GearType | 'Источник' | 'spacer', inputs: any): Bbox[] => {
    switch (type) {
        case GearType.Gear:
        case GearType.Chain:
        case GearType.ToothedBelt:
        case GearType.Belt: {
            const RECT_WIDTH = Math.max(12, UGO_PARALLEL_WIDTH * 0.40);
            const xRectStart = (UGO_PARALLEL_WIDTH - RECT_WIDTH) / 2;
            let totalRectHeight, H1, H2;
            if (type === GearType.Gear) totalRectHeight = UGO_PARALLEL_SHAFT_DISTANCE * 2;
            else { const PULLEY_VERTICAL_GAP = Math.max(4, UGO_PARALLEL_HEIGHT * 0.08); totalRectHeight = 2 * (UGO_PARALLEL_SHAFT_DISTANCE - PULLEY_VERTICAL_GAP); }
            const z1 = Number(inputs.z1) || Number(inputs.d1) || 1; const z2 = Number(inputs.z2) || Number(inputs.d2) || 1;
            const MIN_RECT_HEIGHT = Math.max(8, totalRectHeight * 0.15);
            if (totalRectHeight <= 2 * MIN_RECT_HEIGHT) H1 = H2 = Math.max(MIN_RECT_HEIGHT, totalRectHeight / 2);
            else if (z1 === z2) H1 = H2 = totalRectHeight / 2;
            else { const total = z1 + z2; H1 = (z1 / total) * totalRectHeight; H2 = (z2 / total) * totalRectHeight; if (H1 < MIN_RECT_HEIGHT) { H1 = MIN_RECT_HEIGHT; H2 = totalRectHeight - H1; } else if (H2 < MIN_RECT_HEIGHT) { H2 = MIN_RECT_HEIGHT; H1 = totalRectHeight - H2; } }
            const yRect1Top = UGO_PARALLEL_SHAFT_Y1 - H1 / 2; const yRect2Top = UGO_PARALLEL_SHAFT_Y2 - H2 / 2;
            const subBboxes = [{ x: xRectStart, y: yRect1Top, width: RECT_WIDTH, height: H1 }, { x: xRectStart, y: yRect2Top, width: RECT_WIDTH, height: H2 }];
            if(type === GearType.Belt || type === GearType.ToothedBelt) { const beltRectWidth = RECT_WIDTH * 0.7; const beltRectX = xRectStart + (RECT_WIDTH - beltRectWidth) / 2; subBboxes.push({ x: beltRectX, y: yRect1Top, width: beltRectWidth, height: (yRect2Top + H2) - yRect1Top }); }
            if(type === GearType.Chain) { const xRectCenter = xRectStart + RECT_WIDTH / 2; subBboxes.push({ x: xRectCenter - 1, y: yRect1Top, width: 2, height: (yRect2Top + H2) - yRect1Top }); }
            return subBboxes;
        }
        case GearType.Worm: {
            const z2Val = Number(inputs.z2) || 20; const scaleRatio = Math.max(0, Math.min(1, (z2Val - 10) / 90)); const wheelWidth = (UGO_COAXIAL_TURNING_DIM * 0.50) + scaleRatio * (UGO_COAXIAL_TURNING_DIM * 0.40); const wheelHeight = UGO_COAXIAL_TURNING_DIM * 0.22; const wormLength = UGO_COAXIAL_TURNING_DIM * 0.35; const wormDiameter = wheelHeight * 0.70; const centerX = UGO_COAXIAL_TURNING_CENTER_XY; const centerY = UGO_COAXIAL_TURNING_CENTER_XY;
            return [{ x: centerX - wheelWidth / 2, y: centerY - wheelHeight / 2, width: wheelWidth, height: wheelHeight }, { x: centerX - wormLength / 2, y: centerY - wormDiameter / 2, width: wormLength, height: wormDiameter }];
        }
        case GearType.Bevel: {
            const { width, height, z1, z2, config } = { width: UGO_COAXIAL_TURNING_DIM, height: UGO_COAXIAL_TURNING_DIM, z1: Number(inputs.z1) || 1, z2: Number(inputs.z2) || 1, config: inputs.config }; const centerX=width/2, centerY=height/2, ratio=z1/z2, alpha=Math.max(15*Math.PI/180, Math.min(Math.atan(ratio), 75*Math.PI/180)); const y_at_x0=centerY+Math.tan(alpha)*centerX, x_at_y_height=centerX-(height-centerY)/Math.tan(alpha); let x1_vec_start=0, y1_vec_start=y_at_x0; if(y_at_x0>height){x1_vec_start=x_at_y_height;y1_vec_start=height;} const totalDashLength=Math.hypot(centerX-x1_vec_start, centerY-y1_vec_start), segmentMidpointDistance=totalDashLength*0.45; const segmentVectorX=(centerX-x1_vec_start)/totalDashLength, segmentVectorY=(centerY-y1_vec_start)/totalDashLength; const segmentMidpointX=x1_vec_start+segmentVectorX*segmentMidpointDistance, segmentMidpointY=y1_vec_start+segmentVectorY*segmentMidpointDistance; const LINE_SEGMENT_LENGTH=Math.min(width,height)*0.18; const x1b=segmentMidpointX-segmentVectorX*(LINE_SEGMENT_LENGTH/2), y1b=segmentMidpointY-segmentVectorY*(LINE_SEGMENT_LENGTH/2); const x2b=segmentMidpointX+segmentVectorX*(LINE_SEGMENT_LENGTH/2), y2b=segmentMidpointY+segmentVectorY*(LINE_SEGMENT_LENGTH/2); const y1rh=2*centerY-y1b, y2rh=2*centerY-y2b, x1rv=2*centerX-x1b, x2rv=2*centerX-x2b; let trapV_p:any, trapH_p:any;
            switch(config){case BevelGearConfigType.Config2:trapV_p={p1:{x:x1rv,y:y1b},p2:{x:x2rv,y:y2b},p3:{x:x2rv,y:y2rh},p4:{x:x1rv,y:y1rh}};trapH_p={p1:{x:x1rv,y:y1b},p2:{x:x2rv,y:y2b},p3:{x:2*centerX-x2rv,y:y2b},p4:{x:2*centerX-x1rv,y:y1b}};break; case BevelGearConfigType.Config3:trapV_p={p1:{x:x1b,y:y1rh},p2:{x:x2b,y:y2rh},p3:{x:x2b,y:2*centerY-y2rh},p4:{x:x1b,y:2*centerY-y1rh}};trapH_p={p1:{x:x1b,y:y1rh},p2:{x:x2b,y:y2rh},p3:{x:x2rv,y:y2rh},p4:{x:x1rv,y:y1rh}};break; default:trapV_p={p1:{x:x1b,y:y1b},p2:{x:x2b,y:y2b},p3:{x:x2b,y:y2rh},p4:{x:x1b,y:y1rh}};trapH_p={p1:{x:x1b,y:y1b},p2:{x:x2b,y:y2b},p3:{x:x2rv,y:y2b},p4:{x:x1rv,y:y1b}};break;}
            const getBboxFromPoints = (points: Point[]) => { const xs=points.map(p=>p.x), ys=points.map(p=>p.y); const minX=Math.min(...xs), minY=Math.min(...ys), maxX=Math.max(...xs), maxY=Math.max(...ys); return {x:minX, y:minY, width:maxX-minX, height:maxY-minY};};
            return [ getBboxFromPoints(Object.values(trapV_p)), getBboxFromPoints(Object.values(trapH_p)) ];
        }
        case GearType.Planetary: {
            const width=UGO_COAXIAL_TURNING_DIM, height=UGO_COAXIAL_TURNING_DIM; const gearWidth=width*0.2, gearX=(width-gearWidth)/2, ringSegmentHeight=height*0.05, paddingY=height*0.05, centerY=height/2; const availableHeight=centerY-paddingY-ringSegmentHeight; const zSunVal=Number(inputs.zSun)||1; const zPlanetVal=Number(inputs.zPlanet as number)||1; let satelliteHeight=availableHeight/(1+zSunVal/(2*zPlanetVal)), sunHeight=satelliteHeight*(zSunVal/zPlanetVal); const minH=5; if(sunHeight<minH||satelliteHeight<minH){if(sunHeight<minH){sunHeight=minH;satelliteHeight=availableHeight-sunHeight/2;} if(satelliteHeight<minH){satelliteHeight=minH;sunHeight=2*(availableHeight-satelliteHeight);} if(sunHeight<minH)sunHeight=minH;} const topRingY=paddingY, bottomRingY=height-paddingY-ringSegmentHeight, sunY=centerY-sunHeight/2, satelliteY=topRingY+ringSegmentHeight;
            return [{x:gearX,y:sunY,width:gearWidth,height:sunHeight},{x:gearX,y:satelliteY,width:gearWidth,height:satelliteHeight},{x:gearX,y:topRingY,width:gearWidth,height:ringSegmentHeight},{x:gearX,y:bottomRingY,width:gearWidth,height:ringSegmentHeight}];
        }
        case 'Источник': { const width=80, height=80, centerX=width/2, centerY=height/2, radius=Math.min(width,height)*0.35; return [{ x: centerX-radius, y: centerY-radius, width: radius*2, height: radius*2 }]; }
        default: return [];
    }
};
const transformLocalBboxToGlobal = (localBbox: Bbox, transform: UgoTransform): Bbox => {
    const corners = [{ x: localBbox.x, y: localBbox.y }, { x: localBbox.x + localBbox.width, y: localBbox.y }, { x: localBbox.x + localBbox.width, y: localBbox.y + localBbox.height }, { x: localBbox.x, y: localBbox.y + localBbox.height },];
    const globalCorners = corners.map(p => transformLocalPointToGlobal(p, transform));
    const minX = Math.min(...globalCorners.map(p => p.x)); const minY = Math.min(...globalCorners.map(p => p.y)); const maxX = Math.max(...globalCorners.map(p => p.x)); const maxY = Math.max(...globalCorners.map(p => p.y));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};
const getUgoAnchorCandidates = (type: GearType | 'Источник', inputs: any, transform: UgoTransform): Point[] => {
    switch (type) {
        case GearType.Gear: case GearType.Chain: case GearType.ToothedBelt: case GearType.Belt: {
            const RECT_WIDTH = Math.max(12, UGO_PARALLEL_WIDTH * 0.40); const xLeft = (UGO_PARALLEL_WIDTH - RECT_WIDTH) / 2; const xRight = xLeft + RECT_WIDTH; let totalRectHeight;
            if (type === GearType.Gear) { totalRectHeight = UGO_PARALLEL_SHAFT_DISTANCE * 2; } else { const PULLEY_VERTICAL_GAP = Math.max(4, UGO_PARALLEL_HEIGHT * 0.08); totalRectHeight = 2 * (UGO_PARALLEL_SHAFT_DISTANCE - PULLEY_VERTICAL_GAP); }
            const z1 = Number(inputs.z1) || Number(inputs.d1) || 1; const z2 = Number(inputs.z2) || Number(inputs.d2) || 1; let H1, H2; const MIN_RECT_HEIGHT = Math.max(8, totalRectHeight * 0.15);
            if (totalRectHeight <= 2 * MIN_RECT_HEIGHT) { H1 = H2 = Math.max(MIN_RECT_HEIGHT, totalRectHeight / 2); } else if (z1 === z2) { H1 = H2 = totalRectHeight / 2; } else { const total = z1 + z2; H1 = (z1 / total) * totalRectHeight; H2 = (z2 / total) * totalRectHeight; if (H1 < MIN_RECT_HEIGHT) { H1 = MIN_RECT_HEIGHT; H2 = totalRectHeight - H1; } else if (H2 < MIN_RECT_HEIGHT) { H2 = MIN_RECT_HEIGHT; H1 = totalRectHeight - H2; } }
            const yTop = UGO_PARALLEL_SHAFT_Y1 - H1 / 2; const yBottom = UGO_PARALLEL_SHAFT_Y2 + H2 / 2; return [{ x: xRight, y: yTop }, { x: xLeft, y: yTop }, { x: xRight, y: yBottom }, { x: xLeft, y: yBottom }];
        }
        case GearType.Worm: { const z2Val = Number(inputs.z2) || 20; const scaleRatio = Math.max(0, Math.min(1, (z2Val - 10) / (100 - 10))); const wheelWidth = (UGO_COAXIAL_TURNING_DIM * 0.45) + scaleRatio * (UGO_COAXIAL_TURNING_DIM * 0.40); const wheelHeight = UGO_COAXIAL_TURNING_DIM * 0.22; const xLeft = UGO_COAXIAL_TURNING_CENTER_XY - wheelWidth / 2; const xRight = UGO_COAXIAL_TURNING_CENTER_XY + wheelWidth / 2; const yTop = UGO_COAXIAL_TURNING_CENTER_XY - wheelHeight / 2; const yBottom = UGO_COAXIAL_TURNING_CENTER_XY + wheelHeight / 2; return [{ x: xRight, y: yTop }, { x: xLeft, y: yTop }, { x: xRight, y: yBottom }, { x: xLeft, y: yBottom }]; }
        case GearType.Bevel: {
            const { width, height, z1, z2, config } = { width: UGO_COAXIAL_TURNING_DIM, height: UGO_COAXIAL_TURNING_DIM, z1: Number(inputs.z1) || 1, z2: Number(inputs.z2) || 1, config: inputs.config }; const centerX=width/2, centerY=height/2, ratio=z1/z2, alpha=Math.max(15*Math.PI/180, Math.min(Math.atan(ratio), 75*Math.PI/180)); const y_at_x0=centerY+Math.tan(alpha)*centerX, x_at_y_height=centerX-(height-centerY)/Math.tan(alpha); let x1_vec_start=0, y1_vec_start=y_at_x0; if(y_at_x0>height){x1_vec_start=x_at_y_height;y1_vec_start=height;} const totalDashLength=Math.hypot(centerX-x1_vec_start, centerY-y1_vec_start), segmentMidpointDistance=totalDashLength*0.45; const segmentVectorX=(centerX-x1_vec_start)/totalDashLength, segmentVectorY=(centerY-y1_vec_start)/totalDashLength; const segmentMidpointX=x1_vec_start+segmentVectorX*segmentMidpointDistance, segmentMidpointY=y1_vec_start+segmentVectorY*segmentMidpointDistance; const LINE_SEGMENT_LENGTH=Math.min(width,height)*0.18; const x1b=segmentMidpointX-segmentVectorX*(LINE_SEGMENT_LENGTH/2), y1b=segmentMidpointY-segmentVectorY*(LINE_SEGMENT_LENGTH/2); const x2b=segmentMidpointX+segmentVectorX*(LINE_SEGMENT_LENGTH/2), y2b=segmentMidpointY+segmentVectorY*(LINE_SEGMENT_LENGTH/2); const y1rh=2*centerY-y1b, y2rh=2*centerY-y2b, x1rv=2*centerX-x1b, x2rv=2*centerX-x2b; let trapV_p:any, trapH_p:any;
            switch(config){case BevelGearConfigType.Config2:trapV_p={p1:{x:x1rv,y:y1b},p2:{x:x2rv,y:y2b},p3:{x:x2rv,y:y2rh},p4:{x:x1rv,y:y1rh}};trapH_p={p1:{x:x1rv,y:y1b},p2:{x:x2rv,y:y2b},p3:{x:2*centerX-x2rv,y:y2b},p4:{x:2*centerX-x1rv,y:y1b}};break; case BevelGearConfigType.Config3:trapV_p={p1:{x:x1b,y:y1rh},p2:{x:x2b,y:y2rh},p3:{x:x2b,y:2*centerY-y2rh},p4:{x:x1b,y:2*centerY-y1rh}};trapH_p={p1:{x:x1b,y:y1rh},p2:{x:x2b,y:y2rh},p3:{x:x2rv,y:y2rh},p4:{x:x1rv,y:y1rh}};break; default:trapV_p={p1:{x:x1b,y:y1b},p2:{x:x2b,y:y2b},p3:{x:x2b,y:y2rh},p4:{x:x1b,y:y1rh}};trapH_p={p1:{x:x1b,y:y1b},p2:{x:x2b,y:y2b},p3:{x:x2rv,y:y2b},p4:{x:x1rv,y:y1b}};break;}
            return [trapV_p.p2, trapV_p.p3, trapV_p.p4, trapH_p.p3, trapH_p.p4];
        }
        case GearType.Planetary: { const width = UGO_COAXIAL_TURNING_DIM; const height = UGO_COAXIAL_TURNING_DIM; const gearWidth = width * 0.20; const gearX = (width - gearWidth) / 2; const ringSegmentHeight = height * 0.05; const paddingY = height * 0.05; const topRingY = paddingY; const bottomRingY = height - paddingY - ringSegmentHeight; return [{ x: gearX, y: topRingY }, { x: gearX + gearWidth, y: topRingY }, { x: gearX, y: bottomRingY + ringSegmentHeight }, { x: gearX + gearWidth, y: bottomRingY + ringSegmentHeight }]; }
        case 'Источник': { const { width, height } = transform; const centerX = width / 2; const centerY = height / 2; const radius = Math.min(width, height) * 0.35; return [{ x: centerX, y: centerY - radius }, { x: centerX, y: centerY + radius }, { x: centerX - radius, y: centerY }, { x: centerX + radius, y: centerY }]; }
        default: return [];
    }
};
const transformLocalPointToGlobal = (localPoint: Point, transform: UgoTransform): Point => {
    const { translateX, translateY, rotation, internalOffsetY, rotationCenterX, rotationCenterY, scaleX, scaleY } = transform; const rad = rotation * Math.PI / 180; const cos = Math.cos(rad); const sin = Math.sin(rad); let tempX = localPoint.x; let tempY = localPoint.y; if (rotation !== 0 && internalOffsetY !== 0) { tempY += internalOffsetY; const rotatedX = tempX * cos - tempY * sin; const rotatedY = tempX * sin + tempY * cos; return { x: translateX + rotatedX, y: translateY + rotatedY }; }
    const dx = tempX - rotationCenterX; const dy = tempY - rotationCenterY; const scaledX = dx * (scaleX || 1); const scaledY = dy * (scaleY || 1); const rotatedX = scaledX * cos - scaledY * sin; const rotatedY = scaledX * sin + scaledY * cos;
    return { x: translateX + rotationCenterX + rotatedX, y: translateY + rotationCenterY + rotatedY, };
};
const calculateIntersectionArea = (r1: Bbox, r2: Bbox): number => { const xOverlap = Math.max(0, Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x)); const yOverlap = Math.max(0, Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y)); return xOverlap * yOverlap; };

const detectSchemaOverlaps = (spaces: Bbox[]): Set<string> => {
    const conflictingIds = new Set<string>();
    for (let i = 0; i < spaces.length; i++) {
        for (let j = i + 1; j < spaces.length; j++) {
            const space1 = spaces[i];
            const space2 = spaces[j];
            if (!space1.ownerId || !space2.ownerId || space1.ownerId === space2.ownerId) { continue; }
            if ( space1.x < space2.x + space2.width && space1.x + space1.width > space2.x && space1.y < space2.y + space2.height && space1.y + space1.height > space2.y ) {
                conflictingIds.add(space1.ownerId);
                conflictingIds.add(space2.ownerId);
            }
        }
    }
    return conflictingIds;
};
// --- Конец хелперов ---

const createInteractionHandlers = (callback: (event: React.MouseEvent | React.TouchEvent) => void) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ms = 300; 
    const handleTouchStart = (e: React.TouchEvent) => {
        const { clientX, clientY } = e.touches[0];
        const target = e.target;
        const eventCopy = { preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation(), target, clientX, clientY, };
        timer = setTimeout(() => { callback(eventCopy as any); timer = null; }, ms);
    };
    const clearTouchTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const handleClick = (e: React.MouseEvent) => { if (e.button !== 0) return; callback(e); };
    return { onClick: handleClick, onTouchStart: handleTouchStart, onTouchEnd: clearTouchTimer, onTouchCancel: clearTouchTimer, onTouchMove: clearTouchTimer, };
};

interface SpacerContextMenuProps {
    spacer: SpacerShaft & { index: number }; position: { x: number; y: number }; onClose: () => void;
    onUpdate: (index: number, newProps: Partial<SpacerShaft>) => void; onDelete: (index: number) => void;
    currentIndex: number | null; totalItems: number; onNavigate: (direction: 'next' | 'prev') => void;
    isMobileView: boolean;
}
  
const SpacerContextMenu: React.FC<SpacerContextMenuProps> = ({ spacer, position, onClose, onUpdate, onDelete, currentIndex, totalItems, onNavigate, isMobileView }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [length, setLength] = useState(spacer.length);
  
    useLayoutEffect(() => {
        if (isMobileView || !menuRef.current) return;

        const menu = menuRef.current;
        const { innerWidth, innerHeight } = window;
        const { width, height } = menu.getBoundingClientRect();
        let left = position.x;
        let top = position.y;
        if (left + width > innerWidth - 10) { left = position.x - width - 20; }
        if (top + height > innerHeight - 10) { top = position.y - height - 20; }
        menu.style.left = `${Math.max(5, left)}px`;
        menu.style.top = `${Math.max(5, top)}px`;
    }, [position, isMobileView]);
  
    const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => { const newLength = parseInt(e.target.value, 10); setLength(newLength); onUpdate(spacer.index, { length: newLength }); };
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const value = e.target.value; if (value === 'delete') { onDelete(spacer.index); } else { onUpdate(spacer.index, { style: value as SpacerStyle }); } };

    const mobileClasses = "bottom-4 left-4 right-4 w-auto animate-slide-up";
    const desktopClasses = "w-64";

    return ( 
        <> 
            <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose}></div> 
            <div 
                ref={menuRef} 
                className={`fixed bg-white rounded-xl shadow-2xl z-50 border border-gray-200 ${isMobileView ? mobileClasses : desktopClasses}`}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            > 
                <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onNavigate('prev')} title="Предыдущий (←)" className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-xs font-mono text-gray-500 tabular-nums">
                            {currentIndex !== null ? `${currentIndex + 1} / ${totalItems}` : '-/-'}
                        </span>
                        <button onClick={() => onNavigate('next')} title="Следующий (→)" className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <button onClick={onClose} title="Закрыть (Esc)" className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-3 border-b border-gray-200"> <h3 className="font-bold text-gray-800 text-center">Настройки Вала-проставки</h3> </div> 
                <div className="p-3 space-y-4"> <div> <label htmlFor={`length-slider-${spacer.id}`} className="flex justify-between text-sm font-medium text-gray-700 mb-1"> <span>Длина</span> <span className="font-semibold text-gray-800">{length}px</span> </label> <input id={`length-slider-${spacer.id}`} type="range" min="15" max="500" step="5" value={length} onChange={handleLengthChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" /> </div> <div> <label htmlFor={`actions-${spacer.id}`} className="block text-sm font-medium text-gray-700 mb-2">Действия</label> <select id={`actions-${spacer.id}`} value={spacer.style} onChange={handleSelectChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"> <option value="solid">Стиль: Сплошной</option> <option value="dashed">Стиль: Штриховой</option> <option value="cardan">Стиль: Карданный</option> <option value="delete" className="!text-red-600 !font-semibold">Удалить вал</option> </select> </div> </div> 
            </div> 
        </> 
    );
};

const EraserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-6 h-6" fill="currentColor">
      <path d="M8.1 14l6.4-7.2c0.6-0.7 0.6-1.8-0.1-2.5l-2.7-2.7c-0.3-0.4-0.8-0.6-1.3-0.6h-1.8c-0.5 0-1 0.2-1.4 0.6l-6.7 7.6c-0.6 0.7-0.6 1.9 0.1 2.5l2.7 2.7c0.3 0.4 0.8 0.6 1.3 0.6h11.4v-1h-7.9zM6.8 13.9c0 0 0-0.1 0 0l-2.7-2.7c-0.4-0.4-0.4-0.9 0-1.3l3.4-3.9h-1l-3 3.3c-0.6 0.7-0.6 1.7 0.1 2.4l2.3 2.3h-1.3c-0.2 0-0.4-0.1-0.6-0.2l-2.8-2.8c-0.3-0.3-0.3-0.8 0-1.1l3.5-3.9h1.8l3.5-4h1l-3.5 4 3.1 3.7-3.5 4c-0.1 0.1-0.2 0.1-0.3 0.2z"></path>
    </svg>
);

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

interface SchemeBuilderPageProps {
    engineParams: EngineParams;
    initialSchemeElements: SchemeElement[];
    schemeElements: SchemeElement[];
    calculationData: StageCalculationData[];
    setSchemeElements: (scheme: SchemeElement[]) => void;
    onBack: () => void;
    onNavigateToModule: (moduleId: string) => void;
    onModuleSelect: (stageIndex: number, moduleId: string) => void;
    onSaveProject: () => void;
    onLoadClick: () => void;
    onOpenInfoModal: () => void;
}

type SelectedUgo = {
    module: (ModuleCalculationData | { type: 'Источник'; id: string; inputs?: any });
    stageIndex: number;
    inputDirection: 'up' | 'down' | 'left' | 'right';
    currentTurn?: 'up' | 'down' | 'left' | 'right';
    isMultiModuleStage: boolean;
};


export const SchemeBuilderPage = forwardRef<HTMLDivElement, SchemeBuilderPageProps>(({ 
    engineParams, initialSchemeElements, schemeElements, calculationData, setSchemeElements, onBack, 
    onNavigateToModule, onModuleSelect, onSaveProject, onLoadClick, onOpenInfoModal 
}, ref) => {
    const [selectedUgo, setSelectedUgo] = useState<SelectedUgo | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const [selectedSpacer, setSelectedSpacer] = useState<(SpacerShaft & { index: number }) | null>(null);
    const [spacerMenuPosition, setSpacerMenuPosition] = useState<{ x: number; y: number } | null>(null);
    
    const [overlappingUgoIds, setOverlappingUgoIds] = useState<Set<string>>(new Set());
    const [overlapWarningMessage, setOverlapWarningMessage] = useState<string | null>(null);
    const [warningDismissed, setWarningDismissed] = useState(false);
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const contentBoundsRef = useRef({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
    const flatInteractableItemsRef = useRef<any[]>([]);
    const [currentSelectedIndex, setCurrentSelectedIndex] = useState<number | null>(null);
    const viewboxTransformRef = useRef({ tx: 0, ty: 0 });
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024);
    const [isProjectActionsModalOpen, setIsProjectActionsModalOpen] = useState(false);

    useLayoutEffect(() => {
        const checkSize = () => setIsMobileView(window.innerWidth <= 1024);
        window.addEventListener('resize', checkSize);
        checkSize();
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    useEffect(() => { setWarningDismissed(false); }, [schemeElements]);

    const clearOverlapWarning = useCallback(() => {
        if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
        if (overlappingUgoIds.size > 0 || overlapWarningMessage) {
            setWarningDismissed(true);
            setOverlappingUgoIds(new Set());
            setOverlapWarningMessage(null);
        }
    }, [overlappingUgoIds.size, overlapWarningMessage]);
    
    useEffect(() => {
        if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); }
        if (overlappingUgoIds.size > 0) {
            warningTimerRef.current = setTimeout(() => {
                setWarningDismissed(true);
                setOverlappingUgoIds(new Set());
                setOverlapWarningMessage(null);
            }, 5000);
        }
        return () => { if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); } };
    }, [overlappingUgoIds]);

    useEffect(() => {
        if (selectedUgo) {
            const element = schemeElements[selectedUgo.stageIndex];
            if (element && 'modules' in element && element.modules) {
                const stage = element as StageCalculationData;
                const currentModuleData = (stage.modules as ModuleCalculationData[]).find(m => m.id === selectedUgo.module.id);
                if (currentModuleData) { setSelectedUgo(prev => { if (prev && prev.module !== currentModuleData) { return { ...prev, module: currentModuleData }; } return prev; }); }
            }
        }
    }, [schemeElements, selectedUgo]);

    const handleUpdateLayout = (stageIndex: number, newLayout: ParallelLayoutType) => {
        const newData = JSON.parse(JSON.stringify(schemeElements));
        const element = newData[stageIndex];
        if (element && 'modules' in element && element.modules) {
            (element.modules as ModuleCalculationData[]).forEach(module => { module.layout = newLayout; });
        }
        setSchemeElements(newData);
    };

    const handleUpdateReversed = (stageIndex: number, isReversed: boolean) => {
        const newData = JSON.parse(JSON.stringify(schemeElements));
        const element = newData[stageIndex];
        if (element && 'modules' in element && element.modules) {
            (element.modules as ModuleCalculationData[]).forEach(module => { module.isReversed = isReversed; });
        }
        setSchemeElements(newData);
    };

    const handleUpdateTurnDirection = (stageIndex: number, newDirection: 'up' | 'down' | 'left' | 'right') => {
        const newData = [...schemeElements];
        const stage = newData[stageIndex];
        if (stage) { newData[stageIndex] = { ...stage, turn: newDirection }; }
        setSchemeElements(newData);
        setSelectedUgo(prev => { if (prev && prev.stageIndex === stageIndex) { return { ...prev, currentTurn: newDirection }; } return prev; });
    };

    const handleMakeModuleActive = (stageIndex: number, moduleId: string) => {
        // Локальное обновление для мгновенной обратной связи на схеме
        const newSchemeData = [...schemeElements];
        const element = newSchemeData[stageIndex];
        if (element && 'modules' in element && element.modules) {
            const stage = element as StageCalculationData;
            stage.modules.forEach(m => {
                m.isSelected = m.id === moduleId;
            });
            setSchemeElements(newSchemeData);
        }
    
        // Находим "реальный" индекс ступени, исключая проставки, и вызываем onModuleSelect
        // для обновления глобального состояния и запуска перерасчета.
        const realStageIndex = schemeElements.slice(0, stageIndex + 1).filter(e => !('type' in e && e.type === 'spacer')).length - 1;
        if (realStageIndex >= 0) {
            onModuleSelect(realStageIndex, moduleId);
        }
    
        handleCloseMenus();
    };

    const handleCloseMenus = useCallback(() => { setSelectedUgo(null); setMenuPosition(null); setSelectedSpacer(null); setSpacerMenuPosition(null); setCurrentSelectedIndex(null); }, []);

    const handleUgoInteraction = (
        data: { module: ModuleCalculationData | { type: 'Источник', id: string, inputs?: any }, stageIndex: number, inputDirection: 'up' | 'down' | 'left' | 'right', currentTurn?: 'up' | 'down' | 'left' | 'right' },
        event: React.MouseEvent | React.TouchEvent
    ) => {
        clearOverlapWarning(); event.preventDefault(); event.stopPropagation();
        const containerRect = containerRef.current?.getBoundingClientRect(); if (!containerRect) return;
        const flatItem = flatInteractableItemsRef.current.find(item => item.id === data.module.id); if (!flatItem) return;
        const { centerPoint } = flatItem;
        const transformedCenterPoint = { x: centerPoint.x + viewboxTransformRef.current.tx, y: centerPoint.y + viewboxTransformRef.current.ty, };
        const finalViewCoords = calculateCenterOnPoint(transformedCenterPoint.x, transformedCenterPoint.y); setView(prev => ({ ...prev, x: finalViewCoords.x, y: finalViewCoords.y }));
        const stage = data.stageIndex >= 0 ? schemeElements[data.stageIndex] : null;
        const index = flatInteractableItemsRef.current.findIndex(item => item.id === data.module.id);
        setCurrentSelectedIndex(index !== -1 ? index : null);
        const isMultiModuleStage = stage && 'modules' in stage && Array.isArray(stage.modules) && stage.modules.length > 1;
        const MENU_HORIZONTAL_POSITION_FACTOR = 0.7;
        const menuX = containerRect.left + containerRect.width * MENU_HORIZONTAL_POSITION_FACTOR;
        const menuY = containerRect.top + containerRect.height / 2;
        setSelectedUgo({ ...data, isMultiModuleStage: !!isMultiModuleStage });
        setMenuPosition({ x: menuX, y: menuY });
        setSelectedSpacer(null);
        setSpacerMenuPosition(null);
    };

    const handleAddSpacer = (stageIndex: number, position: 'before' | 'after') => {
        const newSpacer: SpacerShaft = { id: `spacer-${Date.now()}`, type: 'spacer', length: 50, style: 'solid', };
        const newData = [...schemeElements];
        const insertIndex = position === 'before' ? stageIndex : stageIndex + 1;
        newData.splice(insertIndex, 0, newSpacer);
        setSchemeElements(newData);

        if (position === 'before') {
            setSelectedUgo(prev => prev ? { ...prev, stageIndex: prev.stageIndex + 1 } : null);
            setCurrentSelectedIndex(prev => prev !== null ? prev + 1 : null);
        }
    };

    const handleSpacerInteraction = (event: React.MouseEvent | React.TouchEvent, spacer: SpacerShaft & { index: number }) => {
        clearOverlapWarning(); event.preventDefault(); event.stopPropagation();
        const containerRect = containerRef.current?.getBoundingClientRect(); if (!containerRect) return;
        const flatItem = flatInteractableItemsRef.current.find(item => item.id === spacer.id);
        if (flatItem && flatItem.centerPoint) {
            const transformedCenterPoint = { x: flatItem.centerPoint.x + viewboxTransformRef.current.tx, y: flatItem.centerPoint.y + viewboxTransformRef.current.ty, };
            const finalViewCoords = calculateCenterOnPoint(transformedCenterPoint.x, transformedCenterPoint.y);
            setView(prev => ({ ...prev, x: finalViewCoords.x, y: finalViewCoords.y }));
        }
        const index = flatInteractableItemsRef.current.findIndex(item => item.id === spacer.id);
        setCurrentSelectedIndex(index !== -1 ? index : null);
        const MENU_HORIZONTAL_POSITION_FACTOR = 0.7;
        const menuX = containerRect.left + containerRect.width * MENU_HORIZONTAL_POSITION_FACTOR;
        const menuY = containerRect.top + containerRect.height / 2;
        setSelectedSpacer(spacer); 
        setSpacerMenuPosition({ x: menuX, y: menuY }); 
        setSelectedUgo(null); 
        setMenuPosition(null);
    };
    
    const handleUpdateSpacer = (index: number, newProps: Partial<SpacerShaft>) => {
        const newData = [...schemeElements]; const spacerToUpdate = newData[index]; if (spacerToUpdate && 'type' in spacerToUpdate && spacerToUpdate.type === 'spacer') { newData[index] = { ...spacerToUpdate, ...newProps }; } setSchemeElements(newData);
    };
    
    const handleDeleteSpacer = (index: number) => { setSchemeElements(schemeElements.filter((_, i) => i !== index)); handleCloseMenus(); };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const updateBounds = (bbox: Bbox) => {
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
    };
    
    const buildVirtualModel = () => {
        const svgElements: React.ReactNode[] = []; const allTerminals: Terminal[] = []; const baseLayoutOccupiedSpaces: Bbox[] = []; const ugoDataForCallouts: UgoDataForCallout[] = [];
        const powerSourceWidth = 80; const powerSourceHeight = 80;
        type Cursor = { x: number; y: number; direction: 'right' | 'left' | 'up' | 'down' };
        let cursor: Cursor = { x: SVG_PADDING, y: SVG_PADDING + 400, direction: 'right' };
        const flatItems: any[] = [];
        
        const powerSourceY = cursor.y - powerSourceHeight / 2;
        const powerSourceModuleData: { type: 'Источник'; id: string; inputs?: any } = { id: 'power-source', type: 'Источник', inputs: {} };
        const powerSourceInteractionData = { module: powerSourceModuleData, stageIndex: -1, inputDirection: 'right' as const, currentTurn: undefined };
        const powerSourceHandlers = createInteractionHandlers((e) => handleUgoInteraction(powerSourceInteractionData, e));
        const isPowerSourceSelected = selectedUgo?.module.id === powerSourceModuleData.id || (currentSelectedIndex !== null && flatInteractableItemsRef.current[currentSelectedIndex]?.id === 'power-source');
        const isPowerSourceOverlapping = overlappingUgoIds.has('power-source');
        svgElements.push( <g key="engine-source" transform={`translate(${cursor.x}, ${powerSourceY})`} {...powerSourceHandlers} style={{ cursor: 'pointer' }}> {isPowerSourceSelected && <rect x={-5} y={-5} width={powerSourceWidth + 10} height={powerSourceHeight + 10} fill="rgba(59, 130, 246, 0.2)" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2" rx="5" />} {isPowerSourceOverlapping && <rect x={-5} y={-5} width={powerSourceWidth + 10} height={powerSourceHeight + 10} fill="rgba(239, 68, 68, 0.2)" stroke="rgba(220, 38, 38, 0.7)" strokeWidth="2" rx="5" />} <rect x="0" y="0" width={powerSourceWidth} height={powerSourceHeight} fill="transparent" /> <PowerSourceUGO width={powerSourceWidth} height={powerSourceHeight} direction={PowerSourceDirection.Right} /> </g> );
        const powerSourceTransform: UgoTransform = { translateX: cursor.x, translateY: powerSourceY, rotation: 0, internalOffsetY: 0, rotationCenterX: powerSourceWidth/2, rotationCenterY: powerSourceHeight/2, width: powerSourceWidth, height: powerSourceHeight, scaleX: 1, scaleY: 1 };
        getUgoSubBboxes('Источник', {}).map(sub => transformLocalBboxToGlobal(sub, powerSourceTransform)).forEach(globalSub => baseLayoutOccupiedSpaces.push({ ...globalSub, ownerId: 'power-source' }));
        updateBounds({ x: cursor.x, y: powerSourceY, width: powerSourceWidth, height: powerSourceHeight });
        ugoDataForCallouts.push({ id: 'power-source', transform: powerSourceTransform, bbox: { x: cursor.x, y: powerSourceY, width: powerSourceWidth, height: powerSourceHeight }, type: 'Источник', u: 0, inputs: {}, flowDirection: 'right' });
        flatItems.push({ id: 'power-source', type: 'ugo', centerPoint: { x: cursor.x + powerSourceWidth / 2, y: powerSourceY + powerSourceHeight / 2 }, data: powerSourceInteractionData });
        cursor.x += powerSourceWidth; allTerminals.push({ id: 'term-source-out', point: { ...cursor }, orientation: 'horizontal-shaft', isConnectionPoint: true });
        let previousCursor: Cursor = { ...cursor }; let previousParallelLayout: ParallelLayoutType | null = null;
        
        schemeElements.forEach((element, elementIndex) => {
            if ('type' in element && element.type === 'spacer') {
                const spacerElement = element; const isVertical = cursor.direction === 'up' || cursor.direction === 'down'; const orientation = isVertical ? 'vertical-shaft' : 'horizontal-shaft';
                allTerminals.push({ id: `term-spacer-${spacerElement.id}-start`, point: { ...cursor }, orientation, isConnectionPoint: true });
                const spacerStart = { ...cursor };
                if (spacerElement.style === 'cardan') {
                    const centralLength = spacerElement.length; const totalAssemblyWidth = JOINT_UGO_WIDTH * 2 + centralLength; const ugoTransform: UgoTransform = { translateX: 0, translateY: 0, rotation: 0, internalOffsetY: 0, rotationCenterX: totalAssemblyWidth / 2, rotationCenterY: CARDAN_UGO_HEIGHT / 2, width: totalAssemblyWidth, height: CARDAN_UGO_HEIGHT, scaleX: 1, scaleY: 1 }; let transformString = '';
                    if (isVertical) {
                        ugoTransform.rotation = cursor.direction === 'down' ? 90 : -90; transformString = `translate(${cursor.x}, ${cursor.y}) rotate(${ugoTransform.rotation}) translate(0, ${-CARDAN_UGO_HEIGHT / 2})`;
                        if (cursor.direction === 'down') cursor.y += totalAssemblyWidth; else cursor.y -= totalAssemblyWidth;
                    } else {
                        ugoTransform.translateX = (cursor.direction === 'right') ? cursor.x : cursor.x - totalAssemblyWidth; ugoTransform.translateY = cursor.y - CARDAN_UGO_HEIGHT / 2; transformString = `translate(${ugoTransform.translateX}, ${ugoTransform.translateY})`;
                        if (cursor.direction === 'right') cursor.x += totalAssemblyWidth; else cursor.x -= totalAssemblyWidth;
                    }
                    const isSpacerSelected = selectedSpacer?.id === spacerElement.id || (currentSelectedIndex !== null && flatInteractableItemsRef.current[currentSelectedIndex]?.id === spacerElement.id);
                    const spacerHandlers = createInteractionHandlers((e) => handleSpacerInteraction(e, { ...spacerElement, index: elementIndex }));
                    svgElements.push( <g key={spacerElement.id} transform={transformString}> {isSpacerSelected && <rect x={-2} y={-2} width={totalAssemblyWidth + 4} height={CARDAN_UGO_HEIGHT + 4} fill="rgba(59, 130, 246, 0.2)" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="1.5" rx="3" />} <CardanShaftUGO centralLength={centralLength} /> <rect x="0" y="0" width={totalAssemblyWidth} height={CARDAN_UGO_HEIGHT} fill="transparent" {...spacerHandlers} style={{ cursor: 'pointer' }} /> </g> );
                } else {
                    if (cursor.direction === 'right') cursor.x += spacerElement.length; else if (cursor.direction === 'left') cursor.x -= spacerElement.length; else if (cursor.direction === 'down') cursor.y += spacerElement.length; else if (cursor.direction === 'up') cursor.y -= spacerElement.length;
                    const spacerEnd = { ...cursor };
                    const isSpacerSelected = selectedSpacer?.id === spacerElement.id || (currentSelectedIndex !== null && flatInteractableItemsRef.current[currentSelectedIndex]?.id === spacerElement.id);
                    const spacerHandlers = createInteractionHandlers((e) => handleSpacerInteraction(e, { ...spacerElement, index: elementIndex }));
                    svgElements.push( <g key={spacerElement.id}> {isSpacerSelected && <line x1={spacerStart.x} y1={spacerStart.y} x2={spacerEnd.x} y2={spacerEnd.y} stroke="rgba(59, 130, 246, 0.7)" strokeWidth={8} strokeLinecap="round" />} <line x1={spacerStart.x} y1={spacerStart.y} x2={spacerEnd.x} y2={spacerEnd.y} stroke="#0F0F0F" strokeWidth={2} strokeDasharray={spacerElement.style === 'dashed' ? '5, 5' : 'none'} /> <line x1={spacerStart.x} y1={spacerStart.y} x2={spacerEnd.x} y2={spacerEnd.y} stroke="transparent" strokeWidth={20} {...spacerHandlers} style={{ cursor: 'pointer' }} /> </g> );
                }
                const spacerEnd = { ...cursor };
                flatItems.push({ id: spacerElement.id, type: 'spacer', centerPoint: { x: (spacerStart.x + spacerEnd.x) / 2, y: (spacerStart.y + spacerEnd.y) / 2 }, data: { ...spacerElement, index: elementIndex } });
                allTerminals.push({ id: `term-spacer-${spacerElement.id}-end`, point: { ...cursor }, orientation, isConnectionPoint: true });
                previousCursor = { ...cursor }; previousParallelLayout = null; return;
            }

            const realStageIndex = schemeElements.slice(0, elementIndex + 1).filter(e => !('type' in e && e.type === 'spacer')).length - 1;
            const lastTerminalId = realStageIndex === 0 ? 'term-source-out' : `term-stage-${realStageIndex - 1}-out`;
            const prevTerminal = allTerminals.find(t => t.id === lastTerminalId);
            if (prevTerminal) {
                prevTerminal.isConnectionPoint = true;
            } else {
                console.warn(`Could not find previous terminal with ID: ${lastTerminalId}`);
            }

            const stage = element as (Partial<StageCalculationData> & { turn?: 'up' | 'down' | 'left' | 'right' });
            const modulesToDraw = (stage.modules || []) as ModuleCalculationData[]; if (modulesToDraw.length === 0) return;
            const selectedModule = modulesToDraw.find(m => m.isSelected) || modulesToDraw[0]; const isParallel = [GearType.Gear, GearType.Belt, GearType.Chain, GearType.ToothedBelt].includes(selectedModule.type);
            if (isParallel) { const layout = selectedModule.layout || ParallelLayoutType.Standard; if (previousParallelLayout && layout !== previousParallelLayout) { const spacerStart = { ...cursor }; if (cursor.direction === 'right') cursor.x += AUTO_SPACER_LENGTH; else if (cursor.direction === 'left') cursor.x -= AUTO_SPACER_LENGTH; else if (cursor.direction === 'down') cursor.y += AUTO_SPACER_LENGTH; else if (cursor.direction === 'up') cursor.y -= AUTO_SPACER_LENGTH; const spacerEnd = { ...cursor }; svgElements.push( <g key={`auto-spacer-${elementIndex}`} stroke="#0F0F0F" strokeWidth={2}> <line x1={spacerStart.x} y1={spacerStart.y} x2={spacerEnd.x} y2={spacerEnd.y} /> </g> ); } }
            const stageInputCursor = { ...cursor };
            svgElements.push( <line key={`connector-shaft-${elementIndex}`} x1={previousCursor.x} y1={previousCursor.y} x2={stageInputCursor.x} y2={stageInputCursor.y} stroke="#0F0F0F" strokeWidth={2} /> );
            const isMultiParallelStage = modulesToDraw.length > 1;
            const isReversed = selectedModule.isReversed ?? false;
            if (isMultiParallelStage) {
                const blockLayout = selectedModule.layout || ParallelLayoutType.Standard; const isLayoutInverted = blockLayout === ParallelLayoutType.Inverted; const blockStartCursor = { ...cursor }; const isVertical = cursor.direction === 'up' || cursor.direction === 'down'; const flowDirection = cursor.direction;
                
                const inputTerminal: Terminal = { id: `term-stage-${realStageIndex}-in`, point: { ...cursor }, orientation: isVertical ? 'vertical-shaft' : 'horizontal-shaft', isConnectionPoint: true }; allTerminals.push(inputTerminal);
                modulesToDraw.forEach((module) => {
                    const ugoProps: any = { u: module.u || 0 }; const inputs = module.inputs; if ('z1' in inputs && 'z2' in inputs) { ugoProps.z1 = Number(inputs.z1); ugoProps.z2 = Number(inputs.z2); } if ('d1' in inputs && 'd2' in inputs) { ugoProps.d1 = Number(inputs.d1); ugoProps.d2 = Number(inputs.d2); }
                    const width = UGO_PARALLEL_WIDTH; const height = UGO_PARALLEL_HEIGHT; let tx, ty, rot = 0; let ugoBbox: Bbox;
                    const ugoTransform: UgoTransform = { translateX: 0, translateY: 0, rotation: 0, internalOffsetY: 0, rotationCenterX: width / 2, rotationCenterY: height / 2, width, height, scaleX: 1, scaleY: 1 };
                    const strokeColor = module.isSelected ? undefined : INACTIVE_UGO_COLOR;
                    if(isVertical) {
                        rot = cursor.direction === 'down' ? 90 : -90; tx = cursor.x; ty = cursor.y; const inputShaftYOffset = (isLayoutInverted) ? UGO_PARALLEL_SHAFT_Y2 : UGO_PARALLEL_SHAFT_Y1; ugoTransform.internalOffsetY = -inputShaftYOffset; ugoTransform.rotation = rot; ugoTransform.translateX = tx; ugoTransform.translateY = ty; const transformString = `translate(${tx}, ${ty}) rotate(${rot}) translate(0, ${-inputShaftYOffset})`; const rad=rot*Math.PI/180;const cos=Math.cos(rad);const sin=Math.sin(rad);const c=[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}];const g=c.map(p=>{let n={...p};n.y-=inputShaftYOffset;const rX=n.x*cos-n.y*sin;const rY=n.x*sin+n.y*cos;return{x:tx+rX,y:ty+rY}});const mX=Math.min(...g.map(p=>p.x));const mX2=Math.max(...g.map(p=>p.x));const mY=Math.min(...g.map(p=>p.y));const mY2=Math.max(...g.map(p=>p.y)); ugoBbox={x:mX,y:mY,width:mX2-mX,height:mY2-mY}; let UgoComponent = { [GearType.Gear]: CylindricalGearUGO, [GearType.Belt]: BeltDriveUGO, [GearType.Chain]: ChainDriveUGO, [GearType.ToothedBelt]: ToothedBeltDriveUGO }[module.type];
                        const interactionData = { module, stageIndex: elementIndex, inputDirection: flowDirection, currentTurn: stage.turn };
                        const handlers = createInteractionHandlers((e) => handleUgoInteraction(interactionData, e)); 
                        const isSelected = selectedUgo?.module.id === module.id || (currentSelectedIndex !== null && flatInteractableItemsRef.current[currentSelectedIndex]?.id === module.id); const isOverlapping = overlappingUgoIds.has(module.id);
                        if(UgoComponent) svgElements.push(<g key={module.id} transform={transformString} {...handlers} style={{ cursor: 'pointer' }}> {isSelected && <rect x={-5} y={-5} width={width + 10} height={height + 10} fill="rgba(59, 130, 246, 0.2)" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2" rx="5" />} {isOverlapping && <rect x={-5} y={-5} width={width + 10} height={height + 10} fill="rgba(239, 68, 68, 0.2)" stroke="rgba(220, 38, 38, 0.7)" strokeWidth="2" rx="5" />} <rect x="0" y="0" width={width} height={height} fill="transparent" /> <UgoComponent width={width} height={height} {...ugoProps} strokeColor={strokeColor} /> </g>);
                        cursor.y += (cursor.direction === 'down' ? width : -width);
                    } else { // HORIZONTAL LOGIC
                        const inputShaftYOffset = (isLayoutInverted) ? UGO_PARALLEL_SHAFT_Y2 : UGO_PARALLEL_SHAFT_Y1;
                        if (cursor.direction === 'right') {
                            tx = cursor.x;
                            cursor.x += width;
                        } else { // 'left'
                            tx = cursor.x - width;
                            cursor.x -= width;
                        }
                        ty = cursor.y - inputShaftYOffset;
                        ugoTransform.translateX = tx; ugoTransform.translateY = ty; const transformString = `translate(${tx}, ${ty})`; ugoBbox = { x: tx, y: ty, width, height }; let UgoComponent = { [GearType.Gear]: CylindricalGearUGO, [GearType.Belt]: BeltDriveUGO, [GearType.Chain]: ChainDriveUGO, [GearType.ToothedBelt]: ToothedBeltDriveUGO }[module.type];
                        const interactionData = { module, stageIndex: elementIndex, inputDirection: flowDirection, currentTurn: stage.turn };
                        const handlers = createInteractionHandlers((e) => handleUgoInteraction(interactionData, e));
                        const isSelected = selectedUgo?.module.id === module.id || (currentSelectedIndex !== null && flatInteractableItemsRef.current[currentSelectedIndex]?.id === module.id); const isOverlapping = overlappingUgoIds.has(module.id);
                        if(UgoComponent) svgElements.push(<g key={module.id} transform={transformString} {...handlers} style={{ cursor: 'pointer' }}> {isSelected && <rect x={-5} y={-5} width={width + 10} height={height + 10} fill="rgba(59, 130, 246, 0.2)" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2" rx="5" />} {isOverlapping && <rect x={-5} y={-5} width={width + 10} height={height + 10} fill="rgba(239, 68, 68, 0.2)" stroke="rgba(220, 38, 38, 0.7)" strokeWidth="2" rx="5" />} <rect x="0" y="0" width={width} height={height} fill="transparent" /> <UgoComponent width={width} height={height} {...ugoProps} strokeColor={strokeColor} /> </g>);
                    }
                    updateBounds(ugoBbox);
                    getUgoSubBboxes(module.type, module.inputs).map(sub => transformLocalBboxToGlobal(sub, ugoTransform)).forEach(gSub => baseLayoutOccupiedSpaces.push({...gSub, ownerId: module.id}));
                    ugoDataForCallouts.push({id: module.id, transform: ugoTransform, bbox: ugoBbox, type: module.type, u: module.u || 0, inputs: ugoProps, flowDirection });
                    flatItems.push({id: module.id, type: 'ugo', centerPoint: {x: ugoBbox.x + ugoBbox.width / 2, y: ugoBbox.y + ugoBbox.height / 2}, data: { module, stageIndex: elementIndex, inputDirection: flowDirection, currentTurn: stage.turn } });
                });
                const blockEndCursor = { ...cursor };
                if (isVertical) {
                    const xShift = UGO_PARALLEL_SHAFT_DISTANCE * (isLayoutInverted ? -1 : 1);
                    if (isReversed) {
                        cursor.x = blockStartCursor.x + (flowDirection === 'down' ? -xShift : xShift);
                        cursor.y = blockStartCursor.y;
                        cursor.direction = flowDirection === 'down' ? 'up' : 'down';
                        allTerminals.push({ id: `term-stage-${realStageIndex}-free-input-end`, point: { x: inputTerminal.point.x, y: blockEndCursor.y }, orientation: 'vertical-shaft', isConnectionPoint: false });
                        allTerminals.push({ id: `term-stage-${realStageIndex}-free-output-end`, point: { x: cursor.x, y: blockEndCursor.y }, orientation: 'vertical-shaft', isConnectionPoint: false });
                    } else { 
                        cursor.x = blockStartCursor.x + (flowDirection === 'down' ? -xShift : xShift);
                        allTerminals.push({ id: `term-stage-${realStageIndex}-free-input-end`, point: { x: inputTerminal.point.x, y: blockEndCursor.y }, orientation: 'vertical-shaft', isConnectionPoint: false });
                        allTerminals.push({ id: `term-stage-${realStageIndex}-free-output-start`, point: { x: cursor.x, y: inputTerminal.point.y }, orientation: 'vertical-shaft', isConnectionPoint: false });
                    }
                } else { // Horizontal
                    const yShift = UGO_PARALLEL_SHAFT_DISTANCE * (isLayoutInverted ? -1 : 1);
                    if (isReversed) {
                        cursor.y = blockStartCursor.y + yShift;
                        cursor.x = blockStartCursor.x;
                        cursor.direction = flowDirection === 'right' ? 'left' : 'right';
                        allTerminals.push({ id: `term-stage-${realStageIndex}-free-input-end`, point: { x: blockEndCursor.x, y: inputTerminal.point.y }, orientation: 'horizontal-shaft', isConnectionPoint: false });
                        allTerminals.push({ id: `term-stage-${realStageIndex}-free-output-end`, point: { x: blockEndCursor.x, y: cursor.y }, orientation: 'horizontal-shaft', isConnectionPoint: false });
                    } else { 
                        cursor.y = blockStartCursor.y + yShift;
                        allTerminals.push({ id: `term-stage-${realStageIndex}-free-input-end`, point: { x: blockEndCursor.x, y: inputTerminal.point.y }, orientation: 'horizontal-shaft', isConnectionPoint: false });
                        allTerminals.push({ id: `term-stage-${realStageIndex}-free-output-start`, point: { x: inputTerminal.point.x, y: cursor.y }, orientation: 'horizontal-shaft', isConnectionPoint: false });
                    }
                }
                allTerminals.push({ id: `term-stage-${realStageIndex}-out`, point: { ...cursor }, orientation: isVertical ? 'vertical-shaft' : 'horizontal-shaft', isConnectionPoint: true });
            } else { 
                const module = selectedModule; const inputs = module.inputs as any; const isTurning = [GearType.Worm, GearType.Bevel].includes(module.type); const isCoaxial = [GearType.Planetary].includes(module.type); const ugoProps: any = { u: module.u || 0 }; if ('z1' in inputs) { ugoProps.z1 = Number(inputs.z1); ugoProps.z2 = Number(inputs.z2); } if ('d1' in inputs) { ugoProps.d1 = Number(inputs.d1); ugoProps.d2 = Number(inputs.d2); }
                let ugoTransform: UgoTransform; let ugoBbox: Bbox; let transformString = '';
                
                const flowDirection = cursor.direction; const inputTerminal: Terminal = { id: `term-stage-${realStageIndex}-in`, point: { ...cursor }, orientation: cursor.direction === 'right' || cursor.direction === 'left' ? 'horizontal-shaft' : 'vertical-shaft', isConnectionPoint: true }; allTerminals.push(inputTerminal);
                if (isParallel) {
                    const width = UGO_PARALLEL_WIDTH; const height = UGO_PARALLEL_HEIGHT; const isLayoutInverted = module.layout === ParallelLayoutType.Inverted; let tx, ty, rot = 0; ugoTransform = { translateX: 0, translateY: 0, rotation: 0, internalOffsetY: 0, rotationCenterX: width / 2, rotationCenterY: height / 2, width, height, scaleX: 1, scaleY: 1 }; const inputShaftYOffset = (isLayoutInverted) ? UGO_PARALLEL_SHAFT_Y2 : UGO_PARALLEL_SHAFT_Y1;
                    if (cursor.direction === 'right' || cursor.direction === 'left') {
                        const endCursorX = cursor.x + ((cursor.direction === 'right') ? width : -width);
                        tx = (cursor.direction === 'right') ? cursor.x : cursor.x - width; ty = cursor.y - inputShaftYOffset; ugoTransform.translateX = tx; ugoTransform.translateY = ty; transformString = `translate(${tx}, ${ty})`; ugoBbox = { x: tx, y: ty, width, height }; const yShift = UGO_PARALLEL_SHAFT_DISTANCE * (isLayoutInverted ? -1 : 1); 
                        if (isReversed) {
                            cursor.x = inputTerminal.point.x; cursor.y += yShift; cursor.direction = cursor.direction === 'right' ? 'left' : 'right';
                            allTerminals.push({ id: `term-stage-${realStageIndex}-free-in`, point: { x: endCursorX, y: inputTerminal.point.y }, orientation: 'horizontal-shaft', isConnectionPoint: false });
                            allTerminals.push({ id: `term-stage-${realStageIndex}-free-out`, point: { x: endCursorX, y: cursor.y }, orientation: 'horizontal-shaft', isConnectionPoint: false });
                        } else { 
                            allTerminals.push({ id: `term-stage-${realStageIndex}-free-in`, point: { x: endCursorX, y: cursor.y }, orientation: 'horizontal-shaft', isConnectionPoint: false }); 
                            cursor.x = endCursorX; cursor.y += yShift; allTerminals.push({ id: `term-stage-${realStageIndex}-free-out`, point: { x: inputTerminal.point.x, y: cursor.y }, orientation: 'horizontal-shaft', isConnectionPoint: false }); 
                        }
                    } else {
                        const endCursorY = cursor.y + ((cursor.direction === 'down') ? width : -width);
                        rot = cursor.direction === 'down' ? 90 : -90; tx = cursor.x; ty = cursor.y; ugoTransform.rotation = rot; ugoTransform.translateX = tx; ugoTransform.translateY = ty; ugoTransform.internalOffsetY = -inputShaftYOffset; transformString = `translate(${tx}, ${ty}) rotate(${rot}) translate(0, ${-inputShaftYOffset})`; const rad = rot * Math.PI / 180; const cos = Math.cos(rad); const sin = Math.sin(rad); const c = [{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}]; const g = c.map(p => { let n={...p}; n.y-=inputShaftYOffset; const rX=n.x*cos-n.y*sin; const rY=n.x*sin+n.y*cos; return {x:tx+rX,y:ty+rY};}); const minRotX = Math.min(...g.map(c=>c.x)); const maxRotX = Math.max(...g.map(c=>c.x)); const minRotY = Math.min(...g.map(c=>c.y)); const maxRotY = Math.max(...g.map(c=>c.y)); ugoBbox = {x:minRotX, y:minRotY, width:maxRotX-minRotX, height:maxRotY-minRotY}; const xShift = UGO_PARALLEL_SHAFT_DISTANCE * (isLayoutInverted ? -1 : 1);
                        if (isReversed) {
                            cursor.y = inputTerminal.point.y; cursor.x += (cursor.direction === 'down') ? -xShift : xShift; cursor.direction = cursor.direction === 'down' ? 'up' : 'down';
                            allTerminals.push({ id: `term-stage-${realStageIndex}-free-in`, point: { x: inputTerminal.point.x, y: endCursorY }, orientation: 'vertical-shaft', isConnectionPoint: false });
                            allTerminals.push({ id: `term-stage-${realStageIndex}-free-out`, point: { x: cursor.x, y: endCursorY }, orientation: 'vertical-shaft', isConnectionPoint: false });
                        } else { 
                            allTerminals.push({ id: `term-stage-${realStageIndex}-free-in`, point: { x: cursor.x, y: endCursorY }, orientation: 'vertical-shaft', isConnectionPoint: false }); 
                            cursor.y = endCursorY; cursor.x += (cursor.direction === 'down') ? -xShift : xShift; 
                            allTerminals.push({ id: `term-stage-${realStageIndex}-free-out`, point: { x: cursor.x, y: inputTerminal.point.y }, orientation: 'vertical-shaft', isConnectionPoint: false }); 
                        }
                    }
                } else {
                    const width=UGO_COAXIAL_TURNING_DIM; const height=UGO_COAXIAL_TURNING_DIM; const centerX=UGO_COAXIAL_TURNING_CENTER_XY; const centerY=UGO_COAXIAL_TURNING_CENTER_XY; let tx, ty, rot=0, scaleX=1, scaleY=1; const inDir = cursor.direction; const outDir = isTurning ? (stage.turn || inDir) : inDir; if(inDir==='right'){tx=cursor.x;ty=cursor.y-centerY;}else if(inDir==='left'){tx=cursor.x-width;ty=cursor.y-centerY;}else if(inDir==='up'){tx=cursor.x-centerX;ty=cursor.y-height;}else{tx=cursor.x-centerX;ty=cursor.y;}
                    if(isTurning){ if(module.type===GearType.Bevel){ if(inDir==='right'&&outDir==='down'){rot=0;scaleX=1;scaleY=1;ugoProps.placement=BevelGearPlacement.LeftBottom;}else if(inDir==='right'&&outDir==='up'){rot=0;scaleX=1;scaleY=-1;ugoProps.placement=BevelGearPlacement.LeftTop;}else if(inDir==='left'&&outDir==='down'){rot=0;scaleX=-1;scaleY=1;ugoProps.placement=BevelGearPlacement.RightBottom;}else if(inDir==='left'&&outDir==='up'){rot=0;scaleX=-1;scaleY=-1;ugoProps.placement=BevelGearPlacement.RightTop;}else if(inDir==='down'&&outDir==='left'){rot=90;scaleX=1;scaleY=1;ugoProps.placement=BevelGearPlacement.LeftBottom;}else if(inDir==='down'&&outDir==='right'){rot=90;scaleX=1;scaleY=-1;ugoProps.placement=BevelGearPlacement.LeftTop;}else if(inDir==='up'&&outDir==='left'){rot=-90;scaleX=1;scaleY=-1;  ugoProps.placement=BevelGearPlacement.LeftBottom;}else if(inDir==='up'&&outDir==='right'){rot=-90;scaleX=1;scaleY=1; ugoProps.placement=BevelGearPlacement.LeftTop;}}
                    else if(module.type===GearType.Worm){if(inDir==='up'||inDir==='down')rot=90;if(inDir==='left')scaleX=-1;}}
                    else if(isCoaxial){if(inDir==='left')rot=180;else if(inDir==='down')rot=90;else if(inDir==='up')rot=-90;}
                    ugoTransform = { translateX: tx, translateY: ty, rotation: rot, internalOffsetY: 0, rotationCenterX: centerX, rotationCenterY: centerY, width, height, scaleX, scaleY }; const tParts=[];tParts.push(`translate(${tx},${ty})`);if(rot!==0)tParts.push(`rotate(${rot},${centerX},${centerY})`);if(scaleX!==1||scaleY!==1){tParts.push(`translate(${centerX},${centerY})`,`scale(${scaleX},${scaleY})`,`translate(${-centerX},${-centerY})`);} transformString=tParts.join(' '); ugoBbox={x:tx,y:ty,width,height};
                    const absCenterX=tx+centerX; const absCenterY=ty+centerY; const nextCursor = { ...cursor }; if(outDir==='right'){ nextCursor.x=absCenterX+centerX; nextCursor.y=absCenterY; } else if (outDir==='left') { nextCursor.x=absCenterX-centerX; nextCursor.y=absCenterY; } else if (outDir==='down') { nextCursor.x=absCenterX; nextCursor.y=absCenterY+centerY; } else { nextCursor.x=absCenterX; nextCursor.y=absCenterY-centerY; } nextCursor.direction = outDir as any;
                    if (module.type === GearType.Worm) { const localTerminals = { h1: {x:0,y:centerY}, h2:{x:width,y:centerY}, v1:{x:centerX,y:0}, v2:{x:centerX,y:height} }; const transformPoint = (p:Point):Point=>{const dx=p.x-centerX,dy=p.y-centerY;const sX=dx*scaleX,sY=dy*scaleY;const rad=rot*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad);const rX=sX*cos-sY*sin,rY=sX*sin+sY*cos;return{x:tx+centerX+rX,y:ty+centerY+rY};}; const globalTerminals = { h1:transformPoint(localTerminals.h1), h2:transformPoint(localTerminals.h2), v1:transformPoint(localTerminals.v1), v2:transformPoint(localTerminals.v2) }; const isRotated = (rot === 90 || rot === -90); const h_orientation: 'horizontal-shaft' | 'vertical-shaft' = isRotated ? 'vertical-shaft' : 'horizontal-shaft'; const v_orientation: 'horizontal-shaft' | 'vertical-shaft' = isRotated ? 'horizontal-shaft' : 'vertical-shaft'; const allGlobalPoints: { point: Point; orientation: 'horizontal-shaft' | 'vertical-shaft'; }[] = [ { point: globalTerminals.h1, orientation: h_orientation }, { point: globalTerminals.h2, orientation: h_orientation }, { point: globalTerminals.v1, orientation: v_orientation }, { point: globalTerminals.v2, orientation: v_orientation } ]; const inputPoint=inputTerminal.point; const outputPoint=nextCursor; const isSamePoint=(p1:Point,p2:Point)=>Math.abs(p1.x-p2.x)<1&&Math.abs(p1.y-p2.y)<1; const freeTerminals = allGlobalPoints.filter(p => !isSamePoint(p.point, inputPoint) && !isSamePoint(p.point, outputPoint)); if(freeTerminals.length === 2) { allTerminals.push({id:`term-stage-${realStageIndex}-free-1`,...freeTerminals[0],isConnectionPoint:false}); allTerminals.push({id:`term-stage-${realStageIndex}-free-2`,...freeTerminals[1],isConnectionPoint:false}); } }
                    cursor = nextCursor;
                }
                allTerminals.push({ id: `term-stage-${realStageIndex}-out`, point: { ...cursor }, orientation: cursor.direction === 'right' || cursor.direction === 'left' ? 'horizontal-shaft' : 'vertical-shaft', isConnectionPoint: true });
                updateBounds(ugoBbox); 
                getUgoSubBboxes(module.type, module.inputs).map(sub => transformLocalBboxToGlobal(sub, ugoTransform)).forEach(gSub => baseLayoutOccupiedSpaces.push({...gSub, ownerId: module.id}));
                ugoDataForCallouts.push({id: module.id, transform: ugoTransform, bbox: ugoBbox, type: module.type, u: module.u || 0, inputs: ugoProps, flowDirection });
                const interactionData = { module, stageIndex: elementIndex, inputDirection: flowDirection, currentTurn: stage.turn };
                flatItems.push({id: module.id, type: 'ugo', centerPoint: {x: ugoBbox.x + ugoBbox.width / 2, y: ugoBbox.y + ugoBbox.height / 2}, data: interactionData });
                let UgoComponent: React.FC<any>|null=null;
                switch(module.type){ case GearType.Gear:UgoComponent=CylindricalGearUGO;break;case GearType.Belt:UgoComponent=BeltDriveUGO;break;case GearType.Chain:UgoComponent=ChainDriveUGO;break;case GearType.ToothedBelt:UgoComponent=ToothedBeltDriveUGO;break; case GearType.Planetary:UgoComponent=PlanetaryGearUGO;const{fixedShaft,zPlanet}=module;const planetaryInputs=inputs as PlanetaryInputParams;let configType=PlanetaryGearConfigType.FixedRing;if(fixedShaft===PlanetaryShaftType.Carrier)configType=PlanetaryGearConfigType.FixedCarrier;if(fixedShaft===PlanetaryShaftType.Sun)configType=PlanetaryGearConfigType.FixedSun;ugoProps.configType=configType;ugoProps.zSun=Number(inputs.zSun);ugoProps.zPlanet=zPlanet||0;
                    let isUgoMirrored=false;if(planetaryInputs.shaftConfig){switch(planetaryInputs.shaftConfig){case PlanetaryConfig.CarrierToSun:case PlanetaryConfig.RingToSun:case PlanetaryConfig.CarrierToRing:isUgoMirrored=true;break;}}ugoProps.mirrored=isUgoMirrored;
                break; case GearType.Worm:UgoComponent=WormDriveUGO;ugoProps.config=inputs.config;ugoProps.cuttingDirection="right";break; case GearType.Bevel:UgoComponent=BevelGearUGO;ugoProps.config=inputs.config;break; }
                const handlers = createInteractionHandlers((e) => handleUgoInteraction(interactionData, e)); const isSelected = selectedUgo?.module.id === module.id || (currentSelectedIndex !== null && flatInteractableItemsRef.current[currentSelectedIndex]?.id === module.id); const isOverlapping = overlappingUgoIds.has(module.id);
                if(UgoComponent) svgElements.push( <g key={module.id} transform={transformString} {...handlers} style={{ cursor: 'pointer' }}> {isSelected && <rect x={-5} y={-5} width={ugoTransform.width + 10} height={ugoTransform.height + 10} fill="rgba(59, 130, 246, 0.2)" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2" rx="5" />} {isOverlapping && <rect x={-5} y={-5} width={ugoTransform.width + 10} height={ugoTransform.height + 10} fill="rgba(239, 68, 68, 0.2)" stroke="rgba(220, 38, 38, 0.7)" strokeWidth="2" rx="5" />} <rect x="0" y="0" width={ugoTransform.width} height={ugoTransform.height} fill="transparent" /> <UgoComponent width={ugoTransform.width} height={ugoTransform.height} {...ugoProps}/> </g> );
            }
            if (isParallel) { previousParallelLayout = selectedModule.layout || ParallelLayoutType.Standard; } else { previousParallelLayout = null; }
            previousCursor = { ...cursor };
        });

        const finalShaftEnd = { ...cursor };
        updateBounds({ x: finalShaftEnd.x, y: finalShaftEnd.y, width: 0, height: 0 });
        allTerminals.push({ id: `term-final-out`, point: finalShaftEnd, orientation: cursor.direction === 'right' || cursor.direction === 'left' ? 'horizontal-shaft' : 'vertical-shaft', isConnectionPoint: false });
        
        const overlaps = detectSchemaOverlaps(baseLayoutOccupiedSpaces);

        if (overlaps.size > 0 && !warningDismissed) {
            const currentOverlapsKey = JSON.stringify(Array.from(overlaps).sort());
            const previousOverlapsKey = JSON.stringify(Array.from(overlappingUgoIds).sort());
            if (currentOverlapsKey !== previousOverlapsKey) { setOverlappingUgoIds(overlaps); setOverlapWarningMessage("Произошло наложение схемы, используйте валы-проставки для обхода проблемного участка"); }
        } else if (overlaps.size === 0 && overlappingUgoIds.size > 0) {
            setOverlappingUgoIds(new Set()); setOverlapWarningMessage(null);
        }
        flatInteractableItemsRef.current = flatItems;
        contentBoundsRef.current = { minX, minY, maxX, maxY };
        return { svgElements, allTerminals, baseLayoutOccupiedSpaces, ugoDataForCallouts };
    };

    const { svgElements, allTerminals, baseLayoutOccupiedSpaces, ugoDataForCallouts } = buildVirtualModel();
    
    const calloutOccupiedSpaces = [...baseLayoutOccupiedSpaces]; 
    const bearingPlacements = new Map<string, { point: Point; orientation: 'horizontal-shaft' | 'vertical-shaft' }>();
    allTerminals.forEach(term => { if (!term.isConnectionPoint) { const key = `${Math.round(term.point.x)},${Math.round(term.point.y)}`; bearingPlacements.set(key, { point: term.point, orientation: term.orientation }); } }); const terminalGroups = new Map<string, Terminal[]>(); allTerminals.forEach(term => { if (term.isConnectionPoint) { const key = `${Math.round(term.point.x)},${Math.round(term.point.y)}`; if (!terminalGroups.has(key)) terminalGroups.set(key, []); terminalGroups.get(key)!.push(term); } }); terminalGroups.forEach((terminals, key) => { const stageOrSpacerTerminal = terminals.some(t => t.id.includes('term-stage-') || t.id.includes('term-spacer-')); if (terminals.length === 2 && stageOrSpacerTerminal) { bearingPlacements.set(key, { point: terminals[0].point, orientation: terminals[0].orientation }); } });
    const bearingElements = Array.from(bearingPlacements.entries()).map(([key, placement]) => { const isHorizontal = placement.orientation === 'horizontal-shaft'; const bearingWidth = isHorizontal ? BEARING_UGO_WIDTH : BEARING_UGO_HEIGHT; const bearingHeight = isHorizontal ? BEARING_UGO_HEIGHT : BEARING_UGO_WIDTH; const bearingX = placement.point.x - bearingWidth / 2; const bearingY = placement.point.y - bearingHeight / 2; const bearingBbox: Bbox = { x: bearingX, y: bearingY, width: bearingWidth, height: bearingHeight }; calloutOccupiedSpaces.push(bearingBbox);
        return ( <g key={`bearing-${key}`} transform={`translate(${bearingX}, ${bearingY})`}> <BearingUGO width={bearingWidth} height={bearingHeight} orientation={placement.orientation} bgColor="white"/> </g> );
    });
    type CalloutCandidate = { path: string; textX: number; textY: number; textAnchor: 'start' | 'end'; penalty: number; penaltyBreakdown: Record<string, number>; textBbox: Bbox; elbowPoint: Point; anchorPoint: Point; };
    const calloutElements = ugoDataForCallouts.map((ugoData, ugoIndex) => {
        const localAnchors = getUgoAnchorCandidates(ugoData.type, ugoData.inputs, ugoData.transform); if (localAnchors.length === 0) return null;
        const candidates: CalloutCandidate[] = [];
        const globalUgoCenter = transformLocalPointToGlobal({ x: ugoData.transform.width / 2, y: ugoData.transform.height / 2 }, ugoData.transform); const calloutText = ugoData.type === 'Источник' ? 'Источник' : `u=${ugoData.u.toFixed(2)}`; const estimatedTextWidth = calloutText.length * CALLOUT_FONT_SIZE * 0.55 + 4;
        const elbowOffsets = [ { x: CALLOUT_ELBOW_LENGTH, y: CALLOUT_ELBOW_LENGTH }, { x: CALLOUT_ELBOW_LENGTH, y: -CALLOUT_ELBOW_LENGTH }, { x: -CALLOUT_ELBOW_LENGTH, y: -CALLOUT_ELBOW_LENGTH }, { x: -CALLOUT_ELBOW_LENGTH, y: CALLOUT_ELBOW_LENGTH }, { x: CALLOUT_ELBOW_LENGTH * 1.8, y: CALLOUT_ELBOW_LENGTH }, { x: CALLOUT_ELBOW_LENGTH * 1.8, y: -CALLOUT_ELBOW_LENGTH }, { x: -CALLOUT_ELBOW_LENGTH * 1.8, y: -CALLOUT_ELBOW_LENGTH }, { x: -CALLOUT_ELBOW_LENGTH * 1.8, y: CALLOUT_ELBOW_LENGTH }, { x: CALLOUT_ELBOW_LENGTH, y: CALLOUT_ELBOW_LENGTH * 1.8 }, { x: CALLOUT_ELBOW_LENGTH, y: -CALLOUT_ELBOW_LENGTH * 1.8 }, { x: -CALLOUT_ELBOW_LENGTH, y: -CALLOUT_ELBOW_LENGTH * 1.8 }, { x: -CALLOUT_ELBOW_LENGTH, y: CALLOUT_ELBOW_LENGTH * 1.8 }, { x: 0, y: CALLOUT_ELBOW_LENGTH * 1.5 }, { x: 0, y: -CALLOUT_ELBOW_LENGTH * 1.5 }, { x: 0, y: CALLOUT_ELBOW_LENGTH * 2.5 }, { x: 0, y: -CALLOUT_ELBOW_LENGTH * 2.5 }, ];
        localAnchors.forEach(localAnchor => { const globalAnchor = transformLocalPointToGlobal(localAnchor, ugoData.transform); elbowOffsets.forEach(offset => { const elbowPoint: Point = { x: globalAnchor.x + offset.x, y: globalAnchor.y + offset.y, }; const shelfVectorX = (elbowPoint.x >= globalUgoCenter.x) ? 1 : -1; if (offset.x * shelfVectorX < 0) { return; } const newShelfLength = estimatedTextWidth; const shelfEndPoint: Point = { x: elbowPoint.x + shelfVectorX * newShelfLength, y: elbowPoint.y, }; const path = `M ${shelfEndPoint.x},${shelfEndPoint.y} L ${elbowPoint.x},${elbowPoint.y} L ${globalAnchor.x},${globalAnchor.y}`; const textAnchor = (shelfVectorX === 1) ? 'start' : 'end'; const textPadding = 4; const textX = (shelfVectorX === 1) ? elbowPoint.x + textPadding : elbowPoint.x - textPadding; const textY = elbowPoint.y - CALLOUT_TEXT_Y_OFFSET; const textBbox: Bbox = { x: (shelfVectorX === 1) ? elbowPoint.x : elbowPoint.x - newShelfLength, y: elbowPoint.y - CALLOUT_TEXT_HEIGHT, width: newShelfLength, height: CALLOUT_TEXT_HEIGHT, }; const lineBbox: Bbox = { x: Math.min(globalAnchor.x, elbowPoint.x, shelfEndPoint.x), y: Math.min(globalAnchor.y, elbowPoint.y, shelfEndPoint.y), width: Math.max(globalAnchor.x, elbowPoint.x, shelfEndPoint.x) - Math.min(globalAnchor.x, elbowPoint.x, shelfEndPoint.x), height: Math.max(globalAnchor.y, elbowPoint.y, shelfEndPoint.y) - Math.min(globalAnchor.y, elbowPoint.y, shelfEndPoint.y), }; let penalty = 0; if (offset.x === 0) { penalty += 150; } const PROXIMITY_THRESHOLD = 20; const PROXIMITY_PENALTY_MULTIPLIER = 0.8; calloutOccupiedSpaces.forEach(space => { if (space.width === 0 || space.height === 0) return; const textIntersection = calculateIntersectionArea(textBbox, space); if (textIntersection > 0) { penalty += textIntersection * 50; } else { const dx = Math.max(0, space.x - (textBbox.x + textBbox.width), textBbox.x - (space.x + space.width)); const dy = Math.max(0, space.y - (textBbox.y + textBbox.height), textBbox.y - (space.y + space.height)); const distance = Math.hypot(dx, dy); if (distance < PROXIMITY_THRESHOLD) { penalty += (PROXIMITY_THRESHOLD - distance) * PROXIMITY_PENALTY_MULTIPLIER; } } penalty += calculateIntersectionArea(lineBbox, space) * 2; }); const leaderLength = Math.hypot(elbowPoint.x - globalAnchor.x, elbowPoint.y - globalAnchor.y); penalty += leaderLength * 0.2; const expandedUgoBbox = { x: ugoData.bbox.x - 5, y: ugoData.bbox.y - 5, width: ugoData.bbox.width + 10, height: ugoData.bbox.height + 10 }; const elbowBbox = { x: elbowPoint.x - 2, y: elbowPoint.y - 2, width: 4, height: 4 }; if (calculateIntersectionArea(elbowBbox, expandedUgoBbox) > 0) { penalty += 200; } candidates.push({ path, textX, textY, textAnchor, penalty, textBbox, elbowPoint, anchorPoint: globalAnchor, penaltyBreakdown:{} }); }); });
        if (candidates.length === 0) return null; candidates.sort((a, b) => a.penalty - b.penalty); const bestCandidate = candidates[0]; const textBboxWithBuffer: Bbox = { x: bestCandidate.textBbox.x - 5, y: bestCandidate.textBbox.y - 5, width: bestCandidate.textBbox.width + 10, height: bestCandidate.textBbox.height + 10, }; calloutOccupiedSpaces.push(textBboxWithBuffer);
        return ( <g key={`callout-for-${ugoData.id}`}> <path d={bestCandidate.path} stroke={CALLOUT_COLOR} strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)"/> <text x={bestCandidate.textX} y={bestCandidate.textY} fontFamily="Calibri, sans-serif" fontSize={CALLOUT_FONT_SIZE} fill={CALLOUT_COLOR} textAnchor={bestCandidate.textAnchor} dominantBaseline="auto" > {calloutText} </text> </g> );
    });
    
    const { minX: finalMinX, minY: finalMinY, maxX: finalMaxX, maxY: finalMaxY } = contentBoundsRef.current;
    const contentWidth = finalMaxX - finalMinX;
    const contentHeight = finalMaxY - finalMinY;
    const finalSvgWidth = contentWidth > 0 ? contentWidth + 2 * SVG_PADDING : 800;
    const finalSvgHeight = contentHeight > 0 ? contentHeight + 2 * SVG_PADDING : 600;
    const viewboxTransform = `translate(${-finalMinX + SVG_PADDING}, ${-finalMinY + SVG_PADDING})`;
    viewboxTransformRef.current = { tx: -finalMinX + SVG_PADDING, ty: -finalMinY + SVG_PADDING };


    const { containerRef, transform, panHandlers, zoomIn, zoomOut, fitToScreen, view, setView, calculateCenterOnPoint } = usePanAndZoom({ contentWidth: finalSvgWidth, contentHeight: finalSvgHeight });
    
    useEffect(() => {
        const timer = setTimeout(() => {
            fitToScreen();
        }, 150);
        return () => clearTimeout(timer);
    }, [schemeElements, fitToScreen]);
    
    const handleGoToWorkbench = () => {
        if (!selectedUgo) return;
        if (selectedUgo.module.type === 'Источник') {
            onBack();
        } else if ('id' in selectedUgo.module) {
            onNavigateToModule(selectedUgo.module.id);
        }
        handleCloseMenus();
    };

    const handleNavigation = useCallback((direction: 'next' | 'prev') => {
        if (currentSelectedIndex === null) return;
        const totalItems = flatInteractableItemsRef.current.length;
        if (totalItems === 0) return;
    
        const nextIndex = (currentSelectedIndex + (direction === 'next' ? 1 : -1) + totalItems) % totalItems;
        const nextItem = flatInteractableItemsRef.current[nextIndex];
        if (!nextItem) return;
    
        const { centerPoint, data } = nextItem;
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
    
        const transformedCenterPoint = { x: centerPoint.x + viewboxTransformRef.current.tx, y: centerPoint.y + viewboxTransformRef.current.ty, };
        const finalViewCoords = calculateCenterOnPoint(transformedCenterPoint.x, transformedCenterPoint.y);
        
        const MENU_HORIZONTAL_POSITION_FACTOR = 0.7;
        const menuX = containerRect.left + containerRect.width * MENU_HORIZONTAL_POSITION_FACTOR;
        const menuY = containerRect.top + containerRect.height / 2;
    
        setView(prev => ({ ...prev, x: finalViewCoords.x, y: finalViewCoords.y }));
    
        setCurrentSelectedIndex(nextIndex);
        if (nextItem.type === 'spacer') {
            setSelectedSpacer({ ...nextItem.data, index: nextIndex });
            setSpacerMenuPosition({ x: menuX, y: menuY });
            setSelectedUgo(null);
            setMenuPosition(null);
        } else {
            const stage = data.stageIndex >= 0 ? schemeElements[data.stageIndex] : null;
            const isMultiModuleStage = stage && 'modules' in stage && Array.isArray(stage.modules) && stage.modules.length > 1;
            setSelectedUgo({...data, isMultiModuleStage: !!isMultiModuleStage});
            setMenuPosition({ x: menuX, y: menuY });
            setSelectedSpacer(null);
            setSpacerMenuPosition(null);
        }
    }, [currentSelectedIndex, calculateCenterOnPoint, setView, containerRef, schemeElements]);

    const handleResetScheme = () => {
        if (window.confirm('Вы уверены, что хотите сбросить все изменения и вернуться к исходной схеме?')) {
          setSchemeElements(initialSchemeElements);
          handleCloseMenus();
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (menuPosition || spacerMenuPosition) {
                if (e.key === 'ArrowRight') handleNavigation('next');
                else if (e.key === 'ArrowLeft') handleNavigation('prev');
                else if (e.key === 'Escape') handleCloseMenus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [menuPosition, spacerMenuPosition, handleNavigation, handleCloseMenus]);

    return (
        <div className="w-full h-full flex flex-col bg-gray-200 relative overflow-hidden">
             <ProjectActionsModal
                isOpen={isProjectActionsModalOpen}
                onClose={() => setIsProjectActionsModalOpen(false)}
                onSave={onSaveProject}
                onLoadClick={onLoadClick}
                context="scheme"
                svgContainerRef={ref as React.RefObject<HTMLDivElement>}
                schemeElements={schemeElements}
                calculationData={calculationData}
                engineParams={engineParams}
            />
             <div className="absolute top-2.5 left-2.5 z-20 flex items-center space-x-2">
                <button 
                    onClick={onBack} 
                    className="p-2 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-300 rounded-full shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Назад к расчетам"
                    aria-label="Назад к расчетам"
                >
                    <BackArrowIcon />
                </button>
                <span className="text-sm font-semibold text-gray-700 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow">Сборщик схем</span>
            </div>
            <div ref={containerRef} className="w-full flex-grow bg-white overflow-hidden relative touch-none" {...panHandlers}>
                <div className="absolute top-0 left-0" style={{ transformOrigin: '0 0', transform }}>
                    <div ref={ref} style={{ width: finalSvgWidth, height: finalSvgHeight, backgroundColor: 'white' }}>
                        <svg
                            width={finalSvgWidth}
                            height={finalSvgHeight}
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill={CALLOUT_COLOR} />
                                </marker>
                            </defs>
                            <g transform={viewboxTransform}>
                                {svgElements}
                                {bearingElements}
                                {calloutElements}
                            </g>
                        </svg>
                    </div>
                </div>

                <div className="absolute top-2.5 right-2.5 z-20 flex flex-col space-y-2">
                    <button onClick={onOpenInfoModal} className="p-2 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-300 rounded-full shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" title="Справка" aria-label="Справка">
                        <InfoIcon />
                    </button>
                    <button onClick={handleResetScheme} className="p-2 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-300 rounded-full shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" title="Сбросить схему к исходной" aria-label="Сбросить схему">
                        <EraserIcon />
                    </button>
                    <button
                        onClick={() => setIsProjectActionsModalOpen(true)}
                        className="p-2 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-300 rounded-full shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Проект и Экспорт"
                        aria-label="Проект и Экспорт"
                    >
                        <FolderIcon />
                    </button>
                </div>
                
                <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onFitScreen={fitToScreen} />
                
                {overlapWarningMessage && !warningDismissed && (
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 p-3 max-w-md w-11/12 rounded-md bg-red-100 text-red-700 text-sm font-semibold shadow-lg flex justify-between items-center">
                        <span>{overlapWarningMessage}</span>
                        <button onClick={clearOverlapWarning} className="ml-2 text-red-800 hover:text-red-900">&times;</button>
                    </div>
                )}
                 {selectedUgo && menuPosition && (
                    <UgoContextMenu
                        engineParams={engineParams}
                        moduleData={selectedUgo.module}
                        position={menuPosition}
                        onClose={handleCloseMenus}
                        onUpdateLayout={(newLayout) => handleUpdateLayout(selectedUgo.stageIndex, newLayout)}
                        onUpdateReversed={(isReversed) => handleUpdateReversed(selectedUgo.stageIndex, isReversed)}
                        onUpdateTurnDirection={(newDir) => handleUpdateTurnDirection(selectedUgo.stageIndex, newDir)}
                        inputDirection={selectedUgo.inputDirection}
                        currentTurnDirection={selectedUgo.currentTurn}
                        onAddSpacer={(position) => handleAddSpacer(selectedUgo.stageIndex, position)}
                        currentIndex={currentSelectedIndex}
                        totalItems={flatInteractableItemsRef.current.length}
                        onNavigate={handleNavigation}
                        isMobileView={isMobileView}
                        isMultiModuleStage={selectedUgo.isMultiModuleStage}
                        isCurrentActive={'isSelected' in selectedUgo.module ? selectedUgo.module.isSelected : false}
                        onMakeActive={() => 'id' in selectedUgo.module && handleMakeModuleActive(selectedUgo.stageIndex, selectedUgo.module.id)}
                        onGoToWorkbench={handleGoToWorkbench}
                        moduleInDirection={'moduleInDirection' in selectedUgo.module ? selectedUgo.module.moduleInDirection : undefined}
                        moduleOutDirection={'moduleOutDirection' in selectedUgo.module ? selectedUgo.module.moduleOutDirection : undefined}
                        moduleInOrientation={'moduleInOrientation' in selectedUgo.module ? selectedUgo.module.moduleInOrientation : undefined}
                        moduleOutOrientation={'moduleOutOrientation' in selectedUgo.module ? selectedUgo.module.moduleOutOrientation : undefined}
                    />
                )}
                 {selectedSpacer && spacerMenuPosition && (
                    <SpacerContextMenu
                        spacer={selectedSpacer}
                        position={spacerMenuPosition}
                        onClose={handleCloseMenus}
                        onUpdate={handleUpdateSpacer}
                        onDelete={handleDeleteSpacer}
                        currentIndex={currentSelectedIndex}
                        totalItems={flatInteractableItemsRef.current.length}
                        onNavigate={handleNavigation}
                        isMobileView={isMobileView}
                    />
                 )}
            </div>
            
        </div>
    );
});