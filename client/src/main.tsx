import ReactDOM from 'react-dom/client';
import App from './App.tsx';

import { config } from 'dotenv';

import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider, createTheme } from '@mui/material';
import '@fortawesome/fontawesome-free/css/all.min.css';

import './cssReset.css';
import './index.css';

// load environment variables once
config();
// Log environment variables to verify they are loaded
console.log('Environment Variables:', process.env);

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

ReactDOM.createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <ThemeProvider theme={theme}>
            <App />
        </ThemeProvider>
    </BrowserRouter>
);
