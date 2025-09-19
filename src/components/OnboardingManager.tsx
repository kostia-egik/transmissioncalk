import React, { useEffect, useRef } from 'react';

declare const introJs: any;

interface OnboardingManagerProps {
  tourKey: 'workbench' | 'scheme';
  startTourTrigger: number;
}


// --- React Interaction Helpers ---

/**
 * A hyper-realistic input simulation function.
 * It mimics the full sequence of events a user action would trigger,
 * including focus and mouse events, to ensure React components update correctly.
 * @param element The HTMLInputElement to modify.
 * @param value The new value to set.
 */
function simulateReactInput(element: HTMLInputElement | null, value: string) {
    if (!element) return;

    const eventOptions = { bubbles: true, cancelable: true, view: window };

    // 1. Simulate mouse entering and pressing down
    element.dispatchEvent(new PointerEvent('pointerover', eventOptions));
    element.dispatchEvent(new MouseEvent('mouseover', eventOptions));
    element.dispatchEvent(new PointerEvent('pointerdown', eventOptions));
    element.dispatchEvent(new MouseEvent('mousedown', eventOptions));

    // 2. Focus the element - this is often a critical step
    element.focus();

    // 3. Set the value using the native setter to bypass React's virtual DOM optimizations
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    nativeInputValueSetter?.call(element, value);

    // 4. Dispatch `input` and `change` events which React listens for
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // 5. Simulate mouse release and leaving
    element.dispatchEvent(new PointerEvent('pointerup', eventOptions));
    element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    element.dispatchEvent(new MouseEvent('click', eventOptions)); // A click often follows an input action
    
    // 6. Blur the element to finalize the input
    element.blur();
}

/**
 * A hyper-realistic click simulation function.
 * It focuses the element and dispatches a full sequence of pointer and mouse events.
 * @param element The element to be "clicked".
 */
function simulateReactClick(element: Element | null) {
    if (!element) return;

    // Ensure the element can receive focus if it's a focusable HTMLElement
    if (element instanceof HTMLElement && typeof element.focus === 'function') {
        element.focus();
    }

    const eventOptions: MouseEventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0, // Main button
        buttons: 1, // Main button pressed
    };

    // Simulate the full sequence of events a browser fires on a click
    element.dispatchEvent(new PointerEvent('pointerover', eventOptions));
    element.dispatchEvent(new MouseEvent('mouseover', eventOptions));
    element.dispatchEvent(new PointerEvent('pointerdown', eventOptions));
    element.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    element.dispatchEvent(new PointerEvent('pointerup', eventOptions));
    element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    element.dispatchEvent(new MouseEvent('click', eventOptions));
    
    // Blur after click if possible to mimic user moving away
    if (element instanceof HTMLElement && typeof element.blur === 'function') {
        element.blur();
    }
}

// --- Async Helpers ---
function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

async function waitFor(predicate: () => boolean, timeout = 1500, interval = 40) {
  const t0 = performance.now();
  while (true) {
    if (predicate()) return;
    if (performance.now() - t0 > timeout) return;
    await wait(interval);
  }
}

async function openDetailsIfCollapsed(contentEl: HTMLElement) {
  const cardId = contentEl.id.replace('module-details-content-', '');
  const btn = document.getElementById(`module-details-btn-${cardId}`);
  if (!btn) return;

  const isCollapsed = () =>
    contentEl.classList.contains('max-h-0') ||
    contentEl.getBoundingClientRect().height < 8;

  if (isCollapsed()) {
    simulateReactClick(btn);
    // Wait for the expansion to begin
    await waitFor(() => !contentEl.classList.contains('max-h-0') &&
                         contentEl.getBoundingClientRect().height > 10, 1200, 40);
    // Explicitly wait for the 300ms CSS transition to finish
    await wait(350);
  }
}


const OnboardingManager: React.FC<OnboardingManagerProps> = ({ tourKey, startTourTrigger }) => {
  const tourInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (startTourTrigger === 0) {
      return;
    }

    if (tourInstanceRef.current && tourInstanceRef.current._currentStep) {
      tourInstanceRef.current.exit();
    }

    const tourLocalStorageKey = `onboardingComplete_introjs_${tourKey}_v1`;
    if (localStorage.getItem(tourLocalStorageKey) === 'true') {
        return;
    }
    
    const intro = introJs();
    tourInstanceRef.current = intro;

    const isMobile = window.innerWidth <= 768;
    const ACTION_DELAY = 800; 

    const workbenchSteps = [
        {
            title: 'Добро пожаловать!',
            intro: 'Этот краткий тур познакомит вас с основными возможностями приложения для расчета трансмиссий. Давайте начнем!',
            hidePrev: true,
        },
        {
            element: '#engine-params-card',
            title: '1. Настройте источник',
            intro: 'Задайте параметры крутящего момента и диапазон оборотов для вашего двигателя или другого источника мощности.',
            position: 'bottom',
        },
        {
            element: '.add-stage-separator button',
            title: '2. Добавьте ступень',
            intro: 'Трансмиссия состоит из ступеней. Каждая ступень представляет собой пару валов. Используйте эту кнопку, чтобы добавить новую ступень между существующими.',
            position: 'bottom',
            highlightClass: 'highlight-circle'
        },
        {
            element: '#add-variant-btn-stage-0',
            title: '3. Добавьте передачу',
            intro: 'Добавьте вариант передачи на ступень. Вы можете добавить несколько параллельных передач (цилиндрические, цепные, ременные) для сравнения, но поворотные и планетарные могут быть только единственным вариантом.',
            position: isMobile ? 'bottom' : 'right',
        },
        {
            element: '#stage-0-module-0-default',
            title: '4. Сконфигурируйте передачу',
            intro: 'Выберите тип передачи и введите ее основные параметры. Для демонстрации, мы автоматически введем некоторые значения.',
            position: 'bottom',
        },
        {
            element: '#stage-0-module-0-default',
            title: '5. Посмотрите детали',
            intro: 'Здесь отображаются расчетные параметры модуля (межосевое расстояние, диаметры и т.д.), а также характеристики ступени на входе и выходе. Все данные обновляются в реальном времени.',
            position: 'right',
        },
        {
            element: '#final-results-card',
            title: '6. Анализируйте результаты',
            intro: 'После ввода данных в этом блоке появляются итоговые параметры всей трансмиссии. Следите за ними, чтобы оценить результат.',
            position: 'top',
        },
        {
            element: '#build-scheme-btn',
            title: '7. Постройте схему',
            intro: 'Когда конфигурация готова, нажмите кнопку "Построить схему", чтобы перейти в режим визуального редактора.',
            position: 'top',
        }
    ];

    const schemeSteps = [
        {
            title: 'Добро пожаловать в Сборщик схем!',
            intro: 'Здесь вы можете визуально компоновать вашу трансмиссию. Этот тур покажет, как это делать.',
            hidePrev: true,
        },
        {
            element: '#zoom-controls',
            title: '1. Навигация по схеме',
            intro: 'Перемещайте холст, зажав левую кнопку мыши, и масштабируйте колесом мыши. Эти кнопки также помогут вам управлять видом.',
            position: isMobile ? 'top' : 'left',
        },
        {
            element: '[data-ugo-id]:not([data-ugo-id="power-source"])',
            title: '2. Взаимодействие с элементами',
            intro: 'Клик по элементу схемы открывает его контекстное меню.',
            position: isMobile ? 'top' : 'right',
        },
        {
            element: '#ugo-context-menu',
            title: '3. Контекстное меню',
            intro: 'В меню можно инвертировать компоновку, добавить вал-проставку для раздвижки элементов или быстро перейти к параметрам на "Рабочем столе".',
            position: 'left',
            tooltipClass: 'context-menu-tooltip',
        },
        {
            element: '#scheme-header-controls',
            title: '4. Управление и экспорт',
            intro: 'Используйте эти кнопки, чтобы сбросить компоновку схемы к исходной или открыть меню проекта для сохранения и экспорта результатов.',
            position: isMobile ? 'bottom' : 'left',
        },
        {
            element: '#back-to-workbench-btn',
            title: '5. Назад к расчетам',
            intro: 'Эта кнопка вернет вас на "Рабочий стол" для редактирования расчетных параметров.',
            position: isMobile ? 'bottom' : 'right',
            highlightClass: 'highlight-circle'
        },
        {
            title: 'Тур завершен!',
            intro: 'Теперь вы готовы к работе. Экспериментируйте с компоновкой, чтобы достичь наилучшего результата!',
        }
    ];

    intro.setOptions({
      steps: tourKey === 'workbench' ? workbenchSteps : schemeSteps,
      showProgress: true,
      showBullets: false,
      exitOnOverlayClick: false,
      exitOnEsc: true,
      nextLabel: 'Далее',
      prevLabel: 'Назад',
      doneLabel: 'Завершить',
      tooltipClass: 'custom-introjs-tooltip',
      highlightClass: 'custom-introjs-highlight',
      dontShowAgain: true,
      dontShowAgainLabel: 'Больше не показывать',
      scrollToElement: true,
    });
    
    intro.onbeforechange(async function (this: any, nextEl: HTMLElement) {
        const isWorkbench = tourKey === 'workbench';
        const isScheme = tourKey === 'scheme';

        if (isWorkbench && this._currentStep <= 3 && nextEl?.id?.includes('stage-0-module-0')) {
            const card = document.getElementById('stage-0-module-0-default');
            if (!card) {
                const addBtn = document.getElementById('add-variant-btn-stage-0');
                if (addBtn) {
                    simulateReactClick(addBtn);
                    await wait(300);
                }
            }
        }
        
        if (isWorkbench && this._currentStep === 5 && nextEl?.id === 'stage-0-module-0-default') {
            const detailsContent = document.getElementById('module-details-content-stage-0-module-0-default');
            if (detailsContent) {
                await openDetailsIfCollapsed(detailsContent);
                this.refresh();
                await wait(30);
            }
        }

        const isFinalResultsStep = tourKey === 'workbench' && (this._options?.steps?.[this._currentStep]?.element === '#final-results-card' || this._currentStep === 6);
        if (isFinalResultsStep) {
            await waitFor(() => {
                const el = document.getElementById('final-results-card');
                return !!el && el.offsetWidth > 0 && el.offsetHeight > 0;
            }, 3000, 50);

            const el = document.getElementById('final-results-card') as HTMLElement | null;
            if (el) {
                el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
                await wait(350);
                if (this._introItems?.[this._currentStep]) {
                    this._introItems[this._currentStep].element = el;
                }
                this.refresh();
                await wait(50);
                this.refresh();
            }
        }

        const isUgoStep = isScheme && this._options?.steps?.[this._currentStep]?.element?.startsWith('[data-ugo-id');
        if (isUgoStep) {
            // This logic now runs BEFORE the UGO step is shown.
            // It performs the click and waits for the animation, so the highlight appears on a stable element.
            const ugo = nextEl?.matches('[data-ugo-id]:not([data-ugo-id="power-source"])') 
                ? nextEl 
                : document.querySelector('[data-ugo-id]:not([data-ugo-id="power-source"])');
            
            if (ugo && !document.getElementById('ugo-context-menu')) {
                 setTimeout(() => simulateReactClick(ugo), 150); // Small delay to let the previous step disappear
                 await wait(500); // Wait for pan animation (300ms) + buffer
                 this.refresh(); // Recalculate position before showing
            }
        }
        
        const isContextMenuStep = tourKey === 'scheme' && this._options?.steps?.[this._currentStep]?.element === '#ugo-context-menu';
        if (isContextMenuStep) {
            await waitFor(() => {
                const menu = document.getElementById('ugo-context-menu');
                if (!menu) return false;
                const rect = menu.getBoundingClientRect();
                return rect.height > 10 && rect.width > 10;
            }, 1500, 40);
    
            await wait(100); 
            
            const menuEl = document.getElementById('ugo-context-menu');
            if (menuEl) {
                 if (this._introItems?.[this._currentStep]) {
                    this._introItems[this._currentStep].element = menuEl;
                }
                this.refresh();
                await wait(50);
                this.refresh();
            }
        }
    });

    intro.onafterchange(function (this: any, targetEl: HTMLElement) {
        const isWorkbench = tourKey === 'workbench';
        const currentStepIndex = this._currentStep;

        if (isWorkbench && currentStepIndex === 4 && targetEl.id === 'stage-0-module-0-default') {
            setTimeout(() => {
                const z1Input = document.getElementById(`${targetEl.id}-z1`) as HTMLInputElement | null;
                const z2Input = document.getElementById(`${targetEl.id}-z2`) as HTMLInputElement | null;
                if (z1Input && z1Input.value.trim() === '') simulateReactInput(z1Input, '20');
                if (z2Input && z2Input.value.trim() === '') simulateReactInput(z2Input, '40');
                this.refresh();
            }, ACTION_DELAY);
        }
    });
    
    const onTourEnd = () => {
      if ((intro as any)._dontShowAgain) {
        localStorage.setItem(tourLocalStorageKey, 'true');
      }
    };
    intro.oncomplete(onTourEnd);
    intro.onexit(onTourEnd);
    
    const timer = setTimeout(() => intro.start(), 150);

    return () => {
      clearTimeout(timer);
      if (tourInstanceRef.current && tourInstanceRef.current._currentStep) {
          tourInstanceRef.current.exit();
      }
    };
  }, [startTourTrigger, tourKey]);

  return null;
};

export default OnboardingManager;
