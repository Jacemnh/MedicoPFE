<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1f2937; font-size: 13px; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
        .logo-section h1 { font-size: 28px; color: #6366f1; font-weight: 800; letter-spacing: -0.5px; }
        .logo-section p { color: #6b7280; font-size: 12px; margin-top: 4px; }
        .invoice-info { text-align: right; }
        .parties { width: 100%; margin-bottom: 30px; }
        .parties td { width: 50%; vertical-align: top; padding: 15px 0; }
        .party-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
        .party-box.pro { border-left: 4px solid #6366f1; }
        .party-box.company { border-left: 4px solid #10b981; }
        .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
        .party-name { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .party-detail { font-size: 12px; color: #6b7280; line-height: 1.6; }
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .details-table th { background: #6366f1; color: white; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .details-table th:last-child { text-align: right; }
        .details-table td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; }
        .details-table td:last-child { text-align: right; font-weight: 700; }
        .totals-box { float: right; width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #374151; }
        .total-row.grand { background: #6366f1; color: white; padding: 12px 16px; border-radius: 8px; font-size: 16px; font-weight: 800; margin-top: 8px; }
        .clearfix::after { content: ""; display: table; clear: both; }
        .status-badge { display: inline-block; padding: 8px 24px; border-radius: 50px; font-weight: 700; font-size: 13px; margin: 30px 0; }
        .status-paid { background: #d1fae5; color: #059669; }
        .footer { border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 11px; margin-top: 50px; }
    </style>
</head>
<body>
    <table style="width:100%; margin-bottom: 30px; border-bottom: 3px solid #6366f1; padding-bottom: 20px;">
        <tr>
            <td style="vertical-align: top;">
                <h1 style="font-size: 28px; color: #6366f1; font-weight: 800;">Medico</h1>
                <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">Service d'abonnement professionnel</p>
            </td>
            <td style="text-align: right; vertical-align: top;">
                <h2 style="font-size: 22px; color: #111827; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Facture</h2>
                <div style="color: #6366f1; font-weight: 700; font-size: 14px; margin-top: 4px;">{{ $invoice_number }}</div>
                <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">Date : {{ $date }}</div>
            </td>
        </tr>
    </table>

    <table class="parties">
        <tr>
            <td style="padding-right: 15px;">
                <div class="party-box company">
                    <div class="party-label">Émetteur</div>
                    <div class="party-name">Medico SAS</div>
                    <div class="party-detail">
                        123 Avenue de la Santé<br>
                        75008 Paris, France<br>
                        contact@medico-app.fr
                    </div>
                </div>
            </td>
            <td style="padding-left: 15px;">
                <div class="party-box pro">
                    <div class="party-label">Client</div>
                    <div class="party-name">Dr. {{ $user->nom }} {{ $user->prenom }}</div>
                    <div class="party-detail">
                        {{ $cabinet->nom ?? 'Cabinet Médical' }}<br>
                        {{ $cabinet->adresse ?? '' }}<br>
                        {{ $cabinet->ville ?? '' }}, {{ $cabinet->pays ?? '' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <table class="details-table">
        <thead>
            <tr>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Prix Unitaire</th>
                <th>Total HT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td><strong>{{ $item['description'] }}</strong></td>
                <td>1</td>
                <td>{{ number_format($item['amount'], 2, ',', ' ') }} €</td>
                <td>{{ number_format($item['amount'], 2, ',', ' ') }} €</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="clearfix">
        <div class="totals-box">
            <div class="total-row">
                <span style="float: left;">Total HT</span>
                <span style="float: right;">{{ number_format($total, 2, ',', ' ') }} €</span>
            </div>
            <div class="clearfix"></div>
            <div class="total-row">
                <span style="float: left;">TVA (0%)</span>
                <span style="float: right;">0,00 €</span>
            </div>
            <div class="clearfix"></div>
            <div class="total-row grand">
                <span style="float: left;">Total TTC</span>
                <span style="float: right;">{{ number_format($total, 2, ',', ' ') }} €</span>
            </div>
            <div class="clearfix"></div>
        </div>
    </div>

    <div style="text-align: center;">
        <span class="status-badge status-paid">✓ PAYÉE</span>
    </div>

    <div class="footer">
        Medico SAS — Capital 100 000€ — RCS Paris 123 456 789<br>
        Document généré électroniquement — Merci de votre confiance.
    </div>
</body>
</html>
