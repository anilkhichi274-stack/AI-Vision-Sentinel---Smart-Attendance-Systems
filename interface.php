<?php
session_start();
require_once 'config_db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !$_SESSION['logged_in']) {
    header("Location: index.php");
    exit();
}

// Get teacher info
$teacher_id = $_SESSION['user_id'];
$teacher_name = $_SESSION['user_name'];

// Get statistics with error handling
try {
    $total_students = $conn->query("SELECT COUNT(*) as total FROM students")->fetch_assoc()['total'];
    $total_subjects = $conn->query("SELECT COUNT(*) as total FROM subjects WHERE teacher_id = '$teacher_id'")->fetch_assoc()['total'];
    $today_attendance = $conn->query("SELECT COUNT(*) as total FROM attendance WHERE DATE(date) = CURDATE() AND teacher_id = '$teacher_id'")->fetch_assoc()['total'];
} catch (Exception $e) {
    $total_students = 0;
    $total_subjects = 0;
    $today_attendance = 0;
    error_log("Statistics error: " . $e->getMessage());
}

// Get subjects for dropdown
$subjects_result = $conn->query("SELECT * FROM subjects WHERE teacher_id = '$teacher_id'");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Attendance Dashboard</title>
    <link rel="stylesheet" href="dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-brand">
            <h2>Smart Attendance</h2>
        </div>
        <div class="nav-items">
            <span class="welcome">Welcome, <?php echo htmlspecialchars($teacher_name); ?></span>
            <a href="logout.php" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        </div>
    </nav>

    <div class="container">
        <!-- Statistics Cards -->
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3><?php echo $total_students; ?></h3>
                    <p>Total Students</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-book"></i>
                </div>
                <div class="stat-info">
                    <h3><?php echo $total_subjects; ?></h3>
                    <p>Subjects</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-info">
                    <h3><?php echo $today_attendance; ?></h3>
                    <p>Today's Attendance</p>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Left Sidebar -->
            <div class="sidebar">
                <ul class="sidebar-menu">
                    <li class="menu-item active" data-tab="dashboard">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </li>
                    <li class="menu-item" data-tab="students">
                        <i class="fas fa-user-graduate"></i> Students
                    </li>
                    <li class="menu-item" data-tab="subjects">
                        <i class="fas fa-book"></i> Subjects
                    </li>
                    <li class="menu-item" data-tab="attendance">
                        <i class="fas fa-calendar-alt"></i> Take Attendance
                    </li>
                    <li class="menu-item" data-tab="reports">
                        <i class="fas fa-chart-bar"></i> Reports
                    </li>
                </ul>
            </div>

            <!-- Content Area -->
            <div class="content-area">
                <!-- Dashboard Tab -->
                <div id="dashboard-tab" class="tab-content active">
                    <div class="tab-header">
                        <h2>Dashboard Overview</h2>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="quick-actions">
                        <button class="action-btn" onclick="switchTab('attendance')">
                            <i class="fas fa-camera"></i>
                            <span>Take Attendance</span>
                        </button>
                        <button class="action-btn" onclick="switchTab('students')">
                            <i class="fas fa-user-plus"></i>
                            <span>Add Student</span>
                        </button>
                        <button class="action-btn" onclick="switchTab('subjects')">
                            <i class="fas fa-book-medical"></i>
                            <span>Add Subject</span>
                        </button>
                    </div>
                    
                    <!-- Recent Activity -->
                    <div class="recent-activity">
                        <h3>Recent Attendance</h3>
                        <div id="recent-attendance-list">
                            <div class="loading-message">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>Loading recent attendance...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Students Management Tab -->
                <div id="students-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>Student Management</h2>
                        <button class="btn-primary" onclick="showAddStudentForm()">
                            <i class="fas fa-plus"></i> Add Student
                        </button>
                    </div>
                    
                    <!-- Add Student Form -->
                    <div id="add-student-form" class="form-container" style="display: none;">
                        <h3>Add New Student</h3>
                        <form id="student-form" enctype="multipart/form-data">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="enrollment_no">Enrollment No *</label>
                                    <input type="text" id="enrollment_no" name="enrollment_no" required 
                                           placeholder="Enter enrollment number">
                                </div>
                                <div class="form-group">
                                    <label for="student_name">Full Name *</label>
                                    <input type="text" id="student_name" name="name" required 
                                           placeholder="Enter full name">
                                </div>
                                <div class="form-group">
                                    <label for="year">Year *</label>
                                    <select id="year" name="year" required>
                                        <option value="">Select Year</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="semester">Semester *</label>
                                    <select id="semester" name="semester" required>
                                        <option value="">Select Semester</option>
                                        <option value="1st Sem">1st Semester</option>
                                        <option value="2nd Sem">2nd Semester</option>
                                        <option value="3rd Sem">3rd Semester</option>
                                        <option value="4th Sem">4th Semester</option>
                                        <option value="5th Sem">5th Semester</option>
                                        <option value="6th Sem">6th Semester</option>
                                        <option value="7th Sem">7th Semester</option>
                                        <option value="8th Sem">8th Semester</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="branch">Branch *</label>
                                    <input type="text" id="branch" name="branch" required 
                                           placeholder="e.g., Computer Science">
                                </div>
                                <div class="form-group full-width">
                                    <label>Student Photo *</label>
                                    <div class="photo-upload-container">
                                        <div class="photo-preview" id="photo-preview">
                                            <div class="photo-placeholder">
                                                <i class="fas fa-user-graduate"></i>
                                                <span>Photo Preview</span>
                                            </div>
                                        </div>
                                        <input type="file" id="photo-input" name="photo" accept="image/*" required 
                                               onchange="previewPhoto(this)">
                                        <label for="photo-input" class="file-input-label">
                                            <i class="fas fa-camera"></i> Choose Photo
                                        </label>
                                        <small class="photo-help">Clear face photo for facial recognition (JPG/PNG, max 2MB)</small>
                                    </div>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" onclick="hideAddStudentForm()" class="btn-secondary">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save"></i> Add Student
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Students List -->
                    <div class="students-list">
                        <div class="list-header">
                            <h3>Student List</h3>
                            <div class="search-filters">
                                <div class="search-bar">
                                    <input type="text" id="student-search" placeholder="Search students by name or enrollment...">
                                    <i class="fas fa-search"></i>
                                </div>
                                <select id="year-filter">
                                    <option value="">All Years</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                </select>
                                <select id="semester-filter">
                                    <option value="">All Semesters</option>
                                    <option value="1st Sem">1st Semester</option>
                                    <option value="2nd Sem">2nd Semester</option>
                                    <option value="3rd Sem">3rd Semester</option>
                                    <option value="4th Sem">4th Semester</option>
                                    <option value="5th Sem">5th Semester</option>
                                    <option value="6th Sem">6th Semester</option>
                                    <option value="7th Sem">7th Semester</option>
                                    <option value="8th Sem">8th Semester</option>
                                </select>
                            </div>
                        </div>
                        <div id="students-container">
                            <div class="loading-message">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>Loading students...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Subjects Management Tab -->
                <div id="subjects-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>Subject Management</h2>
                        <button class="btn-primary" onclick="showAddSubjectForm()">
                            <i class="fas fa-plus"></i> Add Subject
                        </button>
                    </div>

                    <!-- Add Subject Form -->
                    <div id="add-subject-form" class="form-container" style="display: none;">
                        <h3>Add New Subject</h3>
                        <form id="subject-form">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="subject_name">Subject Name *</label>
                                    <input type="text" id="subject_name" name="subject_name" required 
                                           placeholder="Enter subject name">
                                </div>
                                <div class="form-group">
                                    <label for="subject_code">Subject Code *</label>
                                    <input type="text" id="subject_code" name="subject_code" required 
                                           placeholder="Enter subject code">
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" onclick="hideAddSubjectForm()" class="btn-secondary">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save"></i> Add Subject
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Subjects List -->
                    <div class="subjects-list">
                        <h3>Your Subjects</h3>
                        <div id="subjects-container">
                            <div class="loading-message">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>Loading subjects...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Attendance Tab -->
                <div id="attendance-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>Take Attendance</h2>
                    </div>
                    
                    <!-- Attendance Setup -->
                    <div class="attendance-setup" id="attendance-setup">
                        <h3>Start Attendance Session</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="attendance-subject">Select Subject *</label>
                                <select id="attendance-subject" required>
                                    <option value="">Select Subject</option>
                                    <?php 
                                    if ($subjects_result && $subjects_result->num_rows > 0) {
                                        $subjects_result->data_seek(0);
                                        while($subject = $subjects_result->fetch_assoc()): ?>
                                            <option value="<?php echo $subject['id']; ?>">
                                                <?php echo htmlspecialchars($subject['subject_name']); ?> (<?php echo htmlspecialchars($subject['subject_code']); ?>)
                                            </option>
                                        <?php endwhile;
                                    } else { ?>
                                        <option value="" disabled>No subjects available. Please add subjects first.</option>
                                    <?php } ?>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="attendance-year">Year *</label>
                                <select id="attendance-year" required>
                                    <option value="">Select Year</option>
                                    <option value="1st Year">1st Year</option>
                                    <option value="2nd Year">2nd Year</option>
                                    <option value="3rd Year">3rd Year</option>
                                    <option value="4th Year">4th Year</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="attendance-semester">Semester *</label>
                                <select id="attendance-semester" required>
                                    <option value="">Select Semester</option>
                                    <option value="1st Sem">1st Semester</option>
                                    <option value="2nd Sem">2nd Semester</option>
                                    <option value="3rd Sem">3rd Semester</option>
                                    <option value="4th Sem">4th Semester</option>
                                    <option value="5th Sem">5th Semester</option>
                                    <option value="6th Sem">6th Semester</option>
                                    <option value="7th Sem">7th Semester</option>
                                    <option value="8th Sem">8th Semester</option>
                                </select>
                            </div>
                        </div>
                        <div class="setup-actions">
                            <button class="btn-primary" onclick="startAttendanceSession()">
                                <i class="fas fa-camera"></i> Start Attendance Session
                            </button>
                        </div>
                    </div>

                    <!-- Camera Interface -->
                    <div id="camera-interface" style="display: none;">
                        <div class="camera-header">
                            <h3>Facial Recognition Attendance</h3>
                            <div class="session-info">
                                <span id="session-subject"></span>
                                <span id="session-year-sem"></span>
                            </div>
                        </div>
                        
                        <div class="camera-container">
                            <div class="video-wrapper">
                                <video id="video" width="640" height="480" autoplay playsinline></video>
                                <div class="camera-overlay">
                                    <div class="face-guide"></div>
                                </div>
                            </div>
                            <canvas id="canvas" style="display: none;"></canvas>
                        </div>
                        
                        <div class="camera-controls">
                            <button class="btn-primary" onclick="captureImage()">
                                <i class="fas fa-camera"></i> Capture & Recognize
                            </button>
                            <button class="btn-secondary" onclick="stopCamera()">
                                <i class="fas fa-stop"></i> Stop Camera
                            </button>
                            <button class="btn-success" onclick="manualMarkAttendance()" style="display: none;">
                                <i class="fas fa-user-plus"></i> Manual Mark
                            </button>
                        </div>
                        
                        <div id="recognition-result" class="recognition-result">
                            <div class="result-placeholder">
                                <i class="fas fa-user-check"></i>
                                <p>Capture image to recognize student</p>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance List -->
                    <div id="attendance-list-container">
                        <h3>Today's Attendance Records</h3>
                        <div id="attendance-list">
                            <div class="info-message">
                                <p>No attendance records for today yet.</p>
                            </div>
                        </div>
                        <div class="export-actions">
                            <button id="export-btn" class="btn-success" style="display: none;" onclick="exportAttendance()">
                                <i class="fas fa-file-excel"></i> Export to Excel
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Reports Tab -->
                <div id="reports-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>Attendance Reports</h2>
                    </div>
                    
                    <div class="reports-container">
                        <div class="report-filters">
                            <h3>Generate Report</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="report-subject">Subject</label>
                                    <select id="report-subject">
                                        <option value="">All Subjects</option>
                                        <?php 
                                        if ($subjects_result) {
                                            $subjects_result->data_seek(0);
                                            while($subject = $subjects_result->fetch_assoc()): ?>
                                                <option value="<?php echo $subject['id']; ?>">
                                                    <?php echo htmlspecialchars($subject['subject_name']); ?>
                                                </option>
                                            <?php endwhile;
                                        } ?>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="report-year">Year</label>
                                    <select id="report-year">
                                        <option value="">All Years</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="report-semester">Semester</label>
                                    <select id="report-semester">
                                        <option value="">All Semesters</option>
                                        <option value="1st Sem">1st Semester</option>
                                        <option value="2nd Sem">2nd Semester</option>
                                        <option value="3rd Sem">3rd Semester</option>
                                        <option value="4th Sem">4th Semester</option>
                                        <option value="5th Sem">5th Semester</option>
                                        <option value="6th Sem">6th Semester</option>
                                        <option value="7th Sem">7th Semester</option>
                                        <option value="8th Sem">8th Semester</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="report-date-from">Date From</label>
                                    <input type="date" id="report-date-from">
                                </div>
                                <div class="form-group">
                                    <label for="report-date-to">Date To</label>
                                    <input type="date" id="report-date-to">
                                </div>
                            </div>
                            <div class="filter-actions">
                                <button class="btn-primary" onclick="generateReport()">
                                    <i class="fas fa-chart-bar"></i> Generate Report
                                </button>
                                <button class="btn-secondary" onclick="clearReportFilters()">
                                    <i class="fas fa-redo"></i> Clear Filters
                                </button>
                            </div>
                        </div>
                        
                        <div id="report-results">
                            <div class="info-message">
                                <i class="fas fa-chart-line"></i>
                                <p>Configure filters and generate report to view attendance analytics.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Spinner -->
    <div id="global-loading" class="global-loading" style="display: none;">
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Processing...</p>
        </div>
    </div>

    <script src="dashboard.js"></script>
</body>
</html>
