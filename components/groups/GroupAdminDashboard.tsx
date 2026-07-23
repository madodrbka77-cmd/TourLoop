import React, { useState } from 'react';
import { 
  Activity, UserPlus, Flag, FileText, Settings, Users, Grid, 
  Shield, Bell, Check, X, CheckCircle, Trash2, Loader2, Clock
} from 'lucide-react';
import { Group } from '../../data/groupsData';
import { Post, User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface GroupAdminDashboardProps {
  viewingGroup: Group;
  currentUser: User;
  groupPosts: Post[];
  adminRequests: any[];
  adminReports: any[];
  adminLogs: any[];
  requirePostApproval: boolean;
  setRequirePostApproval: (val: boolean) => void;
  adminNotifications: boolean;
  setAdminNotifications: (val: boolean) => void;
  onApproveRequest: (id: string, name: string) => void;
  onRejectRequest: (id: string, name: string) => void;
  onResolveReport: (id: string, action: 'keep' | 'delete') => void;
  onEditGroup: () => void;
  showLocalNotification: (msg: string, type?: 'success' | 'info') => void;
  logAction: (action: string) => void;
}

const GroupAdminDashboard: React.FC<GroupAdminDashboardProps> = ({
  viewingGroup,
  currentUser,
  groupPosts,
  adminRequests,
  adminReports,
  adminLogs,
  requirePostApproval,
  setRequirePostApproval,
  adminNotifications,
  setAdminNotifications,
  onApproveRequest,
  onRejectRequest,
  onResolveReport,
  onEditGroup,
  showLocalNotification,
  logAction
}) => {
  const { t, dir } = useLanguage();
  const [activeSection, setActiveSection] = useState<'overview' | 'requests' | 'reports' | 'logs'>('overview');

  // Helper to manage dynamic classes based on direction
  const isRtl = dir === 'rtl';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fadeIn">
        
        {/* Admin Sidebar Navigation */}
        <div className="md:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:sticky md:top-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg border-b border-gray-100 dark:border-gray-700 pb-2 hidden md:block">
                    {t.groups_admin_dashboard}
                </h3>
                
                {/* Responsive Menu: Horizontal Scroll on Mobile, Vertical on Desktop */}
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                    <button 
                        onClick={() => setActiveSection('overview')}
                        className={`whitespace-nowrap flex-shrink-0 w-auto md:w-full text-start px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all duration-200 ${
                            activeSection === 'overview' 
                            ? 'bg-fb-blue text-white shadow-md transform scale-105 md:scale-100' 
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Activity className="w-4 h-4" /> {t.groups_overview}
                    </button>
                    
                    <button 
                        onClick={() => setActiveSection('requests')}
                        className={`whitespace-nowrap flex-shrink-0 w-auto md:w-full text-start px-4 py-2.5 rounded-lg font-bold text-sm flex justify-between items-center gap-3 transition-all duration-200 ${
                            activeSection === 'requests' 
                            ? 'bg-fb-blue text-white shadow-md transform scale-105 md:scale-100' 
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> {t.groups_pending_requests}</span>
                        {adminRequests.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm min-w-[20px] text-center">
                                {adminRequests.length}
                            </span>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => setActiveSection('reports')}
                        className={`whitespace-nowrap flex-shrink-0 w-auto md:w-full text-start px-4 py-2.5 rounded-lg font-bold text-sm flex justify-between items-center gap-3 transition-all duration-200 ${
                            activeSection === 'reports' 
                            ? 'bg-fb-blue text-white shadow-md transform scale-105 md:scale-100' 
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <span className="flex items-center gap-2"><Flag className="w-4 h-4" /> {t.groups_reports}</span>
                        {adminReports.length > 0 && (
                            <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm min-w-[20px] text-center">
                                {adminReports.length}
                            </span>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => setActiveSection('logs')}
                        className={`whitespace-nowrap flex-shrink-0 w-auto md:w-full text-start px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all duration-200 ${
                            activeSection === 'logs' 
                            ? 'bg-fb-blue text-white shadow-md transform scale-105 md:scale-100' 
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <FileText className="w-4 h-4" /> {t.groups_activity_log}
                    </button>
                    
                    <button 
                        onClick={onEditGroup}
                        className="whitespace-nowrap flex-shrink-0 w-auto md:w-full text-start px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Settings className="w-4 h-4" /> {t.groups_edit_group}
                    </button>
                </div>
            </div>
        </div>

        {/* Admin Content Area */}
        <div className="md:col-span-3 space-y-6 min-h-[400px]">
            
            {/* OVERVIEW SECTION */}
            {activeSection === 'overview' && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center hover:shadow-md transition dark:shadow-none">
                            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full mb-2 text-red-500 hover:text-blue-700 dark:text-red-400 dark:hover:text-blue-700 shadow-sm"><Users className="w-6 h-6" /></div>
                            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{viewingGroup.membersCount}</span>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.groups_total_members}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center hover:shadow-md transition dark:shadow-none">
                            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full mb-2 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700 shadow-sm"><Grid className="w-6 h-6" /></div>
                            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{groupPosts.length}</span>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.groups_posts_this_month}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center hover:shadow-md transition dark:shadow-none">
                            <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-full mb-2 text-orange-600 hover:text-blue-700 dark:text-orange-400 dark:hover:text-blue-700 shadow-sm"><UserPlus className="w-6 h-6" /></div>
                            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{adminRequests.length}</span>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.groups_pending_count}</span>
                        </div>
                    </div>

                    {/* Quick Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            {t.groups_quick_settings}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-full text-purple-600"><Shield className="w-5 h-5" /></div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900 dark:text-white">{t.groups_post_approval}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.groups_post_approval_hint}</div>
                                    </div>
                                </div>
                                <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
                                    <input 
                                        type="checkbox" 
                                        checked={requirePostApproval}
                                        onChange={() => {
                                            const newState = !requirePostApproval;
                                            setRequirePostApproval(newState);
                                            logAction(newState ? t.common_update : t.common_update);
                                            showLocalNotification(t.common_success, 'info');
                                        }}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 dark:border-gray-600 checked:right-0 checked:border-green-500 transition-all"
                                        style={{ right: requirePostApproval ? (isRtl ? 'auto' : '0') : (isRtl ? '0' : 'auto'), left: requirePostApproval ? (isRtl ? '0' : 'auto') : (isRtl ? 'auto' : '0') }}
                                    />
                                    <div className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${requirePostApproval ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-full text-fb-blue"><Bell className="w-5 h-5" /></div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900 dark:text-white">{t.groups_admin_notifs}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.groups_admin_notifs_hint}</div>
                                    </div>
                                </div>
                                <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
                                    <input 
                                        type="checkbox" 
                                        checked={adminNotifications}
                                        onChange={() => {
                                            const newState = !adminNotifications;
                                            setAdminNotifications(newState);
                                            showLocalNotification(t.common_success, 'info');
                                        }}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 dark:border-gray-600 checked:right-0 checked:border-green-500 transition-all"
                                        style={{ right: adminNotifications ? (isRtl ? 'auto' : '0') : (isRtl ? '0' : 'auto'), left: adminNotifications ? (isRtl ? '0' : 'auto') : (isRtl ? 'auto' : '0') }}
                                    />
                                    <div className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${adminNotifications ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REQUESTS SECTION */}
            {activeSection === 'requests' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fadeIn min-h-[400px]">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            <UserPlus className="w-6 h-6 text-fb-blue" />
                            {t.groups_pending_requests}
                        </h3>
                        <span className="bg-fb-blue/10 dark:bg-fb-blue/20 text-fb-blue px-3 py-1 rounded-full text-sm font-bold">
                            {adminRequests.length} {t.common_members || 'Members'}
                        </span>
                    </div>
                    
                    {adminRequests.length > 0 ? (
                        <div className="space-y-4">
                            {adminRequests.map((req) => (
                                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition duration-300">
                                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                        <div className="relative">
                                            <img src={req.avatar} alt="user" className="w-14 h-14 rounded-full border-2 border-white dark:border-gray-600 object-cover shadow-sm" />
                                            <div className="absolute bottom-0 right-0 bg-fb-blue text-white rounded-full p-1 border-2 border-white dark:border-gray-700">
                                                <Clock className="w-3 h-3" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-base text-gray-900 dark:text-white hover:text-fb-blue cursor-pointer transition">{req.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1 font-medium">
                                                {req.time}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 sm:self-center">
                                        <button 
                                            onClick={() => onApproveRequest(req.id, req.name)}
                                            className="flex-1 sm:flex-none px-5 py-2.5 bg-fb-blue text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Check className="w-4 h-4" /> {t.groups_approve}
                                        </button>
                                        <button 
                                            onClick={() => onRejectRequest(req.id, req.name)}
                                            className="flex-1 sm:flex-none px-5 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> {t.groups_reject}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-700/10 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-4">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{t.common_no_results}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.common_success}</p>
                        </div>
                    )}
                </div>
            )}

            {/* REPORTS SECTION */}
            {activeSection === 'reports' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fadeIn min-h-[400px]">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <Flag className="w-6 h-6 text-orange-500" />
                        {t.groups_reports}
                    </h3>

                    {adminReports.length > 0 ? (
                        <div className="space-y-4">
                            {adminReports.map((report) => (
                                <div key={report.id} className="p-5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 transition hover:shadow-md">
                                    <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                                                {report.type}
                                            </span>
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                {t.common_report} <span className="font-bold text-gray-900 dark:text-white">{report.reporter}</span>
                                            </span>
                                        </div>
                                        <span className="text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 font-medium">
                                            {report.status || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-5 relative">
                                        <div className={`absolute top-0 bottom-0 ${isRtl ? 'right-0 rounded-r-lg' : 'left-0 rounded-l-lg'} w-1 bg-red-400`}></div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200 italic text-sm md:text-base leading-relaxed">
                                            "{report.content}"
                                        </p>
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button 
                                            onClick={() => onResolveReport(report.id, 'keep')}
                                            className="px-5 py-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-sm font-bold transition border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                        >
                                            {t.groups_keep_content}
                                        </button>
                                        <button 
                                            onClick={() => onResolveReport(report.id, 'delete')}
                                            className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-sm flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" /> {t.groups_delete_content}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-700/10 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-4">
                                <Shield className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{t.common_success}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.common_no_results}</p>
                        </div>
                    )}
                </div>
            )}

            {/* LOGS SECTION */}
            {activeSection === 'logs' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fadeIn min-h-[400px]">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-8 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        {t.groups_activity_log}
                    </h3>
                    
                    <div className={`space-y-0 relative ${isRtl ? 'border-r-2 mr-4 pr-6' : 'border-l-2 ml-4 pl-6'} border-gray-200 dark:border-gray-700`}>
                        {adminLogs.map((log) => (
                            <div key={log.id} className="relative pb-8 last:pb-0 group">
                                {/* Timeline Dot */}
                                <div className={`absolute top-1.5 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full border-4 border-white dark:border-gray-800 transition-colors group-hover:bg-fb-blue dark:group-hover:bg-fb-blue ${isRtl ? '-right-[29px]' : '-left-[29px]'}`}></div>
                                
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition duration-200 -mt-2">
                                    <div>
                                        <div className="font-bold text-gray-800 dark:text-white text-sm md:text-base">{log.action}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                            {t.common_admin}: <span className="text-fb-blue dark:text-blue-400">{log.admin}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] md:text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-2 sm:mt-0 w-fit self-start">
                                        {log.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {adminLogs.length === 0 && (
                            <div className="text-center py-8 text-gray-400 italic text-sm">
                                {t.common_no_results}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default GroupAdminDashboard;