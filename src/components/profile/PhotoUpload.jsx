import { useState } from 'react';
import { Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { uploadService } from '@/api/entities';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function PhotoUpload({ photos = [], onChange, max = 6 }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 10MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const url = await uploadService.single(file);
      onChange([...photos, url]);
      toast.success('Photo uploaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photo. Please try again.');
    }
    setUploading(false);
    e.target.value = '';
  }

  const remove = (idx) => {
    onChange(photos.filter((_, i) => i !== idx));
    toast.success('Photo removed');
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-2'>
        <label className='text-xs font-semibold text-gray-500 uppercase'>Photos</label>
        <span className='text-xs text-gray-400'>{photos.length}/{max}</span>
      </div>
      <div className='grid grid-cols-3 gap-2'>
        {photos.map((url, i) => (
          <div key={i} className='relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 group'>
            <img src={url} alt='' className='w-full h-full object-cover' />
            <button
              onClick={() => remove(i)}
              className='absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity'
            >
              <X className='w-3 h-3' />
            </button>
            {i === 0 && (
              <span className='absolute bottom-1 left-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium'>
                Main
              </span>
            )}
          </div>
        ))}
        {photos.length < max && (
          <label className='aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-rose-300 transition-colors gap-1'>
            {uploading ? (
              <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
            ) : (
              <>
                <Plus className='w-6 h-6 text-gray-400' />
                <span className='text-[10px] text-gray-400'>Add Photo</span>
              </>
            )}
            <input type='file' accept='image/jpeg,image/jpg,image/png,image/webp' onChange={handleUpload} className='hidden' disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
}
