import { useState } from 'react'

const onboardingQuestions = [
  {
    id: 'displayName',
    question: 'What should we call you?',
    type: 'text',
    placeholder: 'Enter your name',
  },
  {
    id: 'role',
    question: 'What is your role?',
    type: 'select',
    options: ['Student', 'Team Lead', 'Faculty/Mentor', 'Other'],
  },
  {
    id: 'year',
    question: 'What year are you in?',
    type: 'select',
    options: ['First Year', 'Second Year', 'Third Year', 'Final Year', 'Other'],
  },
  {
    id: 'focusArea',
    question: 'What do you mainly work on?',
    type: 'select',
    options: ['Web Development', 'App Development', 'AI/ML', 'Cybersecurity', 'Data Science', 'Other'],
  },
]

function Onboarding({ onComplete, user }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({
    displayName: '',
    role: 'Student',
    year: 'First Year',
    focusArea: 'Web Development',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = onboardingQuestions[currentStep]
  const isLastStep = currentStep === onboardingQuestions.length - 1

  const handleAnswerChange = (value) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleContinue = async () => {
    if (!answers[currentQuestion.id]?.trim()) return

    if (isLastStep) {
      setIsSubmitting(true)
      try {
        await onComplete(answers)
      } catch (error) {
        console.error('Failed to complete onboarding:', error)
        setIsSubmitting(false)
      }
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !isSubmitting) {
      event.preventDefault()
      handleContinue()
    }
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="brand">
            <span className="brand-mark">G</span>
            <span>groupify<span className="brand-dot">.</span></span>
          </div>
          <div className="onboarding-progress">
            <span className="progress-text">{currentStep + 1} of {onboardingQuestions.length}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentStep + 1) / onboardingQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="onboarding-content">
          <h2 className="onboarding-question">{currentQuestion.question}</h2>

          {currentQuestion.type === 'text' ? (
            <input
              type="text"
              value={answers[currentQuestion.id]}
              onChange={(e) => handleAnswerChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentQuestion.placeholder}
              className="onboarding-input"
              autoFocus
            />
          ) : (
            <div className="onboarding-options">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  className={`onboarding-option ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="onboarding-footer">
          <button
            className="ghost-button"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            Back
          </button>
          <button
            className="primary-button"
            onClick={handleContinue}
            disabled={!answers[currentQuestion.id]?.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isLastStep ? 'Finish Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
