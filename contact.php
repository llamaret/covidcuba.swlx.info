<?php
if(!isset( $_POST['name']) || !isset($_POST['email']) || !isset($_POST['message']) ) {
	echo '¡Algo anda mal! Revise los datos y vuelva a intentar';
    die();
}
	$email_from = $_POST['email'];
	$email_subject = "Mensaje desde el formulario de Covid Cuba";
	$email_message = "Mensaje enviado por ".stripslashes($_POST['name'])."\n\n";
	$email_message .=" el ".date("d/m/Y")." a las ".date("H:i")."\n\n";
	$email_message .= stripslashes($_POST['message']);

	$headers = 'From: '.$email_from."\r\n" .
	"Content-type: text/plain; charset=\"UTF-8\"" . "\r\n"; 
   'Reply-To: '.$email_from."\r\n" ;

	mail('llamaret@webmisolutions.com', $email_subject, $email_message, $headers);
	echo "Gracias por contactarnos.";
	die();
?>
