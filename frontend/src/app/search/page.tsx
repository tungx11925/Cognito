"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  Users,
  HelpCircle,
  Share2,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  X,
  User,
  Heart,
  Bookmark,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { searchApi, SearchParams, SearchSuggestion } from '@/services/search.service';
import { Navbar } from '@/components/landing/Navbar';
import { useStudy } from '@/context/StudyContext';

const TABS = [
  { id: 'all', label: 'Tất cả', icon: Sparkles },
  { id: 'documents', label: 'Tài liệu', icon: FileText },
  { id: 'community', label: 'Cộng đồng', icon: Share2 },
  { id: 'question_sets', label: 'Bộ đề thi', icon: HelpCircle },
  { id: 'profiles', label: 'Người dùng', icon: Users },
] as const;

const CATEGORIES = [
  'all',
  'Toán học',
  'Hóa học',
  'Vật lý',
  'Ngoại ngữ',
  'Công nghệ thông tin',
  'Kinh tế',
  'Sinh học',
  'Lịch sử',
  'Khác'
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeUser, isAuthenticated } = useStudy();

  const initialQ = searchParams.get('q') || '';
  const initialTab = (searchParams.get('tab') as any) || 'all';

  const [queryText, setQueryText] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'latest' | 'popular'>('relevance');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [onlyMine, setOnlyMine] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Sync state with URL params
  useEffect(() => {
    const qFromUrl = searchParams.get('q') || '';
    const tabFromUrl = searchParams.get('tab') || 'all';
    setQueryText(qFromUrl);
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // Fetch search results
  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await searchApi.search({
        q: queryText.trim(),
        tab: activeTab as any,
        category: selectedCategory,
        sort: sortBy,
        page: currentPage,
        limit: 15,
        onlyMine: onlyMine,
      });

      if (res && res.success && res.data) {
        setSearchData(res.data);
      } else {
        setErrorMsg(res?.error || 'Không thể tìm nạp kết quả tìm kiếm.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [queryText, activeTab, selectedCategory, sortBy, currentPage, onlyMine]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // Suggestions debounced fetch
  useEffect(() => {
    if (!queryText || queryText.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchApi.getSuggestions(queryText);
        if (res && res.success && Array.isArray(res.data)) {
          setSuggestions(res.data);
        }
      } catch (e) {
        // ignore suggestions error
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [queryText]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', queryText.trim());
    params.set('tab', activeTab);
    router.push(`/search?${params.toString()}`);
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    if (queryText.trim()) params.set('q', queryText.trim());
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#090D16] text-stone-900 dark:text-white">
      <Navbar
        isLoggedIn={!!isAuthenticated}
        onSignInClick={() => router.push('/home')}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Search Header & Input Box */}
        <section className="mb-8">
          <div className="max-w-3xl mx-auto text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
              Tìm kiếm Tri thức & Cộng đồng
            </h1>
            <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-gray-400">
              Tra cứu nhanh tài liệu học tập, bộ đề ôn thi, tài nguyên chia sẻ và bạn cùng lớp.
            </p>
          </div>

          <div className="relative max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-stone-400 dark:text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => {
                    setQueryText(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Nhập từ khóa tìm kiếm (có dấu hoặc không dấu)..."
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-900/90 border border-stone-200 dark:border-gray-700/80 rounded-2xl text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm dark:shadow-xl backdrop-blur-md"
                />
                {queryText && (
                  <button
                    type="button"
                    onClick={() => {
                      setQueryText('');
                      setSuggestions([]);
                    }}
                    className="absolute right-4 p-1 text-stone-400 dark:text-gray-400 hover:text-stone-800 dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900/95 border border-stone-200 dark:border-gray-700/80 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-lg"
                >
                  <div className="p-2 text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider px-3 border-b border-stone-100 dark:border-gray-800">
                    Gợi ý tìm kiếm
                  </div>
                  <div className="py-1">
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQueryText(item.text);
                          setShowSuggestions(false);
                          setCurrentPage(1);
                          const params = new URLSearchParams(searchParams.toString());
                          params.set('q', item.text);
                          params.set('tab', activeTab);
                          router.push(`/search?${params.toString()}`);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-stone-50 dark:hover:bg-gray-800/80 flex items-center justify-between text-sm text-stone-800 dark:text-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Search className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          <span>{item.text}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-gray-800 text-stone-600 dark:text-gray-400 border border-stone-200 dark:border-gray-700">
                          {item.type === 'document' ? 'Tài liệu' : item.type === 'community' ? 'Cộng đồng' : 'Bộ đề'}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 border-b border-stone-200 dark:border-gray-800 pb-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-white dark:bg-gray-900/60 text-stone-600 dark:text-gray-400 border border-stone-200 dark:border-transparent hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {searchData?.counts?.[tab.id] !== undefined && (
                  <span className={`text-xs px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-stone-100 dark:bg-gray-800 text-stone-600 dark:text-gray-400'
                  }`}>
                    {searchData.counts[tab.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters and Controls Bar */}
        {activeTab !== 'all' && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-gray-900/40 p-3 rounded-2xl border border-stone-200 dark:border-gray-800/80 shadow-xs">
            <div className="flex items-center gap-3">
              {activeTab === 'documents' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 dark:text-gray-400">Danh mục:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-stone-50 dark:bg-gray-800 border border-stone-200 dark:border-gray-700 text-xs text-stone-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'Tất cả danh mục' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'documents' && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600 dark:text-gray-300 ml-2">
                  <input
                    type="checkbox"
                    checked={onlyMine}
                    onChange={(e) => {
                      setOnlyMine(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded bg-stone-100 dark:bg-gray-800 border-stone-300 dark:border-gray-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Chỉ tài liệu của tôi</span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-gray-400">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-stone-50 dark:bg-gray-800 border border-stone-200 dark:border-gray-700 text-xs text-stone-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="relevance">Phù hợp nhất</option>
                <option value="latest">Mới nhất</option>
                {activeTab === 'community' && <option value="popular">Phổ biến nhất</option>}
              </select>
            </div>
          </div>
        )}

        {/* Results Container */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-stone-100 dark:bg-gray-900/60 rounded-2xl border border-stone-200 dark:border-gray-800 animate-pulse p-5 flex flex-col justify-between">
                <div className="h-5 bg-stone-200 dark:bg-gray-800 rounded-md w-3/4 mb-3" />
                <div className="h-4 bg-stone-200/60 dark:bg-gray-800/60 rounded-md w-full mb-2" />
                <div className="h-4 bg-stone-200/40 dark:bg-gray-800/40 rounded-md w-1/2" />
                <div className="h-8 bg-stone-200/80 dark:bg-gray-800/80 rounded-xl w-full mt-4" />
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="text-center py-16 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-3xl p-8">
            <p className="text-red-600 dark:text-red-400 font-medium mb-3">{errorMsg}</p>
            <button
              onClick={executeSearch}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div>
            {/* TAB = ALL: Aggregated Sections */}
            {activeTab === 'all' && (
              <div className="space-y-10">
                {/* Section: Documents */}
                {searchData?.results?.documents?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        <h2 className="text-lg font-bold text-stone-900 dark:text-white">Tài liệu học tập</h2>
                        <span className="text-xs text-stone-400 dark:text-gray-500">({searchData.counts.documents})</span>
                      </div>
                      <button
                        onClick={() => handleSelectTab('documents')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 font-medium"
                      >
                        Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchData.results.documents.map((doc: any) => (
                        <DocumentCard key={doc.id} doc={doc} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Community */}
                {searchData?.results?.community?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        <h2 className="text-lg font-bold text-stone-900 dark:text-white">Tài nguyên Cộng đồng</h2>
                        <span className="text-xs text-stone-400 dark:text-gray-500">({searchData.counts.community})</span>
                      </div>
                      <button
                        onClick={() => handleSelectTab('community')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 font-medium"
                      >
                        Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchData.results.community.map((comm: any) => (
                        <CommunityCard key={comm.id} comm={comm} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Question Sets */}
                {searchData?.results?.question_sets?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                        <h2 className="text-lg font-bold text-stone-900 dark:text-white">Bộ đề thi & Ôn tập</h2>
                        <span className="text-xs text-stone-400 dark:text-gray-500">({searchData.counts.question_sets})</span>
                      </div>
                      <button
                        onClick={() => handleSelectTab('question_sets')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 font-medium"
                      >
                        Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchData.results.question_sets.map((qs: any) => (
                        <QuestionSetCard key={qs.id} qs={qs} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Profiles */}
                {searchData?.results?.profiles?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                        <h2 className="text-lg font-bold text-stone-900 dark:text-white">Người dùng & Bạn bè</h2>
                        <span className="text-xs text-stone-400 dark:text-gray-500">({searchData.counts.profiles})</span>
                      </div>
                      <button
                        onClick={() => handleSelectTab('profiles')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 font-medium"
                      >
                        Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchData.results.profiles.map((prof: any) => (
                        <ProfileCard key={prof.id} prof={prof} />
                      ))}
                    </div>
                  </div>
                )}

                {/* If all sections are empty */}
                {searchData?.total === 0 && (
                  <EmptyResultsState q={queryText} />
                )}
              </div>
            )}

            {/* TAB = SPECIFIC CATEGORY */}
            {activeTab !== 'all' && (
              <div>
                {searchData?.items?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeTab === 'documents' && searchData.items.map((doc: any) => (
                      <DocumentCard key={doc.id} doc={doc} />
                    ))}
                    {activeTab === 'community' && searchData.items.map((comm: any) => (
                      <CommunityCard key={comm.id} comm={comm} />
                    ))}
                    {activeTab === 'question_sets' && searchData.items.map((qs: any) => (
                      <QuestionSetCard key={qs.id} qs={qs} />
                    ))}
                    {activeTab === 'profiles' && searchData.items.map((prof: any) => (
                      <ProfileCard key={prof.id} prof={prof} />
                    ))}
                  </div>
                ) : (
                  <EmptyResultsState q={queryText} />
                )}

                {/* Pagination Controls */}
                {searchData?.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-stone-600 dark:text-gray-400">
                      Trang <span className="text-stone-900 dark:text-white font-bold">{currentPage}</span> / {searchData.totalPages}
                    </span>
                    <button
                      disabled={currentPage >= searchData.totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(searchData.totalPages, p + 1))}
                      className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-card Components ──────────────────────────────────────────

function DocumentCard({ doc }: { doc: any }) {
  return (
    <div className="bg-white dark:bg-gray-900/60 hover:bg-stone-50 dark:hover:bg-gray-900/90 border border-stone-200 dark:border-gray-800/80 hover:border-blue-500/40 rounded-2xl p-5 transition-all shadow-sm hover:shadow-blue-500/10 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
            {doc.category || 'Tài liệu'}
          </span>
          <span className="text-xs text-stone-400 dark:text-gray-500">
            {doc.file_type ? doc.file_type.toUpperCase().replace('APPLICATION/', '') : 'PDF'}
          </span>
        </div>
        <h3 className="font-bold text-stone-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1.5 text-base">
          {doc.title}
        </h3>
        <p className="text-xs text-stone-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
          {doc.description || 'Không có mô tả chi tiết cho tài liệu này.'}
        </p>
      </div>

      <div className="pt-3 border-t border-stone-100 dark:border-gray-800/60 flex items-center justify-between text-xs text-stone-500 dark:text-gray-500">
        <span>Bởi: {doc.author_name}</span>
        <Link
          href={`/viewer/${doc.id}`}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium flex items-center gap-1"
        >
          Xem tài liệu <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function CommunityCard({ comm }: { comm: any }) {
  return (
    <div className="bg-white dark:bg-gray-900/60 hover:bg-stone-50 dark:hover:bg-gray-900/90 border border-stone-200 dark:border-gray-800/80 hover:border-emerald-500/40 rounded-2xl p-5 transition-all shadow-sm hover:shadow-emerald-500/10 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
            Cộng đồng
          </span>
          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500 dark:text-rose-400" /> {comm.like_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-amber-500 dark:text-amber-400" /> {comm.save_count || 0}
            </span>
          </div>
        </div>
        <h3 className="font-bold text-stone-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1.5 text-base">
          {comm.title}
        </h3>
        <p className="text-xs text-stone-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
          {comm.description || 'Tài nguyên được chia sẻ bởi thành viên cộng đồng Cognito.'}
        </p>
      </div>

      <div className="pt-3 border-t border-stone-100 dark:border-gray-800/60 flex items-center justify-between text-xs text-stone-500 dark:text-gray-500">
        <span>Bởi: {comm.author_name}</span>
        <Link
          href={`/community?resourceId=${comm.id}`}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium flex items-center gap-1"
        >
          Khám phá <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function QuestionSetCard({ qs }: { qs: any }) {
  return (
    <div className="bg-white dark:bg-gray-900/60 hover:bg-stone-50 dark:hover:bg-gray-900/90 border border-stone-200 dark:border-gray-800/80 hover:border-amber-500/40 rounded-2xl p-5 transition-all shadow-sm hover:shadow-amber-500/10 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
            {qs.total_questions || 10} câu hỏi
          </span>
          <span className="text-xs text-stone-400 dark:text-gray-500">Thang điểm: {qs.total_score || 10}</span>
        </div>
        <h3 className="font-bold text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1.5 text-base">
          {qs.name}
        </h3>
        <p className="text-xs text-stone-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
          Bộ đề kiểm tra ôn luyện kiến thức phân bậc Bloom với AI chấm điểm tự động.
        </p>
      </div>

      <div className="pt-3 border-t border-stone-100 dark:border-gray-800/60 flex items-center justify-between text-xs text-stone-500 dark:text-gray-500">
        <span>Tạo bởi: {qs.author_name || 'Hệ thống'}</span>
        <Link
          href={`/quiz?testSetId=${qs.id}`}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-medium flex items-center gap-1"
        >
          Làm bài ngay <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function ProfileCard({ prof }: { prof: any }) {
  return (
    <div className="bg-white dark:bg-gray-900/60 hover:bg-stone-50 dark:hover:bg-gray-900/90 border border-stone-200 dark:border-gray-800/80 hover:border-purple-500/40 rounded-2xl p-5 transition-all shadow-sm hover:shadow-purple-500/10 flex flex-col justify-between group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-lg overflow-hidden border border-purple-400/30">
          {prof.avatar_url ? (
            <img src={prof.avatar_url} alt={prof.name} className="w-full h-full object-cover" />
          ) : (
            prof.name?.charAt(0) || 'U'
          )}
        </div>
        <div>
          <h3 className="font-bold text-stone-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-base line-clamp-1">
            {prof.name}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium border border-purple-500/20">
            {prof.role === 'admin' ? 'Quản trị viên' : prof.role === 'premium' ? 'Hội viên Pro' : 'Học viên'}
          </span>
        </div>
      </div>

      <p className="text-xs text-stone-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
        {prof.bio || 'Chưa cập nhật phần giới thiệu bản thân.'}
      </p>

      <div className="pt-3 border-t border-stone-100 dark:border-gray-800/60 flex items-center justify-between text-xs text-stone-500 dark:text-gray-500">
        <span>{prof.public_resources_count || 0} tài nguyên chia sẻ</span>
        <Link
          href={`/profile/${prof.id}`}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-medium flex items-center gap-1"
        >
          Xem hồ sơ <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function EmptyResultsState({ q }: { q: string }) {
  return (
    <div className="text-center py-16 px-4 bg-white dark:bg-gray-900/30 rounded-3xl border border-stone-200 dark:border-gray-800/50 shadow-xs">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-100 dark:bg-gray-800/80 flex items-center justify-center text-stone-400 dark:text-gray-500">
        <Search className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">Không tìm thấy kết quả phù hợp</h3>
      <p className="text-sm text-stone-600 dark:text-gray-400 max-w-md mx-auto">
        {q
          ? `Không tìm thấy tài nguyên nào khớp với từ khóa "${q}". Hãy thử tìm kiếm không dấu hoặc từ khóa ngắn gọn hơn.`
          : 'Hãy nhập từ khóa vào thanh tìm kiếm phía trên để bắt đầu khám phá.'}
      </p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#090D16] flex items-center justify-center text-stone-500 dark:text-gray-400">
        Đang tải trang tìm kiếm...
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
