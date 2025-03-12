'use client'

import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PlusIcon from '@/components/icons/PlusIcon'
import BackIcon from '@/components/icons/BackIcon'
import { CheckLists } from '@prisma/client'

const ChecklistsPage = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [checklists, setChecklists] = useState<CheckLists[]>([])
  const [selectedFilter, setSelectedFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ログインユーザー情報
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) {
        router.push('/login')
        return
      }
      setUser(user)
      fetchChecklists(user.id, selectedFilter)
    };

    checkUser()
  }, [router, selectedFilter])


  // チェックリスト取得
  const fetchChecklists = async (userId: string, filter: string) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase.from('checklist').select('*, checkListItems(count)').eq('userId', userId)

      // フィルター適用
      if(filter === 'active') {
        query = query.is('archivedAt', null).eq('isTemplate', false);
      } else if (filter === 'completed') {
        query = query.is('archivedAt', null).eq('status', 'Completed');
      } else if (filter === 'templates') {
        query = query.eq('isTemplate', true);
      } else if (filter === 'archived') {
        query = query.not('archivedAt', 'is', null);
      }

      // 検索クエリ適用
      if(searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%, siteName.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query.order('createdAt', { ascending: false})

      if (error) {
        throw error
      }

      setChecklists(data || [])
    } catch (error) {
      console.error('Error fetching checklists:', error);
      setError('チェックリストの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }


  // 新規チェックリスト作成ページへ
  const handleCreateNew = () => {
    router.push('/checklists/new')
  }

  // チェックリスト詳細ページへ
  const handleViewChecklist = (id: number) => {
    router.push(`/checklists/${id}`)
  }


  // フィルタータブ
  const filterTabs = [
    { id: 'all', label: 'すべて' },
    { id: 'active', label: '進行中' },
    { id: 'completed', label: '完了'},
    { id: 'templates', label: 'テンプレート' },
    { id: 'archived', label: 'アーカイブ' }
  ]

return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button onClick={() => router.push('/')}>
              <BackIcon />
            </button>
            <h1 className="text-xl font-bold">チェックリスト一覧</h1>
          </div>
          <button onClick={handleCreateNew} className="bg-white bg-opacity-20 p-2 rounded-lg">
            <PlusIcon />
          </button>
        </div>

        {/* 検索フォーム */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索..."
            className="w-full px-3 py-2 pl-10 bg-white bg-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </header>

      {/* フィルタータブ */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto p-2 space-x-2">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${
                selectedFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="p-4 pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : checklists.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 mb-4">チェックリストがありません</p>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center"
            >
              <PlusIcon />
              <span className="ml-2">新規作成</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {checklists.map((checklist) => (
              <div
                key={checklist.id}
                onClick={() => handleViewChecklist(checklist.id)}
                className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{checklist.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    checklist.status === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : checklist.archivedAt
                        ? 'bg-gray-100 text-gray-800'
                        : checklist.isTemplate
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                  }`}>
                    {checklist.archivedAt
                      ? 'アーカイブ'
                      : checklist.isTemplate
                        ? 'テンプレート'
                        : checklist.status === 'Completed'
                          ? '完了'
                          : '進行中'
                    }
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {checklist.siteName || '現場名なし'}
                  {checklist.workDate && ` • ${new Date(checklist.workDate).toLocaleDateString()}`}
                </p>

                {/* プログレスバー（テンプレート以外） */}
                {!checklist.isTemplate && (
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${
                            checklist.completed_count && checklist.item_count
                              ? (checklist.completed_count / checklist.item_count) * 100
                              : 0
                          }%`
                        }}
                      ></div>
                    </div>
                    <span className="ml-4 text-sm text-gray-600">
                      {checklist.completed_count || 0}/{checklist.item_count || 0}
                    </span>
                  </div>
                )}

                {/* テンプレートの場合はアイテム数を表示 */}
                {checklist.isTemplate && (
                  <div className="flex justify-end text-sm text-gray-500">
                    {checklist.checkListItems[0].count || 0} アイテム
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

export default ChecklistsPage
