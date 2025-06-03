import React from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Clock, Calendar, User } from 'lucide-react';
import { Task, TaskPriority } from '../../types';

interface TaskCardProps {
  task: Task;
}

const priorityColors: Record<TaskPriority, string> = {
  'Düşük': 'bg-gray-100 text-gray-700',
  'Orta': 'bg-blue-100 text-blue-700',
  'Yüksek': 'bg-orange-100 text-orange-700',
  'Acil': 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
  'Yapılacak': 'bg-gray-100 text-gray-700',
  'Devam Ediyor': 'bg-yellow-100 text-yellow-700',
  'Tamamlandı': 'bg-green-100 text-green-700',
};

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const isOverdue = task.due_date && 
    isAfter(new Date(), new Date(task.due_date)) && 
    task.status !== 'Tamamlandı';

  return (
    <Link 
      to={`/tasks/${task.id}`}
      className="block hover:bg-gray-50 transition-colors"
    >
      <div className="p-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="flex-1">
            <h3 className="text-base font-medium text-gray-900 mb-1">
              {task.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}>
                {task.status}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              
              {task.due_date && (
                <span className={`flex items-center text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                  <Calendar size={12} className="mr-1" />
                  {format(new Date(task.due_date), 'dd MMM yyyy', { locale: tr })}
                  {isOverdue && ' (Gecikmiş)'}
                </span>
              )}
            </div>
            
            {task.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          
          <div className="mt-3 sm:mt-0 flex flex-col items-end">
            {task.assignee && (
              <div className="flex items-center text-sm text-gray-500">
                {task.assignee.avatar_url ? (
                  <img
                    src={task.assignee.avatar_url}
                    alt={task.assignee.full_name}
                    className="h-6 w-6 rounded-full mr-1"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-1">
                    {task.assignee.full_name.charAt(0)}
                  </div>
                )}
                <span>{task.assignee.full_name}</span>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1">
              <Clock size={12} className="inline mr-1" />
              {formatDistanceToNow(new Date(task.updated_at), { 
                addSuffix: true, 
                locale: tr 
              })} güncellendi
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TaskCard;