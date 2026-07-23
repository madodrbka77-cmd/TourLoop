import React, { useMemo, useRef, useState, useEffect } from 'react';
import { 
  Search, Plus, Globe, Lock, Users, ExternalLink, MoreHorizontal, Pin, 
  PinOff, Bell, BellOff, Trash2, LogOut, Flag, Link as LinkIcon
} from 'lucide-react';
import { Group } from '../../data/groupsData';
import { useLanguage } from '../../context/LanguageContext';

type TabType = 'all' | 'admin' | 'member' | 'discover';

interface GroupListProps {
  groups: Group[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  activeTab: TabType;
  setActiveTab: (val: TabType) => void;
  onJoinGroup: (id: string, e: React.MouseEvent) => void;
  onVisitGroup: (group: Group) => void;
  onMenuAction: (action: any, id: string) => void;
  onCreateGroupClick: () => void;
}

const GroupList: React.FC<GroupListProps> = ({
  groups, searchTerm, setSearchTerm, activeTab, setActiveTab, 
  onJoinGroup, onVisitGroup, onMenuAction, onCreateGroupClick
}) => {
  const { t, dir } = useLanguage();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and Sort Groups
  const filteredGroups = useMemo(() => {
      let result = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (activeTab === 'admin') {
          result = result.filter(g => g.role === 'admin');
      } else if (activeTab === 'member') {
          result = result.filter(g => g.role === 'member' || g.role === 'moderator');
      } else if (activeTab === 'discover') {
          result = result.filter(g => !g.isJoined);
      } else {
          result = result.filter(g => g.isJoined);
      }
      
      // Sort: Pinned first
      return result.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [groups, searchTerm, activeTab]);

  return (
    <div className="animate-fadeIn w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                {t.groups_title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t.groups_discover} {t.nav_groups} • {t.groups_managed_groups}
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64 w-full group">
               <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 group-focus-within:text-fb-blue transition-colors" />
               <input 
                 type="text" 
                 placeholder={t.groups_search_placeholder} 
                 className="w-full bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 focus:bg-white dark:focus:bg-gray-900 border border-transparent focus:border-fb-blue rounded-full py-2.5 px-10 text-sm transition-all outline-none text-gray-900 dark:text-white shadow-sm focus:shadow-md"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <button 
                onClick={onCreateGroupClick}
                className="bg-fb-blue text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
                <Plus className="w-5 h-5" />
                {t.groups_create_group}
            </button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex items-center gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto no-scrollbar touch-pan-x">
          {[ 
             { id: 'all', label: t.common_all },
             { id: 'admin', label: t.groups_managed_groups },
             { id: 'member', label: t.groups_joined_groups },
             { id: 'discover', label: t.groups_discover }
          ].map((tab) => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200 relative select-none ${
                      activeTab === tab.id 
                      ? 'border-green-700 dark:border-green-500 text-green-700 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-600 hover:border-blue-700 dark:hover:border-blue-600 bg-green-50/50 dark:bg-green-900/10'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 rounded-t-lg hover:text-blue-700 dark:hover:text-blue-600'
                  }`}
              >
                  {tab.label}
                  {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-fb-blue rounded-full animate-scaleIn"></span>
                  )}
              </button>
          ))}
      </div>

      {/* Groups Grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
           {filteredGroups.map(group => (
             <div key={group.id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden flex flex-col group hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-300 relative transform hover:-translate-y-1">
                
                {/* Pinned Badge */}
                {group.isPinned && (
                    <div className={`absolute top-3 ${dir === 'rtl' ? 'left-3' : 'right-3'} z-10 bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-full shadow-md text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700 backdrop-blur-sm border border-gray-100 dark:border-gray-600`}
                     title={t.groups_pinned_group}>

                        <Pin className="w-3.5 h-3.5 fill-current" />
                    </div>
                )}

                {/* Card Cover */}
                <div className="h-36 overflow-hidden relative bg-gray-100 dark:bg-gray-700 cursor-pointer group-hover:opacity-95 transition" onClick={() => onVisitGroup(group)}>
                   <img 
                        src={group.coverUrl} 
                        alt={group.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                        loading="lazy"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60"></div>
                   
                   {/* Privacy Badge on Cover */}
                   <div className={`absolute bottom-3 ${dir === 'rtl' ? 'left-3' : 'right-3'} text-white flex items-center gap-2`}>
                       <div className="flex items-center gap-1.5 text-xs font-bold bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                           {group.privacy === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                           <span>{group.privacy === 'public' ? t.groups_public_group : t.groups_private_group}</span>
                       </div>
                   </div>
                </div>
                
                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1">
                   <div className="flex justify-between items-start mb-3">
                      <div className="w-full">
                          <h3 
                            className="font-bold text-gray-900 dark:text-white text-lg hover:text-fb-blue cursor-pointer transition line-clamp-1 mb-1" 
                            onClick={() => onVisitGroup(group)}
                            title={group.name}
                          >
                              {group.name}
                          </h3>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">
                              {!group.isJoined ? t.common_unknown : group.role === 'admin' ? t.common_admin : t.common_member}
                          </span>
                      </div>
                   </div>
                   
                   <div className="flex items-center flex-wrap gap-3 text-xs font-medium text-gray-500 dark:text-gray-400 mb-5">
                       <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                           <Users className="w-3.5 h-3.5" /> 
                           {group.membersCount} {t.groups_member_count}
                       </span>
                       {group.lastActive && (
                           <span className="flex items-center gap-1.5">
                               <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                               {t.common_online} {group.lastActive}
                           </span>
                       )}
                   </div>
                   
                   {/* Actions Footer */}
                   <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                      {!group.isJoined ? (
                          <button 
                            onClick={(e) => onJoinGroup(group.id, e)} 
                            className="flex-1 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700 font-bold py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            {t.groups_join}
                          </button>
                      ) : (
                          <button 
                            onClick={() => onVisitGroup(group)}
                            className="flex-1 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700 font-bold py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {t.common_visit}
                          </button>
                      )}
                      
                      {group.isJoined && (
                          <div className="relative" ref={activeMenuId === group.id ? menuRef : null}>
                              <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === group.id ? null : group.id);
                                }}
                                className={`p-2.5 rounded-lg transition-all duration-200 border border-transparent ${activeMenuId === group.id ? 'bg-blue-50 dark:bg-blue-900/30 text-fb-blue border-blue-100 dark:border-blue-900' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'}`}
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>

                              {activeMenuId === group.id && (
                                  <div className={`absolute bottom-full mb-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fadeIn origin-bottom-left ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
                                      <button onClick={() => { onMenuAction('pin', group.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition">
                                          {group.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                          {group.isPinned ? t.groups_unpin_group : t.groups_pin_group}
                                      </button>
                                      
                                      <button onClick={() => { onMenuAction('notification', group.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition">
                                          {group.notifications ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                          {group.notifications ? t.post_turn_off_notif : t.post_turn_on_notif}
                                      </button>
                                      
                                      <button onClick={() => { onMenuAction('copy', group.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition">
                                          <LinkIcon className="w-4 h-4" /> {t.groups_copy_link}
                                      </button>

                                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                                      {group.role === 'admin' ? (
                                          <button onClick={() => { onMenuAction('delete', group.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium transition">
                                              <Trash2 className="w-4 h-4" /> {t.groups_delete_confirm_title}
                                          </button>
                                      ) : (
                                          <>
                                              <button onClick={() => { onMenuAction('leave', group.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium transition">
                                                  <LogOut className="w-4 h-4" /> {t.groups_leave}
                                              </button>
                                              <button onClick={() => { onMenuAction('report', group.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition">
                                                  <Flag className="w-4 h-4" /> {t.common_report}
                                              </button>
                                          </>
                                      )}
                                  </div>
                              )}
                          </div>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400 flex flex-col items-center animate-fadeIn bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 mx-auto max-w-lg">
           <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-full mb-4 ring-8 ring-gray-50 dark:ring-gray-700/20">
               <Users className="w-12 h-12 text-gray-400 dark:text-gray-500" />
           </div>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.common_no_results}</h3>
           <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6 leading-relaxed">
               {t.groups_search_placeholder}
           </p>
           {activeTab !== 'all' && (
               <button 
                   onClick={() => { setActiveTab('all'); setSearchTerm(''); }} 
                   className="bg-fb-blue text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all duration-200"
               >
                   {t.common_view_all}
               </button>
           )}
        </div>
      )}
    </div>
  );
};

export default GroupList;