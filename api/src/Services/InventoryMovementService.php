<?php

namespace App\Services;

use App\Config\Database;

final class InventoryMovementService
{
    private const OPERATE = ['add_stock','remove_stock','checkout','return','transfer','damaged','lost','missing','maintenance_send','maintenance_release'];
    private const CONTROL = ['adjust','reconciliation'];

    public static function perform(int $itemId, array $actor, string $action, array $data): array
    {
        if (!in_array($action, array_merge(self::OPERATE, self::CONTROL), true)) {
            throw new \InvalidArgumentException('Unsupported inventory action');
        }
        $idempotencyKey = trim((string)($data['idempotency_key'] ?? ''));
        if ($idempotencyKey === '' || strlen($idempotencyKey) > 100) {
            throw new \InvalidArgumentException('A valid idempotency key is required');
        }
        $reason = trim((string)($data['reason'] ?? ''));
        if ($reason === '' || strlen($reason) > 150) throw new \InvalidArgumentException('Reason is required');
        $notes = isset($data['notes']) ? trim((string)$data['notes']) : null;
        if ($notes !== null && mb_strlen($notes) > 5000) throw new \InvalidArgumentException('Notes must not exceed 5000 characters');

        $pdo = Database::getInstance();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('SELECT * FROM inventory_items WHERE id=? AND deleted_at IS NULL FOR UPDATE');
            $stmt->execute([$itemId]);
            $item = $stmt->fetch();
            if (!$item) throw new \RuntimeException('Inventory item not found', 404);
            self::authorize($pdo, $item, $actor, $action);
            $duplicate = $pdo->prepare('SELECT m.*, i.name FROM inventory_movements m JOIN inventory_items i ON i.id=m.item_id WHERE m.user_id=? AND m.idempotency_key=? LIMIT 1');
            $duplicate->execute([(int)$item['user_id'], $idempotencyKey]);
            if ($existing = $duplicate->fetch()) { $pdo->commit(); return ['movement'=>$existing,'item'=>self::fetchItem($pdo,$existing['item_id']),'duplicate'=>true]; }
            $stockCount = null;
            if (!empty($data['apply_count_id'])) {
                $countStmt = $pdo->prepare('SELECT * FROM inventory_stock_counts WHERE id=? AND item_id=? AND user_id=? FOR UPDATE');
                $countStmt->execute([(int)$data['apply_count_id'],$itemId,$item['user_id']]);
                $stockCount = $countStmt->fetch();
                if (!$stockCount) throw new \RuntimeException('Stock count not found',404);
                if ($stockCount['status'] !== 'saved') throw new \DomainException('This stock count has already been finalized');
                $data['new_quantity'] = (int)$stockCount['counted_quantity'];
            }

            $beforeQty = (int)$item['quantity'];
            $afterQty = $beforeQty;
            $beforeStatus = (string)$item['status'];
            $afterStatus = $beforeStatus;
            $fromLocation = $item['location'];
            $toLocation = array_key_exists('to_location',$data) ? self::nullableText($data['to_location'],255) : $fromLocation;
            $movementToLocation = $toLocation;
            $assignedTo = $item['assigned_to'];
            $delta = 0;
            $type = (string)$item['inventory_type'];

            if ($type === 'quantity') {
                [$afterQty,$delta,$afterStatus,$itemLocation] = self::quantityTransition($item,$action,$data,$toLocation);
                if ($action !== 'transfer') {
                    $movementToLocation = self::nullableText($data['location'] ?? $fromLocation,255);
                }
                self::updateStockLevels($pdo,$item,$action,$data,$delta,$movementToLocation);
                $toLocation = $itemLocation;
            } else {
                [$afterStatus,$toLocation,$assignedTo] = self::serializedTransition($item,$action,$data,$toLocation);
            }

            $update = $pdo->prepare('UPDATE inventory_items SET quantity=?,status=?,location=?,assigned_to=?,version=version+1,updated_at=NOW() WHERE id=? AND version=?');
            $update->execute([$afterQty,$afterStatus,$toLocation,$assignedTo,$itemId,(int)$item['version']]);
            if ($update->rowCount() !== 1) throw new \RuntimeException('Inventory changed concurrently; please retry',409);

            $workflowId = self::uuid();
            $movement = $pdo->prepare('INSERT INTO inventory_movements (item_id,user_id,action_type,quantity_delta,previous_quantity,new_quantity,previous_status,new_status,from_location,to_location,reason,performed_by,performed_by_name,related_party,occurred_at,notes,workflow_id,idempotency_key,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?)');
            $movement->execute([$itemId,$item['user_id'],$action,$delta,$beforeQty,$afterQty,$beforeStatus,$afterStatus,$fromLocation,$movementToLocation,$reason,$actor['id'],$actor['name'],self::nullableText($data['related_party'] ?? null,255),$notes,$workflowId,$idempotencyKey,json_encode($data['metadata'] ?? new \stdClass())]);
            $movementId = (int)$pdo->lastInsertId();
            if ($stockCount) {
                $apply=$pdo->prepare("UPDATE inventory_stock_counts SET status='applied',applied_movement_id=?,applied_at=NOW() WHERE id=? AND status='saved'");
                $apply->execute([$movementId,$stockCount['id']]);
                if($apply->rowCount()!==1) throw new \RuntimeException('Stock count changed concurrently; please retry',409);
            }
            $pdo->commit();
            return ['movement_id'=>$movementId,'workflow_id'=>$workflowId,'item'=>self::fetchItem($pdo,$itemId),'duplicate'=>false];
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }

    private static function quantityTransition(array $item,string $action,array $data,?string $toLocation): array
    {
        $before=(int)$item['quantity']; $after=$before;
        if (in_array($action,['checkout','return','maintenance_send','maintenance_release'],true)) throw new \InvalidArgumentException('This action is only available for individually tracked items');
        if ($action === 'add_stock') { $qty=self::positive($data['quantity']??0); $after=$before+$qty; }
        elseif (in_array($action,['remove_stock','damaged','lost','missing'],true)) { $qty=self::positive($data['quantity']??0); if($qty>$before) throw new \DomainException('Quantity cannot fall below zero'); $after=$before-$qty; }
        elseif (in_array($action,['adjust','reconciliation'],true)) { if(!isset($data['new_quantity'])||filter_var($data['new_quantity'],FILTER_VALIDATE_INT)===false||(int)$data['new_quantity']<0) throw new \InvalidArgumentException('New quantity must be zero or greater'); $after=(int)$data['new_quantity']; }
        elseif ($action === 'transfer') { self::positive($data['quantity']??0); if(!$toLocation||$toLocation===$item['location']) throw new \InvalidArgumentException('A different destination location is required'); }
        $delta=$after-$before;
        $minimum=(int)$item['minimum_stock_level'];
        $status=$after===0?'out_of_stock':($after<=$minimum&&$minimum>0?'low_stock':'in_stock');
        return [$after,$delta,$status,$action === 'transfer' ? $item['location'] : $toLocation];
    }

    private static function serializedTransition(array $item,string $action,array $data,?string $toLocation): array
    {
        if (in_array($action,['add_stock','remove_stock','adjust','reconciliation'],true)) throw new \InvalidArgumentException('This action is only available for quantity-based inventory');
        $current=(string)$item['status']; $status=$current; $assigned=$item['assigned_to'];
        if ($action==='checkout') { if(!in_array($current,['available','in_stock'],true)) throw new \DomainException('Only an available item can be checked out'); $assigned=self::requiredText($data['related_party']??null,'Person or department is required',255); $status='checked_out'; }
        elseif ($action==='return') { if($current!=='checked_out') throw new \DomainException('Only a checked-out item can be returned'); $condition=(string)($data['condition']??'good'); $assigned=null; $status=match($condition){'good'=>'available','damaged'=>'damaged','needs_inspection','missing_parts'=>'maintenance',default=>throw new \InvalidArgumentException('Invalid return condition')}; }
        elseif ($action==='transfer') { if(!in_array($current,['available','in_stock','checked_out'],true))throw new \DomainException('This item cannot be transferred from its current state');if(!$toLocation||$toLocation===$item['location']) throw new \InvalidArgumentException('A different destination location is required'); }
        elseif ($action==='damaged') { if(!in_array($current,['available','in_stock'],true))throw new \DomainException('Use the return workflow for a checked-out or unavailable item');$status='damaged';$assigned=null; }
        elseif (in_array($action,['lost','missing'],true)) { if(!in_array($current,['available','in_stock','checked_out'],true))throw new \DomainException('This item cannot be reported lost from its current state');$status=$action;$assigned=null; }
        elseif ($action==='maintenance_send') { if(!in_array($current,['available','in_stock','damaged'],true)) throw new \DomainException('Only an available or damaged item can enter maintenance'); $status='maintenance';$assigned=null; }
        elseif ($action==='maintenance_release') { if($current!=='maintenance') throw new \DomainException('Only an item in maintenance can be released'); $condition=(string)($data['condition']??'good'); $status=match($condition){'good'=>'available','still_damaged'=>'damaged','needs_further_maintenance'=>'maintenance',default=>throw new \InvalidArgumentException('Invalid maintenance condition')}; }
        return [$status,$toLocation,$assigned];
    }

    private static function updateStockLevels(\PDO $pdo,array $item,string $action,array $data,int $delta,?string $toLocation): void
    {
        $source=self::nullableText($data['from_location']??$item['location']??'Unassigned',255)??'Unassigned';
        self::assertLocation($pdo,(int)$item['user_id'],$source);
        self::ensureLevel($pdo,(int)$item['id'],$source);
        if($action==='transfer'){
            $quantity=self::positive($data['quantity']??0);
            $destination=$toLocation??throw new \InvalidArgumentException('Destination location is required');
            self::assertLocation($pdo,(int)$item['user_id'],$destination);
            self::changeLevel($pdo,(int)$item['id'],$source,-$quantity);
            self::ensureLevel($pdo,(int)$item['id'],$destination);
            self::changeLevel($pdo,(int)$item['id'],$destination,$quantity);
            return;
        }
        $location=self::nullableText($data['location']??$source,255)??$source;
        self::assertLocation($pdo,(int)$item['user_id'],$location);
        self::ensureLevel($pdo,(int)$item['id'],$location);
        self::changeLevel($pdo,(int)$item['id'],$location,$delta);
    }

    private static function ensureLevel(\PDO $pdo,int $itemId,string $location): void
    {
        $stmt=$pdo->prepare('INSERT IGNORE INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,?,0)');
        $stmt->execute([$itemId,$location]);
    }

    private static function changeLevel(\PDO $pdo,int $itemId,string $location,int $delta): void
    {
        $stmt=$pdo->prepare('SELECT quantity FROM inventory_stock_levels WHERE item_id=? AND location_name=? FOR UPDATE');
        $stmt->execute([$itemId,$location]);$current=(int)$stmt->fetchColumn();$next=$current+$delta;
        if($next<0)throw new \DomainException("Not enough stock at {$location}");
        $update=$pdo->prepare('UPDATE inventory_stock_levels SET quantity=? WHERE item_id=? AND location_name=?');$update->execute([$next,$itemId,$location]);
    }

    private static function assertLocation(\PDO $pdo,int $ownerId,string $location): void
    {
        if($location==='Unassigned')return;
        $stmt=$pdo->prepare('SELECT 1 FROM inventory_locations WHERE user_id=? AND name=? AND is_active=1');$stmt->execute([$ownerId,$location]);
        if(!$stmt->fetchColumn())throw new \InvalidArgumentException("Unknown inventory location: {$location}");
    }

    private static function authorize(\PDO $pdo,array $item,array $actor,string $action): void
    {
        if ((int)$item['user_id']===(int)$actor['id']) return;
        $stmt=$pdo->prepare('SELECT role FROM inventory_access WHERE owner_user_id=? AND user_id=? AND is_active=1 LIMIT 1');
        $stmt->execute([$item['user_id'],$actor['id']]); $role=$stmt->fetchColumn();
        $allowed=in_array($action,self::CONTROL,true)?['controller','admin']:['operator','controller','admin'];
        if(!$role||!in_array($role,$allowed,true)) throw new \RuntimeException('You do not have permission for this inventory action',403);
    }

    private static function fetchItem(\PDO $pdo,int $id): array { $s=$pdo->prepare('SELECT * FROM inventory_items WHERE id=?');$s->execute([$id]);return $s->fetch()?:[]; }
    private static function positive(mixed $value): int { if(filter_var($value,FILTER_VALIDATE_INT)===false||(int)$value<=0) throw new \InvalidArgumentException('Quantity must be greater than zero');return (int)$value; }
    private static function nullableText(mixed $value,int $max): ?string { if($value===null)return null;$v=trim((string)$value);if($v==='')return null;if(mb_strlen($v)>$max)throw new \InvalidArgumentException('Value is too long');return $v; }
    private static function requiredText(mixed $value,string $message,int $max): string { $v=self::nullableText($value,$max);if($v===null)throw new \InvalidArgumentException($message);return $v; }
    private static function uuid(): string { $b=random_bytes(16);$b[6]=chr((ord($b[6])&0x0f)|0x40);$b[8]=chr((ord($b[8])&0x3f)|0x80);return vsprintf('%s%s-%s-%s-%s-%s%s%s',str_split(bin2hex($b),4)); }
}
