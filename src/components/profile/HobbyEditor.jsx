import TagSelector from './TagSelector';
const HOBBIES = ['Reading', 'Cooking', 'Gaming', 'Painting', 'Gardening', 'Cycling', 'Yoga', 'Photography', 'Writing', 'Dancing', 'Surfing', 'Climbing'];
export default function HobbyEditor({ hobbies = [], onChange }) {
  return <TagSelector tags={hobbies} options={HOBBIES} onChange={onChange} label='Hobbies' />;
}
