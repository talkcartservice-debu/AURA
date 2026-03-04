import TagSelector from './TagSelector';
const EXPECTATIONS = ['Good communication', 'Quality time', 'Physical affection', 'Shared goals', 'Personal space', 'Emotional support', 'Adventures together', 'Intellectual connection'];
export default function RelationshipExpectationsEditor({ expectations = [], onChange }) {
  return <TagSelector tags={expectations} options={EXPECTATIONS} onChange={onChange} label='Relationship Expectations' />;
}
