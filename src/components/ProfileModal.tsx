import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  Music, 
  Disc3, 
  Flame, 
  Edit2, 
  Check, 
  Radio,
  Calendar, 
  ArrowLeft
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { UserAvatar } from './UserAvatar';

export const ProfileModal: React.FC = () => {
  const { 
    isProfileOpen, 
    setIsProfileOpen, 
    userProfile, 
    updateProfile, 
    likedTracks, 
    playlists, 
    historyItems,
    showToast
  } = usePlayer();

  const [nameInput, setNameInput] = useState(userProfile.name || 'notemov');
  const [bioInput, setBioInput] = useState(userProfile.bio || 'nabersiniz');
  const [genreInput, setGenreInput] = useState(userProfile.favoriteGenre || 'Türkçe Pop');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile.avatar || 'dj-cool');
  const [isEditing, setIsEditing] = useState(false);

  if (!isProfileOpen) return null;

  const avatarOptions = [
    { id: 'dj-cool', name: 'DJ Cool', desc: 'Klasik Stüdyo Kulaklığı' },
    { id: 'cyber-neon', name: 'Siber Neon', desc: 'Enerjik & Canlı' },
    { id: 'chill-lofi', name: 'Chill Gece', desc: 'Gece Sakinliği' },
    { id: 'rock-star', name: 'Rock Star', desc: 'Ateşli Ritim' },
    { id: 'vinyl-vintage', name: 'Retro Plak', desc: 'Analog Ses' },
  ];

  const genres = [
    'Türkçe Pop', 
    'Türkçe Rap & Hip-Hop', 
    'Yabancı Pop', 
    'Rock & Alternatif',
    'Lo-Fi & Akustik', 
    'R&B & Soul', 
    'Elektronik & Dance', 
    'Klasik & Caz'
  ];

  // Calculate top artist from history
  const artistMap = new Map<string, number>();
  historyItems.forEach(h => {
    if (h.track && h.track.artist) {
      artistMap.set(h.track.artist, (artistMap.get(h.track.artist) || 0) + 1);
    }
  });
  let topArtist = 'Henüz yok';
  let maxPlays = 0;
  artistMap.forEach((count, artist) => {
    if (count > maxPlays) {
      maxPlays = count;
      topArtist = artist;
    }
  });

  const handleStartEdit = () => {
    setNameInput(userProfile.name || 'notemov');
    setBioInput(userProfile.bio || 'nabersiniz');
    setGenreInput(userProfile.favoriteGenre || 'Türkçe Pop');
    setSelectedAvatar(userProfile.avatar || 'dj-cool');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nameInput.trim() || 'notemov';
    const finalBio = bioInput.trim() || 'nabersiniz';
    
    updateProfile({
      name: finalName,
      bio: finalBio,
      favoriteGenre: genreInput,
      avatar: selectedAvatar,
    });
    
    showToast('Profil başarıyla güncellendi');
    setIsEditing(false);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsProfileOpen(false);
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fadeIn"
    >
      <div className="bg-[#0e1017] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex flex-col relative max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-6 pb-2 flex items-center justify-between shrink-0">
          <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wider uppercase">
            {isEditing ? 'PROFİLİ DÜZENLE' : 'KULLANICI PROFİLİ'}
          </span>
          
          <button
            onClick={() => setIsProfileOpen(false)}
            title="Kapat (Esc)"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-5">
          {isEditing ? (
            /* ================= EDIT MODE ================= */
            <form onSubmit={handleSave} className="space-y-5 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-3.5">
                  <UserAvatar avatar={selectedAvatar} size="lg" className="ring-2 ring-emerald-500/50 shadow-lg" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Profilini Özelleştir</h3>
                    <p className="text-xs text-neutral-400">Görünüm, biyografi ve Sana Özel öneriler için favori türünü seç</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Vazgeç</span>
                </button>
              </div>

              {/* Name input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Kullanıcı adınız..."
                    maxLength={24}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-500 focus:bg-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white font-medium outline-none transition-all placeholder-neutral-500"
                  />
                  <span className="absolute right-3 top-3 text-[10px] text-neutral-500 font-mono">
                    {nameInput.length}/24
                  </span>
                </div>
              </div>

              {/* Bio input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 block">
                  Biyografi & Durum Mesajı
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Müzik zevkinizden bahsedin..."
                    maxLength={60}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-500 focus:bg-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white font-medium outline-none transition-all placeholder-neutral-500"
                  />
                  <span className="absolute right-3 top-3 text-[10px] text-neutral-500 font-mono">
                    {bioInput.length}/60
                  </span>
                </div>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 block">
                  Profil Simgesi Seç
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {avatarOptions.map(av => {
                    const isSelected = selectedAvatar === av.id;
                    return (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setSelectedAvatar(av.id)}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 text-left cursor-pointer ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                        }`}
                      >
                        <UserAvatar avatar={av.id} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{av.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{av.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genre Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 block">
                  Favori Müzik Türü (Sana Özel önerilerini etkiler)
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(g => {
                    const isSelected = genreInput === g;
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setGenreInput(g)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25 scale-105'
                            : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <div className="space-y-5 pt-2">
              
              {/* Profile Hero Section */}
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-xl flex items-center justify-center">
                    <UserAvatar size="xl" className="w-full h-full rounded-2xl" />
                  </div>
                </div>

                {/* Identity Info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-2xl font-black text-white tracking-tight truncate">
                      {userProfile.name || 'notemov'}
                    </h2>

                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10 shadow-sm shrink-0 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Düzenle</span>
                    </button>
                  </div>

                  <p className="text-sm text-neutral-300 font-medium leading-relaxed mt-1.5 italic">
                    "{userProfile.bio || 'nabersiniz'}"
                  </p>

                  <div className="flex items-center gap-2 pt-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{userProfile.favoriteGenre || 'Türkçe Pop'}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{userProfile.joinedDate || 'Kasım 2026'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/5 transition-all text-center">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-1.5">
                    <Music className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xl font-black text-white">{historyItems.length}</span>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mt-0.5">DİNLENEN</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/5 transition-all text-center">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-1.5">
                    <Heart className="w-4 h-4 text-pink-400 fill-pink-500/20" />
                  </div>
                  <span className="text-xl font-black text-white">{likedTracks.length}</span>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mt-0.5">BEĞENİLEN</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/5 transition-all text-center">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-1.5">
                    <Disc3 className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-xl font-black text-white">{playlists.length}</span>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mt-0.5">LİSTELER</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/5 transition-all text-center">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs font-black text-white truncate max-w-[95px] block mx-auto mt-1" title={topArtist}>
                    {topArtist}
                  </span>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mt-1">FAVORİ</p>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
