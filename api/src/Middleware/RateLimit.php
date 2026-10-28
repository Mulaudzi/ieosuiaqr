<?php

namespace App\Middleware;

use App\Helpers\Response;

class RateLimit
{
    private static string $cacheDir = '/tmp/rate_limit/';

    public static function check(string $key, int $maxAttempts = 5, int $decayMinutes = 1): void
    {
        $identifier = md5($key . self::getClientIp());
        $cacheFile = self::$cacheDir . $identifier;

        if (!is_dir(self::$cacheDir)) {
            mkdir(self::$cacheDir, 0755, true);
        }

        $handle=fopen($cacheFile,'c+');
        if($handle===false||!flock($handle,LOCK_EX))Response::error('Request limit service unavailable',503);
        try{
            rewind($handle);$data=json_decode((string)stream_get_contents($handle),true);
            $attempts=0;$resetTime=time()+($decayMinutes*60);
            if(is_array($data)&&($data['reset_time']??0)>time()){$attempts=(int)($data['attempts']??0);$resetTime=(int)$data['reset_time'];}
            if($attempts>=$maxAttempts){$retryAfter=max(1,$resetTime-time());header("Retry-After: {$retryAfter}");Response::error("Too many requests. Please try again in {$retryAfter} seconds.",429);}
            ftruncate($handle,0);rewind($handle);fwrite($handle,(string)json_encode(['attempts'=>$attempts+1,'reset_time'=>$resetTime]));fflush($handle);
        }finally{flock($handle,LOCK_UN);fclose($handle);}
    }

    public static function reset(string $key): void
    {
        $identifier = md5($key . self::getClientIp());
        $cacheFile = self::$cacheDir . $identifier;
        
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
    }

    private static function getClientIp(): string
    {
        $remote=(string)($_SERVER['REMOTE_ADDR']??'');
        if(filter_var($remote,FILTER_VALIDATE_IP)===false)return '127.0.0.1';
        $trusted=array_values(array_filter(array_map('trim',explode(',',(string)($_ENV['TRUSTED_PROXY_IPS']??'')))));
        if(in_array($remote,$trusted,true)){
            foreach(['HTTP_CF_CONNECTING_IP','HTTP_X_FORWARDED_FOR','HTTP_X_REAL_IP'] as $header){
                if(empty($_SERVER[$header]))continue;
                $candidate=trim(explode(',',(string)$_SERVER[$header])[0]);
                if(filter_var($candidate,FILTER_VALIDATE_IP)!==false)return $candidate;
            }
        }
        return $remote;
    }
}
