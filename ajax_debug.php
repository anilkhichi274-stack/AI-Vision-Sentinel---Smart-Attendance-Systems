<?php
session_start();
require_once 'config_db.php';

header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (!isset($_SESSION['user_id']) || !$_SESSION['logged_in']) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$teacher_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

error_log("AJAX Debug: Action = $action, Teacher ID = $teacher_id");

switch ($action) {
    case 'get_subjects':
        debugGetSubjects();
        break;
    default:
        echo json_encode(['debug' => true, 'message' => 'Unknown action', 'action' => $action]);
}

function debugGetSubjects() {
    global $conn, $teacher_id;
    
    error_log("Debug: Starting getSubjects for teacher: $teacher_id");
    
    // Check connection
    if (!$conn) {
        error_log("Debug: Database connection is null");
        echo json_encode(['error' => 'Database connection failed']);
        return;
    }
    
    if ($conn->connect_error) {
        error_log("Debug: Database connection error: " . $conn->connect_error);
        echo json_encode(['error' => 'Database connection error: ' . $conn->connect_error]);
        return;
    }
    
    error_log("Debug: Database connection OK");
    
    // Test query
    $test_query = "SELECT 1 as test";
    if (!$conn->query($test_query)) {
        error_log("Debug: Test query failed: " . $conn->error);
        echo json_encode(['error' => 'Test query failed: ' . $conn->error]);
        return;
    }
    
    error_log("Debug: Test query passed");
    
    // Check if subjects table exists
    $table_check = $conn->query("SHOW TABLES LIKE 'subjects'");
    if ($table_check->num_rows === 0) {
        error_log("Debug: Subjects table does not exist");
        echo json_encode(['error' => 'Subjects table does not exist']);
        return;
    }
    
    error_log("Debug: Subjects table exists");
    
    // Get subjects
    $stmt = $conn->prepare("SELECT * FROM subjects WHERE teacher_id = ? ORDER BY subject_name");
    if (!$stmt) {
        error_log("Debug: Prepare failed: " . $conn->error);
        echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
        return;
    }
    
    $stmt->bind_param("s", $teacher_id);
    
    if (!$stmt->execute()) {
        error_log("Debug: Execute failed: " . $stmt->error);
        echo json_encode(['error' => 'Execute failed: ' . $stmt->error]);
        return;
    }
    
    $result = $stmt->get_result();
    $subjects = [];
    
    while ($row = $result->fetch_assoc()) {
        $subjects[] = $row;
    }
    
    error_log("Debug: Found " . count($subjects) . " subjects");
    
    $stmt->close();
    
    echo json_encode([
        'debug' => true,
        'count' => count($subjects),
        'subjects' => $subjects,
        'teacher_id' => $teacher_id
    ]);
}
?>