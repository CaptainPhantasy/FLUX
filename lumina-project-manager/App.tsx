import React from 'react';
import { BackgroundGradientAnimation } from './components/ui/background-gradient-animation';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// --- Icons ---
const Icons = {
  Grid: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>,
  List: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
};

// --- Reusable Modern Surface Component ---
// Switched from "Glass" to "Surface".
// These are opaque, solid frames that sit inside the main app window.
interface SurfaceFrameProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'panel' | 'card' | 'ghost';
  padding?: string;
}

const SurfaceFrame: React.FC<SurfaceFrameProps> = ({ 
  children, 
  className = "", 
  variant = 'panel',
  padding = 'p-6'
}) => {
  const baseStyles = "relative overflow-hidden transition-all duration-300";
  
  const variants = {
    // Solid background for sections, slightly different from main app bg
    panel: "bg-gray-50/80 dark:bg-[#1E2028] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm",
    // Interactive cards with hover states
    card: "bg-white dark:bg-[#252832] border border-gray-200 dark:border-gray-700/50 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md hover:-translate-y-1 rounded-xl cursor-pointer",
    // Transparent/Ghost for simple wrappers
    ghost: "bg-transparent"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${padding} ${className}`}>
      {children}
    </div>
  );
};

// --- Sub-Components for the App ---

const NavLink = ({ icon: Icon, label, active }: { icon: any, label: string, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}>
    <Icon />
    <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, change }: { title: string, value: string, change: string }) => (
  <SurfaceFrame variant="card" padding="p-6" className="flex flex-col gap-3 !cursor-default hover:!transform-none hover:!shadow-sm">
    <div className="flex justify-between items-start">
      <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
      <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
        <Icons.TrendingUp />
      </div>
    </div>
    <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">{change}</span>
      <span className="text-xs text-gray-400">vs last period</span>
    </div>
  </SurfaceFrame>
);

const ProjectCard = ({ title, status, progress, members }: { title: string, status: string, progress: number, members: number }) => (
  <SurfaceFrame variant="card" padding="p-5" className="flex flex-col h-full justify-between gap-5 group">
    <div className="flex justify-between items-start">
      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
        {title.charAt(0)}
      </div>
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
        {status}
      </span>
    </div>
    <div>
      <h3 className="text-gray-900 dark:text-white font-bold text-base leading-tight">{title}</h3>
      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1.5">Due in 3 days</p>
    </div>
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="flex justify-between items-center pt-1">
        <div className="flex -space-x-2">
          {[...Array(members)].map((_, i) => (
            <div key={i} className="h-6 w-6 rounded-full border-2 border-white dark:border-[#252832] bg-gray-300" 
                 style={{ backgroundColor: `hsl(${i * 60 + 200}, 70%, 60%)` }} />
          ))}
        </div>
        <div className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">View Details &rarr;</div>
      </div>
    </div>
  </SurfaceFrame>
);

// --- Main Dashboard Layout ---

const Dashboard = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
      
      {/* 
        THE APP WINDOW FRAME 
        This is the "Monitor Frame" - a solid, opaque container floating above the background.
      */}
      <div className="relative w-full max-w-[1600px] h-[90vh] md:h-[85vh] flex flex-col bg-white dark:bg-[#0F1117] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 ring-1 ring-black/5">
        
        {/* Window Header / Controls */}
        <div className="h-10 bg-gray-50 dark:bg-[#161821] border-b border-gray-200 dark:border-gray-800 flex items-center px-4 md:px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-500 transition-colors" />
             <div className="w-3 h-3 rounded-full bg-amber-400/80 hover:bg-amber-500 transition-colors" />
             <div className="w-3 h-3 rounded-full bg-green-400/80 hover:bg-green-500 transition-colors" />
          </div>
          <div className="text-xs font-medium text-gray-400 dark:text-gray-600 select-none">Lumina Project Manager</div>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>

        {/* Main Content Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar - Solid High Contrast */}
          <div className="w-20 lg:w-64 bg-white dark:bg-[#13151C] flex-shrink-0 flex flex-col h-full border-r border-gray-100 dark:border-gray-800 z-20">
            <div className="flex items-center gap-3 px-6 py-8">
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/30">L</div>
              <span className="hidden lg:block font-bold text-lg text-gray-900 dark:text-white tracking-tight">Lumina</span>
            </div>
            
            <nav className="flex-1 px-4 space-y-1">
              <NavLink icon={Icons.Grid} label="Dashboard" active />
              <NavLink icon={Icons.List} label="Projects" />
              <NavLink icon={Icons.Users} label="Team" />
              <NavLink icon={Icons.Settings} label="Settings" />
            </nav>

            <div className="mt-auto p-6 border-t border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 shadow-md"></div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Alex Morgan</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pro License</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-[#0F1117] relative">
            
            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 bg-white/80 dark:bg-[#0F1117]/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">Track your team's progress and active projects</p>
              </div>
              
              <div className="flex items-center gap-4">
                 <button onClick={toggleTheme} className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors">
                   {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
                 </button>
                <div className="hidden md:flex items-center gap-3 bg-white dark:bg-[#161821] px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-2 ring-blue-500/10 transition-all shadow-sm">
                  <Icons.Search />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 w-48"
                  />
                </div>
              </div>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
              <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard title="Total Projects" value="12" change="+2" />
                  <StatCard title="Tasks Completed" value="482" change="+18%" />
                  <StatCard title="Team Velocity" value="84pts" change="0%" />
                </div>

                {/* Content Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Projects</h2>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors">View All Projects</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ProjectCard title="Website Redesign" status="Active" progress={75} members={3} />
                    <ProjectCard title="Mobile App" status="Review" progress={90} members={4} />
                    <ProjectCard title="Marketing Campaign" status="Active" progress={45} members={2} />
                    <ProjectCard title="Internal Audit" status="Paused" progress={15} members={1} />
                    <ProjectCard title="Q3 Roadmap" status="Planning" progress={10} members={5} />
                    
                    {/* Add New Project Card */}
                    <button className="flex flex-col items-center justify-center gap-3 h-full min-h-[220px] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all group">
                      <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-blue-500 flex items-center justify-center transition-colors">
                        <span className="text-3xl font-light">+</span>
                      </div>
                      <span className="font-semibold text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Create New Project</span>
                    </button>
                  </div>
                </div>

                {/* Integration Guide */}
                <SurfaceFrame variant="panel" className="mt-8">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Layout System</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Opaque frame implementation</p>
                    </div>
                    <div className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-600 dark:text-gray-300">v2.0</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-5 font-mono text-xs text-gray-300 overflow-x-auto shadow-inner border border-black/50">
                    <p className="text-gray-500 mb-2">// The app frame sits inside the animated background wrapper</p>
                    <p className="text-purple-400">const</p> <span className="text-yellow-200">AppWindow</span> = () =&gt; (
                    <br/>
                    &nbsp;&nbsp;&lt;<span className="text-blue-300">div</span> <span className="text-orange-300">className</span>=<span className="text-green-300">"w-[90vw] h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden"</span>&gt;
                    <br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-blue-300">Sidebar</span> /&gt;
                    <br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-blue-300">MainContent</span> /&gt;
                    <br/>
                    &nbsp;&nbsp;&lt;/<span className="text-blue-300">div</span>&gt;
                    <br/>
                    );
                  </div>
                </SurfaceFrame>

              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- App Entry Point ---

function App() {
  return (
    <ThemeProvider>
      {/* 
        The BackgroundGradientAnimation acts as the "Desktop" or "Wall". 
        It has z-index 0. The Dashboard floats on top with higher z-index logic handled by the component structure.
      */}
      <BackgroundGradientAnimation containerClassName="h-screen w-screen font-sans">
        <Dashboard />
      </BackgroundGradientAnimation>
    </ThemeProvider>
  );
}

export default App;
