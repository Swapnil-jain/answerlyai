'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

interface AnswerlyAIWidget {
  init: (config: WidgetConfig) => void;
  destroy?: () => void;
}

interface WidgetConfig {
  name: string;
  theme: string;
  position: string;
  userId: string;
}

declare global {
  interface Window {
    AnswerlyAIWidget?: AnswerlyAIWidget;
  }
}

export default function ChatWidget() {
  const pathname = usePathname();

  const cleanupWidget = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Remove all widget-related elements in one query
    const elementsToRemove = document.querySelectorAll(`
      script[src*="/api/widget/"],
      script:not([src])[text*="AnswerlyAIWidgetReady"],
      [id^="AnswerlyAIWidget"],
      .widget-container,
      [class*="widget"],
      [style*="z-index: 1000"],
      div[style*="box-shadow"][style*="position: fixed"][style*="z-index: 1000"]
    `);

    elementsToRemove.forEach(el => el.remove());

    // Clean up global widget instance
    if (window.AnswerlyAIWidget?.destroy) {
      window.AnswerlyAIWidget.destroy();
    }
    delete window.AnswerlyAIWidget;
  }, []);

  useEffect(() => {
    // Only initialize the widget on the homepage
    if (pathname !== '/') return;

    // Wait for document to be ready
    if (typeof window === 'undefined') return;

    // Clean up any existing widgets before initializing
    cleanupWidget();

    const widgetId = process.env.NEXT_PUBLIC_WIDGET_ID;
    const userId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID;

    if (!widgetId || !userId) {
      console.error('Missing required environment variables for widget');
      return;
    }

    // Return cleanup function
    return cleanupWidget;
  }, [pathname, cleanupWidget]);

  if (pathname !== '/') return null;

  return (
    <>
      <Script
        src={`${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/widget/${process.env.NEXT_PUBLIC_WIDGET_ID}`}
        strategy="afterInteractive"
        onError={(e) => {
          console.error('Error loading widget script:', e);
        }}
        onLoad={() => {
          window.addEventListener('AnswerlyAIWidgetReady', function initWidget() {
            console.log('Widget ready event received');
            if (window.AnswerlyAIWidget?.init) {
              window.AnswerlyAIWidget.init({
                name: 'AnswerlyAI',
                theme: 'blue',
                position: 'bottom-right',
                userId: process.env.NEXT_PUBLIC_DEFAULT_USER_ID || ''
              });
            }
            window.removeEventListener('AnswerlyAIWidgetReady', initWidget);
          });
        }}
      />
    </>
  );
}