import TagSelector from './TagSelector';
const DEALBREAKERS = ['Smoking', 'Heavy drinking', 'No ambition', 'Dishonesty', 'Poor hygiene', 'Jealousy', 'No sense of humor', 'Closed-minded'];
export default function DealbreakersEditor({ dealbreakers = [], onChange }) {
  return <TagSelector tags={dealbreakers} options={DEALBREAKERS} onChange={onChange} label='Dealbreakers' />;
}
