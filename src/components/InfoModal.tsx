import React, { useState, useEffect, useRef } from 'react';
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
  defaultTab: 'workbench' | 'scheme';
}

type InfoModalTab = 'workbench' | 'scheme' | 'guide' | 'catalog';

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

const QuickStartItem: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <li className="flex items-start space-x-4 py-4">
        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center" aria-hidden="true">
            <span className="text-3xl">{icon}</span>
        </div>
        <div>
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{children}</p>
        </div>
    </li>
);


export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, defaultTab }) => {
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
                    <TabButton tabId="workbench">Рабочий стол (Быстрый старт)</TabButton>
                    <TabButton tabId="scheme">Сборщик схем (Быстрый старт)</TabButton>
                    <TabButton tabId="guide">Подробное руководство</TabButton>
                    <TabButton tabId="catalog">Каталог УГО</TabButton>
                </nav>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-grow">
                {activeTab === 'workbench' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Быстрый старт: Рабочий стол</h3>
                        <ul className="divide-y divide-gray-200">
                             <QuickStartItem icon="⚙️" title="1. Настройте источник">
                                Задайте параметры крутящего момента и диапазон оборотов для вашего двигателя или другого источника мощности.
                            </QuickStartItem>
                            <QuickStartItem icon="➕" title="2. Добавьте ступени">
                                Каждая ступень представляет собой пару валов. Используйте кнопки <span className="font-mono font-bold">[+]</span> между ступенями, чтобы добавить новые.
                            </QuickStartItem>
                            <QuickStartItem icon="🔩" title="3. Сконфигурируйте передачи">
                                В каждой ступени выберите тип передачи (шестерня, цепь, и т.д.) и задайте ее параметры. Можно добавить несколько вариантов передач на одну ступень.
                            </QuickStartItem>
                            <QuickStartItem icon="📊" title="4. Анализируйте результаты">
                                Приложение автоматически рассчитывает итоговые параметры трансмиссии в реальном времени. Следите за ними в блоке "Итоговые параметры".
                            </QuickStartItem>
                             <QuickStartItem icon="📐" title="5. Постройте схему">
                                Когда конфигурация готова, нажмите кнопку "Построить схему", чтобы перейти в режим визуального редактора.
                            </QuickStartItem>
                        </ul>
                         <p className="mt-6 text-sm text-gray-600 text-center bg-gray-50 p-3 rounded-md">
                           Кликните на название параметра (например, <span className="text-blue-600 cursor-pointer">"z₁ (ведущая)"</span>), чтобы увидеть подсказку.
                        </p>
                    </section>
                )}
                 {activeTab === 'scheme' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Быстрый старт: Сборщик схем</h3>
                         <ul className="divide-y divide-gray-200">
                             <QuickStartItem icon="🧭" title="1. Навигация по схеме">
                                Перемещайте холст, зажав левую кнопку мыши, или пальцем на сенсорном экране. Масштабируйте колесом мыши или жестом "щипок". Кнопки управления справа внизу помогут вписать схему в экран.
                            </QuickStartItem>
                            <QuickStartItem icon="🖱️" title="2. Вызов меню настроек">
                                Кликните на любой элемент схемы (передачу, вал-проставку, источник), чтобы открыть его контекстное меню для детальной настройки.
                            </QuickStartItem>
                            <QuickStartItem icon="✏️" title="3. Редактирование компоновки">
                                В меню элемента можно инвертировать расположение параллельных передач, изменять направление поворота или потока, а также выбирать активный вариант передачи для многовариантных ступеней.
                            </QuickStartItem>
                            <QuickStartItem icon="↔️" title="4. Добавление валов-проставок">
                                Используйте меню, чтобы добавить вал-проставку до или после элемента. Это позволяет визуально раздвинуть компоненты схемы, например, для обхода наложений.
                            </QuickStartItem>
                             <QuickStartItem icon="⚙️" title="5. Связь с расчетами">
                                Из меню элемента можно быстро вернуться к его параметрам на "Рабочем столе" для корректировки расчетных данных.
                            </QuickStartItem>
                        </ul>
                    </section>
                )}
                 {activeTab === 'guide' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Подробное руководство</h3>
                         <div className="space-y-4 text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none">
                            <h4>Введение</h4>
                            <p>Это веб-приложение предназначено для проектирования и кинематического расчета многоступенчатых трансмиссий. Процесс работы разделен на два основных этапа: расчет на <strong>"Рабочем столе"</strong> и визуальная компоновка в <strong>"Сборщике схем"</strong>.</p>
                            
                            <h4>Этап 1: Рабочий стол</h4>
                            <p>Это главный экран для ввода всех исходных данных и анализа результатов.</p>
                            <ul className="list-disc list-inside">
                                <li><strong>Параметры источника:</strong> Здесь вы задаете начальные условия для всей трансмиссии: крутящий момент, диапазон оборотов и направление вращения входного вала.</li>
                                <li><strong>Ступени трансмиссии:</strong> Каждая "ступень" представляет собой пару соединенных валов. Вы можете добавлять и удалять ступени, чтобы построить трансмиссию нужной длины.</li>
                                <li><strong>Варианты передач:</strong> Внутри каждой ступени можно создать один или несколько "вариантов" передач. Это позволяет сравнивать разные типы передач (например, цилиндрическую и цепную) для одной и той же ступени. Обратите внимание, что поворотные и планетарные передачи могут быть только единственным вариантом на ступени.</li>
                                <li><strong>Выбор ведущего варианта:</strong> Если на ступени несколько вариантов, один из них должен быть выбран как "ведущий". Именно его параметры будут использоваться в итоговом расчете каскада.</li>
                                <li><strong>Итоговые параметры:</strong> Этот блок обновляется в реальном времени и показывает конечные характеристики всей трансмиссии, учитывая все ведущие варианты на всех ступенях.</li>
                            </ul>

                            <h4>Этап 2: Сборщик схем</h4>
                            <p>После того как расчетная часть на рабочем столе готова, вы переходите в сборщик для визуализации и компоновки.</p>
                            <ul className="list-disc list-inside">
                                <li><strong>Навигация:</strong> Используйте мышь или сенсорные жесты для перемещения и масштабирования схемы.</li>
                                <li><strong>Контекстное меню:</strong> Клик по любому элементу открывает меню, где доступны все опции, специфичные для этого элемента.</li>
                                <li><strong>Визуальная компоновка:</strong> Сборщик схем — это визуальный редактор. Изменения здесь (инверсия, поворот, добавление проставок) влияют только на отображение схемы и <strong>не меняют расчетные параметры</strong> (кроме выбора активного варианта).</li>
                                <li><strong>Валы-проставки:</strong> Если УГО передач накладываются друг на друга, используйте валы-проставки, чтобы увеличить расстояние между ними. В меню проставки можно настроить ее длину и внешний вид (сплошной, штриховой, карданный).</li>
                                <li><strong>Сброс компоновки:</strong> Кнопка "Сбросить схему" (ластик) отменяет все ваши изменения в компоновке и возвращает схему к ее первоначальному, автоматически сгенерированному виду.</li>
                            </ul>

                             <h4>Управление проектом и экспорт</h4>
                            <p>В правом верхнем углу доступно меню для работы с проектами и экспорта результатов. Вы можете сохранить все свои расчеты и компоновку схемы в один JSON-файл и загрузить его позже. Также доступен экспорт в форматы PDF (полный отчет со схемой и таблицами), CSV (только таблицы с данными) и SVG/PNG (только схема).</p>
                        </div>
                    </section>
                )}
                {activeTab === 'catalog' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Каталог условных обозначений</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <CatalogItem title="Цилиндрическая передача">
                                <div dangerouslySetInnerHTML={{ __html: cylindricalGearSVG }} />
                            </CatalogItem>
                            <CatalogItem title="Цепная передача">
                                 <div dangerouslySetInnerHTML={{ __html: chainDriveSVG }} />
                            </CatalogItem>
                             <CatalogItem title="Зубчато-ременная передача">
                                <div dangerouslySetInnerHTML={{ __html: toothedBeltDriveSVG }} />
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