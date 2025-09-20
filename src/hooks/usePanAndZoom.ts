import { useState, useRef, useCallback, useEffect, MouseEvent, TouchEvent, WheelEvent } from 'react';

// Жестко задаем только абсолютный максимум. Минимум будет динамическим.
const MAX_SCALE = 5;
const ABSOLUTE_MIN_SCALE = 0.1; // Запасной вариант, чтобы предотвратить исчезновение схемы

interface ViewState {
  scale: number;
  x: number;
  y: number;
}

interface PanAndZoomOptions {
  contentWidth: number;
  contentHeight: number;
}

export const usePanAndZoom = ({ contentWidth, contentHeight }: PanAndZoomOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const [minScale, setMinScale] = useState(ABSOLUTE_MIN_SCALE);
  const isPanning = useRef(false);
  const startPanPoint = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  // Функция для расчета и установки масштаба, чтобы схема помещалась в экран
  const calculateAndSetFitScale = useCallback(() => {
    if (!containerRef.current || !contentWidth || !contentHeight) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    if (containerWidth === 0 || containerHeight === 0) return;

    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const newMinScale = Math.min(scaleX, scaleY) * 0.95; // 95% для небольших отступов

    const clampedMinScale = clamp(newMinScale, ABSOLUTE_MIN_SCALE, MAX_SCALE);
    setMinScale(clampedMinScale);

    // Если текущий масштаб стал меньше нового минимального (например, после ресайза окна), корректируем его
    setView(prev => {
        if (prev.scale < clampedMinScale) {
            const newX = (containerWidth - contentWidth * clampedMinScale) / 2;
            const newY = (containerHeight - contentHeight * clampedMinScale) / 2;
            return { scale: clampedMinScale, x: newX, y: newY };
        }
        return prev;
    });

  }, [contentWidth, contentHeight]);

  // Эффект для отслеживания изменения размеров контейнера
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateAndSetFitScale();
    });

    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateAndSetFitScale]);

  const smoothPanTo = useCallback((targetX: number, targetY: number) => {
    if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
    }

    const startX = view.x;
    const startY = view.y;
    const dx = targetX - startX;
    const dy = targetY - startY;
    
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        setView(prev => ({ ...prev, x: targetX, y: targetY }));
        return;
    }

    const duration = 300; // ms
    let startTime: number | null = null;

    const easeOutQuad = (t: number) => t * (2 - t);

    const animate = (timestamp: number) => {
        if (!startTime) {
            startTime = timestamp;
        }

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuad(progress);

        const newX = startX + dx * easedProgress;
        const newY = startY + dy * easedProgress;
        
        setView(prev => ({ ...prev, x: newX, y: newY }));

        if (progress < 1) {
            animationFrame.current = requestAnimationFrame(animate);
        } else {
            animationFrame.current = null;
        }
    };

    animationFrame.current = requestAnimationFrame(animate);
  }, [view.x, view.y]);

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    isPanning.current = true;
    startPanPoint.current = { x: e.clientX - view.x, y: e.clientY - view.y };
  };
  
  const onTouchStart = (e: TouchEvent) => {
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    if (e.touches.length === 1) {
      isPanning.current = true;
      startPanPoint.current = { x: e.touches[0].clientX - view.x, y: e.touches[0].clientY - view.y };
    } else if (e.touches.length === 2) {
      isPanning.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.hypot(dx, dy);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isPanning.current) return;
    setView(prev => ({ ...prev, x: e.clientX - startPanPoint.current.x, y: e.clientY - startPanPoint.current.y }));
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1 && isPanning.current) {
      setView(prev => ({ ...prev, x: e.touches[0].clientX - startPanPoint.current.x, y: e.touches[0].clientY - startPanPoint.current.y }));
    } else if (e.touches.length === 2 && lastTouchDistance.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      const scaleChange = distance / lastTouchDistance.current;
      const prospectiveScale = view.scale * scaleChange;
      
      const newScale = clamp(prospectiveScale, minScale, MAX_SCALE);
      if (newScale === view.scale) return; // Предотвращение смещения

      const containerRect = containerRef.current!.getBoundingClientRect();
      const midPoint = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      const pointX = (midPoint.x - containerRect.left - view.x) / view.scale;
      const pointY = (midPoint.y - containerRect.top - view.y) / view.scale;

      setView({
        scale: newScale,
        x: midPoint.x - containerRect.left - pointX * newScale,
        y: midPoint.y - containerRect.top - pointY * newScale,
      });
      lastTouchDistance.current = distance;
    }
  };
  
  const onMouseUpOrLeave = () => { isPanning.current = false; };
  const onTouchEnd = () => { isPanning.current = false; lastTouchDistance.current = null; };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    const scaleAmount = 1.1;
    const prospectiveScale = e.deltaY < 0 ? view.scale * scaleAmount : view.scale / scaleAmount;

    const newScale = clamp(prospectiveScale, minScale, MAX_SCALE);
    if (newScale === view.scale) return; // Предотвращение смещения на границах

    const containerRect = containerRef.current.getBoundingClientRect();
    const pointX = (e.clientX - containerRect.left - view.x) / view.scale;
    const pointY = (e.clientY - containerRect.top - view.y) / view.scale;

    setView({
      scale: newScale,
      x: e.clientX - containerRect.left - pointX * newScale,
      y: e.clientY - containerRect.top - pointY * newScale,
    });
  };

  const zoom = (direction: 'in' | 'out') => {
    if (!containerRef.current) return;
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    const scaleAmount = 1.2;
    const prospectiveScale = direction === 'in' ? view.scale * scaleAmount : view.scale / scaleAmount;

    const newScale = clamp(prospectiveScale, minScale, MAX_SCALE);
    if (newScale === view.scale) return; // Предотвращение смещения на границах

    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    
    const pointX = (centerX - view.x) / view.scale;
    const pointY = (centerY - view.y) / view.scale;

    setView({
      scale: newScale,
      x: centerX - pointX * newScale,
      y: centerY - pointY * newScale,
    });
  };
  
  const zoomIn = () => zoom('in');
  const zoomOut = () => zoom('out');

  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !contentWidth || !contentHeight) return;
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    
    // Сначала пересчитываем минимальный масштаб на случай изменения размеров
    calculateAndSetFitScale(); 
    
    // Затем применяем этот масштаб
    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const newScale = Math.min(scaleX, scaleY) * 0.95;
    
    const clampedScale = clamp(newScale, ABSOLUTE_MIN_SCALE, MAX_SCALE);

    const newX = (containerWidth - contentWidth * clampedScale) / 2;
    const newY = (containerHeight - contentHeight * clampedScale) / 2;
    
    setView({ scale: clampedScale, x: newX, y: newY });
  }, [contentWidth, contentHeight, calculateAndSetFitScale]);

  const calculateCenterOnPoint = useCallback((pointX: number, pointY: number): { x: number, y: number } => {
    if (!containerRef.current) {
      return { x: view.x, y: view.y };
    }
    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    
    const isMobileView = containerWidth <= 1024;
    const HORIZONTAL_OFFSET_FACTOR = isMobileView ? 0.5 : 0.35; // Центрируем на мобильных, 35% на десктопе

    const newX = (containerWidth * HORIZONTAL_OFFSET_FACTOR) - (pointX * view.scale);
    const newY = (containerHeight / 2) - (pointY * view.scale); // Всегда центрируем по вертикали
    return { x: newX, y: newY };
  }, [view.scale]);

  const centerOnPoint = useCallback((pointX: number, pointY: number) => {
    // Эта функция ожидает уже преобразованные координаты (с учетом viewbox)
    const { x, y } = calculateCenterOnPoint(pointX, pointY);
    smoothPanTo(x, y);
  }, [calculateCenterOnPoint, smoothPanTo]);

  return {
    containerRef,
    view,
    setView,
    smoothPanTo,
    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
    panHandlers: {
      onMouseDown, onTouchStart, onMouseMove, onTouchMove, onMouseUp: onMouseUpOrLeave,
      onMouseLeave: onMouseUpOrLeave, onTouchEnd, onWheel,
    },
    zoomIn, zoomOut, fitToScreen, centerOnPoint,
    calculateCenterOnPoint,
  };
};