<?php
// Output Buffering शुरू करें। यह किसी भी आकस्मिक आउटपुट (जैसे: स्पेस, लाइन ब्रेक, या वार्निंग) को JSON से पहले जाने से रोकेगा।
ob_start();
session_start();
require_once 'config_db.php'; // सुनिश्चित करें कि config_db.php में PYTHON_SERVER परिभाषित नहीं है

// JSON हेडर सेट करें
header('Content-Type: application/json');

// --- JSON आउटपुट से पहले पिछले सभी आउटपुट को हटा दें ---
// यह सुनिश्चित करता है कि JavaScript को शुद्ध JSON मिले।
if (ob_get_length()) {
    ob_clean();
}
// --------------------------------------------------------

if (!isset($_SESSION['user_id']) || !$_SESSION['logged_in']) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized Access. Please login.', 'logged_in' => false]);
    exit();
}

$teacher_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

// PYTHON_SERVER definition (अब यह केवल एक ही जगह परिभाषित होना चाहिए)
if (!defined('PYTHON_SERVER')) {
    define('PYTHON_SERVER', 'http://127.0.0.1:5000');
}

// Helper functions 
function sendJsonResponse($data) {
    echo json_encode($data);
    exit();
}

function handleAjaxError($message, $code = 500) {
    http_response_code($code);
    sendJsonResponse([
        'success' => false,
        'message' => $message,
        'error_code' => $code
    ]);
}

function callPythonAPI($endpoint, $data = null, $method = 'POST') {
    $url = PYTHON_SERVER . $endpoint;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if ($method === 'POST' && $data !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        $post_data = is_array($data) ? json_encode($data) : $data; 
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($http_code === 200 && $response) {
        $result = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Python API returned invalid JSON: $response");
            return ['success' => false, 'message' => 'Python server returned invalid data.'];
        }
        return $result;
    } else {
        error_log("Python API call failed: $http_code - $curl_error - Response: " . ($response ?: 'No response'));
        return [
            'success' => false, 
            'message' => 'Python server connection error. HTTP: ' . $http_code . ' CURL: ' . $curl_error
        ];
    }
}

function validateRequiredFields($fields, $data) {
    $missing = [];
    foreach ($fields as $field) {
        if (empty($data[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        throw new Exception("Missing required fields: " . implode(', ', $missing));
    }
}

function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}


// Main action handler
switch ($action) {
    case 'add_student':
        addStudent();
        break;
    case 'get_students':
        getStudents();
        break;
    case 'add_subject':
        addSubject();
        break;
    case 'get_subjects':
        getSubjects();
        break;
    case 'recognize_face':
        recognizeFace();
        break;
    case 'add_face':
        addFace();
        break;
    case 'mark_attendance':
        markAttendance();
        break;
    case 'get_todays_attendance':
        getTodaysAttendance();
        break;
    case 'export_attendance':
        exportAttendance();
        break;
    case 'get_recent_attendance':
        getRecentAttendance();
        break;
    case 'reload_faces':
        reloadFaces();
        break;
    default:
        handleAjaxError('Invalid action: ' . $action, 400);
}

// -------------------------------------------------------------
// Functions Implementation
// -------------------------------------------------------------

function recognizeFace() {
    $image_data = $_POST['image'] ?? ''; 
    $year = $_POST['year'] ?? '';
    $semester = $_POST['semester'] ?? '';
    
    if (empty($image_data)) {
        handleAjaxError('No image data provided', 400);
        return;
    }
    
    try {
        $result = callPythonAPI('/recognize', [
            'image' => $image_data,
            'year' => $year,
            'semester' => $semester
        ]);
        
        if (!$result || !isset($result['success'])) {
             if ($result && isset($result['message'])) {
                 throw new Exception($result['message']);
             }
             throw new Exception('Python server response failed or invalid.');
        }

        sendJsonResponse($result);
        
    } catch (Exception $e) {
        error_log("Face recognition error: " . $e->getMessage());
        handleAjaxError('Face recognition failed: ' . $e->getMessage());
    }
}

function addFace() {
    $image_data = $_POST['image'] ?? '';
    $student_id = $_POST['student_id'] ?? '';
    
    if (empty($image_data) || empty($student_id)) {
        echo json_encode(['success' => false, 'message' => 'Missing image or student ID']);
        return;
    }
    
    $result = callPythonAPI('/add_face', [
        'image' => $image_data,
        'student_id' => $student_id
    ]);
    
    echo json_encode($result);
}

function reloadFaces() {
    try {
        $result = callPythonAPI('/reload_faces');
        
        if ($result === null) {
            throw new Exception('Python server not responding');
        }
        
        sendJsonResponse($result);
        
    } catch (Exception $e) {
        error_log("Reload faces error: " . $e->getMessage());
        sendJsonResponse([
            'success' => true,
            'message' => 'Faces reload initiated (check Python server logs)'
        ]);
    }
}

function addStudent() {
    global $conn;
    
    try {
        // Sanitize inputs
        $enrollment_no = sanitizeInput($_POST['enrollment_no'] ?? '');
        $name = sanitizeInput($_POST['name'] ?? '');
        $year = sanitizeInput($_POST['year'] ?? '');
        $semester = sanitizeInput($_POST['semester'] ?? '');
        $branch = sanitizeInput($_POST['branch'] ?? '');
        
        validateRequiredFields(['enrollment_no', 'name', 'year', 'semester', 'branch'], [
            'enrollment_no' => $enrollment_no,
            'name' => $name,
            'year' => $year,
            'semester' => $semester,
            'branch' => $branch
        ]);
        
        // Check if enrollment number already exists
        $check_stmt = $conn->prepare("SELECT id FROM students WHERE enrollment_no = ?");
        $check_stmt->bind_param("s", $enrollment_no);
        $check_stmt->execute();
        
        if ($check_stmt->get_result()->num_rows > 0) {
            throw new Exception('Enrollment number already exists');
        }
        
        // Handle file upload
        $photo_path = '';
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = 'student_photos/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            // Validate file type
            $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            $file_type = $_FILES['photo']['type'];
            
            if (!in_array($file_type, $allowed_types)) {
                throw new Exception('Only JPG, PNG, and GIF images are allowed');
            }
            
            // Validate file size (2MB max)
            if ($_FILES['photo']['size'] > 2 * 1024 * 1024) {
                throw new Exception('Image size should be less than 2MB');
            }
            
            $file_extension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
            $filename = $enrollment_no . '_' . time() . '.' . $file_extension;
            $photo_path = $upload_dir . $filename;
            
            if (!move_uploaded_file($_FILES['photo']['tmp_name'], $photo_path)) {
                throw new Exception('Failed to upload photo');
            }
        } else {
            throw new Exception('Student photo is required');
        }
        
        // Insert student with photo path
        $stmt = $conn->prepare("INSERT INTO students (enrollment_no, name, year, semester, branch, photo_path) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $enrollment_no, $name, $year, $semester, $branch, $photo_path);
        
        if ($stmt->execute()) {
            $student_id = $stmt->insert_id;
            
            // Send to Python facial recognition system
            if (!empty($photo_path) && file_exists($photo_path)) {
                $image_data = base64_encode(file_get_contents($photo_path));
                $image_data = 'data:image/jpeg;base64,' . $image_data;
                
                $face_result = callPythonAPI('/add_face', [
                    'image' => $image_data,
                    'student_id' => $student_id
                ]);
                
                if (!$face_result['success']) {
                    error_log("Face registration failed for student $student_id: " . $face_result['message']);
                    // Continue anyway, just log the error
                }
            }
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Student added successfully',
                'student_id' => $student_id
            ]);
        } else {
            throw new Exception('Database error: ' . $stmt->error);
        }
        
    } catch (Exception $e) {
        error_log("Add student error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

function getStudents() {
    global $conn;
    
    try {
        if (!$conn || $conn->connect_error) {
            throw new Exception("Database connection failed: " . ($conn->connect_error ?? 'Unknown error'));
        }
        
        $search = $_GET['search'] ?? '';
        $year_filter = $_GET['year_filter'] ?? '';
        $semester_filter = $_GET['semester_filter'] ?? '';
        
        $query = "SELECT *, CONCAT(year, ' - ', semester) as year_sem FROM students WHERE 1=1";
        $params = [];
        $types = '';
        
        if (!empty($search)) {
            $query .= " AND (name LIKE ? OR enrollment_no LIKE ?)";
            $search_term = "%$search%";
            $params[] = $search_term;
            $params[] = $search_term;
            $types .= 'ss';
        }
        
        if (!empty($year_filter)) {
            $query .= " AND year = ?";
            $params[] = $year_filter;
            $types .= 's';
        }
        
        if (!empty($semester_filter)) {
            $query .= " AND semester = ?";
            $params[] = $semester_filter;
            $types .= 's';
        }
        
        $query .= " ORDER BY year, semester, name";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query: " . $conn->error);
        }
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $students = [];
        
        while ($row = $result->fetch_assoc()) {
            // Handle photo path safely
            if (!empty($row['photo_path']) && file_exists($row['photo_path'])) {
                $row['photo_url'] = $row['photo_path'];
            } else {
                $row['photo_url'] = null;
                $row['photo_path'] = null; // Ensure consistency
            }
            $students[] = $row;
        }
        
        $stmt->close();
        
        sendJsonResponse($students);
        
    } catch (Exception $e) {
        error_log("Get students error: " . $e->getMessage());
        handleAjaxError("Failed to load students: " . $e->getMessage());
    }
}

function addSubject() {
    global $conn, $teacher_id;
    
    try {
        $subject_name = $_POST['subject_name'] ?? '';
        $subject_code = $_POST['subject_code'] ?? '';
        
        if (empty($subject_name) || empty($subject_code)) {
            throw new Exception('Subject name and code are required');
        }
        
        // Check if subject code already exists
        $check_stmt = $conn->prepare("SELECT id FROM subjects WHERE subject_code = ? AND teacher_id = ?");
        $check_stmt->bind_param("ss", $subject_code, $teacher_id);
        $check_stmt->execute();
        
        if ($check_stmt->get_result()->num_rows > 0) {
            throw new Exception('Subject code already exists');
        }
        
        $stmt = $conn->prepare("INSERT INTO subjects (subject_name, subject_code, teacher_id) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $subject_name, $subject_code, $teacher_id);
        
        if ($stmt->execute()) {
            sendJsonResponse([
                'success' => true, 
                'message' => 'Subject added successfully'
            ]);
        } else {
            throw new Exception('Database error: ' . $stmt->error);
        }
        
    } catch (Exception $e) {
        error_log("Add subject error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

function getSubjects() {
    global $conn, $teacher_id;
    
    try {
        if (!$conn || $conn->connect_error) {
            throw new Exception("Database connection failed");
        }
        
        $stmt = $conn->prepare("SELECT * FROM subjects WHERE teacher_id = ? ORDER BY subject_name");
        if (!$stmt) {
            throw new Exception("Failed to prepare query: " . $conn->error);
        }
        
        $stmt->bind_param("s", $teacher_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $subjects = [];
        
        while ($row = $result->fetch_assoc()) {
            $subjects[] = $row;
        }
        
        $stmt->close();
        
        sendJsonResponse($subjects);
        
    } catch (Exception $e) {
        error_log("getSubjects error: " . $e->getMessage());
        handleAjaxError("Failed to load subjects: " . $e->getMessage());
    }
}

function markAttendance() {
    global $conn, $teacher_id;
    
    try {
        $student_id = $_POST['student_id'] ?? '';
        $subject_id = $_POST['subject_id'] ?? '';
        $date = date('Y-m-d');
        
        if (empty($student_id) || empty($subject_id)) {
            throw new Exception('Student ID and Subject ID are required');
        }
        
        // Check if attendance already marked for today
        $check_stmt = $conn->prepare("SELECT id FROM attendance WHERE student_id = ? AND subject_id = ? AND date = ?");
        $check_stmt->bind_param("iis", $student_id, $subject_id, $date);
        $check_stmt->execute();
        
        if ($check_stmt->get_result()->num_rows > 0) {
            throw new Exception('Attendance already marked for today');
        }
        
        $stmt = $conn->prepare("INSERT INTO attendance (student_id, subject_id, teacher_id, date) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iiss", $student_id, $subject_id, $teacher_id, $date);
        
        if ($stmt->execute()) {
            sendJsonResponse([
                'success' => true, 
                'message' => 'Attendance marked successfully'
            ]);
        } else {
            throw new Exception('Database error: ' . $stmt->error);
        }
        
    } catch (Exception $e) {
        error_log("Mark attendance error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

function getTodaysAttendance() {
    global $conn, $teacher_id;
    
    try {
        if (!$conn || $conn->connect_error) {
            throw new Exception("Database connection failed");
        }
        
        $query = "SELECT a.*, s.name as student_name, sub.subject_name 
                  FROM attendance a 
                  JOIN students s ON a.student_id = s.id 
                  JOIN subjects sub ON a.subject_id = sub.id 
                  WHERE a.teacher_id = ? AND a.date = CURDATE() 
                  ORDER BY a.marked_at DESC";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query: " . $conn->error);
        }
        
        $stmt->bind_param("s", $teacher_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $attendance = [];
        
        while ($row = $result->fetch_assoc()) {
            $attendance[] = $row;
        }
        
        $stmt->close();
        
        sendJsonResponse($attendance); 
        
    } catch (Exception $e) {
        error_log("Get today's attendance error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Failed to load attendance: ' . $e->getMessage(),
            'attendance' => [] 
        ]);
    }
}

function getRecentAttendance() {
    global $conn, $teacher_id;
    
    try {
        if (!$conn || $conn->connect_error) {
            throw new Exception("Database connection failed");
        }
        
        $query = "SELECT a.*, s.name as student_name, sub.subject_name 
                  FROM attendance a 
                  JOIN students s ON a.student_id = s.id 
                  JOIN subjects sub ON a.subject_id = sub.id 
                  WHERE a.teacher_id = ? 
                  ORDER BY a.marked_at DESC 
                  LIMIT 10";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query: " . $conn->error);
        }
        
        $stmt->bind_param("s", $teacher_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $attendance = [];
        
        while ($row = $result->fetch_assoc()) {
            $attendance[] = $row;
        }
        
        $stmt->close();
        
        sendJsonResponse($attendance);
        
    } catch (Exception $e) {
        error_log("getRecentAttendance error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Failed to load recent attendance: ' . $e->getMessage(),
            'attendance' => [] 
        ]);
    }
}

function exportAttendance() {
    global $conn, $teacher_id;
    
    try {
        $query = "SELECT a.date, s.enrollment_no, s.name as student_name, sub.subject_name, 
                             s.year as year, s.semester as semester, s.branch, a.marked_at 
                  FROM attendance a 
                  JOIN students s ON a.student_id = s.id 
                  JOIN subjects sub ON a.subject_id = sub.id 
                  WHERE a.teacher_id = ? 
                  ORDER BY a.date DESC, a.marked_at DESC 
                  LIMIT 1000"; // Limit for safety
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Failed to prepare query");
        }
        
        $stmt->bind_param("s", $teacher_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to execute query");
        }
        
        $result = $stmt->get_result();
        
        // Create CSV 
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="attendance_' . date('Y-m-d') . '.csv"');
        
        // Reset output buffer for CSV headers
        if (ob_get_length()) {
            ob_clean();
        }

        $output = fopen('php://output', 'w');
        
        // Headers
        fputcsv($output, [
            'Date', 'Enrollment No', 'Student Name', 'Subject', 
            'Year', 'Semester', 'Branch', 'Time'
        ]);
        
        while ($row = $result->fetch_assoc()) {
            fputcsv($output, [
                $row['date'],
                $row['enrollment_no'],
                $row['student_name'],
                $row['subject_name'],
                $row['year'],
                $row['semester'],
                $row['branch'],
                $row['marked_at']
            ]);
        }
        
        fclose($output);
        exit;
        
    } catch (Exception $e) {
        error_log("Export attendance error: " . $e->getMessage());
        // Do not use handleAjaxError() here as headers might have been sent.
        die("Failed to export attendance: " . $e->getMessage()); 
    }
}

?>