import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CalendarClock, Calendar, List, CheckSquare, AlertTriangle } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import TeamWorkflow from '../components/dashboard/TeamWorkflow';
import TaskList from '../components/tasks/TaskList';
import { Task } from '../types';
import { tasks } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isTeamLeader } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await tasks.getTasks();
        
        if (error) throw error;
        
        setAllTasks(data || []);
      } catch (error) {
        console.error('Görevler yüklenirken hata oluştu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // İstatistikler
  const taskStats = {
    total: allTasks.length,
    completed: allTasks.filter(t => t.status === 'Tamamlandı').length,
    inProgress: allTasks.filter(t => t.status === 'Devam Ediyor').length,
    todo: allTasks.filter(t => t.status === 'Yapılacak').length,
    urgent: allTasks.filter(t => t.priority === 'Acil').length,
    overdue: allTasks.filter(t => 
      t.due_date && 
      isAfter(new Date(), new Date(t.due_date)) && 
      t.status !== 'Tamamlandı'
    ).length,
  };

  // Kullanıcıya atanan görevler
  const myTasks = allTasks.filter(t => t.assigned_to === user?.id);
  
  // Son eklenen görevler
  const recentTasks = [...allTasks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gösterge Paneli</h1>
      
      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 rounded">
              <CheckSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Toplam Görev</h2>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{taskStats.total}</p>
              <div className="mt-1 flex space-x-4 text-sm">
                <div>
                  <span className="font-medium text-green-600">{taskStats.completed}</span>
                  <span className="text-gray-500"> Tamamlandı</span>
                </div>
                <div>
                  <span className="font-medium text-yellow-600">{taskStats.inProgress}</span>
                  <span className="text-gray-500"> Devam Ediyor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start">
            <div className="p-2 bg-orange-100 rounded">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Bana Atanan</h2>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{myTasks.length}</p>
              <div className="mt-1 text-sm">
                <Link to="/tasks" className="text-blue-600 hover:text-blue-800 font-medium">
                  Görevlerimi Görüntüle →
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start">
            <div className="p-2 bg-red-100 rounded">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Acil Görevler</h2>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{taskStats.urgent}</p>
              <div className="mt-1 text-sm text-gray-500">
                {taskStats.overdue} görev gecikmiş
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Takım iş akışı grafiği */}
      <TeamWorkflow tasks={allTasks} />
      
      {/* Görevlerim ve son görevler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskList 
          title="Görevlerim" 
          showFilters={false} 
          limit={5} 
          assignedToCurrentUser={true} 
        />
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Son Eklenen Görevler</h2>
          </div>
          
          {recentTasks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Henüz görev bulunmamaktadır.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentTasks.map((task) => (
                <Link 
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="block hover:bg-gray-50 transition-colors p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {format(new Date(task.created_at), 'dd MMM yyyy', { locale: tr })}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'Yapılacak' ? 'bg-gray-100 text-gray-700' :
                      task.status === 'Devam Ediyor' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;