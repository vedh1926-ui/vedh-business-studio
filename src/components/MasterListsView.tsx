'use client';

import React, { useState } from 'react';
import { MasterListGroup } from '@/lib/types';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ListChecks,
  RotateCcw,
  FolderPlus,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react';

interface MasterListsViewProps {
  masterLists: MasterListGroup[];
  onAddItem: (groupId: string, label: string) => void;
  onEditItem: (groupId: string, itemId: string, newLabel: string) => void;
  onToggleItem: (groupId: string, itemId: string) => void;
  onDeleteItem: (groupId: string, itemId: string) => void;
  onAddGroup: (name: string, description: string, usedIn: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onResetDefaults: () => void;
}

export default function MasterListsView({
  masterLists,
  onAddItem,
  onEditItem,
  onToggleItem,
  onDeleteItem,
  onAddGroup,
  onDeleteGroup,
  onResetDefaults,
}: MasterListsViewProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    masterLists[0]?.id || 'ml-category'
  );
  const [newItemLabel, setNewItemLabel] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // New Custom Group Modal State
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupModules, setNewGroupModules] = useState('Orders, Inventory, Reports');

  const activeGroup =
    masterLists.find((g) => g.id === selectedGroupId) || masterLists[0];

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !newItemLabel.trim()) return;
    onAddItem(activeGroup.id, newItemLabel.trim());
    setNewItemLabel('');
  };

  const startEdit = (itemId: string, currentLabel: string) => {
    setEditingItemId(itemId);
    setEditingValue(currentLabel);
  };

  const saveEdit = (groupId: string, itemId: string) => {
    if (editingValue.trim()) {
      onEditItem(groupId, itemId, editingValue.trim());
    }
    setEditingItemId(null);
    setEditingValue('');
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const usedInArr = newGroupModules
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onAddGroup(
      newGroupName.trim(),
      newGroupDesc.trim() || 'Custom conditional dropdown list for studio tracking.',
      usedInArr.length > 0 ? usedInArr : ['Reports']
    );
    setNewGroupName('');
    setNewGroupDesc('');
    setShowNewGroupModal(false);
  };

  const filteredItems = activeGroup
    ? activeGroup.items.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8F243C] mb-1">
            <ListChecks size={14} className="text-[#C69C31]" />
            <span>Studio Parameters &amp; Conditional Dropdowns</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2C181B]">
            Master Lists
          </h2>
          <p className="text-xs text-[#7A6E6E]">
            Central lookup tables powering dropdowns across Orders, Inventory, Expenses, Payments &amp; Reports.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResetDefaults}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-[#D9C9B4] text-xs font-medium text-[#635B5B] bg-[#FAF6F0] hover:bg-[#F2EBE0] transition"
            title="Restore default Excel lookup lists"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => setShowNewGroupModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold tracking-wide transition shadow-sm"
          >
            <FolderPlus size={15} />
            <span>+ New List Table</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left = Master List Tables, Right = Items Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: All Parameter Groups */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="bg-white border border-[#E8DDCF] rounded-2xl p-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8F243C] px-2 pb-2 border-b border-[#F2EBE0] mb-2 flex items-center justify-between">
              <span>Parameter Tables ({masterLists.length})</span>
              <span className="text-[#7A6E6E] font-normal">Select to edit</span>
            </div>

            <div className="space-y-1.5">
              {masterLists.map((group) => {
                const isSelected = activeGroup?.id === group.id;
                const activeCount = group.items.filter((i) => i.isActive).length;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setEditingItemId(null);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#541523] text-white border-[#541523] shadow-md'
                        : 'bg-[#FCFAF7] text-[#2C181B] border-[#E8DDCF] hover:bg-[#FAF0E6]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold flex items-center space-x-2">
                        <span>{group.name}</span>
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? 'text-[#F3E3B5]' : 'text-[#7A6E6E]'
                        }`}
                      >
                        Used in: {group.usedIn.join(', ')}
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-[#3D0E18] text-[#D4AF37] border border-[#D4AF37]/40'
                          : 'bg-[#F2EBE0] text-[#541523]'
                      }`}
                    >
                      {activeCount}/{group.items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Selected Master List Table Editor */}
        {activeGroup && (
          <div className="lg:col-span-8 bg-white border border-[#E8DDCF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              {/* Table Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#F2EBE0]">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif text-xl font-bold text-[#2C181B]">
                      {activeGroup.name}
                    </h3>
                    <span className="text-[10px] font-mono bg-[#FAF0E6] text-[#8F243C] px-2 py-0.5 rounded border border-[#EBDCCB]">
                      {activeGroup.items.length} values
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6E6E] mt-1">
                    {activeGroup.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {activeGroup.usedIn.map((mod) => (
                      <span
                        key={mod}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        Syncs with {mod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Allow deleting custom-added tables */}
                {!activeGroup.id.startsWith('ml-') && (
                  <button
                    onClick={() => onDeleteGroup(activeGroup.id)}
                    className="text-xs text-rose-700 hover:underline font-medium flex items-center space-x-1"
                  >
                    <Trash2 size={13} />
                    <span>Delete Table</span>
                  </button>
                )}
              </div>

              {/* Quick Add Form + Search */}
              <div className="my-5 flex flex-col sm:flex-row gap-3">
                <form
                  onSubmit={handleAddItemSubmit}
                  className="flex-1 flex items-center space-x-2"
                >
                  <input
                    type="text"
                    required
                    placeholder={`Add new "${activeGroup.name}" value...`}
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    className="flex-1 px-3.5 py-2 border rounded-xl border-[#D9C9B4] text-xs focus:outline-none focus:ring-1 focus:ring-[#541523] bg-[#FCFAF7]"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#541523] hover:bg-[#6E1C30] text-white text-xs font-semibold transition shrink-0"
                  >
                    <Plus size={14} />
                    <span>Add Value</span>
                  </button>
                </form>

                {activeGroup.items.length > 6 && (
                  <div className="relative w-full sm:w-48">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D7D]"
                    />
                    <input
                      type="text"
                      placeholder="Filter values..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border rounded-xl border-[#E8DDCF] text-xs focus:outline-none focus:ring-1 focus:ring-[#541523]"
                    />
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="border border-[#E8DDCF] rounded-xl overflow-hidden divide-y divide-[#F2EBE0]">
                {filteredItems.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#8C7D7D]">
                    No values found. Add a new option above!
                  </div>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isEditing = editingItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`px-4 py-3 flex items-center justify-between gap-3 transition ${
                          item.isActive
                            ? 'bg-white hover:bg-[#FAF6F0]/60'
                            : 'bg-stone-50 opacity-65'
                        }`}
                      >
                        {/* Left: Index & Label / Edit Input */}
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-[11px] font-mono text-[#8C7D7D] w-6">
                            #{idx + 1}
                          </span>

                          {isEditing ? (
                            <div className="flex items-center space-x-2 flex-1 max-w-sm">
                              <input
                                type="text"
                                autoFocus
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit(activeGroup.id, item.id);
                                  if (e.key === 'Escape') setEditingItemId(null);
                                }}
                                className="flex-1 px-2.5 py-1 border rounded-md border-[#541523] text-xs focus:outline-none"
                              />
                              <button
                                onClick={() => saveEdit(activeGroup.id, item.id)}
                                className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                                title="Save"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1 text-stone-400 hover:bg-stone-100 rounded"
                                title="Cancel"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`text-sm font-medium truncate ${
                                item.isActive
                                  ? 'text-[#2C181B]'
                                  : 'line-through text-[#8C7D7D]'
                              }`}
                            >
                              {item.label}
                            </span>
                          )}
                        </div>

                        {/* Right: Active Badge & Actions (Toggle, Edit, Delete) */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              item.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Hidden'}
                          </span>

                          <button
                            onClick={() => onToggleItem(activeGroup.id, item.id)}
                            className="p-1.5 text-[#635B5B] hover:text-[#541523] hover:bg-[#FAF0E6] rounded-md transition"
                            title={
                              item.isActive
                                ? 'Hide from dropdowns (keeps historical reports intact)'
                                : 'Show in dropdowns'
                            }
                          >
                            {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>

                          <button
                            onClick={() => startEdit(item.id, item.label)}
                            className="p-1.5 text-[#635B5B] hover:text-[#541523] hover:bg-[#FAF0E6] rounded-md transition"
                            title="Rename value"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => onDeleteItem(activeGroup.id, item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                            title="Delete value permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#F2EBE0] text-[11px] text-[#7A6E6E] flex items-center justify-between">
              <span>
                Tip: Hiding an option removes it from new dropdowns without breaking past order/expense reports.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add New List Table Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E8DDCF] shadow-2xl overflow-hidden">
            <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#2C181B]">
                Create New Master List Table
              </h3>
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Table / Parameter Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Courier Partner, Occasion Type, GST Slab"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Where and how this list will be used for reports..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div>
                <label className="block text-[#423A3A] font-semibold mb-1">
                  Used In Sections (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Orders, Reports"
                  value={newGroupModules}
                  onChange={(e) => setNewGroupModules(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[#D9C9B4] focus:outline-none focus:ring-1 focus:ring-[#541523]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#F2EBE0]">
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(false)}
                  className="px-4 py-2 border border-[#D9C9B4] rounded-lg text-[#635B5B] hover:bg-[#FAF6F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#541523] text-white rounded-lg font-semibold hover:bg-[#6E1C30]"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
