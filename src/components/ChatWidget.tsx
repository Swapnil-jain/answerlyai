'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ChatWidget() {
  const pathname = usePathname();

  useEffect(() => {
    // Only initialize the widget on the homepage
    if (pathname !== '/') return;

    // Wait for document to be ready
    if (typeof window === 'undefined') return;

    // Function to clean up widget resources
    const cleanupWidget = () => {
      // Remove widget scripts
      document.querySelectorAll('script').forEach(script => {
        if (script.src.includes('/api/widget/') || 
            script.text.includes('AnswerlyAIWidgetReady')) {
          script.remove();
        }
      });

      // Remove all widget-related DOM elements
      document.querySelectorAll('[id^="AnswerlyAIWidget"], .widget-container, [class*="widget"], [style*="z-index: 1000"]').forEach(el => {
        el.remove();
      });

      // Remove any shadow overlays that might have been created
      document.querySelectorAll('div[style*="box-shadow"]').forEach(el => {
        if (el.style.position === 'fixed' && el.style.zIndex === '1000') {
          el.remove();
        }
      });

      // Clean up global widget instance
      if (window.AnswerlyAIWidget) {
        if (typeof window.AnswerlyAIWidget.destroy === 'function') {
          window.AnswerlyAIWidget.destroy();
        }
        delete window.AnswerlyAIWidget;
      }

      // Remove event listeners
      window.removeEventListener('AnswerlyAIWidgetReady', () => {});
    };

    // Clean up any existing widgets before initializing
    cleanupWidget();

    // Create and append the widget script
    const widgetScript = document.createElement('script');
    widgetScript.src = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/widget/1adac23a-9bd5-4091-ba9f-e7d30a6af70f`;
    
    widgetScript.onload = () => {
      const initScript = document.createElement('script');
      initScript.text = `
        window.addEventListener('AnswerlyAIWidgetReady', function() {
          window.AnswerlyAIWidget.init({
            name: 'AnswerlyAI',
            theme: 'blue',
            position: 'bottom-right',
            userId: '2866612c-8fd8-43e5-958a-2f4cd8515f3a'
          });
        });
      `;
      document.body.appendChild(initScript);
    };

    document.body.appendChild(widgetScript);

    // Return cleanup function
    return cleanupWidget;
  }, [pathname]); // Re-run effect when pathname changes

  return null;
}