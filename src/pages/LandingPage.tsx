import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import { GithubIcon } from '../assets/icons/GithubIcon';
import { TelegramIcon } from '../assets/icons/TelegramIcon';
import { VkIcon } from '../assets/icons/VkIcon';
import { YoutubeIcon } from '../assets/icons/YoutubeIcon';
import { BoostyIcon } from '../assets/icons/BoostyIcon';

interface LandingPageProps {
  onNavigateToWorkbench: () => void;
}

// Данные для раздела "Что нового?"
const changelogData = [
  {
    version: 'v1.2',
    date: '25.07.2024',
    changes: [
      'Добавлена поддержка червячных передач.',
      'Улучшен интерфейс выбора типа передачи.',
      'Реализован экспорт отчетов в PDF.'
    ]
  },
  {
    version: 'v1.1',
    date: '15.07.2024',
    changes: [
      'Добавлен интерактивный тур по приложению.',
      'Исправлены ошибки в расчете конических передач.'
    ]
  },
  {
      version: 'v1.0',
      date: '05.07.2024',
      changes: [
          'Первый публичный релиз приложения.',
          'Базовый функционал для расчетов.'
      ]
  }
];

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToWorkbench }) => {
  const [feedback, setFeedback] = useState({
    type: 'Идея',
    message: '',
    email: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

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


  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-100" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'10\' viewBox=\'0 0 10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2\' stroke=\'%23cbd5e1\' stroke-opacity=\'0.6\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }}>
      <header className="w-full p-4 bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Калькулятор трансмиссий</h1>
          <div className="flex items-center space-x-4">
            {/* Placeholder for future controls */}
            <div className="text-sm text-gray-400">[Язык]</div>
            <div className="text-sm text-gray-400">[Вход]</div>
          </div>
        </div>
      </header>

      <div className="w-full bg-slate-200/70 border-b border-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 pt-2" aria-label="Tabs">
            {/* Active Tab */}
            <span className="bg-slate-100 border border-slate-300 border-b-transparent rounded-t-lg px-6 py-3 font-semibold text-slate-800 text-sm -mb-px">
              Расчет передаточных чисел
            </span>
            {/* Inactive/Disabled Tab */}
            <span className="bg-slate-300 border-transparent text-gray-500 rounded-t-lg px-6 py-3 font-medium text-sm cursor-not-allowed hover:bg-slate-300/40 hover:text-slate-700 transition-colors">
              [В разработке...]
            </span>
          </nav>
        </div>
      </div>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center bg-white p-8 rounded-xl shadow-lg mb-10">
          <p className="max-w-3xl mx-auto text-xl text-slate-800 mb-8">
            Визуальный конструктор схем и каскадный расчет кинематики. От идеи до готового чертежа и полного отчета.
          </p>
          <Button onClick={onNavigateToWorkbench} variant="primary" className="!px-10 !py-4 text-lg animate-pulse-shadow">
            Перейти к калькулятору
          </Button>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Визуальная демонстрация</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {/* Screenshot placeholders */}
                <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 text-sm font-semibold">[Скриншот 1]</div>
                <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 text-sm font-semibold">[Скриншот 2]</div>
                <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 text-sm font-semibold">[Скриншот 3]</div>
              </div>
              <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 mb-6 font-semibold">[Короткая GIF/видео демонстрация]</div>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button variant="secondary" onClick={() => window.open('https://youtube.com', '_blank')} className="w-full sm:w-auto !flex items-center justify-center gap-2">
                  <YoutubeIcon className="w-6 h-6" />
                  Смотреть на YouTube
                </Button>
                <Button variant="secondary" onClick={() => window.open('https://vk.com/video', '_blank')} className="w-full sm:w-auto !flex items-center justify-center gap-2">
                  <VkIcon className="w-6 h-6" />
                  Смотреть на VK Видео
                </Button>
              </div>
            </div>
            
            {/* Changelog */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Что нового?</h3>
              <div className="space-y-4">
                {changelogData.slice(0, 2).map((item) => (
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
              <a href="https://github.com/kostia-egik/transmissioncalk/releases" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-4 inline-block">Вся история изменений →</a>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-10">
            {/* Feedback Box */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Есть идея или отзыв?</h3>
              <form onSubmit={handleSubmit}>
                <Select
                  id="feedback-type"
                  name="type"
                  value={feedback.type}
                  onChange={handleFeedbackChange}
                  options={[
                    { value: 'Идея', label: 'Идея по улучшению' },
                    { value: 'Ошибка', label: 'Сообщение об ошибке' },
                    { value: 'Другое', label: 'Другое' },
                  ]}
                  label="Тип отзыва"
                  className="!mb-2"
                />
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1">Ваше сообщение<span className="text-red-500">*</span></label>
                <textarea 
                  id="feedback-message"
                  name="message"
                  value={feedback.message}
                  onChange={handleFeedbackChange}
                  className="w-full h-24 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="Опишите подробно..."
                  required
                />
                <Input
                    id="feedback-email"
                    name="email"
                    type="email"
                    label="Ваш Email (необязательно)"
                    placeholder="Для обратной связи"
                    value={feedback.email}
                    onChange={handleFeedbackChange}
                    className="!mb-2 mt-2"
                />
                <div className="mt-2 h-10 flex items-center">
                    {/* FIX: Refactor button rendering to a single component to resolve type error and improve logic. */}
                    {(formStatus === 'idle' || formStatus === 'submitting') && (
                        <Button type="submit" variant="primary" className="!w-full text-sm" disabled={formStatus === 'submitting' || feedback.message.trim() === ''}>
                            {formStatus === 'submitting' ? 'Отправка...' : 'Отправить'}
                        </Button>
                    )}
                    {formStatus === 'success' && (
                        <p className="w-full text-center text-sm font-semibold text-green-600 bg-green-100 p-2 rounded-md animate-fade-in">Спасибо! Отзыв отправлен.</p>
                    )}
                    {formStatus === 'error' && (
                        <p className="w-full text-center text-sm font-semibold text-red-600 bg-red-100 p-2 rounded-md animate-fade-in">Ошибка. Попробуйте снова.</p>
                    )}
                </div>
              </form>
            </div>

            {/* Social & Support */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Следите и поддерживайте</h3>
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
              </div>
              <Button onClick={() => window.open('https://boosty.to/erinaceuscraft/donate', '_blank')} className="!w-full !bg-slate-300 hover:!bg-slate-400 !flex items-center justify-center gap-2 !py-2.5">
                <span className="font-semibold text-slate-800">Поддержать на</span>
                <BoostyIcon className="h-5 w-auto" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full px-4 sm:px-6 lg:px-8 mt-8 py-6 text-center text-gray-500 text-sm border-t border-slate-300 bg-slate-100">
          <p>&copy; {new Date().getFullYear()} Мастер Трансмиссий. Все права защищены.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
