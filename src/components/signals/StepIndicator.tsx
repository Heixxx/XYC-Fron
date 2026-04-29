import { useTranslation } from 'react-i18next';

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { t } = useTranslation();
  if (currentStep === 0) return null;

  const steps = [
    { label: t('signals.pipeline.layer0'), color: '#3B82F6' },
    { label: t('signals.pipeline.layer1'), color: '#00E396' },
    { label: t('signals.pipeline.layer2'), color: '#8B5CF6' },
    { label: t('signals.pipeline.layer3'), color: '#F59E0B' },
    { label: t('signals.pipeline.layer4'), color: '#F0B90B' },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <span className="text-xs mr-2" style={{ color: 'var(--text-muted)' }}>{t('signals.pipelineLabel')}:</span>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all"
            style={{
              backgroundColor: i < currentStep ? `${step.color}25` : 'rgba(255,255,255,0.04)',
              color: i < currentStep ? step.color : 'var(--text-muted)',
              border: `1px solid ${i === currentStep - 1 ? step.color : 'transparent'}`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: i < currentStep ? step.color : 'var(--text-muted)',
                opacity: i === currentStep - 1 ? 1 : 0.4,
              }}
            />
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-3 h-px mx-0.5"
              style={{
                backgroundColor: i < currentStep - 1 ? step.color : 'var(--border-subtle)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
