<?php
require_once __DIR__ . '/../config/database.php';

$db = Database::getInstance();
$db->validateApiKey();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $db->sendError('Method not allowed. Use GET.', 405);
}

try {
    $conn = $db->getConnection();
    
    // Pagination
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = ($page - 1) * $limit;
    
    // Filters
    $eventType = $_GET['event_type'] ?? null;
    $region = $_GET['region'] ?? null;
    $search = $_GET['search'] ?? null;
    
    $whereConditions = [];
    $params = [];
    
    if ($eventType) {
        $whereConditions[] = "event_type = :event_type";
        $params[':event_type'] = $eventType;
    }
    
    if ($region) {
        $whereConditions[] = "region = :region";
        $params[':region'] = $region;
    }
    
    if ($search) {
        $whereConditions[] = "(full_name LIKE :search OR certificate_id LIKE :search OR phone_number LIKE :search)";
        $params[':search'] = "%$search%";
    }
    
    $whereClause = !empty($whereConditions) ? "WHERE " . implode(" AND ", $whereConditions) : "";
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM vital_events $whereClause";
    $countStmt = $conn->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];
    
    // Get events
    $sql = "SELECT * FROM vital_events $whereClause ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $conn->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $events = $stmt->fetchAll();
    
    $db->sendSuccess([
        'events' => $events,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $limit,
            'total' => $total,
            'total_pages' => ceil($total / $limit)
        ]
    ], 'Events retrieved successfully');
    
} catch (PDOException $e) {
    $db->sendError('Database error: ' . $e->getMessage(), 500);
}
?>