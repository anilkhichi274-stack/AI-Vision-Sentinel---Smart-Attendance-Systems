// Global variables

let attendanceSession = {

    subjectId: null,

    year: null,

    semester: null,

    markedStudents: new Set()

};



let currentStream = null;

let studentCameraStream = null;

let retryCount = 0;

const maxRetries = 3;



// Initialize everything when DOM is loaded

document.addEventListener('DOMContentLoaded', function() {

    console.log('Dashboard initialized');

   

    // Initialize all components

    initializeEventListeners();

    initializeStudentForm();

   

    // Load initial tab content

    setTimeout(() => {

        const activeTab = document.querySelector('.menu-item.active');

        if (activeTab && activeTab.dataset.tab) {

            switchTab(activeTab.dataset.tab);

        } else {

            // Default to dashboard

            const dashboardTab = document.querySelector('[data-tab="dashboard"]');

            if (dashboardTab) {

                dashboardTab.classList.add('active');

            }

            switchTab('dashboard');

        }

    }, 100);

});



// Initialize all event listeners

function initializeEventListeners() {

    // Menu items

    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {

        item.addEventListener('click', function(e) {

            e.preventDefault();

            const tabName = this.dataset.tab;

            console.log('Menu item clicked:', tabName);

            switchTab(tabName);

        });

    });



    // Student form

    const studentForm = document.getElementById('student-form');

    if (studentForm) {

        studentForm.addEventListener('submit', function(e) {

            e.preventDefault();

            addStudentWithPhoto();

        });

    }



    // Subject form

    const subjectForm = document.getElementById('subject-form');

    if (subjectForm) {

        subjectForm.addEventListener('submit', function(e) {

            e.preventDefault();

            addSubject();

        });

    }



    // Photo input preview

    const photoInput = document.getElementById('photo-input');

    if (photoInput) {

        photoInput.addEventListener('change', function() {

            previewPhoto(this);

        });

    }



    console.log('Event listeners initialized');

}



// Tab Management

function switchTab(tabName) {

    console.log('Switching to tab:', tabName);

   

    try {

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

            showErrorMessage(`Tab '${tabName}' not found`);

            return;

        }

       

        // Activate menu item

        const menuItem = document.querySelector(`[data-tab="${tabName}"]`);

        if (menuItem) {

            menuItem.classList.add('active');

        }

       

        // Load tab-specific content

        loadTabContent(tabName);

    } catch (error) {

        console.error('Error switching tab:', error);

        showErrorMessage('Error switching tab: ' + error.message);

    }

}



function loadTabContent(tabName) {

    console.log('Loading content for tab:', tabName);

   

    try {

        switch(tabName) {

            case 'students':

                if (typeof loadStudents === 'function') {

                    loadStudents();

                } else {

                    console.error('loadStudents function not found');

                    showErrorMessage('Student loading function not available');

                }

                break;

            case 'subjects':

                if (typeof loadSubjects === 'function') {

                    loadSubjects();

                } else {

                    console.error('loadSubjects function not found');

                    showErrorMessage('Subject loading function not available');

                }

                break;

            case 'attendance':

                if (typeof loadAttendanceList === 'function') {

                    loadAttendanceList();

                } else {

                    console.error('loadAttendanceList function not found');

                    showErrorMessage('Attendance loading function not available');

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

                    showErrorMessage('Dashboard loading function not available');

                }

                break;

            default:

                console.log('No specific content to load for tab:', tabName);

        }

    } catch (error) {

        console.error('Error loading tab content:', error);

        showErrorMessage('Error loading content: ' + error.message);

    }

}



// Student Management

function showAddStudentForm() {

    try {

        const form = document.getElementById('add-student-form');

        if (form) {

            form.style.display = 'block';

            // Reset form

            const studentForm = document.getElementById('student-form');

            if (studentForm) studentForm.reset();

            // Reset preview

            const preview = document.getElementById('photo-preview');

            if (preview) {

                preview.innerHTML = `

                    <div class="photo-placeholder">

                        <i class="fas fa-user-graduate"></i>

                        <span>Photo Preview</span>

                    </div>

                `;

            }

        } else {

            console.error('Add student form not found');

        }

    } catch (error) {

        console.error('Error showing student form:', error);

    }

}



function hideAddStudentForm() {

    try {

        const form = document.getElementById('add-student-form');

        if (form) {

            form.style.display = 'none';

        }

        const studentForm = document.getElementById('student-form');

        if (studentForm) studentForm.reset();

    } catch (error) {

        console.error('Error hiding student form:', error);

    }

}



function initializeStudentForm() {

    console.log('Initializing student form');

    // Form is already set up in initializeEventListeners

}



function previewPhoto(input) {

    try {

        const preview = document.getElementById('photo-preview');

        if (!preview) return;



        if (input.files && input.files[0]) {

            const file = input.files[0];

           

            // Validate file size (max 2MB)

            if (file.size > 2 * 1024 * 1024) {

                alert('Photo size should be less than 2MB');

                input.value = '';

                return;

            }

           

            // Validate file type

            if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {

                alert('Please select a JPG or PNG image');

                input.value = '';

                return;

            }



            const reader = new FileReader();

           

            reader.onload = function(e) {

                preview.innerHTML = `<img src="${e.target.result}" alt="Photo Preview">`;

            };

           

            reader.onerror = function() {

                alert('Error reading file');

                input.value = '';

            };

           

            reader.readAsDataURL(file);

        } else {

            preview.innerHTML = `

                <div class="photo-placeholder">

                    <i class="fas fa-user-graduate"></i>

                    <span>Photo Preview</span>

                </div>

            `;

        }

    } catch (error) {

        console.error('Error previewing photo:', error);

        alert('Error previewing photo: ' + error.message);

    }

}



async function addStudentWithPhoto() {

    const form = document.getElementById('student-form');

    if (!form) {

        alert('Student form not found');

        return;

    }



    const formData = new FormData(form);

   

    // Validate required fields

    const requiredFields = ['enrollment_no', 'name', 'year', 'semester', 'branch'];

    for (let field of requiredFields) {

        if (!formData.get(field)) {

            alert(`Please fill in ${field.replace('_', ' ')}`);

            return;

        }

    }



    // Validate photo

    const photoInput = document.getElementById('photo-input');

    if (!photoInput || !photoInput.files[0]) {

        alert('Please select a student photo');

        return;

    }



    showGlobalLoading();



    try {

        const response = await fetch('ajax_handler.php?action=add_student', {

            method: 'POST',

            body: formData

        });



        if (!response.ok) {

            throw new Error(`HTTP error! status: ${response.status}`);

        }



        const result = await response.json();

       

        if (result.success) {

            alert('Student added successfully!');

            hideAddStudentForm();

            loadStudents();

           

            // Reload faces in recognition system

            await reloadFaces();

        } else {

            throw new Error(result.message || 'Unknown error occurred');

        }

    } catch (error) {

        console.error('Add student error:', error);

        alert('Error adding student: ' + error.message);

    } finally {

        hideGlobalLoading();

    }

}



async function loadStudents() {

    const container = document.getElementById('students-container');

    if (!container) {

        console.error('Students container not found');

        return;

    }



    container.innerHTML = `

        <div class="loading-message">

            <i class="fas fa-spinner fa-spin"></i>

            <span>Loading students...</span>

        </div>

    `;



    try {

        const response = await fetch('ajax_handler.php?action=get_students');

       

        if (!response.ok) {

            throw new Error(`HTTP error! status: ${response.status}`);

        }

       

        const students = await response.json();

       

        if (!Array.isArray(students)) {

            throw new Error('Invalid response format');

        }

       

        container.innerHTML = '';

       

        if (students.length === 0) {

            container.innerHTML = '<p class="info-message">No students found. Add your first student above.</p>';

            return;

        }

       

        const grid = document.createElement('div');

        grid.className = 'students-grid';

       

        students.forEach(student => {

            const card = document.createElement('div');

            card.className = 'student-card';

           

            const photoHtml = student.photo_path && student.photo_path !== 'null' && student.photo_path !== ''

                ? `<img src="${student.photo_path}" alt="${student.name}" class="student-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`

                : '';

           

            const placeholderHtml = `

                <div class="photo-placeholder-small" ${student.photo_path && student.photo_path !== 'null' && student.photo_path !== '' ? 'style="display:none"' : ''}>

                    <i class="fas fa-user-graduate"></i>

                </div>

            `;

           

            card.innerHTML = `

                ${photoHtml}

                ${placeholderHtml}

                <div class="student-info">

                    <h4>${escapeHtml(student.name)}</h4>

                    <p><strong>Enrollment:</strong> ${escapeHtml(student.enrollment_no)}</p>

                    <p><strong>Year:</strong> ${escapeHtml(student.year || 'N/A')}</p>

                    <p><strong>Semester:</strong> ${escapeHtml(student.semester || 'N/A')}</p>

                    <p><strong>Branch:</strong> ${escapeHtml(student.branch)}</p>

                    ${(!student.photo_path || student.photo_path === 'null' || student.photo_path === '') ? '<p class="text-warning"><small>No photo uploaded</small></p>' : ''}

                </div>

            `;

            grid.appendChild(card);

        });

       

        container.appendChild(grid);

    } catch (error) {

        console.error('Error loading students:', error);

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

    try {

        const form = document.getElementById('add-subject-form');

        if (form) {

            form.style.display = 'block';

        }

    } catch (error) {

        console.error('Error showing subject form:', error);

    }

}



function hideAddSubjectForm() {

    try {

        const form = document.getElementById('add-subject-form');

        if (form) {

            form.style.display = 'none';

        }

        const subjectForm = document.getElementById('subject-form');

        if (subjectForm) subjectForm.reset();

    } catch (error) {

        console.error('Error hiding subject form:', error);

    }

}



async function addSubject() {

    const form = document.getElementById('subject-form');

    if (!form) {

        alert('Subject form not found');

        return;

    }



    const formData = new FormData(form);

   

    // Validate required fields

    if (!formData.get('subject_name') || !formData.get('subject_code')) {

        alert('Please fill in all required fields');

        return;

    }



    showGlobalLoading();



    try {

        const response = await fetch('ajax_handler.php?action=add_subject', {

            method: 'POST',

            body: formData

        });



        if (!response.ok) {

            throw new Error(`HTTP error! status: ${response.status}`);

        }



        const result = await response.json();

       

        if (result.success) {

            alert('Subject added successfully!');

            hideAddSubjectForm();

            loadSubjects();

        } else {

            throw new Error(result.message || 'Unknown error occurred');

        }

    } catch (error) {

        console.error('Add subject error:', error);

        alert('Error adding subject: ' + error.message);

    } finally {

        hideGlobalLoading();

    }

}



async function loadSubjects() {

    const container = document.getElementById('subjects-container');

    if (!container) {

        console.error('Subjects container not found');

        return;

    }



    container.innerHTML = `

        <div class="loading-message">

            <i class="fas fa-spinner fa-spin"></i>

            <span>Loading subjects...</span>

        </div>

    `;



    try {

        const response = await fetch('ajax_handler.php?action=get_subjects');

       

        if (!response.ok) {

            throw new Error(`HTTP error! status: ${response.status}`);

        }

       

        const responseText = await response.text();

        let subjects;

       

        try {

            subjects = JSON.parse(responseText);

        } catch (parseError) {

            console.error('JSON parse error:', parseError);

            throw new Error('Invalid JSON response from server');

        }

       

        container.innerHTML = '';

       

        if (!subjects || (Array.isArray(subjects) && subjects.length === 0)) {

            container.innerHTML = '<p class="info-message">No subjects found. Add your first subject above.</p>';

            return;

        }

       

        // Handle different response formats

        if (subjects.success === false) {

            throw new Error(subjects.message);

        }

       

        const subjectsArray = Array.isArray(subjects) ? subjects : (subjects.subjects || []);

       

        if (subjectsArray.length === 0) {

            container.innerHTML = '<p class="info-message">No subjects found. Add your first subject above.</p>';

            return;

        }

       

        subjectsArray.forEach(subject => {

            const card = document.createElement('div');

            card.className = 'subject-card';

            card.innerHTML = `

                <div class="subject-info">

                    <h4>${escapeHtml(subject.subject_name)}</h4>

                    <p><strong>Code:</strong> ${escapeHtml(subject.subject_code)}</p>

                    <p><strong>Created:</strong> ${new Date(subject.created_at).toLocaleDateString()}</p>

                </div>

            `;

            container.appendChild(card);

        });

       

    } catch (error) {

        console.error('Error loading subjects:', error);

        container.innerHTML = `

            <div class="error-message">

                <p>Error loading subjects: ${error.message}</p>

                <button onclick="loadSubjects()" class="btn-secondary">Retry</button>

            </div>

        `;

    }

}



// Attendance Management

function startAttendanceSession() {

    try {

        const subjectSelect = document.getElementById('attendance-subject');

        const yearSelect = document.getElementById('attendance-year');

        const semesterSelect = document.getElementById('attendance-semester');

       

        if (!subjectSelect || !yearSelect || !semesterSelect) {

            alert('Attendance form elements not found');

            return;

        }

       

        const subjectId = subjectSelect.value;

        const year = yearSelect.value;

        const semester = semesterSelect.value;

       

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

    } catch (error) {

        console.error('Error starting attendance session:', error);

        alert('Error starting attendance: ' + error.message);

    }

}



async function startCamera() {

    try {

        // Stop any existing stream

        if (currentStream) {

            currentStream.getTracks().forEach(track => track.stop());

        }

       

        const stream = await navigator.mediaDevices.getUserMedia({

            video: {

                width: { ideal: 1280 },

                height: { ideal: 720 },

                facingMode: 'user'

            }

        });

       

        const video = document.getElementById('video');

        if (video) {

            video.srcObject = stream;

        }

        currentStream = stream;

       

    } catch (error) {

        console.error('Camera error:', error);

        alert('Error accessing camera: ' + error.message);

       

        // Fallback to manual attendance

        const manualBtn = document.querySelector('.btn-success');

        if (manualBtn) manualBtn.style.display = 'inline-block';

    }

}



function stopCamera() {

    try {

        if (currentStream) {

            currentStream.getTracks().forEach(track => track.stop());

            currentStream = null;

        }

       

        const video = document.getElementById('video');

        if (video) {

            video.srcObject = null;

        }

       

        const attendanceSetup = document.getElementById('attendance-setup');

        const cameraInterface = document.getElementById('camera-interface');

       

        if (attendanceSetup) attendanceSetup.style.display = 'block';

        if (cameraInterface) cameraInterface.style.display = 'none';

    } catch (error) {

        console.error('Error stopping camera:', error);

    }

}



async function captureImage() {

    try {

        const video = document.getElementById('video');

        const canvas = document.getElementById('canvas');

       

        if (!video || !canvas) {

            throw new Error('Camera elements not found');

        }

       

        if (video.readyState !== video.HAVE_ENOUGH_DATA) {

            alert('Camera not ready. Please wait and try again.');

            return;

        }

       

        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;

        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

       

        // Convert to base64 for facial recognition

        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        await recognizeFace(imageData);

    } catch (error) {

        console.error('Error capturing image:', error);

        alert('Error capturing image: ' + error.message);

    }

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

        const formData = new FormData();

        formData.append('image', imageData);

        formData.append('year', attendanceSession.year);

        formData.append('semester', attendanceSession.semester);

       

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

                            <p><strong>${escapeHtml(student.name)}</strong> is already marked present today.</p>

                            <p>Enrollment: ${escapeHtml(student.enrollment_no)}</p>

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

                                <p><strong>${escapeHtml(student.name)}</strong></p>

                                <p>Enrollment: ${escapeHtml(student.enrollment_no)}</p>

                                <p>Year: ${escapeHtml(student.year || 'N/A')}</p>

                                <p>Semester: ${escapeHtml(student.semester || 'N/A')}</p>

                                <p>Branch: ${escapeHtml(student.branch || 'N/A')}</p>

                                <p>Confidence: ${bestResult.confidence || 'N/A'}%</p>

                            </div>

                        `, 'success');

                       

                        // Reload attendance list

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

                        <p>${escapeHtml(errorMsg)}</p>

                        <p>Faces detected: ${result.faces_found || 0}</p>

                    </div>

                `, 'error');

            }

        } else {

            showRecognitionResult(`

                <div class="recognition-error">

                    <i class="fas fa-times-circle"></i>

                    <h4>Recognition Error</h4>

                    <p>${escapeHtml(result.message || 'Unknown error occurred')}</p>

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

                <p>Error: ${escapeHtml(error.message)}</p>

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

    if (resultDiv) {

        resultDiv.innerHTML = html;

        resultDiv.className = `recognition-result ${type}`;

    }

}



async function loadAttendanceList() {

    const container = document.getElementById('attendance-list');

    if (!container) {

        console.warn('Attendance list container not found');

        return;

    }



    container.innerHTML = `

        <div class="loading-message">

            <i class="fas fa-spinner fa-spin"></i>

            <span>Loading attendance...</span>

        </div>

    `;



    try {

        const response = await fetch('ajax_handler.php?action=get_todays_attendance');

       

        if (!response.ok) {

            throw new Error(`HTTP error! status: ${response.status}`);

        }

       

        const attendance = await response.json();

       

        if (!Array.isArray(attendance)) {

            throw new Error('Invalid response format');

        }

       

        if (attendance.length === 0) {

            container.innerHTML = '<p class="info-message">No attendance marked today.</p>';

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

                    <td>${escapeHtml(record.student_name)}</td>

                    <td>${escapeHtml(record.subject_name)}</td>

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

        container.innerHTML = `

            <div class="error-message">

                <p>Error loading attendance: ${error.message}</p>

                <button onclick="loadAttendanceList()" class="btn-secondary">Retry</button>

            </div>

        `;

    }

}



// Dashboard - Recent Attendance

async function loadRecentAttendance() {

    const container = document.getElementById('recent-attendance-list');

    if (!container) {

        console.error('Recent attendance container not found');

        return;

    }



    setLoadingState(true);



    try {

        // Try multiple endpoints for recent attendance

        const endpoints = [

            'ajax_handler.php?action=get_recent_attendance',

            'ajax_handler.php?action=get_todays_attendance'

        ];



        let response = null;

        let data = null;



        for (let endpoint of endpoints) {

            try {

                response = await fetch(endpoint);

                if (response.ok) {

                    const contentType = response.headers.get('content-type');

                    if (contentType && contentType.includes('application/json')) {

                        data = await response.json();

                        if (data && (Array.isArray(data) || data.success !== false)) {

                            break;

                        }

                    }

                }

            } catch (e) {

                console.log(`Endpoint ${endpoint} failed:`, e.message);

                continue;

            }

        }



        if (!data) {

            throw new Error('No valid attendance data found');

        }



        displayRecentAttendance(data);

       

    } catch (error) {

        console.error('Error loading recent attendance:', error);

       

        let userMessage = 'Failed to load recent attendance. ';

        if (error.message.includes('Authentication')) {

            userMessage += 'Please log in again.';

            setTimeout(() => {

                window.location.href = 'index.php';

            }, 2000);

        } else if (error.message.includes('per'))