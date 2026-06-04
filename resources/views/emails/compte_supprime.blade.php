<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Votre compte a été supprimé</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f6f9;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        .header {
            background-color: #ef4444; /* Red color for alert */
            color: #fff;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .message {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .footer {
            background-color: #f8fafc;
            text-align: center;
            padding: 15px;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Medico</h1>
        </div>
        <div class="content">
            <h2 style="color: #ef4444;">Bonjour {{ $userName }},</h2>
            
            <div class="message">
                <p>Nous vous informons que votre compte sur la plateforme <strong>Medico</strong> a été supprimé pour des raisons techniques.</p>
                <p>Si vous avez des questions ou si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter à l'adresse support@medico.com.</p>
            </div>
            
            <p>Cordialement,<br>L'équipe Medico.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Medico. Tous droits réservés.
        </div>
    </div>
</body>
</html>
