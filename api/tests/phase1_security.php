<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
require_once dirname(__DIR__).'/src/Middleware/Auth.php';
require_once dirname(__DIR__).'/src/Controllers/AdminAuthController.php';

use App\Middleware\Auth;
use App\Controllers\AdminAuthController;

$failures=[];$assert=static function(bool $ok,string $message)use(&$failures):void{if(!$ok)$failures[]=$message;};
$method=new ReflectionMethod(Auth::class,'decodeToken');$method->setAccessible(true);
$valid=Auth::generateToken(7,'Free');
$decoded=$method->invoke(null,$valid);
$assert(is_object($decoded)&&($decoded->aud??'')==='qr-test','valid configured token rejected');
$parts=explode('.',$valid);
$encode=static fn(array $value):string=>rtrim(strtr(base64_encode((string)json_encode($value)),'+/','-_'),'=');
$payload=json_decode(base64_decode(strtr($parts[1],'-_','+/')),true);
$headerNone=$encode(['typ'=>'JWT','alg'=>'none']);
$assert($method->invoke(null,$headerNone.'.'.$parts[1].'.'.$parts[2])===null,'algorithm confusion token accepted');
$payload['aud']='another-app';$body=$encode($payload);$signature=rtrim(strtr(base64_encode(hash_hmac('sha256',$parts[0].'.'.$body,$_ENV['JWT_SECRET'],true)),'+/','-_'),'=');
$assert($method->invoke(null,$parts[0].'.'.$body.'.'.$signature)===null,'wrong audience token accepted');
$payload['aud']='qr-test';unset($payload['exp']);$body=$encode($payload);$signature=rtrim(strtr(base64_encode(hash_hmac('sha256',$parts[0].'.'.$body,$_ENV['JWT_SECRET'],true)),'+/','-_'),'=');
$assert($method->invoke(null,$parts[0].'.'.$body.'.'.$signature)===null,'token without expiration accepted');
$_ENV['JWT_SECRET']='change-me-to-a-long-random-secret';
try{Auth::generateToken(7,'Free');$assert(false,'placeholder signing secret accepted');}catch(RuntimeException){}
$_ENV['JWT_SECRET']=hash('sha256','ieosuia-qr-phase1-test-fixture');
$scan=(string)file_get_contents(dirname(__DIR__).'/src/Controllers/ScanController.php');
$storage=(string)file_get_contents(dirname(__DIR__,2).'/src/hooks/useQRStorage.ts');
$assert(str_contains($scan,"'content' => \$opaqueLookup ?"),'sequential scan payload disclosure remains');
$assert(str_contains($scan,'TRUSTED_PROXY_IPS'),'untrusted proxy headers remain enabled');
$assert(!str_contains($storage,'localStorage.setItem(STORAGE_KEY, JSON.stringify(apiCodes))'),'authenticated QR payloads remain cached in localStorage');
$_ENV['ADMIN_JWT_ISSUER']='https://qr.ieosuia.test';
$_ENV['ADMIN_JWT_AUDIENCE']='qr-admin-test';
$adminToken=AdminAuthController::generateAdminToken(9);
$decodeAdmin=new ReflectionMethod(AdminAuthController::class,'decodeAdminToken');$decodeAdmin->setAccessible(true);
$adminClaims=$decodeAdmin->invoke(null,$adminToken);
$assert(($adminClaims['iss']??'')==='https://qr.ieosuia.test'&&($adminClaims['aud']??'')==='qr-admin-test','admin token issuer/audience validation missing');
$assert(($adminClaims['sub']??'')==='9'&&preg_match('/^[a-f0-9]{32}$/',(string)($adminClaims['jti']??''))===1,'admin subject/JTI claims missing');
$stepGenerator=new ReflectionMethod(AdminAuthController::class,'generateStepToken');$stepGenerator->setAccessible(true);
$stepValidator=new ReflectionMethod(AdminAuthController::class,'validateStepToken');$stepValidator->setAccessible(true);
$stepToken=$stepGenerator->invoke(null,9,1);
$assert(is_array($stepValidator->invoke(null,$stepToken,1)),'valid admin step token rejected');
$assert($stepValidator->invoke(null,$stepToken,2)===null,'admin step token accepted for wrong step');
$entry=(string)file_get_contents(dirname(__DIR__).'/index.php');
$assert(str_contains($entry,'X-Correlation-ID')&&str_contains($entry,'IEOSUIA_CORRELATION_ID'),'request correlation ID missing');
if($failures){foreach($failures as $failure)fwrite(STDERR,"FAIL: {$failure}\n");exit(1);}echo "QR Phase 1 security checks passed (13 assertions).\n";
