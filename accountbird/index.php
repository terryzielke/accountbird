<?php
// global variables
$database_connection = false;
$current_user = null;
$logged_in = false;
$admin = false;
$admin_user = false;

// connect to the database
require_once __DIR__ . '/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AccountBird</title>
    <link rel="stylesheet" type="text/css" href="/accountbird/css/theme.min.css">
</head>
<body>
<?php

if($database_connection){
    echo "<p>Database connection successful.</p>";

    if($logged_in){
        echo "<p>You are logged in.</p>";
    }
    else{
        echo "<p>You are not logged in.</p>";
    }
}
else{
    echo "<p>Database connection failed.</p>";
}
?>

</body>
</html>