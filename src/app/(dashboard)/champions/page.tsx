'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Plus,
  Search,
  Users,
  User,
  Mail,
  Phone,
  Building2,
  Award,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  BookOpen,
  HelpCircle,
  Target,
  BarChart3,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  Shield,
  GraduationCap,
  Briefcase,
  RefreshCw,
  Trophy,
  Flame,
  Zap,
  Crown,
  Medal,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Gift,
  Rocket,
  ThumbsUp,
  Heart,
} from 'lucide-react';

// Champion performance levels
type PerformanceLevel = 'legendary' | 'excellent' | 'good' | 'rising' | 'new';

// API Types
interface APIChampion {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  department: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
  } | null;
  accessibleDepartments: Array<{
    departmentId: string;
    department: {
      id: string;
      nameAr: string;
      nameEn: string;
      code: string;
    };
  }>;
  _count?: {
    ownedRisks: number;
    championedRisks: number;
  };
  // Stats from risks and treatment plans
  risksAssigned?: number;
  risksResolved?: number;
  treatmentPlansActive?: number;
  treatmentPlansCompleted?: number;
  treatmentPlansTotal?: number;
  treatmentPlansOverdue?: number;
}

// Extended champion with competition stats
interface CompetitiveChampion extends APIChampion {
  points: number;
  rank: number;
  streak: number;
  badges: string[];
  weeklyProgress: number;
  monthlyProgress: number;
  level: number;
  xpToNextLevel: number;
  currentXP: number;
}

// Training modules for champions
const trainingModules = [
  {
    id: '1',
    titleAr: 'أساسيات إدارة المخاطر',
    titleEn: 'Risk Management Fundamentals',
    descriptionAr: 'مقدمة شاملة لمبادئ إدارة المخاطر المؤسسية',
    descriptionEn: 'Comprehensive introduction to enterprise risk management principles',
    duration: '4 hours',
    required: true,
  },
  {
    id: '2',
    titleAr: 'تقييم المخاطر المتقدم',
    titleEn: 'Advanced Risk Assessment',
    descriptionAr: 'تقنيات متقدمة لتحديد وتقييم المخاطر',
    descriptionEn: 'Advanced techniques for identifying and assessing risks',
    duration: '6 hours',
    required: false,
  },
  {
    id: '3',
    titleAr: 'استخدام نظام ERM',
    titleEn: 'Using the ERM System',
    descriptionAr: 'دليل عملي لاستخدام نظام إدارة المخاطر',
    descriptionEn: 'Practical guide to using the risk management system',
    duration: '2 hours',
    required: true,
  },
];

// Badge definitions
const badgeDefinitions = {
  firstRisk: {
    nameAr: 'البداية',
    nameEn: 'First Steps',
    icon: '🌟',
    descAr: 'أول خطر تم حله',
    descEn: 'First risk resolved'
  },
  fiveRisks: {
    nameAr: 'المحترف',
    nameEn: 'Professional',
    icon: '⭐',
    descAr: '5 مخاطر تم حلها',
    descEn: '5 risks resolved'
  },
  tenRisks: {
    nameAr: 'الخبير',
    nameEn: 'Expert',
    icon: '🏆',
    descAr: '10 مخاطر تم حلها',
    descEn: '10 risks resolved'
  },
  speedster: {
    nameAr: 'السريع',
    nameEn: 'Speedster',
    icon: '⚡',
    descAr: 'حل 3 مخاطر في أسبوع',
    descEn: '3 risks solved in a week'
  },
  perfectRate: {
    nameAr: 'الكمال',
    nameEn: 'Perfectionist',
    icon: '💎',
    descAr: 'معدل حل 100%',
    descEn: '100% resolution rate'
  },
  teamPlayer: {
    nameAr: 'روح الفريق',
    nameEn: 'Team Player',
    icon: '🤝',
    descAr: 'مسؤول عن أكثر من 3 أقسام',
    descEn: 'Responsible for 3+ departments'
  },
  streak7: {
    nameAr: 'المثابر',
    nameEn: 'Consistent',
    icon: '🔥',
    descAr: '7 أيام متتالية من النشاط',
    descEn: '7 days activity streak'
  },
  topPerformer: {
    nameAr: 'الأفضل',
    nameEn: 'Top Performer',
    icon: '👑',
    descAr: 'أفضل أداء هذا الشهر',
    descEn: 'Best performer this month'
  },
};

// Animated counter hook
const useAnimatedCounter = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
};

export default function ChampionsPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [filterPerformance, setFilterPerformance] = useState<PerformanceLevel | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedChampion, setSelectedChampion] = useState<CompetitiveChampion | null>(null);

  // Data states
  const [champions, setChampions] = useState<APIChampion[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; nameAr: string; nameEn: string; code: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch champions with real performance data from risks and treatment plans
  const fetchChampions = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);

    try {
      // Fetch users with role riskChampion
      const usersRes = await fetch('/api/users?role=riskChampion');
      const usersData = await usersRes.json();

      if (usersData.success) {
        // Fetch risks with treatment plans to calculate real stats
        const risksRes = await fetch('/api/risks?includeTreatments=true&filterByAccess=false');
        const risksData = await risksRes.json();

        const risks = risksData.success ? risksData.data : [];

        // Define risk and treatment interfaces
        interface TreatmentPlan {
          id: string;
          status: string;
          progress: number;
          dueDate?: string;
          responsible?: { id: string };
        }

        interface Risk {
          id: string;
          championId?: string;
          ownerId?: string;
          owner?: { id: string };
          champion?: { id: string };
          status: string;
          treatmentPlans?: TreatmentPlan[];
        }

        // Calculate stats for each champion based on real data
        const championsWithStats = usersData.data.map((user: APIChampion) => {
          // Find risks where user is champion, owner, or risk owner
          const championRisks = risks.filter((r: Risk) =>
            r.championId === user.id ||
            r.ownerId === user.id ||
            r.owner?.id === user.id ||
            r.champion?.id === user.id
          );

          // Count resolved risks
          const resolvedRisks = championRisks.filter((r: Risk) =>
            r.status === 'mitigated' || r.status === 'closed'
          ).length;

          // Count treatment plans where user is responsible or related
          let totalTreatmentPlans = 0;
          let completedTreatmentPlans = 0;
          let activeTreatmentPlans = 0;
          let overdueTreatmentPlans = 0;

          championRisks.forEach((risk: Risk) => {
            if (risk.treatmentPlans && risk.treatmentPlans.length > 0) {
              risk.treatmentPlans.forEach((plan: TreatmentPlan) => {
                // Check if user is responsible for this treatment plan
                const isResponsible = plan.responsible?.id === user.id;

                // Count all treatments for risks owned/championed by user
                totalTreatmentPlans++;

                if (plan.status === 'completed') {
                  completedTreatmentPlans++;
                } else if (plan.status === 'inProgress') {
                  activeTreatmentPlans++;
                }

                // Check if overdue
                if (plan.dueDate && new Date(plan.dueDate) < new Date() && plan.status !== 'completed') {
                  overdueTreatmentPlans++;
                }
              });
            }
          });

          return {
            ...user,
            risksAssigned: championRisks.length,
            risksResolved: resolvedRisks,
            treatmentPlansActive: activeTreatmentPlans,
            treatmentPlansCompleted: completedTreatmentPlans,
            treatmentPlansTotal: totalTreatmentPlans,
            treatmentPlansOverdue: overdueTreatmentPlans,
          };
        });

        setChampions(championsWithStats);
      }
    } catch (error) {
      console.error('Error fetching champions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  useEffect(() => {
    fetchChampions();
    fetchDepartments();
  }, [fetchChampions, fetchDepartments]);

  // Calculate competitive stats for champions with REAL data from risks and treatment plans
  const competitiveChampions: CompetitiveChampion[] = useMemo(() => {
    return champions.map((champion) => {
      const risksAssigned = champion.risksAssigned || 0;
      const risksResolved = champion.risksResolved || 0;
      const treatmentsCompleted = champion.treatmentPlansCompleted || 0;
      const treatmentsActive = champion.treatmentPlansActive || 0;
      const treatmentsTotal = champion.treatmentPlansTotal || 0;
      const treatmentsOverdue = champion.treatmentPlansOverdue || 0;

      // Calculate resolution rates
      const riskResolutionRate = risksAssigned > 0 ? risksResolved / risksAssigned : 0;
      const treatmentCompletionRate = treatmentsTotal > 0 ? treatmentsCompleted / treatmentsTotal : 0;

      const daysActive = Math.floor((Date.now() - new Date(champion.createdAt).getTime()) / (1000 * 60 * 60 * 24));

      // Calculate points based on REAL performance
      // Points system:
      // - 100 points per resolved risk
      // - 50 points per completed treatment plan
      // - 25 points per active treatment plan (work in progress)
      // - Bonus for high resolution rate (up to 100 points)
      // - Bonus for treatment completion rate (up to 100 points)
      // - Penalty for overdue treatments (-20 points each)
      // - Department responsibility bonus (25 per department)

      const riskPoints = risksResolved * 100;
      const treatmentCompletedPoints = treatmentsCompleted * 50;
      const treatmentActivePoints = treatmentsActive * 25;
      const riskRateBonus = Math.round(riskResolutionRate * 100);
      const treatmentRateBonus = Math.round(treatmentCompletionRate * 100);
      const overduePenalty = treatmentsOverdue * 20;
      const departmentBonus = (champion.accessibleDepartments?.length || 0) * 25;

      const totalPoints = Math.max(0,
        riskPoints +
        treatmentCompletedPoints +
        treatmentActivePoints +
        riskRateBonus +
        treatmentRateBonus -
        overduePenalty +
        departmentBonus
      );

      // Calculate level (every 500 points = 1 level)
      const level = Math.floor(totalPoints / 500) + 1;
      const currentXP = totalPoints % 500;
      const xpToNextLevel = 500 - currentXP;

      // Calculate badges based on REAL achievements
      const badges: string[] = [];
      if (risksResolved >= 1) badges.push('firstRisk');
      if (risksResolved >= 5) badges.push('fiveRisks');
      if (risksResolved >= 10) badges.push('tenRisks');
      if (riskResolutionRate === 1 && risksAssigned > 0) badges.push('perfectRate');
      if ((champion.accessibleDepartments?.length || 0) >= 3) badges.push('teamPlayer');
      if (daysActive >= 7) badges.push('streak7');
      // New badges for treatment plans
      if (treatmentsCompleted >= 3) badges.push('speedster'); // Completed 3+ treatments

      // Calculate REAL progress based on actual data
      const weeklyProgress = treatmentsTotal > 0
        ? Math.round(treatmentCompletionRate * 100)
        : (risksAssigned > 0 ? Math.round(riskResolutionRate * 100) : 0);

      const monthlyProgress = risksAssigned > 0
        ? Math.round(((risksResolved + treatmentsCompleted) / (risksAssigned + treatmentsTotal || 1)) * 100)
        : 0;

      return {
        ...champion,
        points: totalPoints,
        rank: 0, // Will be set after sorting
        streak: Math.min(daysActive, 30),
        badges,
        weeklyProgress: Math.min(weeklyProgress, 100),
        monthlyProgress: Math.min(monthlyProgress, 100),
        level,
        xpToNextLevel,
        currentXP,
      };
    })
    .sort((a, b) => b.points - a.points)
    .map((champion, index) => ({
      ...champion,
      rank: index + 1,
    }));
  }, [champions]);

  // Add top performer badge to #1
  const championsWithTopBadge = useMemo(() => {
    return competitiveChampions.map(champion => {
      if (champion.rank === 1 && !champion.badges.includes('topPerformer')) {
        return { ...champion, badges: [...champion.badges, 'topPerformer'] };
      }
      return champion;
    });
  }, [competitiveChampions]);

  const getPerformanceLevel = (champion: CompetitiveChampion): PerformanceLevel => {
    if (champion.rank === 1) return 'legendary';
    if (champion.rank <= 3) return 'excellent';

    const daysActive = Math.floor((Date.now() - new Date(champion.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysActive < 30) return 'new';

    const resolutionRate = champion.risksAssigned && champion.risksAssigned > 0
      ? (champion.risksResolved || 0) / champion.risksAssigned
      : 0;

    if (resolutionRate >= 0.7) return 'excellent';
    if (resolutionRate >= 0.4) return 'good';
    return 'rising';
  };

  const getPerformanceColor = (level: PerformanceLevel) => {
    switch (level) {
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
      case 'excellent':
        return 'bg-gradient-to-r from-emerald-400 to-green-500 text-white';
      case 'good':
        return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white';
      case 'rising':
        return 'bg-gradient-to-r from-orange-400 to-red-500 text-white';
      case 'new':
        return 'bg-gradient-to-r from-purple-400 to-violet-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceLabel = (level: PerformanceLevel) => {
    switch (level) {
      case 'legendary':
        return isAr ? 'أسطوري' : 'Legendary';
      case 'excellent':
        return isAr ? 'ممتاز' : 'Excellent';
      case 'good':
        return isAr ? 'جيد' : 'Good';
      case 'rising':
        return isAr ? 'صاعد' : 'Rising';
      case 'new':
        return isAr ? 'جديد' : 'New';
      default:
        return '';
    }
  };

  const getPerformanceIcon = (level: PerformanceLevel) => {
    switch (level) {
      case 'legendary':
        return <Crown className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'excellent':
        return <Star className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'good':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'rising':
        return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'new':
        return <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return null;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const toggleCardExpand = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  // Get unique departments from champions
  const uniqueDepartments = [...new Set(champions.map((c) =>
    c.department ? (isAr ? c.department.nameAr : c.department.nameEn) : ''
  ).filter(Boolean))];

  const filteredChampions = championsWithTopBadge.filter((champion) => {
    const name = isAr ? champion.fullName : (champion.fullNameEn || champion.fullName);
    const matchesSearch =
      champion.fullName.includes(searchQuery) ||
      (champion.fullNameEn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      champion.email.toLowerCase().includes(searchQuery.toLowerCase());

    const performanceLevel = getPerformanceLevel(champion);
    const matchesPerformance = filterPerformance === 'all' || performanceLevel === filterPerformance;

    const deptName = champion.department
      ? (isAr ? champion.department.nameAr : champion.department.nameEn)
      : '';
    const matchesDepartment = filterDepartment === 'all' || deptName === filterDepartment;

    return matchesSearch && matchesPerformance && matchesDepartment;
  });

  // Stats
  const stats = {
    total: champions.length,
    legendary: championsWithTopBadge.filter((c) => getPerformanceLevel(c) === 'legendary').length,
    excellent: championsWithTopBadge.filter((c) => getPerformanceLevel(c) === 'excellent').length,
    totalPoints: championsWithTopBadge.reduce((sum, c) => sum + c.points, 0),
    totalBadges: championsWithTopBadge.reduce((sum, c) => sum + c.badges.length, 0),
    avgResolutionRate: champions.length > 0
      ? Math.round(
          (champions.reduce((sum, c) => sum + (c.risksResolved || 0), 0) /
            Math.max(champions.reduce((sum, c) => sum + (c.risksAssigned || 0), 0), 1)) *
            100
        )
      : 0,
  };

  // Animated stats
  const animatedTotal = useAnimatedCounter(stats.total, 1000);
  const animatedPoints = useAnimatedCounter(stats.totalPoints, 1500);
  const animatedBadges = useAnimatedCounter(stats.totalBadges, 1200);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative">
            <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4 animate-bounce" />
            <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <p className="text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'جاري تحميل أبطال المخاطر...' : 'Loading Risk Champions...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero Header with Animation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 md:p-8 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Trophy className="h-12 w-12 md:h-16 md:w-16 text-yellow-300 drop-shadow-lg" />
                <Sparkles className="h-5 w-5 text-yellow-200 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  {isAr ? '🏆 أبطال المخاطر' : '🏆 Risk Champions'}
                </h1>
                <p className="mt-1 text-white/80 text-sm md:text-base">
                  {isAr
                    ? 'تنافس، تألق، وكن الأفضل في إدارة المخاطر!'
                    : 'Compete, shine, and be the best in risk management!'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchChampions(true)}
                disabled={isRefreshing}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                {isAr ? 'تحديث' : 'Refresh'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<HelpCircle className="h-4 w-4" />}
                onClick={() => setShowGuideModal(true)}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                {isAr ? 'الدليل' : 'Guide'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<GraduationCap className="h-4 w-4" />}
                onClick={() => setShowTrainingModal(true)}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                {isAr ? 'التدريب' : 'Training'}
              </Button>
            </div>
          </div>

          {/* Quick Stats in Header */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center transform hover:scale-105 transition-transform">
              <Users className="h-6 w-6 mx-auto mb-1 text-white/80" />
              <p className="text-2xl md:text-3xl font-bold">{animatedTotal}</p>
              <p className="text-xs text-white/70">{isAr ? 'إجمالي الأبطال' : 'Total Champions'}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center transform hover:scale-105 transition-transform">
              <Zap className="h-6 w-6 mx-auto mb-1 text-yellow-300" />
              <p className="text-2xl md:text-3xl font-bold">{animatedPoints.toLocaleString()}</p>
              <p className="text-xs text-white/70">{isAr ? 'إجمالي النقاط' : 'Total Points'}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center transform hover:scale-105 transition-transform">
              <Award className="h-6 w-6 mx-auto mb-1 text-yellow-300" />
              <p className="text-2xl md:text-3xl font-bold">{animatedBadges}</p>
              <p className="text-xs text-white/70">{isAr ? 'الشارات المكتسبة' : 'Badges Earned'}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center transform hover:scale-105 transition-transform">
              <Target className="h-6 w-6 mx-auto mb-1 text-white/80" />
              <p className="text-2xl md:text-3xl font-bold">{stats.avgResolutionRate}%</p>
              <p className="text-xs text-white/70">{isAr ? 'معدل الإنجاز' : 'Resolution Rate'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Leaderboard Podium */}
      {championsWithTopBadge.length >= 3 && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-500" />
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  {isAr ? '🏅 لوحة الشرف' : '🏅 Hall of Fame'}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                rightIcon={showLeaderboard ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              >
                {showLeaderboard ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'عرض' : 'Show')}
              </Button>
            </div>
          </div>

          {showLeaderboard && (
            <div className="p-6">
              <div className="flex items-end justify-center gap-4 md:gap-8">
                {/* 2nd Place */}
                <div className="text-center transform hover:scale-105 transition-all duration-300">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-lg mx-auto border-4 border-gray-200">
                      {(isAr ? championsWithTopBadge[1]?.fullName : (championsWithTopBadge[1]?.fullNameEn || championsWithTopBadge[1]?.fullName))?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <span className="text-3xl">🥈</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-t-lg p-3 h-24 flex flex-col justify-end">
                    <p className="font-bold text-sm md:text-base text-[var(--foreground)] truncate max-w-[100px]">
                      {isAr ? championsWithTopBadge[1]?.fullName : (championsWithTopBadge[1]?.fullNameEn || championsWithTopBadge[1]?.fullName)}
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {championsWithTopBadge[1]?.points.toLocaleString()} {isAr ? 'نقطة' : 'pts'}
                    </p>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="text-center transform hover:scale-105 transition-all duration-300">
                  <div className="relative mb-3">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                      <Crown className="h-8 w-8 text-yellow-500 animate-bounce" />
                    </div>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-xl mx-auto border-4 border-yellow-300 ring-4 ring-yellow-200/50">
                      {(isAr ? championsWithTopBadge[0]?.fullName : (championsWithTopBadge[0]?.fullNameEn || championsWithTopBadge[0]?.fullName))?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <span className="text-4xl">🥇</span>
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
                  </div>
                  <div className="bg-gradient-to-t from-yellow-300 to-yellow-200 dark:from-yellow-700 dark:to-yellow-600 rounded-t-lg p-3 h-32 flex flex-col justify-end">
                    <p className="font-bold text-base md:text-lg text-[var(--foreground)] truncate max-w-[120px]">
                      {isAr ? championsWithTopBadge[0]?.fullName : (championsWithTopBadge[0]?.fullNameEn || championsWithTopBadge[0]?.fullName)}
                    </p>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">
                      {championsWithTopBadge[0]?.points.toLocaleString()} {isAr ? 'نقطة' : 'pts'}
                    </p>
                    <div className="flex justify-center gap-1 mt-1">
                      {championsWithTopBadge[0]?.badges.slice(0, 3).map((badge, i) => (
                        <span key={i} className="text-sm" title={isAr ? badgeDefinitions[badge as keyof typeof badgeDefinitions]?.nameAr : badgeDefinitions[badge as keyof typeof badgeDefinitions]?.nameEn}>
                          {badgeDefinitions[badge as keyof typeof badgeDefinitions]?.icon}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="text-center transform hover:scale-105 transition-all duration-300">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-lg mx-auto border-4 border-amber-500">
                      {(isAr ? championsWithTopBadge[2]?.fullName : (championsWithTopBadge[2]?.fullNameEn || championsWithTopBadge[2]?.fullName))?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <span className="text-3xl">🥉</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-800 dark:to-amber-700 rounded-t-lg p-3 h-20 flex flex-col justify-end">
                    <p className="font-bold text-sm md:text-base text-[var(--foreground)] truncate max-w-[100px]">
                      {isAr ? championsWithTopBadge[2]?.fullName : (championsWithTopBadge[2]?.fullNameEn || championsWithTopBadge[2]?.fullName)}
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {championsWithTopBadge[2]?.points.toLocaleString()} {isAr ? 'نقطة' : 'pts'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                placeholder={isAr ? 'ابحث عن بطل...' : 'Search for a champion...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                value={filterPerformance}
                onChange={(e) => setFilterPerformance(e.target.value as PerformanceLevel | 'all')}
              >
                <option value="all">{isAr ? 'جميع المستويات' : 'All Levels'}</option>
                <option value="legendary">{isAr ? 'أسطوري' : 'Legendary'}</option>
                <option value="excellent">{isAr ? 'ممتاز' : 'Excellent'}</option>
                <option value="good">{isAr ? 'جيد' : 'Good'}</option>
                <option value="rising">{isAr ? 'صاعد' : 'Rising'}</option>
                <option value="new">{isAr ? 'جديد' : 'New'}</option>
              </select>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all">{isAr ? 'جميع الأقسام' : 'All Departments'}</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Champions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredChampions.map((champion) => {
          const isExpanded = expandedCards.has(champion.id);
          const performanceLevel = getPerformanceLevel(champion);
          const resolutionRate = champion.risksAssigned && champion.risksAssigned > 0
            ? Math.round((champion.risksResolved || 0) / champion.risksAssigned * 100)
            : 0;

          return (
            <Card
              key={champion.id}
              className={`overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                champion.rank <= 3 ? 'ring-2 ring-amber-400/50' : ''
              }`}
            >
              <div className="p-4">
                {/* Header with Rank */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      {getRankIcon(champion.rank)}
                    </div>
                    {/* Avatar */}
                    <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ${
                      champion.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                      champion.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      champion.rank === 3 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                      'bg-gradient-to-br from-blue-400 to-indigo-500'
                    }`}>
                      {(isAr ? champion.fullName : (champion.fullNameEn || champion.fullName)).charAt(0)}
                      {/* Level badge */}
                      <div className="absolute -bottom-1 -right-1 bg-[var(--primary)] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                        {champion.level}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[var(--foreground)] truncate">
                        {isAr ? champion.fullName : (champion.fullNameEn || champion.fullName)}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-[var(--foreground-secondary)]">
                        <Zap className="h-3 w-3 text-amber-500" />
                        <span className="font-semibold text-amber-600">{champion.points.toLocaleString()}</span>
                        <span>{isAr ? 'نقطة' : 'pts'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getPerformanceColor(performanceLevel)}`}>
                    {getPerformanceIcon(performanceLevel)}
                    <span>{getPerformanceLabel(performanceLevel)}</span>
                  </span>
                </div>

                {/* XP Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--foreground-secondary)]">
                      {isAr ? `المستوى ${champion.level}` : `Level ${champion.level}`}
                    </span>
                    <span className="text-[var(--foreground-secondary)]">
                      {champion.currentXP} / 500 XP
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(champion.currentXP / 500) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Badges */}
                {champion.badges.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1">
                    {champion.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1 bg-[var(--background-secondary)] rounded-full px-2 py-1 text-xs"
                        title={isAr ? badgeDefinitions[badge as keyof typeof badgeDefinitions]?.descAr : badgeDefinitions[badge as keyof typeof badgeDefinitions]?.descEn}
                      >
                        <span>{badgeDefinitions[badge as keyof typeof badgeDefinitions]?.icon}</span>
                        <span className="text-[var(--foreground-secondary)]">
                          {isAr ? badgeDefinitions[badge as keyof typeof badgeDefinitions]?.nameAr : badgeDefinitions[badge as keyof typeof badgeDefinitions]?.nameEn}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Department */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {champion.department && (
                    <Badge variant="default">
                      <Building2 className="me-1 h-3 w-3" />
                      {isAr ? champion.department.nameAr : champion.department.nameEn}
                    </Badge>
                  )}
                  {champion.accessibleDepartments && champion.accessibleDepartments.length > 0 && (
                    <Badge variant="success">
                      +{champion.accessibleDepartments.length} {isAr ? 'أقسام' : 'depts'}
                    </Badge>
                  )}
                </div>

                {/* Stats Grid - Risks */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[var(--background-secondary)] rounded-lg p-2 text-center">
                    <p className="text-xl font-bold text-[var(--foreground)]">{champion.risksAssigned || 0}</p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'مخاطر مُسندة' : 'Risks'}
                    </p>
                  </div>
                  <div className="bg-[var(--background-secondary)] rounded-lg p-2 text-center">
                    <p className={`text-xl font-bold ${resolutionRate >= 70 ? 'text-emerald-500' : resolutionRate >= 40 ? 'text-blue-500' : 'text-orange-500'}`}>
                      {resolutionRate}%
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'معدل الإنجاز' : 'Resolution'}
                    </p>
                  </div>
                </div>

                {/* Stats Grid - Treatment Plans */}
                {(champion.treatmentPlansTotal || 0) > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{champion.treatmentPlansActive || 0}</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                        {isAr ? 'خطط نشطة' : 'Active'}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{champion.treatmentPlansCompleted || 0}</p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                        {isAr ? 'مكتملة' : 'Done'}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2 text-center ${(champion.treatmentPlansOverdue || 0) > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-900/20'}`}>
                      <p className={`text-lg font-bold ${(champion.treatmentPlansOverdue || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                        {champion.treatmentPlansOverdue || 0}
                      </p>
                      <p className={`text-xs ${(champion.treatmentPlansOverdue || 0) > 0 ? 'text-red-600/70 dark:text-red-400/70' : 'text-gray-500/70'}`}>
                        {isAr ? 'متأخرة' : 'Overdue'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--foreground-secondary)]">
                      {isAr ? 'المخاطر المحلولة' : 'Risks Resolved'}
                    </span>
                    <span className="font-medium">
                      {champion.risksResolved || 0}/{champion.risksAssigned || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        resolutionRate >= 70 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                        resolutionRate >= 40 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                        'bg-gradient-to-r from-orange-400 to-amber-500'
                      }`}
                      style={{ width: `${resolutionRate}%` }}
                    />
                  </div>
                </div>

                {/* Streak & Join Date */}
                <div className="flex items-center justify-between text-xs text-[var(--foreground-secondary)] mb-4">
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>{champion.streak} {isAr ? 'يوم نشاط' : 'day streak'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(champion.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" title={isAr ? 'عرض الملف' : 'View Profile'}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title={isAr ? 'إرسال رسالة' : 'Send Message'}>
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title={isAr ? 'تشجيع' : 'Cheer'}>
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpand(champion.id)}
                    rightIcon={isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  >
                    {isExpanded ? (isAr ? 'أقل' : 'Less') : (isAr ? 'المزيد' : 'More')}
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-[var(--border)] bg-[var(--background-secondary)] p-4 space-y-4">
                  {/* Contact Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                      {isAr ? 'معلومات الاتصال' : 'Contact Information'}
                    </h4>
                    <div className="space-y-1 text-sm text-[var(--foreground-secondary)]">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{champion.email}</span>
                      </div>
                      {champion.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{champion.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accessible Departments */}
                  {champion.accessibleDepartments && champion.accessibleDepartments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                        {isAr ? 'الأقسام المسؤول عنها' : 'Responsible Departments'}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {champion.accessibleDepartments.map((access) => (
                          <Badge key={access.departmentId} variant="default" size="sm">
                            {isAr ? access.department.nameAr : access.department.nameEn}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Challenge */}
                  <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        {isAr ? 'تحدي الأسبوع' : 'Weekly Challenge'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-purple-600 dark:text-purple-400">
                        {isAr ? 'حل 5 مخاطر هذا الأسبوع' : 'Resolve 5 risks this week'}
                      </span>
                      <span className="font-medium text-purple-700 dark:text-purple-300">
                        {Math.min(champion.risksResolved || 0, 5)}/5
                      </span>
                    </div>
                    <div className="h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        style={{ width: `${Math.min(((champion.risksResolved || 0) / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredChampions.length === 0 && (
        <Card className="p-8 text-center">
          <Trophy className="mx-auto h-16 w-16 text-amber-300" />
          <h3 className="mt-4 font-bold text-lg text-[var(--foreground)]">
            {isAr ? 'لا يوجد أبطال' : 'No Champions Found'}
          </h3>
          <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'لم يتم العثور على أبطال مخاطر. يمكنك إضافة أبطال من صفحة الإعدادات > المستخدمين'
              : 'No risk champions found. You can add champions from Settings > Users'}
          </p>
        </Card>
      )}

      {/* Training Program Modal */}
      <Modal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        title={isAr ? '🎓 برنامج تدريب الأبطال' : '🎓 Champion Training Program'}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'أكمل التدريب لكسب شارات إضافية ونقاط مكافأة!'
              : 'Complete training to earn bonus badges and points!'}
          </p>

          {trainingModules.map((module) => (
            <div
              key={module.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[var(--foreground)]">
                        {isAr ? module.titleAr : module.titleEn}
                      </h4>
                      {module.required && (
                        <Badge variant="danger" size="sm">
                          {isAr ? 'إلزامي' : 'Required'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                      {isAr ? module.descriptionAr : module.descriptionEn}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {module.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        +100 {isAr ? 'نقطة' : 'pts'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ModalFooter>
          <Button onClick={() => setShowTrainingModal(false)}>
            {isAr ? 'إغلاق' : 'Close'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Champion Guide Modal */}
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title={isAr ? '📖 دليل بطل المخاطر' : '📖 Risk Champion Guide'}
        size="lg"
      >
        <div className="space-y-6">
          {/* How to Earn Points */}
          <div className="rounded-lg border border-[var(--border)] bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-[var(--foreground)]">
              <Zap className="h-5 w-5 text-amber-500" />
              {isAr ? 'كيف تكسب النقاط؟' : 'How to Earn Points?'}
            </h4>
            <ul className="space-y-2 text-sm text-[var(--foreground-secondary)]">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{isAr ? 'حل مخطر = 100 نقطة' : 'Resolve a risk = 100 pts'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{isAr ? 'إكمال خطة معالجة = 50 نقطة' : 'Complete treatment plan = 50 pts'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{isAr ? 'خطة معالجة نشطة = 25 نقطة' : 'Active treatment plan = 25 pts'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{isAr ? 'معدل إنجاز عالي = حتى 100 نقطة مكافأة' : 'High completion rate = up to 100 bonus pts'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{isAr ? 'كل قسم إضافي = 25 نقطة' : 'Each additional dept = 25 pts'}</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>{isAr ? 'خطة متأخرة = -20 نقطة' : 'Overdue plan = -20 pts'}</span>
              </li>
            </ul>
          </div>

          {/* Badges */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-[var(--foreground)]">
              <Award className="h-5 w-5 text-purple-500" />
              {isAr ? 'الشارات المتاحة' : 'Available Badges'}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(badgeDefinitions).map(([key, badge]) => (
                <div key={key} className="flex items-center gap-2 rounded-lg bg-[var(--background)] p-2">
                  <span className="text-xl">{badge.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {isAr ? badge.nameAr : badge.nameEn}
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? badge.descAr : badge.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-[var(--foreground)]">
              <Shield className="h-5 w-5 text-blue-500" />
              {isAr ? 'مسؤوليات البطل' : 'Champion Responsibilities'}
            </h4>
            <ul className="space-y-2 text-sm text-[var(--foreground-secondary)]">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <span>{isAr ? 'تحديد وتسجيل المخاطر في إدارته' : 'Identify and register risks in their department'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <span>{isAr ? 'تقييم المخاطر وتحديد مستوى الخطورة' : 'Assess risks and determine severity levels'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <span>{isAr ? 'إعداد ومتابعة خطط المعالجة' : 'Develop and monitor treatment plans'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <span>{isAr ? 'رفع التقارير الدورية لإدارة المخاطر' : 'Submit periodic reports to risk management'}</span>
              </li>
            </ul>
          </div>
        </div>
        <ModalFooter>
          <Button onClick={() => setShowGuideModal(false)}>
            {isAr ? 'فهمت!' : 'Got it!'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
