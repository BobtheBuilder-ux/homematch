'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface SurveyData {
  fullName: string;
  email: string;
  propertyLocation: string;
  numberOfProperties: string;
  propertyTypes: string[];
  tenantManagement: string[];
  biggestChallenges: string[];
  agentIssues: string;
  platformInterest: string;
  propertyListingRating: string;
  dashboardRating: string;
  maintenanceRating: string;
  rentCollectionRating: string;
  customerSupportRating: string;
  monthlyReportRating: string;
  wishEasier: string;
  launchNotification: string;
}

const LandlordSurveyPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const totalSteps = 4;
  
  const [surveyData, setSurveyData] = useState<SurveyData>({
    fullName: '',
    email: '',
    propertyLocation: '',
    numberOfProperties: '',
    propertyTypes: [],
    tenantManagement: [],
    biggestChallenges: [],
    agentIssues: '',
    platformInterest: '',
    propertyListingRating: '',
    dashboardRating: '',
    maintenanceRating: '',
    rentCollectionRating: '',
    customerSupportRating: '',
    monthlyReportRating: '',
    wishEasier: '',
    launchNotification: ''
  });

  const updateSurveyData = (field: keyof SurveyData, value: string | string[]) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof SurveyData, value: string, checked: boolean) => {
    const current = surveyData[field] as string[];
    if (checked) {
      updateSurveyData(field, [...current, value]);
    } else {
      updateSurveyData(field, current.filter(item => item !== value));
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/surveys/landlord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        console.error('Failed to submit survey');
        // You could add error handling here
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      // You could add error handling here
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600">
                Thanks for sharing your feedback! We&apos;ll notify you when Homematch launches.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Landlord Survey
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Estimated time: 2-3 minutes
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Step 1: About You & Your Property */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Section 1: About You & Your Property</CardTitle>
                  <CardDescription>Tell us about yourself and your properties</CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={surveyData.fullName}
                      onChange={(e) => updateSurveyData('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={surveyData.email}
                      onChange={(e) => updateSurveyData('email', e.target.value)}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <Label>Where is your rental property located?</Label>
                    <RadioGroup 
                      value={surveyData.propertyLocation} 
                      onValueChange={(value) => updateSurveyData('propertyLocation', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Abuja" id="prop-abuja" />
                        <Label htmlFor="prop-abuja">Abuja</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Lagos" id="prop-lagos" />
                        <Label htmlFor="prop-lagos">Lagos</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Port Harcourt" id="prop-portharcourt" />
                        <Label htmlFor="prop-portharcourt">Port Harcourt</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Other" id="prop-other" />
                        <Label htmlFor="prop-other">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>How many properties do you currently manage or rent out?</Label>
                    <RadioGroup 
                      value={surveyData.numberOfProperties} 
                      onValueChange={(value) => updateSurveyData('numberOfProperties', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="prop-1" />
                        <Label htmlFor="prop-1">1</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2-3" id="prop-2-3" />
                        <Label htmlFor="prop-2-3">2-3</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="4-10" id="prop-4-10" />
                        <Label htmlFor="prop-4-10">4-10</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="10+" id="prop-10plus" />
                        <Label htmlFor="prop-10plus">10+</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>What type of property do you rent out? (Select all that apply)</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        'Self-contained rooms',
                        '1-bedroom apartments',
                        '2-bedroom apartments',
                        'Duplexes / Flats',
                        'Shared accommodations'
                      ].map((propertyType) => (
                        <div key={propertyType} className="flex items-center space-x-2">
                          <Checkbox
                            id={propertyType}
                            checked={surveyData.propertyTypes.includes(propertyType)}
                            onCheckedChange={(checked) => handleArrayChange('propertyTypes', propertyType, checked as boolean)}
                          />
                          <Label htmlFor={propertyType}>{propertyType}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Experience & Pain Points */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Section 2: Experience & Pain Points</CardTitle>
                  <CardDescription>Tell us about your property management experience</CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div>
                    <Label>How do you currently find and manage tenants for your properties? (Select all that apply)</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        'Through agents',
                        'I manage it myself',
                        'Family/friends help',
                        'Property listing websites',
                        'I don\'t actively market it'
                      ].map((method) => (
                        <div key={method} className="flex items-center space-x-2">
                          <Checkbox
                            id={method}
                            checked={surveyData.tenantManagement.includes(method)}
                            onCheckedChange={(checked) => handleArrayChange('tenantManagement', method, checked as boolean)}
                          />
                          <Label htmlFor={method}>{method}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>What are your biggest challenges in managing your properties? (Select all that apply)</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        'Unreliable agents',
                        'Unverified or non-serious tenants',
                        'Delayed rent payments',
                        'Property maintenance issues',
                        'Lack of time to manage things myself',
                        'Communication with multiple tenants'
                      ].map((challenge) => (
                        <div key={challenge} className="flex items-center space-x-2">
                          <Checkbox
                            id={challenge}
                            checked={surveyData.biggestChallenges.includes(challenge)}
                            onCheckedChange={(checked) => handleArrayChange('biggestChallenges', challenge, checked as boolean)}
                          />
                          <Label htmlFor={challenge}>{challenge}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Have you ever had issues with agents misrepresenting your property or overcharging tenants?</Label>
                    <RadioGroup 
                      value={surveyData.agentIssues} 
                      onValueChange={(value) => updateSurveyData('agentIssues', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="agent-issues-yes" />
                        <Label htmlFor="agent-issues-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="agent-issues-no" />
                        <Label htmlFor="agent-issues-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Interest in the Platform */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Section 3: Interest in the Platform</CardTitle>
                  <CardDescription>Help us understand what features you need</CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div>
                    <Label>Would you be open to using a platform that not only finds verified tenants but also manages your property and handles tenant communication?</Label>
                    <RadioGroup 
                      value={surveyData.platformInterest} 
                      onValueChange={(value) => updateSurveyData('platformInterest', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="platform-yes" />
                        <Label htmlFor="platform-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="platform-no" />
                        <Label htmlFor="platform-no">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Maybe, if I can review the terms first" id="platform-maybe" />
                        <Label htmlFor="platform-maybe">Maybe, if I can review the terms first</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Which of these features would be useful to you?</Label>
                    <p className="text-sm text-gray-600 mb-4">Rate each feature: Not Useful - Somewhat Useful - Very Useful</p>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'propertyListingRating', label: 'Property listing with 3D and street view' },
                        { key: 'dashboardRating', label: 'Dashboard to track tenants and payments' },
                        { key: 'maintenanceRating', label: 'Maintenance support handled by platform' },
                        { key: 'rentCollectionRating', label: 'In-app rent collection and automated reminders' },
                        { key: 'customerSupportRating', label: 'Customer support for tenant complaints' },
                        { key: 'monthlyReportRating', label: 'Monthly report on property condition & payments' }
                      ].map((feature) => (
                        <div key={feature.key}>
                          <Label className="text-sm font-medium">{feature.label}</Label>
                          <RadioGroup 
                            value={surveyData[feature.key as keyof SurveyData] as string} 
                            onValueChange={(value) => updateSurveyData(feature.key as keyof SurveyData, value)}
                            className="flex space-x-4 mt-1"
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Not Useful" id={`${feature.key}-not`} />
                              <Label htmlFor={`${feature.key}-not`} className="text-xs">Not Useful</Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Somewhat Useful" id={`${feature.key}-somewhat`} />
                              <Label htmlFor={`${feature.key}-somewhat`} className="text-xs">Somewhat</Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Very Useful" id={`${feature.key}-very`} />
                              <Label htmlFor={`${feature.key}-very`} className="text-xs">Very Useful</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="wishEasier">What&apos;s one thing you wish were easier about finding or managing tenants?</Label>
                    <Textarea
                      id="wishEasier"
                      value={surveyData.wishEasier}
                      onChange={(e) => updateSurveyData('wishEasier', e.target.value)}
                      placeholder="Tell us what would make property management easier for you..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Follow-up */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Section 4: Optional Follow-up</CardTitle>
                  <CardDescription>Stay updated with our launch</CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div>
                    <Label>Would you like to be notified when we launch?</Label>
                    <RadioGroup 
                      value={surveyData.launchNotification} 
                      onValueChange={(value) => updateSurveyData('launchNotification', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="landlord-notify-yes" />
                        <Label htmlFor="landlord-notify-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="landlord-notify-no" />
                        <Label htmlFor="landlord-notify-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              
              {currentStep < totalSteps ? (
                <Button 
                  onClick={nextStep}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Survey
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LandlordSurveyPage;