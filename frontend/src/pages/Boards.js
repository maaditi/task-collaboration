import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Boards = () => {
  const [boards, setBoards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '', backgroundColor: '#0079bf' });
  const [editingBoard, setEditingBoard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, [searchTerm]);

  const fetchBoards = async () => {
    try {
      const response = await api.get(`/boards${searchTerm ? `?search=${searchTerm}` : ''}`);
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
      setNewBoard({ title: '', description: '', backgroundColor: '#0079bf' });
      fetchBoards();
    } catch (error) {
      toast.error('Failed to create board');
    }
  };

  const openEditModal = (e, board) => {
    e.stopPropagation();
    setEditingBoard(board);
    setNewBoard({
      title: board.title,
      description: board.description,
      backgroundColor: board.backgroundColor
    });
    setShowEditModal(true);
  };

  const updateBoard = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/boards/${editingBoard._id}`, newBoard);
      toast.success('Board updated!');
      setShowEditModal(false);
      setEditingBoard(null);
      setNewBoard({ title: '', description: '', backgroundColor: '#0079bf' });
      fetchBoards();
    } catch (error) {
      toast.error('Failed to update board');
    }
  };

  const deleteBoard = async (e, boardId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) return;
    try {
      await api.delete(`/boards/${boardId}`);
      toast.success('Board deleted!');
      fetchBoards();
    } catch (error) {
      toast.error('Failed to delete board');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-600">TaskFlow</h1>
            <div className="hidden md:block">
              <input
                type="text"
                placeholder="Search boards..."
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-semibold">{user?.name}</span>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Your Boards ({boards.length})</h2>
          <button onClick={() => { setNewBoard({ title: '', description: '', backgroundColor: '#0079bf' }); setShowModal(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-lg">+ Create Board</button>
        </div>
        {boards.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl text-gray-600 mb-4">No boards yet</h3>
            <p className="text-gray-500 mb-6">Create your first board to get started!</p>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">+ Create Your First Board</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map(board => (
              <div key={board._id} onClick={() => navigate(`/board/${board._id}`)} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer relative group" style={{ borderTop: `4px solid ${board.backgroundColor}` }}>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  {board.owner._id === user._id && (
                    <>
                      <button onClick={(e) => openEditModal(e, board)} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600" title="Edit board">✏️</button>
                      <button onClick={(e) => deleteBoard(e, board._id)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600" title="Delete board">🗑️</button>
                    </>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 pr-20">{board.title}</h3>
                <p className="text-gray-600 mb-4">{board.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {board.members?.slice(0, 5).map((member, idx) => (
                      <div key={idx} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center border-2 border-white text-xs" title={member.name}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {board.members?.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center border-2 border-white text-xs">
                        +{board.members.length - 5}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{board.owner._id === user._id ? 'Owner' : 'Member'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Create New Board</h3>
            <form onSubmit={createBoard}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title *</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={newBoard.title} onChange={(e) => setNewBoard({...newBoard, title: e.target.value})} required placeholder="My awesome board" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={newBoard.description} onChange={(e) => setNewBoard({...newBoard, description: e.target.value})} rows="3" placeholder="What is this board about?" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {['#0079bf', '#d29034', '#519839', '#b04632', '#89609e', '#cd5a91'].map(color => (
                    <div key={color} onClick={() => setNewBoard({...newBoard, backgroundColor: color})} className={`w-10 h-10 rounded cursor-pointer border-2 ${newBoard.backgroundColor === color ? 'border-black' : 'border-gray-300'}`} style={{ backgroundColor: color }}></div>
                  ))}
                  <input type="color" className="w-10 h-10 rounded cursor-pointer" value={newBoard.backgroundColor} onChange={(e) => setNewBoard({...newBoard, backgroundColor: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {showEditModal && editingBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Edit Board</h3>
            <form onSubmit={updateBoard}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title *</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={newBoard.title} onChange={(e) => setNewBoard({...newBoard, title: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={newBoard.description} onChange={(e) => setNewBoard({...newBoard, description: e.target.value})} rows="3" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {['#0079bf', '#d29034', '#519839', '#b04632', '#89609e', '#cd5a91'].map(color => (
                    <div key={color} onClick={() => setNewBoard({...newBoard, backgroundColor: color})} className={`w-10 h-10 rounded cursor-pointer border-2 ${newBoard.backgroundColor === color ? 'border-black' : 'border-gray-300'}`} style={{ backgroundColor: color }}></div>
                  ))}
                  <input type="color" className="w-10 h-10 rounded cursor-pointer" value={newBoard.backgroundColor} onChange={(e) => setNewBoard({...newBoard, backgroundColor: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Update</button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingBoard(null); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Boards;
