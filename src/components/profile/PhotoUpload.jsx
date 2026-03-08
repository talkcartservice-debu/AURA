import { useState } from 'react';
import { Plus, X, Loader2, Star, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { uploadService } from '@/api/entities';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function PhotoUpload({ photos = [], onChange, max = 6 }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > max) {
      toast.error(`You can only upload up to ${max} photos`);
      e.target.value = '';
      return;
    }

    const validFiles = files.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported format (JPG, PNG, WebP only)`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const urls = await uploadService.multiple(validFiles);
      onChange([...photos, ...urls]);
      toast.success(`${validFiles.length} photo(s) uploaded!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photos. Please try again.');
    }
    setUploading(false);
    e.target.value = '';
  }

  const remove = (idx) => {
    const newPhotos = photos.filter((_, i) => i !== idx);
    onChange(newPhotos);
    toast.success('Photo removed');
  };

  const setPrimary = (idx) => {
    if (idx === 0) return;
    const newPhotos = [...photos];
    const item = newPhotos.splice(idx, 1)[0];
    newPhotos.unshift(item);
    onChange(newPhotos);
    toast.success('Primary photo updated');
  };

  const move = (idx, direction) => {
    const newIndex = idx + direction;
    if (newIndex < 0 || newIndex >= photos.length) return;
    const newPhotos = [...photos];
    [newPhotos[idx], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[idx]];
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className='flex items-center justify-between'>
        <div>
          <label className='text-xs font-bold text-gray-500 uppercase tracking-wider'>Your Photos</label>
          <p className="text-[10px] text-gray-400">First photo is your primary profile picture</p>
        </div>
        <span className='text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full'>{photos.length}/{max}</span>
      </div>

      <div className='grid grid-cols-2 xs:grid-cols-3 gap-3'>
        <AnimatePresence mode="popLayout">
          {photos.map((url, i) => (
            <motion.div
              layout
              key={url}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all group ${
                i === 0 ? 'border-rose-500 ring-2 ring-rose-100' : 'border-gray-100'
              }`}
            >
              <img src={url} alt='' className='w-full h-full object-cover' />
              
              {/* Overlay controls */}
              <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2'>
                <div className="flex justify-between items-start">
                  <button
                    onClick={() => remove(i)}
                    className='bg-white/20 backdrop-blur-md hover:bg-red-500 text-white rounded-lg p-1.5 transition-colors'
                    title="Remove"
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                  
                  {i !== 0 && (
                    <button
                      onClick={() => setPrimary(i)}
                      className='bg-white/20 backdrop-blur-md hover:bg-rose-500 text-white rounded-lg p-1.5 transition-colors'
                      title="Set as Primary"
                    >
                      <Star className='w-4 h-4' />
                    </button>
                  )}
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className={`bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-lg p-1.5 transition-colors ${i === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <ArrowLeft className='w-4 h-4' />
                  </button>
                  <button
                    disabled={i === photos.length - 1}
                    onClick={() => move(i, 1)}
                    className={`bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-lg p-1.5 transition-colors ${i === photos.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <ArrowRight className='w-4 h-4' />
                  </button>
                </div>
              </div>

              {i === 0 && (
                <div className='absolute top-2 left-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1'>
                  <Star className="w-2.5 h-2.5 fill-white" />
                  PRIMARY
                </div>
              )}
            </motion.div>
          ))}

          {photos.length < max && (
            <motion.label
              layout
              className='aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-all gap-2 group'
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className='w-8 h-8 animate-spin text-rose-500' />
                  <span className='text-[10px] font-bold text-gray-400'>UPLOADING...</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                    <Plus className='w-6 h-6 text-gray-400 group-hover:text-rose-500' />
                  </div>
                  <span className='text-xs font-bold text-gray-400 group-hover:text-rose-600'>Add Photo</span>
                </>
              )}
              <input 
                type='file' 
                multiple 
                accept='image/jpeg,image/jpg,image/png,image/webp' 
                onChange={handleUpload} 
                className='hidden' 
                disabled={uploading} 
              />
            </motion.label>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
