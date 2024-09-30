import { Routes, Route, Navigate } from 'react-router-dom';

// Page main
import Home from './pages/Home/Home';

// Pages espace enseignant
import Dashboard from './pages/Teacher/Dashboard/Dashboard';
import Share from './pages/Teacher/Share/Share';
import Login from './pages/Teacher/Login/Login';
import Register from './pages/Teacher/Register/Register';
import ResetPassword from './pages/Teacher/ResetPassword/ResetPassword';
import ManageRoom from './pages/Teacher/ManageRoom/ManageRoom';
import QuizForm from './pages/Teacher/EditorQuiz/EditorQuiz';

// Pages espace étudiant
import JoinRoom from './pages/Student/JoinRoom/JoinRoom';

// Pages authentification selection
import AuthSelection from './pages/AuthSelection/AuthSelection';

// Header/Footer import
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

import ApiService from './services/ApiService';

const handleLogout = () => {
    ApiService.logout();
};

const isLoggedIn = () => {
    return ApiService.isLoggedIn();
};

function App() {
    return (
        <div className="content">
            <Header isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
            <div className="app">
                <main>
                    <Routes>
                        {/* Page main */}
                        <Route path="/" element={<Home />} />

                        {/* Pages espace enseignant */}
                        <Route path="/teacher/login" element={<Login />} />
                        <Route path="/teacher/register" element={<Register />} />
                        <Route path="/teacher/resetPassword" element={<ResetPassword />} />

                        {/* Routes protégées : redirection si l'utilisateur n'est pas connecté */}
                        <Route
                            path="/teacher/dashboard"
                            element={isLoggedIn() ? <Dashboard /> : <Navigate to="/auth-selection" />}
                        />
                        <Route
                            path="/teacher/share/:id"
                            element={isLoggedIn() ? <Share /> : <Navigate to="/auth-selection" />}
                        />
                        <Route
                            path="/teacher/editor-quiz/:id"
                            element={isLoggedIn() ? <QuizForm /> : <Navigate to="/auth-selection" />}
                        />
                        <Route
                            path="/teacher/manage-room/:id"
                            element={isLoggedIn() ? <ManageRoom /> : <Navigate to="/auth-selection" />}
                        />

                        {/* Pages espace étudiant */}
                        <Route path="/student/join-room" element={isLoggedIn() ? <JoinRoom /> : <Navigate to="/auth-selection" />}
                        />

                        {/* Pages authentification sélection */}
                        <Route path="/auth-selection" element={<AuthSelection />} />
                    </Routes>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default App;
