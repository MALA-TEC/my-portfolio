<?php
require_once __DIR__ . '/../config/database.php';

$db = Database::getInstance();
$db->validateApiKey();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $db->sendError('Method not allowed. Use GET.', 405);
}

try {
    $conn = $db->getConnection();
    
    // Total events by type
    $typeStmt = $conn->query("
        SELECT event_type, COUNT(*) as count 
        FROM vital_events 
        GROUP BY event_type
    ");
    $byType = $typeStmt->fetchAll();
    
    // Total events by region
    $regionStmt = $conn->query("
        SELECT region, COUNT(*) as count 
        FROM vital_events 
        WHERE region IS NOT NULL
        GROUP BY region 
        ORDER BY count DESC 
        LIMIT 10
    ");
    $byRegion = $regionStmt->fetchAll();
    
    // Monthly statistics (last 12 months)
    $monthlyStmt = $conn->query("
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as count
        FROM vital_events
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
    ");
    $monthly = $monthlyStmt->fetchAll();
    
    // Total count
    $totalStmt = $conn->query("SELECT COUNT(*) as total FROM vital_events");
    $total = $totalStmt->fetch()['total'];
    
    // Today's registrations
    $todayStmt = $conn->query("
        SELECT COUNT(*) as today 
        FROM vital_events 
        WHERE DATE(created_at) = CURDATE()
    ");
    $today = $todayStmt->fetch()['today'];
    
    $db->sendSuccess([
        'total_events' => (int)$total,
        'today_events' => (int)$today,
        'by_type' => $byType,
        'by_region' => $byRegion,
        'monthly_stats' => $monthly,
        'last_updated' => date('Y-m-d H:i:s')
    ], 'Statistics retrieved successfully');
    
} catch (PDOException $e) {
    $db->sendError('Database error: ' . $e->getMessage(), 500);
}
?>