import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Task } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TeamWorkflowProps {
  tasks: Task[];
}

const TeamWorkflow: React.FC<TeamWorkflowProps> = ({ tasks }) => {
  // Kullanıcı bazlı görev dağılımı
  const userTaskCounts: Record<string, { name: string; counts: Record<string, number> }> = {};
  
  tasks.forEach(task => {
    if (task.assignee) {
      const userId = task.assignee.id;
      const userName = task.assignee.full_name;
      
      if (!userTaskCounts[userId]) {
        userTaskCounts[userId] = {
          name: userName,
          counts: {
            'Yapılacak': 0,
            'Devam Ediyor': 0,
            'Tamamlandı': 0
          }
        };
      }
      
      userTaskCounts[userId].counts[task.status]++;
    }
  });
  
  // Grafik verileri
  const labels = Object.values(userTaskCounts).map(user => user.name);
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Yapılacak',
        data: Object.values(userTaskCounts).map(user => user.counts['Yapılacak']),
        backgroundColor: 'rgba(156, 163, 175, 0.7)',
      },
      {
        label: 'Devam Ediyor',
        data: Object.values(userTaskCounts).map(user => user.counts['Devam Ediyor']),
        backgroundColor: 'rgba(251, 191, 36, 0.7)',
      },
      {
        label: 'Tamamlandı',
        data: Object.values(userTaskCounts).map(user => user.counts['Tamamlandı']),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
    ],
  };
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 sm:p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Takım İş Akışı</h2>
        <p className="mt-1 text-sm text-gray-500">
          Kullanıcı bazlı görev dağılımı ve durumları
        </p>
      </div>
      
      <div className="p-4 sm:p-6">
        {labels.length > 0 ? (
          <Bar data={data} options={options} height={300} />
        ) : (
          <div className="flex justify-center items-center py-12 text-gray-500">
            Görüntülenecek veri bulunmamaktadır.
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamWorkflow;