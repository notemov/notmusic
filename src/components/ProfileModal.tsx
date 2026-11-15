import React, { useState } from 'react';
import { 
  X, 
  User, 
  Heart, 
  Music, 
  Disc3, 
  Clock, 
  Check, 
  Flame, 
  Sparkles,
  Edit2
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
    historyItems 
  } = usePlayer();

  const [nameInput, setNameInput] = useState(userProfile.name);
  const [bioInput, setBioInput] = useState(userProfile.bio);
  const [genreInput, setGenreInput] = useState(userProfile.favoriteGenre);
  const [customAvatar, setCustomAvatar] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!isProfileOpen) return null;

  const avatarOptions = [
    { id: 'dj-cool', name: 'DJ Cool' },
    { id: 'cyber-neon', name: 'Siber Neon' },
    { id: 'chill-lofi', name: 'Chill Gece' },
    { id: 'rock-star', name: 'Rock Star' },
    { id: 'vinyl-vintage', name: 'Retro Plak' },
  ];

  const genres = [
    'Türkçe Pop', 'Türkçe Rap & Hip-Hop', 'Yabancı Pop', 'Rock & Alternatif',
    'Lo-Fi & Akustik', 'R&B & Soul', 'Elektronik & Dance', 'Klasik & Caz'
  ];

  // Calculate top artist from history
  const artistMap = new Map<string, number>();
  historyItems.forEach(h => {
    artistMap.set(h.track.artist, (artistMap.get(h.track.artist) || 0) + 1);
  });
  let topArtist = 'Henüz yok';
  let maxPlays = 0;
  artistMap.forEach((count, artist) => {
    if (count > maxPlays) {
      maxPlays = count;
      topArtist = artist;
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: nameInput.trim() || 'Müziksever',
      bio: bioInput.trim() || 'Müzik dinlemeyi seviyorum 🎵',
      favoriteGenre: genreInput,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#12121c] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Banner */}
        <div className="relative h-28 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 flex justify-between items-start">
          <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Kişisel Dinleyici Profili</span>
          </div>
          <button
            onClick={() => setIsProfileOpen(false)}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 space-y-6 relative -mt-12">
          {/* Avatar & Main Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <UserAvatar size="xl" className="border-4 border-[#12121c] shadow-2xl" />
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2 justify-center sm:justify-start">
                  <span>{userProfile.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    VIP
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">{userProfile.bio}</p>
                <p className="text-[11px] text-neutral-500">Favori Tür: <span className="text-emerald-400 font-semibold">{userProfile.favoriteGenre}</span></p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Geri Dön' : 'Profili Düzenle'}</span>
            </button>
          </div>

          {/* Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 bg-white/[0.03] p-5 rounded-2xl border border-white/5">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Kullanıcı Adınız
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="İsminiz..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Hakkında / Biyografi
                </label>
                <input
                  type="text"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Müzik zevkinizden bahsedin..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                  Favori Müzik Türü (Önerileri Şekillendirir)
                </label>
                <select
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  className="w-full bg-[#181824] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-2">
                  Avatar Seçimi
                </label>
                <div className="flex gap-2">
                  {avatarOptions.map(av => (
                    <button
                      type="button"
                      key={av.id}
                      onClick={() => updateProfile({ avatar: av.id })}
                      className={`p-1.5 rounded-xl border transition-all ${
                        userProfile.avatar === av.id ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <UserAvatar avatar={av.id} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          ) : (
            /* Stats Dashboard */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <Music className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-lg font-extrabold text-white">{historyItems.length}</span>
                <p className="text-[11px] text-neutral-400">Dinlenen Şarkı</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1 fill-pink-500/20" />
                <span className="text-lg font-extrabold text-white">{likedTracks.length}</span>
                <p className="text-[11px] text-neutral-400">Beğenilen</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <Disc3 className="w-5 h-5 text-violet-400 mx-auto mb-1" />
                <span className="text-lg font-extrabold text-white">{playlists.length}</span>
                <p className="text-[11px] text-neutral-400">Çalma Listesi</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <span className="text-sm font-bold text-white truncate block">{topArtist}</span>
                <p className="text-[11px] text-neutral-400">Favori Sanatçı</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
