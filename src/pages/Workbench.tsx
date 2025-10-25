import React, { useState, useCallback, useRef, useEffect } from 'react';
// import { Analytics } from '@vercel/analytics/react';
import { AppStep, EngineParams, StageCalculationData, FinalCalculationResults, SchemeElement, GearType, ParallelLayoutType, ModuleCalculationData, PlanetaryConfig, PLANETARY_CONFIG_MAP, PlanetaryShaftType, Project } from '../types';
import { DEFAULT_ENGINE_PARAMS } from '../constants';
import { SchemeBuilderPage } from './SchemeBuilderPage';
import { calculateCascade } from '../services/calculationService';
import { ERROR_BG_COLOR, ERROR_TEXT_COLOR } from '../constants';
import WorkbenchPage from './WorkbenchPage';
import Button from '../components/Button';
import { FolderIcon } from '../assets/icons/FolderIcon';
import { ProjectActionsModal } from '../components/ProjectActionsModal';
import { InfoModal } from '../components/InfoModal';
import { InfoIcon } from '../assets/icons/InfoIcon';
import { getGearCategory } from '../utils/gear';
import OnboardingManager from '../components/OnboardingManager';
import { HomeIcon } from '../assets/icons/HomeIcon';
import { getAllProjects, getProject, saveProject, deleteProject } from '../services/db';


// --- Confirmation Modal Component ---
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  showDontShowAgain?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Да',
  cancelText = 'Нет',
  showDontShowAgain = true,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm(dontShowAgain);
  };
  
  const handleCancel = () => {
      setDontShowAgain(false); // Reset on cancel
      onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-11/12 max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="confirmation-modal-title" className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
          <div className="text-gray-600 space-y-2">{message}</div>

          {showDontShowAgain && (
            <div className="mt-6 flex items-center">
              <input
                id="dont-show-again"
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="dont-show-again" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Больше не показывать это сообщение
              </label>
            </div>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
          <Button onClick={handleCancel} variant="secondary">
            {cancelText}
          </Button>
          <Button onClick={handleConfirm} variant="primary">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};


interface WorkbenchProps {
  onNavigateToHome: () => void;
  navigate: (path: string) => void;
  currentPath: string;
}


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
    case GearType.Planetary: {
        const newInputs = {
            ...inputs,
            zSun: getOrDefault(inputs.zSun, 30),
            zRing: getOrDefault(inputs.zRing, 64),
            m: getOrDefault(inputs.m, 1),
            shaftConfig: inputs.shaftConfig || PlanetaryConfig.SunToCarrier,
        };
        
        // Принудительно рассчитываем zPlanet для корректного построения УГО
        const zPlanet = (Number(newInputs.zRing) - Number(newInputs.zSun)) / 2;

        // Определяем зафиксированный вал для правильного выбора УГО
        let fixedShaft: PlanetaryShaftType | string = "Не определен";
        const shaftConfig = newInputs.shaftConfig as PlanetaryConfig;
        const shaftMap = PLANETARY_CONFIG_MAP[shaftConfig];
        if (shaftMap) {
            const { in: inShaft, out: outShaft } = shaftMap;
            const shafts = [PlanetaryShaftType.Sun, PlanetaryShaftType.Carrier, PlanetaryShaftType.Ring];
            fixedShaft = shafts.find(s => s !== inShaft && s !== outShaft) || "Не определен";
        }

        return {
            ...module,
            inputs: newInputs,
            // Устанавливаем zPlanet, только если он еще не был рассчитан
            zPlanet: module.zPlanet ?? zPlanet,
            // Устанавливаем fixedShaft, чтобы УГО отобразился корректно, даже если расчет не проводился
            fixedShaft: fixedShaft,
        };
    }
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
  const newDataMap = new Map(newData.map(stage => [stage.id, stage]));

  return scheme.map(element => {
    // Spacers are returned as-is
    if ('type' in element && element.type === 'spacer') {
      return element;
    }
    
    const stageElement = element as StageCalculationData;
    const correspondingNewStage = newDataMap.get(stageElement.id);

    // If a corresponding stage exists in the new data, merge it.
    if (correspondingNewStage) {
      // Merge modules, keeping layout properties from the old scheme element
      const mergedModules = correspondingNewStage.modules.map(newModule => {
        const existingSchemeModule = stageElement.modules.find(
          schemeModule => schemeModule.id === newModule.id
        );
        return {
          ...newModule, // Fresh calculation data
          layout: existingSchemeModule?.layout || ParallelLayoutType.Standard, // Keep old layout or default
          isReversed: existingSchemeModule?.isReversed || false, // Keep old layout or default
        };
      });

      return {
        ...stageElement, // Keeps layout properties like 'turn'
        ...correspondingNewStage, // Applies new stage-level data (name, etc.)
        modules: mergedModules, // Use the newly merged modules
      };
    }

    // This stage was deleted. This shouldn't happen during a soft update,
    // but we return the old element to be safe.
    return stageElement;
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
  // Этот снимок фиксирует фундаментальную структуру: ступени, ID модулей и категорию выбранной передачи.
  return JSON.stringify(data.map(stage => {
      const selectedModule = stage.modules.find(m => m.isSelected) || stage.modules[0];
      return {
          id: stage.id,
          category: getGearCategory(selectedModule.type),
          moduleIds: stage.modules.map(m => m.id).sort(), // Отслеживаем наличие модулей
      };
  }));
};

const getDefaultStateAsString = () => {
  const defaultState = {
    engineParams: DEFAULT_ENGINE_PARAMS,
    calculationData: defaultCalculationData,
    schemeElements: []
  };
  return JSON.stringify(defaultState);
};

const Workbench: React.FC<WorkbenchProps> = ({ onNavigateToHome, navigate, currentPath }) => {
  const currentStep = currentPath.startsWith('/scheme') ? AppStep.SchemeDrawing : AppStep.Workbench;
  const [engineParams, setEngineParams] = useState<EngineParams>(DEFAULT_ENGINE_PARAMS);
  const [calculationData, setCalculationData] = useState<StageCalculationData[]>(defaultCalculationData);
  const [finalResults, setFinalResults] = useState<FinalCalculationResults | null>(null);
  const [showFinalResults, setShowFinalResults] = useState(false);
  
  const [schemeElements, setSchemeElements] = useState<SchemeElement[]>([]);
  const [initialSchemeElements, setInitialSchemeElements] = useState<SchemeElement[]>([]);
  const [calculationDataSnapshot, setCalculationDataSnapshot] = useState<string | null>(null);
  const [calculationDataForRevert, setCalculationDataForRevert] = useState<StageCalculationData[] | null>(null);
  const [showChangesDialog, setShowChangesDialog] = useState(false);

  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
    storageKey?: string;
  } | null>(null);

  const finalResultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning'; key: number } | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [scrollToModuleId, setScrollToModuleId] = useState<string | null>(null);
  const [isProjectActionsModalOpen, setIsProjectActionsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalDefaultTab, setInfoModalDefaultTab] = useState<'guide' | 'catalog'>('guide');
  const [tourTrigger, setTourTrigger] = useState(0);
  const [schemeTourTrigger, setSchemeTourTrigger] = useState(0);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  // --- Local Project State ---
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>(getDefaultStateAsString());

  const confirmAction = useCallback((
    title: string,
    message: React.ReactNode,
    onConfirm: () => void,
    storageKey?: string
  ) => {
    if (storageKey && localStorage.getItem(storageKey) === 'true') {
        onConfirm();
        return;
    }
    setConfirmationState({
        isOpen: true,
        title,
        message,
        onConfirm,
        storageKey
    });
  }, []);

  const handleConfirmationConfirm = (dontShowAgain: boolean) => {
    if (confirmationState) {
        if (confirmationState.storageKey && dontShowAgain) {
            localStorage.setItem(confirmationState.storageKey, 'true');
        }
        confirmationState.onConfirm();
        setConfirmationState(null);
    }
  };

  const handleConfirmationCancel = () => {
    if (confirmationState?.onCancel) {
        confirmationState.onCancel();
    }
    setConfirmationState(null);
  };

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

  const AUTOSAVE_KEY = 'autosave-transmission-project';

  // FIX: Moved `handleCalculationDataChange` before the functions that use it (`handleLoadProjectLocal`, `handleNewProject`) to fix "used before its declaration" errors.
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
        showNotification(error, 'error');
        setFinalResults(null);
    } else {
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

  // --- Local Project Handlers ---
  const refreshLocalProjects = useCallback(async () => {
    const projects = await getAllProjects();
    setLocalProjects(projects);
  }, []);

  const handleLoadProjectLocal = useCallback(async (id: string) => {
    const loadFn = async () => {
      const project = await getProject(id);
      if (project) {
        const { engineParams: ep, calculationData: cd, schemeElements: se } = project.data;
        setEngineParams(ep);
        setCalculationData(cd);
        setSchemeElements(se || []);
        setCurrentProject(project);
        setLastSavedState(JSON.stringify({ engineParams: ep, calculationData: cd, schemeElements: se || [] }));
        
        handleCalculationDataChange(cd);
        
        showNotification(`Проект "${project.name}" загружен.`, 'success');
        setIsProjectActionsModalOpen(false);
      } else {
        showNotification('Не удалось загрузить проект.', 'error');
      }
    };

    if (isDirty) {
      confirmAction(
        'Несохраненные изменения',
        'У вас есть несохраненные изменения. Вы уверены, что хотите загрузить другой проект? Изменения будут потеряны.',
        loadFn,
        'dontShowLoadDirtyProjectWarning'
      );
    } else {
      loadFn();
    }
  }, [isDirty, showNotification, handleCalculationDataChange, confirmAction]);

  const handleSaveProjectLocal = useCallback(async (idToUpdate?: string, newName?: string) => {
    const dataToSave = { engineParams, calculationData, schemeElements };
    let projectToSave: Project;

    if (idToUpdate) { // Update existing project
        const projectToUpdate = currentProject?.id === idToUpdate ? currentProject : await getProject(idToUpdate);
        if (!projectToUpdate) {
            showNotification('Ошибка: проект для обновления не найден.', 'error');
            return;
        }
        projectToSave = {
            ...projectToUpdate,
            name: newName || projectToUpdate.name, // Allow renaming on update
            lastModified: Date.now(),
            data: dataToSave
        };
    } else { // Save as new project
        if (!newName || newName.trim() === '') {
            showNotification('Необходимо указать имя проекта.', 'warning');
            return;
        }
        projectToSave = {
            id: String(Date.now()),
            name: newName.trim(),
            lastModified: Date.now(),
            meta: { appName: 'transmission-calculator', appVersion: '1.2.0' },
            data: dataToSave
        };
    }

    await saveProject(projectToSave);
    setCurrentProject(projectToSave);
    setLastSavedState(JSON.stringify(dataToSave));
    await refreshLocalProjects();
    showNotification(`Проект "${projectToSave.name}" сохранен.`, 'success');
}, [engineParams, calculationData, schemeElements, currentProject, refreshLocalProjects, showNotification]);

const handleDeleteProjectLocal = useCallback(async (id: string) => {
    await deleteProject(id);
    await refreshLocalProjects();
    if (currentProject?.id === id) {
        setCurrentProject(null);
        // After deleting the current project, the state is now like a new, unsaved project
        setLastSavedState(getDefaultStateAsString());
    }
    showNotification('Проект удален.', 'success');
}, [currentProject, refreshLocalProjects, showNotification]);

const handleNewProject = useCallback(() => {
    const createNew = () => {
      setEngineParams(DEFAULT_ENGINE_PARAMS);
      setCalculationData(defaultCalculationData);
      setSchemeElements([]);
      setCurrentProject(null);
      setLastSavedState(getDefaultStateAsString());
      handleCalculationDataChange(defaultCalculationData);
      showNotification('Создан новый пустой проект.', 'success');
      setIsProjectActionsModalOpen(false);
    };

    if (isDirty) {
      confirmAction(
        'Несохраненные изменения',
        'У вас есть несохраненные изменения. Вы уверены, что хотите создать новый проект?',
        createNew,
        'dontShowNewDirtyProjectWarning'
      );
    } else {
      createNew();
    }
}, [isDirty, showNotification, handleCalculationDataChange, confirmAction]);

// Fetch projects on initial mount
useEffect(() => {
    refreshLocalProjects();
}, [refreshLocalProjects]);

// Track dirty state
useEffect(() => {
    const currentState = JSON.stringify({ engineParams, calculationData, schemeElements });
    setIsDirty(currentState !== lastSavedState);
}, [engineParams, calculationData, schemeElements, lastSavedState]);


  const handleRestoreSession = useCallback(async () => {
    const savedStateJSON = localStorage.getItem(AUTOSAVE_KEY);
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            const { engineParams: loadedParams, calculationData: loadedData, schemeElements: loadedScheme } = savedState.data;
            const loadedProjectId = savedState.currentProjectId;

            const { results, updatedCalculationData, error } = calculateCascade(loadedParams, loadedData);
            
            setEngineParams(loadedParams);
            setCalculationData(updatedCalculationData);
            setSchemeElements(loadedScheme || []);

            if (loadedProjectId) {
                const project = await getProject(loadedProjectId);
                if (project) {
                    setCurrentProject(project);
                    setLastSavedState(JSON.stringify(project.data));
                } else {
                    setCurrentProject(null);
                    setLastSavedState(getDefaultStateAsString());
                }
            } else {
                setCurrentProject(null);
                setLastSavedState(getDefaultStateAsString());
            }

            if (error) {
                showNotification(error, 'error');
                setFinalResults(null);
            } else {
                setFinalResults(results);
            }
            if (updatedCalculationData.some(stage => stage.modules.some(m => m.isSelected))) {
                setShowFinalResults(true);
            }
            
            showNotification('Сессия восстановлена.', 'success');
        } catch (e) {
            showNotification('Ошибка при восстановлении сессии.', 'error');
            localStorage.removeItem(AUTOSAVE_KEY);
        }
    }
    setShowRestoreDialog(false);
  }, [showNotification]);

  const handleDismissRestore = useCallback(() => {
      localStorage.removeItem(AUTOSAVE_KEY);
      setShowRestoreDialog(false);
  }, []);

  // Эффект для восстановления сессии при первой загрузке
  useEffect(() => {
      const savedStateJSON = localStorage.getItem(AUTOSAVE_KEY);

      if (savedStateJSON) {
          try {
              const savedState = JSON.parse(savedStateJSON);
              if (savedState.meta?.appName === 'transmission-calculator' && savedState.data) {
                  setShowRestoreDialog(true);
              } else {
                localStorage.removeItem(AUTOSAVE_KEY); // Очистка невалидных данных
              }
          } catch (e) {
              console.error("Не удалось разобрать автосохраненное состояние:", e);
              localStorage.removeItem(AUTOSAVE_KEY); // Очистка поврежденных данных
          }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустой массив зависимостей гарантирует, что эффект выполнится только один раз

  // Эффект для автосохранения прогресса
  useEffect(() => {
      if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(() => {
          // FIX: The original check was not type-safe. This refactored logic is type-safe.
          const isDefaultEngine = JSON.stringify(engineParams) === JSON.stringify(DEFAULT_ENGINE_PARAMS);
          let isDefaultModules = false;
          if (
            calculationData.length === 1 &&
            calculationData[0].modules.length === 1 &&
            calculationData[0].modules[0].type === GearType.Gear
          ) {
            const inputs = calculationData[0].modules[0].inputs;
            // Type-safe check for the default module's inputs since `inputs` is a union type.
            if ('z1' in inputs && 'z2' in inputs && inputs.z1 === '' && inputs.z2 === '') {
              isDefaultModules = true;
            }
          }
          const isDefaultState = isDefaultEngine && isDefaultModules;

          if (isDefaultState) {
              return;
          }

          const projectState = {
              meta: {
                  appName: "transmission-calculator",
                  appVersion: "1.2.0"
              },
              data: {
                  engineParams,
                  calculationData,
                  schemeElements,
              },
              currentProjectId: currentProject ? currentProject.id : null,
          };
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(projectState));
      }, 1000); // Задержка в 1 секунду

      return () => {
          if (autosaveTimerRef.current) {
              clearTimeout(autosaveTimerRef.current);
          }
      };
  }, [engineParams, calculationData, schemeElements, currentProject]);


  useEffect(() => {
    // Автоматический запуск тура по "Рабочему столу" при первом посещении
    const workbenchTourCompleted = localStorage.getItem('onboardingComplete_introjs_workbench_v1') === 'true';
    if (!workbenchTourCompleted && currentStep === AppStep.Workbench) {
        const timer = setTimeout(() => {
            setTourTrigger(Date.now());
        }, 500); // Небольшая задержка, чтобы UI успел отрендериться
        return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const openInfoModal = useCallback(() => {
    // Теперь вкладка по умолчанию зависит от текущей страницы
    setInfoModalDefaultTab(currentStep === AppStep.Workbench ? 'guide' : 'guide');
    setIsInfoModalOpen(true);
  }, [currentStep]);

  const handleStartWorkbenchTour = useCallback(() => {
    if (currentStep !== AppStep.Workbench) {
        alert("Чтобы запустить тур по рабочему столу, сначала перейдите на страницу рабочего стола.");
        return;
    }
    setIsInfoModalOpen(false);
    // Небольшая задержка, чтобы модальное окно успело закрыться перед появлением оверлея тура
    setTimeout(() => {
        localStorage.removeItem('onboardingComplete_introjs_workbench_v1');
        setTourTrigger(Date.now());
    }, 150);
  }, [currentStep]);

  const handleStartSchemeTour = useCallback(() => {
    if (currentStep !== AppStep.SchemeDrawing) {
        alert("Чтобы запустить тур по сборщику схем, сначала перейдите на страницу сборщика схем.");
        return;
    }
    setIsInfoModalOpen(false);
    setTimeout(() => {
        localStorage.removeItem('onboardingComplete_introjs_scheme_v1');
        setSchemeTourTrigger(Date.now());
    }, 150);
  }, [currentStep]);


  const isSchemeBuilt = schemeElements.length > 0;

  useEffect(() => {
    if (!isNotificationVisible && notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 500); // Соответствует длительности анимации fade-out
      return () => clearTimeout(timer);
    }
  }, [isNotificationVisible, notification]);
  
  const handleModuleSelectionChange = useCallback((stageIndex: number, moduleId: string) => {
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
  }, [calculationData, handleCalculationDataChange]);


  const handleBuildNewScheme = useCallback(() => {
    const isAnyModuleConfigured = calculationData.some(stage => stage.modules.some(m => m.isSelected && m.type));
    if (!isAnyModuleConfigured) {
      const errorMsg = "Необходимо сконфигурировать хотя бы один модуль (выбрать тип передачи).";
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
      setCalculationDataForRevert(calculationData);
      setInitialSchemeElements(defaultScheme);
      setSchemeElements(defaultScheme);
      navigate('/scheme');
      setTimeout(() => {
          if (localStorage.getItem('onboardingComplete_introjs_scheme_v1') !== 'true') {
              setSchemeTourTrigger(Date.now());
          }
      }, 500);
    };

    if (hasMissingParams) {
        confirmAction(
            'Подтвердите действие',
            'Внимание: Параметры передач не были полностью заполнены. Схема будет построена как кинематическая, без учета реальных габаритов и передаточных чисел. Соотношение размеров элементов будет условным. Продолжить?',
            proceed,
            'dontShowMissingParamsWarning'
        );
    } else {
        proceed();
    }
  }, [calculationData, showNotification, navigate, confirmAction]);

  const handleGoToSchemeView = useCallback((options?: { refresh?: boolean }) => {
    if (options?.refresh) {
      // Пересчитываем данные, чтобы получить самые свежие значения
      const { updatedCalculationData } = calculateCascade(engineParams, calculationData);
      // Сливаем свежие данные в существующую схему
      const updatedScheme = mergeCalculationDataIntoScheme(schemeElements, updatedCalculationData);
      setSchemeElements(updatedScheme);
      // Также обновляем "начальную" схему, чтобы сброс работал корректно
      setInitialSchemeElements(updatedScheme);
       // Обновляем данные для отката и снепшот
      setCalculationDataForRevert(updatedCalculationData);
      setCalculationDataSnapshot(createDataSnapshot(updatedCalculationData));
      showNotification('Параметры на схеме обновлены!', 'success');
    }
    navigate('/scheme');
  }, [engineParams, calculationData, schemeElements, showNotification, navigate]);
  
  const handleRevertAndGoToScheme = useCallback(() => {
    if (calculationDataForRevert) {
      // Восстанавливаем данные на "Рабочем столе"
      setCalculationData(calculationDataForRevert);
      // Пересчитываем итоговые значения на основе восстановленных данных
      handleCalculationDataChange(calculationDataForRevert);
    }
    // Просто переходим на схему, не меняя ее
    navigate('/scheme');
    setShowChangesDialog(false);
    showNotification('Изменения на рабочем столе отменены.', 'success');
  }, [calculationDataForRevert, handleCalculationDataChange, navigate, showNotification]);


  const handleResetConfiguration = useCallback(() => {
    setCalculationData(defaultCalculationData);
    setFinalResults(null);
    setShowFinalResults(false);
    setSchemeElements([]);
    setCalculationDataSnapshot(null);
    localStorage.removeItem('autosave-transmission-project');
    showNotification('Конфигурация передач сброшена к значениям по умолчанию.', 'success');
  }, [showNotification]);

  const handleSaveProjectToFile = useCallback(() => {
        try {
            const projectState = {
                version: "1.0.0",
                savedAt: new Date().toISOString(),
                engineParams,
                calculationData,
                schemeElements,
            };
            
            const getTimestamp = () => {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              const hours = String(now.getHours()).padStart(2, '0');
              const minutes = String(now.getMinutes()).padStart(2, '0');
              const seconds = String(now.getSeconds()).padStart(2, '0');
              return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
            };

            const dataStr = JSON.stringify(projectState, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `transmission-project_${getTimestamp()}.json`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showNotification('Проект успешно сохранен в файл!', 'success');
        } catch (error) {
            console.error("Save failed:", error);
            const message = error instanceof Error ? error.message : String(error);
            showNotification(`Ошибка сохранения: ${message}`, 'error');
        }
    }, [engineParams, calculationData, schemeElements, showNotification]);

    const handleLoadFromFileClick = useCallback(() => {
        const openFilePicker = () => {
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        };

        if (isDirty) {
            confirmAction(
                'Несохраненные изменения',
                'У вас есть несохраненные изменения. Вы уверены, что хотите загрузить проект из файла? Изменения будут потеряны.',
                openFilePicker,
                'dontShowLoadFileDirtyProjectWarning'
            );
        } else {
            openFilePicker();
        }
    }, [isDirty, confirmAction]);

    const handleFileSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
                
                // Сбрасываем текущий проект, так как загрузка из файла - это импорт
                setCurrentProject(null);
                setLastSavedState(getDefaultStateAsString()); // Делает состояние "грязным", чтобы предложить сохранить

                showNotification('Проект успешно загружен!', 'success');
                navigate('/workbench');
                setIsProjectActionsModalOpen(false);

            } catch (error) {
                console.error("Load failed:", error);
                const message = error instanceof Error ? error.message : String(error);
                showNotification(`Ошибка загрузки: ${message}`, 'error');
            } finally {
                if (event.target) {
                    event.target.value = "";
                }
            }
        };
        reader.onerror = () => {
            const errorMsg = 'Не удалось прочитать файл.';
            showNotification(errorMsg, 'error');
        };
        reader.readAsText(file);
    }, [handleCalculationDataChange, showNotification, navigate]);

  const handleBackToWorkbench = useCallback(() => {
      navigate('/workbench');
  }, [navigate]);

  const handleNavigateToModule = useCallback((moduleId: string) => {
      setScrollToModuleId(moduleId);
      navigate('/workbench');
  }, [navigate]);

  const handleOpenSchemeInfoModal = useCallback(() => {
      openInfoModal();
  }, [openInfoModal]);
  
  const handleScrollComplete = useCallback(() => {
      setScrollToModuleId(null);
  }, []);

  const handleResetEngineParams = useCallback(() => {
      setEngineParams(DEFAULT_ENGINE_PARAMS);
  }, []);

  const isSchemeDrawing = currentStep === AppStep.SchemeDrawing;
  const appContainerClass = isSchemeDrawing ? "h-dvh w-screen" : "min-h-screen w-full flex flex-col";
  const mainContentClass = isSchemeDrawing ? "w-full h-full" : "w-full flex-grow px-2 sm:px-6 lg:px-8";

  return (
    <div className={appContainerClass}>
      {/* <Analytics /> */}
      {confirmationState?.isOpen && (
        <ConfirmationModal
            isOpen={confirmationState.isOpen}
            title={confirmationState.title}
            message={confirmationState.message}
            onConfirm={handleConfirmationConfirm}
            onCancel={handleConfirmationCancel}
        />
      )}
      {!isSchemeDrawing && (
        <header className="w-full p-2 sm:p-4 bg-white/80 backdrop-blur-sm sm:sticky top-0 z-30 border-b border-slate-200 flex justify-between items-center shadow-md shadow-slate-900/40">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                Расчет многоступенчатых трансмиссий
            </h1>
            <div className="flex space-x-2 ml-4">
                <Button onClick={onNavigateToHome} variant="secondary" title="На главную" className="!px-3 !py-2 shadow-md shadow-slate-900/40"><HomeIcon /></Button>
                <Button onClick={() => openInfoModal()} variant="secondary" title="Справка" className="!px-3 !py-2 shadow-md shadow-slate-900/40"><InfoIcon /></Button>
                <Button onClick={() => setIsProjectActionsModalOpen(true)} variant="secondary" title="Проект и Экспорт" className="!px-3 !py-2 shadow-md shadow-slate-900/40"><FolderIcon /></Button>
            </div>
        </header>
      )}
      
      <main className={mainContentClass}>
        {showRestoreDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleDismissRestore}>
                <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-800">Обнаружена незаконченная сессия</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Хотите восстановить предыдущий прогресс? Если вы откажетесь, несохраненные данные будут удалены.
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="secondary" onClick={handleDismissRestore}>
                            Нет, начать заново
                        </Button>
                        <Button variant="primary" onClick={handleRestoreSession}>
                            Да, восстановить
                        </Button>
                    </div>
                </div>
            </div>
        )}
        <ProjectActionsModal 
            isOpen={isProjectActionsModalOpen} 
            onClose={() => setIsProjectActionsModalOpen(false)} 
            onSaveToFile={handleSaveProjectToFile} 
            onLoadFromFileClick={handleLoadFromFileClick}
            onSaveLocal={handleSaveProjectLocal}
            onLoadLocal={handleLoadProjectLocal}
            onDeleteLocal={handleDeleteProjectLocal}
            onNewProject={handleNewProject}
            currentProject={currentProject}
            localProjects={localProjects}
            isDirty={isDirty}
            context={currentStep === AppStep.Workbench ? 'workbench' : 'scheme'}
            svgContainerRef={svgContainerRef}
            schemeElements={schemeElements}
            calculationData={calculationData}
            engineParams={engineParams}
            confirmAction={confirmAction}
        />
        <InfoModal 
            isOpen={isInfoModalOpen} 
            onClose={() => setIsInfoModalOpen(false)} 
            defaultTab={infoModalDefaultTab}
            onStartWorkbenchTour={handleStartWorkbenchTour}
            onStartSchemeTour={handleStartSchemeTour}
        />
         {showChangesDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowChangesDialog(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800">Обнаружены структурные изменения!</h3>
                        <p className="mt-2 text-sm text-gray-600">
                           Вы изменили тип передачи (например, с параллельной на угловую), добавили или удалили ступень. Эти изменения конфликтуют с текущей компоновкой схемы. Пожалуйста, выберите действие:
                        </p>
                        <div className="mt-6 flex flex-col space-y-3">
                            <Button variant="primary" onClick={() => { 
                                confirmAction(
                                    'Перестроить схему?',
                                    'Вы уверены, что хотите перестроить схему? Все ваши предыдущие изменения в компоновке будут потеряны.',
                                    () => {
                                        handleBuildNewScheme();
                                        setShowChangesDialog(false);
                                    },
                                    'dontShowRebuildSchemeWarning'
                                );
                            }}>
                                Применить и перестроить схему (сброс компоновки)
                            </Button>
                            <Button variant="secondary" onClick={() => {
                                confirmAction(
                                    "Отменить изменения?",
                                    "Вы уверены? Все несохраненные изменения на 'Рабочем столе' будут отменены.",
                                    handleRevertAndGoToScheme,
                                    'dontShowRevertChangesWarning'
                                );
                             }}>
                                Отменить изменения и вернуться к схеме
                            </Button>
                            <Button variant="secondary" onClick={() => setShowChangesDialog(false)}>
                                Отмена
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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
          <>
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
              resetEngineParams={handleResetEngineParams}
              onResetConfiguration={handleResetConfiguration}
              scrollToModuleId={scrollToModuleId}
              onScrollComplete={handleScrollComplete}
              setShowChangesDialog={setShowChangesDialog}
              confirmAction={confirmAction}
            />
            <OnboardingManager tourKey="workbench" startTourTrigger={tourTrigger} />
          </>
        )}
        
        {currentStep === AppStep.SchemeDrawing && (
          <>
            <SchemeBuilderPage
              ref={svgContainerRef}
              engineParams={engineParams}
              initialSchemeElements={initialSchemeElements}
              schemeElements={schemeElements}
              calculationData={calculationData}
              setSchemeElements={setSchemeElements}
              onBack={handleBackToWorkbench}
              onNavigateToModule={handleNavigateToModule}
              onModuleSelect={handleModuleSelectionChange}
              onSaveProjectToFile={handleSaveProjectToFile}
              onLoadProjectFromFileClick={handleLoadFromFileClick}
              onOpenInfoModal={handleOpenSchemeInfoModal}
              onSaveProjectLocal={handleSaveProjectLocal}
              onLoadProjectLocal={handleLoadProjectLocal}
              // FIX: Corrected prop name from `onDeleteLocal` to `onDeleteProjectLocal` to match the `SchemeBuilderPageProps` interface.
              onDeleteProjectLocal={handleDeleteProjectLocal}
              onNewProject={handleNewProject}
              currentProject={currentProject}
              localProjects={localProjects}
              isDirty={isDirty}
              confirmAction={confirmAction}
            />
            <OnboardingManager tourKey="scheme" startTourTrigger={schemeTourTrigger} />
          </>
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

export default Workbench;