<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$logFile = __DIR__ . '/debug.log';

function writeLog($message) {
    global $logFile;
    file_put_contents($logFile, date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL, FILE_APPEND);
}

writeLog('=== New Request ===');
writeLog('REQUEST_METHOD: ' . $_SERVER['REQUEST_METHOD']);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['success' => true, 'message' => 'API is working!']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Please use POST method']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    writeLog('ERROR: No input data received');
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit();
}

writeLog('INPUT DATA received');

try {
    // Connect to database
    $conn = new PDO('mysql:host=localhost;dbname=unity_registry;charset=utf8mb4', 'root', '');
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    writeLog('Connected to database');
    
    // Generate certificate ID if not provided
    $certificateId = $input['certificate_id'] ?? ('UNITY-' . date('Y') . '-' . strtoupper(substr($input['event_type'] ?? 'GEN', 0, 3)) . '-' . strtoupper(substr(uniqid(), -8)));
    
    // Prepare INSERT with all columns
    $sql = "INSERT INTO vital_events SET
        certificate_id = :certificate_id,
        event_type = :event_type,
        full_name = :full_name,
        event_date = :event_date,
        registration_date = NOW(),
        timestamp = NOW(),
        phone_number = :phone_number,
        region = :region,
        zone = :zone,
        woreda = :woreda,
        kebele = :kebele,
        status = 'active',
        gender = :gender,
        date_of_birth = :date_of_birth,
        national_id = :national_id,
        country_code = :country_code,
        email = :email,
        house_number = :house_number,
        sub_city = :sub_city,
        additional_address = :additional_address,
        event_time = :event_time,
        document_type = :document_type,
        document_number = :document_number,
        photo = :photo,
        spouse1_photo = :spouse1_photo,
        spouse2_photo = :spouse2_photo,
        spouse1_name = :spouse1_name,
        spouse2_name = :spouse2_name,
        ip_address = :ip_address,
        user_agent = :user_agent";
    
    $stmt = $conn->prepare($sql);
    
    $params = [
        ':certificate_id' => $certificateId,
        ':event_type' => $input['event_type'] ?? 'general',
        ':full_name' => $input['full_name'] ?? 'Unknown',
        ':event_date' => $input['event_date'] ?? date('Y-m-d'),
        ':phone_number' => $input['phone_number'] ?? '',
        ':region' => $input['region'] ?? '',
        ':zone' => $input['zone'] ?? '',
        ':woreda' => $input['woreda'] ?? '',
        ':kebele' => $input['kebele'] ?? '',
        ':gender' => $input['gender'] ?? '',
        ':date_of_birth' => $input['date_of_birth'] ?? null,
        ':national_id' => $input['national_id'] ?? '',
        ':country_code' => $input['country_code'] ?? '+251',
        ':email' => $input['email'] ?? '',
        ':house_number' => $input['house_number'] ?? '',
        ':sub_city' => $input['sub_city'] ?? '',
        ':additional_address' => $input['additional_address'] ?? '',
        ':event_time' => $input['event_time'] ?? null,
        ':document_type' => $input['document_type'] ?? '',
        ':document_number' => $input['document_number'] ?? '',
        ':photo' => $input['photo'] ?? null,
        ':spouse1_photo' => $input['spouse1_photo'] ?? null,
        ':spouse2_photo' => $input['spouse2_photo'] ?? null,
        ':spouse1_name' => $input['spouse1_name'] ?? ($input['spouse1'] ?? ''),
        ':spouse2_name' => $input['spouse2_name'] ?? ($input['spouse2'] ?? ''),
        ':ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
        ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
    ];
    
    if ($stmt->execute($params)) {
        $insertId = $conn->lastInsertId();
        writeLog("SUCCESS: Data saved! ID: $insertId, Certificate: $certificateId");
        
        echo json_encode([
            'success' => true,
            'message' => 'Event saved successfully!',
            'data' => [
                'certificate_id' => $certificateId,
                'id' => $insertId
            ]
        ]);
    } else {
        writeLog('ERROR: Execute failed');
        echo json_encode(['success' => false, 'error' => 'Failed to save data']);
    }
    
} catch (PDOException $e) {
    writeLog('PDO ERROR: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>