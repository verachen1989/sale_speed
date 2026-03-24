import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import type { Period, PropertyType } from './mock/dashboardData';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'project'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('当年');
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType>('住宅');

  const handleNavigateToProject = (
    projectId: string,
    projectName: string,
    period: Period,
    propertyType: PropertyType
  ) => {
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    setSelectedPeriod(period);
    setSelectedPropertyType(propertyType);
    setCurrentView('project');
  };

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedProjectId('');
    setSelectedProjectName('');
  };

  if (currentView === 'project') {
    return (
      <ProjectDetail 
        projectId={selectedProjectId} 
        projectName={selectedProjectName}
        period={selectedPeriod}
        propertyType={selectedPropertyType}
        onBack={handleNavigateToDashboard} 
      />
    );
  }

  return <Dashboard onNavigateToProject={handleNavigateToProject} />;
}
