import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
// import App from './SignIn';
import App from './App.jsx';
import { AuthProvider } from './providers/AuthProvider';

ReactDOM.createRoot(document.querySelector("#root")).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
