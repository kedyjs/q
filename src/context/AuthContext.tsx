import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, users } from '../lib/supabase';
import { User } from '../types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isTeamLeader: boolean;
  login: (email: string, password: string) => Promise<{ error?: Error }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await auth.getSession();
        
        if (data.session) {
          const { data: profileData } = await users.getCurrentProfile();
          if (profileData) {
            setUser(profileData);
          }
        }
      } catch (error) {
        console.error('Auth kontrolü sırasında hata oluştu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await auth.signIn(email, password);
      
      if (error) return { error };
      
      const { data: profileData } = await users.getCurrentProfile();
      if (profileData) {
        setUser(profileData);
        navigate('/dashboard');
      }
      
      return {};
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isTeamLeader: user?.user_type === 'team_leader',
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth hook, AuthProvider içinde kullanılmalıdır');
  }
  
  return context;
};