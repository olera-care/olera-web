"use client";

import { useState } from "react";
import Link from "next/link";

/* ─── Types ─── */
interface SavedCaregiver {
  id: string;
  name: string;
  photo: string;
  university: string;
  rate: number;
  rating: number;
  reviewCount: number;
  badges: string[];
}

interface CareList {
  id: string;
  name: string;
  caregivers: SavedCaregiver[];
  createdAt: string;
}

/* ─── Mock Data ─── */
const MOCK_LISTS: CareList[] = [
  {
    id: "list-1",
    name: "Mom's Care",
    caregivers: [
      { id: "1", name: "Maria S.", photo: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600", university: "University of Houston", rate: 20, rating: 4.9, reviewCount: 47, badges: ["Dementia Specialist"] },
      { id: "3", name: "Aisha J.", photo: "https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=600", university: "Prairie View A&M", rate: 17, rating: 4.7, reviewCount: 28, badges: ["Companion Care"] },
      { id: "5", name: "Emily R.", photo: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600", university: "Rice University", rate: 22, rating: 4.8, reviewCount: 19, badges: ["Background Checked"] },
    ],
    createdAt: "Apr 15, 2026",
  },
  {
    id: "list-2",
    name: "Dad's Care",
    caregivers: [
      { id: "2", name: "David L.", photo: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600", university: "Texas A&M", rate: 18, rating: 4.8, reviewCount: 32, badges: ["Mobility Support"] },
    ],
    createdAt: "May 2, 2026",
  },
];

export default function SavedPage() {
  const [lists, setLists] = useState<CareList[]>(MOCK_LISTS);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const selectedList = lists.find((l) => l.id === selectedListId) || null;

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const newList: CareList = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      caregivers: [],
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setLists((prev) => [...prev, newList]);
    setNewListName("");
    setShowCreateModal(false);
  };

  const handleDeleteList = (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    if (selectedListId === listId) setSelectedListId(null);
    setDeleteConfirm(null);
  };

  const handleRemoveCaregiver = (listId: string, caregiverId: string) => {
    setLists((prev) => prev.map((l) => l.id === listId ? { ...l, caregivers: l.caregivers.filter((c) => c.id !== caregiverId) } : l));
  };

  return (
    <div className="min-h-screen bg-vanilla-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/care-shifts" className="text-text-sm text-gray-400 hover:text-gray-600 transition-colors">Find Care</Link>
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              <span className="text-text-sm text-gray-600 font-medium">Saved</span>
            </div>
            <h1 className="text-display-sm font-semibold text-gray-900">Your saved lists</h1>
            <p className="text-text-md text-gray-500 mt-1">Organize caregivers you&apos;re considering for your loved ones</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create new list
          </button>
        </div>

        {/* List view vs detail view */}
        {selectedList ? (
          /* ── Detail view: show caregivers in a list ── */
          <div>
            <button
              onClick={() => setSelectedListId(null)}
              className="flex items-center gap-1.5 text-text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
              Back to lists
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
              </div>
              <div>
                <h2 className="text-display-xs font-semibold text-gray-900">{selectedList.name}</h2>
                <p className="text-text-sm text-gray-400">{selectedList.caregivers.length} saved &middot; Created {selectedList.createdAt}</p>
              </div>
            </div>

            {selectedList.caregivers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                </div>
                <h3 className="text-text-lg font-semibold text-gray-900 mb-1">No caregivers saved yet</h3>
                <p className="text-text-sm text-gray-500 mb-4">Browse caregivers and save them to this list</p>
                <Link href="/care-shifts" className="text-text-sm font-semibold text-primary-600 hover:text-primary-700">
                  Browse caregivers
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedList.caregivers.map((cg) => (
                  <div key={cg.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
                    <img src={cg.photo} alt={cg.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-text-md font-semibold text-gray-900">{cg.name}</h3>
                        <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                      </div>
                      <p className="text-text-sm text-gray-500">{cg.university}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-warning-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                          {cg.rating} ({cg.reviewCount})
                        </span>
                        <span className="text-text-xs text-gray-400">${cg.rate}/hr</span>
                        {cg.badges[0] && <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{cg.badges[0]}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/care-shifts?profile=${cg.id}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-text-xs font-semibold hover:bg-primary-700 transition-colors"
                      >
                        View profile
                      </Link>
                      <button
                        onClick={() => handleRemoveCaregiver(selectedList.id, cg.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from list"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Grid view: show all lists ── */
          <div>
            {lists.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                </div>
                <h3 className="text-text-lg font-semibold text-gray-900 mb-1">No lists yet</h3>
                <p className="text-text-sm text-gray-500 mb-5">Create a list to start saving caregivers you like</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl text-text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  Create your first list
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className="group bg-white rounded-2xl border border-gray-200 p-8 text-left hover:shadow-lg hover:border-primary-200 transition-all relative"
                  >
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(list.id); }}
                      className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>

                    {/* Photo stack */}
                    <div className="flex items-center justify-center mb-5">
                      {list.caregivers.length > 0 ? (
                        <div className="flex -space-x-4">
                          {list.caregivers.slice(0, 3).map((cg, i) => (
                            <img
                              key={cg.id}
                              src={cg.photo}
                              alt={cg.name}
                              className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-sm"
                              style={{ zIndex: 3 - i }}
                            />
                          ))}
                          {list.caregivers.length > 3 && (
                            <div className="w-16 h-16 rounded-full bg-gray-100 border-3 border-white flex items-center justify-center text-text-sm font-semibold text-gray-500">
                              +{list.caregivers.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                          <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                        </div>
                      )}
                    </div>

                    <h3 className="text-text-lg font-semibold text-gray-900 text-center">{list.name}</h3>
                    <p className="text-text-sm text-gray-400 text-center mt-1">{list.caregivers.length} saved &middot; Created {list.createdAt}</p>
                  </button>
                ))}

                {/* Create new list card */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center hover:border-primary-300 hover:bg-primary-25 transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                  <p className="text-text-md font-semibold text-primary-600">Create new list</p>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create List Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onPointerDown={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-fadeIn" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-lg font-semibold text-gray-900">Create new list</h3>
              <button type="button" onPointerDown={() => setShowCreateModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="text-text-sm font-medium text-gray-700 mb-2 block">List name</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. Mom's Care"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-text-md text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateList(); }}
              />
            </div>

            <button
              onClick={handleCreateList}
              disabled={!newListName.trim()}
              className={`w-full py-3 rounded-xl text-text-sm font-semibold transition-colors ${
                newListName.trim()
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Create list
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (() => {
        const list = lists.find((l) => l.id === deleteConfirm);
        if (!list) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onPointerDown={() => setDeleteConfirm(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-fadeIn" onPointerDown={(e) => e.stopPropagation()}>
              <h3 className="text-text-lg font-semibold text-gray-900 mb-2">Delete &quot;{list.name}&quot;?</h3>
              <p className="text-text-sm text-gray-500 mb-6">This will remove the list and all {list.caregivers.length} saved caregivers in it. This can&apos;t be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl text-text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDeleteList(list.id)} className="flex-1 py-2.5 rounded-xl text-text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                  Delete list
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
