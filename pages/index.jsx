'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqfszlxdkvwlvpwqqmbd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZnN6bHhka3Z3bHZwd3FxbWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTExODgsImV4cCI6MjA4ODEyNzE4OH0.4OlPny5uJFTslf6iWfF7fAaVl0x2I_VG63QPa1Amq8Q';

const sb = createClient(supabaseUrl, supabaseKey);

const OWNERS = ['Don', 'Mark', 'Kerushan', 'Daryl', 'Tunya', 'Tim', 'John', 'Greg', 'Verona', 'Rich'];
const OWNER_COLORS = {
  'Don': '#3b82f6',
  'Mark': '#8b5cf6',
  'Kerushan': '#ec4899',
  'Daryl': '#f59e0b',
  'Tunya': '#10b981',
  'Tim': '#06b6d4',
  'John': '#ef4444',
  'Greg': '#6366f1',
  'Verona': '#14b8a6',
  'Rich': '#f97316',
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [items, setItems] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [risks, setRisks] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const session = localStorage.getItem('session');
    if (session) {
      try {
        const user = JSON.parse(session);
        setCurrentUser(user);
        setIsLoggedIn(true);
        loadData();
      } catch (e) {
        localStorage.removeItem('session');
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await sb
        .from('cx_standup_users')
        .select('*')
        .eq('username', loginUser.toLowerCase())
        .eq('password', loginPass)
        .single();

      if (error || !data) {
        alert('Invalid credentials');
        return;
      }

      if (data.enabled === false) {
        alert('Account disabled');
        return;
      }

      localStorage.setItem('session', JSON.stringify(data));
      setCurrentUser(data);
      setIsLoggedIn(true);
      setLoginUser('');
      setLoginPass('');
      loadData();
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed');
    }
  };

  const loadData = async () => {
    try {
      const [itemsRes, feedbackRes, projectRes, riskRes, usersRes] = await Promise.all([
        sb.from('cx_standup_items').select('*').order('sortOrder'),
        sb.from('cx_standup_feedback').select('*'),
        sb.from('cx_projects').select('*').order('sortOrder'),
        sb.from('cx_risk_register').select('*').order('sortOrder'),
        sb.from('cx_standup_users').select('*').order('display_name'),
      ]);

      if (itemsRes.data) setItems(itemsRes.data);
      if (feedbackRes.data) setFeedbacks(feedbackRes.data);
      if (projectRes.data) setProjects(projectRes.data);
      if (riskRes.data) setRisks(riskRes.data);
      if (usersRes.data) setUsers(usersRes.data);
    } catch (err) {
      console.error('Load data error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('session');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 min-h-screen flex items-center justify-center">
        <div className="card p-8 w-full max-w-sm shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">CX Standup</h1>
            <p className="text-xs text-gray-500 mt-1">Sign in to continue</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Enter username"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                className="input-field w-full"
                placeholder="Enter password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-accent w-full justify-center">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav className="sidebar w-60 flex flex-col flex-shrink-0 min-h-screen">
        <div className="px-4 py-5 border-b border-white/10 flex items-center justify-center">
          <div className="text-white font-bold text-lg">CX</div>
        </div>

        <div className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          <div className="nav-section">📊 Dashboard</div>
          <div
            onClick={() => setCurrentPage('dashboard')}
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          >
            Overview
          </div>

          <div className="nav-section">📋 Weekly Feedback</div>
          <div
            onClick={() => setCurrentPage('feedback-submission')}
            className={`nav-item ${currentPage === 'feedback-submission' ? 'active' : ''}`}
          >
            Weekly Submission
          </div>
          <div
            onClick={() => setCurrentPage('feedback-history')}
            className={`nav-item ${currentPage === 'feedback-history' ? 'active' : ''}`}
          >
            Weekly Status
          </div>

          <div className="nav-section">⚡ Action Items</div>
          <div
            onClick={() => setCurrentPage('board')}
            className={`nav-item ${currentPage === 'board' ? 'active' : ''}`}
          >
            Priority Board
          </div>
          <div
            onClick={() => setCurrentPage('list')}
            className={`nav-item ${currentPage === 'list' ? 'active' : ''}`}
          >
            List View
          </div>
          <div
            onClick={() => setCurrentPage('people')}
            className={`nav-item ${currentPage === 'people' ? 'active' : ''}`}
          >
            By Person
          </div>
          <div
            onClick={() => setCurrentPage('summary')}
            className={`nav-item ${currentPage === 'summary' ? 'active' : ''}`}
          >
            Summary
          </div>

          <div className="nav-section">🤖 AI / Automation</div>
          <div
            onClick={() => setCurrentPage('projects')}
            className={`nav-item ${currentPage === 'projects' ? 'active' : ''}`}
          >
            AU Projects Tracker
          </div>

          <div className="nav-section">📧 Notifications</div>
          <div
            onClick={() => setCurrentPage('email-settings')}
            className={`nav-item ${currentPage === 'email-settings' ? 'active' : ''}`}
          >
            Email Settings
          </div>

          <div className="nav-section">⚠️ Risk Register</div>
          <div
            onClick={() => setCurrentPage('risks')}
            className={`nav-item ${currentPage === 'risks' ? 'active' : ''}`}
          >
            Risk Register
          </div>

          {currentUser?.is_admin && (
            <>
              <div className="nav-section">⚙️ Admin</div>
              <div
                onClick={() => setCurrentPage('admin')}
                className={`nav-item ${currentPage === 'admin' ? 'active' : ''}`}
              >
                User Management
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center justify-between text-[10px]">
            <p className="text-gray-500">CX Standup v4.0</p>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 cursor-pointer">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <div className="topbar flex items-center justify-between px-8 py-4 sticky top-0 z-10 bg-white border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">
            {currentPage === 'dashboard' && 'Dashboard'}
            {currentPage === 'feedback-submission' && 'Weekly Submission'}
            {currentPage === 'feedback-history' && 'Weekly Status'}
            {currentPage === 'board' && 'Priority Board'}
            {currentPage === 'list' && 'List View'}
            {currentPage === 'people' && 'By Person'}
            {currentPage === 'summary' && 'Summary'}
            {currentPage === 'projects' && 'AU Projects Tracker'}
            {currentPage === 'email-settings' && 'Email Settings'}
            {currentPage === 'risks' && 'Risk Register'}
            {currentPage === 'admin' && 'User Management'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ background: currentUser?.color || '#6366f1' }}
              >
                {currentUser?.display_name?.[0] || 'U'}
              </div>
              <span className="text-xs font-medium text-gray-700">{currentUser?.display_name}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {currentPage === 'dashboard' && <DashboardPage items={items} />}
          {currentPage === 'feedback-submission' && (
            <FeedbackSubmissionPage feedbacks={feedbacks} currentUser={currentUser} />
          )}
          {currentPage === 'feedback-history' && (
            <FeedbackHistoryPage feedbacks={feedbacks} />
          )}
          {currentPage === 'board' && <BoardPage items={items} setItems={setItems} />}
          {currentPage === 'list' && <ListPage items={items} />}
          {currentPage === 'people' && <PeoplePage items={items} />}
          {currentPage === 'summary' && <SummaryPage items={items} />}
          {currentPage === 'projects' && <ProjectsPage projects={projects} setProjects={setProjects} />}
          {currentPage === 'email-settings' && <EmailSettingsPage />}
          {currentPage === 'risks' && <RisksPage risks={risks} setRisks={setRisks} />}
          {currentPage === 'admin' && currentUser?.is_admin && <AdminPage users={users} setUsers={setUsers} />}
        </div>
      </div>
    </div>
  );
}

// Page Components
function DashboardPage({ items }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-5 gap-4">
        <div className="stat-card border-l-4 border-indigo-600">
          <p className="text-[10px] font-medium text-gray-600 uppercase">Total</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{items.length}</p>
        </div>
        <div className="stat-card border-l-4 border-gray-400">
          <p className="text-[10px] font-medium text-gray-600 uppercase">Open</p>
          <p className="text-2xl font-bold text-gray-600 mt-2">{items.filter(i => i.status === 'Open').length}</p>
        </div>
        <div className="stat-card border-l-4 border-amber-500">
          <p className="text-[10px] font-medium text-gray-600 uppercase">In Progress</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">{items.filter(i => i.status === 'In Progress').length}</p>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <p className="text-[10px] font-medium text-gray-600 uppercase">Blocked</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{items.filter(i => i.status === 'Blocked').length}</p>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <p className="text-[10px] font-medium text-gray-600 uppercase">Done</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{items.filter(i => i.status === 'Done').length}</p>
        </div>
      </div>
    </div>
  );
}

function FeedbackSubmissionPage({ feedbacks, currentUser }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Weekly Submission</h1>
      <div className="card p-8">
        <p className="text-gray-600 text-center">Feedback submission form coming soon</p>
      </div>
    </div>
  );
}

function FeedbackHistoryPage({ feedbacks }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Weekly Status</h1>
      <div className="card p-8">
        <p className="text-gray-600 text-center">Feedback history coming soon</p>
      </div>
    </div>
  );
}

function BoardPage({ items, setItems }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Priority Board</h1>
      <div className="grid grid-cols-4 gap-6">
        {['Open', 'In Progress', 'Blocked', 'Done'].map((status) => (
          <div key={status} className="lane">
            <div className="lane-header font-semibold">{status}</div>
            <div className="lane-body space-y-2">
              {items
                .filter((i) => i.status === status)
                .map((item) => (
                  <div key={item.id} className="drag-card">
                    <div className="font-semibold text-sm">{item.item}</div>
                    <p className="text-xs text-gray-600 mt-1">{item.action}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListPage({ items }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">List View</h1>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-gray-900">{item.item}</div>
                <p className="text-sm text-gray-600 mt-1">{item.action}</p>
              </div>
              <span className="badge badge-gray">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeoplePage({ items }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">By Person</h1>
      <div className="space-y-4">
        {OWNERS.map((owner) => {
          const ownerItems = items.filter((i) => (i.owners || [i.owner]).includes(owner));
          if (ownerItems.length === 0) return null;
          return (
            <div key={owner} className="card overflow-hidden">
              <div className="card-header" style={{ borderLeftColor: OWNER_COLORS[owner], borderLeftWidth: '4px' }}>
                <h3 className="font-semibold text-gray-900">{owner}</h3>
              </div>
              <div className="p-4 space-y-2">
                {ownerItems.map((item) => (
                  <div key={item.id} className="border-l-2 pl-3 py-2">
                    <p className="font-medium text-sm text-gray-900">{item.item}</p>
                    <span className="badge badge-gray text-[10px] mt-1">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryPage({ items }) {
  const statuses = ['Open', 'In Progress', 'Blocked', 'Done'];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Summary</h1>
      <div className="grid grid-cols-4 gap-6">
        {statuses.map((status) => {
          const statusItems = items.filter((i) => i.status === status);
          return (
            <div key={status} className="card overflow-hidden">
              <div className="card-header bg-gray-50 font-semibold">
                {status} ({statusItems.length})
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {statusItems.map((item) => (
                  <div key={item.id} className="border-b pb-2 last:border-b-0">
                    <p className="font-medium text-xs text-gray-900 line-clamp-2">{item.item}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectsPage({ projects, setProjects }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AU Projects Tracker</h1>
      <div className="grid grid-cols-4 gap-6">
        {['MVP', 'V1.1 Post Launch', 'V2 Future'].map((lane) => (
          <div key={lane} className="lane">
            <div className="lane-header font-semibold">{lane}</div>
            <div className="lane-body space-y-2">
              {projects
                .filter((p) => p.lane === lane)
                .map((project) => (
                  <div key={project.id} className="drag-card">
                    <div className="font-semibold text-sm">{project.title}</div>
                    <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Settings</h1>
      <div className="card p-8">
        <p className="text-gray-600 text-center">Email settings coming soon</p>
      </div>
    </div>
  );
}

function RisksPage({ risks, setRisks }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Risk Register</h1>
      <div className="space-y-3">
        {risks.map((risk) => (
          <div key={risk.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">{risk.risk}</h3>
                <p className="text-sm text-gray-600 mt-1">Impact: {risk.impact}</p>
                <p className="text-sm text-gray-600">Probability: {risk.probability}</p>
              </div>
              <span className="badge badge-red">{risk.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPage({ users, setUsers }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.username} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{user.display_name}</div>
                <p className="text-xs text-gray-600 mt-1">@{user.username}</p>
              </div>
              <div className="flex gap-2">
                {user.is_admin && <span className="badge badge-purple">Admin</span>}
                {user.enabled === false && <span className="badge badge-red">Disabled</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
