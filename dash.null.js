// Update global attendanceSession
let attendanceSession = {
    subjectId: null,
    year: null,
    semester: null,
    markedStudents: new Set()
};

function loadTabContent(tabName) {
    console.log('Loading content for tab:', tabName);
    
    switch(tabName) {
        case 'students':
            if (typeof loadStudents === 'function') {
                loadStudents();
            } else {
                console.error('loadStudents function not found');
            }
            break;
        case 'subjects':
            if (typeof loadSubjects === 'function') {
                loadSubjects();
            } else {
                console.error('loadSubjects function not found');
            }
            break;
        case 'attendance':
            if (typeof loadAttendanceList === 'function') {
                loadAttendanceList();
            } else {
                console.error('loadAttendanceList function not found');
            }
            break;
        case 'reports':
            // Reports will be loaded when generated
            console.log('Reports tab - content loaded on demand');
            break;
        case 'dashboard':
            if (typeof loadRecentAttendance === 'function') {
                loadRecentAttendance();
            } else {
                console.error('loadRecentAttendance function not found');
            }
            break;
        default:
            console.log('No specific content to load for tab:', tabName);
    }
}
// Update the initialization to be more robust
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    
    // Ensure all required elements exist before setting up event listeners
    setTimeout(() => {
        // Set up event listeners for menu items
        const menuItems = document.querySelectorAll('.menu-item');
        if (menuItems.length === 0) {
            console.error('No menu items found');
            return;
        }
        
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const tabName = this.dataset.tab;
                console.log('Menu item clicked:', tabName);
                switchTab(tabName);
            });
        });
        
        // Load initial tab content
        const activeTab = document.querySelector('.menu-item.active');
        if (activeTab) {
            const tabName = activeTab.dataset.tab;
            console.log('Loading initial tab:', tabName);
            switchTab(tabName);
        } else {
            // Default to dashboard if no active tab found
            console.log('No active tab found, defaulting to dashboard');
            const dashboardTab = document.querySelector('[data-tab="dashboard"]');
            if (dashboardTab) {
                dashboardTab.classList.add('active');
            }
            switchTab('dashboard');
        }
        
        // Initialize other components
        if (typeof initializeStudentForm === 'function') {
            initializeStudentForm();
        }
        
    }, 100); // Small delay to ensure DOM is fully ready
});

// Student Management
function showAddStudentForm() {
    document.getElementById('add-student-form').style.display = 'block';
}

function hideAddStudentForm() {
    document.getElementById('add-student-form').style.display = 'none';
    document.getElementById('student-form').reset();
}

document.getElementById('student-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addStudent();
});

async function addStudent() {
    const formData = new FormData(document.getElementById('student-form'));
    
    try {
        const response = await fetch('ajax_handler.php?action=add_student', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Student added successfully!');
            hideAddStudentForm();
            loadStudents();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error adding student: ' + error.message);
    }
}

async function loadStudents() {
    try {
        const response = await fetch('ajax_handler.php?action=get_students');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const students = await response.json();
        const container = document.getElementById('students-container');
        container.innerHTML = '';
        
        if (students.length === 0) {
            container.innerHTML = '<p>No students found. Add your first student above.</p>';
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'students-grid';
        
        students.forEach(student => {
            const card = document.createElement('div');
            card.className = 'student-card';
            
            const photoHtml = student.photo_path && student.photo_path !== 'null' 
                ? `<img src="${student.photo_path}" alt="${student.name}" class="student-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                : '';
            
            const placeholderHtml = `
                <div class="photo-placeholder-small" ${student.photo_path && student.photo_path !== 'null' ? 'style="display:none"' : ''}>
                    <i class="fas fa-user-graduate"></i>
                </div>
            `;
            
            card.innerHTML = `
                ${photoHtml}
                ${placeholderHtml}
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <p><strong>Enrollment:</strong> ${student.enrollment_no}</p>
                    <p><strong>Year:</strong> ${student.year || 'N/A'}</p>
                    <p><strong>Semester:</strong> ${student.semester || 'N/A'}</p>
                    <p><strong>Branch:</strong> ${student.branch}</p>
                    ${student.photo_path === 'null' ? '<p class="text-warning"><small>No photo uploaded</small></p>' : ''}
                </div>
            `;
            grid.appendChild(card);
        });
        
        container.appendChild(grid);
    } catch (error) {
        console.error('Error loading students:', error);
        const container = document.getElementById('students-container');
        container.innerHTML = `
            <div class="error-message">
                <p>Error loading students: ${error.message}</p>
                <button onclick="loadStudents()" class="btn-secondary">Retry</button>
            </div>
        `;
    }
}


// Subject Management
function showAddSubjectForm() {
    document.getElementById('add-subject-form').style.display = 'block';
}

function hideAddSubjectForm() {
    document.getElementById('add-subject-form').style.display = 'none';
    document.getElementById('subject-form').reset();
}

document.getElementById('subject-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addSubject();
});

async function addSubject() {
    const formData = new FormData(document.getElementById('subject-form'));
    
    try {
        const response = await fetch('ajax_handler.php?action=add_subject', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Subject added successfully!');
            hideAddSubjectForm();
            loadSubjects();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error adding subject: ' + error.message);
    }
}

async function loadSubjects() {
    try {
        console.log('Loading subjects...');
        const response = await fetch('ajax_handler.php?action=get_subjects');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let subjects;
        try {
            subjects = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        
        const container = document.getElementById('subjects-container');
        container.innerHTML = '';
        
        if (!subjects || subjects.length === 0) {
            container.innerHTML = '<p>No subjects found. Add your first subject above.</p>';
            return;
        }
        
        // Check if subjects is an array or has error
        if (subjects.success === false) {
            throw new Error(subjects.message);
        }
        
        const subjectsArray = Array.isArray(subjects) ? subjects : (subjects.subjects || []);
        
        if (subjectsArray.length === 0) {
            container.innerHTML = '<p>No subjects found. Add your first subject above.</p>';
            return;
        }
        
        subjectsArray.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.innerHTML = `
                <div class="subject-info">
                    <h4>${subject.subject_name}</h4>
                    <p><strong>Code:</strong> ${subject.subject_code}</p>
                    <p><strong>Created:</strong> ${new Date(subject.created_at).toLocaleDateString()}</p>
                </div>
            `;
            container.appendChild(card);
        });
        
        console.log('Subjects loaded successfully:', subjectsArray.length);
        
    } catch (error) {
        console.error('Error loading subjects:', error);
        const container = document.getElementById('subjects-container');
        container.innerHTML = `
            <div class="error-message">
                <p>Error loading subjects: ${error.message}</p>
                <button onclick="loadSubjects()" class="btn-secondary">Retry</button>
            </div>
        `;
    }
}

function showEmptyAttendanceState() {
    const attendanceSection = document.getElementById('recent-attendance');
    if (attendanceSection) {
        attendanceSection.innerHTML = `
            <div class="info-message">
                <i class="fas fa-info-circle"></i>
                <p>No recent attendance data available.</p>
                <button class="btn-primary mt-3" onclick="loadRecentAttendance()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

function showErrorMessage(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
    `;

    // Insert at the top of the content area
    const contentArea = document.querySelector('.content-area');
    const firstChild = contentArea.firstChild;
    contentArea.insertBefore(errorDiv, firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function setLoadingState(loading = true) {
    const attendanceSection = document.getElementById('recent-attendance');
    if (!attendanceSection) return;

    if (loading) {
        attendanceSection.innerHTML = `
            <div class="recognition-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading recent attendance...</p>
            </div>
        `;
    }
}

// Also add this function if it's missing
 async function loadAttendanceList() {
    try {
        const response = await fetch('ajax_handler.php?action=get_todays_attendance');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const attendance = await response.json();
        const container = document.getElementById('attendance-list');
        
        if (!container) {
            console.warn('Attendance list container not found');
            return;
        }
        
        if (attendance.length === 0) {
            container.innerHTML = '<p>No attendance marked today.</p>';
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) exportBtn.style.display = 'none';
            return;
        }
        
        let html = `
            <div class="attendance-table">
                <table>
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Subject</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        attendance.forEach(record => {
            const time = new Date(record.marked_at).toLocaleTimeString();
            html += `
                <tr>
                    <td>${record.student_name}</td>
                    <td>${record.subject_name}</td>
                    <td>${time}</td>
                    <td><span class="status-present">Present</span></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) exportBtn.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading attendance list:', error);
        const container = document.getElementById('attendance-list');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>Error loading attendance: ${error.message}</p>
                </div>
            `;
        }
    }
}


function formatTime(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Add this to handle retries with exponential backoff
let retryCount = 0;
const maxRetries = 3;

async function loadRecentAttendanceWithRetry() {
    try {
        await loadRecentAttendance();
        retryCount = 0; // Reset on success
    } catch (error) {
        retryCount++;
        if (retryCount <= maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            console.log(`Retrying in ${delay}ms... (${retryCount}/${maxRetries})`);
            
            setTimeout(() => {
                loadRecentAttendanceWithRetry();
            }, delay);
        } else {
            console.error('Max retries exceeded');
            showErrorMessage('Unable to load data after several attempts. Please refresh the page.');
        }
    }
}

// Update the loadTabContent function to handle missing functions safely


function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    const attendanceSetup = document.getElementById('attendance-setup');
    const cameraInterface = document.getElementById('camera-interface');
    
    if (attendanceSetup) attendanceSetup.style.display = 'block';
    if (cameraInterface) cameraInterface.style.display = 'none';
}


// Manual attendance marking (for when facial recognition fails)
function manualMarkAttendance() {
    alert('Manual attendance feature coming soon...');
}

// Clear report filters
function clearReportFilters() {
    document.getElementById('report-subject').value = '';
    document.getElementById('report-year').value = '';
    document.getElementById('report-semester').value = '';
    document.getElementById('report-date-from').value = '';
    document.getElementById('report-date-to').value = '';
}

// Generate report (placeholder)
function generateReport() {
    alert('Report generation feature coming soon...');
}

// Export attendance
function exportAttendance() {
    window.open('ajax_handler.php?action=export_attendance', '_blank');
}

// Global loading functions
function showGlobalLoading() {
    const loading = document.getElementById('global-loading');
    if (loading) loading.style.display = 'flex';
}

function hideGlobalLoading() {
    const loading = document.getElementById('global-loading');
    if (loading) loading.style.display = 'none';
}

// Tab Management
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    } else {
        console.error('Tab not found:', `${tabName}-tab`);
        return;
    }
    
    // Activate menu item
    const menuItem = document.querySelector(`[data-tab="${tabName}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    }
    
    // Load tab-specific content
    loadTabContent(tabName);
}

function loadTabContent(tabName) {
    console.log('Loading content for tab:', tabName);
    
    switch(tabName) {
        case 'students':
            loadStudents();
            break;
        case 'subjects':
            loadSubjects();
            break;
        case 'attendance':
            loadAttendanceList();
            break;
        case 'reports':
            // Reports will be loaded when generated
            break;
        case 'dashboard':
            loadRecentAttendance();
            break;
        default:
            console.log('No specific content to load for tab:', tabName);
    }
}

// Initialize dashboard with proper event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    
    // Load initial tab content
    const activeTab = document.querySelector('.menu-item.active');
    if (activeTab) {
        const tabName = activeTab.dataset.tab;
        loadTabContent(tabName);
    } else {
        // Default to dashboard
        switchTab('dashboard');
    }
    
    // Set up event listeners for menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.dataset.tab;
            console.log('Menu item clicked:', tabName);
            switchTab(tabName);
        });
    });
    
    // Initialize other components
    initializeStudentForm();
});




async function loadRecentAttendance() {
    setLoadingState(true);
    
    try {
        const response = await fetch('/api/attendance/recent', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // Helps identify AJAX requests
            },
            credentials: 'include'
        });

        // Check response status
        if (response.status === 401) {
            throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
            throw new Error('You do not have permission to view this data.');
        } else if (response.status === 404) {
            throw new Error('Attendance data not found.');
        } else if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Verify content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // Try to read the response as text to see what we got
            const text = await response.text();
            console.warn('Expected JSON but got:', text.substring(0, 200));
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        displayRecentAttendance(data);
        
    } catch (error) {
        console.error('Error loading recent attendance:', error);
        
        // Show user-friendly error message
        let userMessage = 'Failed to load recent attendance. ';
        if (error.message.includes('Authentication')) {
            userMessage += 'Please log in again.';
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else if (error.message.includes('permission')) {
            userMessage += 'You do not have permission to view this data.';
        } else if (error.message.includes('Server error')) {
            userMessage += 'Please try again later.';
        } else {
            userMessage += 'Please check your connection and try again.';
        }
        
        showErrorMessage(userMessage);
        
        // Show fallback data or empty state
        showEmptyAttendanceState();
    } finally {
        setLoadingState(false);
    }
}

function displayRecentAttendance(data) {
    const attendanceSection = document.getElementById('recent-attendance');
    if (!attendanceSection) return;

    if (!data || !data.length) {
        showEmptyAttendanceState();
        return;
    }

    const html = data.map(item => `
        <div class="recent-attendance-item">
            <div class="attendance-info">
                <strong>${item.studentName || 'Unknown Student'}</strong>
                <span class="subject-badge">${item.subject || 'General'}</span>
            </div>
            <div class="attendance-time">
                <small>${formatTime(item.timestamp)}</small>
                <div class="status-${item.status || 'present'}">${item.status || 'Present'}</div>
            </div>
        </div>
    `).join('');

    attendanceSection.innerHTML = html;
}




// Fix startAttendanceSession function
function startAttendanceSession() {
    const subjectSelect = document.getElementById('attendance-subject');
    const yearSelect = document.getElementById('attendance-year');
    const semesterSelect = document.getElementById('attendance-semester');
    
    const subjectId = subjectSelect ? subjectSelect.value : null;
    const year = yearSelect ? yearSelect.value : null;
    const semester = semesterSelect ? semesterSelect.value : null;
    
    if (!subjectId || !year || !semester) {
        alert('Please select subject, year, and semester');
        return;
    }
    
    // Get subject name for display
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;
    
    attendanceSession.subjectId = subjectId;
    attendanceSession.year = year;
    attendanceSession.semester = semester;
    attendanceSession.markedStudents.clear();
    
    // Update session info display
    const sessionSubject = document.getElementById('session-subject');
    const sessionYearSem = document.getElementById('session-year-sem');
    
    if (sessionSubject) sessionSubject.textContent = subjectName;
    if (sessionYearSem) sessionYearSem.textContent = `${year} - ${semester}`;
    
    const attendanceSetup = document.getElementById('attendance-setup');
    const cameraInterface = document.getElementById('camera-interface');
    
    if (attendanceSetup) attendanceSetup.style.display = 'none';
    if (cameraInterface) cameraInterface.style.display = 'block';
    
    startCamera();
}
// Enhanced facial recognition functions
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            } 
        });
        
        const video = document.getElementById('video');
        video.srcObject = stream;
        currentStream = stream;
        
        // Start face detection preview
        startFaceDetectionPreview();
    } catch (error) {
        alert('Error accessing camera: ' + error.message);
        console.error('Camera error:', error);
    }
}

function startFaceDetectionPreview() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    function detectFaces() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // You can add real-time face detection box here if needed
            // This would require more complex WebAssembly or JavaScript face detection
        }
        
        if (currentStream) {
            requestAnimationFrame(detectFaces);
        }
    }
    
    detectFaces();
}

async function captureImage() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    // Ensure canvas size matches video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 for facial recognition
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    await recognizeFace(imageData);
}

async function recognizeFace(imageData) {
    const resultDiv = document.getElementById('recognition-result');
    if (!resultDiv) {
        console.error('Recognition result div not found');
        return;
    }
    
    resultDiv.innerHTML = `
        <div class="recognition-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Analyzing face...</p>
        </div>
    `;
    
    try {
        // Use separate year and semester instead of combined year_sem
        const yearSem = `${attendanceSession.year} - ${attendanceSession.semester}`;
        
        const formData = new FormData();
        formData.append('image', imageData);
        formData.append('year_sem', yearSem);
        
        const response = await fetch('ajax_handler.php?action=recognize_face', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const successfulResults = result.results ? result.results.filter(r => r.success) : [];
            
            if (successfulResults.length > 0) {
                const bestResult = successfulResults[0];
                const student = bestResult.student;
                
                if (attendanceSession.markedStudents.has(student.id)) {
                    showRecognitionResult(`
                        <div class="recognition-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>Already Marked</h4>
                            <p><strong>${student.name}</strong> is already marked present today.</p>
                            <p>Enrollment: ${student.enrollment_no}</p>
                            <p>Confidence: ${bestResult.confidence || 'N/A'}%</p>
                        </div>
                    `, 'warning');
                } else {
                    const markResult = await markAttendance(student.id);
                    
                    if (markResult && markResult.success) {
                        attendanceSession.markedStudents.add(student.id);
                        
                        showRecognitionResult(`
                            <div class="recognition-success">
                                <i class="fas fa-check-circle"></i>
                                <h4>Attendance Marked</h4>
                                <p><strong>${student.name}</strong></p>
                                <p>Enrollment: ${student.enrollment_no}</p>
                                <p>Year: ${student.year || 'N/A'}</p>
                                <p>Semester: ${student.semester || 'N/A'}</p>
                                <p>Branch: ${student.branch || 'N/A'}</p>
                                <p>Confidence: ${bestResult.confidence || 'N/A'}%</p>
                            </div>
                        `, 'success');
                        
                        loadAttendanceList();
                    } else {
                        throw new Error(markResult?.message || 'Failed to mark attendance');
                    }
                }
            } else {
                const errorMsg = result.results && result.results[0] ? result.results[0].message : 'Face not recognized in database';
                showRecognitionResult(`
                    <div class="recognition-error">
                        <i class="fas fa-times-circle"></i>
                        <h4>Recognition Failed</h4>
                        <p>${errorMsg}</p>
                        <p>Faces detected: ${result.faces_found || 0}</p>
                    </div>
                `, 'error');
            }
        } else {
            showRecognitionResult(`
                <div class="recognition-error">
                    <i class="fas fa-times-circle"></i>
                    <h4>Recognition Error</h4>
                    <p>${result.message || 'Unknown error occurred'}</p>
                    <p>Faces detected: ${result.faces_found || 0}</p>
                </div>
            `, 'error');
        }
    } catch (error) {
        console.error('Recognition error:', error);
        showRecognitionResult(`
            <div class="recognition-error">
                <i class="fas fa-times-circle"></i>
                <h4>Network Error</h4>
                <p>Unable to connect to recognition service.</p>
                <p>Error: ${error.message}</p>
            </div>
        `, 'error');
    }
}
async function markAttendance(studentId) {
    try {
        const formData = new FormData();
        formData.append('student_id', studentId);
        formData.append('subject_id', attendanceSession.subjectId);
        
        const response = await fetch('ajax_handler.php?action=mark_attendance', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error marking attendance:', error);
        return { success: false, message: error.message };
    }
}


function showRecognitionResult(html, type) {
    const resultDiv = document.getElementById('recognition-result');
    resultDiv.innerHTML = html;
    
    // Add appropriate styling class
    resultDiv.className = `recognition-result ${type}`;
}

// Enhanced student management with face registration
async function addStudentWithFace(formData) {
    try {
        const response = await fetch('ajax_handler.php?action=add_student', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Student added successfully!');
            hideAddStudentForm();
            loadStudents();
            
            // Reload faces in the recognition system
            await reloadFaces();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error adding student: ' + error.message);
    }
}

async function reloadFaces() {
    try {
        const response = await fetch('ajax_handler.php?action=reload_faces', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Faces reloaded:', result.message);
        } else {
            console.warn('Face reload warning:', result.message);
        }
    } catch (error) {
        console.error('Error reloading faces:', error);
    }
}

// Add face capture for existing students
function addFaceCaptureToStudentForm() {
    const form = document.getElementById('student-form');
    const photoInput = form.querySelector('input[name="photo"]');
    
    // Create camera interface for photo capture
    const cameraSection = document.createElement('div');
    cameraSection.className = 'camera-section';
    cameraSection.innerHTML = `
        <div class="camera-preview">
            <video id="student-photo-video" width="320" height="240" autoplay></video>
            <canvas id="student-photo-canvas" style="display: none;"></canvas>
        </div>
        <div class="camera-controls">
            <button type="button" class="btn-secondary" onclick="captureStudentPhoto()">
                <i class="fas fa-camera"></i> Capture Photo
            </button>
            <button type="button" class="btn-secondary" onclick="startStudentCamera()">
                <i class="fas fa-sync"></i> Restart Camera
            </button>
        </div>
        <div id="student-photo-preview"></div>
    `;
    
    photoInput.parentNode.appendChild(cameraSection);
}

let studentCameraStream = null;

async function startStudentCamera() {
    try {
        if (studentCameraStream) {
            studentCameraStream.getTracks().forEach(track => track.stop());
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240 } 
        });
        
        const video = document.getElementById('student-photo-video');
        video.srcObject = stream;
        studentCameraStream = stream;
    } catch (error) {
        alert('Error accessing camera: ' + error.message);
    }
}

function captureStudentPhoto() {
    const video = document.getElementById('student-photo-video');
    const canvas = document.getElementById('student-photo-canvas');
    const context = canvas.getContext('2d');
    const preview = document.getElementById('student-photo-preview');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Show preview
    preview.innerHTML = `
        <img src="${canvas.toDataURL('image/jpeg')}" alt="Captured Photo" style="max-width: 200px; border-radius: 5px;">
        <p>Photo captured successfully!</p>
    `;
    
    // Convert to blob and set as file input
    canvas.toBlob(function(blob) {
        const file = new File([blob], 'student_photo.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        const photoInput = document.querySelector('input[name="photo"]');
        photoInput.files = dataTransfer.files;
    }, 'image/jpeg');
}


// Photo Upload Functions
function previewPhoto(input) {
    const preview = document.getElementById('photo-preview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Photo Preview">`;
        };
        
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = `
            <div class="photo-placeholder">
                <i class="fas fa-user-graduate"></i>
                <span>Photo Preview</span>
            </div>
        `;
    }
}

function initializeStudentForm() {
    const studentForm = document.getElementById('student-form');
    if (studentForm) {
        studentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addStudentWithPhoto();
        });
    }
}

async function addStudentWithPhoto() {
    const form = document.getElementById('student-form');
    const formData = new FormData(form);
    
    // Validate photo
    const photoInput = document.getElementById('photo-input');
    if (!photoInput.files[0]) {
        alert('Please select a student photo');
        return;
    }
    
    // Validate file size (max 2MB)
    if (photoInput.files[0].size > 2 * 1024 * 1024) {
        alert('Photo size should be less than 2MB');
        return;
    }
    
    try {
        const response = await fetch('ajax_handler.php?action=add_student', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Student added successfully!');
            hideAddStudentForm();
            loadStudents();
            
            // Reload faces in recognition system
            await reloadFaces();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error adding student: ' + error.message);
        console.error('Add student error:', error);
    }
}

// Initialize student camera when form is shown
function showAddStudentForm() {
    document.getElementById('add-student-form').style.display = 'block';
    setTimeout(() => {
        startStudentCamera();
    }, 500);
}