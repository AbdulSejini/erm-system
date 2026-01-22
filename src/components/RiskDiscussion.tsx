'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import {
  MessageSquare,
  Send,
  Reply,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Loader2,
} from 'lucide-react';

interface CommentAuthor {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  role: string;
  avatar: string | null;
}

interface Comment {
  id: string;
  content: string;
  type: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  parentId: string | null;
  replies?: Comment[];
}

interface RiskDiscussionProps {
  riskId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function RiskDiscussion({ riskId, currentUserId, currentUserRole }: RiskDiscussionProps) {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canCreateInternal = ['admin', 'riskManager', 'riskAnalyst'].includes(currentUserRole);

  // جلب التعليقات
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/risks/${riskId}/comments`);
      const result = await response.json();

      if (result.success) {
        setComments(result.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [riskId]);

  // إرسال تعليق جديد
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/risks/${riskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          isInternal,
          parentId: replyTo,
          type: replyTo ? 'reply' : 'comment',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNewComment('');
        setReplyTo(null);
        setIsInternal(false);
        fetchComments();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // تحديث تعليق
  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/risks/${riskId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      const result = await response.json();

      if (result.success) {
        setEditingId(null);
        setEditContent('');
        fetchComments();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // حذف تعليق
  const handleDelete = async (commentId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا التعليق؟' : 'Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/risks/${riskId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchComments();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // الحصول على لون الدور
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'riskManager':
        return 'bg-blue-100 text-blue-700';
      case 'riskAnalyst':
        return 'bg-cyan-100 text-cyan-700';
      case 'riskChampion':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // الحصول على اسم الدور
  const getRoleName = (role: string) => {
    const roles: Record<string, { ar: string; en: string }> = {
      admin: { ar: 'مسؤول', en: 'Admin' },
      riskManager: { ar: 'مدير المخاطر', en: 'Risk Manager' },
      riskAnalyst: { ar: 'محلل المخاطر', en: 'Risk Analyst' },
      riskChampion: { ar: 'رائد المخاطر', en: 'Risk Champion' },
      executive: { ar: 'تنفيذي', en: 'Executive' },
      employee: { ar: 'موظف', en: 'Employee' },
    };
    return isAr ? roles[role]?.ar || role : roles[role]?.en || role;
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isAr ? 'الآن' : 'Just now';
    if (diffMins < 60) return isAr ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;

    return date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // عرض تعليق واحد
  const renderComment = (comment: Comment, isReply = false) => {
    const canEdit = comment.author.id === currentUserId || ['admin', 'riskManager'].includes(currentUserRole);
    const isEditing = editingId === comment.id;

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ms-8 border-s-2 border-[var(--border)] ps-4' : ''} ${
          comment.isInternal ? 'bg-amber-50 border border-amber-200 rounded-xl p-4' : ''
        }`}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.author.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                <span className="text-[var(--primary)] font-semibold">
                  {(isAr ? comment.author.fullName : comment.author.fullNameEn || comment.author.fullName).charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[var(--foreground)]">
                  {isAr ? comment.author.fullName : comment.author.fullNameEn || comment.author.fullName}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(comment.author.role)}`}>
                  {getRoleName(comment.author.role)}
                </span>
                {comment.isInternal && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {isAr ? 'داخلي' : 'Internal'}
                  </span>
                )}
                <span className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(comment.createdAt)}
                </span>
              </div>

              {/* Actions Menu */}
              {canEdit && !isEditing && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenuId(showMenuId === comment.id ? null : comment.id)}
                    className="p-1 hover:bg-[var(--background-tertiary)] rounded"
                  >
                    <MoreVertical className="h-4 w-4 text-[var(--foreground-muted)]" />
                  </button>

                  {showMenuId === comment.id && (
                    <div className="absolute end-0 top-full mt-1 bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)] py-1 z-10 min-w-[120px]">
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                          setShowMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-start text-sm hover:bg-[var(--background-tertiary)] flex items-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        {isAr ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(comment.id);
                          setShowMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-start text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isAr ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment Content */}
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--card)]"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(comment.id)}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? 'حفظ' : 'Save')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[var(--foreground)] whitespace-pre-wrap">{comment.content}</p>
            )}

            {/* Reply Button */}
            {!isReply && !isEditing && (
              <button
                onClick={() => {
                  setReplyTo(comment.id);
                  textareaRef.current?.focus();
                }}
                className="mt-2 text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <Reply className="h-4 w-4" />
                {isAr ? 'رد' : 'Reply'}
              </button>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--background-tertiary)]">
        <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[var(--primary)]" />
          {isAr ? 'المحادثات والتعليقات' : 'Discussions & Comments'}
          <span className="text-sm font-normal text-[var(--foreground-muted)]">
            ({comments.length})
          </span>
        </h3>
      </div>

      {/* Comments List */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-[var(--foreground-muted)]">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{isAr ? 'لا توجد تعليقات بعد' : 'No comments yet'}</p>
            <p className="text-sm">{isAr ? 'كن أول من يعلق!' : 'Be the first to comment!'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}
      </div>

      {/* Reply Indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            {isAr ? 'الرد على تعليق...' : 'Replying to a comment...'}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-blue-700 hover:text-blue-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)]">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
              <User className="h-5 w-5 text-[var(--primary)]" />
            </div>
          </div>

          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAr ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
              className="w-full p-3 border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--card)]"
              rows={3}
            />

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4">
                {canCreateInternal && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span className="text-[var(--foreground-secondary)]">
                      {isAr ? 'تعليق داخلي (لإدارة المخاطر فقط)' : 'Internal (Risk Management only)'}
                    </span>
                  </label>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting || !newComment.trim()}
                leftIcon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              >
                {isAr ? 'إرسال' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
