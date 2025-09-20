import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StageCalculationData, ModuleCalculationData, GearType, ModuleSpecificInputs, PlanetaryConfig, BevelGearConfigType, WormGearConfigType } from '../../types';
import Button from '../Button';
import { ModuleCard } from './ModuleCard';
import { ERROR_BG_COLOR, ERROR_TEXT_COLOR, EFFICIENCY_DATABASE } from '../../constants';
import { TooltipContent } from '../../tooltip-data';

const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>);
const CrossIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

const AddStageSeparator: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => (
    <div className={`relative h-8 my-4 ${className || ''}`}>
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-gray-300"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
            <button
                onClick={onClick}
                className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 rounded-full border-2 border-dashed border-gray-300 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-500 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Добавить ступень здесь"
                aria-label="Добавить новую ступень в этом месте"
            >
                <PlusIcon />
            </button>
        </div>
    </div>
);

interface StageEditorProps {
    stage: StageCalculationData;
    stageIndex: number;
    calculationData: StageCalculationData[];
    onCalculationDataChange: (data: StageCalculationData[]) => void;
    addStage: (index: number) => void;
    handleParamClick: (content: TooltipContent, target: HTMLElement) => void;
    scrollToModuleId: string | null;
    onScrollComplete: () => void;
    highlightedModuleId: string | null;
    highlightPriority: boolean;
    showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export const StageEditor: React.FC<StageEditorProps> = React.memo(({
    stage, stageIndex, calculationData, onCalculationDataChange, addStage, handleParamClick, scrollToModuleId, onScrollComplete,
    highlightedModuleId, highlightPriority, showNotification
}) => {
    const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
    const [lastEditedField, setLastEditedField] = useState<{ moduleId: string; field: string } | null>(null);
    const [successfulFields, setSuccessfulFields] = useState<Set<string>>(new Set());
    const [glowingModules, setGlowingModules] = useState<Set<string>>(new Set());
    
    const successTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Cleanup timers on unmount
        return () => {
            successTimersRef.current.forEach(timer => clearTimeout(timer));
            if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (scrollToModuleId && stage.modules.some(m => m.id === scrollToModuleId)) {
            const moduleElement = document.getElementById(scrollToModuleId);
            const stageElement = stageRef.current;
            
            if (moduleElement && stageElement) {
                stageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                const scrollTimeout = setTimeout(() => {
                    moduleElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    onScrollComplete();
                }, 500);

                return () => clearTimeout(scrollTimeout);
            } else if (!moduleElement) {
                onScrollComplete();
            }
        }
    }, [scrollToModuleId, onScrollComplete, stage.modules]);

    useEffect(() => {
        if (!lastEditedField) return;
    
        const editedModule = stage.modules.find(m => m.id === lastEditedField.moduleId);
    
        if (editedModule) {
            const { moduleId, field } = lastEditedField;
            const fieldKey = `${moduleId}-${field}`;
    
            const fieldHasError = editedModule.validationState?.errors?.[field];
            const clearFieldSuccessTimer = () => {
                if (successTimersRef.current.has(fieldKey)) {
                    clearTimeout(successTimersRef.current.get(fieldKey)!);
                    successTimersRef.current.delete(fieldKey);
                }
            };
    
            if (!fieldHasError) {
                clearFieldSuccessTimer();
                setSuccessfulFields(prev => new Set(prev).add(fieldKey));
                
                const newTimer = setTimeout(() => {
                    setSuccessfulFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(fieldKey);
                        return newSet;
                    });
                    successTimersRef.current.delete(fieldKey);
                }, 4000);
                successTimersRef.current.set(fieldKey, newTimer);
            } else {
                clearFieldSuccessTimer();
                setSuccessfulFields(prev => {
                    if (!prev.has(fieldKey)) return prev;
                    const newSet = new Set(prev);
                    newSet.delete(fieldKey);
                    return newSet;
                });
            }
    
            const moduleHasErrors = editedModule.validationState?.errors && Object.keys(editedModule.validationState.errors).length > 0;
    
            if (!moduleHasErrors) {
                if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
                setGlowingModules(new Set([moduleId]));
                
                glowTimerRef.current = setTimeout(() => {
                    setGlowingModules(new Set());
                    glowTimerRef.current = null;
                }, 4000);
            }
        }
        
        setLastEditedField(null);
    
    }, [calculationData, lastEditedField, stage.modules]);

    const isFieldSuccessful = useCallback((moduleId: string, field: string): boolean => {
        return successfulFields.has(`${moduleId}-${field}`);
    }, [successfulFields]);

    const toggleStageExpansion = useCallback((stageId: string) => {
        setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
    }, []);

    const removeStage = useCallback((sIndex: number) => {
        const newData = calculationData.filter((_, i) => i !== sIndex)
            .map((s, i) => ({ ...s, stageName: `Валы ${i + 1} и ${i + 2}` }));
        onCalculationDataChange(newData);
    }, [calculationData, onCalculationDataChange]);

    const addGearVariant = useCallback((sIndex: number) => {
        const currentStage = calculationData[sIndex];
        const newModule: ModuleCalculationData = {
            id: `stage-${sIndex}-module-${currentStage.modules.length}`,
            type: GearType.Gear,
            inputs: { z1: '', z2: '', m: '1', eta: String(EFFICIENCY_DATABASE[GearType.Gear].typical) },
            isSelected: currentStage.modules.length === 0,
        };
        const newData = [...calculationData];
        newData[sIndex].modules.push(newModule);
        onCalculationDataChange(newData);
    }, [calculationData, onCalculationDataChange]);
    
    const removeGearVariant = useCallback((sIndex: number, mIndex: number) => {
        const newData = [...calculationData];
        newData[sIndex].modules = newData[sIndex].modules.filter((_, i) => i !== mIndex);
        if (newData[sIndex].modules.length > 0 && !newData[sIndex].modules.some(m => m.isSelected)) {
            newData[sIndex].modules[0].isSelected = true;
        }
        onCalculationDataChange(newData);
    }, [calculationData, onCalculationDataChange]);

    const handleGearTypeChange = useCallback((sIndex: number, mIndex: number, newType: GearType) => {
        const newData = [...calculationData];
        const module = newData[sIndex].modules[mIndex];
        setLastEditedField({ moduleId: module.id, field: 'type' });
        module.type = newType;
        let defaultInputs: ModuleSpecificInputs;
        const newTypicalEta = String(EFFICIENCY_DATABASE[newType].typical);
        switch (newType) {
            case GearType.Gear: defaultInputs = { z1: '', z2: '', m: '1', eta: newTypicalEta }; break;
            case GearType.Chain: defaultInputs = { z1: '', z2: '', p: '12.7', eta: newTypicalEta }; break;
            case GearType.Planetary: defaultInputs = { zSun: '', zRing: '', m: '1', shaftConfig: PlanetaryConfig.SunToCarrier, eta: newTypicalEta }; break;
            case GearType.ToothedBelt: defaultInputs = { z1: '', z2: '', p: '5', eta: newTypicalEta }; break;
            case GearType.Belt: defaultInputs = { d1: '', d2: '', eta: newTypicalEta }; break;
            case GearType.Bevel: defaultInputs = { z1: '', z2: '', m: '1', b: '1', config: BevelGearConfigType.Config1, eta: newTypicalEta }; break;
            case GearType.Worm: defaultInputs = { z1: '', z2: '', m: '1', q: '10', config: WormGearConfigType.TopApproach, eta: newTypicalEta }; break;
            default: const exhaustiveCheck: never = newType; throw new Error(`Необработанный тип передачи: ${exhaustiveCheck}`);
        }
        module.inputs = defaultInputs;
        onCalculationDataChange(newData);
    }, [calculationData, onCalculationDataChange]);

    const handleInputChange = useCallback((sIndex: number, mIndex: number, field: string, value: string | number) => {
        const updatedData = [...calculationData];
        const module = updatedData[sIndex].modules[mIndex];
        setLastEditedField({ moduleId: module.id, field });
        (module.inputs as any)[field] = value;
        onCalculationDataChange(updatedData);
    }, [calculationData, onCalculationDataChange]);

    const handleSelectChange = useCallback((sIndex: number, mIndex: number, field: string, value: any) => {
        const updatedData = [...calculationData];
        const module = updatedData[sIndex].modules[mIndex];
        setLastEditedField({ moduleId: module.id, field });
        (module.inputs as any)[field] = value;
        onCalculationDataChange(updatedData);
    }, [calculationData, onCalculationDataChange]);

    const handleModuleSelect = useCallback((sIndex: number, mIndex: number) => {
        const updatedData = [...calculationData];
        updatedData[sIndex].modules.forEach((mod, idx) => { mod.isSelected = (idx === mIndex); });
        onCalculationDataChange(updatedData);
    }, [calculationData, onCalculationDataChange]);

    const handlePasteModuleData = useCallback((sIndex: number, mIndex: number, pastedData: { type: GearType; inputs: ModuleSpecificInputs }) => {
        const newData = [...calculationData];
        const moduleToUpdate = newData[sIndex].modules[mIndex];
        
        const singleOnlyTypes: GearType[] = [GearType.Planetary, GearType.Bevel, GearType.Worm];
        const pastedTypeIsSingleOnly = singleOnlyTypes.includes(pastedData.type);
        const stageHasOtherModules = newData[sIndex].modules.length > 1;
        const stageContainsSingleOnlyModule = newData[sIndex].modules.some((m, idx) => singleOnlyTypes.includes(m.type) && idx !== mIndex);

        if (pastedTypeIsSingleOnly && stageHasOtherModules) {
            showNotification('Нельзя вставить поворотную/планетарную передачу на ступень с несколькими вариантами.', 'error');
            return;
        }
        if (!pastedTypeIsSingleOnly && stageContainsSingleOnlyModule) {
            showNotification('Нельзя вставить этот тип передачи на ступень, где уже есть поворотная/планетарная.', 'error');
            return;
        }

        moduleToUpdate.type = pastedData.type;
        moduleToUpdate.inputs = pastedData.inputs;
        
        onCalculationDataChange(newData);
    }, [calculationData, onCalculationDataChange, showNotification]);

    const singleOnlyTypes: GearType[] = [GearType.Planetary, GearType.Bevel, GearType.Worm];
    const hasSingleTypeModuleInStage = stage.modules.some(m => singleOnlyTypes.includes(m.type));
    const isAddVariantDisabled = stage.modules.length > 0 && hasSingleTypeModuleInStage;

    return (
        <div key={stage.id} ref={stageRef}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-700">{stage.stageName}</h3>
                {calculationData.length > 1 && (
                    <Button onClick={() => removeStage(stageIndex)} variant="secondary" className="!p-2 text-sm leading-none shadow-md shadow-slate-900/40" title={`Удалить ступень ${stageIndex + 1}`}>
                        <CrossIcon />
                    </Button>
                )}
            </div>
            {stage.stageError && <p className={`mb-2 p-2 rounded-md ${ERROR_BG_COLOR} ${ERROR_TEXT_COLOR} text-sm`}>{stage.stageError}</p>}
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
                <div className="flex space-x-4 px-4 sm:px-6 py-2">
                    {stage.modules.map((moduleData, moduleIndex) => (
                        <ModuleCard
                            key={moduleData.id}
                            moduleData={moduleData}
                            stageIndex={stageIndex}
                            moduleIndex={moduleIndex}
                            canBeSelected={stage.modules.length > 1}
                            isExpanded={!!expandedStages[stage.id]}
                            isHighlighted={highlightedModuleId === moduleData.id}
                            highlightPriority={highlightPriority}
                            isGlowingGreen={glowingModules.has(moduleData.id)}
                            onToggleExpansion={() => toggleStageExpansion(stage.id)}
                            onInputChange={handleInputChange}
                            onSelectChange={(sIdx, mIdx, field, value) => {
                                if (field === 'type') {
                                    handleGearTypeChange(sIdx, mIdx, value);
                                } else {
                                    handleSelectChange(sIdx, mIdx, field, value);
                                }
                            }}
                            onModuleSelect={() => handleModuleSelect(stageIndex, moduleIndex)}
                            onRemove={() => removeGearVariant(stageIndex, moduleIndex)}
                            onParamClick={handleParamClick}
                            isFieldSuccessful={isFieldSuccessful}
                            showNotification={showNotification}
                            onPasteModule={(pastedData) => handlePasteModuleData(stageIndex, moduleIndex, pastedData)}
                        />
                    ))}
                    <div className="flex-shrink-0 flex items-center justify-center min-w-[120px]">
                        <Button
                            id={`add-variant-btn-stage-${stageIndex}`}
                            onClick={() => addGearVariant(stageIndex)} 
                            variant="secondary" 
                            className="text-sm px-3 py-1.5 flex items-center h-full shadow-md shadow-slate-900/40" 
                            disabled={isAddVariantDisabled} title={isAddVariantDisabled ? "Планетарная, коническая или червячная передача должна быть единственной на ступени." : "Добавить вариант передачи"}>
                            <PlusIcon />
                            Добавить
                        </Button>
                    </div>
                </div>
            </div>
            <AddStageSeparator className="add-stage-separator" onClick={() => addStage(stageIndex + 1)} />
        </div>
    );
});