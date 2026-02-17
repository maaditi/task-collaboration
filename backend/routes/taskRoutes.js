const express = require("express");
const router = express.Router({ mergeParams: true });
const Task = require("../models/Task");
const List = require("../models/List");
const Activity = require("../models/Activity");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Auth middleware
const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};

// GET /api/lists/:listId/tasks
router.get("/", protect, async (req, res) => {
  try {
    const tasks = await Task.find({
      list: req.params.listId,
      isArchived: false,
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ position: 1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/lists/:listId/tasks
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, priority, dueDate, labels, assignedTo } =
      req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const list = await List.findById(req.params.listId);
    if (!list) {
      return res
        .status(404)
        .json({ success: false, message: "List not found" });
    }

    const taskCount = await Task.countDocuments({ list: req.params.listId });

    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      priority: priority || "medium",
      dueDate: dueDate || null,
      labels: labels || [],
      assignedTo: assignedTo || [],
      list: req.params.listId,
      board: list.board,
      createdBy: req.user._id,
      position: taskCount,
    });

    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");

    // Track activity
    try {
      await Activity.create({
        board: list.board,
        user: req.user._id,
        action: "create",
        targetType: "Task",
        targetId: task._id,
        details: { title: task.title },
      });
    } catch (actErr) {
      console.log("Activity tracking failed:", actErr.message);
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/tasks/:id/move  ← MUST be before /:id
router.put("/:id/move", protect, async (req, res) => {
  try {
    const { listId, position } = req.body;

    if (!listId) {
      return res
        .status(400)
        .json({ success: false, message: "listId is required" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const oldListId = task.list;
    task.list = listId;
    task.position = position !== undefined ? position : 0;
    await task.save();

    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");

    // Track activity
    try {
      await Activity.create({
        board: task.board,
        user: req.user._id,
        action: "move",
        targetType: "Task",
        targetId: task._id,
        details: { title: task.title, fromList: oldListId, toList: listId },
      });
    } catch (actErr) {
      console.log("Activity tracking failed:", actErr.message);
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("Move task error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/tasks/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: false,
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    // Track activity
    try {
      await Activity.create({
        board: task.board,
        user: req.user._id,
        action: "update",
        targetType: "Task",
        targetId: task._id,
        details: { title: updatedTask.title },
      });
    } catch (actErr) {
      console.log("Activity tracking failed:", actErr.message);
    }

    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Track activity before deleting
    try {
      await Activity.create({
        board: task.board,
        user: req.user._id,
        action: "delete",
        targetType: "Task",
        targetId: task._id,
        details: { title: task.title },
      });
    } catch (actErr) {
      console.log("Activity tracking failed:", actErr.message);
    }

    await task.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
