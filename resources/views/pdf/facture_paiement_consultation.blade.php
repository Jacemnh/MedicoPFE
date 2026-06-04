<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 13px; padding: 40px; }
        
        .header-table { width: 100%; margin-bottom: 30px; border-bottom: 3px solid #8B5CF6; padding-bottom: 20px; }
        .logo-section h1 { font-size: 28px; color: #8B5CF6; font-weight: 800; }
        .logo-section p { color: #6b7280; font-size: 12px; margin-top: 4px; }
        
        .invoice-info { text-align: right; }
        .invoice-info h2 { font-size: 22px; color: #111827; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
        .inv-number { color: #8B5CF6; font-weight: 700; font-size: 14px; margin-top: 4px; }
        .inv-date { color: #6b7280; font-size: 12px; margin-top: 2px; }

        .parties { width: 100%; margin-bottom: 30px; }
        .parties td { width: 50%; vertical-align: top; }
        .party-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 0 5px; }
        .party-box.pro { border-left: 4px solid #8B5CF6; }
        .party-box.patient { border-left: 4px solid #3B82F6; }
        .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
        .party-name { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .party-detail { font-size: 12px; color: #6b7280; line-height: 1.6; }

        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .details-table th { background: #8B5CF6; color: white; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .details-table td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; }
        .details-table td:last-child { text-align: right; font-weight: 700; }

        .totals-container { width: 100%; margin-bottom: 30px; }
        .totals-box { float: right; width: 280px; }
        .total-row { padding: 8px 0; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; clear: both; }
        .total-row.grand { background: #8B5CF6; color: white; padding: 12px 16px; border-radius: 8px; font-size: 16px; font-weight: 800; margin-top: 8px; border-bottom: none; }
        .total-label { float: left; }
        .total-value { float: right; }

        .status-box { text-align: center; margin: 30px 0; clear: both; }
        .status-badge { display: inline-block; padding: 8px 24px; border-radius: 50px; font-weight: 700; font-size: 13px; }
        .status-paid { background: #d1fae5; color: #059669; }
        .status-pending { background: #fef3c7; color: #d97706; }

        .footer { border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 11px; line-height: 1.8; }
        .footer strong { color: #6b7280; }
        .clearfix::after { content: ""; display: table; clear: both; }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td class="logo-section">
                <h1>Medico</h1>
                <p>Plateforme de gestion médicale</p>
            </td>
            <td class="invoice-info">
                <h2>Facture</h2>
                <div class="inv-number">{{ $invoiceNumber }}</div>
                <div class="inv-date">Date : {{ $dateFacture }}</div>
            </td>
        </tr>
    </table>

    <table class="parties">
        <tr>
            <td style="padding-right: 10px;">
                <div class="party-box pro">
                    <div class="party-label">Professionnel de santé</div>
                    <div class="party-name">Dr. {{ $pro->user->nom }} {{ $pro->user->prenom }}</div>
                    <div class="party-detail">
                        @if($cabinet)
                            {{ $cabinet->nom }}<br>
                            {{ $cabinet->adresse }}<br>
                            {{ $cabinet->ville }}, {{ $cabinet->pays }}
                        @endif
                    </div>
                </div>
            </td>
            <td style="padding-left: 10px;">
                <div class="party-box patient">
                    <div class="party-label">Patient</div>
                    <div class="party-name">{{ $patientUser->nom }} {{ $patientUser->prenom }}</div>
                    <div class="party-detail">
                        {{ $patientUser->email }}<br>
                        {{ $patientUser->telephone ?? '' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <table class="details-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Date du RDV</th>
                <th>Montant</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>{{ $rdv->service->nom ?? 'Consultation médicale' }}</strong><br>
                    <span style="color: #6b7280; font-size: 11px;">Consultation avec Dr. {{ $pro->user->nom }}</span>
                </td>
                <td>{{ $dateRdv }}</td>
                <td>{{ number_format($payment->montant, 2, ',', ' ') }} €</td>
            </tr>
        </tbody>
    </table>

    <div class="clearfix">
        <div class="totals-box">
            <div class="total-row">
                <span class="total-label">Sous-total HT</span>
                <span class="total-value">{{ number_format($payment->montant, 2, ',', ' ') }} €</span>
            </div>
            <div class="total-row">
                <span class="total-label">TVA (0%)</span>
                <span class="total-value">0,00 €</span>
            </div>
            <div class="total-row grand">
                <span class="total-label">Total TTC</span>
                <span class="total-value">{{ number_format($payment->montant, 2, ',', ' ') }} €</span>
            </div>
        </div>
    </div>

    <div class="status-box">
        <span class="status-badge {{ $payment->statut === 'paye' ? 'status-paid' : 'status-pending' }}">
            {{ $payment->statut === 'paye' ? '✓ PAYÉE' : '⏳ EN ATTENTE' }}
        </span>
    </div>

    <div class="footer">
        <strong>Medico — Plateforme de gestion médicale</strong><br>
        Ce document est généré automatiquement et fait office de facture.<br>
        Merci de votre confiance.
    </div>
</body>
</html>
