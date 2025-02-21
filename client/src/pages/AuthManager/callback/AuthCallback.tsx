import React from 'react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../../../services/ApiService';

const OAuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const user = searchParams.get('user');
        const username = searchParams.get('username');

        if (user) {
            apiService.saveToken(user);
            apiService.saveUsername(username || "");
            navigate('/');
        } else {
            navigate('/login');
        }
    }, []);

    return <div>Loading...</div>;
};

export default OAuthCallback;
