import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { Calendar, GripVertical } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SortableTaskProps {
  task: Task;
}

const priorityColors: Record<string, string> = {
  'Düşük': 'bg-gray-100 text-gray-700 border-gray-200',
  'Orta': 'bg-blue-100 text-blue-700 border-blue-200',
  'Yüksek': 'bg-orange-100 text-orange-700 border-orange-200',
  'Acil': 'bg-red-100 text-red-700 border-red-200',
};

const SortableTask: React.FC<SortableTaskProps> = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const isOverdue = task.due_date && 
    isAfter(new Date(), new Date(task.due_date)) && 
    task.status !== 'Tamamlandı';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-md shadow border-l-4 ${priorityColors[task.priority]} p-3 cursor-pointer hover:shadow-md transition-shadow`}
      {...attributes}
    >
      <div className="flex items-start">
        <div 
          {...listeners} 
          className="mr-2 mt-1 cursor-grab text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={16} />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-medium text-gray-900 mr-2 line-clamp-2">
              {task.title}
            </h4>
            
            {task.assignee?.avatar_url ? (
              <img
                src={task.assignee.avatar_url}
                alt={task.assignee.full_name}
                title={task.assignee.full_name}
                className="h-6 w-6 rounded-full flex-shrink-0"
              />
            ) : task.assignee ? (
              <div 
                title={task.assignee.full_name}
                className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium flex-shrink-0"
              >
                {task.assignee.full_name.charAt(0)}
              </div>
            ) : null}
          </div>
          
          {task.due_date && (
            <div className={`mt-2 flex items-center text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              <Calendar size={12} className="mr-1" />
              {format(new Date(task.due_date), 'dd MMM', { locale: tr })}
              {isOverdue && ' (Gecikmiş)'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SortableTask;