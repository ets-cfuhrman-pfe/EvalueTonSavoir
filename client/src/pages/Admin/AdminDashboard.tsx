import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const fetchedUsers = await ApiService.getAllUsers();
                setUsers(fetchedUsers);
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
                <h1>Admin Dashboard</h1>
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" aria-hidden="true">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <h1>Admin Dashboard</h1>
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h1>Admin Dashboard</h1>
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">All Users ({users.length})</h5>
                </div>
                <div className="card-body">
                    {users.length === 0 ? (
                        <p className="text-muted">No users found.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Roles</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <button 
                                                    className="btn btn-link p-0 text-decoration-none"
                                                    onClick={() => {/* TODO: Navigate to user details */}}
                                                >
                                                    {user.name}
                                                </button>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                {user.roles.map((role) => (
                                                    <span key={role} className="badge bg-secondary me-1">
                                                        {role}
                                                    </span>
                                                ))}
                                            </td>
                                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-primary">
                                                    View Details
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