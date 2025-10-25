

import React, { useState, useEffect } from 'react';
import { 
    cylindricalGearSVG,
    chainDriveSVG,
    toothedBeltDriveSVG,
    beltDriveSVG,
    bevelGearConfig1SVG,
	bevelGearConfig2SVG,
	bevelGearConfig3SVG,
    wormDriveTopSVG,
	wormDriveBottomSVG,
    planetaryGearFixedRingSVG,
	planetaryGearFixedSunSVG,
	planetaryGearFixedCarrierSVG,
    bearingHorizontalSVG,
    shaftSVG,
	shaftDashedSVG,
	cardanShaftSVG,
} from '../assets/ugo-static/svg-library';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab: 'guide' | 'catalog';
  onStartWorkbenchTour: () => void;
  onStartSchemeTour: () => void;
}

type InfoModalTab = 'guide' | 'catalog';

const CatalogItem: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({ title, children, description }) => (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 flex flex-col">
      <div className="relative w-full flex items-center justify-center min-h-[120px]">
        {children}
      </div>
      <div className="mt-2 text-center">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
);


export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, defaultTab, onStartWorkbenchTour, onStartSchemeTour }) => {
  const [activeTab, setActiveTab] = useState<InfoModalTab>(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) {
    return null;
  }

  const TabButton: React.FC<{ tabId: InfoModalTab; children: React.ReactNode }> = ({ tabId, children }) => {
    const isActive = activeTab === tabId;
    const activeClasses = 'border-blue-500 text-blue-600';
    const inactiveClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    return (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${isActive ? activeClasses : inactiveClasses}`}
            aria-current={isActive ? 'page' : undefined}
            role="tab"
        >
            {children}
        </button>
    );
  };


  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm rounded-t-xl flex-shrink-0">
          <h2 id="info-modal-title" className="text-xl font-bold text-gray-800">Справка по приложению</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Закрыть справку"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="flex-grow flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 px-6 flex-shrink-0 overflow-x-auto">
                <nav className="-mb-px flex space-x-8 flex-nowrap" aria-label="Tabs" role="tablist">
                    <TabButton tabId="guide">Подробное руководство</TabButton>
                    <TabButton tabId="catalog">Каталог УГО</TabButton>
                </nav>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-grow">
                 {activeTab === 'guide' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Руководство пользователя</h3>
                        <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="text-base font-semibold text-gray-700 text-center">Хотите пройти интерактивное обучение заново?</h4>
                            <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                                <button 
                                    onClick={onStartWorkbenchTour}
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors w-full sm:w-auto"
                                >
                                    Запустить тур по "Рабочему столу"
                                </button>
                                <button 
                                    onClick={onStartSchemeTour}
                                    className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-75 transition-colors w-full sm:w-auto"
                                >
                                    Запустить тур по "Сборщику схем"
                                </button>
                            </div>
                        </div>
                        <div className="space-y-6 text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none">
                            <div>
                                <h4>Введение</h4>
                                <p>Это веб-приложение — инструмент для прикидочного расчета многоступенчатых трансмиссий и их визуализации посредством кинематической схемы. Рабочий процесс интуитивно разделен на два этапа:</p>
                                <ol className="list-decimal list-inside pl-4 space-y-1">
                                    <li><strong>Рабочий стол:</strong> Мозговой центр, где вы вводите все числовые данные, конфигурируете ступени и анализируете расчеты.</li>
                                    <li><strong>Сборщик схем:</strong> Визуальное пространство, где вы компонуете кинематическую схему, управляете пространственным расположением элементов и готовите ее к экспорту.</li>
                                </ol>
                            </div>

                            <hr className="my-6"/>

                            <div>
                                <h4>Этап 1: Рабочий стол — Центр управления расчетами</h4>
                                <p>На этом экране происходит вся математическая работа. Он состоит из нескольких ключевых панелей.</p>
                                <ul className="list-disc list-inside pl-4 space-y-4">
                                    <li>
                                        <strong>Параметры источника</strong>
                                        <p className="pl-4 mt-1">Здесь задаются начальные условия для всей трансмиссии: крутящий момент, диапазон оборотов и начальное направление вращения. Эти данные являются отправной точкой для всех последующих каскадных расчетов.</p>
                                    </li>
                                    <li>
                                        <strong>Ступени трансмиссии</strong>
                                        <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li><strong>Ступень</strong> — это пара валов (например, "Валы 1 и 2"), между которыми передается мощность. Вы можете добавлять новые ступени, чтобы удлинить кинематическую цепь.</li>
                                            <li><strong>Карточка передачи</strong> — это блок конкретной передачи (цилиндрическая, цепная и т.д.), установленный на ступени. Вы можете добавить несколько вариантов на одну ступень для сравнения, но только один из них, отмеченный как <strong>"Ведущий"</strong>, будет участвовать в итоговом расчете.</li>
                                            <li><strong>Ограничение:</strong> Поворотные (коническая, червячная) и планетарные передачи могут быть только единственным вариантом на своей ступени.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Конфигурация передачи</strong>
                                        <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li>Выберите тип передачи (шестеренная, цепная, планетарная...). Для каждого типа доступны свои параметры.</li>
                                            <li>Кликните на название параметра (например, <code className="text-xs bg-gray-100 p-0.5 rounded">z₁</code>), чтобы увидеть подробную подсказку о нем.</li>
                                            <li>Для базового расчета достаточно заполнить минимальное количество параметров (количество зубьев, диаметры шкивов и т.д.).</li>
                                            <li>В раскрывающемся блоке <strong>"Детали"</strong> можно ввести дополнительные параметры (модуль, шаг, КПД) для более точного расчета. Там же вы найдете все производные расчетные параметры (диаметры, межосевое расстояние) и каскадные характеристики (момент и обороты на входе и выходе ступени).</li>
                                            <li>Расчеты обновляются <strong>в реальном времени</strong> после каждого изменения. Поля с ошибками подсвечиваются красным, с предупреждениями — желтым.</li>
                                            <li>В меню (три точки) на карточке модуля можно <strong>копировать и вставлять</strong> параметры, что ускоряет работу с однотипными передачами.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Итоговые параметры</strong>
                                        <p className="pl-4 mt-1">Этот блок динамически отображает конечные характеристики всей трансмиссии, учитывая все "ведущие" варианты на каждой ступени.</p>
                                    </li>
                                </ul>
                                <blockquote className="mt-4 p-3 border-l-4 border-slate-300 bg-slate-50 rounded-r-lg">
                                    <p className="font-semibold text-slate-700">Примечание:</p>
                                    <p>Возможна сборка схемы без выполнения расчетов. Если выбраны только типы передач, а их параметры не заданы, для построения схемы будут использованы стандартные значения.</p>
                                </blockquote>
                            </div>
                            
                            <hr className="my-6"/>

                            <div>
                                <h4>Этап 2: Сборщик схем — Визуальная компоновка</h4>
                                <p>После завершения расчетов, переходите в сборщик для визуализации и компоновки схемы.</p>
                                 <ul className="list-disc list-inside pl-4 space-y-4">
                                    <li>
                                        <strong>Навигация</strong>
                                        <p className="pl-4 mt-1">Перемещайте холст, зажав левую кнопку мыши, и масштабируйте колесом. Используйте кнопки управления для быстрого масштабирования и центрирования схемы на экране.</p>
                                    </li>
                                    <li>
                                        <strong>Контекстное меню</strong>
                                        <p className="pl-4 mt-1">Клик по любому элементу схемы (УГО — <strong>У</strong>словное <strong>Г</strong>рафическое <strong>О</strong>бозначение) открывает его меню. Здесь доступны основные параметры передачи и опции компоновки.</p>
                                        <ul className="list-[circle] list-inside ml-8 mt-1 space-y-1">
                                            <li>Для параллельных передач доступна <strong>инверсия компоновки</strong> и <strong>изменение направления</strong> выходного вала.</li>
                                            <li>Для поворотных передач — <strong>выбор направления выхода</strong>.</li>
                                            <li>Между меню соседних элементов можно быстро перемещаться с помощью кнопок <code className="text-xs bg-gray-100 p-0.5 rounded">←</code> и <code className="text-xs bg-gray-100 p-0.5 rounded">→</code>.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Решение коллизий</strong>
                                        <p className="pl-4 mt-1">Если УГО накладываются друг на друга, они подсвечиваются красным. Используйте <strong>валы-проставки</strong> (добавляются через контекстное меню), чтобы увеличить расстояние между элементами и избежать наложения. Стиль и длину проставки можно настроить в ее собственном меню.</p>
                                    </li>
                                    <li>
                                        <strong>Синхронизация и сброс</strong>
                                         <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li>Из меню элемента можно быстро вернуться к его параметрам на "Рабочем столе".</li>
                                            <li>Если вы изменили данные на "Рабочем столе", кнопка <strong>"Вернуться к схеме"</strong> предложит два варианта: обновить параметры на существующей компоновке или полностью перестроить схему, сбросив ваши изменения.</li>
                                            <li>Кнопка с иконкой ластика <strong>отменяет все изменения</strong> в компоновке и возвращает схему к ее автоматически сгенерированному виду.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <hr className="my-6"/>

                            <div>
                                 <h4>Управление проектом и экспорт</h4>
                                <p>В правом верхнем углу доступно меню для работы с проектами и экспорта результатов.</p>
                                <ul className="list-disc list-inside pl-4 space-y-4">
                                    <li>
                                        <strong>Управление проектами (Локальное сохранение)</strong>
                                        <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li><strong>Сохранение в браузере:</strong> Вы можете сохранить текущую работу (расчеты и схему) как именованный проект прямо в вашем браузере. Эти проекты будут доступны в списке при следующем визите.</li>
                                            <li><strong>Загрузка и обновление:</strong> Загружайте ранее сохраненные проекты из списка, переименовывайте их и обновляйте по мере внесения изменений.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Работа с файлами (.json)</strong>
                                        <p className="pl-4 mt-1">Используйте опции "Сохранить в файл" и "Загрузить из файла" для создания резервных копий или переноса проектов между разными компьютерами и браузерами.</p>
                                    </li>
                                    <li>
                                        <strong>Экспорт отчетов и схем</strong>
                                        <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li><strong>PDF:</strong> Создает полный отчет, включающий кинематическую схему и все таблицы с исходными, промежуточными и итоговыми данными. Идеально для документации.</li>
                                            <li><strong>CSV:</strong> Выгружает все расчетные данные в формате таблицы для открытия в Excel или Google Sheets.</li>
                                            <li><strong>SVG/PNG:</strong> Сохраняет только изображение кинематической схемы в векторном (SVG) или растровом (PNG) формате для вставки в презентации или другие документы.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>
                )}
                {activeTab === 'catalog' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Каталог условных обозначений</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <CatalogItem title="Зубчато-ременная передача">
                                <div dangerouslySetInnerHTML={{ __html: toothedBeltDriveSVG }} />
                            </CatalogItem>
                            <CatalogItem title="Цепная передача">
                                 <div dangerouslySetInnerHTML={{ __html: chainDriveSVG }} />
                            </CatalogItem>
                             <CatalogItem title="Цилиндрическая передача">
                                <div dangerouslySetInnerHTML={{ __html: cylindricalGearSVG }} />
                            </CatalogItem>
                            <CatalogItem title="Ременная передача">
                                 <div dangerouslySetInnerHTML={{ __html: beltDriveSVG }} />
                            </CatalogItem>
                            <CatalogItem title="Коническая передача" description="Схема 1">
                                <div dangerouslySetInnerHTML={{ __html: bevelGearConfig1SVG }} />
                                </CatalogItem>
                            <CatalogItem title="Коническая передача" description="Схема 2">
                                <div dangerouslySetInnerHTML={{ __html: bevelGearConfig2SVG }} />
                                </CatalogItem>
                            <CatalogItem title="Коническая передача" description="Схема 3">
                                <div dangerouslySetInnerHTML={{ __html: bevelGearConfig3SVG }} />
                            </CatalogItem>
                             <CatalogItem title="Червячная передача" description="Червяк сверху">
                                <div dangerouslySetInnerHTML={{ __html: wormDriveTopSVG }} />
                                </CatalogItem>
                             <CatalogItem title="Червячная передача" description="Червяк снизу">
                                <div dangerouslySetInnerHTML={{ __html: wormDriveBottomSVG }} />
                            </CatalogItem>
                            <CatalogItem title="Планетарная передача" description="Фиксированная коронная шестерня">
                                <div dangerouslySetInnerHTML={{ __html: planetaryGearFixedRingSVG }} />
                                </CatalogItem>
                            <CatalogItem title="Планетарная передача" description="Фиксировнная солнечная шестерня">
                                <div dangerouslySetInnerHTML={{ __html: planetaryGearFixedSunSVG }} />
                                </CatalogItem>
                            <CatalogItem title="Планетарная передача" description="Фиксированное водило">
                                <div dangerouslySetInnerHTML={{ __html: planetaryGearFixedCarrierSVG }} />
                                </CatalogItem>
                            <CatalogItem title="Вал">
                                <div dangerouslySetInnerHTML={{ __html: shaftSVG }} />
                                </CatalogItem>
                            <CatalogItem title="Вал условный">
                                <div dangerouslySetInnerHTML={{ __html: shaftDashedSVG }} />
                                </CatalogItem>
                            <CatalogItem title="Карданный вал (шарнирная муфта)">
                                <div dangerouslySetInnerHTML={{ __html: cardanShaftSVG }} />
                            </CatalogItem>
                            <CatalogItem title="Подшипник">
                                <div dangerouslySetInnerHTML={{ __html: bearingHorizontalSVG }} />
                            </CatalogItem>
                        </div>
                  </section>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};