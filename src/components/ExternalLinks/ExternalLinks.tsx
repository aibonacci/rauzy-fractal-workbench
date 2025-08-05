import React from 'react';
import { AcademicCapIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../../i18n/context';
import { useConfig } from '../../config/ConfigContext';

interface ExternalLinksProps {
  className?: string;
}

// Icon mapping for configuration
const ICON_MAP = {
  AcademicCapIcon,
  CodeBracketIcon
};

const ExternalLinks: React.FC<ExternalLinksProps> = ({ className = '' }) => {
  const { t } = useI18n();
  const { config } = useConfig();
  
  const LiuTheoremIcon = ICON_MAP[config.ui.external.links.liuTheorem.icon as keyof typeof ICON_MAP];
  const GitHubIcon = ICON_MAP[config.ui.external.links.github.icon as keyof typeof ICON_MAP];

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Liu's Theorem Link */}
      <a
        href={config.ui.external.links.liuTheorem.url}
        target={config.ui.external.links.liuTheorem.target}
        rel={config.ui.external.links.liuTheorem.rel}
        className="icon-button group relative"
        title={t('links.liuTheoremTooltip')}
        aria-label={t('links.liuTheorem')}
      >
        <LiuTheoremIcon 
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
        href={config.ui.external.links.github.url}
        target={config.ui.external.links.github.target}
        rel={config.ui.external.links.github.rel}
        className="icon-button group relative"
        title={t('links.githubTooltip')}
        aria-label={t('links.github')}
      >
        <GitHubIcon 
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