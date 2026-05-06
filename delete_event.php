<?php
require_once __DIR__ . '/../config/database.php';

$db = Database::getInstance();
$db->validateApiKey();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    $db->sendError('Method not allowed. Use DELETE.', 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$certificateId = $input['certificate_id'] ?? $_GET['certificate_id'] ?? null;

if (!$certificateId) {
    $db->sendError('Certificate ID is required', 400);
}

try {
    $conn = $db->getConnection();
    
    // Check if exists
    $checkStmt = $conn->prepare("SELECT id FROM vital_events WHERE certificate_id = :certificate_id");
    $checkStmt->execute([':certificate_id' => $certificateId]);
    
    if ($checkStmt->rowCount() === 0) {
        $db->sendError('Event not found', 404);
    }
    
    // Delete
    $stmt = $conn->prepare("DELETE FROM vital_events WHERE certificate_id = :certificate_id");
    $stmt->execute([':certificate_id' => $certificateId]);
    
    $db->sendSuccess(null, 'Event deleted successfully');
    
} catch (PDOException $e) {
    $db->sendError('Database error: ' . $e->getMessage(), 500);
}
?>