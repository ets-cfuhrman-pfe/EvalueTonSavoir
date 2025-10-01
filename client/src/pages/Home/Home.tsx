import React from 'react';

import './home.css';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="page">
            <div className="btn-container">

                <Link to="/student/join-room-v2" className="student-btn">
                    <div className="big-title">
                        Espace
                        <br />
                        étudiant
                    </div>
                    <div className="right-component">
                        <img src="student.svg" alt="Icône étudiant" />
                    </div>
                </Link>

                <Link to="/teacher/dashboard-v2" className="teacher-btn">
                    <div>
                        <img src="teacher.svg" alt="Icône enseignant" />
                    </div>
                    <div className="right-component big-title">
                        Espace <br />
                        enseignant
                    </div>
                </Link>
                
            </div>
        </div>
    );
};

export default Home;
