import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api from "../services/api";
import socketService from "../services/socket";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import ActivityLog from "./ActivityLog";

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [newListTitle, setNewListTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState({});
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showActivity, setShowActivity] = useState(false);
  const [editBoardData, setEditBoardData] = useState({
    title: "",
    description: "",
    backgroundColor: "",
  });

  useEffect(() => {
    fetchBoardData();
    socketService.connect();
    socketService.joinBoard(id);

    socketService.on("list-created", handleListCreated);
    socketService.on("list-updated", handleListUpdated);
    socketService.on("list-deleted", handleListDeleted);
    socketService.on("task-created", handleTaskCreated);
    socketService.on("task-updated", handleTaskUpdated);
    socketService.on("task-moved", handleTaskMoved);
    socketService.on("task-deleted", handleTaskDeleted);
    socketService.on("board-updated", handleBoardUpdated);

    return () => {
      socketService.leaveBoard(id);
      socketService.off("list-created", handleListCreated);
      socketService.off("list-updated", handleListUpdated);
      socketService.off("list-deleted", handleListDeleted);
      socketService.off("task-created", handleTaskCreated);
      socketService.off("task-updated", handleTaskUpdated);
      socketService.off("task-moved", handleTaskMoved);
      socketService.off("task-deleted", handleTaskDeleted);
      socketService.off("board-updated", handleBoardUpdated);
    };
  }, [id]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const [boardRes, listsRes, tasksRes] = await Promise.all([
        api.get(`/boards/${id}`),
        api.get(`/boards/${id}/lists`),
        api.get(`/boards/${id}/tasks`),
      ]);

      setBoard(boardRes.data.data);
      setEditBoardData({
        title: boardRes.data.data.title,
        description: boardRes.data.data.description,
        backgroundColor: boardRes.data.data.backgroundColor,
      });

      const fetchedLists = listsRes.data.data;
      setLists(fetchedLists);

      const tasksByList = {};
      fetchedLists.forEach((list) => {
        tasksByList[list._id] = [];
      });

      tasksRes.data.data.forEach((task) => {
        const listId = task.list;
        if (tasksByList[listId]) {
          tasksByList[listId].push(task);
        }
      });

      setTasks(tasksByList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching board data:", error);
      toast.error("Failed to load board");
      setLoading(false);
    }
  };

  const handleListCreated = (data) => {
    setLists((prev) => [...prev, data.list]);
    setTasks((prev) => ({ ...prev, [data.list._id]: [] }));
  };

  const handleListUpdated = (data) => {
    setLists((prev) =>
      prev.map((list) => (list._id === data.list._id ? data.list : list)),
    );
  };

  const handleListDeleted = (data) => {
    setLists((prev) => prev.filter((list) => list._id !== data.listId));
    setTasks((prev) => {
      const newTasks = { ...prev };
      delete newTasks[data.listId];
      return newTasks;
    });
  };

  const handleTaskCreated = (data) => {
    const listId = data.task.list;
    setTasks((prev) => ({
      ...prev,
      [listId]: [...(prev[listId] || []), data.task],
    }));
  };

  const handleTaskUpdated = (data) => {
    setTasks((prev) => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach((listId) => {
        newTasks[listId] = newTasks[listId].map((task) =>
          task._id === data.task._id ? data.task : task,
        );
      });
      return newTasks;
    });
  };

  const handleTaskMoved = () => {
    fetchBoardData();
  };

  const handleTaskDeleted = (data) => {
    setTasks((prev) => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach((listId) => {
        newTasks[listId] = newTasks[listId].filter(
          (task) => task._id !== data.taskId,
        );
      });
      return newTasks;
    });
  };

  const handleBoardUpdated = (data) => {
    setBoard(data.board);
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      const res = await api.post(`/boards/${id}/lists`, {
        title: newListTitle,
      });
      const newList = res.data.data;
      setLists([...lists, newList]);
      setTasks((prev) => ({ ...prev, [newList._id]: [] }));
      socketService.emitListCreated({ boardId: id, list: newList });
      setNewListTitle("");
      toast.success("List created!");
    } catch (error) {
      toast.error("Failed to create list");
    }
  };

  const updateList = async (listId, title) => {
    try {
      const res = await api.put(`/lists/${listId}`, { title });
      setLists(lists.map((l) => (l._id === listId ? res.data.data : l)));
      socketService.emitListUpdated({ boardId: id, list: res.data.data });
      toast.success("List updated!");
    } catch (error) {
      toast.error("Failed to update list");
    }
  };

  const deleteList = async (listId) => {
    if (!window.confirm("Delete this list and all its tasks?")) return;
    try {
      await api.delete(`/lists/${listId}`);
      setLists(lists.filter((l) => l._id !== listId));
      setTasks((prev) => {
        const newTasks = { ...prev };
        delete newTasks[listId];
        return newTasks;
      });
      socketService.emitListDeleted({ boardId: id, listId });
      toast.success("List deleted!");
    } catch (error) {
      toast.error("Failed to delete list");
    }
  };

  const createTask = async (listId) => {
    const title = newTaskTitle[listId];
    if (!title?.trim()) return;
    try {
      const res = await api.post(`/lists/${listId}/tasks`, { title });
      setTasks((prev) => ({
        ...prev,
        [listId]: [...(prev[listId] || []), res.data.data],
      }));
      socketService.emitTaskCreated({ boardId: id, task: res.data.data });
      setNewTaskTitle({ ...newTaskTitle, [listId]: "" });
      toast.success("Task created!");
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const updateTask = async (taskData) => {
    try {
      const res = await api.put(`/tasks/${selectedTask._id}`, taskData);
      setTasks((prev) => {
        const newTasks = { ...prev };
        Object.keys(newTasks).forEach((listId) => {
          newTasks[listId] = newTasks[listId].map((task) =>
            task._id === selectedTask._id ? res.data.data : task,
          );
        });
        return newTasks;
      });
      socketService.emitTaskUpdated({ boardId: id, task: res.data.data });
      setShowTaskModal(false);
      setSelectedTask(null);
      toast.success("Task updated!");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (taskId, listId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => ({
        ...prev,
        [listId]: (prev[listId] || []).filter((task) => task._id !== taskId),
      }));
      socketService.emitTaskDeleted({ boardId: id, taskId });
      setShowTaskModal(false);
      toast.success("Task deleted!");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    try {
      const sourceTasks = Array.from(tasks[sourceId] || []);
      const destTasks =
        sourceId === destId ? sourceTasks : Array.from(tasks[destId] || []);

      const [movedTask] = sourceTasks.splice(source.index, 1);

      if (sourceId === destId) {
        sourceTasks.splice(destination.index, 0, movedTask);
        setTasks((prev) => ({ ...prev, [sourceId]: sourceTasks }));
      } else {
        destTasks.splice(destination.index, 0, movedTask);
        setTasks((prev) => ({
          ...prev,
          [sourceId]: sourceTasks,
          [destId]: destTasks,
        }));
      }

      await api.put(`/tasks/${draggableId}/move`, {
        listId: destination.droppableId,
        position: destination.index,
      });

      socketService.emitTaskMoved({
        boardId: id,
        taskId: draggableId,
        from: source.droppableId,
        to: destination.droppableId,
      });

      toast.success("Task moved!");
    } catch (error) {
      console.error("Move error:", error);
      toast.error("Failed to move task");
      fetchBoardData();
    }
  };

  const updateBoard = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/boards/${id}`, editBoardData);
      setBoard(res.data.data);
      socketService.emitBoardUpdate({ boardId: id, board: res.data.data });
      setShowEditBoardModal(false);
      toast.success("Board updated!");
    } catch (error) {
      toast.error("Failed to update board");
    }
  };

  const deleteBoard = async () => {
    if (
      !window.confirm("Delete this board permanently? This cannot be undone!")
    )
      return;
    try {
      await api.delete(`/boards/${id}`);
      toast.success("Board deleted!");
      navigate("/boards");
    } catch (error) {
      toast.error("Failed to delete board");
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/boards/${id}/members`, {
        userId: memberEmail,
      });
      setBoard(res.data.data);
      setShowAddMemberModal(false);
      setMemberEmail("");
      setSearchResults([]);
      toast.success("Member added!");
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?query=${query}`);
      const filtered = res.data.data.filter(
        (u) => !board.members.some((member) => member._id === u._id),
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const selectUserToAdd = (userId) => {
    setMemberEmail(userId);
    setSearchResults([]);
  };

  if (loading || !board) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Navbar */}
      <nav className="bg-white shadow-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/boards")}
              className="text-blue-600 hover:underline"
            >
              ← Back to Boards
            </button>
            <h1 className="text-2xl font-bold">{board.title}</h1>
            <button
              onClick={() => setShowEditBoardModal(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              ✏️ Edit
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {board.members?.slice(0, 5).map((member) => (
                <div
                  key={member._id}
                  className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center border-2 border-white"
                  title={member.name}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Add Member
            </button>

            {/* ✅ Activity Button */}
            <button
              onClick={() => setShowActivity(!showActivity)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              📋 Activity
            </button>

            {board.owner._id === user._id && (
              <button
                onClick={deleteBoard}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete Board
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="p-6 flex gap-4 overflow-x-auto">
          {lists.map((list) => {
            const listTasks = tasks[list._id] || [];

            return (
              <div
                key={list._id}
                className="bg-gray-100 rounded-lg p-4 min-w-[300px] max-w-[300px]"
              >
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    className="font-bold bg-transparent border-none outline-none flex-1"
                    defaultValue={list.title}
                    onBlur={(e) =>
                      e.target.value !== list.title &&
                      updateList(list._id, e.target.value)
                    }
                  />
                  <button
                    onClick={() => deleteList(list._id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    🗑️
                  </button>
                </div>

                <Droppable droppableId={list._id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[100px] transition ${
                        snapshot.isDraggingOver ? "bg-blue-50 rounded" : ""
                      }`}
                    >
                      {listTasks.map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-3 rounded mb-2 shadow hover:shadow-lg cursor-pointer transition ${
                                snapshot.isDragging
                                  ? "opacity-70 shadow-2xl"
                                  : ""
                              }`}
                              onClick={() => openTaskModal(task)}
                            >
                              <p className="font-medium">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                {task.priority && (
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      task.priority === "urgent"
                                        ? "bg-red-200 text-red-800"
                                        : task.priority === "high"
                                          ? "bg-orange-200 text-orange-800"
                                          : task.priority === "medium"
                                            ? "bg-yellow-200 text-yellow-800"
                                            : "bg-green-200 text-green-800"
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                )}
                                {task.assignedTo?.length > 0 && (
                                  <div className="flex -space-x-2">
                                    {task.assignedTo.slice(0, 3).map((u) => (
                                      <div
                                        key={u._id}
                                        className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs border-2 border-white"
                                        title={u.name}
                                      >
                                        {u.name.charAt(0).toUpperCase()}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="+ Add a task..."
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTaskTitle[list._id] || ""}
                    onChange={(e) =>
                      setNewTaskTitle({
                        ...newTaskTitle,
                        [list._id]: e.target.value,
                      })
                    }
                    onKeyPress={(e) =>
                      e.key === "Enter" && createTask(list._id)
                    }
                  />
                </div>
              </div>
            );
          })}

          {/* Add New List */}
          <div className="bg-gray-100 rounded-lg p-4 min-w-[300px] max-w-[300px]">
            <form onSubmit={createList}>
              <input
                type="text"
                placeholder="+ Add list"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
              />
            </form>
          </div>
        </div>
      </DragDropContext>

      {/* ✅ Activity Sidebar */}
      {showActivity && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-40 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Activity Log</h2>
            <button
              onClick={() => setShowActivity(false)}
              className="text-gray-600 text-2xl hover:text-gray-800"
            >
              ×
            </button>
          </div>
          <ActivityLog boardId={id} />
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onUpdate={updateTask}
          onDelete={() => deleteTask(selectedTask._id, selectedTask.list)}
          boardMembers={board.members}
        />
      )}

      {/* Edit Board Modal */}
      {showEditBoardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Edit Board</h3>
            <form onSubmit={updateBoard}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editBoardData.title}
                  onChange={(e) =>
                    setEditBoardData({
                      ...editBoardData,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editBoardData.description}
                  onChange={(e) =>
                    setEditBoardData({
                      ...editBoardData,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Background Color
                </label>
                <input
                  type="color"
                  className="w-full h-10 border rounded-lg"
                  value={editBoardData.backgroundColor}
                  onChange={(e) =>
                    setEditBoardData({
                      ...editBoardData,
                      backgroundColor: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditBoardModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Add Member to Board</h3>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Search by name or email
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={memberEmail}
                onChange={(e) => {
                  setMemberEmail(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Type to search users..."
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mb-4 max-h-60 overflow-y-auto border rounded-lg">
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => selectUserToAdd(u._id)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-gray-600">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={addMember}>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={!memberEmail}
                >
                  Add Member
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setMemberEmail("");
                    setSearchResults([]);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="mt-4 text-sm text-gray-600">
              <p>💡 Tip: Type at least 2 characters to search for users</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskModal = ({ task, onClose, onUpdate, onDelete, boardMembers }) => {
  const [formData, setFormData] = useState({
    title: task.title || "",
    description: task.description || "",
    priority: task.priority || "medium",
    dueDate: task.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : "",
    labels: task.labels?.join(", ") || "",
    assignedTo: task.assignedTo?.map((u) => u._id) || [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...formData,
      labels: formData.labels
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l),
      dueDate: formData.dueDate || undefined,
    });
  };

  const toggleAssignee = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter((id) => id !== userId)
        : [...prev.assignedTo, userId],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">Task Details</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">
              Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="4"
              placeholder="Add a more detailed description..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">
                Priority
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">
                Due Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">
              Labels (comma-separated)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.labels}
              onChange={(e) =>
                setFormData({ ...formData, labels: e.target.value })
              }
              placeholder="bug, feature, urgent"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">
              Assign Members
            </label>
            <div className="grid grid-cols-2 gap-2">
              {boardMembers?.map((member) => (
                <div
                  key={member._id}
                  onClick={() => toggleAssignee(member._id)}
                  className={`p-2 border rounded cursor-pointer hover:bg-gray-50 flex items-center gap-2 ${
                    formData.assignedTo.includes(member._id)
                      ? "bg-blue-50 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-gray-600">{member.email}</div>
                  </div>
                  {formData.assignedTo.includes(member._id) && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Delete Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-600">
            Created by: {task.createdBy?.name} on{" "}
            {new Date(task.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoardDetail;
