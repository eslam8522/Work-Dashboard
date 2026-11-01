import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/roles';

/**
 * Account dropdown in the navbar. Click the avatar to open it; "Log out" lives inside.
 * Closes on outside click, Escape, or when focus leaves. Arrow keys move between items.
 */
export default function UserMenu() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const items = () => Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (!open) return undefined;

    refreshUser(); // keeps the wallet balance fresh every time the menu opens
    items()[0]?.focus();

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close(true);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close, refreshUser]);

  if (!user) return null;

  const displayName = user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleMenuKeyDown = (e) => {
    const list = items();
    const index = list.indexOf(document.activeElement);
    const move = (next) => {
      e.preventDefault();
      list[(next + list.length) % list.length]?.focus();
    };
    if (e.key === 'ArrowDown') move(index + 1);
    else if (e.key === 'ArrowUp') move(index - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(list.length - 1);
    else if (e.key === 'Tab') close();
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="avatar" aria-hidden="true">{initial}</span>
        <span className="user-menu__name">{displayName}</span>
        <svg className="user-menu__caret" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div id={menuId} className="user-menu__panel" role="menu" aria-label="Account" ref={menuRef} onKeyDown={handleMenuKeyDown}>
          <div className="user-menu__header">
            <span className="avatar avatar--lg" aria-hidden="true">{initial}</span>
            <div className="user-menu__who">
              <span className="user-menu__email" title={user.email}>{user.email}</span>
              <span className="role-chip">{ROLE_LABELS[user.role] ?? user.role}</span>
            </div>
          </div>

          {user.role === 'WORKER' && (
            <div className="user-menu__balance">
              <span>Wallet balance</span>
              <strong>${Number(user.balance ?? 0).toFixed(2)}</strong>
            </div>
          )}

          <button type="button" role="menuitem" className="user-menu__item user-menu__item--danger" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
