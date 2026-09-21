'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ROLES, DEMO_USERS } from '@/lib/constants';

const RoleContext = createContext(null);

const STORAGE_KEY = 'campusride_role';

/** RoleProvider — Manages the active user role and profile in local storage. */
export default function RoleProvider({ children }) {
  const [role, setRole] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Read saved role from localStorage once on client mount
  useEffect(() => {
    const loadSavedRole = () => {
      try {
        const savedRole = localStorage.getItem(STORAGE_KEY);
        if (savedRole && Object.values(ROLES).includes(savedRole)) {
          setRole(savedRole);
        }
      } catch {
        // Local storage unavailable or disabled
      } finally {
        setIsLoaded(true);
      }
    };

    const timer = window.setTimeout(loadSavedRole, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Set new role and persist to localStorage
  const selectRole = (newRole) => {
    setRole(newRole);
    try {
      if (newRole) {
        localStorage.setItem(STORAGE_KEY, newRole);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage write errors
    }
  };

  // Clear role and return to unauthenticated/guest state
  const logout = () => {
    selectRole(null);
  };

  // Get demo user matching the active role
  const user = role ? DEMO_USERS[role] || null : null;

  const value = {
    role,
    user,
    selectRole,
    logout,
    isLoaded,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

/** useRole — Hook to access role state, current user, and role switcher actions. */
export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
