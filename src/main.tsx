import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyThemeToDocument, useThemeStore } from './theme/theme';
import './styles/theme.css';
import './styles/desktop.css';
import './styles/window.css';
import './styles/apps.css';
import './styles/mobile.css';
import './styles/themes.css';
import './styles/themes-apps.css';

// Set the saved theme before the first paint so there's no flash of the default one.
applyThemeToDocument(useThemeStore.getState().theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
