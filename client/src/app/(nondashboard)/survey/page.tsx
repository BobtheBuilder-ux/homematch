'use client';

import React from 'react';
import SurveyComponent from '@/components/Survey';
import { Model } from 'survey-core';
import './survey.css';

const SurveyPage = () => {
  // Define the survey JSON configuration
  const surveyJson = {
    title: "Real Estate Preferences Survey",
    description: "Help us understand your property preferences to provide better recommendations.",
    logoPosition: "right",
    pages: [
      {
        name: "personalInfo",
        title: "Personal Information",
        elements: [
          {
            type: "text",
            name: "fullName",
            title: "Full Name",
            isRequired: true,
            placeholder: "Enter your full name"
          },
          {
            type: "email",
            name: "email",
            title: "Email Address",
            isRequired: true,
            placeholder: "Enter your email address",
            validators: [
              {
                type: "email",
                text: "Please enter a valid email address"
              }
            ]
          },
          {
            type: "text",
            name: "phone",
            title: "Phone Number",
            placeholder: "Enter your phone number",
            inputType: "tel"
          },
          {
            type: "dropdown",
            name: "ageRange",
            title: "Age Range",
            isRequired: true,
            choices: [
              { value: "18-25", text: "18-25" },
              { value: "26-35", text: "26-35" },
              { value: "36-45", text: "36-45" },
              { value: "46-55", text: "46-55" },
              { value: "56-65", text: "56-65" },
              { value: "65+", text: "65+" }
            ]
          }
        ]
      },
      {
        name: "propertyPreferences",
        title: "Property Preferences",
        elements: [
          {
            type: "radiogroup",
            name: "propertyType",
            title: "What type of property are you looking for?",
            isRequired: true,
            choices: [
              { value: "apartment", text: "Apartment" },
              { value: "house", text: "House" },
              { value: "condo", text: "Condominium" },
              { value: "townhouse", text: "Townhouse" },
              { value: "studio", text: "Studio" },
              { value: "other", text: "Other" }
            ]
          },
          {
            type: "nouislider",
            name: "priceRange",
            title: "Monthly Budget Range ($)",
            isRequired: true,
            rangeMin: 500,
            rangeMax: 5000,
            step: 100,
            pipsMode: "range",
            pipsValues: [500, 1000, 2000, 3000, 4000, 5000],
            pipsDensity: 4
          },
          {
            type: "dropdown",
            name: "bedrooms",
            title: "Number of Bedrooms",
            isRequired: true,
            choices: [
              { value: "studio", text: "Studio" },
              { value: "1", text: "1 Bedroom" },
              { value: "2", text: "2 Bedrooms" },
              { value: "3", text: "3 Bedrooms" },
              { value: "4", text: "4 Bedrooms" },
              { value: "5+", text: "5+ Bedrooms" }
            ]
          },
          {
            type: "dropdown",
            name: "bathrooms",
            title: "Number of Bathrooms",
            isRequired: true,
            choices: [
              { value: "1", text: "1 Bathroom" },
              { value: "1.5", text: "1.5 Bathrooms" },
              { value: "2", text: "2 Bathrooms" },
              { value: "2.5", text: "2.5 Bathrooms" },
              { value: "3", text: "3 Bathrooms" },
              { value: "3+", text: "3+ Bathrooms" }
            ]
          }
        ]
      },
      {
        name: "amenitiesLocation",
        title: "Amenities & Location",
        elements: [
          {
            type: "checkbox",
            name: "amenities",
            title: "Which amenities are important to you? (Select all that apply)",
            choices: [
              { value: "parking", text: "Parking" },
              { value: "gym", text: "Gym/Fitness Center" },
              { value: "pool", text: "Swimming Pool" },
              { value: "laundry", text: "In-unit Laundry" },
              { value: "ac", text: "Air Conditioning" },
              { value: "balcony", text: "Balcony/Patio" },
              { value: "dishwasher", text: "Dishwasher" },
              { value: "pets", text: "Pet-friendly" },
              { value: "security", text: "Security System" },
              { value: "internet", text: "High-speed Internet" }
            ]
          },
          {
            type: "text",
            name: "preferredLocation",
            title: "Preferred Location/Neighborhood",
            placeholder: "Enter city, neighborhood, or area"
          },
          {
            type: "radiogroup",
            name: "commute",
            title: "How important is proximity to your workplace?",
            choices: [
              { value: "very", text: "Very Important" },
              { value: "somewhat", text: "Somewhat Important" },
              { value: "not", text: "Not Important" },
              { value: "remote", text: "I work remotely" }
            ]
          },
          {
            type: "rating",
            name: "publicTransport",
            title: "How important is access to public transportation?",
            rateMin: 1,
            rateMax: 5,
            minRateDescription: "Not Important",
            maxRateDescription: "Very Important"
          }
        ]
      },
      {
        name: "additionalInfo",
        title: "Additional Information",
        elements: [
          {
            type: "radiogroup",
            name: "moveInTimeline",
            title: "When are you looking to move in?",
            isRequired: true,
            choices: [
              { value: "immediately", text: "Immediately" },
              { value: "1month", text: "Within 1 month" },
              { value: "3months", text: "Within 3 months" },
              { value: "6months", text: "Within 6 months" },
              { value: "flexible", text: "Flexible" }
            ]
          },
          {
            type: "boolean",
            name: "firstTime",
            title: "Is this your first time renting?",
            isRequired: true
          },
          {
            type: "comment",
            name: "additionalComments",
            title: "Any additional comments or specific requirements?",
            placeholder: "Please share any additional information that would help us find the perfect property for you...",
            rows: 4
          }
        ]
      }
    ],
    showProgressBar: "top",
    progressBarType: "buttons",
    showQuestionNumbers: "off",
    completedHtml: "<div style='text-align: center; padding: 2rem;'><h3 style='color: #10b981; margin-bottom: 1rem;'>Thank you for completing the survey!</h3><p>We'll use this information to provide you with personalized property recommendations.</p></div>",
    showCompletedPage: true
  };

  // Handle survey completion
  const handleSurveyComplete = (survey: Model) => {
    const results = survey.data;
    console.log('Survey Results:', results);
    
    // Here you would typically send the data to your backend
    // Example: submitSurveyData(results);
    
    alert('Survey completed successfully! Check the console for results.');
  };

  // Handle value changes (optional)
  const handleValueChanged = (survey: Model, options: any) => {
    // You can track user progress or save draft responses here
    console.log('Value changed:', options.name, options.value);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Property Preferences Survey
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Help us understand your needs so we can recommend the perfect properties for you.
                This survey takes about 5-10 minutes to complete.
              </p>
            </div>
            
            <SurveyComponent
              surveyJson={surveyJson}
              onComplete={handleSurveyComplete}
              onValueChanged={handleValueChanged}
              className="survey-wrapper"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;