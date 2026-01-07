<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Middleware\Auth;
use App\Services\InvoiceService;

class BillingController
{
    public static function getInvoices(): void
    {
        $user = Auth::check();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;

        $pdo = Database::getInstance();

        // Get total
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM invoices WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $total = (int)$stmt->fetch()['total'];

        // Get invoices
        $stmt = $pdo->prepare("
            SELECT id, invoice_number, amount_zar, status, description, payment_method, invoice_date, paid_at, created_at
            FROM invoices 
            WHERE user_id = ?
            ORDER BY invoice_date DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$user['id'], $limit, $offset]);
        $invoices = $stmt->fetchAll();

        Response::paginated($invoices, $total, $page, $limit);
    }

    public static function getInvoice(int $id): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("
            SELECT id, invoice_number, amount_zar, status, description, payment_method, pdf_path, invoice_date, paid_at
            FROM invoices 
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$id, $user['id']]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            Response::error('Invoice not found', 404);
        }

        Response::success($invoice);
    }

    public static function downloadReceipt(int $id): void
    {
        $user = Auth::check();
        $pdo = Database::getInstance();

        $stmt = $pdo->prepare("SELECT pdf_path, invoice_number FROM invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user['id']]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            Response::error('Invoice not found', 404);
        }

        // Generate PDF if not exists
        if (empty($invoice['pdf_path']) || !file_exists($invoice['pdf_path'])) {
            $pdfPath = InvoiceService::generatePdf($id);
            
            if (!$pdfPath) {
                Response::error('Failed to generate receipt', 500);
            }
        } else {
            $pdfPath = $invoice['pdf_path'];
        }

        // Return download URL or serve file
        $appUrl = $_ENV['APP_URL'] ?? 'https://qr.ieosuia.com';
        $relativePath = str_replace($_ENV['INVOICE_PATH'] ?? '/var/www/api/invoices', '/api/invoices', $pdfPath);

        Response::success([
            'download_url' => $appUrl . $relativePath,
            'filename' => "IEOSUIA-QR-{$invoice['invoice_number']}.pdf"
        ]);
    }
}
