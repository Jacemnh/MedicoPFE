<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau message de contact</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        h2 { color: #8B5CF6; }
        .info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .message-content { background: #fff; padding: 15px; border-left: 4px solid #8B5CF6; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Nouveau message depuis le formulaire de contact (Medico)</h2>
        <div class="info">
            <strong>De :</strong> {{ $senderEmail }}
        </div>
        <h3>Message :</h3>
        <div class="message-content">
            {{ $messageContent }}
        </div>
    </div>
</body>
</html>
