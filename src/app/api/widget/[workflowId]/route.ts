import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract `workflowId` from the request URL
    const { pathname } = new URL(request.url);
    const workflowId = pathname.split('/').pop();

    if (!workflowId) {
      throw new Error('workflowId is missing in the URL.');
    }
    
    console.log('Serving widget for workflow:', workflowId);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;

    const widgetScript = `
      console.log('Widget script loaded for workflow:', '${workflowId}');
      (function() {
        // Add initial message when chat opens - moved into the ChatWidget component
        // to support dynamic name

        console.log('Widget IIFE executing');
        
        // Initialize widget immediately if React is already loaded
        if (window.React && window.ReactDOM) {
          initializeWidget();
        } else {
          // Load React if not already present
          Promise.all([
            loadScript('https://unpkg.com/react@18/umd/react.production.min.js'),
            loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'),
            loadScript('https://cdn.jsdelivr.net/npm/marked@11.1.0/lib/marked.umd.min.js')
          ]).then(initializeWidget)
            .catch(error => console.error('Error loading dependencies:', error));
        }

        function loadScript(src) {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        function initializeWidget() {
          console.log('Initializing widget...');
          
          function ChatWidget({ workflowId, theme = 'light', position = 'bottom-right', userId, name = 'Cora' }) {
            // Get theme color based on theme name
            const getThemeColor = (theme) => {
              switch(theme) {
                case 'blue': return '#2563eb';
                case 'red': return '#dc2626';
                case 'green': return '#16a34a';
                case 'purple': return '#7c3aed';
                case 'indigo': return '#4f46e5';
                case 'pink': return '#db2777';
                case 'orange': return '#ea580c';
                case 'light': return '#1f2937';
                default: return '#2563eb'; // default blue
              }
            };

            const [isOpen, setIsOpen] = React.useState(false);
            const [messages, setMessages] = React.useState([{
              type: 'bot',
              content: \`Hi 👋, I am \${name} - Your very own chat assistant! How may I help you today?\`
            }]);
            const [input, setInput] = React.useState('');
            const [isLoading, setIsLoading] = React.useState(false);

            const handleSend = async () => {
              if (!input.trim()) return;

              const userMessage = input.trim();
              setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
              setInput('');
              setIsLoading(true);

              try {
                const response = await fetch('${baseUrl}/api/chat/${workflowId}', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin,
                    ...(userId && { 'X-User-ID': userId }),
                    'X-Assistant-Name': name // Add the name to headers
                  },
                  body: JSON.stringify({
                    message: userMessage,
                    workflowId: '${workflowId}',
                    history: messages.map(msg => ({
                      role: msg.type === 'user' ? 'user' : 'assistant',
                      content: msg.content
                    }))
                  })
                });

                const data = await response.json();
                
                setIsLoading(false);

                if (data.success) {
                  setMessages(prev => [...prev, {
                    type: 'bot',
                    content: data.response
                  }]);
                } else {
                  throw new Error(data.message);
                }
              } catch (error) {
                console.error('Chat error:', error);
                setMessages(prev => [...prev, { 
                  type: 'bot', 
                  content: 'Sorry, I encountered an error. Please try again.' 
                }]);
              } finally {
                setIsLoading(false);
              }
            };

            // Create a scoped container for the widget
            const widgetContainer = document.createElement('div');
            widgetContainer.id = 'answerlyai-widget-root';
            document.body.appendChild(widgetContainer);

            // Add scoped styles
            const styles = document.createElement('style');
            styles.textContent = \`
              #answerlyai-widget-root {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                font-size: 17px;
                line-height: 1.5;
                color: #1f2937;
              }
              #answerlyai-widget-root * {
                box-sizing: border-box;
              }
              #answerlyai-widget-root .widget-prose {
                font-size: inherit;
                line-height: 1.5;
              }
              #answerlyai-widget-root .widget-prose p {
                margin: 0.5em 0;
              }
              #answerlyai-widget-root .widget-prose ul {
                list-style-type: disc;
                padding-left: 1.5em;
                margin: 0.5em 0;
              }
              #answerlyai-widget-root .widget-prose ol {
                list-style-type: decimal;
                padding-left: 1.5em;
                margin: 0.5em 0;
              }
              #answerlyai-widget-root .widget-prose strong {
                font-weight: 600;
              }
              #answerlyai-widget-root .typing-indicator {
                display: flex;
                gap: 4px;
              }
              #answerlyai-widget-root .typing-dot {
                width: 8px;
                height: 8px;
                background-color: #6b7280;
                border-radius: 50%;
                animation: bounce 1.4s infinite;
              }
              #answerlyai-widget-root .typing-dot:nth-child(2) { animation-delay: -1.1s; }
              #answerlyai-widget-root .typing-dot:nth-child(3) { animation-delay: -0.8s; }
              @keyframes bounce {
                0%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-6px); }
              }
              #answerlyai-widget-root .bg-blue-500 { 
                background-color: #3b82f6;
                border-radius: 12px;
                padding: 12px 16px;
                margin: 4px 0;
              }
              #answerlyai-widget-root .bg-gray-100 { 
                background-color: #f3f4f6;
                border-radius: 12px;
                padding: 12px 16px;
                margin: 4px 0;
              }
              #answerlyai-widget-root .max-w-[80%] {
                max-width: 80%;
                border-radius: 12px;
                overflow-wrap: break-word;
                word-break: break-word;
              }
              #answerlyai-widget-root .text-white { 
                color: #ffffff; 
                font-size: 16px;
                line-height: 1.5;
              }
              #answerlyai-widget-root .text-gray-800 { 
                color: #1f2937;
                font-size: 16px;
                line-height: 1.5;
              }
            \`;
            document.head.appendChild(styles);

            return React.createElement('div', {
              id: 'answerlyai-widget-root',
              style: {
                position: 'fixed',
                ...(position === 'bottom-right' 
                  ? { bottom: '20px', right: '20px' }
                  : { bottom: '20px', left: '20px' }),
                zIndex: 1000
              }
            }, [
              React.createElement('button', {
                onClick: () => setIsOpen(!isOpen),
                style: {
                  width: '64px',
                  height: '64px',
                  borderRadius: '32px',
                  backgroundColor: getThemeColor(theme),
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: isOpen ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                  ':hover': {
                    transform: 'scale(1.05)'
                  }
                }
              }, React.createElement('svg', {
                width: '32',
                height: '32',
                viewBox: '0 0 24 24',
                fill: 'currentColor',
                style: {
                  transform: 'translateY(-1px)'
                }
              }, [
                // Modern robot icon
                React.createElement('path', {
                  d: 'M13.5 2c1.93 0 3.5 1.57 3.5 3.5v1c0 .17-.01.33-.03.5h1.53c1.38 0 2.5 1.12 2.5 2.5v10c0 1.38-1.12 2.5-2.5 2.5h-12c-1.38 0-2.5-1.12-2.5-2.5v-10c0-1.38 1.12-2.5 2.5-2.5h1.53c-.02-.17-.03-.33-.03-.5v-1c0-1.93 1.57-3.5 3.5-3.5h4zm0 2h-4c-.83 0-1.5.67-1.5 1.5v1c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-1c0-.83-.67-1.5-1.5-1.5zm-6 4h-1c-.28 0-.5.22-.5.5v10c0 .28.22.5.5.5h12c.28 0 .5-.22.5-.5v-10c0-.28-.22-.5-.5-.5h-11zm2 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
                  fillRule: 'evenodd'
                })
              ])),
              
              isOpen && React.createElement('div', {
                style: {
                  width: '350px',
                  height: '500px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }
              }, [
                React.createElement('div', {
                  style: {
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }
                }, [
                  React.createElement('span', null, 'Chat Support'),
                  React.createElement('button', {
                    onClick: () => setIsOpen(false),
                    style: {
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer'
                    }
                  }, '✕')
                ]),
                React.createElement('div', {
                  style: {
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }
                }, messages.map((message, index) => {
                  const messageContent = message.type === 'user' ? (
                    message.content
                  ) : (
                    React.createElement('div', {
                      className: 'widget-prose',
                      dangerouslySetInnerHTML: {
                        __html: window.marked.parse(message.content, {
                          breaks: true,
                          gfm: true
                        })
                      }
                    })
                  );

                  return React.createElement('div', {
                    key: index,
                    style: {
                      display: 'flex',
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '0.5rem'
                    }
                  },
                    React.createElement('div', {
                      className: \`max-w-[80%] rounded-lg px-4 py-2 \${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }\`
                    }, messageContent)
                  );
                })),
                
                isLoading && React.createElement('div', {
                  style: {
                    display: 'flex',
                    justifyContent: 'flex-start',
                    padding: '0.25rem 1rem',
                    marginBottom: '0.5rem'
                  }
                },
                  React.createElement('div', {
                    className: 'bg-gray-100 rounded-lg px-4 py-2 text-gray-800'
                  },
                    React.createElement('div', {
                      className: 'typing-indicator'
                    },
                      React.createElement('div', { className: 'typing-dot' }),
                      React.createElement('div', { className: 'typing-dot' }),
                      React.createElement('div', { className: 'typing-dot' })
                    )
                  )
                ),
                
                React.createElement('div', {
                  style: {
                    padding: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }
                }, [
                  React.createElement('input', {
                    value: input,
                    onChange: (e) => setInput(e.target.value),
                    onKeyPress: (e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    },
                    placeholder: 'Type your message...',
                    style: {
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #e5e7eb',
                      outline: 'none'
                    }
                  })
                ])
              ])
            ]);
          }

          window.AnswerlyAIWidget = {
            init: function(config) {
              console.log('Widget init called with config:', config);
              const container = document.createElement('div');
              container.id = 'answerly-ai-widget';
              document.body.appendChild(container);

              const root = ReactDOM.createRoot(container);
              root.render(React.createElement(ChatWidget, { 
                ...config,
                workflowId: '${workflowId}'
              }));
            }
          };

          window.dispatchEvent(new Event('AnswerlyAIWidgetReady'));
        }
      })();
    `;

    return new NextResponse(widgetScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Widget script error:', error);
    return new NextResponse(
      'console.error("Failed to load widget script");',
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 