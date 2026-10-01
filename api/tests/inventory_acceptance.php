<?php

require dirname(__DIR__) . '/vendor/autoload.php';
foreach (file(dirname(__DIR__).'/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
    $line=trim($line); if($line===''||str_starts_with($line,'#')||!str_contains($line,'='))continue;
    [$key,$value]=array_map('trim',explode('=',$line,2));
    $_ENV[$key]=trim($value,"\"'");
}

use App\Config\Database;
use App\Services\InventoryMovementService;
use App\Middleware\Auth;

function check(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function row(PDO $pdo, string $sql, array $params=[]): array { $s=$pdo->prepare($sql);$s->execute($params);return $s->fetch()?:[]; }

if (($argv[1] ?? '') === 'worker-remove') {
    try {
        InventoryMovementService::perform((int)$argv[2],['id'=>(int)$argv[3],'name'=>'Race owner'],'remove_stock',['quantity'=>6,'reason'=>'Concurrent issue','idempotency_key'=>$argv[4]]);
        exit(0);
    } catch (Throwable) { exit(1); }
}
if (($argv[1] ?? '') === 'token') { echo Auth::generateToken((int)$argv[2],'Free'); exit(0); }

$pdo=Database::getInstance();
$suffix=bin2hex(random_bytes(5));
$ids=['users'=>[],'items'=>[]];
try {
    foreach (['owner','operator','viewer'] as $name) {
        $stmt=$pdo->prepare("INSERT INTO users(email,password,name,plan,email_verified_at,created_at) VALUES(?,?,?,'Free',NOW(),NOW())");
        $stmt->execute(["inventory-{$name}-{$suffix}@example.test",password_hash(bin2hex(random_bytes(16)),PASSWORD_DEFAULT),ucfirst($name)]);
        $ids['users'][$name]=(int)$pdo->lastInsertId();
    }
    $owner=['id'=>$ids['users']['owner'],'name'=>'Owner'];
    $operator=['id'=>$ids['users']['operator'],'name'=>'Operator'];
    $viewer=['id'=>$ids['users']['viewer'],'name'=>'Viewer'];
    $pdo->prepare("INSERT INTO inventory_access(owner_user_id,user_id,role) VALUES(?,?,'operator'),(?,?,'viewer')")
        ->execute([$owner['id'],$operator['id'],$owner['id'],$viewer['id']]);
    $pdo->prepare("INSERT INTO inventory_locations(user_id,name) VALUES(?,'Warehouse'),(?,'Office')")->execute([$owner['id'],$owner['id']]);

    $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,minimum_stock_level,status,location,version) VALUES(?,UUID(),'Cable','Supplies','quantity',10,5,'in_stock','Warehouse',0)")->execute([$owner['id']]);
    $quantityId=(int)$pdo->lastInsertId();$ids['items'][]=$quantityId;
    $pdo->prepare("INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,'Warehouse',10)")->execute([$quantityId]);

    InventoryMovementService::perform($quantityId,$owner,'add_stock',['quantity'=>5,'reason'=>'Restock','idempotency_key'=>'add-'.$suffix]);
    $duplicate=InventoryMovementService::perform($quantityId,$owner,'add_stock',['quantity'=>5,'reason'=>'Restock','idempotency_key'=>'add-'.$suffix]);
    check($duplicate['duplicate']===true,'Idempotent retry was not detected');
    InventoryMovementService::perform($quantityId,$operator,'remove_stock',['quantity'=>4,'reason'=>'Issued','idempotency_key'=>'remove-'.$suffix]);
    InventoryMovementService::perform($quantityId,$owner,'transfer',['quantity'=>3,'from_location'=>'Warehouse','to_location'=>'Office','reason'=>'Department transfer','idempotency_key'=>'transfer-'.$suffix]);
    $item=row($pdo,'SELECT * FROM inventory_items WHERE id=?',[$quantityId]);
    check((int)$item['quantity']===11,'Quantity arithmetic is incorrect');
    $levels=$pdo->prepare('SELECT location_name,quantity FROM inventory_stock_levels WHERE item_id=?');$levels->execute([$quantityId]);$levels=array_column($levels->fetchAll(),'quantity','location_name');
    check((int)($levels['Warehouse']??-1)===8 && (int)($levels['Office']??-1)===3,'Atomic transfer balances are incorrect');
    try { InventoryMovementService::perform($quantityId,$viewer,'add_stock',['quantity'=>1,'reason'=>'Forbidden','idempotency_key'=>'viewer-'.$suffix]); throw new RuntimeException('Viewer mutation was accepted'); } catch (RuntimeException $e) { check($e->getCode()===403,'Unexpected viewer error'); }
    try { InventoryMovementService::perform($quantityId,$owner,'remove_stock',['quantity'=>99,'reason'=>'Over removal','idempotency_key'=>'over-'.$suffix]); throw new RuntimeException('Negative stock was accepted'); } catch (DomainException) {}
    try { InventoryMovementService::perform($quantityId,$operator,'adjust',['new_quantity'=>7,'reason'=>'Correction','idempotency_key'=>'operator-adjust-'.$suffix]); throw new RuntimeException('Operator adjustment was accepted'); } catch (RuntimeException $e) { check($e->getCode()===403,'Unexpected adjustment permission error'); }

    $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,status,location,version) VALUES(?,UUID(),'Laptop 001','Electronics','serialized',1,'available','Office',0)")->execute([$owner['id']]);
    $serializedId=(int)$pdo->lastInsertId();$ids['items'][]=$serializedId;
    InventoryMovementService::perform($serializedId,$owner,'checkout',['related_party'=>'Design team','reason'=>'Project work','idempotency_key'=>'checkout-'.$suffix]);
    try { InventoryMovementService::perform($serializedId,$owner,'checkout',['related_party'=>'Other','reason'=>'Duplicate','idempotency_key'=>'checkout2-'.$suffix]); throw new RuntimeException('Duplicate checkout was accepted'); } catch (DomainException) {}
    InventoryMovementService::perform($serializedId,$owner,'return',['condition'=>'damaged','reason'=>'Screen cracked','idempotency_key'=>'return-'.$suffix]);
    InventoryMovementService::perform($serializedId,$owner,'maintenance_send',['reason'=>'Screen repair','idempotency_key'=>'maint-'.$suffix]);
    InventoryMovementService::perform($serializedId,$owner,'maintenance_release',['condition'=>'good','reason'=>'Repair completed','idempotency_key'=>'release-'.$suffix]);
    $asset=row($pdo,'SELECT * FROM inventory_items WHERE id=?',[$serializedId]);
    check($asset['status']==='available' && $asset['assigned_to']===null,'Serialized lifecycle final state is incorrect');

    $countKey='count-'.$suffix;
    $pdo->prepare("INSERT INTO inventory_stock_counts(item_id,user_id,expected_quantity,counted_quantity,difference,location,counted_by,counted_by_name,count_date,reason,idempotency_key) VALUES(?,?,?,?,?,'Warehouse',?,?,NOW(),'Physical count',?)")
        ->execute([$quantityId,$owner['id'],11,9,-2,$owner['id'],$owner['name'],$countKey]);
    $countId=(int)$pdo->lastInsertId();
    InventoryMovementService::perform($quantityId,$owner,'reconciliation',['apply_count_id'=>$countId,'reason'=>'Physical count','idempotency_key'=>'stock-count-'.$countId]);
    $count=row($pdo,'SELECT * FROM inventory_stock_counts WHERE id=?',[$countId]);
    check($count['status']==='applied' && !empty($count['applied_movement_id']),'Reconciliation was not linked atomically');
    check((int)row($pdo,'SELECT quantity FROM inventory_items WHERE id=?',[$quantityId])['quantity']===9,'Reconciliation quantity is incorrect');
    check((int)row($pdo,'SELECT COUNT(*) c FROM inventory_movements WHERE item_id=?',[$quantityId])['c']===4,'Unexpected quantity movement count');

    $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,minimum_stock_level,status,location,version) VALUES(?,UUID(),'Race stock','Supplies','quantity',10,0,'in_stock','Warehouse',0)")->execute([$owner['id']]);
    $raceId=(int)$pdo->lastInsertId();$ids['items'][]=$raceId;
    $pdo->prepare("INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,'Warehouse',10)")->execute([$raceId]);
    $workers=[];
    foreach([1,2] as $number){$pipes=[];$workers[]=[$process=proc_open([PHP_BINARY,__FILE__,'worker-remove',(string)$raceId,(string)$owner['id'],"race-{$number}-{$suffix}"],[['pipe','r'],['pipe','w'],['pipe','w']],$pipes),$pipes];}
    $codes=[];foreach($workers as [$process,$pipes]){foreach($pipes as $pipe)fclose($pipe);$codes[]=proc_close($process);}
    sort($codes);check($codes===[0,1],'Exactly one concurrent removal must succeed');
    check((int)row($pdo,'SELECT quantity FROM inventory_items WHERE id=?',[$raceId])['quantity']===4,'Concurrent removal produced an invalid quantity');
    check((int)row($pdo,'SELECT COUNT(*) c FROM inventory_movements WHERE item_id=?',[$raceId])['c']===1,'Concurrent removal produced duplicate movements');
    echo "inventory acceptance: PASS\n";
} finally {
    if ($ids['items']) {$marks=implode(',',array_fill(0,count($ids['items']),'?'));foreach(['inventory_stock_counts','inventory_stock_levels','inventory_movements'] as $child){$pdo->prepare("DELETE FROM {$child} WHERE item_id IN ($marks)")->execute($ids['items']);}$pdo->prepare("DELETE FROM inventory_items WHERE id IN ($marks)")->execute($ids['items']);}
    if ($ids['users']) {$values=array_values($ids['users']);$marks=implode(',',array_fill(0,count($values),'?'));$pdo->prepare("DELETE FROM users WHERE id IN ($marks)")->execute($values);}
}
