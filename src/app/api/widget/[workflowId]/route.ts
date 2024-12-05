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
            loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js')
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
                if (data.success) {
                  setMessages(prev => [...prev, { type: 'bot', content: data.response }]);
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

            return React.createElement('div', {
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
                    padding: '1rem'
                  }
                }, messages.map((msg, i) => 
                  React.createElement('div', {
                    key: i,
                    style: {
                      marginBottom: '0.5rem',
                      textAlign: msg.type === 'user' ? 'right' : 'left'
                    }
                  }, React.createElement('div', {
                    style: {
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      maxWidth: '80%',
                      backgroundColor: msg.type === 'user' ? '#2563eb' : '#f3f4f6',
                      color: msg.type === 'user' ? '#ffffff' : '#1f2937'
                    }
                  }, msg.content))
                )),
                
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