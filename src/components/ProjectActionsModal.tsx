import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EngineParams, FinalCalculationResults, ModuleCalculationData, SchemeElement, StageCalculationData, Project } from '../types';
import { calculateCascade } from '../services/calculationService';
import Button from './Button';
import Input from './Input';
import { EditIcon } from '../assets/icons/EditIcon';
import { useAuth } from '../contexts/AuthContext';
import { ComputerIcon } from '../assets/icons/ComputerIcon';
import { CloudIcon } from '../assets/icons/CloudIcon';
import { getProjectsFromCloud, saveProjectToCloud, deleteProjectFromCloud, getProjectFromCloud, addSharedProject } from '../services/firestoreService';
import { getProject, getAllProjects } from '../services/db';
import { ShareIcon } from '../assets/icons/ShareIcon';
import { useNetworkStatus } from '../contexts/NetworkContext';
import { ConflictResolutionModal, ConflictInfo } from './ConflictResolutionModal';
import { useLanguage } from '../contexts/LanguageContext';


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

const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const handleExportSVG = async (svgContainer: HTMLElement, t: (key: any) => string) => {
    const svgElement = svgContainer.querySelector('svg');
    if (!svgElement) {
        alert(t('notification_error_svg_not_found'));
        return;
    }
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    downloadFile(blob, `transmission-scheme_${getTimestamp()}.svg`);
};

const handleExportPNG = async (svgContainer: HTMLElement, t: (key: any) => string) => {
    try {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(svgContainer, {
            backgroundColor: '#ffffff',
            scale: 2, // Increase resolution for better quality
        });
        const dataUrl = canvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        downloadFile(blob, `transmission-scheme_${getTimestamp()}.png`);
    } catch (error) {
        console.error('Ошибка при экспорте в PNG:', error);
        alert(t('notification_error_png_export'));
    }
};

const getDynamicHeaders = (allModules: ModuleCalculationData[]) => {
    const headerSet = new Set<string>();
    allModules.forEach(module => {
      Object.keys(module.inputs).forEach(key => {
        if (!['eta', 'config', 'shaftConfig'].includes(key)) {
          headerSet.add(key);
        }
      });
    });
    // A consistent order is good for UX
    return Array.from(headerSet).sort();
};
  
const getExportableRows = (calculationData: StageCalculationData[], t: (key: any) => string) => {
    const rows: any[] = [];
    calculationData.forEach((stage, stageIndex) => {
        stage.modules.forEach(module => {
            rows.push({
                stage: stageIndex + 1,
                status: module.isSelected ? t('export_status_leading') : t('export_status_variant'),
                type: module.type,
                u: module.u,
                eta: module.inputs.eta,
                ...module.inputs,
                cascadeIn: module.cascadeIn,
                cascadeOut: module.cascadeOut
            });
        });
    });
    return rows;
};

const handleExportCSV = (calculationData: StageCalculationData[], finalResults: FinalCalculationResults | null, t: (key: any) => string) => {
    const exportableRows = getExportableRows(calculationData, t);
    const allModules = calculationData.flatMap(s => s.modules);
    const dynamicHeaders = getDynamicHeaders(allModules);
    
    const staticHeaders = [t('export_csv_header_stage'), t('export_csv_header_status'), t('export_csv_header_type'), t('export_csv_header_u'), t('export_csv_header_eta')];
    const cascadeHeaders = [t('export_csv_header_in_torque'), t('export_csv_header_in_rpm'), t('export_csv_header_out_torque'), t('export_csv_header_out_rpm')];
    const headers = [...staticHeaders, ...dynamicHeaders, ...cascadeHeaders];

    const rows = exportableRows.map(row => {
        const rowData: (string | number)[] = [
            row.stage,
            row.status,
            row.type,
            row.u?.toFixed(4) || 'N/A',
            row.eta || 'N/A',
        ];
        dynamicHeaders.forEach(headerKey => { rowData.push(row[headerKey] || ''); });
        rowData.push(
            row.cascadeIn?.torque.toFixed(2) || 'N/A',
            `${row.cascadeIn?.minRpm.toFixed(0)}-${row.cascadeIn?.maxRpm.toFixed(0)}`,
            row.cascadeOut?.torque.toFixed(2) || 'N/A',
            `${row.cascadeOut?.minRpm.toFixed(0)}-${row.cascadeOut?.maxRpm.toFixed(0)}`
        );
        return rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';');
    });

    let csvContent = headers.join(';') + '\n' + rows.join('\n');
    if (finalResults) {
        csvContent += `\n\n${t('export_csv_final_results_title')}\n`;
        csvContent += `${t('export_csv_final_total_ratio')};${finalResults.totalGearRatio.toFixed(4)}\n`;
        csvContent += `${t('export_csv_final_total_efficiency')};${finalResults.totalEfficiency.toFixed(4)}\n`;
        csvContent += `${t('export_csv_final_out_torque')};${finalResults.finalTorque.toFixed(2)}\n`;
        csvContent += `${t('export_csv_final_out_rpm')};${finalResults.finalMinRpm.toFixed(0)}-${finalResults.finalMaxRpm.toFixed(0)}\n`;
    }
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `transmission-report_${getTimestamp()}.csv`);
};

const createStyledElement = (tag: string, styles: Partial<CSSStyleDeclaration>, text?: string): HTMLElement => {
    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    if (text) el.textContent = text;
    return el;
};

const createTableCell = (text: string | number, isHeader = false, styles: Partial<CSSStyleDeclaration> = {}) => {
    const cell = document.createElement(isHeader ? 'th' : 'td');
    cell.textContent = String(text);
    Object.assign(cell.style, {
        padding: '2px 4px',
        border: '1px solid #ddd',
        textAlign: 'left',
        ...styles,
    });
    return cell;
};

const handleExportPDF = async (
    svgContainer: HTMLElement | null,
    engineParams: EngineParams,
    calculationData: StageCalculationData[],
    finalResults: FinalCalculationResults | null,
    t: (key: any) => string
) => {
    const { jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const doc = new jsPDF({ orientation: 'l', unit: 'px', format: 'a4' });
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // --- Page 1: Title and Scheme ---
    doc.setFontSize(24);
    doc.text(t('export_pdf_report_title'), pdfWidth / 2, margin + 10, { align: 'center' });
    
    if (svgContainer) {
        const canvas = await html2canvas(svgContainer, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const pageContentWidth = pdfWidth - margin * 2;
        const pageContentHeight = pdfHeight - margin * 2 - 30; // Extra space for title
        
        const imgRatio = canvas.width / canvas.height;
        
        let finalWidth, finalHeight;
        if (imgRatio > (pageContentWidth / pageContentHeight)) {
            finalWidth = pageContentWidth;
            finalHeight = finalWidth / imgRatio;
        } else {
            finalHeight = pageContentHeight;
            finalWidth = finalHeight * imgRatio;
        }
        
        const imgX = (pdfWidth - finalWidth) / 2;
        const imgY = (pdfHeight - finalHeight) / 2 + 20;
        
        doc.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);
    } else {
        doc.setFontSize(12);
        doc.text(t('export_pdf_scheme_not_generated'), pdfWidth / 2, pdfHeight / 2, { align: 'center' });
    }

    // --- Subsequent pages: Data Tables ---
    const tablesContainer = createStyledElement('div', {
        position: 'absolute',
        left: '-9999px',
        top: '0',
        width: '1122px', // A4 landscape width
        padding: '20px',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
    });

    const createRow = (label: string, value: string) => {
        const tr = document.createElement('tr');
        tr.appendChild(createTableCell(label));
        const valueCell = createTableCell('');
        valueCell.appendChild(createStyledElement('b', {}, value));
        tr.appendChild(valueCell);
        return tr;
    };
    
    // 1. Engine Params Table
    tablesContainer.appendChild(createStyledElement('h2', { fontSize: '18px', marginTop: '0px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }, t('export_pdf_source_params_title')));
    const engineTable = createStyledElement('table', { width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' }) as HTMLTableElement;
    engineTable.appendChild(createRow(t('export_pdf_source_torque'), String(engineParams.initialTorque)));
    engineTable.appendChild(createRow(t('export_pdf_source_rpm'), `${engineParams.initialMinRpm} - ${engineParams.initialMaxRpm}`));
    engineTable.appendChild(createRow(t('export_pdf_source_direction'), t(engineParams.initialDirection === 'По часовой' ? 'rotation_clockwise' : 'rotation_counter_clockwise')));
    engineTable.appendChild(createRow(t('export_pdf_source_orientation'), engineParams.initialOrientation === 'horizontal' ? t('export_pdf_orientation_horizontal') : t('export_pdf_orientation_vertical')));
    tablesContainer.appendChild(engineTable);

    // 2. Final Results Table
    if (finalResults) {
        tablesContainer.appendChild(createStyledElement('h2', { fontSize: '18px', marginTop: '20px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }, t('export_pdf_final_results_title')));
        const finalTable = createStyledElement('table', { width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' }) as HTMLTableElement;
        finalTable.appendChild(createRow(t('export_csv_final_total_ratio'), finalResults.totalGearRatio.toFixed(4)));
        finalTable.appendChild(createRow(t('export_csv_final_total_efficiency'), finalResults.totalEfficiency.toFixed(4)));
        finalTable.appendChild(createRow(t('export_csv_final_out_torque'), finalResults.finalTorque.toFixed(2)));
        finalTable.appendChild(createRow(t('export_csv_final_out_rpm'), `${finalResults.finalMinRpm.toFixed(0)} - ${finalResults.finalMaxRpm.toFixed(0)}`));
        tablesContainer.appendChild(finalTable);
    }
    
    // 3. Stage Parameters Table
    tablesContainer.appendChild(createStyledElement('h2', { fontSize: '18px', marginTop: '20px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }, t('export_pdf_stage_params_title')));
    const paramsTable = createStyledElement('table', { width: '100%', borderCollapse: 'collapse', fontSize: '8px', marginTop: '10px' }) as HTMLTableElement;
    const thead = document.createElement('thead');
    thead.style.backgroundColor = '#f2f2f2';
    const headerRow = document.createElement('tr');

    const exportableRows = getExportableRows(calculationData, t);
    const allModules = calculationData.flatMap(s => s.modules);
    const dynamicHeaders = getDynamicHeaders(allModules);
    const staticHeaders = [t('export_csv_header_stage'), t('export_csv_header_status'), t('export_csv_header_type'), t('export_csv_header_u'), t('export_csv_header_eta')];
    const cascadeHeaders = [t('export_csv_header_in_torque'), t('export_csv_header_in_rpm'), t('export_csv_header_out_torque'), t('export_csv_header_out_rpm')];
    const allTableHeaders = [...staticHeaders, ...dynamicHeaders, ...cascadeHeaders];
    
    allTableHeaders.forEach(header => headerRow.appendChild(createTableCell(header, true)));
    thead.appendChild(headerRow);
    paramsTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    exportableRows.forEach(row => {
        const tr = document.createElement('tr');
        tr.appendChild(createTableCell(row.stage, false, { textAlign: 'center' }));
        tr.appendChild(createTableCell(row.status));
        tr.appendChild(createTableCell(row.type));
        tr.appendChild(createTableCell(row.u?.toFixed(4) || 'N/A', false, { textAlign: 'right' }));
        tr.appendChild(createTableCell(row.eta || 'N/A', false, { textAlign: 'right' }));

        dynamicHeaders.forEach(headerKey => {
            tr.appendChild(createTableCell(row[headerKey] || '', false, { textAlign: 'right' }));
        });

        tr.appendChild(createTableCell(row.cascadeIn?.torque.toFixed(2) || 'N/A', false, { textAlign: 'right' }));
        tr.appendChild(createTableCell(row.cascadeIn ? `${row.cascadeIn.minRpm.toFixed(0)}-${row.cascadeIn.maxRpm.toFixed(0)}` : 'N/A', false, { textAlign: 'right' }));
        tr.appendChild(createTableCell(row.cascadeOut?.torque.toFixed(2) || 'N/A', false, { textAlign: 'right' }));
        tr.appendChild(createTableCell(row.cascadeOut ? `${row.cascadeOut.minRpm.toFixed(0)}-${row.cascadeOut.maxRpm.toFixed(0)}` : 'N/A', false, { textAlign: 'right' }));
        tbody.appendChild(tr);
    });
    paramsTable.appendChild(tbody);
    tablesContainer.appendChild(paramsTable);

    document.body.appendChild(tablesContainer);

    try {
        const tablesCanvas = await html2canvas(tablesContainer, { scale: 2 });
        const tablesImgData = tablesCanvas.toDataURL('image/png');
        
        const tablesImgWidth = tablesCanvas.width;
        const tablesImgHeight = tablesCanvas.height;
        const tablesRatio = tablesImgHeight / tablesImgWidth;
        
        const contentWidth = pdfWidth;
        const imgHeightOnPdf = contentWidth * tablesRatio;
        
        let heightLeft = imgHeightOnPdf;
        let position = 0;

        if (imgHeightOnPdf > 0) {
            doc.addPage();
            doc.addImage(tablesImgData, 'PNG', 0, position, contentWidth, imgHeightOnPdf);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                doc.addPage();
                doc.addImage(tablesImgData, 'PNG', 0, position, contentWidth, imgHeightOnPdf);
                heightLeft -= pdfHeight;
            }
        }
        
        doc.save(`transmission-report_${getTimestamp()}.pdf`);
    } catch (error) {
        console.error('Ошибка при экспорте в PDF:', error);
        alert('Не удалось экспортировать в PDF. Подробности в консоли.');
    } finally {
        document.body.removeChild(tablesContainer);
    }
};


const isStageCalculationData = (el: SchemeElement): el is StageCalculationData => {
    if (!el || typeof el !== 'object' || 'type' in el) return false;
    const potentialStage = el as Partial<StageCalculationData>;
    return potentialStage.id !== undefined && potentialStage.stageName !== undefined && potentialStage.modules !== undefined && Array.isArray(potentialStage.modules);
};

interface ProjectActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToFile: () => void;
  onLoadFromFileClick: () => void;
  onSaveLocal: (project: Project) => Promise<string | undefined>;
  onLoadLocal: (project: Project) => Promise<void>;
  onDeleteLocal: (id: string) => Promise<void>;
  onNewProject: () => void;
  currentProject: Project | null;
  isDirty: boolean;
  context: 'workbench' | 'scheme';
  svgContainerRef?: React.RefObject<HTMLDivElement>;
  schemeElements: SchemeElement[];
  calculationData: StageCalculationData[];
  engineParams: EngineParams;
  confirmAction: (title: string, message: React.ReactNode, onConfirm: () => void, storageKey?: string) => void;
  isViewingShared: boolean;
  showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const truncateName = (name: string, maxLength: number = 20): string => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength - 1)}…`;
};

export const ProjectActionsModal: React.FC<ProjectActionsModalProps> = ({ 
    isOpen, onClose, onSaveToFile, onLoadFromFileClick, onSaveLocal, onLoadLocal, onDeleteLocal, onNewProject,
    currentProject, isDirty,
    context, svgContainerRef, schemeElements, calculationData, engineParams, confirmAction,
    isViewingShared, showNotification
}) => {
  const [activeTab, setActiveTab] = useState('project');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [projectNameInput, setProjectNameInput] = useState('');
  const [renamingState, setRenamingState] = useState<{ id: string; name: string } | null>(null);
  
  const [isListLoading, setIsListLoading] = useState(false);
  const [processingProjectId, setProcessingProjectId] = useState<string | null>(null);

  const [displayProjects, setDisplayProjects] = useState<Project[]>([]);
  const [conflictingProjects, setConflictingProjects] = useState<ConflictInfo[]>([]);
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const backdropRef = useRef<HTMLDivElement>(null);
  const mouseDownOnBackdrop = useRef(false);
  const { t } = useLanguage();

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
        mouseDownOnBackdrop.current = true;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mouseDownOnBackdrop.current && e.target === backdropRef.current) {
        onClose();
    }
    mouseDownOnBackdrop.current = false;
  };

  const refreshProjects = useCallback(async () => {
    setIsListLoading(true);
    try {
        const localProjects = await getAllProjects();
        const cloudProjects = (user && isOnline) ? await getProjectsFromCloud(user.uid) : [];
        
        const localMap = new Map<string, Project>(localProjects.map(p => [p.id, p]));
        const cloudMap = new Map<string, Project>(cloudProjects.map(p => [p.id, p]));
        
        const conflicts: ConflictInfo[] = [];
        const allProjects = new Map<string, Project>();

        for (const [id, localProject] of localMap.entries()) {
            const cloudProject = cloudMap.get(id);
            if (cloudProject) {
                // Проект существует в обоих местах
                // Допускаем разницу в 1 секунду для погрешности системных часов
                if (Math.abs(localProject.lastModified - cloudProject.lastModified) > 1000) {
                    conflicts.push({
                        id,
                        name: localProject.name || cloudProject.name,
                        localProject,
                        cloudProject
                    });
                } else {
                    // Версии идентичны, используем более новую на всякий случай
                    const projectToAdd = localProject.lastModified >= cloudProject.lastModified ? localProject : cloudProject;
                    allProjects.set(id, { ...projectToAdd, isLocal: true, isCloud: true });
                }
                cloudMap.delete(id); // Удаляем из облачной карты, чтобы избежать повторной обработки
            } else {
                // Только локальный проект
                allProjects.set(id, { ...localProject, isLocal: true, isCloud: false });
            }
        }
        
        // Добавляем оставшиеся проекты, которые есть только в облаке
        for (const [id, cloudProject] of cloudMap.entries()) {
            allProjects.set(id, { ...cloudProject, isLocal: false, isCloud: true });
        }

        if (conflicts.length > 0) {
            setConflictingProjects(conflicts);
            // Не устанавливаем displayProjects, так как сначала нужно разрешить конфликты
        } else {
            const sortedProjects = Array.from(allProjects.values()).sort((a, b) => b.lastModified - a.lastModified);
            setDisplayProjects(sortedProjects);
            setConflictingProjects([]); // Убедимся, что конфликты очищены
        }
    } catch (error) {
        console.error("Не удалось обновить проекты:", error);
        if (!isOnline) {
          showNotification(t('notification_projects_update_error_offline'), "warning");
        } else {
          showNotification(t('notification_projects_update_error'), "error");
        }
    } finally {
        setIsListLoading(false);
    }
  }, [user, isOnline, showNotification, t]);

  const handleResolveConflict = async (projectId: string, resolution: 'keep-local' | 'use-cloud') => {
    const conflict = conflictingProjects.find(c => c.id === projectId);
    if (!conflict || !user || !isOnline) {
        showNotification(t('notification_conflict_resolve_error_offline'), "error");
        return;
    };

    try {
        if (resolution === 'keep-local') {
            const projectToUpload = { ...conflict.localProject, lastModified: Date.now() };
            await saveProjectToCloud(user.uid, projectToUpload);
            // также обновляем локальную временную метку, чтобы она совпадала
            await onSaveLocal(projectToUpload);
        } else { // 'use-cloud'
            const projectToDownload = { ...conflict.cloudProject, lastModified: Date.now() };
            await onSaveLocal(projectToDownload);
        }
        showNotification(t('notification_conflict_resolve_success', { projectName: conflict.name }), 'success');
        const newConflicts = conflictingProjects.filter(c => c.id !== projectId);
        setConflictingProjects(newConflicts);
        if (newConflicts.length === 0) {
            await refreshProjects();
        }
    } catch (error) {
        console.error("Не удалось разрешить конфликт:", error);
        showNotification(t('notification_conflict_resolve_error_sync'), "error");
    }
  };


  useEffect(() => {
    if (isOpen) {
        refreshProjects();
    } else {
        setConflictingProjects([]); // Очищаем конфликты при закрытии модального окна
    }
  }, [isOpen, refreshProjects]);

  useEffect(() => {
    if (isOpen) {
        setProjectNameInput(currentProject?.name || '');
        setActiveTab('project');
        setRenamingState(null);
    }
  }, [isOpen, currentProject]);


  if (!isOpen) return null;

  const handleSaveAsNew = async () => {
    const newProjectData: Project = {
        id: String(Date.now()),
        name: projectNameInput.trim(),
        lastModified: Date.now(),
        meta: { appName: 'transmission-calculator', appVersion: '1.2.0' },
        data: { engineParams, calculationData, schemeElements }
    };
    await onSaveLocal(newProjectData);
    await refreshProjects();
  };

  const handleUpdateCurrent = async () => {
    if (currentProject) {
        await onSaveLocal({ ...currentProject, name: projectNameInput.trim(), data: { engineParams, calculationData, schemeElements }, lastModified: Date.now() });
        await refreshProjects();
    }
  };
  const handleStartRename = (project: Project) => { setRenamingState({ id: project.id, name: project.name }); };
  const handleCancelRename = () => { setRenamingState(null); };
  
  const handleConfirmRename = async () => {
    if (renamingState) {
        setProcessingProjectId(renamingState.id);
        try {
            const projectToRename = displayProjects.find(p => p.id === renamingState.id);
            if(projectToRename) {
                const updatedProject = {
                    ...projectToRename,
                    name: renamingState.name,
                    lastModified: Date.now()
                };

                if (projectToRename.isLocal) {
                  await onSaveLocal(updatedProject);
                }
                if (projectToRename.isCloud && user) {
                  if (!isOnline) {
                      showNotification(t('project_modal_offline_tooltip'), "error");
                  } else {
                      await saveProjectToCloud(user.uid, updatedProject);
                  }
                }
                
                await refreshProjects();
            }
        } finally {
            setRenamingState(null);
            setProcessingProjectId(null);
        }
    }
  };
  
  const handleDeleteEverywhere = (project: Project) => {
    confirmAction(
        t('dialog_delete_project_title', { projectName: truncateName(project.name) }),
        t('dialog_delete_project_message'),
        async () => {
            setProcessingProjectId(project.id);
            try {
                if (project.isLocal) await onDeleteLocal(project.id);
                if (project.isCloud && user) {
                    if (!isOnline) {
                        showNotification(t('project_modal_offline_tooltip'), "error");
                    } else {
                        await deleteProjectFromCloud(user.uid, project.id);
                    }
                }
                await refreshProjects();
            } finally {
                setProcessingProjectId(null);
            }
        },
        'dontShowProjectDeleteWarning'
    );
  };

  const handleDeleteLocalOnly = (project: Project) => {
    confirmAction(
        t('dialog_delete_local_copy_title', { projectName: truncateName(project.name) }),
        t('dialog_delete_local_copy_message'),
        async () => {
            setProcessingProjectId(project.id);
            try {
                await onDeleteLocal(project.id);
                await refreshProjects();
            } finally {
                setProcessingProjectId(null);
            }
        },
        'dontShowProjectDeleteWarning'
    );
  };

  const handleDeleteCloudOnly = (project: Project) => {
    if (!user) {
      showNotification(t('notification_share_signin_required'), "warning");
      return;
    }
    if (!isOnline) {
      showNotification(t('project_modal_offline_tooltip'), "error");
      return;
    }
    confirmAction(
        t('dialog_delete_cloud_copy_title', { projectName: truncateName(project.name) }),
        t('dialog_delete_cloud_copy_message'),
        async () => {
            setProcessingProjectId(project.id);
            try {
                await deleteProjectFromCloud(user.uid, project.id);
                await refreshProjects(); // Manual refresh needed for cloud-only changes
            } finally {
                setProcessingProjectId(null);
            }
        },
        'dontShowProjectDeleteWarning'
    );
  };
  
  const handleSyncToCloud = async (project: Project) => {
    if (!user) { showNotification(t('notification_share_signin_required'), "warning"); return; }
    if (!isOnline) { showNotification(t('project_modal_offline_tooltip'), "error"); return; }
    setProcessingProjectId(project.id);
    try {
        const localProjectData = await getProject(project.id);
        if(localProjectData) {
            await saveProjectToCloud(user.uid, localProjectData);
            await refreshProjects();
        }
    } finally {
        setProcessingProjectId(null);
    }
  };

  const handleSyncToLocal = async (project: Project) => {
      if(!user) return;
      if (!isOnline) { showNotification(t('project_modal_offline_tooltip'), "error"); return; }
      setProcessingProjectId(project.id);
      try {
        const cloudProjectData = await getProjectFromCloud(user.uid, project.id);
        if(cloudProjectData) {
            await onSaveLocal(cloudProjectData);
            await refreshProjects();
        }
      } finally {
        setProcessingProjectId(null);
    }
  };

   const handleShareProject = async (project: Project) => {
        if (!user) {
            showNotification(t('notification_share_signin_required'), 'warning');
            return;
        }
        if (!isOnline) {
          showNotification(t('project_modal_offline_tooltip'), "error");
          return;
        }
        setProcessingProjectId(project.id);
        try {
            let projectData = project.data;
            if (!projectData || !projectData.engineParams) { // A simple check if full data is missing
                const fullProject = await getProjectFromCloud(user.uid, project.id);
                if (!fullProject) throw new Error(t('notification_share_data_not_found'));
                projectData = fullProject.data;
            }

            const sharedId = await addSharedProject(projectData);
            const shareUrl = `${window.location.origin}/scheme/${sharedId}`;
            await navigator.clipboard.writeText(shareUrl);
            showNotification(t('notification_share_success'), 'success');
        } catch (error) {
            console.error(t('notification_share_error'), error);
            const message = error instanceof Error ? error.message : t('notification_share_error_default');
            showNotification(message, 'error');
        } finally {
            setProcessingProjectId(null);
        }
    };

  const onExportClick = async (format: 'svg' | 'png' | 'csv' | 'pdf') => {
    setLoadingMessage(t('project_modal_generating_file', { format: format.toUpperCase() }));
    setIsLoading(true);
    
    const effectiveCalculationData = context === 'workbench' 
        ? calculationData 
        : schemeElements.filter(isStageCalculationData);

    const { results } = calculateCascade(engineParams, effectiveCalculationData, t);

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        switch (format) {
            case 'svg':
            case 'png':
                if (context === 'scheme' && svgContainerRef?.current) {
                    if (format === 'svg') await handleExportSVG(svgContainerRef.current, t);
                    else await handleExportPNG(svgContainerRef.current, t);
                }
                break;
            case 'csv':
                handleExportCSV(effectiveCalculationData, results, t as any);
                break;
            case 'pdf':
                if (context === 'workbench') {
                    alert(t('notification_pdf_export_workbench_warning'));
                    setIsLoading(false);
                    return;
                } else if (svgContainerRef?.current) {
                    await handleExportPDF(svgContainerRef.current, engineParams, effectiveCalculationData, results, t as any);
                }
                break;
        }
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const TabButton: React.FC<{ tabId: string; children: React.ReactNode }> = ({ tabId, children }) => {
    const isActive = activeTab === tabId;
    const activeClasses = 'border-blue-500 text-blue-600';
    const inactiveClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    return (
      <button onClick={() => setActiveTab(tabId)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${isActive ? activeClasses : inactiveClasses}`} aria-current={isActive ? 'page' : undefined} role="tab">
        {children}
      </button>
    );
  };
  
  const truncatedProjectName = currentProject ? `"${truncateName(currentProject.name)}"` : t('project_modal_current_project_fallback');
  const offlineTitle = t('project_modal_offline_tooltip');

  return (
    <div 
        ref={backdropRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" 
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="project-modal-title"
    >
        {conflictingProjects.length > 0 ? (
            <ConflictResolutionModal
                conflicts={conflictingProjects}
                onResolve={handleResolveConflict}
                onClose={onClose}
            />
        ) : (
          <div className="bg-white rounded-lg shadow-xl m-4 max-w-md w-full animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 id="project-modal-title" className="text-lg font-bold text-gray-800">{t('project_modal_title')}</h3>
              <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200" aria-label={t('common_close_esc')}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="border-b border-gray-200 px-4"><nav className="-mb-px flex space-x-6" aria-label="Tabs" role="tablist"><TabButton tabId="project">{t('project_modal_tab_project')}</TabButton><TabButton tabId="export">{t('project_modal_tab_export')}</TabButton></nav></div>
            
            <div className="p-6 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-3"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-600">{loadingMessage}</p></div>
              ) : (
                <>
                  {activeTab === 'project' && (
                    <div className='space-y-6'>
                        <div>
                            <Input id="project-name" name="projectName" label={t('project_modal_name_label')} value={projectNameInput} onChange={e => setProjectNameInput(e.target.value)} placeholder={t('project_modal_name_placeholder')} />
                             {currentProject && isDirty && (
                                <p className="text-xs text-amber-600 font-semibold text-center mt-2" title={t('project_modal_dirty_warning', { projectName: currentProject.name })}>{t('project_modal_dirty_warning', { projectName: truncatedProjectName })}</p>
                            )}
                            <div className="flex flex-col space-y-2 mt-2">
                                {currentProject && !isViewingShared && (
                                    <Button onClick={handleUpdateCurrent} variant="primary" className="w-full" disabled={!isDirty} title={t('project_modal_update_button', { projectName: currentProject.name })}>{t('project_modal_update_button', { projectName: truncatedProjectName })}</Button>
                                )}
                                <Button onClick={handleSaveAsNew} variant="primary" className="w-full" disabled={!projectNameInput.trim()}>{t('project_modal_save_as_new_button')}</Button>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-gray-700 mb-2 text-center">{t('project_modal_projects_title')}</h4>
                            {!user && <p className="text-xs text-center text-gray-500 bg-gray-100 p-2 rounded-md">{t('project_modal_signin_prompt')}</p>}
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 mt-2">
                              {isListLoading ? (
                                  <div className="flex justify-center items-center p-8">
                                      <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                      <p className="ml-3 text-gray-600">{t('project_modal_loading_projects')}</p>
                                  </div>
                              ) : displayProjects.length > 0 ? (
                                    displayProjects.map(proj => {
                                        const isProcessing = processingProjectId === proj.id;
                                        return (
                                            <div key={proj.id} className="p-2 bg-gray-50 rounded-md border">
                                                {renamingState?.id === proj.id ? (
                                                    <div className="flex items-center space-x-2 w-full">
                                                        <Input value={renamingState.name} onChange={(e) => setRenamingState(prev => prev ? {...prev, name: e.target.value} : null)} onKeyDown={(e) => { if(e.key === 'Enter') handleConfirmRename(); if(e.key === 'Escape') handleCancelRename(); }} className="!mb-0 flex-grow" inputClassName="!mt-0 !py-1 text-sm" />
                                                        <Button onClick={handleConfirmRename} variant='primary' className='!px-2 !py-1 text-xs flex-shrink-0' disabled={isProcessing}>✓</Button>
                                                        <Button onClick={handleCancelRename} variant='secondary' className='!px-2 !py-1 text-xs flex-shrink-0' disabled={isProcessing}>✕</Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-3 w-full">
                                                        <div className="flex items-center space-x-1 flex-shrink-0 h-7 w-[52px]">
                                                            {isProcessing ? (
                                                                <div className="w-full flex justify-center items-center">
                                                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => proj.isLocal ? handleDeleteLocalOnly(proj) : handleSyncToLocal(proj)} disabled={isProcessing || (!proj.isLocal && !isOnline)} className={`p-1 rounded-full transition-colors disabled:cursor-wait ${proj.isLocal ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-200 hover:text-slate-600'}`} title={proj.isLocal ? t('project_modal_delete_local_tooltip') : (!isOnline ? offlineTitle : t('project_modal_download_from_cloud_tooltip'))}>
                                                                        <ComputerIcon className={`w-5 h-5 ${proj.isLocal ? 'opacity-100' : 'opacity-40'}`} />
                                                                    </button>
                                                                    <button disabled={!user || isProcessing || !isOnline} onClick={() => proj.isCloud ? handleDeleteCloudOnly(proj) : handleSyncToCloud(proj)} className={`p-1 rounded-full transition-colors disabled:cursor-wait ${!user ? 'cursor-not-allowed' : (proj.isCloud ? 'text-blue-500 hover:bg-blue-100' : 'text-blue-300 hover:bg-blue-100 hover:text-blue-500')}`} title={!user ? t('project_modal_signin_required_tooltip') : !isOnline ? offlineTitle : (proj.isCloud ? t('project_modal_delete_from_cloud_tooltip') : t('project_modal_save_to_cloud_tooltip'))}>
                                                                      <CloudIcon className={`w-5 h-5 ${proj.isCloud ? 'opacity-100' : 'opacity-40'}`} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="flex-grow overflow-hidden min-w-0">
                                                            <p className="font-semibold text-sm text-gray-800 truncate" title={proj.name}>{proj.name}</p>
                                                            <p className="text-xs text-gray-500">{new Date(proj.lastModified).toLocaleString()}</p>
                                                        </div>
                                                        
                                                        <div className="flex items-center space-x-1 flex-shrink-0">
                                                            <button onClick={() => handleShareProject(proj)} disabled={!proj.isCloud || isProcessing || !isOnline} className='p-1.5 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-colors disabled:cursor-not-allowed disabled:text-gray-300' title={!proj.isCloud ? t('project_modal_share_disabled_tooltip') : !isOnline ? offlineTitle : t('project_modal_share_tooltip')}>
                                                                <ShareIcon className="w-4 h-4" />
                                                            </button>
                                                            <Button onClick={() => onLoadLocal(proj)} variant='secondary' className='!px-3 !py-1 text-xs' disabled={isProcessing}>{t('project_modal_load_button')}</Button>
                                                            <button onClick={() => handleStartRename(proj)} disabled={isProcessing} className='p-1.5 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-colors disabled:cursor-wait' title={t('project_modal_rename_tooltip')}><EditIcon /></button>
                                                            <Button onClick={() => handleDeleteEverywhere(proj)} variant='danger' className='!px-2 !py-1 text-xs' title={t('project_modal_delete_everywhere_tooltip')} disabled={isProcessing}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-center text-sm text-gray-500 py-4">{t('project_modal_no_projects')}</p>
                                )}
                            </div>
                        </div>
                         <div className="border-t pt-4">
                            <Button onClick={onNewProject} variant="secondary" className="w-full">{t('project_modal_new_project_button')}</Button>
                        </div>
                    </div>
                  )}
                  {activeTab === 'export' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b pb-1">{t('project_modal_export_report_title')}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={() => onExportClick('pdf')} variant="secondary" className="w-full">{t('project_modal_export_pdf_button')}</Button>
                          <Button onClick={() => onExportClick('csv')} variant="secondary" className="w-full">{t('project_modal_export_csv_button')}</Button>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b pb-1">{t('project_modal_export_scheme_title')}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={() => onExportClick('svg')} variant="secondary" className="w-full" disabled={context !== 'scheme'} title={context !== 'scheme' ? t('project_modal_export_scheme_disabled_tooltip') : ''}>{t('project_modal_export_svg_button')}</Button>
                          <Button onClick={() => onExportClick('png')} variant="secondary" className="w-full" disabled={context !== 'scheme'} title={context !== 'scheme' ? t('project_modal_export_scheme_disabled_tooltip') : ''}>{t('project_modal_export_png_button')}</Button>
                        </div>
                      </div>
                       <div>
                        <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b pb-1">{t('project_modal_project_files_title')}</h4>
                         <div className="flex flex-col space-y-2">
                            <Button onClick={onSaveToFile} variant="secondary" className="w-full">{t('project_modal_save_to_file_button')}</Button>
                            <Button onClick={onLoadFromFileClick} variant="secondary" className="w-full">{t('project_modal_load_from_file_button')}</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
};