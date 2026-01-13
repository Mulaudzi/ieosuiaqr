# API Testing Guide

## Quick Start

```bash
cd api
composer install
composer test
```

## Test Suites

### Unit Tests (`api/tests/Unit/`)

Fast tests that don't require database:

| Test File | Description |
|-----------|-------------|
| `ValidatorTest.php` | Input validation rules |
| `ResponseTest.php` | API response structure |
| `QrControllerTest.php` | QR code type constants |
| `InventoryControllerTest.php` | Plan limit definitions |

Run only unit tests:
```bash
composer test -- --testsuite Unit
```

### Integration Tests (`api/tests/Integration/`)

Full workflow tests using test database:

| Test File | Description |
|-----------|-------------|
| `TestCase.php` | Base class with utilities |
| `DatabaseTest.php` | Database connection tests |
| `AuthTest.php` | JWT and user formatting |
| `ApiRoutesTest.php` | Route configuration |
| `QrCodeCrudTest.php` | QR code CRUD operations |
| `InventoryCrudTest.php` | Inventory CRUD operations |
| `UserProfileCrudTest.php` | User profile CRUD operations |
| `SubscriptionCrudTest.php` | Subscription CRUD operations |
| `ScanLogTest.php` | QR scan logging and analytics |
| `BillingTest.php` | Invoice and payment operations |

Run only integration tests:
```bash
composer test -- --testsuite Integration
```

## Database Setup

Integration tests require a test database. Create it with:

```sql
CREATE DATABASE qr_test;
```

Copy your production schema:
```bash
mysqldump -u root -p --no-data your_production_db | mysql -u root -p qr_test
```

## Configuration

Update `phpunit.xml` or create `phpunit.xml.dist` for local overrides:

```xml
<php>
    <env name="DB_HOST" value="127.0.0.1"/>
    <env name="DB_NAME" value="qr_test"/>
    <env name="DB_USER" value="your_user"/>
    <env name="DB_PASS" value="your_pass"/>
</php>
```

## Coverage Reports

Generate HTML coverage report:
```bash
composer test-coverage
```

Open `coverage/index.html` in browser.

## Writing Tests

### Extend TestCase for integration tests:

```php
class MyFeatureTest extends TestCase
{
    private array $testUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->testUser = $this->createTestUser(['plan' => 'Pro']);
    }

    protected function tearDown(): void
    {
        $this->deleteTestUser($this->testUser['id']);
    }

    public function testMyFeature(): void
    {
        // Create test data
        $qr = $this->createTestQRCode($this->testUser['id']);
        
        // Perform operations
        // ...
        
        // Assert
        $this->assertDatabaseHas('qr_codes', ['id' => $qr['id']]);
    }
}
```

### Available helper methods:

- `createTestUser(array $overrides = [])` - Create test user
- `deleteTestUser(int $userId)` - Delete user and cascade data
- `createTestQRCode(int $userId, array $overrides = [])` - Create QR code
- `createTestInventoryItem(int $userId, ?int $qrId, array $overrides = [])` - Create inventory item
- `generateTestToken(int $userId, string $plan)` - Generate JWT
- `assertDatabaseHas(string $table, array $conditions)` - Assert record exists
- `assertDatabaseMissing(string $table, array $conditions)` - Assert record missing

## CI/CD

Tests run automatically on push/PR via GitHub Actions. See `.github/workflows/tests.yml`.
