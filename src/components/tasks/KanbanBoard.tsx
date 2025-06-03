import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, AlertCircle } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { tasks } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { Link } from 'react-router-dom';

const KanbanBoard: React.FC = () => {
  const [taskGroups, setTaskGroups] = useState<Record<TaskStatus, Task[]>>({
    'Yapılacak': [],
    'Devam Ediyor': [],
    'Tamamlandı': [],
  });
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isTeamLeader } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await tasks.getTasks();
        
        if (error) throw error;
        
        const grouped: Record<TaskStatus, Task[]> = {
          'Yapılacak': [],
          'Devam Ediyor': [],
          'Tamamlandı': [],
        };
        
        (data || []).forEach((task) => {
          if (task.status in grouped) {
            grouped[task.status as TaskStatus].push(task);
          }
        });
        
        setTaskGroups(grouped);
      } catch (error) {
        console.error('Görevler yüklenirken hata oluştu:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    
    // Tüm kolonlardaki görevleri tarayarak aktif görevi bulma
    for (const status in taskGroups) {
      const task = taskGroups[status as TaskStatus].find(t => t.id === taskId);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !activeTask) return;
    
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    
    if (activeTask.status !== newStatus) {
      try {
        // Durumu güncellemek için istek gönder
        const { data, error } = await tasks.updateTask(taskId, { 
          status: newStatus 
        });
        
        if (error) throw error;
        
        // Yerel state'i güncelle
        setTaskGroups(prev => {
          const updatedGroups = { ...prev };
          
          // Görevi eski kolondan kaldır
          updatedGroups[activeTask.status] = updatedGroups[activeTask.status].filter(
            task => task.id !== taskId
          );
          
          // Görevi yeni kolona ekle (güncellenmiş veriyle)
          if (data) {
            const updatedTask = { ...activeTask, ...data };
            updatedGroups[newStatus] = [...updatedGroups[newStatus], updatedTask];
          }
          
          return updatedGroups;
        });
      } catch (error) {
        console.error('Görev durumu güncellenirken hata oluştu:', error);
      }
    }
    
    setActiveTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">Görevler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const isEmpty = Object.values(taskGroups).every(tasks => tasks.length === 0);

  if (isEmpty) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
          <AlertCircle className="h-6 w-6 text-gray-600" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Görev bulunamadı</h3>
        <p className="mt-1 text-sm text-gray-500">
          Henüz hiç görev oluşturulmamış.
        </p>
        {isTeamLeader && (
          <div className="mt-6">
            <Link
              to="/tasks/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-1" />
              Yeni Görev Ekle
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Kanban Panosu</h2>
        {isTeamLeader && (
          <Link
            to="/tasks/new"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} className="mr-1" />
            Yeni Görev
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <KanbanColumn 
            title="Yapılacak" 
            status="Yapılacak" 
            tasks={taskGroups['Yapılacak']} 
            isTeamLeader={isTeamLeader}
          />
          
          <KanbanColumn 
            title="Devam Ediyor" 
            status="Devam Ediyor" 
            tasks={taskGroups['Devam Ediyor']} 
            isTeamLeader={isTeamLeader}
          />
          
          <KanbanColumn 
            title="Tamamlandı" 
            status="Tamamlandı" 
            tasks={taskGroups['Tamamlandı']} 
            isTeamLeader={isTeamLeader}
          />
          
          <DragOverlay adjustScale={true}>
            {activeTask ? (
              <div className="bg-white shadow-lg rounded-md border border-gray-200 w-full opacity-90">
                <TaskCard task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default KanbanBoard;