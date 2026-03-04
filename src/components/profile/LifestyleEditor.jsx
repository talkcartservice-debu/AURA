const OPTIONS = { smoking: ['Never', 'Socially', 'Regularly'], drinking: ['Never', 'Socially', 'Regularly'], exercise: ['Never', 'Sometimes', 'Often', 'Daily'], diet: ['No preference', 'Vegetarian', 'Vegan', 'Keto', 'Halal', 'Kosher'] };
export default function LifestyleEditor({ lifestyle = {}, onChange }) {
  const set = (k, v) => onChange({ ...lifestyle, [k]: v });
  return (
    <div className='space-y-4'>
      {Object.entries(OPTIONS).map(([key, opts]) => (
        <div key={key}>
          <label className='text-xs font-semibold text-gray-500 uppercase mb-2 block capitalize'>{key}</label>
          <div className='flex flex-wrap gap-2'>
            {opts.map(o => (
              <button key={o} type='button' onClick={() => set(key, o)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${lifestyle[key] === o ? 'bg-rose-100 border-rose-400 text-rose-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>{o}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
