<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Votre code de liaison cabinet</title>
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
            background-color: #6366F1; /* Primary Indigo color */
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
        .code-box {
            background-color: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 2px;
            color: #6366F1;
            margin: 0;
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
            <h2>Bonjour,</h2>
            
            <div class="message">
                <p>Le <strong>Dr. {{ $prenom }} {{ $nom }}</strong> vous invite à rejoindre son cabinet sur la plateforme Medico.</p>
                <p>Veuillez utiliser le code d'accès ci-dessous lors de la création de votre compte secrétaire pour vous lier automatiquement à son cabinet :</p>
            </div>
            
            <div class="code-box">
                <p class="code">{{ $code }}</p>
            </div>
            
            <p>Si vous n'attendiez pas cet email, vous pouvez l'ignorer.</p>

            <p>Cordialement,<br>L'équipe Medico.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Medico. Tous droits réservés.
        </div>
    </div>
</body>
</html>
