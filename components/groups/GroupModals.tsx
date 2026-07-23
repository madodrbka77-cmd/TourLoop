import React, { useRef, useState } from 'react';
import { 
  X, Camera, Save, Loader2, UserPlus, Search, 
  Trash2, AlertTriangle, LogOut, UserCog, Check, Palette, Shield, Plus, Calendar, MapPin, Clock, Info, Tag
} from 'lucide-react';
import { Group } from '../../data/groupsData';
import { useLanguage } from '../../context/LanguageContext';

// --- Group Categories ---
const GROUP_CATEGORIES = [
  { id: 'general', ar: 'عام', en: 'General' },
  { id: 'sports', ar: 'رياضة', en: 'Sports' },
  { id: 'tech', ar: 'تكنولوجيا', en: 'Technology' },
  { id: 'gaming', ar: 'ألعاب', en: 'Gaming' },
  { id: 'art', ar: 'فنون', en: 'Art' },
  { id: 'science', ar: 'علوم', en: 'Science' },
  { id: 'education', ar: 'تعليم', en: 'Education' },
  { id: 'health', ar: 'صحة', en: 'Health' },
  { id: 'travel', ar: 'سفر', en: 'Travel' },
  { id: 'food', ar: 'طعام', en: 'Food' },
  { id: 'business', ar: 'أعمال', en: 'Business' },
  { id: 'entertainment', ar: 'ترفيه', en: 'Entertainment' }
];

// --- Create Group Modal ---
interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: () => void;
  isLoading: boolean;
  groupName: string;
  setGroupName: (val: string) => void;
  privacy: 'public' | 'private';
  setPrivacy: (val: 'public' | 'private') => void;
  description: string;
  setDescription: (val: string) => void;
  // Added optional props for category support
  category?: string;
  setCategory?: (val: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  onClose, onCreate, isLoading, groupName, setGroupName, privacy, setPrivacy, description, setDescription, category, setCategory
}) => {
  const { t, language, dir } = useLanguage();
  const [localCategory, setLocalCategory] = useState(GROUP_CATEGORIES[0].id);
  
  const activeCategory = category || localCategory;
  const handleCategoryChange = (val: string) => {
      setLocalCategory(val);
      if (setCategory) setCategory(val);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn border border-gray-100 dark:border-gray-700" dir={dir}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-600" />
                  {t.groups_create_group}
              </h3>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 rounded-full p-2 transition"
              >
                  <X className="w-5 h-5" />
              </button>
          </div>
          <div className="p-6 space-y-5">
              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.groups_group_name}
                  </label>
                  <input 
                      type="text" 
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-fb-blue dark:focus:ring-emerald-500 focus:border-transparent transition shadow-sm placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t.groups_group_name + "..."}
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                  />
              </div>
              
              {/* Category Field Added Here */}
              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      {language === 'ar' ? 'الفئة' : 'Category'}
                  </label>
                  <div className="relative">
                      <select 
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 appearance-none outline-none focus:ring-2 focus:ring-fb-blue dark:focus:ring-emerald-500 focus:border-transparent transition shadow-sm cursor-pointer"
                          value={activeCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                      >
                          {GROUP_CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.id}>{language === 'ar' ? cat.ar : cat.en}</option>
                          ))}
                      </select>
                      <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400 ${dir === 'rtl' ? 'left-3' : 'right-3'}`}>
                          <Tag className="w-4 h-4" />
                      </div>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      {language === 'ar' ? 'الخصوصية' : 'Privacy'}
                  </label>
                  <div className="relative">
                      <select 
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 appearance-none outline-none focus:ring-2 focus:ring-fb-blue dark:focus:ring-emerald-500 focus:border-transparent transition shadow-sm cursor-pointer"
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                      >
                          <option value="public">{t.groups_public_group}</option>
                          <option value="private">{t.groups_private_group}</option>
                      </select>
                      <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400 ${dir === 'rtl' ? 'left-3' : 'right-3'}`}>
                          <Info className="w-4 h-4" />
                      </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1 leading-relaxed">
                      {privacy === 'public' 
                          ? t.groups_privacy_hint 
                          : (language === 'ar' ? 'يمكن للأعضاء فقط رؤية من هم في المجموعة وما ينشرونه.' : 'Only members can see who is in the group and what they post.')}
                  </p>
              </div>
              <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t.common_description} <span className="text-gray-400 font-normal text-xs">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                  </label>
                  <textarea 
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-fb-blue dark:focus:ring-emerald-500 focus:border-transparent transition shadow-sm h-24 resize-none placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t.groups_about + "..."}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                  />
              </div>
          </div>
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
              <button 
                onClick={onClose} 
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-sm"
              >
                  {t.common_cancel}
              </button>
              <button 
                onClick={onCreate} 
                disabled={isLoading}
                className="px-6 py-2.5 bg-fb-blue text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {t.common_create}
              </button>
          </div>
      </div>
    </div>
  );
};

// --- Edit Group Modal ---
interface EditGroupModalProps {
  onClose: () => void;
  onSave: () => void;
  isLoading: boolean;
  name: string; setName: (val: string) => void;
  description: string; setDescription: (val: string) => void;
  coverUrl: string; 
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  privacy: 'public' | 'private'; setPrivacy: (val: 'public' | 'private') => void;
  email: string; setEmail: (val: string) => void;
  website: string; setWebsite: (val: string) => void;
  location: string; setLocation: (val: string) => void;
  themeColor: string; 
  setThemeColor: (val: string) => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  onClose, onSave, isLoading, name, setName, description, setDescription,
  coverUrl, onCoverUpload, privacy, setPrivacy, email, setEmail, website, setWebsite, location, setLocation,
  themeColor = 'emerald', setThemeColor
}) => {
  const { t, language, dir } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'rules'>('general');
  const [newRule, setNewRule] = useState('');
  const [rules, setRules] = useState<string[]>([]); 

  const handleAddRule = () => {
      if(newRule.trim()) {
          setRules([...rules, newRule]);
          setNewRule('');
      }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-700" dir={dir}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700" />
                  {t.groups_edit_group}
              </h3>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 rounded-full p-2 transition"
              >
                  <X className="w-5 h-5" />
              </button>
          </div>

          <div className="flex border-b border-gray-100 dark:border-gray-700 px-2 bg-white dark:bg-gray-800 flex-shrink-0 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('general')} 
                className={`flex-1 min-w-fit px-4 py-3 text-sm font-bold border-b-[3px] transition whitespace-nowrap ${activeTab === 'general'
                 ? 'border-green-700 dark:border-green-500 text-green-700 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-700 hover:border-blue-700 dark:hover:border-blue-700 bg-green-50/50 dark:bg-green-900/10'
                 : 'border-transparent text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 rounded-t-lg hover:text-blue-700 dark:hover:text-blue-700'}`}
              >
                  {t.groups_general}
              </button>
              <button 
                onClick={() => setActiveTab('appearance')} 
                className={`flex-1 min-w-fit px-4 py-3 text-sm font-bold border-b-[3px] transition whitespace-nowrap ${activeTab === 'appearance'
                 ? 'border-green-700 dark:border-green-500 text-green-700 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-700 hover:border-blue-700 dark:hover:border-blue-700 bg-green-50/50 dark:bg-green-900/10'
                 : 'border-transparent text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 rounded-t-lg hover:text-blue-700 dark:hover:text-blue-700'}`}
              >
                  {t.groups_appearance}
              </button>
              <button 
                onClick={() => setActiveTab('rules')} 
                className={`flex-1 min-w-fit px-4 py-3 text-sm font-bold border-b-[3px] transition whitespace-nowrap ${activeTab === 'rules'
                 ? 'border-green-700 dark:border-green-500 text-green-700 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-blue-700 hover:border-blue-700 dark:hover:border-blue-700 bg-green-50/50 dark:bg-green-900/10'
                 : 'border-transparent text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 rounded-t-lg hover:text-blue-700 dark:hover:text-blue-700'}`}
              >
                  {t.groups_rules}
              </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {activeTab === 'general' && (
                  <div className="space-y-5">
                    <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden group cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-fb-blue dark:hover:border-fb-blue transition" onClick={() => fileRef.current?.click()}>
                        {coverUrl ? (
                            <img src={coverUrl} alt="cover preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                <Camera className="w-10 h-10 mb-2 opacity-50" />
                                <span className="text-sm font-medium">{t.groups_change_cover}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold backdrop-blur-sm">
                            <Camera className="w-6 h-6 ltr:mr-2 rtl:ml-2" /> {t.common_edit}
                        </div>
                        <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={onCoverUpload} />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.groups_group_name}</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-fb-blue transition placeholder-gray-400 dark:placeholder-gray-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{language === 'ar' ? 'الخصوصية' : 'Privacy'}</label>
                        <select 
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-fb-blue transition cursor-pointer"
                            value={privacy}
                            onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                        >
                            <option value="public">{t.groups_public_group}</option>
                            <option value="private">{t.groups_private_group}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.common_description}</label>
                        <textarea 
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-fb-blue transition h-24 resize-none placeholder-gray-400 dark:placeholder-gray-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.groups_about + "..."}
                        />
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                           <Info className="w-4 h-4" /> {t.pages_contact} <span className="text-xs normal-case opacity-70">({language === 'ar' ? 'اختياري' : 'Optional'})</span>
                        </label>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.pages_email}</label>
                                <input 
                                    type="email"
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-fb-blue transition placeholder-gray-400 dark:placeholder-gray-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.pages_website}</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-fb-blue transition placeholder-gray-400 dark:placeholder-gray-500"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="www.example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.common_location}</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-fb-blue transition placeholder-gray-400 dark:placeholder-gray-500"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder={language === 'ar' ? "المدينة، الدولة" : "City, Country"}
                                />
                            </div>
                        </div>
                    </div>
                  </div>
              )}

              {activeTab === 'appearance' && (
                  <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700" /> {t.groups_group_color}
                        </label>
                        <div className="flex flex-wrap gap-4">
                            {['emerald', 'blue', 'purple', 'red', 'orange'].map(color => (
                                <button 
                                    key={color}
                                    onClick={() => setThemeColor && setThemeColor(color)}
                                    className={`w-12 h-12 rounded-full border-4 transition-all duration-200 transform hover:scale-105 ${themeColor === color ? 'border-gray-900 dark:border-white scale-110 shadow-lg' : 'border-transparent shadow-sm'}`}
                                    style={{ backgroundColor: color === 'emerald' ? '#047857' : color === 'blue' ? '#2563EB' : color === 'purple' ? '#9333EA' : color === 'red' ? '#DC2626' : '#EA580C' }}
                                    aria-label={`Select ${color} color`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                             <Info className="w-3 h-3 inline-block ltr:mr-1 rtl:ml-1 mb-0.5" />
                             {language === 'ar' ? 'سيتم تطبيق هذا اللون على الأزرار والعناوين داخل المجموعة.' : 'This color will be applied to buttons and headings within the group.'}
                        </p>
                      </div>
                  </div>
              )}

              {activeTab === 'rules' && (
                  <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700" /> {t.groups_rules}
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-fb-blue placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t.groups_add_rule}
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                            />
                            <button onClick={handleAddRule} className="bg-fb-blue text-white p-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                      </div>
                      <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {rules.map((rule, idx) => (
                              <li key={idx} className="flex justify-between items-start gap-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 leading-relaxed">
                                    <span className="font-bold text-fb-blue ltr:mr-1 rtl:ml-1">{idx + 1}.</span> {rule}
                                  </span>
                                  <button 
                                    onClick={() => setRules(rules.filter((_, i) => i !== idx))} 
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                              </li>
                          ))}
                          {rules.length === 0 && (
                              <li className="text-center text-gray-400 dark:text-gray-500 text-sm italic py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                  {t.groups_no_rules}
                              </li>
                          )}
                      </ul>
                  </div>
              )}
          </div>
          
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3 flex-shrink-0">
              <button 
                onClick={onClose} 
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-sm"
              >
                  {t.common_cancel}
              </button>
              <button 
                onClick={onSave} 
                disabled={isLoading}
                className="px-6 py-2.5 bg-fb-blue text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t.common_save}
              </button>
          </div>
      </div>
    </div>
  );
};

// --- Members Modal ---
interface MembersModalProps {
  group: Group;
  onClose: () => void;
  onAddMember: () => void;
  onRemoveMember: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  roleType: 'admin' | 'moderator' | 'member';
  setRoleType: (val: 'admin' | 'moderator' | 'member') => void;
}

export const GroupMembersModal: React.FC<MembersModalProps> = ({
  group, onClose, onAddMember, onRemoveMember, searchTerm, setSearchTerm, roleType, setRoleType
}) => {
  const { t, language, dir } = useLanguage();
  return (
    <div className="fixed inset-0 z-[120] bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn flex flex-col max-h-[85vh] border border-gray-100 dark:border-gray-700" dir={dir}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700" />
                  {t.groups_manage_members}
              </h3>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 rounded-full p-2 transition"
              >
                  <X className="w-5 h-5" />
              </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <h4 className="font-bold text-sm text-fb-blue dark:text-blue-400 mb-3 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> {t.groups_add_member}
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3 mb-3">
                      <div className="flex-1">
                          <input 
                              type="text" 
                              placeholder={t.groups_search_member} 
                              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-fb-blue outline-none transition placeholder-gray-400 dark:placeholder-gray-500"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>
                      <select 
                          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-fb-blue outline-none transition cursor-pointer"
                          value={roleType}
                          onChange={(e) => setRoleType(e.target.value as any)}
                      >
                          <option value="member">{t.common_member}</option>
                          <option value="moderator">{t.common_moderator}</option>
                          <option value="admin">{t.common_admin}</option>
                      </select>
                  </div>
                  <button 
                      onClick={onAddMember}
                      disabled={!searchTerm.trim()}
                      className="w-full bg-fb-blue text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                      {t.common_add}
                  </button>
              </div>

              <div>
                  <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide px-1">{t.groups_members} ({group.membersList?.length || 0})</h4>
                  <div className="space-y-3">
                      {group.membersList?.map((member) => (
                          <div key={member.userId} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition duration-200">
                              <div className="flex items-center gap-3">
                                  <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-600" />
                                  <div>
                                      <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                          {member.name}
                                          {member.badges?.map(badge => (
                                              <span key={badge} className="text-[9px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-700">{badge}</span>
                                          ))}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                          {member.role === 'admin' ? t.common_admin : member.role === 'moderator' ? t.common_moderator : t.common_member}
                                      </div>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => onRemoveMember(member.userId)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                                  title={t.groups_remove_member}
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      ))}
                      {(!group.membersList || group.membersList.length === 0) && (
                          <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-10 italic bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            {t.common_no_results}
                          </div>
                      )}
                  </div>
              </div>
          </div>
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end flex-shrink-0">
              <button 
                onClick={onClose} 
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700 font-bold rounded-lg hover:bg-gray-300 transition text-sm"
              >
                  {t.common_close}
              </button>
          </div>
      </div>
    </div>
  );
};

// --- Invite Modal ---
interface InviteModalProps {
  onClose: () => void;
  onInvite: (id: string) => void;
  search: string;
  setSearch: (val: string) => void;
  invitedUsers: string[];
}

export const InviteFriendsModal: React.FC<InviteModalProps> = ({ onClose, onInvite, search, setSearch, invitedUsers }) => {
  const { t, language, dir } = useLanguage();
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn border border-gray-100 dark:border-gray-700" dir={dir}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-fb-blue" />
                  {t.groups_invite}
              </h3>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 rounded-full p-2 transition"
              >
                  <X className="w-5 h-5" />
              </button>
          </div>
          <div className="p-4">
              <div className="mb-4 relative">
                  <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 ${dir === 'rtl' ? 'left-3' : 'right-3'}`}>
                      <Search className="w-4 h-4" />
                  </div>
                  <input 
                      type="text" 
                      placeholder={t.placeholders_search} 
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full py-2.5 px-4 outline-none transition focus:ring-2 focus:ring-fb-blue placeholder-gray-500 dark:placeholder-gray-400"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ paddingRight: dir === 'rtl' ? '1rem' : '2.5rem', paddingLeft: dir === 'rtl' ? '2.5rem' : '1rem' }}
                  />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {[1, 2, 3, 4, 5].map((i) => {
                      const userId = `friend-${i}`;
                      const isInvited = invitedUsers.includes(userId);
                      return (
                          <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition">
                              <div className="flex items-center gap-3">
                                  <img src={`https://picsum.photos/40/40?random=${i+50}`} className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-600" alt="friend" />
                                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                      {language === 'ar' ? 'صديق مقترح' : 'Suggested Friend'} {i}
                                  </span>
                              </div>
                              <button 
                                  onClick={() => !isInvited && onInvite(userId)}
                                  disabled={isInvited}
                                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${isInvited ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-default' : 'bg-blue-50 dark:bg-blue-900/30 text-fb-blue hover:bg-blue-100 dark:hover:bg-blue-900/50'}`}
                              >
                                  {isInvited ? (language === 'ar' ? 'تم الإرسال' : 'Sent') : t.groups_invite}
                              </button>
                          </div>
                      );
                  })}
              </div>
          </div>
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
              <button 
                onClick={onClose} 
                className="px-6 py-2 bg-fb-blue text-white font-bold rounded-lg hover:bg-blue-700 transition text-sm shadow-sm"
              >
                  {t.common_done}
              </button>
          </div>
      </div>
    </div>
  );
};

// --- Create Event Modal ---
interface CreateGroupEventModalProps {
  onClose: () => void;
  onCreate: (eventData: any) => void;
  isLoading: boolean;
}

export const CreateGroupEventModal: React.FC<CreateGroupEventModalProps> = ({ onClose, onCreate, isLoading }) => {
    const { t, dir } = useLanguage();
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!title || !date || !location) return;
        onCreate({ title, date, time, location, description });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-md">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn border border-gray-100 dark:border-gray-700" dir={dir}>
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-700 hover:text-blue-700 dark:text-emerald-400 dark:hover:text-blue-700" />
                        {t.groups_create_event}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 rounded-full p-2 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.groups_event_title}</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-fb-blue transition placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder={t.groups_event_title + "..."}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.groups_event_date}</label>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-fb-blue transition"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.groups_event_time}</label>
                            <div className="relative">
                                <input 
                                    type="time" 
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-fb-blue transition"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.groups_event_location}</label>
                        <div className="relative">
                            <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 ${dir === 'rtl' ? 'left-3' : 'right-3'}`}>
                                <MapPin className="w-4 h-4" />
                            </div>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-fb-blue transition placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder={t.groups_event_location + "..."}
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                style={{ paddingRight: dir === 'rtl' ? '1rem' : '2.5rem', paddingLeft: dir === 'rtl' ? '2.5rem' : '1rem' }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.groups_event_desc}</label>
                        <textarea 
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-fb-blue transition h-20 resize-none placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder={t.groups_event_desc + "..."}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-sm"
                    >
                        {t.common_cancel}
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isLoading || !title || !date || !location}
                        className="px-6 py-2.5 bg-fb-blue text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t.groups_create_event}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Confirmation Modal ---
interface ConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  type: 'delete' | 'leave' | null;
  groupName: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ onClose, onConfirm, isLoading, type, groupName }) => {
  const { t, dir } = useLanguage();
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn border border-gray-100 dark:border-gray-700" dir={dir}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    {type === 'delete' ? <Trash2 className="w-5 h-5 text-red-500" /> : <LogOut className="w-5 h-5 text-orange-500" />}
                    {type === 'delete' ? t.groups_delete_confirm_title : t.groups_leave_confirm_title}
                </h3>
                <button 
                    onClick={onClose} 
                    className="text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 rounded-full p-2 transition"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6 text-center">
                {type === 'delete' ? (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50 dark:ring-red-900/10">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-lg">
                            {t.groups_delete_confirm_desc}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 inline-block">
                            <span className="text-red-600 dark:text-red-400 font-bold break-all">{groupName}</span>
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-orange-50 dark:ring-orange-900/10">
                            <LogOut className="w-8 h-8 text-orange-600 dark:text-orange-500" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-lg">
                             {t.groups_leave_confirm_desc}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 inline-block">
                             <span className="text-fb-blue dark:text-blue-400 font-bold break-all">{groupName}</span>
                        </p>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2">
                <button 
                    onClick={onClose} 
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-sm"
                >
                    {t.common_cancel}
                </button>
                <button 
                  onClick={onConfirm} 
                  disabled={isLoading}
                  className={`px-6 py-2.5 text-white font-bold rounded-lg transition shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm ${type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t.common_confirm}
                </button>
            </div>
        </div>
    </div>
  );
};