import React from 'react';
import TaskList from '../components/tasks/TaskList';

const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Görevler</h1>
      </div>
      
      <TaskList showFilters={true} />
    </div>
  );
};

export default TasksPage;