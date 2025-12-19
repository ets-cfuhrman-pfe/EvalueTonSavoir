import React from 'react';

import '../../styles/main.scss';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="home-page">
            <div className="home-btn-container">

                <Link to="/student/join-room" className="home-role-btn student-btn">
                    <div className="home-big-title">
                        Espace
                        <br />
                        étudiant
                    </div>
                    <div className="home-right-component">
                        <img src="student.svg" alt="Icône étudiant" />
                    </div>
                </Link>

                <Link to="/teacher/dashboard" className="home-role-btn teacher-btn">
                    <div>
                        <img src="teacher.svg" alt="Icône enseignant" />
                    </div>
                    <div className="home-right-component home-big-title">
                        Espace <br />
                        enseignant
                    </div>
                </Link>
                
            </div>
        </div>
    );
};

export default Home;
