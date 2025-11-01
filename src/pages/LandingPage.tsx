import React, { useState, useEffect, useCallback } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import { GithubIcon } from '../assets/icons/GithubIcon';
import { TelegramIcon } from '../assets/icons/TelegramIcon';
import { VkIcon } from '../assets/icons/VkIcon';
import { YoutubeIcon } from '../assets/icons/YoutubeIcon';
import { BoostyIcon } from '../assets/icons/BoostyIcon';
import { AuthWidget } from '../components/AuthWidget';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ChangelogModal, ChangelogItem } from '../components/ChangelogModal';

// Импорт медиафайлов из папки assets
import screenshot1 from '../assets/1.webp';
import screenshot2 from '../assets/2.webp';
import screenshot3 from '../assets/3.webp';
import demoVideo from '../assets/demo-video.mp4';


interface LandingPageProps {
  onNavigateToWorkbench: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToWorkbench }) => {
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState({
    type: 'Идея',
    message: '',
    email: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [lightboxState, setLightboxState] = useState({ isOpen: false, imageIndex: 0 });
  const screenshots = [screenshot1, screenshot2, screenshot3];
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);

  // --- Динамическая загрузка данных для Changelog ---
  const changelogVersions = t('changelog_versions').split(',');
  const allChangelogItems: ChangelogItem[] = changelogVersions.map(version => {
      const versionKey = version.replace(/\./g, '_');
      const changes: string[] = [];
      let i = 1;
      while (true) {
          const change = t(`changelog_${versionKey}_changes_${i}` as any, undefined);
          if (change === `changelog_${versionKey}_changes_${i}`) break; // Key not found
          changes.push(change);
          i++;
      }
      return {
          version: t(`changelog_${versionKey}_version` as any),
          date: t(`changelog_${versionKey}_date` as any),
          changes: changes,
      };
  });


  // Сбрасываем статус формы через 4 секунды после ответа
  useEffect(() => {
    if (formStatus === 'success' || formStatus === 'error') {
      const timer = setTimeout(() => {
        setFormStatus('idle');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [formStatus]);

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeedback(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('submitting');

    const formData = new FormData();
    formData.append('Тип отзыва', feedback.type);
    formData.append('Сообщение', feedback.message);
    formData.append('Email для связи', feedback.email);

    try {
      const response = await fetch('https://formspree.io/f/xqkvqjyl', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setFormStatus('success');
        setFeedback({ type: 'Идея', message: '', email: '' });
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      setFormStatus('error');
    }
  };

  // --- Функции для управления лайтбоксом ---
  const openLightbox = (index: number) => {
    setLightboxState({ isOpen: true, imageIndex: index });
  };

  const closeLightbox = useCallback(() => {
    setLightboxState({ isOpen: false, imageIndex: 0 });
  }, []);

  const goToNext = useCallback(() => {
    setLightboxState(prevState => ({
      ...prevState,
      imageIndex: (prevState.imageIndex + 1) % screenshots.length,
    }));
  }, [screenshots.length]);

  const goToPrev = useCallback(() => {
    setLightboxState(prevState => ({
      ...prevState,
      imageIndex: (prevState.imageIndex - 1 + screenshots.length) % screenshots.length,
    }));
  }, [screenshots.length]);

  useEffect(() => {
    if (!lightboxState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxState.isOpen, closeLightbox, goToNext, goToPrev]);


  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-100" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'10\' viewBox=\'0 0 10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2\' stroke=\'%23cbd5e1\' stroke-opacity=\'0.6\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }}>
      <header className="w-full p-4 bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">{t('header_title')}</h1>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <AuthWidget />
          </div>
        </div>
      </header>

      <div className="w-full bg-slate-200/70 border-b border-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 pt-2" aria-label="Tabs">
            {/* Active Tab */}
            <span className="bg-slate-100 border border-slate-300 border-b-transparent rounded-t-lg px-6 py-3 font-semibold text-slate-800 text-sm -mb-px">
              {t('tab_gear_ratios')}
            </span>
            {/* Inactive/Disabled Tab */}
            <span className="bg-slate-300 border-transparent text-gray-500 rounded-t-lg px-6 py-3 font-medium text-sm cursor-not-allowed hover:bg-slate-300/40 hover:text-slate-700 transition-colors">
              {t('tab_in_development')}
            </span>
          </nav>
        </div>
      </div>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center bg-white p-8 rounded-xl shadow-lg mb-10">
          <p className="max-w-4xl mx-auto text-xl text-slate-800 mb-8">
            {t('hero_description')}
          </p>
          <Button onClick={onNavigateToWorkbench} variant="primary" className="!px-10 !py-4 text-lg animate-pulse-shadow">
            {t('hero_button')}
          </Button>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {screenshots.map((src, index) => (
                    <div key={index} className="relative aspect-video bg-slate-200 rounded-lg group cursor-pointer overflow-hidden" onClick={() => openLightbox(index)}>
                        <img loading="lazy" decoding="async" src={src} alt={`${t('screenshots_title')} ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-colors flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                        </div>
                    </div>
                ))}
              </div>
              <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 mb-6 font-semibold overflow-hidden">
                <video src={demoVideo} controls autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover">
                  Ваш браузер не поддерживает тег video.
                </video>
              </div>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button variant="secondary" onClick={() => window.open('https://youtube.com', '_blank')} className="w-full sm:w-auto !flex items-center justify-center gap-2">
                  <YoutubeIcon className="w-6 h-6" />
                  {t('watch_on_youtube')}
                </Button>
                <Button variant="secondary" onClick={() => window.open('https://vk.com/video', '_blank')} className="w-full sm:w-auto !flex items-center justify-center gap-2">
                  <VkIcon className="w-6 h-6" />
                  {t('watch_on_vk')}
                </Button>
              </div>
            </div>
            
            {/* Changelog */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{t('changelog_title')}</h3>
              <div className="space-y-4">
                {allChangelogItems.slice(0, 2).map((item) => (
                  <div key={item.version}>
                    <h4 className="font-semibold text-slate-800 mb-1">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold me-2 px-2.5 py-0.5 rounded-full">{item.version}</span>
                      <span className="text-sm text-slate-500 font-normal">{item.date}</span>
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 pl-2">
                      {item.changes.map((change, index) => (
                        <li key={index}>{change}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <button onClick={() => setIsChangelogModalOpen(true)} className="text-sm text-blue-600 hover:underline mt-4 inline-block">{t('changelog_all_changes')}</button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-10">
            {/* Feedback Box */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{t('feedback_title')}</h3>
              <form onSubmit={handleSubmit}>
                <Select
                  id="feedback-type"
                  name="type"
                  value={feedback.type}
                  onChange={handleFeedbackChange}
                  options={[
                    { value: 'Идея', label: t('feedback_type_idea') },
                    { value: 'Ошибка', label: t('feedback_type_bug') },
                    { value: 'Другое', label: t('feedback_type_other') },
                  ]}
                  label={t('feedback_type_label')}
                  className="!mb-2"
                />
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1">{t('feedback_message_label')}<span className="text-red-500">*</span></label>
                <textarea 
                  id="feedback-message"
                  name="message"
                  value={feedback.message}
                  onChange={handleFeedbackChange}
                  className="w-full h-24 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder={t('feedback_message_placeholder')}
                  required
                />
                <Input
                    id="feedback-email"
                    name="email"
                    type="email"
                    label={t('feedback_email_label')}
                    placeholder={t('feedback_email_placeholder')}
                    value={feedback.email}
                    onChange={handleFeedbackChange}
                    className="!mb-2 mt-2"
                />
                <div className="mt-2 h-10 flex items-center">
                    {(formStatus === 'idle' || formStatus === 'submitting') && (
                        <Button type="submit" variant="primary" className="!w-full text-sm" disabled={formStatus === 'submitting' || feedback.message.trim() === ''}>
                            {formStatus === 'submitting' ? t('feedback_submitting_button') : t('feedback_submit_button')}
                        </Button>
                    )}
                    {formStatus === 'success' && (
                        <p className="w-full text-center text-sm font-semibold text-green-600 bg-green-100 p-2 rounded-md animate-fade-in">{t('feedback_success_message')}</p>
                    )}
                    {formStatus === 'error' && (
                        <p className="w-full text-center text-sm font-semibold text-red-600 bg-red-100 p-2 rounded-md animate-fade-in">{t('feedback_error_message')}</p>
                    )}
                </div>
              </form>
            </div>

            {/* Social & Support */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{t('social_title')}</h3>
              <div className="flex justify-center space-x-6 mb-6">
                <a href="https://t.me/erinaceuscraft" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-500 transition-colors" title="Telegram">
                    <TelegramIcon className="w-8 h-8" />
                </a>
                <a href="https://github.com/kostia-egik/transmissioncalk" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-800 transition-colors" title="GitHub">
                    <GithubIcon className="w-8 h-8" />
                </a>
                <a href="https://vk.com/club227195296" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors" title="VK">
                    <VkIcon className="w-8 h-8" />
                </a>
				<a href="https://www.youtube.com/@erinaceuscraft" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors" title="Youtube">
                    <YoutubeIcon className="w-8 h-8" />
                </a>
              </div>
              <Button onClick={() => window.open('https://boosty.to/erinaceuscraft/donate', '_blank')} className="!w-full !bg-slate-300 hover:!bg-slate-400 !flex items-center justify-center gap-2 !py-2.5">
                <span className="font-semibold text-slate-800">{t('social_support_button')}</span>
                <BoostyIcon className="h-5 w-auto" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {isChangelogModalOpen && (
          <ChangelogModal
              isOpen={isChangelogModalOpen}
              onClose={() => setIsChangelogModalOpen(false)}
              changelogItems={allChangelogItems}
          />
      )}

      {lightboxState.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm animate-fade-in-fast" 
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <button 
            onClick={closeLightbox} 
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors"
            aria-label={t('common_close_esc')}
          >
            &times;
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); goToPrev(); }} 
            className="absolute left-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors"
            aria-label={t('common_previous_element')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <img 
            loading="lazy"
            decoding="async"
            src={screenshots[lightboxState.imageIndex]} 
            alt={`${t('screenshots_title')} ${lightboxState.imageIndex + 1}`} 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <button 
            onClick={(e) => { e.stopPropagation(); goToNext(); }} 
            className="absolute right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors"
            aria-label={t('common_next_element')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      <footer className="w-full px-4 sm:px-6 lg:px-8 mt-8 py-6 text-center text-gray-500 text-sm border-t border-slate-300 bg-slate-100">
          <p>&copy; {new Date().getFullYear()} {t('footer_copyright')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;