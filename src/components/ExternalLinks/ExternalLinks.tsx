import React from 'react';
import { AcademicCapIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../../i18n/context';

interface ExternalLinksProps {
  className?: string;
}

// External links configuration
const EXTERNAL_LINKS = {
  LIU_THEOREM: {
    url: 'https://placeholder-liu-theorem.com', // 占位符链接
    icon: AcademicCapIcon,
    target: '_blank' as const,
    rel: 'noopener noreferrer' as const
  },
  GITHUB: {
    url: 'https://github.com/your-username/rauzy-fractal-workbench',
    icon: CodeBracketIcon,
    target: '_blank' as const,
    rel: 'noopener noreferrer' as const
  }
} as const;

const ExternalLinks: React.FC<ExternalLinksProps> = ({ className = '' }) => {
  const { t } = useI18n();

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Liu's Theorem Link */}
      <a
        href={EXTERNAL_LINKS.LIU_THEOREM.url}
        target={EXTERNAL_LINKS.LIU_THEOREM.target}
        rel={EXTERNAL_LINKS.LIU_THEOREM.rel}
        className="icon-button group relative"
        title={t('links.liuTheoremTooltip')}
        aria-label={t('links.liuTheorem')}
      >
        <EXTERNAL_LINKS.LIU_THEOREM.icon 
          className="w-full h-full transition-transform duration-200 group-hover:scale-110" 
          aria-hidden="true"
        />
        
        {/* Hover effect background */}
        <div className="absolute inset-0 rounded bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        {/* Screen reader text */}
        <span className="sr-only">{t('links.liuTheorem')}</span>
      </a>

      {/* GitHub Repository Link */}
      <a
        href={EXTERNAL_LINKS.GITHUB.url}
        target={EXTERNAL_LINKS.GITHUB.target}
        rel={EXTERNAL_LINKS.GITHUB.rel}
        className="icon-button group relative"
        title={t('links.githubTooltip')}
        aria-label={t('links.github')}
      >
        <EXTERNAL_LINKS.GITHUB.icon 
          className="w-full h-full transition-transform duration-200 group-hover:scale-110" 
          aria-hidden="true"
        />
        
        {/* Hover effect background */}
        <div className="absolute inset-0 rounded bg-gray-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        {/* Screen reader text */}
        <span className="sr-only">{t('links.github')}</span>
      </a>
    </div>
  );
};

export default ExternalLinks;