
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EngineParams, StageCalculationData, FinalCalculationResults, ShaftOrientation, GearType } from '../types';
import Button from '../components/Button';
import { getRotationIconPath } from '../constants';
import { Tooltip } from '../components/Tooltip';
import { TooltipContent } from '../tooltip-data';
import { getGearCategory } from '../utils/gear';
import { EngineParamsEditor } from '../components/workbench/EngineParamsEditor';
import { StageEditor } from '../components/workbench/StageEditor';
import { FinalResultsDisplay } from '../components/workbench/FinalResultsDisplay';


interface WorkbenchPageProps {
  engineParams: EngineParams;
  setEngineParams: (params: EngineParams) => void;
  resetEngineParams: () => void;
  calculationData: StageCalculationData[];
  onCalculationDataChange: (data: StageCalculationData[]) => void;
  onResetConfiguration: () => void;
  finalResults: FinalCalculationResults | null;
  showFinalResults: boolean;
  isSchemeBuilt: boolean;
  onBuildNewScheme: () => void;
  onGoToSchemeView: (options?: { refresh?: boolean }) => void;
  calculationDataSnapshot: string | null;
  showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  finalResultsRef: React.Ref<HTMLDivElement>;
  scrollToModuleId: string | null;
  onScrollComplete: () => void;
}

const WorkbenchPage: React.FC<WorkbenchPageProps> = React.memo(({
  engineParams, setEngineParams, resetEngineParams, calculationData, onCalculationDataChange,
  onResetConfiguration, finalResults, showFinalResults, isSchemeBuilt, onBuildNewScheme, onGoToSchemeView, 
  calculationDataSnapshot, showNotification, finalResultsRef, scrollToModuleId, onScrollComplete
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showChangesDialog, setShowChangesDialog] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState<{ content: TooltipContent; targetRect: DOMRect } | null>(null);
    const [highlightedModuleId, setHighlightedModuleId] = useState<string | null>(null);
    const [highlightPriority, setHighlightPriority] = useState(false);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (scrollToModuleId) {
            setHighlightedModuleId(scrollToModuleId);
            setHighlightPriority(true);

            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
            }

            // Set a timer to remove the highlight after 5 seconds.
            highlightTimerRef.current = setTimeout(() => {
                setHighlightPriority(false);
                setHighlightedModuleId(null);
            }, 5000);
        }
    }, [scrollToModuleId]);

    // This separate effect ensures the timer is cleaned up only when the component unmounts,
    // preventing the scroll-completion logic from cancelling the highlight timer prematurely.
    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
            }
        };
    }, []);
    
    const handleParamClick = useCallback((content: TooltipContent, target: HTMLElement) => {
        const currentTargetRect = target.getBoundingClientRect();
        setActiveTooltip(prev => {
            if (prev && prev.content.title === content.title) {
                return null;
            }
            return { content, targetRect: currentTargetRect };
        });
    }, []);

    const handleCloseTooltip = useCallback(() => {
        setActiveTooltip(null);
    }, []);
    
    const handleParamChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newParams = { ...engineParams, [name]: name.includes("Rpm") || name.includes("Torque") ? parseFloat(value) || 0 : value };
        setEngineParams(newParams);
        onCalculationDataChange(calculationData); // Trigger recalculation
        setErrors(prev => ({ ...prev, [name]: '' }));
    }, [engineParams, setEngineParams, onCalculationDataChange, calculationData]);

    const addStage = useCallback((index?: number) => {
        const stageId = `stage-${Date.now()}-${Math.random()}`;
        const newStage: StageCalculationData = {
            id: stageId,
            stageName: '', // Will be recalculated
            modules: [{
                id: `${stageId}-module-0`,
                type: GearType.Gear,
                inputs: { z1: '', z2: '', m: '1', eta: '0.98' },
                isSelected: true,
            }]
        };
    
        const newData = [...calculationData];
        if (index !== undefined) {
            newData.splice(index, 0, newStage);
        } else {
            newData.push(newStage);
        }
    
        const finalData = newData.map((stage, i) => ({
            ...stage,
            stageName: `Валы ${i + 1} и ${i + 2}`
        }));
        onCalculationDataChange(finalData);
    }, [calculationData, onCalculationDataChange]);

    const rotationIconPath = getRotationIconPath(engineParams.initialDirection, engineParams.initialOrientation);
    const rotationIconAltText = `Направление: ${engineParams.initialDirection}, Ориетация: ${engineParams.initialOrientation === ShaftOrientation.Horizontal ? 'Горизонтальный' : 'Вертикальный'}`;

    const handleBuildSchemeClick = useCallback(() => {
        if (isSchemeBuilt) {
            if (window.confirm('Вы уверены, что хотите перестроить схему? Все ваши предыдущие изменения в компоновке будут потеряны.')) {
                onBuildNewScheme();
            }
        } else {
            onBuildNewScheme();
        }
    }, [isSchemeBuilt, onBuildNewScheme]);
    
    const handleReturnClick = useCallback(() => {
        if (!calculationDataSnapshot) {
            onGoToSchemeView();
            return;
        }

        const currentSnapshot = JSON.stringify(calculationData.map(s => s.modules.map(m => getGearCategory(m.type))));
        if (currentSnapshot === calculationDataSnapshot) {
            // Структура не изменилась, просто обновляем данные
            onGoToSchemeView({ refresh: true });
        } else {
            // Структура изменилась, показываем диалог
            setShowChangesDialog(true);
        }
    }, [calculationData, calculationDataSnapshot, onGoToSchemeView]);

    return (
        <div className="space-y-8 py-8">
            {activeTooltip && (
                <Tooltip
                    content={activeTooltip.content}
                    targetRect={activeTooltip.targetRect}
                    onClose={handleCloseTooltip}
                />
            )}
            
            <EngineParamsEditor
                id="engine-params-card"
                engineParams={engineParams}
                handleParamChange={handleParamChange}
                resetEngineParams={() => { resetEngineParams(); setErrors({}); }}
                rotationIconPath={rotationIconPath}
                rotationIconAltText={rotationIconAltText}
                errors={errors}
            />

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl shadow-slate-900/60">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Ступени трансмиссии</h2>
                <div id="stages-container">
                    {calculationData.map((stage, stageIndex) => (
                       <StageEditor
                            key={stage.id}
                            stage={stage}
                            stageIndex={stageIndex}
                            calculationData={calculationData}
                            onCalculationDataChange={onCalculationDataChange}
                            addStage={addStage}
                            handleParamClick={handleParamClick}
                            scrollToModuleId={scrollToModuleId}
                            onScrollComplete={onScrollComplete}
                            highlightedModuleId={highlightedModuleId}
                            highlightPriority={highlightPriority}
                            showNotification={showNotification}
                       />
                    ))}
                </div>
                 <div className="mt-4 flex justify-end">
                    <Button 
					onClick={onResetConfiguration} 
					variant="secondary" 
					className="text-sm shadow-md shadow-slate-900/40">
                        Сбросить все
                    </Button>
                </div>
            </div>

            <div className={`mt-6 flex flex-col md:flex-row md:flex-wrap ${isSchemeBuilt ? 'justify-between' : 'justify-end'} items-center gap-3`}>
                {isSchemeBuilt && (
                    <Button 
                        onClick={handleReturnClick} 
                        variant="primary"
                        className="flex-grow w-full md:w-auto md:flex-grow-0 order-2 md:order-1 shadow-xl shadow-slate-900/80"
                        title="Вернуться к редактированию существующей схемы"
                    >
                        Вернуться к Схеме
                    </Button>
                )}
                <Button 
                    id={isSchemeBuilt ? 'rebuild-scheme-btn' : 'build-scheme-btn'}
                    onClick={handleBuildSchemeClick} 
                    variant="primary" 
                    className="flex-grow w-full md:w-auto md:flex-grow-0 order-1 md:order-2 shadow-xl shadow-slate-900/80"
                    title={isSchemeBuilt ? "Пересоздать схему с нуля на основе текущих параметров" : "Собрать кинематическую схему на основе выбранных типов передач"}
                >
                    {isSchemeBuilt ? 'Перестроить Схему (Сброс)' : 'Построить Схему'}
                </Button>
            </div>

            {showFinalResults && finalResults && (
                // FIX: The FinalResultsDisplay component has been refactored to not include its own wrapper.
                // The container div is kept here, and the ref is correctly applied.
                <div id="final-results-card" className="mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-xl shadow-slate-900/80" ref={finalResultsRef}>
                    <FinalResultsDisplay results={finalResults} />
                </div>
            )}

            {showChangesDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowChangesDialog(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800">Обнаружены изменения в конфигурации</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Вы внесли структурные изменения на рабочем столе. Существующая компоновка схемы больше не актуальна. Что вы хотите сделать?
                        </p>
                        <div className="mt-6 flex flex-col space-y-3">
                            <Button variant="primary" onClick={() => { onBuildNewScheme(); setShowChangesDialog(false); }}>
                                Обновить схему и отбросить компоновку
                            </Button>
                            <Button variant="secondary" onClick={() => { onGoToSchemeView(); showNotification('Внимание: компоновка схемы может не соответствовать текущим расчетам.', 'warning'); setShowChangesDialog(false); }}>
                                Вернуться к старой компоновке
                            </Button>
                            <Button variant="secondary" onClick={() => setShowChangesDialog(false)}>
                                Отмена
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default WorkbenchPage;