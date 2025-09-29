import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider, createTheme } from '@mui/material';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import Bootstrap styles
import './styles/main.scss';

import './cssReset.css';
import './index.css';

// Initialize lightbox functionality
import './utils/lightboxManager';

const theme = createTheme({
    palette: {
        primary: {
            main: '#5271FF'
        },
        secondary: {
            main: '#000000'
        }
    },
    typography: {
        fontFamily: "'OpenSans', sans-serif",
        button: {
            textTransform: 'none',
            fontWeight: 'bold'
        }
    }
});

const rootElement = document.getElementById('root');
if (rootElement) {

    ReactDOM.createRoot(document.getElementById('root')!).render(
        <BrowserRouter>
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        </BrowserRouter>
    );
} else {
    console.error('Root element not found');
}
