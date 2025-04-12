import React from 'react';
import './UserAnalytics.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const UserAnalytics = () => {
  // Pretend this is the logged-in user's name
  const username = "Your";

  // Personalized hardcoded data
  const watchTimeData = {
    labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Your Watch Time (hrs)',
        data: [
          1, 2, 1.5, 2.5, 0.5, 1, 2, 2, 3, 1,
          1.2, 0.8, 1.7, 2.1, 1.4, 3.2, 1.5, 0.5, 1.8, 2.3,
          1.1, 2.4, 2, 1.9, 1.6, 2.2, 1.3, 2.5, 0.9, 1.7
        ],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.4,
      },
    ],
  };

  const topStreamersData = {
    labels: ['TechGuru', 'GameMaster', 'CodeWithMe', 'TalkNChill', 'StudyBuddy'],
    datasets: [
      {
        label: 'Hours You Watched',
        data: [15, 12, 10, 8, 6],
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  const categoryData = {
    labels: ['Coding', 'Gaming', 'Study', 'Talk Shows', 'Music'],
    datasets: [
      {
        label: 'Your Category Preference',
        data: [35, 30, 15, 10, 10],
        backgroundColor: [
          '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF',
        ],
      },
    ],
  };

  const deviceData = {
    labels: ['Mobile', 'Desktop', 'Tablet'],
    datasets: [
      {
        label: 'Your Devices',
        data: [50, 45, 5],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  return (
    <div className="analytics-container">
      <h2>{username} Analytics</h2>

      <div className="chart-section">
        <h3>Watch Time Per Day (Last 30 Days)</h3>
        <Line data={watchTimeData} />
      </div>

      <div className="chart-section">
        <h3>Your Top Streamers</h3>
        <Bar data={topStreamersData} />
      </div>

      <div className="chart-grid">
        <div className="chart-half">
          <h3>Your Favorite Categories</h3>
          <Pie data={categoryData} />
        </div>

        <div className="chart-half">
          <h3>Devices You Watch On</h3>
          <Doughnut data={deviceData} />
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;
