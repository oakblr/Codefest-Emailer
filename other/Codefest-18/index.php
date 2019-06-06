<?php
  $servername = getenv('IP');
    $username = "cryogenicplanet";
    $password = "";
    $database = "c9";
    $dbport = 3306;
      $db = new mysqli($servername, $username, $password, $database, $dbport);
    // Check connection
    if ($db->connect_error) {
        die("Connection failed: " . $db->connect_error);
    } 
    //$authcode = $_POST['authcode'];

    $code = $_REQUEST['authcode'];
      $open = substr($code,0,9);
  if ($open == "Congrats!") {
    $hash = substr($code,9);
  }
  else {
    $hash = $code;
  }
    $sql = 'SELECT * FROM Teams WHERE Hash="'. $hash .'"';
         $result = $db->query($sql);
    if ($result->num_rows > 0) {
         while($row = $result->fetch_assoc()) {
            if($row['Status'] != 1){
                 $sql = "UPDATE Teams SET Status=1 WHERE Hash='" .$hash."'";
if ($db->query($sql) === TRUE) {
    echo "Sucessful Checked-In Team: " . $row['Name'];
} else {
    echo "Error updating record: " . $conn->error;
}
            } else {
                echo "Already Checked-In";
            }
}} else {
    echo "Team Not Found";
}

$db->close();
?>