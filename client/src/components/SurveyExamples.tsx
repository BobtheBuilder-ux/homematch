'use client';

import React from 'react';
import SurveyComponent from './Survey';
import { Model } from 'survey-core';

// Simple feedback survey
export const FeedbackSurvey = () => {
  const feedbackSurveyJson = {
    title: "Property Feedback",
    description: "Please share your feedback about this property.",
    elements: [
      {
        type: "rating",
        name: "overallRating",
        title: "Overall Rating",
        isRequired: true,
        rateMin: 1,
        rateMax: 5,
        minRateDescription: "Poor",
        maxRateDescription: "Excellent"
      },
      {
        type: "checkbox",
        name: "likedFeatures",
        title: "What did you like about this property?",
        choices: [
          { value: "location", text: "Location" },
          { value: "price", text: "Price" },
          { value: "amenities", text: "Amenities" },
          { value: "size", text: "Size" },
          { value: "condition", text: "Condition" },
          { value: "landlord", text: "Landlord/Management" }
        ]
      },
      {
        type: "comment",
        name: "additionalFeedback",
        title: "Additional Comments",
        placeholder: "Please share any additional feedback...",
        rows: 3
      }
    ],
    showQuestionNumbers: "off",
    completedHtml: "<div style='text-align: center; padding: 1rem;'><h3 style='color: #10b981;'>Thank you for your feedback!</h3></div>"
  };

  const handleComplete = (survey: Model) => {
    console.log('Feedback Survey Results:', survey.data);
    alert('Thank you for your feedback!');
  };

  return (
    <SurveyComponent
      surveyJson={feedbackSurveyJson}
      onComplete={handleComplete}
      className="feedback-survey"
    />
  );
};

// Quick contact form survey
export const ContactFormSurvey = () => {
  const contactSurveyJson = {
    title: "Contact Information",
    description: "Please provide your contact details so we can get in touch.",
    elements: [
      {
        type: "text",
        name: "name",
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
        type: "radiogroup",
        name: "contactPreference",
        title: "Preferred Contact Method",
        isRequired: true,
        choices: [
          { value: "email", text: "Email" },
          { value: "phone", text: "Phone" },
          { value: "text", text: "Text Message" }
        ]
      },
      {
        type: "comment",
        name: "message",
        title: "Message",
        placeholder: "How can we help you?",
        rows: 4
      }
    ],
    showQuestionNumbers: "off",
    completedHtml: "<div style='text-align: center; padding: 1rem;'><h3 style='color: #10b981;'>Message sent successfully!</h3><p>We'll get back to you soon.</p></div>"
  };

  const handleComplete = (survey: Model) => {
    console.log('Contact Form Results:', survey.data);
    // Here you would typically send the data to your backend
    alert('Message sent successfully!');
  };

  return (
    <SurveyComponent
      surveyJson={contactSurveyJson}
      onComplete={handleComplete}
      className="contact-survey"
    />
  );
};

// Property application survey
export const PropertyApplicationSurvey = () => {
  const applicationSurveyJson = {
    title: "Rental Application",
    description: "Please complete this application to apply for the property.",
    pages: [
      {
        name: "personalInfo",
        title: "Personal Information",
        elements: [
          {
            type: "text",
            name: "firstName",
            title: "First Name",
            isRequired: true
          },
          {
            type: "text",
            name: "lastName",
            title: "Last Name",
            isRequired: true
          },
          {
            type: "email",
            name: "email",
            title: "Email Address",
            isRequired: true,
            validators: [{ type: "email" }]
          },
          {
            type: "text",
            name: "phone",
            title: "Phone Number",
            isRequired: true,
            inputType: "tel"
          },
          {
            type: "text",
            name: "dateOfBirth",
            title: "Date of Birth",
            isRequired: true,
            inputType: "date"
          }
        ]
      },
      {
        name: "employment",
        title: "Employment Information",
        elements: [
          {
            type: "text",
            name: "employer",
            title: "Current Employer",
            isRequired: true
          },
          {
            type: "text",
            name: "jobTitle",
            title: "Job Title",
            isRequired: true
          },
          {
            type: "text",
            name: "monthlyIncome",
            title: "Monthly Income (₦)",
            isRequired: true,
            inputType: "number"
          },
          {
            type: "text",
            name: "employmentLength",
            title: "Length of Employment",
            placeholder: "e.g., 2 years, 6 months"
          }
        ]
      },
      {
        name: "references",
        title: "References",
        elements: [
          {
            type: "text",
            name: "previousLandlord",
            title: "Previous Landlord Name"
          },
          {
            type: "text",
            name: "previousLandlordPhone",
            title: "Previous Landlord Phone",
            inputType: "tel"
          },
          {
            type: "text",
            name: "emergencyContact",
            title: "Emergency Contact Name",
            isRequired: true
          },
          {
            type: "text",
            name: "emergencyContactPhone",
            title: "Emergency Contact Phone",
            isRequired: true,
            inputType: "tel"
          }
        ]
      }
    ],
    showProgressBar: "top",
    progressBarType: "buttons",
    showQuestionNumbers: "off",
    completedHtml: "<div style='text-align: center; padding: 2rem;'><h3 style='color: #10b981;'>Application Submitted!</h3><p>We'll review your application and get back to you within 24-48 hours.</p></div>"
  };

  const handleComplete = (survey: Model) => {
    console.log('Application Results:', survey.data);
    // Here you would typically send the data to your backend
    alert('Application submitted successfully!');
  };

  return (
    <SurveyComponent
      surveyJson={applicationSurveyJson}
      onComplete={handleComplete}
      className="application-survey"
    />
  );
};

// Export all survey examples
const SurveyExamples = {
  FeedbackSurvey,
  ContactFormSurvey,
  PropertyApplicationSurvey
};

export default SurveyExamples;