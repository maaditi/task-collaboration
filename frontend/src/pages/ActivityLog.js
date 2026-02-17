import React, { useState, useEffect } from "react";
import api from "../services/api";

const ActivityLog = ({ boardId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (boardId) fetchActivities();
  }, [boardId]);

  const fetchActivities = async () => {
    try {
      const res = await api.get(`/boards/${boardId}/activities`);
      setActivities(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch activities");
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "create":
        return "✅";
      case "update":
        return "✏️";
      case "delete":
        return "🗑️";
      case "move":
        return "↔️";
      case "add_member":
        return "👤";
      default:
        return "📝";
    }
  };

  const getActionText = (activity) => {
    const name = activity.user?.name || "Someone";
    const title = activity.details?.title || "an item";

    switch (activity.action) {
      case "create":
        return `${name} created "${title}"`;
      case "update":
        return `${name} updated "${title}"`;
      case "delete":
        return `${name} deleted "${title}"`;
      case "move":
        return `${name} moved "${title}" to another list`;
      case "add_member":
        return `${name} added a new member`;
      default:
        return `${name} performed an action`;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading)
    return <div className="p-4 text-gray-500">Loading activity...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4 max-h-[500px] overflow-y-auto">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        📋 Activity History
        <span className="text-sm font-normal text-gray-500">
          ({activities.length} actions)
        </span>
      </h3>

      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded"
            >
              <div className="text-xl">{getActionIcon(activity.action)}</div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  {getActionText(activity)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {getTimeAgo(activity.createdAt)}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs flex-shrink-0">
                {activity.user?.name?.charAt(0).toUpperCase() || "?"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
