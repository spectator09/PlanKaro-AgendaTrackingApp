// State Management
        let tasks = JSON.parse(localStorage.getItem('planKaroTasks')) || [];
        let currentFilter = 'all';
        let searchQuery = '';
        let editingTaskId = null;
        let draggedElement = null;

        // Theme Management
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('planKaroTheme') || 'light';
        
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeToggle.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('planKaroTheme', isDark ? 'dark' : 'light');
        });

        // Initialize Date Picker
        function initializeDatePicker() {
            const yearSelect = document.getElementById('yearSelect');
            const monthSelect = document.getElementById('monthSelect');
            const dateSelect = document.getElementById('dateSelect');
            
            const currentYear = new Date().getFullYear();
            for (let year = currentYear; year <= currentYear + 10; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }

            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
            
            yearSelect.addEventListener('change', () => {
                monthSelect.disabled = !yearSelect.value;
                monthSelect.innerHTML = '<option value="">Month</option>';
                dateSelect.disabled = true;
                dateSelect.innerHTML = '<option value="">Date</option>';
                
                if (yearSelect.value) {
                    months.forEach((month, index) => {
                        const option = document.createElement('option');
                        option.value = index + 1;
                        option.textContent = month;
                        monthSelect.appendChild(option);
                    });
                }
            });

            monthSelect.addEventListener('change', () => {
                dateSelect.disabled = !monthSelect.value;
                dateSelect.innerHTML = '<option value="">Date</option>';
                
                if (monthSelect.value) {
                    const year = parseInt(yearSelect.value);
                    const month = parseInt(monthSelect.value);
                    const daysInMonth = new Date(year, month, 0).getDate();
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                        const option = document.createElement('option');
                        option.value = day;
                        option.textContent = day;
                        dateSelect.appendChild(option);
                    }
                }
            });
        }

        // Modal Management
        const modal = document.getElementById('taskModal');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const taskForm = document.getElementById('taskForm');

        addTaskBtn.addEventListener('click', () => {
            editingTaskId = null;
            document.getElementById('modalTitle').textContent = 'Add New Task';
            taskForm.reset();
            document.getElementById('monthSelect').disabled = true;
            document.getElementById('dateSelect').disabled = true;
            modal.classList.add('show');
        });

        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });

        // Task CRUD Operations
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('taskTitle').value.trim();
            const description = document.getElementById('taskDescription').value.trim();
            const year = document.getElementById('yearSelect').value;
            const month = document.getElementById('monthSelect').value;
            const date = document.getElementById('dateSelect').value;
            
            let dueDate = null;
            if (year && month && date) {
                dueDate = `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
            }

            if (editingTaskId) {
                const task = tasks.find(t => t.id === editingTaskId);
                task.title = title;
                task.description = description;
                task.dueDate = dueDate;
            } else {
                const newTask = {
                    id: Date.now().toString(),
                    title,
                    description,
                    dueDate,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                tasks.push(newTask);
            }

            saveTasks();
            renderTasks();
            modal.classList.remove('show');
            taskForm.reset();
        });

        function editTask(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            editingTaskId = id;
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';

            if (task.dueDate) {
                const [year, month, day] = task.dueDate.split('-');
                document.getElementById('yearSelect').value = year;
                document.getElementById('yearSelect').dispatchEvent(new Event('change'));
                setTimeout(() => {
                    document.getElementById('monthSelect').value = parseInt(month);
                    document.getElementById('monthSelect').dispatchEvent(new Event('change'));
                    setTimeout(() => {
                        document.getElementById('dateSelect').value = parseInt(day);
                    }, 50);
                }, 50);
            }

            modal.classList.add('show');
        }

        function deleteTask(id) {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                renderTasks();
            }
        }

        function toggleTask(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                saveTasks();
                renderTasks();
            }
        }

        function saveTasks() {
            localStorage.setItem('planKaroTasks', JSON.stringify(tasks));
            updateStats();
        }

        // Rendering
        function renderTasks() {
            const container = document.getElementById('tasksContainer');
            
            let filteredTasks = tasks.filter(task => {
                const matchesFilter = currentFilter === 'all' || 
                                    (currentFilter === 'completed' && task.completed) ||
                                    (currentFilter === 'pending' && !task.completed);
                
                const matchesSearch = !searchQuery || 
                                     task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                     (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
                
                return matchesFilter && matchesSearch;
            });

            // Sort: pending tasks first, completed at bottom
            filteredTasks.sort((a, b) => {
                if (a.completed === b.completed) return 0;
                return a.completed ? 1 : -1;
            });

            if (filteredTasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <h2>${searchQuery ? 'No tasks found' : 'No tasks yet!'}</h2>
                        <p>${searchQuery ? 'Try a different search' : 'Click "Add New Task" to get started'}</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filteredTasks.map(task => `
                <div class="task-card ${task.completed ? 'completed' : ''}" draggable="true" data-id="${task.id}">
                    <div class="checkbox-container">
                        <div class="custom-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
                    </div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        ${task.dueDate ? `<div class="task-date">📅 Due: ${formatDate(task.dueDate)}</div>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="btn-icon btn-edit" onclick="editTask('${task.id}')">✏️</button>
                        <button class="btn-icon btn-delete" onclick="deleteTask('${task.id}')">🗑️</button>
                    </div>
                </div>
            `).join('');

            // Add drag and drop listeners
            const taskCards = container.querySelectorAll('.task-card');
            taskCards.forEach(card => {
                card.addEventListener('dragstart', handleDragStart);
                card.addEventListener('dragend', handleDragEnd);
                card.addEventListener('dragover', handleDragOver);
                card.addEventListener('drop', handleDrop);
            });
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }

        function updateStats() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const pending = total - completed;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            document.getElementById('totalTasks').textContent = total;
            document.getElementById('completedTasks').textContent = completed;
            document.getElementById('pendingTasks').textContent = pending;
            
            const progressFill = document.getElementById('progressFill');
            progressFill.style.width = `${percentage}%`;
            progressFill.textContent = `${percentage}%`;
        }

        // Drag and Drop
        function handleDragStart(e) {
            draggedElement = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }

        function handleDragEnd(e) {
            this.classList.remove('dragging');
        }

        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }

            if (draggedElement !== this) {
                const draggedId = draggedElement.getAttribute('data-id');
                const targetId = this.getAttribute('data-id');
                
                const draggedIndex = tasks.findIndex(t => t.id === draggedId);
                const targetIndex = tasks.findIndex(t => t.id === targetId);
                
                const [draggedTask] = tasks.splice(draggedIndex, 1);
                tasks.splice(targetIndex, 0, draggedTask);
                
                saveTasks();
                renderTasks();
            }

            return false;
        }

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });

        // Filter
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.getAttribute('data-filter');
                renderTasks();
            });
        });

        // Initialize
        initializeDatePicker();
        renderTasks();
        updateStats();

        // Make functions globally available
        window.toggleTask = toggleTask;
        window.editTask = editTask;
        window.deleteTask = deleteTask;