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
            self::ensureLocation($pdo,(int)$user['id'],$location??'Unassigned');
            $pdo->prepare('INSERT INTO inventory_items(user_id,qr_id,public_token,name,category,inventory_type,inventory_identifier,quantity,minimum_stock_level,notes,status,location,created_at,updated_at) VALUES(?,?,UUID(),?,?,?,?,?,?,?,?,?,NOW(),NOW())')->execute([$user['id'],$qrId,$name,$data['category']??'Other',$type,$data['inventory_identifier']??null,$quantity,$minimum,$data['notes']??null,$status,$location]);$itemId=(int)$pdo->lastInsertId();
            if($type==='quantity')$pdo->prepare('INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,?,?)')->execute([$itemId,$location??'Unassigned',$quantity]);
            $pdo->prepare("INSERT INTO inventory_movements(item_id,user_id,action_type,quantity_delta,previous_quantity,new_quantity,previous_status,new_status,to_location,reason,performed_by,performed_by_name,occurred_at,workflow_id,idempotency_key,metadata) VALUES(?,?,'opening_state',?,0,?,NULL,? ,?,'Initial inventory state',?,?,NOW(),UUID(),?,JSON_OBJECT('provenance','creation'))")->execute([$itemId,$user['id'],$quantity,$quantity,$status,$location,$user['id'],$user['name'],$key]);
            $stmt=$pdo->prepare('SELECT * FROM inventory_items WHERE id=?');$stmt->execute([$itemId]);$item=$stmt->fetch();$pdo->commit();
            return ['item'=>$item,'qr_id'=>$qrId,'scan_url'=>$appUrl.'/go/'.$qrId,'duplicate'=>false];
        }catch(\Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    }

    public static function createLocation(array $user,string $name,?string $code=null,?string $description=null): array
    {
        $name=trim($name);if($name===''||mb_strlen($name)>255)throw new \InvalidArgumentException('A valid location name is required');
        $pdo=Database::getInstance();$stmt=$pdo->prepare('INSERT INTO inventory_locations(user_id,name,code,description) VALUES(?,?,?,?)');$stmt->execute([$user['id'],$name,$code,$description]);
        return ['id'=>(int)$pdo->lastInsertId(),'name'=>$name];
    }

    public static function resolveByQr(int $qrId): ?array
    {
        $stmt=Database::getInstance()->prepare('SELECT i.*,q.dynamic_id,q.content AS qr_content FROM inventory_items i JOIN qr_codes q ON q.id=i.qr_id WHERE i.qr_id=? AND i.deleted_at IS NULL');$stmt->execute([$qrId]);return $stmt->fetch()?:null;
    }

    public static function saveStockCount(int $itemId,array $user,array $data): array
    {
        $key=trim((string)($data['idempotency_key']??''));$reason=trim((string)($data['reason']??''));$reasons=['count_error','unrecorded_movement','damaged_stock','lost_stock','incorrect_system_quantity','other'];
        if($key===''||$reason===''||filter_var($data['counted_quantity']??null,FILTER_VALIDATE_INT)===false||(int)$data['counted_quantity']<0)throw new \InvalidArgumentException('Counted quantity, reason and idempotency key are required');
        if(!in_array($reason,$reasons,true))throw new \InvalidArgumentException('Invalid stock count difference reason');$notes=isset($data['notes'])?trim((string)$data['notes']):null;if($notes!==null&&mb_strlen($notes)>5000)throw new \InvalidArgumentException('Notes must not exceed 5000 characters');
        $countDate=null;if(isset($data['count_date'])&&trim((string)$data['count_date'])!==''){$raw=trim((string)$data['count_date']);if(!preg_match('/^(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})?)?$/',$raw,$parts)||!checkdate((int)$parts[2],(int)$parts[3],(int)$parts[1]))throw new \InvalidArgumentException('A valid count date is required');$countDate=(new \DateTimeImmutable($raw))->format('Y-m-d H:i:s');}
        $pdo=Database::getInstance();$pdo->beginTransaction();try{$stmt=$pdo->prepare("SELECT * FROM inventory_items WHERE id=? AND deleted_at IS NULL AND inventory_type='quantity' FOR UPDATE");$stmt->execute([$itemId]);$row=$stmt->fetch();if(!$row)throw new \RuntimeException('Quantity inventory item not found',404);
            if((int)$row['user_id']!==(int)$user['id']){$access=$pdo->prepare("SELECT role FROM inventory_access WHERE owner_user_id=? AND user_id=? AND is_active=1 AND role IN ('controller','admin')");$access->execute([$row['user_id'],$user['id']]);if(!$access->fetchColumn())throw new \RuntimeException('You do not have permission to count this stock',403);}
            $location=trim((string)($data['location']??$row['location']??''));if($location==='')throw new \InvalidArgumentException('Count location is required');$known=$pdo->prepare('SELECT 1 FROM inventory_locations WHERE user_id=? AND name=? AND is_active=1');$known->execute([$row['user_id'],$location]);if(!$known->fetchColumn())throw new \InvalidArgumentException('Unknown inventory location');
            $level=$pdo->prepare('SELECT quantity FROM inventory_stock_levels WHERE item_id=? AND location_name=? FOR UPDATE');$level->execute([$itemId,$location]);$expected=$level->fetchColumn();if($expected===false)throw new \InvalidArgumentException('This item has no stock at the selected location');$counted=(int)$data['counted_quantity'];
            $insert=$pdo->prepare('INSERT INTO inventory_stock_counts(item_id,user_id,expected_quantity,expected_location_quantity,item_version,counted_quantity,difference,location,counted_by,counted_by_name,count_date,reason,notes,idempotency_key) VALUES(?,?,?,?,?,?,?,?,?,?,COALESCE(?,NOW()),?,?,?)');$insert->execute([$itemId,$row['user_id'],$row['quantity'],$expected,$row['version'],$counted,$counted-(int)$expected,$location,$user['id'],$user['name'],$countDate,$reason,$notes,$key]);$id=(int)$pdo->lastInsertId();$pdo->commit();return ['id'=>$id,'expected_quantity'=>(int)$expected,'counted_quantity'=>$counted,'difference'=>$counted-(int)$expected,'location'=>$location,'status'=>'saved'];
        }catch(\Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    }

    public static function history(int $itemId): array
    {
        $stmt=Database::getInstance()->prepare('SELECT * FROM inventory_movements WHERE item_id=? ORDER BY occurred_at,id');$stmt->execute([$itemId]);return $stmt->fetchAll();
    }

    public static function movementPage(int $itemId,array $user,array $filters=[]): array
    {
        $pdo=Database::getInstance();$owner=$pdo->prepare('SELECT user_id FROM inventory_items WHERE id=? AND deleted_at IS NULL');$owner->execute([$itemId]);$ownerId=$owner->fetchColumn();if(!$ownerId)throw new \RuntimeException('Inventory item not found',404);
        if((int)$ownerId!==(int)$user['id']){$access=$pdo->prepare('SELECT role FROM inventory_access WHERE owner_user_id=? AND user_id=? AND is_active=1');$access->execute([$ownerId,$user['id']]);if(!$access->fetchColumn())throw new \RuntimeException('You do not have permission to view this history',403);}
        $where=['item_id=?'];$params=[$itemId];foreach(['action_type'=>'action_type=?','reason'=>'reason LIKE ?','user'=>'performed_by_name LIKE ?','status'=>'(previous_status=? OR new_status=?)','from'=>'occurred_at>=?','to'=>'occurred_at<=?']as$key=>$clause){if(!empty($filters[$key])){$where[]=$clause;$value=in_array($key,['reason','user'],true)?'%'.$filters[$key].'%':$filters[$key];$params[]=$value;if($key==='status')$params[]=$value;}}
        if(!empty($filters['location'])){$where[]='(from_location=? OR to_location=?)';$params[]=$filters['location'];$params[]=$filters['location'];}$page=max(1,(int)($filters['page']??1));$perPage=min(100,max(1,(int)($filters['per_page']??50)));$offset=($page-1)*$perPage;$count=$pdo->prepare('SELECT COUNT(*) FROM inventory_movements WHERE '.implode(' AND ',$where));$count->execute($params);$total=(int)$count->fetchColumn();$stmt=$pdo->prepare('SELECT m.*,i.name AS product_name FROM inventory_movements m JOIN inventory_items i ON i.id=m.item_id WHERE m.id IN (SELECT id FROM inventory_movements WHERE '.implode(' AND ',$where).') ORDER BY m.occurred_at DESC,m.id DESC LIMIT '.$perPage.' OFFSET '.$offset);$stmt->execute($params);return ['items'=>$stmt->fetchAll(),'pagination'=>['page'=>$page,'per_page'=>$perPage,'total'=>$total,'total_pages'=>(int)ceil($total/$perPage)]];
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
