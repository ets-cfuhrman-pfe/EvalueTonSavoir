import React from 'react';
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Page main
import Home from './pages/Home/Home';

// Pages espace enseignant
import DashboardV2 from './pages/Teacher/Dashboard/DashboardV2';
import Share from './pages/Teacher/Share/Share';
import Register from './pages/AuthManager/providers/SimpleLogin/Register';
import ResetPassword from './pages/AuthManager/providers/SimpleLogin/ResetPassword';
import ManageRoomV2 from './pages/Teacher/ManageRoom/ManageRoomV2';
import EditorQuizV2 from './pages/Teacher/EditorQuiz/EditorQuizV2';

// Pages espace étudiant
import JoinRoomV2 from './pages/Student/JoinRoom/JoinRoomV2';

// Pages authentification selection
import AuthDrawer from './pages/AuthManager/AuthDrawer';

// Pages admin
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUserDetails from './pages/Admin/AdminUserDetails';

// Status Page
import StatusPage from './pages/Status/Status';

// Components

// Header/Footer import
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';



import ApiService from './services/ApiService';
import OAuthCallback from './pages/AuthManager/callback/AuthCallback';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(ApiService.isLoggedIn());
    const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(ApiService.isLoggedInTeacher());
    const [isAdmin, setIsAdmin] = useState(ApiService.isAdmin());
    const [isRoomRequireAuthentication, setRoomsRequireAuth] = useState(null);
    const location = useLocation();

    // Check login status every time the route changes
    useEffect(() => {
        const checkLoginStatus = () => {
            setIsAuthenticated(ApiService.isLoggedIn());
            setIsTeacherAuthenticated(ApiService.isLoggedInTeacher());
            setIsAdmin(ApiService.isAdmin());
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
        setIsAdmin(false);
    };

    return (
        <>
            <Header 
                isLoggedIn={isAuthenticated} 
                isTeacherAuthenticated={isTeacherAuthenticated} 
                isAdmin={isAdmin}
                handleLogout={handleLogout}
            />
            <div className="content">
                <div className="app">
                    <main>
                        <Routes>
                            {/* Page main */}
                            <Route path="/" element={<Home />} />
                            
                            {/* Status Page */}
                            <Route path="/status" element={<StatusPage />} />

                            {/* Pages espace enseignant */}
                        <Route
                            path="/teacher/dashboard"
                            element={isTeacherAuthenticated ? <DashboardV2 /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/teacher/share/:id"
                            element={isTeacherAuthenticated ? <Share /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/teacher/editor-quiz/:id"
                            element={isTeacherAuthenticated ? <EditorQuizV2 /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/teacher/manage-room/:quizId"
                            element={isTeacherAuthenticated ? <ManageRoomV2 /> : <Navigate to="/login" />}
                        />

                        {/* Pages admin */}
                        <Route
                            path="/admin/dashboard"
                            element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/admin/user/:id"
                            element={isAdmin ? <AdminUserDetails /> : <Navigate to="/login" />}
                        />

                        {/* Pages espace étudiant */}
                        <Route
                            path="/student/join-room"
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
