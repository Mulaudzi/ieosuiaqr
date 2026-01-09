# IEOSUIA QR Platform - PHP API Backend

Plain PHP REST API backend for the IEOSUIA QR platform. No frameworks - just vanilla PHP with Composer dependencies.

## Requirements

- PHP 8.1+
- MySQL 8.0+ / MariaDB 10.5+
- Composer
- Nginx/Apache

## Installation

### 1. Install Dependencies

```bash
cd api
composer install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update the following in `.env`:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` - Your MySQL credentials
- `JWT_SECRET` - Generate a secure random string (min 32 chars)
- `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` - From PayFast dashboard
- `GEOIP_DB_PATH` - Path to GeoLite2-City.mmdb

### 3. Create Database

```bash
mysql -u root -p
CREATE DATABASE ieosuia_qr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

mysql -u your_user -p ieosuia_qr < database/schema.sql
```

### 4. Download GeoIP Database

1. Sign up for a free MaxMind account: https://www.maxmind.com/en/geolite2/signup
2. Download GeoLite2-City.mmdb
3. Place in `/api/geoip/GeoLite2-City.mmdb`

### 5. Create Required Directories

```bash
mkdir -p geoip invoices
chmod 755 geoip invoices
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name qr.ieosuia.com;

    # Frontend (React build)
    root /var/www/qr.ieosuia.com/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API routing
    location /api/ {
        alias /var/www/qr.ieosuia.com/api/;
        try_files $uri $uri/ /api/index.php$is_args$args;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    # Invoice PDFs (protected by app auth)
    location /api/invoices/ {
        internal;
        alias /var/www/qr.ieosuia.com/api/invoices/;
    }
}
```

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /v1/auth/register | No | Register new user |
| POST | /v1/auth/login | No | Login, returns JWT |
| POST | /v1/auth/logout | Yes | Logout |
| POST | /v1/auth/verify-email | No | Verify email with token |
| POST | /v1/auth/forgot-password | No | Request password reset |
| POST | /v1/auth/reset-password | No | Reset password with token |
| GET | /v1/user/profile | Yes | Get current user |
| PUT | /v1/user/profile | Yes | Update profile |

### QR Codes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /v1/qr | Yes | Create QR code |
| GET | /v1/qr | Yes | List user's QR codes |
| GET | /v1/qr/:id | Yes | Get single QR code |
| PUT | /v1/qr/:id | Yes | Update QR code |
| DELETE | /v1/qr/:id | Yes | Delete QR code |
| POST | /v1/qr/bulk | Yes (Enterprise) | Bulk import from CSV |

### Scans

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | /v1/scan/log?id=X | No | Log scan & redirect |
| GET | /v1/qr/:id/scans | Yes | Get scan logs (Pro+) |
| GET | /v1/qr/:id/stats | Yes | Get scan statistics |

### Subscriptions & Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /v1/subscriptions/plans | No | Get all plans |
| GET | /v1/subscriptions/current | Yes | Get user's subscription |
| POST | /v1/subscriptions/cancel | Yes | Cancel subscription |
| POST | /v1/payments/checkout | Yes | Generate PayFast URL |
| POST | /v1/webhooks/payfast | No | PayFast ITN webhook |

### Billing

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /v1/billing/invoices | Yes | List invoices |
| GET | /v1/billing/invoices/:id | Yes | Get invoice details |
| GET | /v1/billing/invoices/:id/receipt | Yes | Download PDF receipt |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /v1/analytics/dashboard | Yes (Pro+) | Get dashboard stats |
| GET | /v1/analytics/export | Yes (Pro+) | Export scans as CSV |

## Plan Features

### Free (R0)
- 5 QR codes max
- Basic types: URL, Text, Email, Phone, SMS
- PNG download only
- No tracking

### Pro (R179/month or R1,728/year)
- 50 QR codes
- All QR types including WiFi, vCard, Event, Location
- Custom colors
- PNG, SVG, PDF downloads
- Basic scan tracking
- Dynamic QR codes (updateable content)

### Enterprise (R549/month or R5,270/year)
- Unlimited QR codes
- All Pro features
- Advanced analytics with geo tracking
- Custom branding/logos
- Bulk CSV import
- API access
- Priority support

## PayFast Integration

### Sandbox Testing

Use these test credentials in sandbox mode:
- Card: 4000 0000 0000 0002
- Expiry: Any future date
- CVV: 123

### Production Checklist

1. Switch `PAYFAST_SANDBOX=false` in `.env`
2. Update to production merchant credentials
3. Ensure webhook URL is accessible: `https://qr.ieosuia.com/api/v1/webhooks/payfast`
4. Test a real transaction with minimum amount

## Security Notes

- All passwords hashed with bcrypt
- IPs anonymized (MD5 hashed) for GDPR compliance
- JWT tokens expire after 1 hour
- Rate limiting on auth endpoints (5 attempts/5 minutes)
- CORS restricted to app domain
- Prepared statements prevent SQL injection
- Input validation on all endpoints

## Troubleshooting

### JWT Authentication Fails
- Check `JWT_SECRET` is set and matches between requests
- Verify token hasn't expired
- Ensure `Authorization: Bearer {token}` header is sent

### GeoIP Not Working
- Verify GeoLite2-City.mmdb exists at configured path
- Check file permissions (readable by PHP)
- Local IPs (127.0.0.1) won't return location data

### PayFast ITN Not Received
- Verify webhook URL is publicly accessible
- Check PayFast dashboard for failed notifications
- Enable logging and check for errors

## License

Proprietary - IEOSUIA (Pty) Ltd
