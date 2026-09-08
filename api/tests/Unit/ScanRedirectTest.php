<?php

namespace Tests\Unit;

use App\Controllers\ScanController;
use PHPUnit\Framework\TestCase;

class ScanRedirectTest extends TestCase
{
    public function testCurrentUrlContentRedirects(): void
    {
        $this->assertSame(
            'https://example.com/page',
            ScanController::resolveRedirectUrl('url', '{"content":"https://example.com/page"}')
        );
    }

    public function testLegacyNestedUrlContentRedirects(): void
    {
        $this->assertSame(
            'https://example.com/legacy',
            ScanController::resolveRedirectUrl('url', '{"content":"{\\"url\\":\\"https://example.com/legacy\\"}"}')
        );
    }

    public function testPhoneContentUsesTelephoneDestination(): void
    {
        $this->assertSame(
            'tel:+27695383000',
            ScanController::resolveRedirectUrl('phone', '{"phoneNumber":"+27 69 538 3000"}')
        );
    }

    public function testWhatsappContentUsesWebDestination(): void
    {
        $this->assertSame(
            'https://wa.me/27695383000?text=Hello%20there',
            ScanController::resolveRedirectUrl(
                'whatsapp',
                '{"phoneNumber":"+27 69 538 3000","message":"Hello there"}'
            )
        );
    }

    public function testAppDestinationFollowsDevice(): void
    {
        $content = [
            'appStoreUrl' => 'https://apps.apple.com/app/example',
            'playStoreUrl' => 'https://play.google.com/store/apps/details?id=example',
        ];

        $this->assertSame(
            $content['appStoreUrl'],
            ScanController::resolveRedirectUrl('app', $content, 'Mozilla/5.0 (iPhone)')
        );
        $this->assertSame(
            $content['playStoreUrl'],
            ScanController::resolveRedirectUrl('app', $content, 'Mozilla/5.0 (Linux; Android 14)')
        );
    }

    public function testUnsafeOrPlainTextContentDoesNotRedirect(): void
    {
        $this->assertNull(ScanController::resolveRedirectUrl('url', '{"content":"javascript:alert(1)"}'));
        $this->assertNull(ScanController::resolveRedirectUrl('text', '{"content":"Plain text"}'));
    }
}
