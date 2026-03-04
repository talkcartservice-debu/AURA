import { X } from 'lucide-react';
export default function TagSelector({ tags = [], options = [], onChange, label = 'Tags' }) {
  const toggle = (t) => onChange(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t]);
  return (
    <div>
      <label className='text-xs font-semibold text-gray-500 uppercase mb-2 block'>{label}</label>
      <div className='flex flex-wrap gap-2'>
        {options.map(t => (
          <button key={t} type='button' onClick={() => toggle(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${tags.includes(t) ? 'bg-rose-100 border-rose-400 text-rose-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}>{t}{tags.includes(t) && <X className='w-3 h-3 ml-1 inline' />}</button>
        ))}
      </div>
    </div>
  );
}
