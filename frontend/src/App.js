import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ENV = process.env.REACT_APP_ENV || 'development';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      setTasks(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), priority }),
      });
      const task = await res.json();
      setTasks(prev => [task, ...prev]);
      setNewTitle('');
    } catch (e) {
      setError(e.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteTask(id) {
    try {
      await fetch(`${API_URL}/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  const byStatus = status => tasks.filter(t => t.status === status);

  return (
    <div className="app">
      <header>
        <h1>Task<span>Flow</span></h1>
        <span className="env-badge">{ENV}</span>
      </header>

      <form className="add-task" onSubmit={addTask}>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
        />
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button type="submit">Add Task</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading tasks...</p>}

      {!loading && (
        <div className="columns">
          <Column title="To Do" status="todo" tasks={byStatus('todo')} onUpdate={updateStatus} onDelete={deleteTask} next="in-progress" nextLabel="Start" />
          <Column title="In Progress" status="progress" tasks={byStatus('in-progress')} onUpdate={updateStatus} onDelete={deleteTask} prev="todo" prevLabel="Back" next="done" nextLabel="Done" />
          <Column title="Done" status="done" tasks={byStatus('done')} onUpdate={updateStatus} onDelete={deleteTask} prev="in-progress" prevLabel="Reopen" />
        </div>
      )}
    </div>
  );
}

function Column({ title, status, tasks, onUpdate, onDelete, next, nextLabel, prev, prevLabel }) {
  return (
    <div className={`column ${status === 'in-progress' ? 'progress' : status}`}>
      <h2>{title} ({tasks.length})</h2>
      {tasks.map(task => (
        <div key={task.id} className="task-card">
          <div className="title">{task.title}</div>
          <div className="task-meta">
            <span className={`priority ${task.priority}`}>{task.priority}</span>
            <div className="task-actions">
              {prev && <button onClick={() => onUpdate(task.id, prev)}>{prevLabel}</button>}
              {next && <button onClick={() => onUpdate(task.id, next)}>{nextLabel}</button>}
              <button className="del" onClick={() => onDelete(task.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
