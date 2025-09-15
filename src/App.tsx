import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppStep, EngineParams, StageCalculationData, FinalCalculationResults, SchemeElement, GearType, ParallelLayoutType, ModuleCalculationData } from './types';
import { DEFAULT_ENGINE_PARAMS } from './constants';
import { SchemeBuilderPage } from './pages/SchemeBuilderPage';
import { calculateCascade } from './services/calculationService';
import { ERROR_BG_COLOR, ERROR_TEXT_COLOR } from './constants';
import WorkbenchPage from './pages/WorkbenchPage';
import Button from './components/Button';
import { FolderIcon } from './assets/icons/FolderIcon';
import { ProjectActionsModal } from './components/ProjectActionsModal';
import { InfoModal } from './components/InfoModal';
import { InfoIcon } from './assets/icons/InfoIcon';


const getGearCategory = (type: GearType): 'parallel' | 'square' => {
    const PARALLEL_TYPES = [GearType.Gear, GearType.Chain, GearType.ToothedBelt, GearType.Belt];
    if (PARALLEL_TYPES.includes(type)) {
        return 'parallel';
    }
    return 'square'; // Covers Bevel, Worm, Planetary
};

// Функция для подстановки значений по умолчанию для схемы
const getSchemeModuleWithDefaults = (module: ModuleCalculationData): ModuleCalculationData => {
  const inputs = module.inputs as any;
  const getOrDefault = (val: string | number | undefined, def: number) => 
      (val === undefined || String(val).trim() === '') ? def : Number(val);

  switch (module.type) {
    case GearType.Gear:
    case GearType.Chain:
    case GearType.ToothedBelt:
    case GearType.Bevel:
        return {
            ...module,
            inputs: {
                ...inputs,
                z1: getOrDefault(inputs.z1, 20),
                z2: getOrDefault(inputs.z2, 40),
            }
        };
    case GearType.Belt:
        return {
            ...module,
            inputs: {
                ...inputs,
                d1: getOrDefault(inputs.d1, 50),
                d2: getOrDefault(inputs.d2, 100),
            }
        };
     case GearType.Worm:
        return {
            ...module,
            inputs: {
                ...inputs,
                z1: getOrDefault(inputs.z1, 2),
                z2: getOrDefault(inputs.z2, 40),
            }
        };
    // Для планетарной передачи можно оставить как есть или задать базовые z
    default:
        return module;
  }
};


const generateDefaultScheme = (calculationData: StageCalculationData[]): SchemeElement[] => {
  const result: SchemeElement[] = [];
  let cursor = { direction: 'right' as ('right' | 'down') };

  const activeStages = calculationData.filter(stage => 
    stage.modules.some(m => m.isSelected)
  );

  activeStages.forEach((stage) => {
    const selectedModule = stage.modules.find(m => m.isSelected);
    if (!selectedModule) return;

    const isTurningModule = selectedModule.type === GearType.Bevel || selectedModule.type === GearType.Worm;

    const newElement: SchemeElement = {
      ...stage,
      modules: stage.modules.map(m => ({
        ...getSchemeModuleWithDefaults(m),
        layout: ParallelLayoutType.Standard,
        isReversed: false,
      })),
      turn: undefined,
    };

    if (isTurningModule) {
      if (cursor.direction === 'right') {
        newElement.turn = 'down';
        cursor.direction = 'down';
      } else { // cursor.direction was 'down'
        newElement.turn = 'right';
        cursor.direction = 'right';
      }
    }

    result.push(newElement);
  });

  return result;
};

// Функция для слияния свежих расчетных данных с существующей компоновкой схемы
const mergeCalculationDataIntoScheme = (
  scheme: SchemeElement[],
  newData: StageCalculationData[]
): SchemeElement[] => {
  let dataIndex = 0;
  return scheme.map(element => {
    // Пропускаем валы-проставки
    if ('type' in element && element.type === 'spacer') {
      return element;
    }
    
    const stageElement = element as StageCalculationData;
    if (dataIndex < newData.length) {
      const correspondingNewStage = newData[dataIndex];
      const mergedModules = stageElement.modules.map(schemeModule => {
        const correspondingNewModule = correspondingNewStage.modules.find(
          newModule => newModule.id === schemeModule.id
        );
        if (correspondingNewModule) {
          // Сохраняем пользовательские настройки компоновки из старой схемы
          // и объединяем их с новыми расчетными данными
          return {
            ...correspondingNewModule,
            layout: schemeModule.layout,
            isReversed: schemeModule.isReversed,
          };
        }
        return schemeModule; // На случай, если модуль не найден
      });

      dataIndex++;
      return {
        ...stageElement,
        ...correspondingNewStage, // Применяем новые данные уровня ступени
        modules: mergedModules, // Используем обновленные модули
      };
    }
    return stageElement; // На случай несоответствия длин массивов
  });
};


// Начальная конфигурация с одной ступенью и одной передачей по умолчанию
const defaultCalculationData: StageCalculationData[] = [
  {
    id: `stage-initial-default`,
    stageName: 'Валы 1 и 2',
    modules: [
      {
        id: 'stage-0-module-0-default',
        type: GearType.Gear,
        inputs: { z1: '', z2: '', m: '1', eta: '0.98' },
        isSelected: true,
      },
    ],
  },
];

const createDataSnapshot = (data: StageCalculationData[]): string => {
    return JSON.stringify(data.map(s => s.modules.map(m => getGearCategory(m.type))));
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.Workbench);
  const [engineParams, setEngineParams] = useState<EngineParams>(DEFAULT_ENGINE_PARAMS);
  const [calculationData, setCalculationData] = useState<StageCalculationData[]>(defaultCalculationData);
  const [finalResults, setFinalResults] = useState<FinalCalculationResults | null>(null);
  const [showFinalResults, setShowFinalResults] = useState(false);
  
  const [schemeElements, setSchemeElements] = useState<SchemeElement[]>([]);
  const [initialSchemeElements, setInitialSchemeElements] = useState<SchemeElement[]>([]);
  const [calculationDataSnapshot, setCalculationDataSnapshot] = useState<string | null>(null);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const finalResultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning'; key: number } | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [scrollToModuleId, setScrollToModuleId] = useState<string | null>(null);
  const [isProjectActionsModalOpen, setIsProjectActionsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalDefaultTab, setInfoModalDefaultTab] = useState<'workbench' | 'scheme'>('workbench');

  const openInfoModal = (defaultTab: 'workbench' | 'scheme') => {
    setInfoModalDefaultTab(defaultTab);
    setIsInfoModalOpen(true);
  };

  const isSchemeBuilt = schemeElements.length > 0;

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
    }
    setNotification({ message, type, key: Date.now() });
    setIsNotificationVisible(true);
    notificationTimerRef.current = setTimeout(() => {
        setIsNotificationVisible(false);
    }, 4500);
  }, []);


  useEffect(() => {
    if (!isNotificationVisible && notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 500); // Соответствует длительности анимации fade-out
      return () => clearTimeout(timer);
    }
  }, [isNotificationVisible, notification]);

  const handleCalculationDataChange = useCallback((newData: StageCalculationData[]) => {
    setCalculationData(newData);
    const { results, updatedCalculationData, error } = calculateCascade(engineParams, newData);
    // Обновляем данные с результатами расчетов, но не изменяем пользовательский ввод
    setCalculationData(prevData => {
        // Ensure prevData has the same structure as updatedCalculationData
        const matchingPrevData = prevData.length === updatedCalculationData.length ? prevData : updatedCalculationData.map(stage => {
            const foundStage = prevData.find(pStage => pStage.id === stage.id);
            return foundStage || stage; // Fallback to new stage data if not found
        });

        return updatedCalculationData.map((stage, stageIdx) => ({
            ...stage,
            modules: stage.modules.map((module, moduleIdx) => ({
                ...module, // Start with new calculated data
                // Ensure inputs are preserved from matching previous data if it exists
                inputs: matchingPrevData[stageIdx]?.modules[moduleIdx]?.inputs || module.inputs
            }))
        }));
    });

    if (error) {
        setGlobalError(error);
        showNotification(error, 'error');
        setFinalResults(null);
    } else {
        setGlobalError(null);
        if (results) {
            showNotification('Итоговые параметры обновлены!', 'success');
        }
        setFinalResults(results);
    }
     // Показываем блок итогов, если есть хотя бы один выбранный модуль
    if (newData.some(stage => stage.modules.some(m => m.isSelected))) {
        setShowFinalResults(true);
    }
  }, [engineParams, showNotification]);
  
  const handleModuleSelectionChange = (stageIndex: number, moduleId: string) => {
    const newData = calculationData.map((stage, sIndex) => {
      if (sIndex !== stageIndex) {
        return stage;
      }
      return {
        ...stage,
        modules: stage.modules.map(mod => ({
          ...mod,
          isSelected: mod.id === moduleId,
        })),
      };
    });
    handleCalculationDataChange(newData);
  };


  const handleBuildNewScheme = useCallback(() => {
    const isAnyModuleConfigured = calculationData.some(stage => stage.modules.some(m => m.isSelected && m.type));
    if (!isAnyModuleConfigured) {
      const errorMsg = "Необходимо сконфигурировать хотя бы один модуль (выбрать тип передачи).";
      setGlobalError(errorMsg);
      showNotification(errorMsg, 'error');
      setShowFinalResults(true);
      return;
    }

    const hasMissingParams = calculationData.some(stage =>
        stage.modules.some(m => {
            if (!m.isSelected) return false;
            const inputs = m.inputs as any;
            return Object.values(inputs).some(val => String(val).trim() === '');
        })
    );

    const proceed = () => {
      const defaultScheme = generateDefaultScheme(calculationData);
      const snapshot = createDataSnapshot(calculationData);
      setCalculationDataSnapshot(snapshot);
      setInitialSchemeElements(defaultScheme);
      setSchemeElements(defaultScheme);
      setCurrentStep(AppStep.SchemeDrawing);
    };

    if (hasMissingParams) {
        if (window.confirm("Внимание: Параметры передач не были полностью заполнены. Схема будет построена как кинематическая, без учета реальных габаритов и передаточных чисел. Соотношение размеров элементов будет условным. Продолжить?")) {
            proceed();
        }
    } else {
        proceed();
    }
  }, [calculationData, showNotification, setGlobalError, setShowFinalResults]);

  const handleGoToSchemeView = useCallback((options?: { refresh?: boolean }) => {
    if (options?.refresh) {
      // Пересчитываем данные, чтобы получить самые свежие значения
      const { updatedCalculationData } = calculateCascade(engineParams, calculationData);
      // Сливаем свежие данные в существующую схему
      const updatedScheme = mergeCalculationDataIntoScheme(schemeElements, updatedCalculationData);
      setSchemeElements(updatedScheme);
      // Также обновляем "начальную" схему, чтобы сброс работал корректно
      setInitialSchemeElements(updatedScheme);
      showNotification('Параметры на схеме обновлены!', 'success');
    }
    setCurrentStep(AppStep.SchemeDrawing);
  }, [engineParams, calculationData, schemeElements, showNotification]);

  const handleResetConfiguration = () => {
    setCalculationData(defaultCalculationData);
    setFinalResults(null);
    setShowFinalResults(false);
    setSchemeElements([]);
    setCalculationDataSnapshot(null);
    setGlobalError(null);
    showNotification('Конфигурация передач сброшена к значениям по умолчанию.', 'success');
  };

  const handleSaveProject = useCallback(() => {
        try {
            const projectState = {
                version: "1.0.0",
                savedAt: new Date().toISOString(),
                engineParams,
                calculationData,
                schemeElements,
            };

            const dataStr = JSON.stringify(projectState, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = "transmission-project.json";
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showNotification('Проект успешно сохранен!', 'success');
        } catch (error) {
            console.error("Save failed:", error);
            const message = error instanceof Error ? error.message : String(error);
            showNotification(`Ошибка сохранения: ${message}`, 'error');
            setGlobalError(`Ошибка сохранения: ${message}`);
        }
    }, [engineParams, calculationData, schemeElements, showNotification]);

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("Файл пуст или не может быть прочитан.");
                const loadedState = JSON.parse(text);

                if (!loadedState.engineParams || !loadedState.calculationData) {
                    throw new Error("Неверный формат файла проекта.");
                }

                setEngineParams(loadedState.engineParams);
                setSchemeElements(loadedState.schemeElements || []);
                setCalculationDataSnapshot(createDataSnapshot(loadedState.calculationData));
                handleCalculationDataChange(loadedState.calculationData);
                
                showNotification('Проект успешно загружен!', 'success');
                setCurrentStep(AppStep.Workbench);
                setIsProjectActionsModalOpen(false);

            } catch (error) {
                console.error("Load failed:", error);
                const message = error instanceof Error ? error.message : String(error);
                showNotification(`Ошибка загрузки: ${message}`, 'error');
                setGlobalError(`Ошибка загрузки: ${message}`);
            } finally {
                if (event.target) {
                    event.target.value = "";
                }
            }
        };
        reader.onerror = () => {
            const errorMsg = 'Не удалось прочитать файл.';
            showNotification(errorMsg, 'error');
            setGlobalError(errorMsg);
        };
        reader.readAsText(file);
    };


  const isSchemeDrawing = currentStep === AppStep.SchemeDrawing;
  const appContainerClass = isSchemeDrawing ? "h-screen w-screen" : "min-h-screen w-full flex flex-col";
  const mainContentClass = isSchemeDrawing ? "w-full h-full" : "w-full flex-grow px-2 sm:px-6 lg:px-8";

  return (
    <div className={appContainerClass}>
      {!isSchemeDrawing && (
        <header className="w-full p-2 sm:p-4 bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-200 flex justify-between items-center shadow-md shadow-slate-900/40">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                Расчет многоступенчатых трансмиссий
            </h1>
            <div className="flex space-x-2 ml-4">
                <Button onClick={() => openInfoModal('workbench')} variant="secondary" title="Справка" className="!px-3 !py-2 shadow-md shadow-slate-900/40"><InfoIcon /></Button>
                <Button onClick={() => setIsProjectActionsModalOpen(true)} variant="secondary" title="Проект и Экспорт" className="!px-3 !py-2 shadow-md shadow-slate-900/40"><FolderIcon /></Button>
            </div>
        </header>
      )}
      
      <main className={mainContentClass}>
        <ProjectActionsModal 
            isOpen={isProjectActionsModalOpen} 
            onClose={() => setIsProjectActionsModalOpen(false)} 
            onSave={handleSaveProject} 
            onLoadClick={handleLoadClick}
            context="workbench"
            schemeElements={schemeElements}
            calculationData={calculationData}
            engineParams={engineParams}
        />
        <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} defaultTab={infoModalDefaultTab} />
        <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} accept=".json,application/json" />
        
        {notification && (
            <div
              key={notification.key}
              className={`fixed top-5 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-11/12 sm:max-w-md p-3 rounded-md text-sm font-semibold z-50 shadow-lg ${
                isNotificationVisible ? 'animate-fade-in' : 'animate-fade-out'
              } ${
                notification.type === 'error' ? `${ERROR_BG_COLOR} ${ERROR_TEXT_COLOR}` :
                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-700'
              }`}
            >
              {notification.message.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
        )}

        {currentStep === AppStep.Workbench && (
          <WorkbenchPage
            engineParams={engineParams}
            setEngineParams={setEngineParams}
            calculationData={calculationData}
            onCalculationDataChange={handleCalculationDataChange}
            finalResults={finalResults}
            showFinalResults={showFinalResults}
            isSchemeBuilt={isSchemeBuilt}
            onBuildNewScheme={handleBuildNewScheme}
            onGoToSchemeView={handleGoToSchemeView}
            calculationDataSnapshot={calculationDataSnapshot}
            showNotification={showNotification}
            finalResultsRef={finalResultsRef}
            setGlobalError={setGlobalError}
            resetEngineParams={() => setEngineParams(DEFAULT_ENGINE_PARAMS)}
            onResetConfiguration={handleResetConfiguration}
            scrollToModuleId={scrollToModuleId}
            onScrollComplete={() => setScrollToModuleId(null)}
          />
        )}
        
        {currentStep === AppStep.SchemeDrawing && (
          <SchemeBuilderPage
            ref={svgContainerRef}
            engineParams={engineParams}
            initialSchemeElements={initialSchemeElements}
            schemeElements={schemeElements}
            calculationData={calculationData}
            setSchemeElements={setSchemeElements}
            onBack={() => setCurrentStep(AppStep.Workbench)}
            onNavigateToModule={(moduleId: string) => {
              setScrollToModuleId(moduleId);
              setCurrentStep(AppStep.Workbench);
            }}
            onModuleSelect={handleModuleSelectionChange}
            onSaveProject={handleSaveProject}
            onLoadClick={handleLoadClick}
            onOpenInfoModal={() => openInfoModal('scheme')}
          />
        )}
      </main>
      {!isSchemeDrawing && (
        <footer className="w-full px-4 sm:px-6 lg:px-8 mt-8 py-6 text-center text-gray-500 text-sm border-t border-slate-200">
          <p>&copy; {new Date().getFullYear()} Мастер Трансмиссий. Все права защищены.</p>
          </footer>
      )}
    </div>
  );
};

export default App;