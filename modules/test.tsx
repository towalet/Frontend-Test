'use client'
import React from 'react';
import styles from './test.module.css';

// Prority levels for tasks
type Priority = 'Low' | 'Medium' | 'High';

// Filter options for task list
type TaskFilter = 'All' | 'Active' | 'Completed';

// Available priority options
const PRIORITY_OPTIONS: Priority[] = ['Low', 'Medium', 'High'];

// Available filter options
const FILTER_OPTIONS: TaskFilter[] = ['All', 'Active', 'Completed'];

// Key used for storing tasks in localStorage
const TASKS_STORAGE_KEY = 'task-manager-tasks';

// Task structure
type Task = {
    id: number;
    title: string;
    priority: Priority;
    completed: boolean;
};

// Main component for managing tasks
export default function TaskManager() {
    // User task title
    const [title, setTitle] = React.useState('');
    // Priority for new task
    const [priority, setPriority] = React.useState<Priority>('Medium');
    // Validation message
    const [error, setError] = React.useState('');

    // Task list state
    const [tasks, setTasks] = React.useState<Task[]>([]);

    // Current filter for displaying tasks
    const [filter, setFilter] = React.useState<TaskFilter>('All');
    // Search query for filtering tasks by title
    const [searchQuery, setSearchQuery] = React.useState('');

    // Flag to indicate if tasks have been loaded from localStorage
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Edit mode states
    const [editingTaskId, setEditingTaskId] = React.useState<number | null>(null);
    const [editTitle, setEditTitle] = React.useState('');
    const [editPriority, setEditPriority] = React.useState<Priority>('Medium');
    const [editError, setEditError] = React.useState('');

    // Load tasks from localStorage on component mount
    React.useEffect(() => {
        try {
            // Retrieve the stored tasks from localStorage using the defined key
            const saved = localStorage.getItem(TASKS_STORAGE_KEY);

            // If there are stored tasks, parse and load them
            if (saved) {
                // Parse the stored tasks from JSON format
                const parsed = JSON.parse(saved);

                // If the parsed data is an array, set it as the tasks
                if (Array.isArray(parsed)) {
                    setTasks(parsed);
                }
            }
        } catch {
            // Ignores invalid data
        }
        setIsLoaded(true);
    }, []);

    // Save tasks to localStorage whenever they change
    React.useEffect(() => {
        if (isLoaded) {
            // Store the current tasks in localStorage by converting the tasks array to a JSON string and saving it under the defined key
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        }
    }, [tasks, isLoaded]);

    // Function to add a new task
    const addTask = () => {
        // Trim the title to prevent adding tasks with only whitespace
        const trimmedTitle = title.trim();

        // Validate that the title is not empty after trimming
        if (!trimmedTitle) {
            setError('Task title is required.');
            return;
        }

        // Create a new task object with a unique ID, title, priority, and default completed status
        const newTask: Task = {
            id: Date.now(),
            title: trimmedTitle,
            priority: priority,
            completed: false,
        };

        // Add the new task to the beginning of the tasks array
        setTasks([newTask, ...tasks]);
        setTitle('');
        setPriority('Medium');
        setError('');
    };

    // Handle form submission to add a new task
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        addTask();
    };

    // Toggle the completion status of a task
    const toggleTaskCompletion = (taskId: number) => {
        // Map over the current tasks and toggle the completed status of the task with the matching ID
        const updatedTasks = tasks.map((task) => {
            // If the task ID matches the given ID, return a new task object with the completed status toggled. Otherwise, return the task unchanged
            if (task.id === taskId) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        setTasks(updatedTasks);
    };

    // Delete a task by its ID
    const deleteTask = (taskId: number) => {
        // If the task being deleted is currently being edited, reset the editing state
        if (editingTaskId === taskId) {
            cancelEditingTask();
        }
        // Update the tasks array by filtering out the task with the given ID
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        setTasks(updatedTasks);
    };

    // Start editing a task by setting the editing state with the tasks current details
    const startEditingTask = (task: Task) => {
        setEditingTaskId(task.id);
        setEditTitle(task.title);
        setEditPriority(task.priority);
        setEditError('');
    };

    // Cancel editing a task by resetting the editing state
    const cancelEditingTask = () => {
        setEditingTaskId(null);
        setEditTitle('');
        setEditPriority('Medium');
        setEditError('');
    };

    // Save the edits made to a task by updating the tasks array with the new title and priority
    const saveTaskEdits = (taskId: number) => {
        const trimmedEditTitle = editTitle.trim();

        // Validate that the edited title is not empty after trimming
        if (!trimmedEditTitle) {
            setEditError('Task title is required.');
            return;
        }
        setEditError('');

        // Update the tasks array by mapping over the current tasks and updating the title and priority of the task with the matching ID
        const updatedTasks = tasks.map((task) => {
            // If the task ID matches the ID of the task being edited, return a new task object with the updated title and priority, otherwise, return the task unchanged
            if (task.id === taskId) {
                return { ...task, title: trimmedEditTitle, priority: editPriority };
            }
            return task;
        });
        setTasks(updatedTasks);
        cancelEditingTask();
    };

    // Handle keydown event on the edit title input to allow saving edits with Enter key and canceling with escape key
    const handleEditTitleKeyDown = (
        // The keyboard event triggered on the edit title input and the ID of the task being edited
        event: React.KeyboardEvent<HTMLInputElement>,
        taskId: number
    ) => {
        // If the Enter key is pressed, prevent the default form submission and save the task edits
        if (event.key === 'Enter') {
            event.preventDefault();
            saveTaskEdits(taskId);
        }
        // If the Escape key is pressed, prevent the default action and cancel editing the task
        if (event.key === 'Escape') {
            event.preventDefault();
            cancelEditingTask();
        }
    };

    // Separate active and completed tasks to maintain a consistent order
    const activeTasks = tasks.filter((task) => !task.completed);
    const completedTasks = tasks.filter((task) => task.completed);
    // Return a new array with active tasks first followed by completed tasks to ensure consistent ordering
    const orderedTasks = [...activeTasks, ...completedTasks];

    // Filter tasks by status first
    let visibleTasks = orderedTasks;

    if (filter === 'Active') {
        visibleTasks = visibleTasks.filter((task) => !task.completed);
    } else if (filter === 'Completed') {
        visibleTasks = visibleTasks.filter((task) => task.completed);
    }

    // Filter tasks by search query
    const searchLower = searchQuery.trim().toLowerCase();
    if (searchLower) {
        visibleTasks = visibleTasks.filter((task) =>
            task.title.toLowerCase().includes(searchLower)
        );
    }

    // Returns the main container for the task manager
    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>Task Manager</h2>

            {/* Form for adding a new task */}
            <form className={styles.taskForm} onSubmit={handleSubmit}>
                {/* Label for the title input */}
                <label htmlFor="task-title" className={styles.label}>Title</label>
                {/* Input for the title of the new task */}
                <input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={styles.input}
                    placeholder="Enter task title"
                />

                {/* Label for the priority select */}
                <label htmlFor="task-priority" className={styles.label}>Priority</label>
                {/* Select for the priority of the new task */}
                <select
                    id="task-priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as Priority)}
                    className={styles.select}
                >   {/* Map over the priority options and create an option for each */}
                    {PRIORITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                {/* Button to add the new task */}
                <button type="submit" className={styles.addButton}>Add task</button>
                {/* If there is an error, display the error message */}
                {error && <p className={styles.error}>{error}</p>}
            </form>

            {/* Filter group for the task list */}
            <div className={styles.filterGroup}>
                {/* Map over the filter options and create a button for each */}
                {FILTER_OPTIONS.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setFilter(option)}
                        className={
                            filter === option
                                ? styles.filterButton + ' ' + styles.activeFilter
                                : styles.filterButton
                        }
                    >
                        {option}
                    </button>
                ))}
            </div>
            {/* Search group for the task list */}
            <div className={styles.searchGroup}>
                {/* Label for the search input */}
                <label htmlFor="task-search" className={styles.label}>Search</label>
                {/* Input for the search query */}
                <input
                    id="task-search"
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className={styles.input}
                    placeholder="Search by title"
                />
            </div>
            {/* List of tasks */}
            <ul className={styles.taskList}>
                {visibleTasks.map((task) => (
                    <li
                        key={task.id}
                        className={
                            task.completed
                                ? styles.taskItem + ' ' + styles.completedTask
                                : styles.taskItem
                        }
                    >
                        {/* If the task is being edited, display the edit container */}
                        {editingTaskId === task.id ? (
                            <div className={styles.editContainer}>
                                <div className={styles.editFields}>
                                    {/* Input for the title of the task */}
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(event) => setEditTitle(event.target.value)}
                                        onKeyDown={(event) => handleEditTitleKeyDown(event, task.id)}
                                        className={styles.input}
                                        placeholder="Edit task title"
                                    />
                                    {/* Select for the priority of the task */}
                                    <select
                                        value={editPriority}
                                        onChange={(event) =>
                                            setEditPriority(event.target.value as Priority)
                                        }
                                        className={styles.select}
                                    >
                                        {/* Map over the priority options and create an option for each */}
                                        {PRIORITY_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* If there is an error, display the error message */}
                                {editError && <p className={styles.error}>{editError}</p>}

                                {/* Edit actions for the task */}
                                <div className={styles.editActions}>
                                    {/* Button to save the edits to the task */}
                                    <button
                                        type="button"
                                        className={styles.saveButton}
                                        onClick={() => saveTaskEdits(task.id)}
                                    >
                                        Save
                                    </button>
                                    {/* Button to cancel the edits to the task */}
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={cancelEditingTask}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Task main for the task */}
                                <div className={styles.taskMain}>
                                    {/* Checkbox for the task */}
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => toggleTaskCompletion(task.id)}
                                        className={styles.checkbox}
                                    />
                                    {/* Task text for the task */}
                                    <div className={styles.taskText}>
                                        <span className={styles.taskTitle}>
                                            {task.title}
                                        </span>
                                        {/* Priority for the task */}
                                        <span className={styles.priority}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                                {/* Task actions for the task */}
                                <div className={styles.taskActions}>
                                    {/* Button to edit the task */}
                                    <button
                                        type="button"
                                        className={styles.editButton}
                                        onClick={() => startEditingTask(task)}
                                    >
                                        Edit
                                    </button>
                                    {/* Button to delete the task */}
                                    <button
                                        type="button"
                                        className={styles.deleteButton}
                                        onClick={() => deleteTask(task.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}