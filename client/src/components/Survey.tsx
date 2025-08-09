'use client';

import React, { useCallback } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';

interface SurveyComponentProps {
  surveyJson: any;
  onComplete?: (survey: Model) => void;
  onValueChanged?: (survey: Model, options: any) => void;
  className?: string;
}

const SurveyComponent: React.FC<SurveyComponentProps> = ({
  surveyJson,
  onComplete,
  onValueChanged,
  className = ''
}) => {
  const survey = new Model(surveyJson);

  // Handle survey completion
  const handleComplete = useCallback((survey: Model) => {
    console.log('Survey completed:', survey.data);
    if (onComplete) {
      onComplete(survey);
    }
  }, [onComplete]);

  // Handle value changes
  const handleValueChanged = useCallback((survey: Model, options: any) => {
    console.log('Survey value changed:', options);
    if (onValueChanged) {
      onValueChanged(survey, options);
    }
  }, [onValueChanged]);

  // Set event handlers
  survey.onComplete.add(handleComplete);
  survey.onValueChanged.add(handleValueChanged);

  // Customize survey appearance
  survey.applyTheme({
    "cssVariables": {
      "--sjs-corner-radius": "8px",
      "--sjs-base-unit": "8px",
      "--sjs-primary-backcolor": "#3b82f6",
      "--sjs-primary-forecolor": "#ffffff",
      "--sjs-general-backcolor-dim": "#f8fafc",
      "--sjs-secondary-backcolor": "#e2e8f0",
      "--sjs-shadow-small": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      "--sjs-shadow-medium": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    }
  });

  return (
    <div className={`survey-container ${className}`}>
      <Survey model={survey} />
    </div>
  );
};

export default SurveyComponent;