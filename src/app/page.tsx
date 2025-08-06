import AdvancedHashTableVisualizer from '../components/AdvancedHashTableVisualizer';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EFE6DE 0%, #E6D5C7 50%, #EFE6DE 100%)',
      padding: '20px',
      color: 'black'
    }}>
      <AdvancedHashTableVisualizer initialCapacity={8} />
    </div>
  );
}
