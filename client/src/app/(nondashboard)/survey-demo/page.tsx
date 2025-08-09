'use client';

import React, { useState } from 'react';
import { FeedbackSurvey, ContactFormSurvey, PropertyApplicationSurvey } from '@/components/SurveyExamples';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removed Radix UI Tabs import due to React 19 compatibility issues
import Link from 'next/link';

const SurveyDemoPage = () => {
  const [activeDemo, setActiveDemo] = useState<string>('overview');

  const surveyExamples = [
    {
      id: 'feedback',
      title: 'Property Feedback Survey',
      description: 'A simple rating and feedback form for property reviews.',
      features: ['Star ratings', 'Multiple choice questions', 'Text comments'],
      component: <FeedbackSurvey />
    },
    {
      id: 'contact',
      title: 'Contact Form Survey',
      description: 'A contact form with validation and preference selection.',
      features: ['Email validation', 'Phone input', 'Contact preferences', 'Message field'],
      component: <ContactFormSurvey />
    },
    {
      id: 'application',
      title: 'Rental Application Survey',
      description: 'A multi-page application form with progress tracking.',
      features: ['Multi-page layout', 'Progress bar', 'Form validation', 'Different input types'],
      component: <PropertyApplicationSurvey />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SurveyJS Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Explore different survey implementations using SurveyJS. 
            These examples demonstrate various question types, layouts, and features.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/survey">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                View Full Survey Example
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.open('https://surveyjs.io/documentation', '_blank')}
            >
              SurveyJS Documentation
            </Button>
          </div>
        </div>

        {/* Custom Tab Implementation */}
        <div className="w-full">
          <div className="grid w-full grid-cols-4 mb-8 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveDemo('overview')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeDemo === 'overview'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveDemo('feedback')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeDemo === 'feedback'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setActiveDemo('contact')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeDemo === 'contact'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Contact
            </button>
            <button
              onClick={() => setActiveDemo('application')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeDemo === 'application'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Application
            </button>
          </div>

          {activeDemo === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveyExamples.map((example) => (
                  <Card key={example.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{example.title}</CardTitle>
                      <CardDescription>{example.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Features:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {example.features.map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button 
                          onClick={() => setActiveDemo(example.id)}
                          className="w-full"
                          variant="outline"
                        >
                          Try Demo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Features Overview */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">SurveyJS Features Demonstrated</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800">Question Types</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Text input</li>
                      <li>• Email validation</li>
                      <li>• Number input</li>
                      <li>• Date picker</li>
                      <li>• Phone input</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800">Selection Types</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Radio buttons</li>
                      <li>• Checkboxes</li>
                      <li>• Dropdown menus</li>
                      <li>• Rating scales</li>
                      <li>• Boolean switches</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800">Advanced Features</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Multi-page surveys</li>
                      <li>• Progress tracking</li>
                      <li>• Custom styling</li>
                      <li>• Form validation</li>
                      <li>• Conditional logic</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {surveyExamples.map((example) => 
            activeDemo === example.id ? (
              <div key={example.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{example.title}</h2>
                  <p className="text-gray-600">{example.description}</p>
                </div>
                {example.component}
              </div>
            ) : null
          )}
        </div>

        {/* Code Example Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Implementation Example</h2>
          <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm">
              <code>{`// Basic SurveyJS implementation
import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';
import 'survey-core/survey-core.min.css';

const surveyJson = {
  title: "My Survey",
  elements: [
    {
      type: "text",
      name: "name",
      title: "What is your name?",
      isRequired: true
    },
    {
      type: "rating",
      name: "satisfaction",
      title: "How satisfied are you?",
      rateMin: 1,
      rateMax: 5
    }
  ]
};

const MySurvey = () => {
  const survey = new Model(surveyJson);
  
  survey.onComplete.add((survey) => {
    console.log('Results:', survey.data);
  });
  
  return <Survey model={survey} />;
};`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyDemoPage;