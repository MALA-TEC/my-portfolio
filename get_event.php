<?php
require_once __DIR__ . '/../config/database.php';

$db = Database::getInstance();
$db->validateApiKey();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $db->sendError('Method not allowed. Use GET.', 405);
}

$certificateId = $_GET['certificate_id'] ?? null;

if (!$certificateId) {
    $db->sendError('Certificate ID is required', 400);
}

try {
    $conn = $db->getConnection();
    
    $stmt = $conn->prepare("SELECT * FROM vital_events WHERE certificate_id = :certificate_id");
    $stmt->execute([':certificate_id' => $certificateId]);
    
    $event = $stmt->fetch();
    
    if (!$event) {
        $db->sendError('Event not found', 404);
    }
    
    $db->sendSuccess($event, 'Event retrieved successfully');
    
} catch (PDOException $e) {
    $db->sendError('Database error: ' . $e->getMessage(), 500);
}
?>