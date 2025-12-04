import React, { useEffect, useState } from 'react';
import { 
    Container, 
    Typography, 
    Card, 
    CardContent, 
    Chip, 
    Box, 
    CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { ENV_VARIABLES } from '../../constants';

interface HealthCheck {
    endpoint: string;
    name: string;
    description: string;
}

interface StatusData {
    status: string;
    timestamp: string;
    httpCode?: number;
    checks?: Record<string, string>;
    services?: Record<string, string>;
    errors?: Record<string, string>;
}

const CHECKS: HealthCheck[] = [
    { endpoint: '/api/health', name: 'System Status', description: 'Overall system and database health' },
    { endpoint: '/api/health/dashboard', name: 'Teacher Dashboard', description: 'Dependencies for dashboard (Quizzes, Folders)' },
    { endpoint: '/api/health/login', name: 'Login System', description: 'Dependencies for authentication (Users)' },
    { endpoint: '/api/health/join-room', name: 'Join Room', description: 'Dependencies for student room joining' },
];

const StatusPage: React.FC = () => {
    const [statuses, setStatuses] = useState<Record<string, StatusData | null>>({});
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchStatus = async () => {
        setLoading(true);
        const newStatuses: Record<string, StatusData | null> = {};
        
        let baseUrl = ENV_VARIABLES.VITE_BACKEND_URL || 'http://localhost:4400';
        baseUrl = baseUrl.replace(/\/$/, '');

        await Promise.all(CHECKS.map(async (check) => {
            try {
                const response = await fetch(`${baseUrl}${check.endpoint}`);
                let data = {};
                try {
                    data = await response.json();
                } catch (_e) {
                    // Ignore JSON parse errors
                }

                newStatuses[check.endpoint] = { 
                    status: response.ok ? 'ok' : 'error', 
                    timestamp: new Date().toISOString(),
                    httpCode: response.status,
                    ...data
                };
            } catch (_e) {
                newStatuses[check.endpoint] = { 
                    status: 'unreachable', 
                    timestamp: new Date().toISOString(),
                    httpCode: 0
                };
            }
        }));

        setStatuses(newStatuses);
        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        if (status === 'ok' || status === 'up') return 'success';
        return 'error';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'ok' || status === 'up') return <CheckCircleIcon />;
        return <ErrorIcon />;
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    System Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
                {CHECKS.map((check) => {
                    const data = statuses[check.endpoint];
                    
                    return (
                        <Card key={check.endpoint} elevation={2}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="h6" component="div">
                                            {check.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {check.description}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', display: 'block', mt: 0.5 }}>
                                            {check.endpoint}
                                        </Typography>
                                    </Box>
                                    
                                    {loading && !data ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        <Chip 
                                            icon={getStatusIcon(data?.status || 'error')} 
                                            label={`${data?.status?.toUpperCase() || 'UNKNOWN'} ${data?.httpCode ? `(${data.httpCode})` : ''}`}
                                            color={getStatusColor(data?.status || 'error')}
                                            variant="outlined"
                                        />
                                    )}
                                </Box>

                                {data && (data.checks || data.services) && (
                                    <Box mt={2} pl={2} borderLeft={2} borderColor="grey.200">
                                        {Object.entries({...data.checks, ...data.services}).map(([key, value]) => (
                                            <Box key={key} mb={1}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Typography variant="body2" sx={{ textTransform: 'capitalize', minWidth: 150 }}>
                                                        {key.replace(/_/g, ' ')}
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2" 
                                                        color={value.toLowerCase().includes('ok') || value.toLowerCase().includes('up') ? 'success.main' : 'error.main'}
                                                        fontWeight="bold"
                                                    >
                                                        {value.toUpperCase()}
                                                    </Typography>
                                                </Box>
                                                {data.errors && data.errors[key] && (
                                                    <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                                        Error: {data.errors[key]}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        </Container>
    );
};

export default StatusPage;
