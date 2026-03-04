import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
export default function AIBioGenerator({ profile, onGenerate }) {
  const [loading, setLoading] = useState(false);
  const interests = (profile?.interests || []).slice(0, 2);
  const hobbies = (profile?.hobbies || []).slice(0, 2);
  const values = (profile?.values || []).slice(0, 2);
  const interest1 = interests[0] || 'new experiences';
  const interest2 = interests[1] || hobbies[0] || 'good vibes';
  const hobby1 = hobbies[0] || interests[0] || 'trying new things';
  const value1 = values[0] || 'honesty';
  const value2 = values[1] || 'kindness';

  const bios = [
    `I'm a ${interest1.toLowerCase()} enthusiast who believes in genuine connections. When I'm not exploring, you'll find me ${hobby1.toLowerCase()}.`,
    `Looking for someone who appreciates the little things. I value ${value1.toLowerCase()} and ${value2.toLowerCase()}, and love a good conversation over ${interest2.toLowerCase()}.`,
    `Life's too short for boring conversations! I'm passionate about ${interest1.toLowerCase()} and always up for ${interest2.toLowerCase()}.`,
  ];
  async function generate() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onGenerate(bios[Math.floor(Math.random() * bios.length)]);
    setLoading(false);
  }
  return (
    <Button onClick={generate} disabled={loading} variant='outline' className='rounded-xl gap-2'>
      {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Sparkles className='w-4 h-4' />}
      {loading ? 'Generating...' : 'AI Generate Bio'}
    </Button>
  );
}
