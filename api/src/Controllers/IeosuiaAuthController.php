<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\Auth;

final class IeosuiaAuthController
{
    private const FLOW_COOKIE = 'qr_ieosuia_oauth_flow';

    public static function start(): void
    {
        self::startSession();
        $verifier = self::base64Url(random_bytes(48));
        $state = self::base64Url(random_bytes(32));
        $type = ($_GET['account_type'] ?? 'customer') === 'admin' ? 'admin' : 'customer';
        $screenHint = (($_GET['screen_hint'] ?? '') === 'signup' && $type === 'customer') ? 'signup' : 'login';
        $pending = ['verifier' => $verifier, 'state' => $state, 'account_type' => $type, 'created_at' => time()];
        $_SESSION['ieosuia_oauth'] = $pending;
        self::storeFlowCookie($pending);
        $query = http_build_query(['client_id' => $_ENV['AUTH_CLIENT_ID'] ?? 'qr-web', 'redirect_uri' => self::redirectUri(), 'response_type' => 'code', 'scope' => 'openid profile email', 'account_type' => $type, 'screen_hint'=>$screenHint, 'state' => $state, 'code_challenge' => self::base64Url(hash('sha256', $verifier, true)), 'code_challenge_method' => 'S256'], '', '&', PHP_QUERY_RFC3986);
        header('Location: '.self::issuer().'/oauth/authorize?'.$query, true, 302);
        exit;
    }

    public static function callback(): void
    {
        self::startSession();
        $pending = is_array($_SESSION['ieosuia_oauth'] ?? null) ? $_SESSION['ieosuia_oauth'] : self::readFlowCookie();
        unset($_SESSION['ieosuia_oauth']);
        self::clearFlowCookie();
        if (!is_array($pending) || time() - (int) ($pending['created_at'] ?? 0) > 600 || !isset($_GET['state'], $_GET['code']) || !hash_equals((string) ($pending['state'] ?? ''), (string) $_GET['state'])) self::fail('invalid_response');
        $tokens = self::request('/oauth/token', ['grant_type' => 'authorization_code', 'client_id' => $_ENV['AUTH_CLIENT_ID'] ?? 'qr-web', 'redirect_uri' => self::redirectUri(), 'code' => (string) $_GET['code'], 'code_verifier' => (string) $pending['verifier']]);
        $profile = self::request('/oauth/userinfo', null, (string) ($tokens['access_token'] ?? ''));
        $type = (string) ($pending['account_type'] ?? 'customer');
        if (($profile['account_type'] ?? '') !== $type || empty($profile['sub']) || empty($profile['email']) || empty($profile['email_verified'])) self::fail('identity_not_allowed');
        $pdo = Database::getInstance();
        $email = strtolower((string) $profile['email']);
        if ($type === 'admin') {
            $stmt = $pdo->prepare('SELECT * FROM admin_users WHERE identity_uuid = ? AND LOWER(email) = ? AND is_active = 1 LIMIT 1');
            $stmt->execute([(string) $profile['sub'], $email]);
            $admin = $stmt->fetch();
            if (!$admin) self::fail('local_access_missing');
            $pdo->prepare('UPDATE admin_users SET last_login_at = NOW(), failed_attempts = 0, locked_until = NULL WHERE id = ?')->execute([$admin['id']]);
            $token = AdminAuthController::generateAdminToken((int) $admin['id']);
            header('Location: '.self::frontendUrl().'/admin/auth/callback#ieosuia_admin_token='.rawurlencode($token), true, 302);
            exit;
        }
        $stmt = $pdo->prepare('SELECT * FROM users WHERE identity_uuid = ? OR (identity_uuid IS NULL AND LOWER(email) = ?) ORDER BY identity_uuid IS NOT NULL DESC LIMIT 1');
        $stmt->execute([(string) $profile['sub'], $email]);
        $user = $stmt->fetch();
        if ($user && !empty($user['identity_uuid']) && !hash_equals((string) $user['identity_uuid'], (string) $profile['sub'])) self::fail('identity_conflict');
        if (!$user) {
            $stmt=$pdo->prepare("INSERT INTO users(email,password,name,plan,email_verified_at,identity_uuid,central_access_enabled,created_at,updated_at) VALUES(?,?,?,'Free',NOW(),?,1,NOW(),NOW())");
            $stmt->execute([$email,password_hash(bin2hex(random_bytes(32)),PASSWORD_DEFAULT),(string)($profile['name']??$email),(string)$profile['sub']]);
            $user=['id'=>(int)$pdo->lastInsertId(),'plan'=>'Free','identity_uuid'=>(string)$profile['sub'],'central_access_enabled'=>1];
        } else {
            $pdo->prepare('UPDATE users SET identity_uuid=?,central_access_enabled=1,email_verified_at=COALESCE(email_verified_at,NOW()),updated_at=NOW() WHERE id=?')->execute([(string)$profile['sub'],$user['id']]);
            $user['identity_uuid']=(string)$profile['sub'];$user['central_access_enabled']=1;
        }
        if (!(bool) ($user['central_access_enabled'] ?? false)) self::fail('local_access_missing');
        $token = Auth::generateToken((int) $user['id'], (string) ($user['plan'] ?? 'Free'));
        header('Location: '.self::frontendUrl().'/auth/callback#ieosuia_token='.rawurlencode($token), true, 302);
        exit;
    }

    public static function disabled(): void { http_response_code(410); header('Content-Type: application/json'); echo json_encode(['error'=>'Use central IEOSUIA authentication.']); }

    private static function request(string $path, ?array $fields = null, string $bearer = ''): array
    {
        $curl = curl_init(self::issuer().$path);
        $headers = ['Accept: application/json'];
        if ($bearer !== '') $headers[] = 'Authorization: Bearer '.$bearer;
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => $headers]);
        if ($fields !== null) curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($fields, '', '&', PHP_QUERY_RFC3986)]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
        $data = is_string($body) ? json_decode($body, true) : null;
        if ($status < 200 || $status >= 300 || !is_array($data)) self::fail('provider_unavailable');
        return $data;
    }

    private static function startSession(): void { if (session_status() !== PHP_SESSION_ACTIVE) { session_name('qr_ieosuia_sso'); session_set_cookie_params(['path' => '/api/auth/ieosuia', 'secure' => self::isHttps(), 'httponly' => true, 'samesite' => 'Lax']); session_start(); } }
    private static function storeFlowCookie(array $pending): void { $payload=self::base64Url(json_encode($pending,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));$signature=self::base64Url(hash_hmac('sha256',$payload,self::flowSecret(),true));setcookie(self::FLOW_COOKIE,$payload.'.'.$signature,['expires'=>time()+600,'path'=>'/api/auth/ieosuia','secure'=>self::isHttps(),'httponly'=>true,'samesite'=>'Lax']); }
    private static function readFlowCookie(): ?array { $parts=explode('.',(string)($_COOKIE[self::FLOW_COOKIE]??''),2);if(count($parts)!==2||!hash_equals(self::base64Url(hash_hmac('sha256',$parts[0],self::flowSecret(),true)),$parts[1]))return null;$json=base64_decode(strtr($parts[0].str_repeat('=',(4-strlen($parts[0])%4)%4),'-_','+/'),true);$value=$json===false?null:json_decode($json,true);return is_array($value)?$value:null; }
    private static function clearFlowCookie(): void { setcookie(self::FLOW_COOKIE,'',['expires'=>1,'path'=>'/api/auth/ieosuia','secure'=>self::isHttps(),'httponly'=>true,'samesite'=>'Lax']); }
    private static function flowSecret(): string { $secret=(string)($_ENV['AUTH_FLOW_SECRET']??$_ENV['JWT_SECRET']??'');if($secret==='')throw new \RuntimeException('AUTH flow secret is not configured.');return $secret; }
    private static function issuer(): string { return rtrim((string) ($_ENV['AUTH_ISSUER'] ?? 'https://auth.ieosuia.com'), '/'); }
    private static function redirectUri(): string { return (string) ($_ENV['AUTH_REDIRECT_URI'] ?? 'https://qr.ieosuia.com/api/auth/ieosuia/callback'); }
    private static function frontendUrl(): string { return rtrim((string) ($_ENV['FRONTEND_URL'] ?? 'https://qr.ieosuia.com'), '/'); }
    private static function base64Url(string $value): string { return rtrim(strtr(base64_encode($value), '+/', '-_'), '='); }
    private static function isHttps(): bool { return ($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off'; }
    private static function fail(string $reason): never { error_log('IEOSUIA SSO failed: '.$reason); header('Location: '.self::frontendUrl().'/?sso=failed&reason='.rawurlencode($reason), true, 302); exit; }
}
