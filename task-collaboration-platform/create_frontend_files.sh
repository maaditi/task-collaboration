#!/bin/bash

# Create Boards page
cat > frontend/src/pages/Boards.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Boards = () => {
  const [boards, setBoards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await api.get('/boards');
      setBoards(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch boards');
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    try {
      await api.post('/boards', newBoard);
      toast.success('Board created!');
      setShowModal(false);
      setNewBoard({ title: '', description: '' });
      fetchBoards();
    } catch (error) {
      toast.error('Failed to create board');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">TaskFlow</h1>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Your Boards</h2>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">+ Create Board</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map(board => (
            <div key={board._id} onClick={() => navigate(`/board/${board._id}`)} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer" style={{ borderTop: `4px solid ${board.backgroundColor}` }}>
              <h3 className="text-xl font-bold mb-2">{board.title}</h3>
              <p className="text-gray-600">{board.description}</p>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-500">{board.members?.length || 0} members</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Create New Board</h3>
            <form onSubmit={createBoard}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" value={newBoard.title} onChange={(e) => setNewBoard({...newBoard, title: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea className="w-full px-4 py-2 border rounded-lg" value={newBoard.description} onChange={(e) => setNewBoard({...newBoard, description: e.target.value})} rows="3" />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Boards;
EOF

# Create Board Detail page
cat > frontend/src/pages/BoardDetail.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState({});
  const [newListTitle, setNewListTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState({});

  useEffect(() => {
    fetchBoardData();
    socketService.connect();
    socketService.joinBoard(id);

    socketService.on('list-created', handleListCreated);
    socketService.on('task-created', handleTaskCreated);
    socketService.on('task-moved', handleTaskMoved);
    socketService.on('task-updated', handleTaskUpdated);

    return () => {
      socketService.leaveBoard(id);
      socketService.off('list-created', handleListCreated);
      socketService.off('task-created', handleTaskCreated);
      socketService.off('task-moved', handleTaskMoved);
      socketService.off('task-updated', handleTaskUpdated);
    };
  }, [id]);

  const fetchBoardData = async () => {
    try {
      const [boardRes, listsRes, tasksRes] = await Promise.all([
        api.get(`/boards/${id}`),
        api.get(`/boards/${id}/lists`),
        api.get(`/boards/${id}/tasks`)
      ]);
      setBoard(boardRes.data.data);
      setLists(listsRes.data.data);
      const tasksByList = {};
      tasksRes.data.data.forEach(task => {
        if (!tasksByList[task.list]) tasksByList[task.list] = [];
        tasksByList[task.list].push(task);
      });
      setTasks(tasksByList);
    } catch (error) {
      toast.error('Failed to load board');
    }
  };

  const handleListCreated = (data) => {
    setLists(prev => [...prev, data.list]);
  };

  const handleTaskCreated = (data) => {
    setTasks(prev => ({
      ...prev,
      [data.task.list]: [...(prev[data.task.list] || []), data.task]
    }));
  };

  const handleTaskMoved = (data) => {
    fetchBoardData();
  };

  const handleTaskUpdated = (data) => {
    fetchBoardData();
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      const res = await api.post(`/boards/${id}/lists`, { title: newListTitle });
      setLists([...lists, res.data.data]);
      socketService.emitListCreated({ boardId: id, list: res.data.data });
      setNewListTitle('');
      toast.success('List created!');
    } catch (error) {
      toast.error('Failed to create list');
    }
  };

  const createTask = async (listId) => {
    const title = newTaskTitle[listId];
    if (!title?.trim()) return;
    try {
      const res = await api.post(`/lists/${listId}/tasks`, { title });
      setTasks(prev => ({
        ...prev,
        [listId]: [...(prev[listId] || []), res.data.data]
      }));
      socketService.emitTaskCreated({ boardId: id, task: res.data.data });
      setNewTaskTitle({ ...newTaskTitle, [listId]: '' });
      toast.success('Task created!');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    
    try {
      await api.put(`/tasks/${draggableId}/move`, {
        listId: destination.droppableId,
        position: destination.index
      });
      socketService.emitTaskMoved({ boardId: id, taskId: draggableId, from: source.droppableId, to: destination.droppableId });
      fetchBoardData();
    } catch (error) {
      toast.error('Failed to move task');
    }
  };

  if (!board) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-200">
      <nav className="bg-white shadow-lg p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/boards')} className="text-blue-600 hover:underline">← Back</button>
          <h1 className="text-2xl font-bold">{board.title}</h1>
        </div>
      </nav>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="p-6 flex gap-4 overflow-x-auto">
          {lists.map(list => (
            <div key={list._id} className="bg-gray-100 rounded-lg p-4 min-w-[300px] max-w-[300px]">
              <h3 className="font-bold mb-4">{list.title}</h3>
              <Droppable droppableId={list._id}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="min-h-[100px]">
                    {(tasks[list._id] || []).map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white p-3 rounded mb-2 shadow hover:shadow-lg cursor-pointer">
                            <p className="font-medium">{task.title}</p>
                            {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <div className="mt-4">
                <input type="text" placeholder="Add a task..." className="w-full px-3 py-2 border rounded" value={newTaskTitle[list._id] || ''} onChange={(e) => setNewTaskTitle({...newTaskTitle, [list._id]: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && createTask(list._id)} />
              </div>
            </div>
          ))}
          <div className="bg-gray-100 rounded-lg p-4 min-w-[300px] max-w-[300px]">
            <form onSubmit={createList}>
              <input type="text" placeholder="+ Add list" className="w-full px-3 py-2 border rounded" value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} />
            </form>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default BoardDetail;
EOF

# Create App.js
cat > frontend/src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Boards from './pages/Boards';
import BoardDetail from './pages/BoardDetail';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/boards" element={<PrivateRoute><Boards /></PrivateRoute>} />
          <Route path="/board/:id" element={<PrivateRoute><BoardDetail /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/boards" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
EOF

# Create index.js
cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
EOF

# Create index.css
cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
EOF

echo "Frontend files created successfully!"
