import AdvancedHashTableVisualizer from '../components/AdvancedHashTableVisualizer';

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <AdvancedHashTableVisualizer initialCapacity={8} />
    </div>
  );
}
