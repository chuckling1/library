import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import './UserMenu.scss';

export const UserMenu: React.FC = (): React.JSX.Element => {
  const { userEmail, logout } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleMenu = (): void => {
    setIsOpen(prev => !prev);
  };

  const handleLogout = async (): Promise<void> => {
    logger.info('User initiated logout from UserMenu', {
      appLayer: 'Frontend-UI',
      sourceContext: 'UserMenu',
      functionName: 'handleLogout',
      payload: { userEmail },
    });

    try {
      // SECURITY ENHANCEMENT: Handle async logout for httpOnly cookie clearing (Phase 2)
      await logout();
      setIsOpen(false);
    } catch (error) {
      logger.error('Logout failed in UserMenu', {
        appLayer: 'Frontend-UI',
        sourceContext: 'UserMenu',
        functionName: 'handleLogout',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      // Still close menu even if logout fails
      setIsOpen(false);
    }
  };

  // Get the first letter of email for avatar
  const getAvatarLetter = (email: string | null): string => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  if (!userEmail) {
    return <div className="user-menu-placeholder"></div>;
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={handleToggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="user-avatar">{getAvatarLetter(userEmail)}</div>
        <span className="user-email">{userEmail}</span>
        <svg
          className={`user-menu-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 8L2 4h8L6 8z" />
        </svg>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <div className="user-email-display">{userEmail}</div>
          </div>
          <div className="user-menu-divider"></div>
          <button
            className="user-menu-item logout-button"
            onClick={() => void handleLogout()}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10 2V0H2v16h8v-2H4V2h6z" />
              <path d="M12 5l-1.41 1.41L12.17 8H6v2h6.17l-1.58 1.59L12 13l4-4-4-4z" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
