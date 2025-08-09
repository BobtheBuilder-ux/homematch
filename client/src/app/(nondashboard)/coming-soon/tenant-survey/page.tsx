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
  currentLocation: string;
  rentingStatus: string;
  housingType: string;
  biggestFrustrations: string[];
  scammedExperience: string;
  scamDetails: string;
  directLandlordPreference: string;
  virtualTourRating: string;
  streetViewRating: string;
  verifiedListingsRating: string;
  supportTeamRating: string;
  inAppChatRating: string;
  rentPaymentRating: string;
  wishExisted: string;
  launchNotification: string;
}

const TenantSurveyPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const totalSteps = 4;
  
  const [surveyData, setSurveyData] = useState<SurveyData>({
    fullName: '',
    email: '',
    currentLocation: '',
    rentingStatus: '',
    housingType: '',
    biggestFrustrations: [],
    scammedExperience: '',
    scamDetails: '',
    directLandlordPreference: '',
    virtualTourRating: '',
    streetViewRating: '',
    verifiedListingsRating: '',
    supportTeamRating: '',
    inAppChatRating: '',
    rentPaymentRating: '',
    wishExisted: '',
    launchNotification: ''
  });

  const updateSurveyData = (field: keyof SurveyData, value: string | string[]) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const handleFrustrationChange = (frustration: string, checked: boolean) => {
    const current = surveyData.biggestFrustrations;
    if (checked) {
      updateSurveyData('biggestFrustrations', [...current, frustration]);
    } else {
      updateSurveyData('biggestFrustrations', current.filter(f => f !== frustration));
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
      const response = await fetch('/api/surveys/tenant', {
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
            Tenant Survey
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Estimated time: 2 minutes
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
            {/* Step 1: About You */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Section 1: About You</CardTitle>
                  <CardDescription>Tell us a bit about yourself</CardDescription>
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
                    <Label>Where do you currently live?</Label>
                    <RadioGroup 
                      value={surveyData.currentLocation} 
                      onValueChange={(value) => updateSurveyData('currentLocation', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Abuja" id="abuja" />
                        <Label htmlFor="abuja">Abuja</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Lagos" id="lagos" />
                        <Label htmlFor="lagos">Lagos</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Port Harcourt" id="portharcourt" />
                        <Label htmlFor="portharcourt">Port Harcourt</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Other" id="other-location" />
                        <Label htmlFor="other-location">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Are you currently renting or looking to rent?</Label>
                    <RadioGroup 
                      value={surveyData.rentingStatus} 
                      onValueChange={(value) => updateSurveyData('rentingStatus', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Renting" id="renting" />
                        <Label htmlFor="renting">Renting</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Looking to rent" id="looking" />
                        <Label htmlFor="looking">Looking to rent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Both" id="both" />
                        <Label htmlFor="both">Both</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Neither (Just exploring)" id="neither" />
                        <Label htmlFor="neither">Neither (Just exploring)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>What type of housing do you usually look for?</Label>
                    <RadioGroup 
                      value={surveyData.housingType} 
                      onValueChange={(value) => updateSurveyData('housingType', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Self-contained" id="selfcontained" />
                        <Label htmlFor="selfcontained">Self-contained</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1-bedroom apartment" id="onebedroom" />
                        <Label htmlFor="onebedroom">1-bedroom apartment</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2-bedroom apartment" id="twobedroom" />
                        <Label htmlFor="twobedroom">2-bedroom apartment</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="3+ bedroom apartment" id="threeplusbedroom" />
                        <Label htmlFor="threeplusbedroom">3+ bedroom apartment</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Shared apartment" id="shared" />
                        <Label htmlFor="shared">Shared apartment</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Renting Experience */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Section 2: Renting Experience</CardTitle>
                  <CardDescription>Tell us about your experiences</CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div>
                    <Label>What are your biggest frustrations when trying to rent a house? (Select all that apply)</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        'Agent fees',
                        'Fake or misleading listings',
                        'Poor communication with agents',
                        'Wasting time visiting unsuitable places',
                        'Difficulty finding verified landlords',
                        'Unsafe neighborhoods',
                        'Poor pictures or no videos of the apartment'
                      ].map((frustration) => (
                        <div key={frustration} className="flex items-center space-x-2">
                          <Checkbox
                            id={frustration}
                            checked={surveyData.biggestFrustrations.includes(frustration)}
                            onCheckedChange={(checked) => handleFrustrationChange(frustration, checked as boolean)}
                          />
                          <Label htmlFor={frustration}>{frustration}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Have you ever been scammed or misled during your house-hunting experience?</Label>
                    <RadioGroup 
                      value={surveyData.scammedExperience} 
                      onValueChange={(value) => updateSurveyData('scammedExperience', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="scammed-yes" />
                        <Label htmlFor="scammed-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="scammed-no" />
                        <Label htmlFor="scammed-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {surveyData.scammedExperience === 'Yes' && (
                    <div>
                      <Label htmlFor="scamDetails">Tell us what happened (Optional)</Label>
                      <Textarea
                        id="scamDetails"
                        value={surveyData.scamDetails}
                        onChange={(e) => updateSurveyData('scamDetails', e.target.value)}
                        placeholder="Describe your experience..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Preferences & Feedback */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Section 3: Preferences & Feedback</CardTitle>
                  <CardDescription>Help us understand what you need</CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div>
                    <Label>Would you prefer to rent directly from a landlord instead of going through an agent?</Label>
                    <RadioGroup 
                      value={surveyData.directLandlordPreference} 
                      onValueChange={(value) => updateSurveyData('directLandlordPreference', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="direct-yes" />
                        <Label htmlFor="direct-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="direct-no" />
                        <Label htmlFor="direct-no">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Not sure" id="direct-notsure" />
                        <Label htmlFor="direct-notsure">Not sure</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-base font-medium">How helpful would the following features be to you?</Label>
                    <p className="text-sm text-gray-600 mb-4">Rate each feature: Not Helpful - Somewhat Helpful - Very Helpful</p>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'virtualTourRating', label: '3D virtual tour of the apartment' },
                        { key: 'streetViewRating', label: 'Street view of the neighborhood' },
                        { key: 'verifiedListingsRating', label: 'Verified listings with accurate pricing' },
                        { key: 'supportTeamRating', label: 'A support team that responds to tenant needs' },
                        { key: 'inAppChatRating', label: 'In-app chat with the platform (not an agent or landlord)' },
                        { key: 'rentPaymentRating', label: 'In-app rent payment options' }
                      ].map((feature) => (
                        <div key={feature.key}>
                          <Label className="text-sm font-medium">{feature.label}</Label>
                          <RadioGroup 
                            value={surveyData[feature.key as keyof SurveyData] as string} 
                            onValueChange={(value) => updateSurveyData(feature.key as keyof SurveyData, value)}
                            className="flex space-x-4 mt-1"
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Not Helpful" id={`${feature.key}-not`} />
                              <Label htmlFor={`${feature.key}-not`} className="text-xs">Not Helpful</Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Somewhat Helpful" id={`${feature.key}-somewhat`} />
                              <Label htmlFor={`${feature.key}-somewhat`} className="text-xs">Somewhat</Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Very Helpful" id={`${feature.key}-very`} />
                              <Label htmlFor={`${feature.key}-very`} className="text-xs">Very Helpful</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="wishExisted">What is one thing you wish existed in the renting process that currently doesn&apos;t?</Label>
                    <Textarea
                      id="wishExisted"
                      value={surveyData.wishExisted}
                      onChange={(e) => updateSurveyData('wishExisted', e.target.value)}
                      placeholder="Tell us what would make renting easier for you..."
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
                    <Label>Would you like to be notified when the platform launches?</Label>
                    <RadioGroup 
                      value={surveyData.launchNotification} 
                      onValueChange={(value) => updateSurveyData('launchNotification', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="notify-yes" />
                        <Label htmlFor="notify-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="notify-no" />
                        <Label htmlFor="notify-no">No</Label>
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

export default TenantSurveyPage;