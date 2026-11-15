import React, { useState } from 'react';
import { 
  X, 
  Palette, 
  Sliders, 
  Volume2, 
  Sparkles, 
  Clock, 
  Check, 
  Edit3, 
  Image, 
  HelpCircle,
  Monitor
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { ThemeType } from '../types';
import { AppLogo } from './AppLogo';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    setIsSettingsOpen, 
    appSettings, 
    updateSettings, 
    sleepTimerRemaining, 
    setSleepTimer 
  } = usePlayer();

  const [nameInput, setNameInput] = useState(appSettings.appName);
  const [customIconInput, setCustomIconInput] = useState('');
  const [activeTab, setActiveTab] = useState<'app' | 'audio' | 'timer'>('app');

  if (!isSettingsOpen) return null;

  const iconPresets = [
    { id: 'neon-note', name: 'Zümrüt Nota' },
    { id: 'vinyl-flame', name: 'Alevli Plak' },
    { id: 'cosmic-sound', name: 'Kozmik Ses' },
    { id: 'cyber-headphones', name: 'Siber Kulaklık' },
    { id: 'minimal-pulse', name: 'Ses Nabzı' },
    { id: 'retro-disc', name: 'Altın Disk' },
  ];

  const handleNameSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateSettings({ appName: nameInput.trim() });
    }
  };

  const handleCustomIconSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (customIconInput.trim()) {
      updateSettings({ appIcon: customIconInput.trim() });
      setCustomIconInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#12121c] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <div>
              <h3 className="font-extrabold text-white text-base">Uygulama Ayarları & Özelleştirme</h3>
              <p className="text-xs text-neutral-400">İsim, simge, temalar ve ses motorunu özelleştirin</p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-white/5 px-6 gap-2 bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('app')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'app'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            İsim & Simge
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'audio'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Ses Kalitesi & Ekolayzer
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'timer'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Uyku Zamanlayıcısı
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: App Name & Icon Customization */}
          {activeTab === 'app' && (
            <div className="space-y-6">
              {/* App Name Section */}
              <div className="space-y-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Uygulama İsmini Değiştir
                </label>
                <p className="text-xs text-neutral-400">
                  Uygulamanın sol üstünde, pencere başlığında ve tarayıcıda görünen ismini dilediğiniz gibi belirleyin.
                </p>
                <form onSubmit={handleNameSave} className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Uygulama adı (Örn: SoundVibe, JusteMusic)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all"
                  >
                    Kaydet
                  </button>
                </form>
              </div>

              {/* App Icon Gallery Section */}
              <div className="space-y-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Uygulama Simgesi / Logosu Seç
                </label>
                <p className="text-xs text-neutral-400">
                  Uygulama için beğendiğiniz simgeyi seçebilir veya özel bir görsel bağlantısı girebilirsiniz.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {iconPresets.map((preset) => {
                    const isSelected = appSettings.appIcon === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => updateSettings({ appIcon: preset.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-white/5 border-white/5 hover:border-white/20 text-neutral-300'
                        }`}
                      >
                        <div className="relative">
                          {/* Render preview with preset icon key */}
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                            {preset.id === 'neon-note' && <div className="w-full h-full bg-emerald-500 rounded-lg" />}
                            {preset.id === 'vinyl-flame' && <div className="w-full h-full bg-orange-500 rounded-lg" />}
                            {preset.id === 'cosmic-sound' && <div className="w-full h-full bg-purple-500 rounded-lg" />}
                            {preset.id === 'cyber-headphones' && <div className="w-full h-full bg-cyan-500 rounded-lg" />}
                            {preset.id === 'minimal-pulse' && <div className="w-full h-full bg-rose-500 rounded-lg" />}
                            {preset.id === 'retro-disc' && <div className="w-full h-full bg-amber-500 rounded-lg" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{preset.name}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    );
                  })}
                </div>

                {/* Custom Image URL Option */}
                <div className="pt-3 border-t border-white/5">
                  <span className="text-[11px] font-medium text-neutral-400 block mb-1.5">
                    Veya Kendi Görsel Bağlantını (URL) Kullan:
                  </span>
                  <form onSubmit={handleCustomIconSave} className="flex gap-2">
                    <input
                      type="url"
                      value={customIconInput}
                      onChange={(e) => setCustomIconInput(e.target.value)}
                      placeholder="https://.../logo.png"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                    >
                      Uygula
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Audio Quality & Equalizer */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Audio Quality */}
              <div className="space-y-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Ses Akış Kalitesi
                </span>
                <div className="space-y-2">
                  {(['Normal (160kbps)', 'Yüksek (320kbps)', 'Kayıpsız Hi-Res (24-bit/96kHz)'] as const).map((q) => {
                    const isSelected = appSettings.audioQuality === q;
                    return (
                      <div
                        key={q}
                        onClick={() => updateSettings({ audioQuality: q })}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-neutral-300'
                        }`}
                      >
                        <span className="text-xs font-semibold">{q}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Equalizer Presets */}
              <div className="space-y-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Ekolayzer Ön Ayarları
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Düz (Flat)', 'Bass Boost 🔥', 'Vokal Boost 🎙️', 'Pop & R&B ✨', 'Rock & Metal 🎸', 'Elektronik ⚡', 'Gece / Akustik 🌙'].map((eq) => {
                    const isSelected = appSettings.equalizerPreset === eq;
                    return (
                      <button
                        key={eq}
                        onClick={() => updateSettings({ equalizerPreset: eq })}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-black border-emerald-500 shadow-md'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-neutral-300'
                        }`}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Sleep Timer */}
          {activeTab === 'timer' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Uyumadan önce müzik dinlerken belirli bir süre sonra müziğin otomatik kapanmasını sağlayın:
              </p>

              {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                  <span className="text-xs text-emerald-400 font-semibold">Kapanmaya Kalan Süre:</span>
                  <p className="text-2xl font-mono font-extrabold text-white">
                    {Math.floor(sleepTimerRemaining / 60)} dakika {sleepTimerRemaining % 60} saniye
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setSleepTimer(mins)}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 text-center transition-all group"
                  >
                    <span className="text-lg font-bold text-white group-hover:text-emerald-400">
                      {mins} dk
                    </span>
                    <span className="block text-[11px] text-neutral-500 mt-1">Sonra Durdur</span>
                  </button>
                ))}
              </div>

              {sleepTimerRemaining !== null && (
                <button
                  onClick={() => setSleepTimer(null)}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold text-xs transition-colors"
                >
                  Zamanlayıcıyı İptal Et
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
