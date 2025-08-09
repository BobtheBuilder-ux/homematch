# SurveyJS Implementation

This project now includes a comprehensive survey implementation using SurveyJS, a powerful JavaScript survey library.

## 🚀 Features

- **Multiple Survey Types**: Property preferences, feedback forms, contact forms, and rental applications
- **Rich Question Types**: Text inputs, dropdowns, radio buttons, checkboxes, ratings, sliders, and more
- **Multi-page Surveys**: With progress tracking and navigation
- **Custom Styling**: Tailored to match the application's design system
- **Form Validation**: Built-in validation with custom error messages
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📁 Files Created

### Components
- `src/components/Survey.tsx` - Main reusable survey component
- `src/components/SurveyExamples.tsx` - Pre-built survey examples

### Pages
- `src/app/(nondashboard)/survey/page.tsx` - Full property preferences survey
- `src/app/(nondashboard)/survey-demo/page.tsx` - Interactive demo showcasing all survey types
- `src/app/(nondashboard)/survey/survey.css` - Custom styling for surveys

## 🎯 Available Survey Types

### 1. Property Preferences Survey (`/survey`)
A comprehensive multi-page survey that collects:
- Personal information
- Property preferences (type, budget, bedrooms, bathrooms)
- Amenities and location preferences
- Move-in timeline and additional requirements

### 2. Feedback Survey
A simple rating and feedback form for property reviews with:
- Star ratings
- Multiple choice questions
- Text comments

### 3. Contact Form Survey
A contact form with validation featuring:
- Email validation
- Phone input
- Contact preferences
- Message field

### 4. Rental Application Survey
A multi-page application form with:
- Personal information
- Employment details
- References
- Progress tracking

## 🛠️ Usage

### Basic Implementation

```tsx
import SurveyComponent from '@/components/Survey';
import { Model } from 'survey-core';

const MyPage = () => {
  const surveyJson = {
    title: "My Survey",
    elements: [
      {
        type: "text",
        name: "name",
        title: "What is your name?",
        isRequired: true
      }
    ]
  };

  const handleComplete = (survey: Model) => {
    console.log('Survey Results:', survey.data);
    // Send data to your backend
  };

  return (
    <SurveyComponent
      surveyJson={surveyJson}
      onComplete={handleComplete}
    />
  );
};
```

### Using Pre-built Examples

```tsx
import { FeedbackSurvey, ContactFormSurvey } from '@/components/SurveyExamples';

const MyPage = () => {
  return (
    <div>
      <h2>Property Feedback</h2>
      <FeedbackSurvey />
      
      <h2>Contact Us</h2>
      <ContactFormSurvey />
    </div>
  );
};
```

## 🎨 Customization

### Styling
The surveys use custom CSS that matches the application's design system. You can modify the styles in:
- `src/app/(nondashboard)/survey/survey.css`

### Survey Configuration
Surveys are configured using JSON objects. Key properties include:

- `title`: Survey title
- `description`: Survey description
- `elements`: Array of questions
- `pages`: For multi-page surveys
- `showProgressBar`: Show progress indicator
- `completedHtml`: Custom completion message

### Question Types

```tsx
// Text input
{
  type: "text",
  name: "fieldName",
  title: "Question title",
  isRequired: true,
  placeholder: "Enter text..."
}

// Rating
{
  type: "rating",
  name: "rating",
  title: "Rate this",
  rateMin: 1,
  rateMax: 5
}

// Multiple choice
{
  type: "radiogroup",
  name: "choice",
  title: "Select one",
  choices: [
    { value: "option1", text: "Option 1" },
    { value: "option2", text: "Option 2" }
  ]
}

// Checkboxes
{
  type: "checkbox",
  name: "multiChoice",
  title: "Select all that apply",
  choices: [...]
}
```

## 🌐 Accessing the Surveys

1. **Full Survey Example**: Visit `http://localhost:3000/survey`
2. **Interactive Demo**: Visit `http://localhost:3000/survey-demo`

## 📦 Dependencies Added

- `survey-react-ui`: React components for SurveyJS
- `survey-core`: Core SurveyJS functionality

## 🔧 Integration with Backend

To integrate with your backend, modify the `onComplete` handlers in the survey components:

```tsx
const handleComplete = async (survey: Model) => {
  const results = survey.data;
  
  try {
    const response = await fetch('/api/surveys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(results),
    });
    
    if (response.ok) {
      console.log('Survey submitted successfully');
    }
  } catch (error) {
    console.error('Error submitting survey:', error);
  }
};
```

## 📚 Additional Resources

- [SurveyJS Documentation](https://surveyjs.io/documentation)
- [SurveyJS Examples](https://surveyjs.io/examples)
- [Question Types Reference](https://surveyjs.io/documentation/questiontypes)

## 🎉 Next Steps

1. Customize the survey questions to match your specific needs
2. Integrate with your backend API
3. Add conditional logic for dynamic surveys
4. Implement survey analytics and reporting
5. Add file upload capabilities if needed

The survey system is now ready to use and can be easily extended with additional features as needed!