<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $titre }}</title>
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
            background-color: #6366F1; /* Primary color */
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
        .action {
            text-align: center;
            margin-top: 30px;
            margin-bottom: 20px;
        }
        .btn {
            display: inline-block;
            background-color: #6366F1;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
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
            <h2>{{ $titre }}</h2>
            <div class="message">
                <p>{{ $messageStr }}</p>
            </div>
            
            @if(isset($actionUrl) && isset($actionText))
            <div class="action">
                <p>Cliquez sur le lien ci-dessous pour répondre, ou connectez-vous à votre espace patient.</p>
                <!-- Dans un cas réel on met un lien vers l'URL du frontend pour répondre -->
                <a href="{{ $actionUrl }}" class="btn">{{ $actionText }}</a>
            </div>
            @endif
            
            <p>Merci pour votre confiance,<br>L'équipe Medico.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Medico. Tous droits réservés.
        </div>
    </div>
</body>
</html>
