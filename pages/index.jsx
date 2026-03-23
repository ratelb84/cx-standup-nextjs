'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase for auth only (not data queries)
const sb = createClient(
  'https://hqfszlxdkvwlvpwqqmbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZnN6bHhka3Z3bHZwd3FxbWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTExODgsImV4cCI6MjA4ODEyNzE4OH0.4OlPny5uJFTslf6iWfF7fAaVl0x2I_VG63QPa1Amq8Q'
);

// Data is now fetched via /api/data (backend-only)

const OWNERS = ['Don', 'Mark', 'Kerushan', 'Daryl', 'Tunya', 'Tim', 'John', 'Greg', 'Verona', 'Rich'];
const OWNER_COLORS = {
  'Don': '#3b82f6', 'Mark': '#8b5cf6', 'Kerushan': '#ec4899', 'Daryl': '#f59e0b',
  'Tunya': '#10b981', 'Tim': '#06b6d4', 'John': '#ef4444', 'Greg': '#6366f1',
  'Verona': '#14b8a6', 'Rich': '#f97316',
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [risks, setRisks] = useState([]);
  const [users, setUsers] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [modals, setModals] = useState({ item: false, project: false, risk: false, user: false });
  const [editing, setEditing] = useState({ item: null, project: null, risk: null, user: null });
  const [form, setForm] = useState({});

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(loadData, 15000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        return;
      }
      
      const { items, projects, risks, users } = await response.json();
      console.log('✅ Data loaded:', { items: items.length, projects: projects.length, risks: risks.length, users: users.length });
      
      setItems(items);
      setProjects(projects);
      setRisks(risks);
      setUsers(users);
    } catch (err) {
      console.error('Load error:', err);
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

      if (error || !data || data.enabled === false) {
        alert(data?.enabled === false ? 'Account disabled' : 'Invalid credentials');
        return;
      }

      localStorage.setItem('session', JSON.stringify(data));
      setCurrentUser(data);
      setIsLoggedIn(true);
      loadData();
    } catch (err) {
      alert('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('session');
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  // CRUD Operations
  const saveItem = async () => {
    if (!form.item?.trim() || !form.action?.trim() || !form.dueDate) {
      alert('Please fill all required fields (Item, Action, Due Date)');
      return;
    }

    try {
      const data = {
        item: form.item,
        action: form.action,
        priority: form.priority || 'High',
        status: form.status || 'Open',
        dueDate: form.dueDate,
        owners: form.owners || [currentUser.display_name],
        owner: (form.owners || [currentUser.display_name])[0],
        comments: form.comments || [],
      };

      if (editing.item) {
        const { error } = await sbAdmin.from('cx_standup_items').update(data).eq('id', editing.item.id);
        if (error) throw error;
      } else {
        const { error } = await sbAdmin.from('cx_standup_items').insert({
          ...data,
          id: Date.now().toString(),
          sortOrder: items.length,
          createdAt: new Date().toISOString(),
        });
        if (error) throw error;
      }

      closeModal('item');
      await loadData();
      alert('✅ Item saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ Error: ' + (err.message || 'Failed to save item'));
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      const res = await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        alert('Error deleting item');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const updateItemStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/items?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Error updating status');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const saveProject = async () => {
    if (!form.title?.trim()) {
      alert('Please enter project title');
      return;
    }

    try {
      const data = {
        title: form.title,
        description: form.description || '',
        lane: form.lane || 'MVP',
        owners: form.owners || [currentUser.display_name],
        owner: (form.owners || [currentUser.display_name])[0],
        status: form.status || 'Open',
        comments: form.comments || [],
      };

      if (editing.project) {
        const { error } = await sbAdmin.from('cx_projects').update(data).eq('id', editing.project.id);
        if (error) throw error;
      } else {
        const { error } = await sbAdmin.from('cx_projects').insert({
          ...data,
          id: Date.now().toString(),
          sortOrder: projects.length,
        });
        if (error) throw error;
      }

      closeModal('project');
      await loadData();
      alert('✅ Project saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ Error: ' + (err.message || 'Failed to save project'));
    }
  };

  const deleteProject = async (id) => {
    if (!confirm('Delete?')) return;
    try {
      await sbAdmin.from('cx_projects').delete().eq('id', id);
      loadData();
    } catch (err) {
      alert('Error deleting');
    }
  };

  const saveRisk = async () => {
    if (!form.risk?.trim()) {
      alert('Please enter risk description');
      return;
    }

    try {
      const data = {
        risk: form.risk,
        impact: form.impact || 'Medium',
        probability: form.probability || 'Medium',
        mitigation: form.mitigation || '',
        status: form.status || 'Open',
        owners: form.owners || [currentUser.display_name],
        owner: (form.owners || [currentUser.display_name])[0],
        dueDate: form.dueDate || null,
        comments: form.comments || [],
      };

      if (editing.risk) {
        const { error } = await sbAdmin.from('cx_risk_register').update(data).eq('id', editing.risk.id);
        if (error) throw error;
      } else {
        const { error } = await sbAdmin.from('cx_risk_register').insert({
          ...data,
          id: Date.now().toString(),
          sortOrder: risks.length,
        });
        if (error) throw error;
      }

      closeModal('risk');
      await loadData();
      alert('✅ Risk saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ Error: ' + (err.message || 'Failed to save risk'));
    }
  };

  const deleteRisk = async (id) => {
    if (!confirm('Delete?')) return;
    try {
      await sbAdmin.from('cx_risk_register').delete().eq('id', id);
      loadData();
    } catch (err) {
      alert('Error deleting');
    }
  };

  const saveUser = async () => {
    if (!form.username?.trim() || !form.display_name?.trim() || !form.password?.trim()) {
      alert('Please fill required fields');
      return;
    }

    try {
      const data = {
        username: form.username.toLowerCase(),
        display_name: form.display_name,
        password: form.password,
        email: form.email || null,
        phone: form.phone || null,
        color: form.color || '#6366f1',
        enabled: form.enabled !== false,
        is_admin: form.is_admin === true,
      };

      if (editing.user) {
        const { error } = await sbAdmin.from('cx_standup_users').update(data).eq('username', editing.user.username);
        if (error) throw error;
      } else {
        const { error } = await sbAdmin.from('cx_standup_users').insert(data);
        if (error) throw error;
      }

      closeModal('user');
      await loadData();
      alert('✅ User saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ Error: ' + (err.message || 'Failed to save user'));
    }
  };

  const deleteUser = async (username) => {
    if (!confirm('Delete user?')) return;
    try {
      await sbAdmin.from('cx_standup_users').delete().eq('username', username);
      loadData();
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const closeModal = (type) => {
    setModals({ ...modals, [type]: false });
    setEditing({ ...editing, [type]: null });
    setForm({});
  };

  const openModal = (type, record = null) => {
    if (record) {
      setEditing({ ...editing, [type]: record });
      setForm(record);
    } else {
      setForm({});
    }
    setModals({ ...modals, [type]: true });
  };

  // Drag & Drop
  const handleDragStart = (e, id, source) => {
    setDraggedId(id);
    setDragSource(source);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropStatus = async (e, status) => {
    e.preventDefault();
    if (dragSource !== 'items') return;
    try {
      await sbAdmin.from('cx_standup_items').update({ status }).eq('id', draggedId);
      loadData();
    } catch (err) {
      console.error(err);
    }
    setDraggedId(null);
  };

  const handleDropLane = async (e, lane) => {
    e.preventDefault();
    if (dragSource !== 'projects') return;
    try {
      await sbAdmin.from('cx_projects').update({ lane }).eq('id', draggedId);
      loadData();
    } catch (err) {
      console.error(err);
    }
    setDraggedId(null);
  };

  const handleDropRisk = async (e, status) => {
    e.preventDefault();
    if (dragSource !== 'risks') return;
    try {
      await sbAdmin.from('cx_risk_register').update({ status }).eq('id', draggedId);
      loadData();
    } catch (err) {
      console.error(err);
    }
    setDraggedId(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 min-h-screen flex items-center justify-center">
        <div className="card p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">CX Standup</h1>
            <p className="text-gray-600 text-sm mt-2">Sign in to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="input-field w-full"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field w-full"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-accent w-full justify-center">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <nav className="sidebar w-60 flex flex-col flex-shrink-0 min-h-screen border-r border-gray-800">
        <div className="px-4 py-5 border-b border-gray-700 text-center">
          <div className="text-white font-bold text-2xl">CX</div>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="nav-section">📊 Dashboard</div>
          <div onClick={() => setCurrentPage('dashboard')} className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}>Overview</div>

          <div className="nav-section mt-6">📋 Weekly Feedback</div>
          <div onClick={() => setCurrentPage('feedback')} className={`nav-item ${currentPage === 'feedback' ? 'active' : ''}`}>Weekly Submission</div>
          <div onClick={() => setCurrentPage('feedback-review')} className={`nav-item ${currentPage === 'feedback-review' ? 'active' : ''}`}>Review History</div>

          <div className="nav-section mt-6">⚡ Action Items</div>
          <div onClick={() => setCurrentPage('board')} className={`nav-item ${currentPage === 'board' ? 'active' : ''}`}>Priority Board</div>
          <div onClick={() => setCurrentPage('list')} className={`nav-item ${currentPage === 'list' ? 'active' : ''}`}>List View</div>
          <div onClick={() => setCurrentPage('people')} className={`nav-item ${currentPage === 'people' ? 'active' : ''}`}>By Person</div>
          <div onClick={() => setCurrentPage('summary')} className={`nav-item ${currentPage === 'summary' ? 'active' : ''}`}>Summary</div>

          <div className="nav-section mt-6">🤖 AI / Automation</div>
          <div onClick={() => setCurrentPage('projects')} className={`nav-item ${currentPage === 'projects' ? 'active' : ''}`}>AU Projects Tracker</div>

          <div className="nav-section mt-6">⚠️ Risk Register</div>
          <div onClick={() => setCurrentPage('risks')} className={`nav-item ${currentPage === 'risks' ? 'active' : ''}`}>Risk Register</div>

          {currentUser?.is_admin && (
            <>
              <div className="nav-section mt-6">⚙️ Admin</div>
              <div onClick={() => setCurrentPage('admin')} className={`nav-item ${currentPage === 'admin' ? 'active' : ''}`}>User Management</div>
            </>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
          <p>CX Standup v4.0</p>
          <button onClick={handleLogout} className="mt-2 text-gray-500 hover:text-red-400 text-xs">Logout</button>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="topbar flex items-center justify-between px-8 py-4 sticky top-0 z-10 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentPage === 'dashboard' && '📊 Dashboard'}
            {currentPage === 'feedback' && '📝 Weekly Submission'}
            {currentPage === 'feedback-review' && '📋 Weekly History Review'}
            {currentPage === 'board' && '📌 Priority Board'}
            {currentPage === 'list' && '📄 List View'}
            {currentPage === 'people' && '👥 By Person'}
            {currentPage === 'summary' && '📊 Summary'}
            {currentPage === 'projects' && '🚀 AU Projects'}
            {currentPage === 'risks' && '⚠️ Risk Register'}
            {currentPage === 'admin' && '⚙️ Admin'}
          </h2>
          <div className="flex items-center gap-4">
            {['board', 'projects', 'risks'].includes(currentPage) && (
              <button
                onClick={() => openModal(currentPage === 'board' ? 'item' : currentPage === 'projects' ? 'project' : 'risk')}
                className="btn btn-accent text-sm"
              >
                ➕ Add
              </button>
            )}
            {currentPage === 'admin' && (
              <button onClick={() => openModal('user')} className="btn btn-accent text-sm">
                ➕ Add User
              </button>
            )}
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ background: currentUser?.color || '#6366f1' }}
            >
              {currentUser?.display_name?.[0]}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {currentPage === 'dashboard' && <DashboardPage items={items} risks={risks} />}
          {currentPage === 'feedback' && <FeedbackPage currentUser={currentUser} />}
          {currentPage === 'feedback-review' && <FeedbackReviewPage currentUser={currentUser} />}
          {currentPage === 'board' && (
            <BoardPage
              items={items}
              draggedId={draggedId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDropStatus}
              onEdit={(item) => openModal('item', item)}
              onDelete={deleteItem}
              onStatusChange={updateItemStatus}
            />
          )}
          {currentPage === 'list' && (
            <ListView
              items={items}
              onEdit={(item) => openModal('item', item)}
              onDelete={deleteItem}
            />
          )}
          {currentPage === 'people' && <PeoplePage items={items} />}
          {currentPage === 'summary' && <SummaryPage items={items} />}
          {currentPage === 'projects' && (
            <ProjectsPage
              projects={projects}
              draggedId={draggedId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDropLane}
              onEdit={(project) => openModal('project', project)}
              onDelete={deleteProject}
            />
          )}
          {currentPage === 'risks' && (
            <RisksPage
              risks={risks}
              draggedId={draggedId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDropRisk}
              onEdit={(risk) => openModal('risk', risk)}
              onDelete={deleteRisk}
            />
          )}
          {currentPage === 'admin' && (
            <AdminPage
              users={users}
              onEdit={(user) => openModal('user', user)}
              onDelete={deleteUser}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {modals.item && (
        <Modal title={editing.item ? 'Edit Item' : 'Add Item'} onClose={() => closeModal('item')}>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Item title"
              className="input-field w-full"
              value={form.item || ''}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
            />
            <textarea
              placeholder="Action details"
              className="input-field w-full"
              rows="3"
              value={form.action || ''}
              onChange={(e) => setForm({ ...form, action: e.target.value })}
            />
            <select
              className="input-field w-full"
              value={form.priority || 'High'}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option>Urgent</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select
              className="input-field w-full"
              value={form.status || 'Open'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Blocked</option>
              <option>Done</option>
            </select>
            <input
              type="date"
              className="input-field w-full"
              value={form.dueDate || ''}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <button onClick={saveItem} className="btn btn-accent w-full">
              {editing.item ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>
      )}

      {modals.project && (
        <Modal title={editing.project ? 'Edit Project' : 'Add Project'} onClose={() => closeModal('project')}>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Project title"
              className="input-field w-full"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              placeholder="Description"
              className="input-field w-full"
              rows="3"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <select
              className="input-field w-full"
              value={form.lane || 'MVP'}
              onChange={(e) => setForm({ ...form, lane: e.target.value })}
            >
              <option>MVP</option>
              <option>V1.1 Post Launch</option>
              <option>V2 Future</option>
            </select>
            <button onClick={saveProject} className="btn btn-accent w-full">
              {editing.project ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>
      )}

      {modals.risk && (
        <Modal title={editing.risk ? 'Edit Risk' : 'Add Risk'} onClose={() => closeModal('risk')}>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Risk description"
              className="input-field w-full"
              value={form.risk || ''}
              onChange={(e) => setForm({ ...form, risk: e.target.value })}
            />
            <select
              className="input-field w-full"
              value={form.impact || 'Medium'}
              onChange={(e) => setForm({ ...form, impact: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
            <select
              className="input-field w-full"
              value={form.probability || 'Medium'}
              onChange={(e) => setForm({ ...form, probability: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Very High</option>
            </select>
            <textarea
              placeholder="Mitigation strategy"
              className="input-field w-full"
              rows="2"
              value={form.mitigation || ''}
              onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
            />
            <button onClick={saveRisk} className="btn btn-accent w-full">
              {editing.risk ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>
      )}

      {modals.user && (
        <Modal title={editing.user ? 'Edit User' : 'Add User'} onClose={() => closeModal('user')}>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="input-field w-full"
              value={form.username || ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={!!editing.user}
            />
            <input
              type="text"
              placeholder="Display name"
              className="input-field w-full"
              value={form.display_name || ''}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field w-full"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="input-field w-full"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="color"
              className="input-field w-full h-10"
              value={form.color || '#6366f1'}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_admin === true}
                onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Admin</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled !== false}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Enabled</span>
            </label>
            <button onClick={saveUser} className="btn btn-accent w-full">
              {editing.user ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Components
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DashboardPage({ items, risks }) {
  const stats = [
    { label: 'Total', value: items.length, color: 'indigo-600' },
    { label: 'Open', value: items.filter(i => i.status === 'Open').length, color: 'gray-400' },
    { label: 'In Progress', value: items.filter(i => i.status === 'In Progress').length, color: 'amber-500' },
    { label: 'Blocked', value: items.filter(i => i.status === 'Blocked').length, color: 'red-500' },
    { label: 'Done', value: items.filter(i => i.status === 'Done').length, color: 'green-500' },
  ];

  const overdue = items.filter(i => {
    if (!i.dueDate || i.status === 'Done') return false;
    return new Date(i.dueDate) < new Date();
  }).length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      <div className="grid grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card border-l-4 border-${stat.color}`}>
            <p className="text-xs font-semibold text-gray-600 uppercase">{stat.label}</p>
            <p className={`text-3xl font-bold mt-3 text-${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
      {(overdue > 0 || risks.filter(r => r.status === 'Open').length > 0) && (
        <div className="grid grid-cols-2 gap-6">
          {overdue > 0 && (
            <div className="card border-l-4 border-orange-500 p-6 bg-orange-50">
              <h3 className="font-semibold text-orange-900 mb-2">📅 Overdue</h3>
              <p className="text-2xl font-bold text-orange-600">{overdue}</p>
            </div>
          )}
          {risks.filter(r => r.status === 'Open').length > 0 && (
            <div className="card border-l-4 border-red-500 p-6 bg-red-50">
              <h3 className="font-semibold text-red-900 mb-2">⚠️ Open Risks</h3>
              <p className="text-2xl font-bold text-red-600">{risks.filter(r => r.status === 'Open').length}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeedbackPage({ currentUser }) {
  const [feedback, setFeedback] = React.useState({
    performance: '',
    red_flags: '',
    project_updates: '',
    key_focus: '',
    escalations: '',
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // Get current week start (Monday)
  const getWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const weekStart = getWeekStart();

  React.useEffect(() => {
    // Load existing feedback for this week
    const loadFeedback = async () => {
      try {
        const res = await fetch(`/api/feedback?owner=${currentUser.display_name}&week_start=${weekStart}`);
        const data = await res.json();
        if (data.length > 0) {
          setFeedback({
            performance: data[0].performance || '',
            red_flags: data[0].red_flags || '',
            project_updates: data[0].project_updates || '',
            key_focus: data[0].key_focus || '',
            escalations: data[0].escalations || '',
          });
          setSubmitted(data[0].status === 'Submitted');
        }
      } catch (err) {
        console.error('Error loading feedback:', err);
      }
    };
    loadFeedback();
  }, [currentUser, weekStart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: currentUser.display_name,
          week_start: weekStart,
          ...feedback,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        alert('✅ Your weekly submission has been submitted!');
      } else {
        alert('Error submitting feedback');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📝 Weekly Standup Submission</h1>
        <p className="text-sm text-gray-500 mt-1">Week starting {weekStart}</p>
        {submitted && (
          <div className="mt-2 p-3 bg-green-100 text-green-700 rounded text-sm">
            ✅ Your submission has been recorded
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Performance vs Target */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📊 Performance vs Target (Key Metrics Only)</h2>
          <p className="text-xs text-gray-500 mb-3">Share your key metrics - only the critical numbers for this week</p>
          <textarea
            value={feedback.performance}
            onChange={(e) => setFeedback({ ...feedback, performance: e.target.value })}
            placeholder="e.g., Sales: 150% of target, Quality Score: 92%, Utilization: 85%"
            className="input-field w-full"
            rows="4"
          />
        </div>

        {/* Red Flags / Issues */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🚩 Red Flags / Issues</h2>
          <p className="text-xs text-gray-500 mb-3">What do we need to be aware of? Problems, blockers, risks?</p>
          <textarea
            value={feedback.red_flags}
            onChange={(e) => setFeedback({ ...feedback, red_flags: e.target.value })}
            placeholder="e.g., Key person out sick, vendor delay, system outage..."
            className="input-field w-full"
            rows="4"
          />
        </div>

        {/* Key Project Updates */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🚀 Key Project Updates</h2>
          <p className="text-xs text-gray-500 mb-3">Status of key initiatives underway</p>
          <textarea
            value={feedback.project_updates}
            onChange={(e) => setFeedback({ ...feedback, project_updates: e.target.value })}
            placeholder="e.g., Project X: 75% complete, on track for March delivery..."
            className="input-field w-full"
            rows="4"
          />
        </div>

        {/* Key Focus Item */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🎯 Key Focus Item (This Week)</h2>
          <p className="text-xs text-gray-500 mb-3">What is your #1 priority this week?</p>
          <textarea
            value={feedback.key_focus}
            onChange={(e) => setFeedback({ ...feedback, key_focus: e.target.value })}
            placeholder="e.g., Complete recruitment for 5 open positions..."
            className="input-field w-full"
            rows="4"
          />
        </div>

        {/* Escalations */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">⬆️ Escalations</h2>
          <p className="text-xs text-gray-500 mb-3">What decisions or input do you need from leadership?</p>
          <textarea
            value={feedback.escalations}
            onChange={(e) => setFeedback({ ...feedback, escalations: e.target.value })}
            placeholder="e.g., Approval needed for budget increase, strategic decision required..."
            className="input-field w-full"
            rows="4"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-accent w-full"
        >
          {submitting ? '📤 Submitting...' : '✅ Submit My Standup Prep'}
        </button>
      </form>
    </div>
  );
}

function FeedbackReviewPage({ currentUser }) {
  const [allFeedback, setAllFeedback] = React.useState([]);
  const [selectedWeek, setSelectedWeek] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null);
  const [outcomes, setOutcomes] = React.useState('');
  const [reasons, setReasons] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadFeedback = async () => {
      try {
        const res = await fetch('/api/feedback-history');
        const data = await res.json();
        setAllFeedback(data);
        if (data.length > 0) {
          setSelectedWeek(data[0].week_start);
        }
      } catch (err) {
        console.error('Error loading feedback history:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeedback();
  }, []);

  const saveOutcomes = async (feedbackId) => {
    try {
      const res = await fetch('/api/feedback-history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feedbackId, outcomes, reasons }),
      });
      if (res.ok) {
        setEditingId(null);
        // Reload
        const res2 = await fetch('/api/feedback-history');
        const data = await res2.json();
        setAllFeedback(data);
        alert('✅ Outcomes updated');
      } else {
        alert('Error saving outcomes');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const weeks = [...new Set(allFeedback.map(f => f.week_start))].sort().reverse();
  const weekData = allFeedback.filter(f => f.week_start === selectedWeek);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📋 Weekly History Review</h1>
        <p className="text-sm text-gray-500 mt-1">Review what was planned vs what was done</p>
      </div>

      {/* Week Selector */}
      {weeks.length > 0 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {weeks.map((week) => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                selectedWeek === week
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {week}
            </button>
          ))}
        </div>
      )}

      {/* Team Feedback Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {weekData.map((feedback) => (
          <div key={feedback.id} className="card p-6 border border-gray-200">
            {/* Person + Status */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{feedback.owner}</h3>
              <span className={`px-3 py-1 rounded text-xs font-medium ${
                feedback.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {feedback.status || 'Draft'}
              </span>
            </div>

            {/* Original Submission */}
            <div className="space-y-4 mb-6 pb-6 border-b">
              {feedback.performance && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">📊 Performance</h4>
                  <p className="text-sm text-gray-700">{feedback.performance}</p>
                </div>
              )}
              {feedback.red_flags && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">🚩 Red Flags</h4>
                  <p className="text-sm text-gray-700">{feedback.red_flags}</p>
                </div>
              )}
              {feedback.project_updates && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">🚀 Projects</h4>
                  <p className="text-sm text-gray-700">{feedback.project_updates}</p>
                </div>
              )}
              {feedback.key_focus && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">🎯 Key Focus</h4>
                  <p className="text-sm text-gray-700">{feedback.key_focus}</p>
                </div>
              )}
              {feedback.escalations && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">⬆️ Escalations</h4>
                  <p className="text-sm text-gray-700">{feedback.escalations}</p>
                </div>
              )}
            </div>

            {/* Outcomes Review */}
            {editingId === feedback.id ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">What was actually done?</label>
                  <textarea
                    value={outcomes}
                    onChange={(e) => setOutcomes(e.target.value)}
                    placeholder="Describe outcomes, what was completed..."
                    className="input-field w-full mt-1"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Reasons for changes/delays</label>
                  <textarea
                    value={reasons}
                    onChange={(e) => setReasons(e.target.value)}
                    placeholder="Why didn't we do what was planned? What changed?"
                    className="input-field w-full mt-1"
                    rows="3"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveOutcomes(feedback.id)}
                    className="btn btn-accent text-sm flex-1"
                  >
                    Save Outcomes
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="btn text-sm flex-1"
                    style={{ background: '#f3f4f6', color: '#374151' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {feedback.outcomes ? (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-green-600 uppercase mb-1">✅ What was done</h4>
                      <p className="text-sm text-gray-700">{feedback.outcomes}</p>
                    </div>
                    {feedback.reasons && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-600 uppercase mb-1">⚡ Reasons</h4>
                        <p className="text-sm text-gray-700">{feedback.reasons}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No outcomes recorded yet</p>
                )}
                <button
                  onClick={() => {
                    setEditingId(feedback.id);
                    setOutcomes(feedback.outcomes || '');
                    setReasons(feedback.reasons || '');
                  }}
                  className="btn text-sm mt-3 w-full"
                  style={{ background: '#f3f4f6', color: '#374151' }}
                >
                  {feedback.outcomes ? 'Edit Outcomes' : 'Add Outcomes'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {weekData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No submissions for this week
        </div>
      )}
    </div>
  );
}

function BoardPage({ items, draggedId, onDragStart, onDragOver, onDrop, onEdit, onDelete, onStatusChange }) {
  const statuses = ['Open', 'In Progress', 'Blocked', 'Done'];
  
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };
  
  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };
  
  return (
    <div className="grid grid-cols-4 gap-6">
      {statuses.map((status) => (
        <div
          key={status}
          className="lane"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, status)}
        >
          <div className="lane-header font-semibold text-gray-800 bg-gray-200">{status}</div>
          <div className="lane-body">
            {items
              .filter((i) => i.status === status)
              .map((item) => {
                const overdue = isOverdue(item.due_date);
                const daysLeft = getDaysUntilDue(item.due_date);
                return (
                  <div
                    key={item.id}
                    className={`drag-card ${overdue ? 'border-l-4 border-red-500 bg-red-50' : ''}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.id, 'items')}
                    style={overdue ? { borderLeft: '4px solid #ef4444' } : {}}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <div className="font-semibold text-sm text-gray-900">{item.item}</div>
                          {overdue && <span title="Overdue">🔴</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="btn-danger"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{item.action}</p>
                    <div className="flex gap-1 flex-wrap text-xs mb-2">
                      <span className="badge badge-gray">{item.priority}</span>
                      {item.due_date && (
                        <span 
                          className={`badge ${overdue ? 'bg-red-100 text-red-700' : daysLeft <= 3 ? 'bg-yellow-100 text-yellow-700' : 'badge-blue'}`}
                        >
                          {overdue ? '⚠️ ' : daysLeft <= 3 ? '⏰ ' : ''}{item.due_date} {daysLeft !== null && `(${daysLeft}d)`}
                        </span>
                      )}
                    </div>
                    {onStatusChange && (
                      <select
                        value={item.status}
                        onChange={(e) => onStatusChange(item.id, e.target.value)}
                        className="input-field w-full text-xs"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListView({ items, onEdit, onDelete }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="card p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.item}</h3>
              <p className="text-sm text-gray-600 mt-1">{item.action}</p>
            </div>
            <div className="flex gap-1">
              <span className="badge badge-gray">{item.status}</span>
              <span className="badge badge-gray">{item.priority}</span>
              <button onClick={() => onDelete(item.id)} className="btn-danger">✕</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PeoplePage({ items }) {
  return (
    <div className="space-y-4">
      {OWNERS.map((owner) => {
        const ownerItems = items.filter((i) => (i.owners || [i.owner]).includes(owner));
        if (!ownerItems.length) return null;
        return (
          <div key={owner} className="card overflow-hidden">
            <div className="card-header font-semibold" style={{ borderLeftColor: OWNER_COLORS[owner], borderLeftWidth: '4px' }}>
              {owner} ({ownerItems.length})
            </div>
            <div className="p-4 space-y-2">
              {ownerItems.map((item) => (
                <div key={item.id} className="border-l-2 pl-3 py-2">
                  <p className="font-medium text-sm">{item.item}</p>
                  <span className="badge badge-gray text-xs mt-1">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryPage({ items }) {
  const statuses = ['Open', 'In Progress', 'Blocked', 'Done'];
  return (
    <div className="grid grid-cols-4 gap-6">
      {statuses.map((status) => {
        const statusItems = items.filter((i) => i.status === status);
        return (
          <div key={status} className="card overflow-hidden">
            <div className="card-header bg-gray-100 font-semibold">{status}</div>
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
  );
}

function ProjectsPage({ projects, draggedId, onDragStart, onDragOver, onDrop, onEdit, onDelete }) {
  const statuses = ['Active', 'Completed', 'On Hold'];
  return (
    <div className="grid grid-cols-3 gap-6">
      {statuses.map((status) => (
        <div
          key={status}
          className="lane"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, status)}
        >
          <div className="lane-header font-semibold text-gray-800 bg-gray-200">{status}</div>
          <div className="lane-body">
            {projects
              .filter((p) => p.status === status)
              .map((project) => (
                <div
                  key={project.id}
                  className="drag-card"
                  draggable
                  onDragStart={(e) => onDragStart(e, project.id, 'projects')}
                >
                  <div className="flex justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm text-gray-900">{project.name}</h4>
                    <button onClick={() => onDelete(project.id)} className="btn-danger">✕</button>
                  </div>
                  <p className="text-xs text-gray-600">{project.description}</p>
                  <p className="text-xs text-gray-500 mt-2">Owner: {project.owner}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RisksPage({ risks, draggedId, onDragStart, onDragOver, onDrop, onEdit, onDelete }) {
  const statuses = ['Open', 'Closed'];
  return (
    <div className="grid grid-cols-3 gap-6">
      {statuses.map((status) => (
        <div
          key={status}
          className="lane"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, status)}
        >
          <div className="lane-header font-semibold text-gray-800 bg-gray-200">{status}</div>
          <div className="lane-body">
            {risks
              .filter((r) => r.status === status)
              .map((risk) => (
                <div
                  key={risk.id}
                  className="drag-card"
                  draggable
                  onDragStart={(e) => onDragStart(e, risk.id, 'risks')}
                >
                  <div className="flex justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm text-gray-900">{risk.risk}</h4>
                    <button onClick={() => onDelete(risk.id)} className="btn-danger">✕</button>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{risk.impact} / {risk.probability}</p>
                  {risk.mitigation && <p className="text-xs text-gray-600">{risk.mitigation}</p>}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminPage({ users, onEdit, onDelete }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="stat-card">
          <p className="text-xs text-gray-600">Active Users</p>
          <p className="text-2xl font-bold text-green-600">{users.filter(u => u.enabled !== false).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-600">Disabled</p>
          <p className="text-2xl font-bold text-red-600">{users.filter(u => u.enabled === false).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-600">Admins</p>
          <p className="text-2xl font-bold text-indigo-600">{users.filter(u => u.is_admin).length}</p>
        </div>
      </div>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.username}
            className="card p-4"
            style={{ borderLeftColor: user.color, borderLeftWidth: '4px' }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">{user.display_name}</h3>
                <p className="text-xs text-gray-600">@{user.username}</p>
              </div>
              <div className="flex gap-2">
                {user.is_admin && <span className="badge badge-purple">Admin</span>}
                {user.enabled === false && <span className="badge badge-red">Disabled</span>}
                <button onClick={() => onEdit(user)} className="btn text-xs bg-gray-100">Edit</button>
                <button onClick={() => onDelete(user.username)} className="btn-danger">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// Force rebuild Fri Mar 20 14:41:49 GMT 2026
