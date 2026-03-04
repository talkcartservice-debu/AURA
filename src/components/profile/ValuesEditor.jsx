import TagSelector from './TagSelector';
const VALUES = ['Honesty', 'Loyalty', 'Kindness', 'Ambition', 'Humor', 'Empathy', 'Respect', 'Independence', 'Family', 'Growth', 'Adventure', 'Spirituality'];
export default function ValuesEditor({ values = [], onChange }) {
  return <TagSelector tags={values} options={VALUES} onChange={onChange} label='Core Values' />;
}
