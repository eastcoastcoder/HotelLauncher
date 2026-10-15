import { AppProviders } from './src/context/AppProviders';
import { TVApp } from './src/navigation/TVApp';

function App() {
  return (
    <AppProviders>
      <TVApp />
    </AppProviders>
  );
}

export default App;
