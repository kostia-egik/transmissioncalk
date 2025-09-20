import React, { useState, useCallback } from 'react';
import { SchemeElement, SpacerShaft, StageCalculationData } from '../types';
import { SelectedUgoData } from './useSchemeLayout';

interface UseSchemeInteractionProps {
    containerRef: React.RefObject<HTMLDivElement>;
    smoothPanTo: (x: number, y: number) => void;
    calculateCenterOnPoint: (x: number, y: number) => { x: number, y: number };
    flatInteractableItemsRef: React.MutableRefObject<any[]>;
    viewboxTransformRef: React.MutableRefObject<{ tx: number; ty: number; }>;
    schemeElements: SchemeElement[];
}

export const useSchemeInteraction = ({
    containerRef,
    smoothPanTo,
    calculateCenterOnPoint,
    flatInteractableItemsRef,
    viewboxTransformRef,
    schemeElements
}: UseSchemeInteractionProps) => {
    const [selectedUgo, setSelectedUgo] = useState<SelectedUgoData | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const [selectedSpacer, setSelectedSpacer] = useState<(SpacerShaft & { index: number }) | null>(null);
    const [spacerMenuPosition, setSpacerMenuPosition] = useState<{ x: number; y: number } | null>(null);
    
    const [overlappingUgoIds, setOverlappingUgoIds] = useState<Set<string>>(new Set());
    const [overlapWarningMessage, setOverlapWarningMessage] = useState<string | null>(null);
    const [warningDismissed, setWarningDismissed] = useState(false);
    
    const [currentSelectedIndex, setCurrentSelectedIndex] = useState<number | null>(null);

    const clearOverlapWarning = useCallback(() => {
        if (overlappingUgoIds.size > 0 || overlapWarningMessage) {
            setWarningDismissed(true);
            setOverlappingUgoIds(new Set());
            setOverlapWarningMessage(null);
        }
    }, [overlappingUgoIds.size, overlapWarningMessage]);

    const handleCloseMenus = useCallback(() => {
        setSelectedUgo(null);
        setMenuPosition(null);
        setSelectedSpacer(null);
        setSpacerMenuPosition(null);
        setCurrentSelectedIndex(null);
    }, []);

    const handleUgoInteraction = useCallback((
        data: SelectedUgoData,
        event: React.MouseEvent | React.TouchEvent
    ) => {
        clearOverlapWarning();
        event.preventDefault();
        event.stopPropagation();
        
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const flatItem = flatInteractableItemsRef.current.find(item => item.id === data.module.id);
        if (!flatItem) return;

        const { centerPoint } = flatItem;
        const transformedCenterPoint = {
            x: centerPoint.x + viewboxTransformRef.current.tx,
            y: centerPoint.y + viewboxTransformRef.current.ty,
        };
        
        const finalViewCoords = calculateCenterOnPoint(transformedCenterPoint.x, transformedCenterPoint.y);
        smoothPanTo(finalViewCoords.x, finalViewCoords.y);
        
        const index = flatInteractableItemsRef.current.findIndex(item => item.id === data.module.id);
        setCurrentSelectedIndex(index !== -1 ? index : null);
        
        const MENU_HORIZONTAL_POSITION_FACTOR = 0.7;
        const menuX = containerRect.left + containerRect.width * MENU_HORIZONTAL_POSITION_FACTOR;
        const menuY = containerRect.top + containerRect.height / 2;
        
        setSelectedUgo(data);
        setMenuPosition({ x: menuX, y: menuY });
        setSelectedSpacer(null);
        setSpacerMenuPosition(null);
    }, [containerRef, calculateCenterOnPoint, smoothPanTo, clearOverlapWarning, flatInteractableItemsRef, viewboxTransformRef]);

    const handleSpacerInteraction = useCallback((
        event: React.MouseEvent | React.TouchEvent,
        spacer: SpacerShaft & { index: number }
    ) => {
        clearOverlapWarning();
        event.preventDefault();
        event.stopPropagation();
        
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const flatItem = flatInteractableItemsRef.current.find(item => item.id === spacer.id);
        if (flatItem && flatItem.centerPoint) {
            const transformedCenterPoint = {
                x: flatItem.centerPoint.x + viewboxTransformRef.current.tx,
                y: flatItem.centerPoint.y + viewboxTransformRef.current.ty,
            };
            const finalViewCoords = calculateCenterOnPoint(transformedCenterPoint.x, transformedCenterPoint.y);
            smoothPanTo(finalViewCoords.x, finalViewCoords.y);
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
    }, [containerRef, calculateCenterOnPoint, smoothPanTo, clearOverlapWarning, flatInteractableItemsRef, viewboxTransformRef]);

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
    
        smoothPanTo(finalViewCoords.x, finalViewCoords.y);
    
        setCurrentSelectedIndex(nextIndex);
        if (nextItem.type === 'spacer') {
            setSelectedSpacer({ ...nextItem.data });
            setSpacerMenuPosition({ x: menuX, y: menuY });
            setSelectedUgo(null);
            setMenuPosition(null);
        } else {
            const stage = data.stageIndex >= 0 ? schemeElements[data.stageIndex] : null;
            const isMultiModuleStage = stage && 'modules' in stage && Array.isArray(stage.modules) && (stage as StageCalculationData).modules.length > 1;
            setSelectedUgo({...data, isMultiModuleStage: !!isMultiModuleStage});
            setMenuPosition({ x: menuX, y: menuY });
            setSelectedSpacer(null);
            setSpacerMenuPosition(null);
        }
    }, [currentSelectedIndex, calculateCenterOnPoint, smoothPanTo, containerRef, schemeElements, flatInteractableItemsRef, viewboxTransformRef]);


    return {
        selectedUgo,
        setSelectedUgo,
        menuPosition,
        selectedSpacer,
        spacerMenuPosition,
        currentSelectedIndex,
        overlappingUgoIds,
        setOverlappingUgoIds,
        overlapWarningMessage,
        setOverlapWarningMessage,
        warningDismissed,
        setWarningDismissed,
        handleCloseMenus,
        handleUgoInteraction,
        handleSpacerInteraction,
        handleNavigation,
        clearOverlapWarning,
    };
};