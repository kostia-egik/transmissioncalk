import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { getProject, saveProject, deleteProject } from '../services/db';
import { AuthWidget } from '../components/AuthWidget';
// FIX: Import getSharedProject to handle loading shared project links.
import { getSharedProject } from '../services/firestoreService';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';


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
  confirmText,
  cancelText,
  showDontShowAgain = true,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setDontShowAgain(false); // Сбрасываем состояние при открытии
    }
  }, [isOpen]);

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
                {t('dialog_dont_show_again')}
              </label>
            </div>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
          <Button onClick={handleCancel} variant="secondary">
            {cancelText || t('common_no')}
          </Button>
          <Button onClick={handleConfirm} variant="primary">
            {confirmText || t('common_yes')}
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
  const { t } = useLanguage();

  // --- Local Project State ---
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>(getDefaultStateAsString());
  // FIX: Add state for shared project view mode.
  const [isViewingShared, setIsViewingShared] = useState(false);
  const [loadedSharedId, setLoadedSharedId] = useState<string | null>(null);

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
        const { onConfirm, storageKey } = confirmationState;

        if (storageKey && dontShowAgain) {
            localStorage.setItem(storageKey, 'true');
        }
        // Сначала закрываем модальное окно
        setConfirmationState(null);

        // Затем, с небольшой задержкой, выполняем действие.
        // Это позволяет React обработать обновление состояния и убрать модальное окно
        // до того, как будет инициировано потенциально "тяжелое" действие, такое как навигация.
        setTimeout(() => {
            onConfirm();
        }, 50);
    }
  };

  const handleConfirmationCancel = () => {
    if (confirmationState) {
        const { onCancel } = confirmationState;
        
        // Сначала закрываем модальное окно
        setConfirmationState(null);

        // Затем, с задержкой, вызываем onCancel, если он есть
        if (onCancel) {
            setTimeout(() => {
                onCancel();
            }, 50);
        }
    }
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

  // --- Local Project Handlers ---
  
  const handleCalculationDataChange = useCallback((newData: StageCalculationData[]) => {
    setCalculationData(newData);
    const { results, updatedCalculationData, error } = calculateCascade(engineParams, newData, t);
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
            showNotification(t('notification_params_updated'), 'success');
        }
        setFinalResults(results);
    }
     // Показываем блок итогов, если есть хотя бы один выбранный модуль
    if (newData.some(stage => stage.modules.some(m => m.isSelected))) {
        setShowFinalResults(true);
    }
  }, [engineParams, showNotification, t]);

  const handleLoadProjectLocal = useCallback(async (project: Project) => {
    const loadFn = async () => {
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

  const handleSaveProjectLocal = useCallback(async (project: Project): Promise<string | undefined> => {
    // Caller is now responsible for lastModified. We just save the object.
    await saveProject(project);

    // This is the fix: only update workbench's "current project" if the saved project
    // is the one being worked on, or if there is no current project yet.
    if ((currentProject && currentProject.id === project.id) || !currentProject) {
        setCurrentProject(project);
        setLastSavedState(JSON.stringify(project.data));
    }

    showNotification(`Проект "${project.name}" сохранен.`, 'success');
    return project.id;
  }, [currentProject, showNotification]);

const handleDeleteProjectLocal = useCallback(async (id: string) => {
    await deleteProject(id);
    if (currentProject?.id === id) {
        setCurrentProject(null);
        // After deleting the current project, the state is now like a new, unsaved project
        setLastSavedState(getDefaultStateAsString());
    }
    showNotification('Проект удален.', 'success');
}, [currentProject, showNotification]);

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

            const { results, updatedCalculationData } = calculateCascade(loadedParams, loadedData, t);
            
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

            setFinalResults(results);

            if (updatedCalculationData.some(stage => stage.modules.some(m => m.isSelected))) {
                setShowFinalResults(true);
            }
            
            showNotification(t('notification_session_restored'), 'success');
        } catch (e) {
            showNotification(t('notification_session_restore_error'), 'error');
            localStorage.removeItem(AUTOSAVE_KEY);
        }
    }
    setShowRestoreDialog(false);
  }, [showNotification, t]);

  const handleDismissRestore = useCallback(() => {
      localStorage.removeItem(AUTOSAVE_KEY);
      setShowRestoreDialog(false);
  }, []);

  // Эффект для восстановления сессии при первой загрузке
  useEffect(() => {
      // FIX: Если мы заходим по прямой ссылке на общий проект, не нужно предлагать восстановить сессию.
      // Вместо этого, мы очищаем старое автосохранение, чтобы оно не мешало.
      const isSharedPath = currentPath.startsWith('/scheme/');
      if (isSharedPath) {
          localStorage.removeItem(AUTOSAVE_KEY);
          setShowRestoreDialog(false);
          return;
      }
      
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

  // FIX: Implement logic to handle shared project URLs.
  useEffect(() => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments[0] === 'scheme' && pathSegments.length > 1) {
        const sharedId = pathSegments[1];
        if (sharedId === loadedSharedId) {
            return; // Already loaded this shared project
        }

        const loadSharedProject = async (id: string) => {
            try {
                const projectData = await getSharedProject(id);
                if (projectData) {
                    const { engineParams: ep, calculationData: cd, schemeElements: se } = projectData;
                    
                    const { results, updatedCalculationData } = calculateCascade(ep, cd, t);
                    
                    setEngineParams(ep);
                    setCalculationData(updatedCalculationData);
                    setSchemeElements(se || []);
                    setFinalResults(results);
                    setShowFinalResults(!!results);
                    
                    setCurrentProject(null);
                    setLastSavedState(getDefaultStateAsString());
                    setIsViewingShared(true);
                    setLoadedSharedId(id);
                    
                    showNotification('Загружен общий проект. Сохраните его, чтобы внести изменения.', 'success');
                    navigate('/scheme');
                } else {
                    showNotification('Общий проект не найден. Вы будете перенаправлены на главную страницу.', 'error');
                    navigate('/');
                }
            } catch (error) {
                console.error("Ошибка при загрузке общего проекта:", error);
                showNotification('Ошибка при загрузке общего проекта.', 'error');
                navigate('/');
            }
        };
        loadSharedProject(sharedId);
    } else {
        // Reset state if we navigate away from a shared link
        if (isViewingShared) {
            setIsViewingShared(false);
        }
        if (loadedSharedId) {
            setLoadedSharedId(null);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]); // Only run when path changes. Other functions should be stable.

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
      showNotification(t('notification_at_least_one_module_configured'), 'error');
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
      
      // Закрываем диалоговое окно перед навигацией
      setShowChangesDialog(false);

      navigate('/scheme');
      setTimeout(() => {
          if (localStorage.getItem('onboardingComplete_introjs_scheme_v1') !== 'true') {
              setSchemeTourTrigger(Date.now());
          }
      }, 500);
    };

    if (hasMissingParams) {
        confirmAction(
            t('dialog_confirm_action_title'),
            t('dialog_missing_params_warning_message'),
            proceed,
            'dontShowMissingParamsWarning'
        );
    } else {
        proceed();
    }
  }, [calculationData, showNotification, navigate, confirmAction, t]);

  const handleGoToSchemeView = useCallback((options?: { refresh?: boolean }) => {
    if (options?.refresh) {
      // Пересчитываем данные, чтобы получить самые свежие значения
      const { updatedCalculationData } = calculateCascade(engineParams, calculationData, t);
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
  }, [engineParams, calculationData, t, schemeElements, showNotification, navigate]);
  
  const handleRevertAndGoToScheme = useCallback(() => {
    if (calculationDataForRevert) {
      // Re-run the calculation with the data to be restored.
      const { results, updatedCalculationData } = calculateCascade(engineParams, calculationDataForRevert, t);

      // Directly set the state to the restored and recalculated data.
      setCalculationData(updatedCalculationData);

      // Update final results.
      setFinalResults(results);
      
      if (updatedCalculationData.some(stage => stage.modules.some(m => m.isSelected))) {
          setShowFinalResults(true);
      }
      
      // Navigate to scheme, close dialog and notify user.
      navigate('/scheme');
      setShowChangesDialog(false);
      showNotification('Изменения на рабочем столе отменены.', 'success');
    }
  }, [calculationDataForRevert, engineParams, navigate, showNotification, t]);


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
            showDontShowAgain={!!confirmationState.storageKey}
        />
      )}
      {!isSchemeDrawing && (
        <header className="w-full p-2 sm:p-4 bg-white/80 backdrop-blur-sm sm:sticky top-0 z-30 border-b border-slate-200 flex justify-between items-center shadow-md shadow-slate-900/40">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                {t('app_title')}
            </h1>
            <div className="flex items-center space-x-2 ml-4">
                <LanguageSwitcher />
                <Button onClick={onNavigateToHome} variant="secondary" title={t('header_home_tooltip')} className="!px-3 !py-2 shadow-md shadow-slate-900/40 h-10"><HomeIcon /></Button>
                <Button onClick={() => openInfoModal()} variant="secondary" title={t('header_info_tooltip')} className="!px-3 !py-2 shadow-md shadow-slate-900/40 h-10"><InfoIcon /></Button>
                <Button onClick={() => setIsProjectActionsModalOpen(true)} variant="secondary" title={t('header_project_export_tooltip')} className="!px-3 !py-2 shadow-md shadow-slate-900/40 h-10"><FolderIcon /></Button>
                <AuthWidget />
            </div>
        </header>
      )}
      
      <main className={mainContentClass}>
        {showRestoreDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleDismissRestore}>
                <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-800">{t('dialog_session_restore_title')}</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        {t('dialog_session_restore_message')}
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="secondary" onClick={handleDismissRestore}>
                            {t('dialog_session_restore_cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleRestoreSession}>
                            {t('dialog_session_restore_confirm')}
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
            isDirty={isDirty}
            context={currentStep === AppStep.Workbench ? 'workbench' : 'scheme'}
            svgContainerRef={svgContainerRef}
            schemeElements={schemeElements}
            calculationData={calculationData}
            engineParams={engineParams}
            confirmAction={confirmAction}
            // FIX: Pass missing props to ProjectActionsModal.
            isViewingShared={isViewingShared}
            showNotification={showNotification}
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
                        <h3 className="text-lg font-bold text-gray-800">{t('dialog_structural_changes_title')}</h3>
                        <p className="mt-2 text-sm text-gray-600">
                           {t('dialog_structural_changes_message')}
                        </p>
                        <div className="mt-6 flex flex-col space-y-3">
                            <Button variant="primary" onClick={() => { 
                                confirmAction(
                                    t('dialog_rebuild_scheme_title'),
                                    t('dialog_rebuild_scheme_message'),
                                    handleBuildNewScheme,
                                    'dontShowRebuildSchemeWarning'
                                );
                            }}>
                                {t('dialog_structural_changes_apply_button')}
                            </Button>
                            <Button variant="secondary" onClick={() => {
                                confirmAction(
                                    t('dialog_revert_changes_title'),
                                    t('dialog_revert_changes_message'),
                                    handleRevertAndGoToScheme,
                                    'dontShowRevertChangesWarning'
                                );
                             }}>
                                {t('dialog_structural_changes_revert_button')}
                            </Button>
                            <Button variant="secondary" onClick={() => setShowChangesDialog(false)}>
                                {t('dialog_structural_changes_cancel_button')}
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
              // FIX: Pass missing props to WorkbenchPage.
              isViewingShared={isViewingShared}
              onOpenProjectModal={() => setIsProjectActionsModalOpen(true)}
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
              onDeleteProjectLocal={handleDeleteProjectLocal}
              onNewProject={handleNewProject}
              currentProject={currentProject}
              isDirty={isDirty}
              confirmAction={confirmAction}
              // FIX: Pass missing props to SchemeBuilderPage.
              isViewingShared={isViewingShared}
              showNotification={showNotification}
            />
            <OnboardingManager tourKey="scheme" startTourTrigger={schemeTourTrigger} />
          </>
        )}
      </main>
      {!isSchemeDrawing && (
        <footer className="w-full px-4 sm:px-6 lg:px-8 mt-8 py-6 text-center text-gray-500 text-sm border-t border-slate-200">
          <p>&copy; {new Date().getFullYear()} {t('footer_copyright')}</p>
          </footer>
      )}
    </div>
  );
};

export default Workbench;
