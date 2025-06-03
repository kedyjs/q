import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, MoreVertical, Filter, 
  ArrowDownUp, Search, Plus, AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Task, TaskPriority, TaskStatus, User } from '../../types';
import { tasks } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import TaskCard from './TaskCard';

interface TaskListProps {
  title?: string;
  showFilters?: boolean;
  limit?: number;
  assignedToCurrentUser?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  'Düşük': 'bg-gray-100 text-gray-700',
  'Orta': 'bg-blue-100 text-blue-700',
  'Yüksek': 'bg-orange-100 text-orange-700',
  'Acil': 'bg-red-100 text-red-700',
};

const TaskList: React.FC<TaskListProps> = ({ 
  title = 'Tüm Görevler', 
  showFilters = true,
  limit,
  assignedToCurrentUser = false
}) => {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isTeamLeader } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const filters: { status?: string; priority?: string; assignedTo?: string } = {};
        
        if (statusFilter) filters.status = statusFilter;
        if (priorityFilter) filters.priority = priorityFilter;
        if (assignedToCurrentUser && user) filters.assignedTo = user.id;
        
        const { data, error } = await tasks.getTasks(filters);
        
        if (error) throw error;
        
        let filteredTasks = data || [];
        
        // Arama filtresi
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredTasks = filteredTasks.filter(
            task => 
              task.title.toLowerCase().includes(query) || 
              task.description.toLowerCase().includes(query)
          );
        }
        
        // Limit
        if (limit && filteredTasks.length > limit) {
          filteredTasks = filteredTasks.slice(0, limit);
        }
        
        setTaskList(filteredTasks);
      } catch (error) {
        console.error('Görevler yüklenirken hata oluştu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [statusFilter, priorityFilter, searchQuery, user, assignedToCurrentUser, limit]);

  const resetFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setSearchQuery('');
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            {isTeamLeader && (
              <Link
                to="/tasks/new"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus size={16} className="mr-1" />
                Yeni Görev
              </Link>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-3 py-1.5 border border-gray-300 rounded-md w-full sm:w-48 text-sm"
                placeholder="Görev ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
              className="pl-3 pr-8 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">Tüm Durumlar</option>
              <option value="Yapılacak">Yapılacak</option>
              <option value="Devam Ediyor">Devam Ediyor</option>
              <option value="Tamamlandı">Tamamlandı</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
              className="pl-3 pr-8 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">Tüm Öncelikler</option>
              <option value="Düşük">Düşük</option>
              <option value="Orta">Orta</option>
              <option value="Yüksek">Yüksek</option>
              <option value="Acil">Acil</option>
            </select>
            
            {(statusFilter || priorityFilter || searchQuery) && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-sm text-gray-500">Görevler yükleniyor...</p>
          </div>
        </div>
      ) : taskList.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
            <AlertCircle className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Görev bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter || priorityFilter || searchQuery
              ? 'Arama kriterlerinize uygun görev bulunmamaktadır.'
              : 'Henüz hiç görev oluşturulmamış.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {taskList.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;