import { useState, useEffect } from 'react';
import { Edit, Plus, Trash, X } from 'lucide-react';
import axios from 'axios';

const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'Work',
    priority: 'Medium',
    reminder: {
      enabled: false,
      notifications: 1,
      interval: 5,
    },
    subtasks: [],
    recurring: false,
    completed: false,
  });
  const [points, setPoints] = useState(0); // For gamification
  const [streak, setStreak] = useState(0); // Daily streak
  const [theme, setTheme] = useState('light');
  const [analytics, setAnalytics] = useState({ tasksCompleted: 0, focusTime: 0 });

  useEffect(() => {
    axios.get('http://localhost:5000/tasks')
      .then(response => {
        setTasks(response.data.tasks);
      })
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('points', points);
    localStorage.setItem('streak', streak);
  }, [tasks, points, streak]);

  const addTask = () => {
    if (newTask.title.trim()) {
      axios.post('http://localhost:5000/tasks', newTask)
        .then(response => {
          setTasks([...tasks, response.data.task]);
          setPoints(points + 10); // Reward for adding a task
          resetNewTask();
        })
        .catch(error => console.error('Error adding task:', error));
    }
  };

  const editTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setEditingTaskId(id);
      setNewTask(task);
    }
  };

  const updateTask = () => {
    if (newTask.title.trim()) {
      axios.put(`http://localhost:5000/tasks/${editingTaskId}`, newTask)
        .then(response => {
          setTasks(tasks.map((task) => (task.id === editingTaskId ? response.data.task : task)));
          setEditingTaskId(null);
          resetNewTask();
        })
        .catch(error => console.error('Error updating task:', error));
    }
  };

  const deleteTask = (id) => {
    axios.delete(`http://localhost:5000/tasks/${id}`)
      .then(response => {
        setTasks(tasks.filter(task => task._id !== id)); // Use task._id for comparison
      })
      .catch(error => console.error('Error deleting task:', error));
  };

  const markTaskComplete = (id) => {
    axios.post(`http://localhost:5000/tasks/${id}/complete`)
      .then(response => {
        setTasks(prevTasks => 
          prevTasks.map((task) => 
            task.id === id ? { ...task, completed: true } : task
          )
        );
        setPoints(prevPoints => prevPoints + 20); // Reward for completing a task
        setAnalytics(prevAnalytics => ({
          ...prevAnalytics,
          tasksCompleted: prevAnalytics.tasksCompleted + 1,
        }));
      })
      .catch(error => console.error('Error marking task as complete:', error));
  };

  const resetNewTask = () => {
    setNewTask({
      title: '',
      category: 'Work',
      priority: 'Medium',
      reminder: { enabled: false, notifications: 1, interval: 5 },
      subtasks: [],
      recurring: false,
      completed: false,
    });
  };

  const toggleReminder = () => {
    setNewTask({
      ...newTask,
      reminder: {
        ...newTask.reminder,
        enabled: !newTask.reminder.enabled,
      },
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gradient-to-r from-blue-100 via-pink-100 to-yellow-100' : 'bg-gradient-to-r from-gray-800 via-gray-900 to-black'} flex flex-col items-center p-4`}>
      {/* Task Form */}
      <div className="w-full max-w-3xl mb-4 bg-white bg-opacity-70 p-4 rounded-lg shadow-lg">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-center text-gray-800">{editingTaskId ? 'Edit Task' : 'Add Task'}</h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              id="title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="mt-1 w-full p-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <div className="mt-2 space-y-2">
              {['Low', 'Medium', 'High'].map((priority) => (
                <div key={priority} className="flex items-center">
                  <input
                    type="radio"
                    id={priority}
                    name="priority"
                    value={priority}
                    checked={newTask.priority === priority}
                    onChange={() => setNewTask({ ...newTask, priority })}
                    className="mr-2"
                  />
                  <label htmlFor={priority} className="text-gray-700">{priority}</label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <div className="mt-2 space-y-2">
              {['Work', 'Personal', 'Urgent'].map((category) => (
                <div key={category} className="flex items-center">
                  <input
                    type="radio"
                    id={category}
                    name="category"
                    value={category}
                    checked={newTask.category === category}
                    onChange={() => setNewTask({ ...newTask, category })}
                    className="mr-2"
                  />
                  <label htmlFor={category} className="text-gray-700">{category}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Reminder</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newTask.reminder.enabled}
                onChange={toggleReminder}
                className="mr-2"
              />
              <span className="text-gray-700">Enable reminder</span>
            </div>
            {newTask.reminder.enabled && (
              <div className="mt-2 space-y-2">
                <div>
                  <label htmlFor="notifications" className="block text-sm font-medium text-gray-700">Notifications</label>
                  <input
                    id="notifications"
                    type="number"
                    min="1"
                    max="5"
                    value={newTask.reminder.notifications}
                    onChange={(e) => setNewTask({
                      ...newTask,
                      reminder: { ...newTask.reminder, notifications: e.target.value },
                    })}
                    className="w-full p-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="interval" className="block text-sm font-medium text-gray-700">Interval (minutes)</label>
                  <input
                    id="interval"
                    type="number"
                    min="1"
                    value={newTask.reminder.interval}
                    onChange={(e) => setNewTask({
                      ...newTask,
                      reminder: { ...newTask.reminder, interval: e.target.value },
                    })}
                    className="w-full p-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button
            className="flex items-center px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition duration-200"
            onClick={() => setEditingTaskId(null)}
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </button>
          <button
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg hover:bg-gradient-to-l hover:from-blue-500 hover:to-green-400 transition duration-300"
            onClick={editingTaskId ? updateTask : addTask}
          >
            {editingTaskId ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="w-full max-w-3xl mb-4 bg-white bg-opacity-70 p-4 rounded-lg shadow-lg">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-center text-gray-800">Tasks</h1>
        </div>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task._id} className={`flex justify-between items-center p-4 border-2 rounded-lg mb-4 ${task.completed ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <div>
                <h3 className="font-semibold text-xl">{task.title}</h3>
                <p className="text-sm text-gray-600">Priority: {task.priority}</p>
                <p className="text-sm text-gray-600">Category: {task.category}</p>
                {task.reminder.enabled && (
                  <p className="text-sm text-gray-600">
                    Reminder: {task.reminder.notifications} notifications every {task.reminder.interval} minutes
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  className="p-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg hover:bg-gradient-to-l hover:from-blue-500 hover:to-blue-400 transition duration-200"
                  onClick={() => editTask(task._id)} // Use task._id
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                  onClick={() => deleteTask(task._id)} // Use task._id
                >
                  <Trash className="h-4 w-4" />
                </button>
                {!task.completed && (
                  <button
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
                    onClick={() => markTaskComplete(task._id)} // Use task._id
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No tasks available</p>
        )}
      </div>
    </div>
  );
};

export default TodoApp;
