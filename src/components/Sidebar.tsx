import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  // Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Briefcase,
  FileText,
  Building,
  ListChecks,
  Ticket,
  Receipt,
  UserCircle,
  Activity,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogout } from '../api/auth/hooks';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/Logo.png';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const { role } = useAuth();
  const isHOD = role === 'HEAD_OF_DEPARTMENT';

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'dashboard', path: '/dashboard' },
    { icon: Users, label: 'employees', path: '/employees' },
    { icon: ListChecks, label: 'tasks', path: '/tasks' },
    { icon: Briefcase, label: 'projects', path: '/projects' },
    { icon: Building, label: 'departments', path: '/departments' },
    { icon: FileText, label: 'documents', path: '/documents' },
    { icon: Ticket, label: 'tickets', path: '/tickets' },
    { icon: Receipt, label: 'invoices', path: '/invoices' },
    { icon: UserCircle, label: 'clients', path: '/clients' },
    { icon: Activity, label: 'activity', path: '/activity', managerOnly: true },
    { icon: Calendar, label: 'meetings', path: '/meetings' },
    { icon: MessageSquare, label: 'messages', path: '/messages' },
    // { icon: Settings, label: 'settings', path: '/settings', managerOnly: true },
  ];

  const menuItems = isHOD ? allMenuItems.filter(item => !item.managerOnly) : allMenuItems;

  return (
    <motion.div 
      animate={{ width: isSidebarOpen ? 280 : 80 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
      className="h-screen bg-[#283852] text-white flex flex-col relative shadow-2xl z-50"
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-center p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3 w-full overflow-hidden">
             <img src={logo} alt="Logo" className="w-10 h-10 object-contain min-w-[40px]" />
             <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-bold text-xl whitespace-nowrap overflow-hidden"
                    >
                        MyLIS
                    </motion.div>
                )}
             </AnimatePresence>
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute -right-3 top-24 bg-[#33cbcc] p-1 rounded-full shadow-lg hover:bg-[#2bb5b6] transition-colors z-50"
      >
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Navigation */}
      <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <div 
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-[#33cbcc] text-white shadow-lg shadow-[#33cbcc]/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon size={24} className={`min-w-[24px] ${!isActive && 'group-hover:text-[#33cbcc]'}`} />
              
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-4 font-medium whitespace-nowrap overflow-hidden"
                  >
                   {t(`sidebar.${item.label}`)}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {t(`sidebar.${item.label}`)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-700/50">
        <div onClick={logout} className="flex items-center p-3 rounded-xl cursor-pointer text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors">
          <LogOut size={24} className="min-w-[24px]" />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4 font-medium whitespace-nowrap overflow-hidden"
              >
                {t('sidebar.logout')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
