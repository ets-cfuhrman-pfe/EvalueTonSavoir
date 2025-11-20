import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/ApiService';

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
    createdAt: string;
}

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const fetchedUsers = await ApiService.getAllUsers();
                setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="container mt-4">
                <h1>Tableau d'administration</h1>
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" aria-hidden="true">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <h1>Tableau d'administration</h1>
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4 admin-dashboard">
            <h1>Tableau d'administration</h1>
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Tous les utilisateurs ({users.length})</h5>
                </div>
                <div className="card-body">
                    {users.length === 0 ? (
                        <p className="text-muted">Aucun utilisateur trouvé.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Nom</th>
                                        <th>Courriel</th>
                                        <th>Rôles</th>
                                        <th>Créé le</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <button 
                                                    className="btn btn-link p-0 text-decoration-none"
                                                    onClick={() => navigate(`/admin/user/${user._id}`, { state: { user } })}
                                                >
                                                    {user.name}
                                                </button>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                   {(user.roles || []).map((role) => (
                                                    <span key={role} className="badge bg-secondary me-1">
                                                        {role}
                                                    </span>
                                                ))}
                                            </td>
                                            <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-CA') : '—'}</td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => navigate(`/admin/user/${user._id}`, { state: { user } })}
                                                >
                                                    Voir les détails
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;