<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Controllers\InventoryController;

class InventoryControllerTest extends TestCase
{
    public function testPlanLimitsAreDefined(): void
    {
        // Using reflection to access private static property
        $reflection = new \ReflectionClass(InventoryController::class);
        $property = $reflection->getProperty('planLimits');
        $property->setAccessible(true);
        
        $planLimits = $property->getValue();
        
        $this->assertIsArray($planLimits);
        $this->assertArrayHasKey('Free', $planLimits);
        $this->assertArrayHasKey('Pro', $planLimits);
        $this->assertArrayHasKey('Enterprise', $planLimits);
    }

    public function testFreePlanHasItemLimit(): void
    {
        $reflection = new \ReflectionClass(InventoryController::class);
        $property = $reflection->getProperty('planLimits');
        $property->setAccessible(true);
        
        $planLimits = $property->getValue();
        
        $this->assertArrayHasKey('max_items', $planLimits['Free']);
        $this->assertEquals(3, $planLimits['Free']['max_items']);
        $this->assertFalse($planLimits['Free']['can_edit']);
    }

    public function testProPlanHasHigherLimit(): void
    {
        $reflection = new \ReflectionClass(InventoryController::class);
        $property = $reflection->getProperty('planLimits');
        $property->setAccessible(true);
        
        $planLimits = $property->getValue();
        
        $this->assertEquals(100, $planLimits['Pro']['max_items']);
        $this->assertTrue($planLimits['Pro']['can_edit']);
    }

    public function testEnterprisePlanHasUnlimitedItems(): void
    {
        $reflection = new \ReflectionClass(InventoryController::class);
        $property = $reflection->getProperty('planLimits');
        $property->setAccessible(true);
        
        $planLimits = $property->getValue();
        
        $this->assertEquals(PHP_INT_MAX, $planLimits['Enterprise']['max_items']);
        $this->assertTrue($planLimits['Enterprise']['can_edit']);
    }

    public function testPlanLimitsHierarchy(): void
    {
        $reflection = new \ReflectionClass(InventoryController::class);
        $property = $reflection->getProperty('planLimits');
        $property->setAccessible(true);
        
        $planLimits = $property->getValue();
        
        // Enterprise > Pro > Free
        $this->assertGreaterThan($planLimits['Pro']['max_items'], $planLimits['Enterprise']['max_items']);
        $this->assertGreaterThan($planLimits['Free']['max_items'], $planLimits['Pro']['max_items']);
    }
}
