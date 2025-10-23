class StudyPlanner {
    constructor() {
        this.tasks = this.loadTasks();
        this.initializeEventListeners();
        this.updateDisplay();
        this.checkReminders();
        
        // Check for reminders every minute
        setInterval(() => this.checkReminders(), 60000);
    }

    initializeEventListeners() {
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
    }

    addTask() {
        const title = document.getElementById('taskTitle').value;
        const subject = document.getElementById('taskSubject').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const priority = document.getElementById('taskPriority').value;
        const notes = document.getElementById('taskNotes').value;

        const task = {
            id: Date.now(),
            title,
            subject,
            dueDate: new Date(dueDate),
            priority,
            notes,
            completed: false,
            createdAt: new Date()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.updateDisplay();
        this.showNotification('Task added successfully! 🎉');
        
        // Reset form
        document.getElementById('taskForm').reset();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.updateDisplay();
            this.showNotification(task.completed ? 'Task completed! Great job! ✅' : 'Task marked as incomplete');
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.updateDisplay();
        this.showNotification('Task deleted successfully');
    }

    updateDisplay() {
        this.updateStats();
        this.updateTaskList();
        this.updateTimeline();
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('progressPercent').textContent = progress + '%';
        
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = progress + '%';
        progressBar.textContent = progress + '%';
    }

    updateTaskList() {
        const taskList = document.getElementById('taskList');
        
        if (this.tasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state">No tasks yet. Add your first study task to get started! 🎯</div>';
            return;
        }

        // Sort tasks by due date and completion status
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed - b.completed;
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        taskList.innerHTML = sortedTasks.map(task => {
            const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
            const dueDate = new Date(task.dueDate);
            const timeUntilDue = this.getTimeUntilDue(dueDate);
            
            return `
                <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                    <div class="task-header">
                        <div class="task-title">${task.title}</div>
                        <div class="task-priority priority-${task.priority}">${task.priority}</div>
                    </div>
                    <div class="task-meta">
                        📚 ${task.subject} • 📅 ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        ${isOverdue ? ' • ⚠️ OVERDUE' : timeUntilDue ? ` • ⏰ ${timeUntilDue}` : ''}
                    </div>
                    ${task.notes ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">📝 ${task.notes}</div>` : ''}
                    <div class="task-actions">
                        <button class="btn btn-small ${task.completed ? 'btn-success' : ''}" onclick="planner.toggleTask(${task.id})">
                            ${task.completed ? '✅ Completed' : '⭕ Mark Complete'}
                        </button>
                        <button class="btn btn-small btn-danger" onclick="planner.deleteTask(${task.id})">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateTimeline() {
        const timeline = document.getElementById('timeline');
        
        if (this.tasks.length === 0) {
            timeline.innerHTML = '<div class="empty-state">Your study timeline will appear here once you add tasks with due dates.</div>';
            return;
        }

        // Sort tasks by due date
        const sortedTasks = [...this.tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        timeline.innerHTML = sortedTasks.map(task => {
            const dueDate = new Date(task.dueDate);
            const isOverdue = dueDate < new Date() && !task.completed;
            
            return `
                <div class="timeline-item">
                    <div class="timeline-date">${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div class="timeline-title">
                        ${task.completed ? '✅' : isOverdue ? '⚠️' : '📚'} ${task.title}
                        <span style="font-size: 12px; color: #666; font-weight: normal;"> - ${task.subject}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    getTimeUntilDue(dueDate) {
        const now = new Date();
        const diff = dueDate - now;
        
        if (diff < 0) return null;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    checkReminders() {
        const now = new Date();
        
        this.tasks.forEach(task => {
            if (task.completed) return;
            
            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate - now;
            const hoursUntilDue = timeDiff / (1000 * 60 * 60);
            
            // Remind 24 hours before, 1 hour before, and when overdue
            if (hoursUntilDue <= 24 && hoursUntilDue > 23) {
                this.showNotification(`⏰ Reminder: "${task.title}" is due in 24 hours!`);
            } else if (hoursUntilDue <= 1 && hoursUntilDue > 0) {
                this.showNotification(`🚨 Urgent: "${task.title}" is due in less than 1 hour!`);
            } else if (hoursUntilDue < 0 && hoursUntilDue > -1) {
                this.showNotification(`⚠️ Overdue: "${task.title}" was due!`);
            }
        });
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    saveTasks() {
        localStorage.setItem('studyPlannerTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('studyPlannerTasks');
        if (saved) {
            return JSON.parse(saved).map(task => ({
                ...task,
                dueDate: new Date(task.dueDate),
                createdAt: new Date(task.createdAt)
            }));
        }
        return [];
    }
}

// Initialize the planner
const planner = new StudyPlanner();
