import React from 'react';
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Page main
import Home from './pages/Home/Home';

// Pages espace enseignant
import Dashboard from './pages/Teacher/Dashboard/Dashboard';
import DashboardV2 from './pages/Teacher/Dashboard/DashboardV2';
import Share from './pages/Teacher/Share/Share';
import Register from './pages/AuthManager/providers/SimpleLogin/Register';
import ResetPassword from './pages/AuthManager/providers/SimpleLogin/ResetPassword';
import ManageRoom from './pages/Teacher/ManageRoom/ManageRoom';
import QuizForm from './pages/Teacher/EditorQuiz/EditorQuiz';

// Pages espace étudiant
import JoinRoom from './pages/Student/JoinRoom/JoinRoom';
import JoinRoomV2 from './pages/Student/JoinRoom/JoinRoomV2';

// Pages authentification selection
import AuthDrawer from './pages/AuthManager/AuthDrawer';

// Header/Footer import
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';



import ApiService from './services/ApiService';
import OAuthCallback from './pages/AuthManager/callback/AuthCallback';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(ApiService.isLoggedIn());
    const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(ApiService.isLoggedInTeacher());
    const [isRoomRequireAuthentication, setRoomsRequireAuth] = useState(null);
    const location = useLocation();

    // Check login status every time the route changes
    useEffect(() => {
        const checkLoginStatus = () => {
            setIsAuthenticated(ApiService.isLoggedIn());
            setIsTeacherAuthenticated(ApiService.isLoggedInTeacher());
        };

        const fetchAuthenticatedRooms = async () => {
            const data = await ApiService.getRoomsRequireAuth();
            setRoomsRequireAuth(data);
        };

        checkLoginStatus();
        fetchAuthenticatedRooms();
    }, [location]);

    const handleLogout = () => {
        ApiService.logout();
        setIsAuthenticated(false);
        setIsTeacherAuthenticated(false);
    };

    return (
        <>
            <Header isLoggedIn={isAuthenticated} handleLogout={handleLogout} />
            <div className="content">
                <div className="app">
                    <main>
                        <Routes>
                            {/* Page main */}
                            <Route path="/" element={<Home />} />

                            {/* Pages espace enseignant */}
                        <Route
                            path="/teacher/dashboard"
                            element={isTeacherAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/teacher/dashboard-v2"
                            element={isTeacherAuthenticated ? <DashboardV2 /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/teacher/share/:id"
                            element={isTeacherAuthenticated ? <Share /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/teacher/editor-quiz/:id"
                            element={isTeacherAuthenticated ? <QuizForm /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/teacher/manage-room/:quizId/:roomName"
                            element={isTeacherAuthenticated ? <ManageRoom /> : <Navigate to="/login" />}
                        />

                        {/* Pages espace étudiant */}
                        <Route
                            path="/student/join-room"
                            element={( !isRoomRequireAuthentication || isAuthenticated ) ? <JoinRoom /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/student/join-room-v2"
                            element={( !isRoomRequireAuthentication || isAuthenticated ) ? <JoinRoomV2 /> : <Navigate to="/login" />}
                        />

                        {/* Pages authentification */}
                        <Route path="/login" element={<AuthDrawer />} />

                        {/* Pages enregistrement */}
                        <Route path="/register" element={<Register />} />

                        {/* Pages rest password */}
                        <Route path="/resetPassword" element={<ResetPassword />} />

                        {/* Pages authentification sélection */}
                        <Route path="/auth/callback" element={<OAuthCallback />} />
                    </Routes>
                </main>
            </div>
            <Footer />
            </div>
        </>
    );
};

export default App;
