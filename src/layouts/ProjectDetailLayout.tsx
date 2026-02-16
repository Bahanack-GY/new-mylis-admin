import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ProjectDetailSidebar, { type ProjectTab } from '../components/ProjectDetailSidebar';
import Header from '../components/Header';
import ProjectDetail from '../pages/ProjectDetail';
import { useProject } from '../api/projects/hooks';

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'overdue';

export interface ProjectData {
    id: string;
    name: string;
    description: string;
    status: ProjectStatus;
    progress: number;
    startDate: string;
    endDate: string;
    department: string;
    client: string;
    tasksTotal: number;
    tasksDone: number;
    budget: number;
    members: { id: string; firstName: string; lastName: string; avatarUrl: string }[];
    tasks: {
        id: string;
        title: string;
        state: string;
        difficulty?: string;
        dueDate?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
        assignedTo?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
    }[];
}

function deriveStatus(endDate?: string, tasks?: { state: string }[]): ProjectStatus {
    const t = tasks || [];
    const allDone = t.length > 0 && t.every(tk => tk.state === 'COMPLETED' || tk.state === 'REVIEWED');
    if (allDone && t.length > 0) return 'completed';
    if (endDate && new Date(endDate) < new Date() && !allDone) return 'overdue';
    return 'active';
}

const ProjectDetailLayout = () => {
    const { id } = useParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<ProjectTab>('overview');

    const { data: apiProject, isLoading } = useProject(id || '');

    if (isLoading) {
        return (
            <div className="flex h-screen bg-blue-100 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#33cbcc]" />
            </div>
        );
    }

    if (!apiProject) {
        return <Navigate to="/projects" replace />;
    }

    const tasks = apiProject.tasks || [];
    const tasksDone = tasks.filter(t => t.state === 'COMPLETED' || t.state === 'REVIEWED').length;

    const project: ProjectData = {
        id: apiProject.id,
        name: apiProject.name,
        description: apiProject.description || '',
        status: deriveStatus(apiProject.endDate, tasks),
        progress: tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0,
        startDate: apiProject.startDate || '',
        endDate: apiProject.endDate || '',
        department: apiProject.department?.name || '',
        client: apiProject.client?.name || '',
        tasksTotal: tasks.length,
        tasksDone,
        budget: apiProject.budget || 0,
        members: apiProject.members || [],
        tasks,
    };

    return (
        <div className="flex h-screen bg-blue-100 overflow-hidden">
            <ProjectDetailSidebar
                project={project}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50">
                    <div className="container mx-auto px-6 py-8">
                        <ProjectDetail project={project} activeTab={activeTab} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProjectDetailLayout;
