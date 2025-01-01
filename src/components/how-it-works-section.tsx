'use client'
import { useState } from 'react';

const steps = [
  {
    id: 1,
    title: "Import Data",
    content: [
      {
        image: "/crawl.png",
        subtitle: "Website Crawling",
        description: "Automatically extract content from your website pages. Our intelligent crawler processes your website content and prepares it for your agent, ensuring comprehensive knowledge of your business."
      },
      {
        image: "/FAQ.png",
        subtitle: "FAQ Import",
        description: "Import your existing FAQs through CSV upload or manual entry. Easily manage your knowledge base with our intuitive interface, helping your agent provide accurate answers to common questions."
      },
      {
        image: "/context.png",
        subtitle: "Context Manager",
        description: "Fine-tune your agent's knowledge base by adding custom context and instructions. Optimize content organization and ensure your agent understands your business policies and guidelines perfectly."
      },
      {
        image: "/workflow.png",
        subtitle: "Workflow Editor",
        description: "Design conversation flows and decision trees with our visual workflow editor. Create sophisticated response patterns to handle various customer scenarios effectively."
      }
    ]
  },
  {
    id: 2,
    title: "Tweak Agent",
    content: [
      {
        image: "/security.png",
        subtitle: "Domain Manager",
        description: "Control which websites can use your agent widget with domain access management. Enhance security by restricting widget usage to your approved domains only."
      },
      {
        image: "/emails.png",
        subtitle: "Email Notifications",
        description: "Configure email preferences for important updates, support tickets, and meeting invites. Stay informed about your agent's interactions and performance."
      },
      {
        image: "/livechat.png",
        subtitle: "Response Customization",
        description: "Fine-tune your agent's responses to maintain your brand's voice and personality. Ensure accurate, consistent, and professional communication with your customers."
      }
    ]
  },
  {
    id: 3,
    title: "Deploy",
    content: [
      {
        image: "/personalise.png",
        subtitle: "Agent Personalization",
        description: "Customize your agent's appearance with themes, positions, and name options. Create a seamless integration with your website's design and branding."
      },
      {
        image: "/embed.png",
        subtitle: "Copy paste code - Widget",
        description: "Implement your agent with a simple code snippet. Add the widget to your website in minutes with our secure, responsive, and easy-to-integrate solution."
      },
      {
        image: "/dashboard.png",
        subtitle: "Performance Monitoring",
        description: "Track user interactions, monitor response quality, and optimize your agent's performance in real-time. Make data-driven improvements to enhance customer satisfaction."
      }
    ]
  }
];

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const handleStepClick = (stepId: number) => {
    if (activeStep === stepId) {
      setActiveStep(null);
    } else {
      setActiveStep(stepId);
    }
  };

  return (
    <section className="w-full px-4 sm:px-6 py-8 sm:py-14 bg-gray-50">
      <div className="mx-auto max-w-screen-xl">
        <h4 className={`font-bold text-center transition-all duration-300 ${
          activeStep === null ? 'text-3xl sm:text-4xl mb-8 sm:mb-12' : 'text-xl sm:text-2xl mb-6'
        }`}>
          How It Works
        </h4>
        
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-4 sm:gap-6 transition-all duration-300 ${
          activeStep === null ? 'mb-6 sm:mb-8' : 'mb-6 sm:mb-8'
        }`}>
          {steps.map(step => (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              className={`flex flex-col items-center justify-center transition-all duration-300 
                w-full sm:w-auto
                ${activeStep === null 
                  ? 'min-h-[120px] sm:min-h-[180px] p-4 sm:p-6 sm:min-w-[200px]'
                  : 'min-h-[60px] sm:min-h-[80px] p-2 sm:p-4 sm:min-w-[160px]'
                } 
                rounded-xl sm:rounded-2xl text-lg font-bold
                ${activeStep === step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
                }
                ${activeStep === null ? 'shadow-md hover:shadow-lg' : ''}
                border border-gray-100
              `}
            >
              <span className={`transition-all duration-300 ${
                activeStep === null 
                  ? 'text-sm sm:text-base mb-2' 
                  : 'text-xs sm:text-sm mb-1'
              }`}>{`Step ${step.id}`}</span>
              
              <span className={`text-center transition-all duration-300 ${
                activeStep === null 
                  ? 'text-xl sm:text-2xl' 
                  : 'text-base'
              }`}>{step.title}</span>
              
              {activeStep === null && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2 font-normal px-2 text-center">
                  {step.id === 1 ? 'Train your agent with your data' :
                   step.id === 2 ? 'Customize responses & security' :
                   'Deploy to your website'}
                </p>
              )}
            </button>
          ))}
        </div>

        {activeStep !== null && (
          <div className="w-full space-y-8 sm:space-y-12">
            {steps.find(s => s.id === activeStep)?.content.map((item, index) => (
              <div 
                key={`${activeStep}-${index}`} 
                className={`flex flex-col lg:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-8 bg-white rounded-xl shadow-sm border border-gray-100 ${
                  index % 2 === 0 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1 w-full">
                  <img
                    src={item.image}
                    alt={`${steps.find(s => s.id === activeStep)?.title} - ${item.subtitle}`}
                    className="w-full h-auto rounded-md shadow-lg"
                  />
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h5 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{item.subtitle}</h5>
                  <p className="text-base sm:text-lg text-gray-700">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
} 