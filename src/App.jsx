import { useState, useEffect } from 'react';
import { loadData, saveData, daysSinceLastBackup, isIncognito } from './utils/store';
import HomeScreen from './components/HomeScreen';
import ClassScreen from './components/ClassScreen';
import StudentScreen from './components/StudentScreen';
import SettingsScreen from './components/SettingsScreen';
import InitialSetupScreen from './components/InitialSetupScreen';
import IncognitoWarning from './components/IncognitoWarning';
import BackupBanner from './components/BackupBanner';

export default function App() {
  const [data, setData] = useState(() => loadData());
  const [screen, setScreen] = useState('home');
  const [classId, setClassId] = useState(null);
  const [studentNo, setStudentNo] = useState(null);
  const [incognito, setIncognito] = useState(false);

  useEffect(() => {
    isIncognito().then(setIncognito);
  }, []);

  function handleSave(newData) {
    setData(newData);
    saveData(newData);
  }

  function handleSetupComplete({ school, subjects }) {
    handleSave({
      ...data,
      teacher: { school, subjects },
      firstRunDone: true,
    });
  }

  function navigate(screen, cId, sNo) {
    setScreen(screen);
    if (cId !== undefined) setClassId(cId);
    if (sNo !== undefined) setStudentNo(sNo);
  }

  // Show initial setup if not done
  if (!data.firstRunDone) {
    return <InitialSetupScreen onComplete={handleSetupComplete} />;
  }

  const currentClass = data.classes.find(c => c.id === classId);
  const currentStudent = currentClass?.students.find(s => s.no === studentNo);
  const backupDays = daysSinceLastBackup(data);

  return (
    <div className="max-w-lg mx-auto min-h-dvh flex flex-col">
      <div className="flex-1">
        {/* Warnings */}
        {screen === 'home' && incognito && <div className="pt-3"><IncognitoWarning /></div>}
        {screen === 'home' && <BackupBanner days={backupDays} onGoSettings={() => navigate('settings')} />}

        {/* Screens */}
        {screen === 'home' && (
          <HomeScreen data={data} onSave={handleSave} onNavigate={navigate} />
        )}
        {screen === 'class' && currentClass && (
          <ClassScreen cls={currentClass} data={data} onSave={handleSave} onNavigate={navigate} />
        )}
        {screen === 'student' && currentClass && currentStudent && (
          <StudentScreen cls={currentClass} student={currentStudent} data={data} onSave={handleSave} onNavigate={navigate} />
        )}
        {screen === 'settings' && (
          <SettingsScreen data={data} onSave={handleSave} onNavigate={navigate} />
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted">
        <a href="https://mumuclass.kr" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
          &copy; 2026 무궁무진클래스 &middot; 용쌤
        </a>
      </footer>
    </div>
  );
}
