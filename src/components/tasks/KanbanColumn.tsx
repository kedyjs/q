import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableTask from './SortableTask';
import { Task, TaskStatus } from '../../types';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  isTeamLeader: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  'Yapılacak': 'bg-gray-100',
  'Devam Ediyor': 'bg-yellow-100',
  'Tamamlandı': 'bg-green-100',
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, tasks, isTeamLeader }) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div 
      className={`${statusColors[status]} rounded-md p-4 flex flex-col h-[calc(100vh-260px)] overflow-hidden`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <span className="bg-white text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto space-y-2 min-h-[100px]"
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-gray-500 italic">
            Bu kolonda görev bulunmamaktadır.
          </div>
        )}
      </div>
      
      {isTeamLeader && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Link
            to={`/tasks/new?status=${status}`}
            className="flex items-center justify-center w-full py-2 text-sm text-gray-600 hover:bg-white hover:text-blue-600 rounded transition-colors"
          >
            <Plus size={16} className="mr-1" />
            Görev Ekle
          </Link>
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;