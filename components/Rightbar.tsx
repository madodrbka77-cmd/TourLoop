import React from 'react';
import { Video, Search, MoreHorizontal } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { MOCK_FRIENDS } from '../data/createPostData';

interface RightbarProps {
  onlineUsers: User[];
  onChatClick: (user: User) => void;
}

// Extended friends list to replace dummy users with "Current Friends"
// Merging MOCK_FRIENDS with additional realistic data
const CURRENT_FRIENDS: User[] = [
    ...MOCK_FRIENDS.map((f, i) => ({
        id: f.id,
        name: f.name,
        avatar: `https://picsum.photos/200/200?random=${100 + i}`,
        online: Math.random() > 0.3 // Randomize online status for realism
    })),
    { id: '6', name: 'يوسف حسن', avatar: 'https://picsum.photos/200/200?random=105', online: true },
    { id: '7', name: 'نور الشريف', avatar: 'https://picsum.photos/200/200?random=106', online: false },
    { id: '8', name: 'ليلى علوي', avatar: 'https://picsum.photos/200/200?random=107', online: true },
    { id: '9', name: 'هند صبري', avatar: 'https://picsum.photos/200/200?random=108', online: true },
    { id: '10', name: 'عمرو دياب', avatar: 'https://picsum.photos/200/200?random=109', online: false },
    { id: '11', name: 'محمد صلاح', avatar: 'https://picsum.photos/200/200?random=110', online: true },
    { id: '12', name: 'أحمد حلمي', avatar: 'https://picsum.photos/200/200?random=111', online: true },
    { id: '13', name: 'عادل إمام', avatar: 'https://picsum.photos/200/200?random=112', online: false },
    { id: '14', name: 'يسرا', avatar: 'https://picsum.photos/200/200?random=113', online: true },
    { id: '15', name: 'كريم عبد العزيز', avatar: 'https://picsum.photos/200/200?random=114', online: true },
];

const Rightbar: React.FC<RightbarProps> = ({ onlineUsers, onChatClick }) => {
  const { language, dir } = useLanguage();

  // Use CURRENT_FRIENDS instead of the passed onlineUsers (which are dummy data from parent)
  // This fulfills the requirement to "replace dummy users with current friends"
  const displayUsers = CURRENT_FRIENDS;

  return (
    <div 
      className="hidden xl:block w-[300px] h-[calc(100vh-56px)] sticky top-14 p-4 overflow-y-auto hover:overflow-y-scroll no-scrollbar bg-white/70 dark:bg-gray-900/70 backdrop-md transition-colors duration-300 rounded-br-xl border-l dark:border-gray-800"
      dir={dir}
    >
      {/* Sponsored Section */}
      <div className="mb-4">
        <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-[17px] mb-2 px-1">
          {language === 'ar' ? 'ممول' : 'Sponsored'}
        </h3>
        <div className="flex items-center gap-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition group">
          <img src="https://picsum.photos/120/120?random=99" alt="Ad" className="h-24 w-24 rounded-lg object-cover shadow-sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-gray-900 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">
              {language === 'ar' ? 'منتج رائع' : 'Amazing Product'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">example.com</span>
          </div>
        </div>
        <div className="flex items-center gap-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition group">
          <img src="https://picsum.photos/120/120?random=98" alt="Ad" className="h-24 w-24 rounded-lg object-cover shadow-sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-gray-900 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">
              {language === 'ar' ? 'خدمة مميزة' : 'Premium Service'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">service.com</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 dark:border-gray-700 my-4 mx-2"></div>

      {/* Contacts Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-gray-500 dark:text-gray-400 font-semibold text-[17px]">
          {language === 'ar' ? 'جهات الاتصال' : 'Contacts'}
        </h3>
        <div className="flex gap-2 text-gray-500 dark:text-gray-400">
          <Video className="h-4 w-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
          <Search className="h-4 w-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
          <MoreHorizontal className="h-4 w-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
        </div>
      </div>

      {/* Friends List */}
      <ul className="space-y-1">
        {displayUsers.map((user) => (
          <li 
            key={user.id} 
            onClick={() => onChatClick(user)}
            className="flex items-center gap-3 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition group active:scale-95"
          >
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="h-9 w-9 rounded-full border border-gray-200 dark:border-gray-700 object-cover shadow-sm" 
              />
              {user.online && (
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
              )}
            </div>
            <span className="font-medium text-[15px] text-gray-900 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors truncate">
              {user.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Rightbar;