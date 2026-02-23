import {
  LayoutDashboard,
  Users,
  ListChecks,
  FolderKanban,
  Building2,
  FileText,
  Ticket,
  Receipt,
  ClipboardList,
  Wallet,
  UserCircle,
  Activity,
  CalendarDays,
  Bell,
} from 'lucide-react';
import type { AppDefinition } from './types';

export const appRegistry: AppDefinition[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/embed/dashboard', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'employees', label: 'Employees', icon: Users, route: '/embed/employees', defaultWidth: 960, defaultHeight: 650 },
  { id: 'tasks', label: 'Tasks', icon: ListChecks, route: '/embed/tasks', defaultWidth: 900, defaultHeight: 620 },
  { id: 'projects', label: 'Projects', icon: FolderKanban, route: '/embed/projects', defaultWidth: 960, defaultHeight: 650 },
  { id: 'departments', label: 'Departments', icon: Building2, route: '/embed/departments', defaultWidth: 900, defaultHeight: 600 },
  { id: 'documents', label: 'Documents', icon: FileText, route: '/embed/documents', defaultWidth: 900, defaultHeight: 620 },
  { id: 'tickets', label: 'Tickets', icon: Ticket, route: '/embed/tickets', defaultWidth: 900, defaultHeight: 620 },
  { id: 'invoices', label: 'Invoices', icon: Receipt, route: '/embed/invoices', defaultWidth: 960, defaultHeight: 650 },
  { id: 'demands', label: 'Demands', icon: ClipboardList, route: '/embed/demands', defaultWidth: 900, defaultHeight: 620 },
  { id: 'expenses', label: 'Expenses', icon: Wallet, route: '/embed/expenses', defaultWidth: 900, defaultHeight: 620 },
  { id: 'clients', label: 'Clients', icon: UserCircle, route: '/embed/clients', defaultWidth: 960, defaultHeight: 650 },
  { id: 'activity', label: 'Activity', icon: Activity, route: '/embed/activity', defaultWidth: 900, defaultHeight: 600 },
  { id: 'meetings', label: 'Meetings', icon: CalendarDays, route: '/embed/meetings', defaultWidth: 960, defaultHeight: 650 },
  { id: 'notifications', label: 'Notifications', icon: Bell, route: '/embed/notifications', defaultWidth: 800, defaultHeight: 560 },
];
