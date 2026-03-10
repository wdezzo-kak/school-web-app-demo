import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

export const useRole = () => {
  const { profile } = useAuth();
  
  const hasRole = (role: UserRole) => profile?.role === role;

  return {
    profile,
    role: profile?.role,
    hasRole,
  };
};
