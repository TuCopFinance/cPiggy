'use client';

import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function LanguageDemo() {
  const { t, currentLocale, setLocale } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🌍 Language Demo - {t('language.current')}
        </h2>
        <LanguageSwitcher 
          currentLocale={currentLocale} 
          onLocaleChange={setLocale} 
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Home Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-pink-600">🏠 {t('navigation.home')}</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> {t('home.title')}</p>
            <p><strong>Subtitle:</strong> {t('home.subtitle')}</p>
            <p><strong>Create Button:</strong> {t('home.createPiggy')}</p>
            <p><strong>View Button:</strong> {t('home.viewPiggies')}</p>
          </div>
        </div>

        {/* Create Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-600">➕ {t('navigation.create')}</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> {t('create.title')}</p>
            <p><strong>Amount:</strong> {t('create.amount')}</p>
            <p><strong>Duration:</strong> {t('create.duration')}</p>
            <p><strong>Risk Mode:</strong> {t('create.riskMode')}</p>
          </div>
        </div>

        {/* Dashboard Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-600">📊 {t('navigation.dashboard')}</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> {t('dashboard.title')}</p>
            <p><strong>No Piggies:</strong> {t('dashboard.noPiggies')}</p>
            <p><strong>Status Active:</strong> {t('dashboard.status.active')}</p>
            <p><strong>Claim:</strong> {t('dashboard.claim')}</p>
          </div>
        </div>

        {/* Common Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-purple-600">🔧 {t('navigation.settings')}</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Loading:</strong> {t('common.loading')}</p>
            <p><strong>Error:</strong> {t('common.error')}</p>
            <p><strong>Success:</strong> {t('common.success')}</p>
            <p><strong>Cancel:</strong> {t('common.cancel')}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">💡 How it works:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>IP Detection:</strong> Automatically detects your country and sets language</li>
          <li>• <strong>Browser Language:</strong> Falls back to your browser&apos;s preferred language</li>
          <li>• <strong>Manual Override:</strong> Use the language switcher to change anytime</li>
          <li>• <strong>Persistent:</strong> Your choice is saved in localStorage</li>
        </ul>
      </div>
    </div>
  );
}
