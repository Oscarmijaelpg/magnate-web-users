// Auth Context for Web - Version 3.1 (Stable Logout)
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '@/domain/entities/User';
import { AccountWithType } from '@/domain/entities/Account';
import { supabase } from '@/lib/supabase';

// Import use cases and repositories
import { LoginWithWebPassword } from '@/domain/usecases/auth/LoginWithWebPassword';
import { Logout } from '@/domain/usecases/auth/Logout';
import { AuthRepository } from '@/data/repositories/AuthRepository';
import { UserRepository } from '@/data/repositories/UserRepository';
import { AccountRepository } from '@/data/repositories/AccountRepository';
import { AuthDataSource } from '@/data/datasources/supabase/AuthDataSource';
import { UserDataSource } from '@/data/datasources/supabase/UserDataSource';
import { AccountDataSource } from '@/data/datasources/supabase/AccountDataSource';

interface AuthContextType {
    user: User | null;
    account: AccountWithType | null;
    session: any;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize dependencies
const authDataSource = new AuthDataSource();
const userDataSource = new UserDataSource();
const accountDataSource = new AccountDataSource();

const authRepository = new AuthRepository(authDataSource);
const userRepository = new UserRepository(userDataSource);
const accountRepository = new AccountRepository(accountDataSource);

const loginUseCase = new LoginWithWebPassword(authRepository);
const logoutUseCase = new Logout(authRepository);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [account, setAccount] = useState<AccountWithType | null>(null);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // ✅ Referencia para la suscripción en tiempo real (persiste entre renders)
    const realtimeSubscriptionRef = useRef<any>(null);

    const isAuthenticated = !!session && !!user;

    // ✅ Función para configurar la suscripción
    const setupRealtimeSubscription = async (userId: string) => {
        // Si ya existe una suscripción activa para este usuario, no hacer nada
        if (realtimeSubscriptionRef.current) return;

        console.log('🔗 [V3.1] Setting up realtime subscription for user:', userId);
        realtimeSubscriptionRef.current = supabase
            .channel(`public:users:id=eq.${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${userId}`,
                },
                async (payload) => {
                    const newUser = payload.new as User;
                    if (newUser.verification_status === 'suspended') {
                        console.log('🚫 [V3.1] User suspended via realtime update. Logging out...');
                        await logout();
                        window.location.replace('/login?reason=suspended');
                    }
                }
            )
            .subscribe();
    };

    // Monitor state changes specifically for logout debugging
    useEffect(() => {
        if (session || user || !loading) {
            console.log(`📊 [V3.1] State: session=${!!session}, user=${!!user}, loading=${loading} -> auth=${isAuthenticated}`);
        }
    }, [session, user, loading, isAuthenticated]);

    const loadingUserRef = useRef<string | null>(null);

    useEffect(() => {
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log('🔐 [V3.1] Auth Event:', event, currentSession ? '(Session active)' : '(No session)');

                if (event === 'SIGNED_OUT') {
                    console.log('👋 [V3.1] SIGNED_OUT event triggered cleanup');
                    clearAllState();
                } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    setSession(currentSession);
                    if (currentSession?.user) {
                        loadUserData(currentSession.user.id);
                    } else {
                        setLoading(false);
                    }
                }
            }
        );

        return () => {
            subscription.unsubscribe();
            // ✅ Limpiar suscripción al desmontar
            if (realtimeSubscriptionRef.current) {
                console.log('🔌 [V3.1] Cleaning up realtime subscription on unmount');
                supabase.removeChannel(realtimeSubscriptionRef.current);
                realtimeSubscriptionRef.current = null;
            }
        };
    }, []);

    const clearAllState = () => {
        console.log('🧹 [V3.1] Force-clearing all local auth state');
        setUser(null);
        setAccount(null);
        setSession(null);
        setSession(null);

        // ✅ Limpiar suscripción
        if (realtimeSubscriptionRef.current) {
            supabase.removeChannel(realtimeSubscriptionRef.current);
            realtimeSubscriptionRef.current = null;
        }

        loadingUserRef.current = null;
        setLoading(false);
    };

    const checkSession = async () => {
        try {
            console.log('🔍 [V3.1] Checking initial session...');
            setLoading(true);
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('❌ [V3.1] Session check error:', error);
            }

            setSession(currentSession);
            if (currentSession?.user) {
                console.log('📌 [V3.1] Found active session, loading user profile...');
                loadUserData(currentSession.user.id);
            } else {
                console.log('📌 [V3.1] No initial session found');
                setLoading(false);
            }
        } catch (error) {
            console.error('❌ [V3.1] Unexpected error during session check:', error);
            setLoading(false);
        }
    };

    const loadUserData = async (userId: string) => {
        if (loadingUserRef.current === userId) return;

        loadingUserRef.current = userId;
        console.log('👤 [V3.1] Loading profile for:', userId);

        try {
            // Wait for user profile with timeout
            const userPromise = userRepository.getUserById(userId);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile load timeout')), 10000)
            );

            const userData = await Promise.race([userPromise, timeoutPromise]) as User | null;
            console.log('✅ [V3.1] User profile arrival:', !!userData);

            setUser(userData);

            if (userData) {
                // [V3.1] Check for suspension immediately after loading profile
                if (userData.verification_status === 'suspended') {
                    console.warn('🚫 [V3.1] User is suspended. Aborting load and logging out.');
                    await logout();
                    window.location.replace('/login?reason=suspended');
                    return;
                }

                console.log('💳 [V3.1] Loading primary account...');
                const accountData = await accountRepository.getPrimaryAccount(userId);
                setAccount(accountData);

                // Setup realtime listener for status changes
                setupRealtimeSubscription(userId);
            }
        } catch (error) {
            console.error('❌ [V3.1] User data load error:', error);
        } finally {
            if (loadingUserRef.current === userId) {
                loadingUserRef.current = null;
            }
            // Always resolve loading in this branch if we are the current loader
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            console.log('🔑 [V3.1] Login initiated:', email);
            const result = await loginUseCase.execute(email, password);

            if (result.success && result.user) {
                console.log('✅ [V3.1] Login success');
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (error: any) {
            console.error('❌ [V3.1] Login error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        console.log('🚪 [V3.1] Manual logout sequence start');
        try {
            setLoading(true);

            // Clear locally first to be safe
            setUser(null);
            setAccount(null);
            setSession(null);

            // Call Supabase with timeout
            const signOutPromise = logoutUseCase.execute();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SignOut timeout')), 4000)
            );

            await Promise.race([signOutPromise, timeoutPromise]);
            console.log('✅ [V3.1] Supabase signOut completed');

        } catch (error) {
            console.error('❌ [V3.1] Logout error:', error);
        } finally {
            clearAllState();
            console.log('⌛ [V3.1] Logout sequence finished');
        }
    };

    const refreshUser = async () => {
        if (!session?.user?.id) return;
        await loadUserData(session.user.id);
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user?.id) return { success: false, error: 'Usuario no identificado' };
        try {
            const updatedUser = await userRepository.updateUser(user.id, updates);
            setUser(updatedUser);
            return { success: true };
        } catch (error: any) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                account,
                session,
                loading,
                isAuthenticated,
                login,
                logout,
                refreshUser,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
