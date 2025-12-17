import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
    const { admin, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] items-center justify-center shadow-lg shadow-blue-500/40 mb-3">
                        <span className="text-xl font-extrabold text-white">P</span>
                    </div>
                    <p className="text-slate-600 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!admin) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
