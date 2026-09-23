'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ROLES, DEMO_USERS, DEMO_USER_OPTIONS } from '@/lib/constants';

const RoleContext = createContext(null);

const STORAGE_KEY = 'campusride_role';
const USER_STORAGE_KEY = 'campusride_user_';

/** RoleProvider — Manages the active user role and profile in local storage. */
export default function RoleProvider({ children }) {
  const [role, setRole] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userIds, setUserIds] = useState({});

  // Read saved role from localStorage once on client mount
  useEffect(() => {
    const loadSavedRole = () => {
      try {
        const savedRole = localStorage.getItem(STORAGE_KEY);
        if (savedRole && Object.values(ROLES).includes(savedRole)) {
          setRole(savedRole);
        }
        const savedUsers = {};
        Object.values(ROLES).forEach((roleName) => {
          const savedUserId = localStorage.getItem(`${USER_STORAGE_KEY}${roleName}`);
          if (savedUserId) savedUsers[roleName] = savedUserId;
        });
        setUserIds(savedUsers);
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

  // Select and persist the demo identity for the active role.
  const selectUser = (userId) => {
    if (!role || !DEMO_USER_OPTIONS[role]?.some((item) => item.id === userId)) return;
    setUserIds((current) => ({ ...current, [role]: userId }));
    try {
      localStorage.setItem(`${USER_STORAGE_KEY}${role}`, userId);
    } catch {
      // Ignore storage write errors
    }
  };

  // Get demo user matching the active role
  const options = role ? DEMO_USER_OPTIONS[role] || [DEMO_USERS[role]] : [];
  const user = role ? options.find((item) => item.id === userIds[role]) || options[0] || null : null;

  const value = {
    role,
    user,
    selectRole,
    logout,
    selectUser,
    userOptions: options,
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
