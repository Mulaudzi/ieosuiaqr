<?php
namespace App\Services;
use App\Config\Database;
final class QrApplicationService
{
    public static function create(array $user,array $data): array
    {
        $type=strtolower((string)($data['type']??''));$types=['url','text','email','phone','sms','wifi','vcard','event','location','whatsapp','social','app'];if(!in_array($type,$types,true)||!array_key_exists('content',$data))throw new \InvalidArgumentException('Valid QR code type and content are required');
        $dynamicId=bin2hex(random_bytes(8));$pdo=Database::getInstance();$stmt=$pdo->prepare('INSERT INTO qr_codes(user_id,type,name,content,custom_options,dynamic_id,created_at) VALUES(?,?,?,?,?,?,NOW())');$stmt->execute([$user['id'],$type,$data['name']??null,json_encode($data['content']),json_encode($data['custom_options']??[]),$dynamicId]);return ['id'=>(int)$pdo->lastInsertId(),'type'=>$type,'name'=>$data['name']??null,'content'=>$data['content'],'custom_options'=>$data['custom_options']??[],'dynamic_id'=>$dynamicId,'created_at'=>date('c')];
    }
}
