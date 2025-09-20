import React, { useState, useLayoutEffect, useRef, useCallback, useEffect, forwardRef } from 'react';
// FIX: Import ModuleCalculationData to resolve 'Cannot find name' errors.
import { EngineParams, StageCalculationData, SchemeElement, ModuleCalculationData, ParallelLayoutType } from '../types';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import ZoomControls from '../components/ZoomControls';
import { UgoContextMenu } from '../components/UgoContextMenu';
import { SpacerContextMenu } from '../components/SpacerContextMenu';
import { ProjectActionsModal } from '../components/ProjectActionsModal';
import { SchemeBuilderHeader } from '../components/scheme-builder/SchemeBuilderHeader';
import { useSchemeLayout } from '../hooks/useSchemeLayout';
import { useSchemeInteraction } from '../hooks/useSchemeInteraction';


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


export const SchemeBuilderPage = forwardRef<HTMLDivElement, SchemeBuilderPageProps>(({ 
    engineParams, initialSchemeElements, schemeElements, calculationData, setSchemeElements, onBack, 
    onNavigateToModule, onModuleSelect, onSaveProject, onLoadClick, onOpenInfoModal
}, ref) => {
    const [isProjectActionsModalOpen, setIsProjectActionsModalOpen] = useState(false);
    const [contentDimensions, setContentDimensions] = useState({ width: 800, height: 600 });
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1024);

    const flatInteractableItemsRef = useRef<any[]>([]);
    const viewboxTransformRef = useRef({ tx: 0, ty: 0 });

    useLayoutEffect(() => {
        const checkSize = () => setIsMobileView(window.innerWidth <= 1024);
        window.addEventListener('resize', checkSize);
        checkSize();
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    const { 
        containerRef, 
        transform, 
        panHandlers, 
        zoomIn, 
        zoomOut, 
        fitToScreen,
        smoothPanTo,
        calculateCenterOnPoint
    } = usePanAndZoom({ 
        contentWidth: contentDimensions.width, 
        contentHeight: contentDimensions.height 
    });

    const {
        selectedUgo,
        setSelectedUgo,
        menuPosition,
        selectedSpacer,
        spacerMenuPosition,
        currentSelectedIndex,
        overlappingUgoIds,
        overlapWarningMessage,
        handleCloseMenus,
        handleUgoInteraction,
        handleSpacerInteraction,
        handleNavigation,
        clearOverlapWarning,
        setOverlappingUgoIds,
        setOverlapWarningMessage,
        warningDismissed,
        setWarningDismissed
    } = useSchemeInteraction({
        containerRef,
        // FIX: Removed 'setView' property as it does not exist in 'UseSchemeInteractionProps'.
        smoothPanTo,
        calculateCenterOnPoint,
        flatInteractableItemsRef,
        viewboxTransformRef,
        schemeElements
    });


    const { 
        svgElements,
        bearingElements,
        calloutElements,
        finalSvgWidth,
        finalSvgHeight,
        viewboxTransform,
        detectedOverlaps,
    } = useSchemeLayout({
        schemeElements,
        engineParams,
        selectedUgo,
        selectedSpacer,
        currentSelectedIndex,
        overlappingUgoIds,
        onUgoInteraction: handleUgoInteraction,
        onSpacerInteraction: handleSpacerInteraction,
        flatInteractableItemsRef,
        viewboxTransformRef
    });

    useEffect(() => {
        if (finalSvgWidth !== contentDimensions.width || finalSvgHeight !== contentDimensions.height) {
            setContentDimensions({ width: finalSvgWidth, height: finalSvgHeight });
        }
    }, [finalSvgWidth, finalSvgHeight, contentDimensions.width, contentDimensions.height]);

    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (detectedOverlaps.size > 0 && !warningDismissed) {
            const currentOverlapsKey = JSON.stringify(Array.from(detectedOverlaps).sort());
            const previousOverlapsKey = JSON.stringify(Array.from(overlappingUgoIds).sort());
            if (currentOverlapsKey !== previousOverlapsKey) {
                setOverlappingUgoIds(detectedOverlaps);
                setOverlapWarningMessage("Произошло наложение схемы, используйте валы-проставки для обхода проблемного участка");
            }
        } else if (detectedOverlaps.size === 0 && overlappingUgoIds.size > 0) {
            setOverlappingUgoIds(new Set());
            setOverlapWarningMessage(null);
        }
    }, [detectedOverlaps, warningDismissed, overlappingUgoIds, setOverlappingUgoIds, setOverlapWarningMessage]);


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
    }, [overlappingUgoIds, setWarningDismissed, setOverlappingUgoIds, setOverlapWarningMessage]);

    useEffect(() => {
        if (selectedUgo) {
            const element = schemeElements[selectedUgo.stageIndex];
            if (element && 'modules' in element && element.modules) {
                const stage = element as StageCalculationData;
                const currentModuleData = (stage.modules as ModuleCalculationData[]).find(m => m.id === selectedUgo.module.id);
                if (currentModuleData) { setSelectedUgo(prev => { if (prev && prev.module !== currentModuleData) { return { ...prev, module: currentModuleData }; } return prev; }); }
            }
        }
    }, [schemeElements, selectedUgo, setSelectedUgo]);

    const handleUpdateLayout = useCallback((stageIndex: number, newLayout: ParallelLayoutType) => {
        const newData = JSON.parse(JSON.stringify(schemeElements));
        const element = newData[stageIndex];
        if (element && 'modules' in element && element.modules) {
            (element.modules as ModuleCalculationData[]).forEach(module => { module.layout = newLayout; });
        }
        setSchemeElements(newData);
    }, [schemeElements, setSchemeElements]);

    const handleUpdateReversed = useCallback((stageIndex: number, isReversed: boolean) => {
        const newData = JSON.parse(JSON.stringify(schemeElements));
        const element = newData[stageIndex];
        if (element && 'modules' in element && element.modules) {
            (element.modules as ModuleCalculationData[]).forEach(module => { module.isReversed = isReversed; });
        }
        setSchemeElements(newData);
    }, [schemeElements, setSchemeElements]);

    const handleUpdateTurnDirection = useCallback((stageIndex: number, newDirection: 'up' | 'down' | 'left' | 'right') => {
        const newData = [...schemeElements];
        const stage = newData[stageIndex];
        if (stage) { newData[stageIndex] = { ...stage, turn: newDirection }; }
        setSchemeElements(newData);
        setSelectedUgo(prev => { if (prev && prev.stageIndex === stageIndex) { return { ...prev, currentTurn: newDirection }; } return prev; });
    }, [schemeElements, setSchemeElements, setSelectedUgo]);

    const handleMakeModuleActive = useCallback((stageIndex: number, moduleId: string) => {
        const newSchemeData = [...schemeElements];
        const element = newSchemeData[stageIndex];
        if (element && 'modules' in element && element.modules) {
            const stage = element as StageCalculationData;
            stage.modules.forEach(m => { m.isSelected = m.id === moduleId; });
            setSchemeElements(newSchemeData);
        }
        const realStageIndex = schemeElements.slice(0, stageIndex + 1).filter(e => !('type' in e && e.type === 'spacer')).length - 1;
        if (realStageIndex >= 0) {
            onModuleSelect(realStageIndex, moduleId);
        }
        handleCloseMenus();
    }, [schemeElements, setSchemeElements, onModuleSelect, handleCloseMenus]);

    const handleAddSpacer = useCallback((stageIndex: number, position: 'before' | 'after') => {
        const newSpacer: SchemeElement = { id: `spacer-${Date.now()}`, type: 'spacer', length: 50, style: 'solid', };
        const newData = [...schemeElements];
        const insertIndex = position === 'before' ? stageIndex : stageIndex + 1;
        newData.splice(insertIndex, 0, newSpacer);
        setSchemeElements(newData);
        if (position === 'before' && selectedUgo) {
            setSelectedUgo(prev => prev ? { ...prev, stageIndex: prev.stageIndex + 1 } : null);
        }
    }, [schemeElements, setSchemeElements, selectedUgo]);
    
    const handleUpdateSpacer = useCallback((index: number, newProps: Partial<SchemeElement>) => {
        const newData = [...schemeElements];
        const spacerToUpdate = newData[index];
        if (spacerToUpdate && 'type' in spacerToUpdate && spacerToUpdate.type === 'spacer') {
            const updatedSpacer = { ...spacerToUpdate, ...newProps };
            newData[index] = updatedSpacer;
            setSchemeElements(newData);
        }
    }, [schemeElements, setSchemeElements]);
    
    const handleDeleteSpacer = useCallback((index: number) => { 
        setSchemeElements(schemeElements.filter((_, i) => i !== index)); 
        handleCloseMenus(); 
    }, [schemeElements, setSchemeElements, handleCloseMenus]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            fitToScreen();
        }, 150);
        return () => clearTimeout(timer);
    }, [schemeElements, fitToScreen]);
    
    const handleGoToWorkbench = useCallback(() => {
        if (!selectedUgo) return;
        if (selectedUgo.module.type === 'Источник') {
            onBack();
        } else if ('id' in selectedUgo.module) {
            onNavigateToModule(selectedUgo.module.id);
        }
        handleCloseMenus();
    }, [selectedUgo, onBack, onNavigateToModule, handleCloseMenus]);

    const handleResetScheme = useCallback(() => {
        if (window.confirm('Вы уверены, что хотите сбросить все изменения и вернуться к исходной схеме?')) {
          setSchemeElements(initialSchemeElements);
          handleCloseMenus();
        }
    }, [initialSchemeElements, setSchemeElements, handleCloseMenus]);
    
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
            <SchemeBuilderHeader
                onBack={onBack}
                onOpenInfoModal={onOpenInfoModal}
                onResetScheme={handleResetScheme}
                onOpenProjectModal={() => setIsProjectActionsModalOpen(true)}
            />
             <div ref={containerRef} className="w-full flex-grow bg-white overflow-hidden relative touch-none" {...panHandlers}>
                <div className="absolute top-0 left-0" style={{ transformOrigin: '0 0', transform }}>
                    <div ref={ref} style={{ width: finalSvgWidth, height: finalSvgHeight, backgroundColor: 'white' }}>
                        <svg
                            width={finalSvgWidth}
                            height={finalSvgHeight}
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <radialGradient id="radial-glow-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                    <stop offset="0%" style={{stopColor: 'rgba(59, 130, 246, 0.7)', stopOpacity: 1}} />
                                    <stop offset="100%" style={{stopColor: 'rgba(59, 130, 246, 0)', stopOpacity: 1}} />
                                </radialGradient>
                                <filter id="overlap-glow" x="-50%" y="-50%" width="200%" height="200%">
                                  <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#EF4444" floodOpacity="0.9">
                                    <animate 
                                        attributeName="stdDeviation" 
                                        values="1;6;1" 
                                        dur="1.5s" 
                                        repeatCount="indefinite"
                                        keyTimes="0;0.5;1"
                                        calcMode="spline"
                                        keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                                    />
                                  </feDropShadow>
                                </filter>
                                <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="#475569" />
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
                        onUpdateTurnDirection={(newDirection) => handleUpdateTurnDirection(selectedUgo.stageIndex, newDirection)}
                        inputDirection={selectedUgo.inputDirection}
                        currentTurnDirection={selectedUgo.currentTurn}
                        isMultiModuleStage={selectedUgo.isMultiModuleStage}
                        isCurrentActive={!('isSelected' in selectedUgo.module) || !selectedUgo.module.isSelected}
                        onMakeActive={() => 'id' in selectedUgo.module && handleMakeModuleActive(selectedUgo.stageIndex, selectedUgo.module.id)}
                        onGoToWorkbench={handleGoToWorkbench}
                        moduleInDirection={('moduleInDirection' in selectedUgo.module) ? selectedUgo.module.moduleInDirection : undefined}
                        moduleOutDirection={('moduleOutDirection' in selectedUgo.module) ? selectedUgo.module.moduleOutDirection : undefined}
                        moduleInOrientation={('moduleInOrientation' in selectedUgo.module) ? selectedUgo.module.moduleInOrientation : undefined}
                        moduleOutOrientation={('moduleOutOrientation' in selectedUgo.module) ? selectedUgo.module.moduleOutOrientation : undefined}
                        // FIX: Added missing props to satisfy the UgoContextMenuProps interface.
                        onAddSpacer={(position) => handleAddSpacer(selectedUgo.stageIndex, position)}
                        currentIndex={currentSelectedIndex}
                        totalItems={flatInteractableItemsRef.current.length}
                        onNavigate={handleNavigation}
                        isMobileView={isMobileView}
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
