import React from 'react';
import KanbanBoard from '../components/tasks/KanbanBoard';

const KanbanPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kanban Panosu</h1>
      </div>
      
      <KanbanBoard />
    </div>
  );
};

export default KanbanPage;