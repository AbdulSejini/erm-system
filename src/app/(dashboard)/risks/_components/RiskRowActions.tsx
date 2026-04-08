'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Eye, MessageSquare, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Compact action menu for a single risk row.
 *
 * Renders the two primary actions inline (View + Discussions, both
 * frequent + non-destructive) and tucks the secondary actions
 * (Edit, Delete) into a click-based "⋮" overflow menu. This drops the
 * visible-button count per row from 4 to 3 and isolates the destructive
 * action behind an extra click.
 *
 * Used by both the risks table view and the cards view footer — the
 * `size` prop picks between the denser 6→8px table layout and the
 * slightly roomier 8px cards layout.
 */
interface RiskRowActionsProps {
  risk: { id: string; commentsCount?: number };
  isAr: boolean;
  onView: () => void;
  onDiscuss: () => void;
  onEdit: () => void;
  onDelete: () => void;
  size?: 'sm' | 'md';
}

export function RiskRowActions({
  risk,
  isAr,
  onView,
  onDiscuss,
  onEdit,
  onDelete,
  size = 'sm',
}: RiskRowActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the overflow menu on outside click OR Escape. Listeners are
  // only attached while the menu is open to keep idle rows cheap.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const iconSize =
    size === 'md' ? 'h-4 w-4' : 'h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4';
  const buttonSize =
    size === 'md' ? 'h-8 w-8' : 'h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8';

  return (
    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
      {/* Primary: View details modal */}
      <Button
        variant="ghost"
        size="icon-sm"
        title={isAr ? 'عرض' : 'View'}
        onClick={onView}
        className={buttonSize}
      >
        <Eye className={iconSize} />
      </Button>

      {/* Primary: Open discussion page (with unread badge) */}
      <Button
        variant="ghost"
        size="icon-sm"
        title={isAr ? 'التفاصيل والنقاش' : 'Details & Discussion'}
        onClick={onDiscuss}
        className={`${buttonSize} text-[var(--primary)] relative`}
      >
        <MessageSquare className={iconSize} />
        {(risk.commentsCount || 0) > 0 && (
          // 10px badge text — fits inside the 14px/16px circular bubble.
          <span className="absolute -top-1 -end-1 flex items-center justify-center min-w-[14px] h-[14px] sm:min-w-[16px] sm:h-[16px] px-0.5 text-[10px] font-bold bg-[#F39200] text-white rounded-full shadow-sm">
            {(risk.commentsCount || 0) > 99 ? '99+' : risk.commentsCount}
          </span>
        )}
      </Button>

      {/* Overflow menu — Edit / Delete (destructive isolated) */}
      <div className="relative" ref={menuRef}>
        <Button
          variant="ghost"
          size="icon-sm"
          title={isAr ? 'المزيد' : 'More'}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={buttonSize}
        >
          <MoreVertical className={iconSize} />
        </Button>
        {open && (
          <div
            role="menu"
            className="absolute end-0 z-20 mt-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg"
          >
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background-secondary)]"
            >
              <Edit className="h-4 w-4" />
              <span>{isAr ? 'تعديل' : 'Edit'}</span>
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-b-lg border-t border-[var(--border)] px-3 py-2 text-sm text-[var(--status-error)] transition-colors hover:bg-[var(--status-error)]/10"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isAr ? 'حذف' : 'Delete'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
