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
    
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const widgetScript = `
      console.log('Widget script loaded for workflow:', '${workflowId}');
      (function() {
        // Add initial message when chat opens
        const initialMessage = {
          type: 'bot',
          content: 'Hi 👋, I am Cora - Your very own chat assistant! How may I help you today?'
        };

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
          
          function ChatWidget({ workflowId, theme = 'light', position = 'bottom-right', userId }) {
            const [isOpen, setIsOpen] = React.useState(false);
            const [messages, setMessages] = React.useState([initialMessage]);
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
                    ...(userId && { 'X-User-ID': userId })
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
                  width: '60px',
                  height: '60px',
                  borderRadius: '30px',
                  backgroundColor: theme === 'blue' ? '#2563eb' : '#1f2937',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: isOpen ? 'none' : 'block'
                }
              }, '💬'),
              
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