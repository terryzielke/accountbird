<?php
// z-init.php

// Use the existing $conn object
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $full_name = $_POST['full_name'] ?? '';
    $email = $_POST['email'] ?? '';
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if ($full_name && $email && $username && $password) {
        // Create tables
        $schema = <<<SQL
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    province_state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    payment_method VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    start_datetime DATETIME,
    end_datetime DATETIME,
    capacity INT,
    price DECIMAL(10, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    program_id INT,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('confirmed', 'cancelled', 'pending') DEFAULT 'confirmed',
    payment_status ENUM('paid', 'unpaid', 'refunded') DEFAULT 'unpaid',
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    amount DECIMAL(10, 2),
    payment_date DATETIME,
    status ENUM('success', 'failed', 'refunded'),
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    email VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
SQL;

        if ($conn->multi_query($schema)) {
            do {
                $conn->next_result();
            } while ($conn->more_results());
        }

        // Insert admin user
        $stmt = $conn->prepare("INSERT INTO admins (username, password_hash, full_name, email) VALUES (?, SHA2(?, 256), ?, ?)");
        $stmt->bind_param("ssss", $username, $password, $full_name, $email);
        if ($stmt->execute()) {
            header("Location: /");
            exit;
        } else {
            echo "<p>Error inserting admin user: " . $stmt->error . "</p>";
        }
        $stmt->close();
    } else {
        echo "<p>Please fill in all fields.</p>";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Initialize System</title>
</head>
<body>
    <h2>System Initialization</h2>
    <form method="POST">
        <label>Full Name:<br><input type="text" name="full_name" required></label><br><br>
        <label>Email:<br><input type="email" name="email" required></label><br><br>
        <label>Username:<br><input type="text" name="username" required></label><br><br>
        <label>Password:<br><input type="password" name="password" required></label><br><br>
        <button type="submit">Initialize System</button>
    </form>
</body>
</html>
