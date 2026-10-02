<?php

namespace App\Services;

use App\Config\Database;
use PDO;

/** Application-level inventory operations shared by HTTP controllers and acceptance tests. */
final class InventoryApplicationService
{
    public static function createWithQr(array $user, array $data): array
    {
        $name=trim((string)($data['name']??''));$key='create:'.trim((string)($data['idempotency_key']??''));
        if($name===''||mb_strlen($name)>255||$key==='create:'||strlen($key)>100)throw new \InvalidArgumentException('Name and idempotency key are required');
        $type=($data['inventory_type']??'serialized')==='quantity'?'quantity':'serialized';
        if($type==='quantity'&&(filter_var($data['quantity']??null,FILTER_VALIDATE_INT)===false||(int)$data['quantity']<0))throw new \InvalidArgumentException('Quantity must be zero or greater');
        if(filter_var($data['minimum_stock_level']??0,FILTER_VALIDATE_INT)===false||(int)($data['minimum_stock_level']??0)<0)throw new \InvalidArgumentException('Minimum stock must be zero or greater');
        $quantity=$type==='quantity'?(int)$data['quantity']:1;$minimum=(int)($data['minimum_stock_level']??0);
        $status=$type==='quantity'?($quantity===0?'out_of_stock':($minimum>0&&$quantity<=$minimum?'low_stock':'in_stock')):'available';$location=trim((string)($data['location']??''))?:null;
        $pdo=Database::getInstance();$pdo->beginTransaction();
        try{
            $existing=$pdo->prepare("SELECT i.*,i.qr_id FROM inventory_movements m JOIN inventory_items i ON i.id=m.item_id WHERE m.user_id=? AND m.idempotency_key=? LIMIT 1");$existing->execute([$user['id'],$key]);
            if($item=$existing->fetch()){$pdo->commit();return ['item'=>$item,'qr_id'=>(int)$item['qr_id'],'duplicate'=>true];}
            $dynamicId=bin2hex(random_bytes(8));$pdo->prepare("INSERT INTO qr_codes(user_id,type,name,content,custom_options,dynamic_id,created_at) VALUES(?,'url',?,JSON_OBJECT(),JSON_OBJECT(),?,NOW())")->execute([$user['id'],$name.' QR',$dynamicId]);$qrId=(int)$pdo->lastInsertId();
            $appUrl=rtrim((string)($_ENV['APP_URL']??'https://qr.ieosuia.com'),'/');$pdo->prepare('UPDATE qr_codes SET content=? WHERE id=?')->execute([json_encode(['url'=>$appUrl.'/scan/'.$qrId]),$qrId]);
            if($location)self::ensureLocation($pdo,(int)$user['id'],$location);
            $pdo->prepare('INSERT INTO inventory_items(user_id,qr_id,public_token,name,category,inventory_type,inventory_identifier,quantity,minimum_stock_level,notes,status,location,created_at,updated_at) VALUES(?,?,UUID(),?,?,?,?,?,?,?,?,?,NOW(),NOW())')->execute([$user['id'],$qrId,$name,$data['category']??'Other',$type,$data['inventory_identifier']??null,$quantity,$minimum,$data['notes']??null,$status,$location]);$itemId=(int)$pdo->lastInsertId();
            if($type==='quantity')$pdo->prepare('INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,?,?)')->execute([$itemId,$location??'Unassigned',$quantity]);
            $pdo->prepare("INSERT INTO inventory_movements(item_id,user_id,action_type,quantity_delta,previous_quantity,new_quantity,previous_status,new_status,to_location,reason,performed_by,performed_by_name,occurred_at,workflow_id,idempotency_key,metadata) VALUES(?,?,'opening_state',?,0,?,NULL,? ,?,'Initial inventory state',?,?,NOW(),UUID(),?,JSON_OBJECT('provenance','creation'))")->execute([$itemId,$user['id'],$quantity,$quantity,$status,$location,$user['id'],$user['name'],$key]);
            $stmt=$pdo->prepare('SELECT * FROM inventory_items WHERE id=?');$stmt->execute([$itemId]);$item=$stmt->fetch();$pdo->commit();
            return ['item'=>$item,'qr_id'=>$qrId,'scan_url'=>$appUrl.'/go/'.$qrId,'duplicate'=>false];
        }catch(\Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    }

    public static function createLocation(array $user,string $name,?string $code=null,?string $description=null): array
    {
        $name=trim($name);if($name===''||mb_strlen($name)>150)throw new \InvalidArgumentException('A valid location name is required');
        $pdo=Database::getInstance();$stmt=$pdo->prepare('INSERT INTO inventory_locations(user_id,name,code,description) VALUES(?,?,?,?)');$stmt->execute([$user['id'],$name,$code,$description]);
        return ['id'=>(int)$pdo->lastInsertId(),'name'=>$name];
    }

    public static function resolveByQr(int $qrId): ?array
    {
        $stmt=Database::getInstance()->prepare('SELECT i.*,q.dynamic_id,q.content AS qr_content FROM inventory_items i JOIN qr_codes q ON q.id=i.qr_id WHERE i.qr_id=? AND i.deleted_at IS NULL');$stmt->execute([$qrId]);return $stmt->fetch()?:null;
    }

    public static function saveStockCount(int $itemId,array $user,array $data): array
    {
        $pdo=Database::getInstance();$item=$pdo->prepare("SELECT * FROM inventory_items WHERE id=? AND deleted_at IS NULL AND inventory_type='quantity'");$item->execute([$itemId]);$row=$item->fetch();if(!$row)throw new \RuntimeException('Quantity inventory item not found',404);
        if((int)$row['user_id']!==(int)$user['id'])throw new \RuntimeException('You do not have permission to count this stock',403);
        $location=trim((string)($data['location']??$row['location']??''));$key=trim((string)($data['idempotency_key']??''));$reason=trim((string)($data['reason']??''));$count=(int)($data['counted_quantity']??-1);
        if($location===''||$key===''||$reason===''||$count<0)throw new \InvalidArgumentException('Counted quantity, location, reason and idempotency key are required');
        $expected=(int)$row['quantity'];$locationQty=(int)(self::stockLevels($itemId)[$location]??0);
        $stmt=$pdo->prepare("INSERT INTO inventory_stock_counts(item_id,user_id,expected_quantity,expected_location_quantity,item_version,counted_quantity,difference,location,counted_by,counted_by_name,count_date,reason,notes,status,idempotency_key) VALUES(?,?,?,?,?,?,?,?,?,?,NOW(),?,?,'saved',?)");
        $stmt->execute([$itemId,$row['user_id'],$expected,$locationQty,$row['version'],$count,$count-$locationQty,$location,$user['id'],$user['name'],$reason,$data['notes']??null,$key]);
        return ['id'=>(int)$pdo->lastInsertId(),'item_id'=>$itemId,'location'=>$location,'expected_location_quantity'=>$locationQty,'counted_quantity'=>$count];
    }

    public static function history(int $itemId): array
    {
        $stmt=Database::getInstance()->prepare('SELECT * FROM inventory_movements WHERE item_id=? ORDER BY occurred_at,id');$stmt->execute([$itemId]);return $stmt->fetchAll();
    }

    public static function stockLevels(int $itemId): array
    {
        $stmt=Database::getInstance()->prepare('SELECT location_name,quantity FROM inventory_stock_levels WHERE item_id=? ORDER BY location_name');$stmt->execute([$itemId]);$out=[];foreach($stmt->fetchAll() as $row)$out[$row['location_name']]=(int)$row['quantity'];return $out;
    }

    private static function ensureLocation(PDO $pdo,int $ownerId,string $name): void
    {
        $pdo->prepare('INSERT IGNORE INTO inventory_locations(user_id,name) VALUES(?,?)')->execute([$ownerId,$name]);
    }
}
