<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Controllers\QrController;

class QrControllerTest extends TestCase
{
    public function testQrTypesAreDefined(): void
    {
        // Using reflection to access private constants
        $reflection = new \ReflectionClass(QrController::class);
        
        $basicTypes = $reflection->getConstant('BASIC_TYPES');
        $premiumTypes = $reflection->getConstant('PREMIUM_TYPES');
        
        $this->assertIsArray($basicTypes);
        $this->assertIsArray($premiumTypes);
        
        $this->assertContains('url', $basicTypes);
        $this->assertContains('text', $basicTypes);
        $this->assertContains('email', $basicTypes);
        $this->assertContains('phone', $basicTypes);
        
        $this->assertContains('wifi', $premiumTypes);
        $this->assertContains('vcard', $premiumTypes);
        $this->assertContains('event', $premiumTypes);
        $this->assertContains('location', $premiumTypes);
    }

    public function testAllQrTypesAreUnique(): void
    {
        $reflection = new \ReflectionClass(QrController::class);
        
        $basicTypes = $reflection->getConstant('BASIC_TYPES');
        $premiumTypes = $reflection->getConstant('PREMIUM_TYPES');
        $allTypes = array_merge($basicTypes, $premiumTypes);
        
        $this->assertEquals(count($allTypes), count(array_unique($allTypes)));
    }

    public function testBasicAndPremiumTypesAreDisjoint(): void
    {
        $reflection = new \ReflectionClass(QrController::class);
        
        $basicTypes = $reflection->getConstant('BASIC_TYPES');
        $premiumTypes = $reflection->getConstant('PREMIUM_TYPES');
        
        $intersection = array_intersect($basicTypes, $premiumTypes);
        $this->assertEmpty($intersection, 'Basic and premium types should not overlap');
    }
}
