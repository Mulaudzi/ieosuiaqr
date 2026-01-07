<?php

namespace App\Services;

use App\Config\Database;
use Dompdf\Dompdf;
use Dompdf\Options;

class InvoiceService
{
    public static function create(int $userId, int $subscriptionId, float $amount, string $planName): int
    {
        $pdo = Database::getInstance();

        // Generate invoice number
        $year = date('Y');
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM invoices WHERE YEAR(created_at) = ?");
        $stmt->execute([$year]);
        $count = (int)$stmt->fetch()['count'] + 1;
        $invoiceNumber = "INV-{$year}-" . str_pad($count, 5, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare("
            INSERT INTO invoices (user_id, subscription_id, invoice_number, amount_zar, status, description, payment_method, invoice_date, paid_at, created_at)
            VALUES (?, ?, ?, ?, 'paid', ?, 'PayFast', CURDATE(), NOW(), NOW())
        ");
        $stmt->execute([
            $userId,
            $subscriptionId,
            $invoiceNumber,
            $amount,
            "{$planName} Plan Subscription"
        ]);

        $invoiceId = (int)$pdo->lastInsertId();

        // Generate PDF
        self::generatePdf($invoiceId);

        return $invoiceId;
    }

    public static function generatePdf(int $invoiceId): ?string
    {
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("
            SELECT i.*, u.name as user_name, u.email as user_email
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            WHERE i.id = ?
        ");
        $stmt->execute([$invoiceId]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            return null;
        }

        // Create HTML template
        $html = self::getInvoiceHtml($invoice);

        // Generate PDF with Dompdf
        try {
            $options = new Options();
            $options->set('isRemoteEnabled', true);
            $options->set('isHtml5ParserEnabled', true);
            $options->set('defaultFont', 'Helvetica');

            $dompdf = new Dompdf($options);
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            // Save to file
            $invoicePath = $_ENV['INVOICE_PATH'] ?? __DIR__ . '/../../invoices';
            if (!is_dir($invoicePath)) {
                mkdir($invoicePath, 0755, true);
            }

            $filename = "{$invoicePath}/{$invoice['invoice_number']}.pdf";
            file_put_contents($filename, $dompdf->output());

            // Update database with path
            $stmt = $pdo->prepare("UPDATE invoices SET pdf_path = ? WHERE id = ?");
            $stmt->execute([$filename, $invoiceId]);

            return $filename;

        } catch (\Exception $e) {
            error_log("PDF generation error: " . $e->getMessage());
            return null;
        }
    }

    private static function getInvoiceHtml(array $invoice): string
    {
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $date = date('F j, Y', strtotime($invoice['invoice_date']));
        $paidAt = $invoice['paid_at'] ? date('F j, Y H:i', strtotime($invoice['paid_at'])) : '-';
        $amount = number_format($invoice['amount_zar'], 2);

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice {$invoice['invoice_number']}</title>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 2px solid #14b8a6;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #14b8a6;
        }
        .logo span {
            color: #0d9488;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            margin: 0;
            color: #14b8a6;
            font-size: 28px;
        }
        .invoice-number {
            color: #666;
            font-size: 14px;
        }
        .details {
            margin-bottom: 40px;
        }
        .details-row {
            display: flex;
            margin-bottom: 20px;
        }
        .details-col {
            width: 50%;
        }
        .details-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .details-value {
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }
        th {
            background-color: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            border-bottom: 2px solid #14b8a6;
        }
        td {
            padding: 16px 12px;
            border-bottom: 1px solid #eee;
        }
        .total-row td {
            font-weight: bold;
            font-size: 16px;
            border-bottom: none;
            border-top: 2px solid #14b8a6;
        }
        .amount {
            text-align: right;
        }
        .status-paid {
            display: inline-block;
            background-color: #dcfce7;
            color: #166534;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .footer a {
            color: #14b8a6;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">IEOSUIA <span>QR</span></div>
        <div class="invoice-title">
            <h1>INVOICE</h1>
            <div class="invoice-number">{$invoice['invoice_number']}</div>
        </div>
    </div>

    <div class="details">
        <div class="details-row">
            <div class="details-col">
                <div class="details-label">Bill To</div>
                <div class="details-value">
                    <strong>{$invoice['user_name']}</strong><br>
                    {$invoice['user_email']}
                </div>
            </div>
            <div class="details-col">
                <div class="details-label">Invoice Date</div>
                <div class="details-value">{$date}</div>
                <br>
                <div class="details-label">Status</div>
                <div class="details-value">
                    <span class="status-paid">PAID</span>
                </div>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Payment Method</th>
                <th class="amount">Amount (ZAR)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{$invoice['description']}</td>
                <td>{$invoice['payment_method']}</td>
                <td class="amount">R {$amount}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2">Total</td>
                <td class="amount">R {$amount}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p>Thank you for your business!</p>
        <p>
            IEOSUIA QR &bull; <a href="{$appUrl}">{$appUrl}</a><br>
            For questions, contact support@ieosuia.com
        </p>
    </div>
</body>
</html>
HTML;
    }
}
