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
        InventoryMovementService::perform((int)$argv[2],['id'=>(int)$argv[3],'name'=>'Race owner'],'remove_stock',['quantity'=>6,'reason'=>'issued_for_internal_use','idempotency_key'=>$argv[4]]);
        exit(0);
    } catch (Throwable) { exit(1); }
}
if (($argv[1] ?? '') === 'worker-add') {
    try { InventoryMovementService::perform((int)$argv[2],['id'=>(int)$argv[3],'name'=>'Race owner'],'add_stock',['quantity'=>2,'reason'=>'restock','idempotency_key'=>$argv[4]]);exit(0); }
    catch (Throwable) { exit(1); }
}
if (($argv[1] ?? '') === 'worker-checkout') {
    try { InventoryMovementService::perform((int)$argv[2],['id'=>(int)$argv[3],'name'=>'Race owner'],'checkout',['related_party'=>'Race team','location'=>'Office','purpose'=>'Concurrency test','action_date'=>date('Y-m-d H:i:s'),'expected_return_date'=>date('Y-m-d',strtotime('+1 day')),'reason'=>'Concurrent checkout','idempotency_key'=>$argv[4]]);exit(0); }
    catch (Throwable) { exit(1); }
}
if (($argv[1] ?? '') === 'worker-action') {
    try {
        $payload=json_decode(base64_decode((string)$argv[5],true)?:'',true,512,JSON_THROW_ON_ERROR);
        InventoryMovementService::perform((int)$argv[2],['id'=>(int)$argv[3],'name'=>'Race owner'],(string)$argv[4],$payload);
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
    $createQuantity=function(string $name,int $quantity=10)use($pdo,$owner,&$ids):int{
        $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,status,location,version) VALUES(?,UUID(),?,'Supplies','quantity',?,'in_stock','Warehouse',0)")->execute([$owner['id'],$name,$quantity]);
        $id=(int)$pdo->lastInsertId();$ids['items'][]=$id;$pdo->prepare("INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,'Warehouse',?)")->execute([$id,$quantity]);return $id;
    };
    $createAsset=function(string $name,string $status='available')use($pdo,$owner,&$ids):int{
        $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,status,location,version) VALUES(?,UUID(),?,'Equipment','serialized',1,?,'Office',0)")->execute([$owner['id'],$name,$status]);
        $id=(int)$pdo->lastInsertId();$ids['items'][]=$id;return $id;
    };
    $race=function(int $itemId,array $operations)use($owner):array{
        $workers=[];foreach($operations as [$action,$payload]){$pipes=[];$encoded=base64_encode(json_encode($payload,JSON_THROW_ON_ERROR));$workers[]=[$process=proc_open([PHP_BINARY,__FILE__,'worker-action',(string)$itemId,(string)$owner['id'],$action,$encoded],[['pipe','r'],['pipe','w'],['pipe','w']],$pipes),$pipes];}
        $codes=[];foreach($workers as [$process,$pipes]){foreach($pipes as $pipe)fclose($pipe);$codes[]=proc_close($process);}sort($codes);return $codes;
    };
    $pdo->prepare("INSERT INTO inventory_access(owner_user_id,user_id,role) VALUES(?,?,'operator'),(?,?,'viewer')")
        ->execute([$owner['id'],$operator['id'],$owner['id'],$viewer['id']]);
    $pdo->prepare("INSERT INTO inventory_locations(user_id,name) VALUES(?,'Warehouse'),(?,'Office')")->execute([$owner['id'],$owner['id']]);

    $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,minimum_stock_level,status,location,version) VALUES(?,UUID(),'Cable','Supplies','quantity',10,5,'in_stock','Warehouse',0)")->execute([$owner['id']]);
    $quantityId=(int)$pdo->lastInsertId();$ids['items'][]=$quantityId;
    $pdo->prepare("INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,'Warehouse',10)")->execute([$quantityId]);

    InventoryMovementService::perform($quantityId,$owner,'add_stock',['quantity'=>5,'reason'=>'restock','idempotency_key'=>'add-'.$suffix]);
    $duplicate=InventoryMovementService::perform($quantityId,$owner,'add_stock',['quantity'=>5,'reason'=>'restock','idempotency_key'=>'add-'.$suffix]);
    check($duplicate['duplicate']===true,'Idempotent retry was not detected');
    $removeData=['quantity'=>4,'reason'=>'issued_for_internal_use','idempotency_key'=>'remove-'.$suffix];InventoryMovementService::perform($quantityId,$operator,'remove_stock',$removeData);check(InventoryMovementService::perform($quantityId,$operator,'remove_stock',$removeData)['duplicate']===true,'Remove retry was not idempotent');
    $transferData=['quantity'=>3,'from_location'=>'Warehouse','to_location'=>'Office','reason'=>'Department transfer','idempotency_key'=>'transfer-'.$suffix];InventoryMovementService::perform($quantityId,$owner,'transfer',$transferData);check(InventoryMovementService::perform($quantityId,$owner,'transfer',$transferData)['duplicate']===true,'Transfer retry was not idempotent');
    $item=row($pdo,'SELECT * FROM inventory_items WHERE id=?',[$quantityId]);
    check((int)$item['quantity']===11,'Quantity arithmetic is incorrect');
    $levels=$pdo->prepare('SELECT location_name,quantity FROM inventory_stock_levels WHERE item_id=?');$levels->execute([$quantityId]);$levels=array_column($levels->fetchAll(),'quantity','location_name');
    check((int)($levels['Warehouse']??-1)===8 && (int)($levels['Office']??-1)===3,'Atomic transfer balances are incorrect');
    try { InventoryMovementService::perform($quantityId,$viewer,'add_stock',['quantity'=>1,'reason'=>'other','idempotency_key'=>'viewer-'.$suffix]); throw new RuntimeException('Viewer mutation was accepted'); } catch (RuntimeException $e) { check($e->getCode()===403,'Unexpected viewer error'); }
    try { InventoryMovementService::perform($quantityId,$owner,'remove_stock',['quantity'=>99,'reason'=>'other','idempotency_key'=>'over-'.$suffix]); throw new RuntimeException('Negative stock was accepted'); } catch (DomainException) {}
    try { InventoryMovementService::perform($quantityId,$operator,'adjust',['new_quantity'=>7,'reason'=>'system_correction','idempotency_key'=>'operator-adjust-'.$suffix]); throw new RuntimeException('Operator adjustment was accepted'); } catch (RuntimeException $e) { check($e->getCode()===403,'Unexpected adjustment permission error'); }

    $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,status,location,version) VALUES(?,UUID(),'Laptop 001','Electronics','serialized',1,'available','Office',0)")->execute([$owner['id']]);
    $serializedId=(int)$pdo->lastInsertId();$ids['items'][]=$serializedId;
    try { InventoryMovementService::perform($serializedId,$owner,'checkout',['related_party'=>'Design team','reason'=>'Incomplete workflow','idempotency_key'=>'invalid-checkout-'.$suffix]);throw new RuntimeException('Incomplete checkout was accepted'); } catch (InvalidArgumentException) {}
    $now=date('Y-m-d H:i:s');
    $checkoutData=['related_party'=>'Design team','location'=>'Office','action_date'=>$now,'expected_return_date'=>date('Y-m-d',strtotime('+7 days')),'purpose'=>'Project work','reason'=>'Project work','idempotency_key'=>'checkout-'.$suffix];InventoryMovementService::perform($serializedId,$owner,'checkout',$checkoutData);check(InventoryMovementService::perform($serializedId,$owner,'checkout',$checkoutData)['duplicate']===true,'Checkout retry was not idempotent');
    try { InventoryMovementService::perform($serializedId,$owner,'checkout',['related_party'=>'Other','location'=>'Office','action_date'=>$now,'expected_return_date'=>date('Y-m-d',strtotime('+7 days')),'purpose'=>'Other work','reason'=>'Duplicate','idempotency_key'=>'checkout2-'.$suffix]); throw new RuntimeException('Duplicate checkout was accepted'); } catch (DomainException) {}
    $returnData=['returned_by'=>'Design team','location'=>'Office','action_date'=>$now,'condition'=>'damaged','reason'=>'Screen cracked','idempotency_key'=>'return-'.$suffix];InventoryMovementService::perform($serializedId,$owner,'return',$returnData);check(InventoryMovementService::perform($serializedId,$owner,'return',$returnData)['duplicate']===true,'Return retry was not idempotent');
    $maintData=['location'=>'Office','maintenance_reason'=>'repair','action_date'=>$now,'expected_completion_date'=>date('Y-m-d',strtotime('+3 days')),'technician'=>'Repair desk','reason'=>'Screen repair','idempotency_key'=>'maint-'.$suffix];InventoryMovementService::perform($serializedId,$owner,'maintenance_send',$maintData);check(InventoryMovementService::perform($serializedId,$owner,'maintenance_send',$maintData)['duplicate']===true,'Maintenance retry was not idempotent');
    $releaseData=['location'=>'Office','action_date'=>$now,'condition'=>'good','reason'=>'Repair completed','idempotency_key'=>'release-'.$suffix];InventoryMovementService::perform($serializedId,$owner,'maintenance_release',$releaseData);check(InventoryMovementService::perform($serializedId,$owner,'maintenance_release',$releaseData)['duplicate']===true,'Maintenance release retry was not idempotent');
    $asset=row($pdo,'SELECT * FROM inventory_items WHERE id=?',[$serializedId]);
    check($asset['status']==='available' && $asset['assigned_to']===null,'Serialized lifecycle final state is incorrect');

    foreach(['damaged','lost'] as $specialAction){
        $specialId=$createAsset('Idempotent '.ucfirst($specialAction));
        $specialData=$specialAction==='damaged'
            ?['quantity'=>1,'location'=>'Office','damage_reason'=>'broken','action_date'=>$now,'reason'=>'Broken casing','idempotency_key'=>$specialAction.'-'.$suffix]
            :['quantity'=>1,'location'=>'Office','reported_by'=>'Owner','loss_reason'=>'unknown','action_date'=>$now,'reason'=>'Unable to locate','idempotency_key'=>$specialAction.'-'.$suffix];
        InventoryMovementService::perform($specialId,$owner,$specialAction,$specialData);
        check(InventoryMovementService::perform($specialId,$owner,$specialAction,$specialData)['duplicate']===true,ucfirst($specialAction).' retry was not idempotent');
    }
    $adjustId=$createQuantity('Idempotent adjust',5);$adjustData=['new_quantity'=>6,'reason'=>'system_correction','idempotency_key'=>'adjust-'.$suffix];InventoryMovementService::perform($adjustId,$owner,'adjust',$adjustData);check(InventoryMovementService::perform($adjustId,$owner,'adjust',$adjustData)['duplicate']===true,'Adjust retry was not idempotent');

    $countKey='count-'.$suffix;
    $itemBeforeCount=row($pdo,'SELECT quantity,version FROM inventory_items WHERE id=?',[$quantityId]);
    $warehouseBefore=(int)row($pdo,"SELECT quantity FROM inventory_stock_levels WHERE item_id=? AND location_name='Warehouse'",[$quantityId])['quantity'];
    $pdo->prepare("INSERT INTO inventory_stock_counts(item_id,user_id,expected_quantity,expected_location_quantity,item_version,counted_quantity,difference,location,counted_by,counted_by_name,count_date,reason,idempotency_key) VALUES(?,?,?,?,?,?,?,'Warehouse',?,?,NOW(),'Physical count',?)")
        ->execute([$quantityId,$owner['id'],$itemBeforeCount['quantity'],$warehouseBefore,$itemBeforeCount['version'],9,9-$warehouseBefore,$owner['id'],$owner['name'],$countKey]);
    $countId=(int)$pdo->lastInsertId();
    $reconcileData=['apply_count_id'=>$countId,'reason'=>'count_error','idempotency_key'=>'stock-count-'.$countId];InventoryMovementService::perform($quantityId,$owner,'reconciliation',$reconcileData);check(InventoryMovementService::perform($quantityId,$owner,'reconciliation',$reconcileData)['duplicate']===true,'Reconciliation retry was not idempotent');
    $count=row($pdo,'SELECT * FROM inventory_stock_counts WHERE id=?',[$countId]);
    check($count['status']==='applied' && !empty($count['applied_movement_id']),'Reconciliation was not linked atomically');
    check((int)row($pdo,'SELECT quantity FROM inventory_items WHERE id=?',[$quantityId])['quantity']===12,'Location reconciliation changed aggregate quantity incorrectly');
    check((int)row($pdo,"SELECT quantity FROM inventory_stock_levels WHERE item_id=? AND location_name='Warehouse'",[$quantityId])['quantity']===9,'Location reconciliation did not update the counted location');
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

    // J: simultaneous retries with one add-stock idempotency key apply exactly once.
    $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,status,location,version) VALUES(?,UUID(),'Retry stock','Supplies','quantity',5,'in_stock','Warehouse',0)")->execute([$owner['id']]);
    $retryId=(int)$pdo->lastInsertId();$ids['items'][]=$retryId;$pdo->prepare("INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,'Warehouse',5)")->execute([$retryId]);
    $workers=[];$sameKey='same-add-'.$suffix;foreach([1,2] as $number){$pipes=[];$workers[]=[$process=proc_open([PHP_BINARY,__FILE__,'worker-add',(string)$retryId,(string)$owner['id'],$sameKey],[['pipe','r'],['pipe','w'],['pipe','w']],$pipes),$pipes];}
    foreach($workers as [$process,$pipes]){foreach($pipes as $pipe)fclose($pipe);check(proc_close($process)===0,'Idempotent concurrent retry failed');}
    check((int)row($pdo,'SELECT quantity FROM inventory_items WHERE id=?',[$retryId])['quantity']===7,'Concurrent idempotent retry applied twice');
    check((int)row($pdo,'SELECT COUNT(*) c FROM inventory_movements WHERE item_id=?',[$retryId])['c']===1,'Concurrent idempotent retry wrote duplicate movements');

    $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,status,location,version) VALUES(?,UUID(),'Race asset','Equipment','serialized',1,'available','Office',0)")->execute([$owner['id']]);
    $raceAssetId=(int)$pdo->lastInsertId();$ids['items'][]=$raceAssetId;$workers=[];
    foreach([1,2] as $number){$pipes=[];$workers[]=[$process=proc_open([PHP_BINARY,__FILE__,'worker-checkout',(string)$raceAssetId,(string)$owner['id'],"race-checkout-{$number}-{$suffix}"],[['pipe','r'],['pipe','w'],['pipe','w']],$pipes),$pipes];}
    $codes=[];foreach($workers as [$process,$pipes]){foreach($pipes as $pipe)fclose($pipe);$codes[]=proc_close($process);}sort($codes);check($codes===[0,1],'Exactly one concurrent checkout must succeed');
    check(row($pdo,'SELECT status FROM inventory_items WHERE id=?',[$raceAssetId])['status']==='checked_out','Concurrent checkout final state is incorrect');

    // A and B are proven above. C: checkout versus transfer must serialize without losing either valid update.
    $c=$createAsset('Race C');$codes=$race($c,[
        ['checkout',['related_party'=>'Team','location'=>'Office','purpose'=>'C','action_date'=>$now,'expected_return_date'=>date('Y-m-d',strtotime('+1 day')),'reason'=>'C checkout','idempotency_key'=>'c-checkout-'.$suffix]],
        ['transfer',['quantity'=>1,'from_location'=>'Office','to_location'=>'Warehouse','reason'=>'C transfer','idempotency_key'=>'c-transfer-'.$suffix]],
    ]);check($codes===[0,0],'C checkout and transfer did not serialize');$state=row($pdo,'SELECT status,location FROM inventory_items WHERE id=?',[$c]);check($state['status']==='checked_out'&&$state['location']==='Warehouse','C lost a serialized update');

    // D: checkout versus maintenance cannot create a dual-assigned maintenance state.
    $d=$createAsset('Race D');$codes=$race($d,[
        ['checkout',['related_party'=>'Team','location'=>'Office','purpose'=>'D','action_date'=>$now,'expected_return_date'=>date('Y-m-d',strtotime('+1 day')),'reason'=>'D checkout','idempotency_key'=>'d-checkout-'.$suffix]],
        ['maintenance_send',['location'=>'Office','maintenance_reason'=>'inspection','action_date'=>$now,'expected_completion_date'=>date('Y-m-d',strtotime('+1 day')),'technician'=>'Desk','reason'=>'D maintenance','idempotency_key'=>'d-maint-'.$suffix]],
    ]);check($codes===[0,1],'D must admit exactly one conflicting state change');check(in_array(row($pdo,'SELECT status FROM inventory_items WHERE id=?',[$d])['status'],['checked_out','maintenance'],true),'D final state is invalid');

    // E: transfer versus lost may both serialize, but the final state and ledger must remain coherent.
    $e=$createAsset('Race E');$codes=$race($e,[
        ['transfer',['quantity'=>1,'from_location'=>'Office','to_location'=>'Warehouse','reason'=>'E transfer','idempotency_key'=>'e-transfer-'.$suffix]],
        ['lost',['quantity'=>1,'location'=>'Office','reported_by'=>'Owner','loss_reason'=>'unknown','action_date'=>$now,'reason'=>'E lost','idempotency_key'=>'e-lost-'.$suffix]],
    ]);check(in_array($codes,[[0,0],[0,1]],true),'E returned unexpected outcomes');check(row($pdo,'SELECT status FROM inventory_items WHERE id=?',[$e])['status']==='lost','E final state is not lost');

    // F: transfer versus removal must preserve aggregate and per-location arithmetic.
    $f=$createQuantity('Race F',10);$codes=$race($f,[
        ['transfer',['quantity'=>3,'from_location'=>'Warehouse','to_location'=>'Office','reason'=>'F transfer','idempotency_key'=>'f-transfer-'.$suffix]],
        ['remove_stock',['quantity'=>4,'location'=>'Warehouse','reason'=>'issued_for_internal_use','idempotency_key'=>'f-remove-'.$suffix]],
    ]);check($codes===[0,0],'F valid operations did not serialize');check((int)row($pdo,'SELECT quantity FROM inventory_items WHERE id=?',[$f])['quantity']===6,'F aggregate quantity is wrong');$fl=$pdo->prepare('SELECT location_name,quantity FROM inventory_stock_levels WHERE item_id=?');$fl->execute([$f]);$fl=array_column($fl->fetchAll(),'quantity','location_name');check((int)$fl['Warehouse']===3&&(int)$fl['Office']===3,'F location balances are wrong');

    // G: reconciliation versus movement must either reject stale evidence or apply before the movement.
    $g=$createQuantity('Race G',10);$pdo->prepare("INSERT INTO inventory_stock_counts(item_id,user_id,expected_quantity,expected_location_quantity,item_version,counted_quantity,difference,location,counted_by,counted_by_name,count_date,reason,idempotency_key) VALUES(?,?,10,10,0,8,-2,'Warehouse',?,?,NOW(),'count_error',?)")->execute([$g,$owner['id'],$owner['id'],$owner['name'],'g-count-'.$suffix]);$gCount=(int)$pdo->lastInsertId();$codes=$race($g,[
        ['reconciliation',['apply_count_id'=>$gCount,'reason'=>'count_error','idempotency_key'=>'g-reconcile-'.$suffix]],
        ['add_stock',['quantity'=>1,'location'=>'Warehouse','reason'=>'restock','idempotency_key'=>'g-add-'.$suffix]],
    ]);check(in_array($codes,[[0,0],[0,1]],true),'G returned unexpected outcomes');$gState=row($pdo,'SELECT quantity FROM inventory_items WHERE id=?',[$g]);check(in_array((int)$gState['quantity'],[9,11],true),'G produced a stale overwrite');

    // H: two reconciliations of one saved count must apply once.
    $h=$createQuantity('Race H',10);$pdo->prepare("INSERT INTO inventory_stock_counts(item_id,user_id,expected_quantity,expected_location_quantity,item_version,counted_quantity,difference,location,counted_by,counted_by_name,count_date,reason,idempotency_key) VALUES(?,?,10,10,0,7,-3,'Warehouse',?,?,NOW(),'count_error',?)")->execute([$h,$owner['id'],$owner['id'],$owner['name'],'h-count-'.$suffix]);$hCount=(int)$pdo->lastInsertId();$codes=$race($h,[
        ['reconciliation',['apply_count_id'=>$hCount,'reason'=>'count_error','idempotency_key'=>'h-one-'.$suffix]],
        ['reconciliation',['apply_count_id'=>$hCount,'reason'=>'count_error','idempotency_key'=>'h-two-'.$suffix]],
    ]);check($codes===[0,1],'H reconciliation applied more than once');check((int)row($pdo,'SELECT quantity FROM inventory_items WHERE id=?',[$h])['quantity']===7,'H final quantity is wrong');

    // I: return versus maintenance is serialized into a valid lifecycle state.
    $i=$createAsset('Race I','checked_out');$pdo->prepare("UPDATE inventory_items SET assigned_to='Team' WHERE id=?")->execute([$i]);$codes=$race($i,[
        ['return',['returned_by'=>'Team','location'=>'Office','condition'=>'good','action_date'=>$now,'reason'=>'I return','idempotency_key'=>'i-return-'.$suffix]],
        ['maintenance_send',['location'=>'Office','maintenance_reason'=>'inspection','action_date'=>$now,'expected_completion_date'=>date('Y-m-d',strtotime('+1 day')),'technician'=>'Desk','reason'=>'I maintenance','idempotency_key'=>'i-maint-'.$suffix]],
    ]);check(in_array($codes,[[0,0],[0,1]],true),'I returned unexpected outcomes');check(in_array(row($pdo,'SELECT status FROM inventory_items WHERE id=?',[$i])['status'],['available','maintenance'],true),'I final state is invalid');

    // K: identical concurrent transfer retries must move stock once.
    $k=$createQuantity('Race K',10);$sameTransfer=['quantity'=>3,'from_location'=>'Warehouse','to_location'=>'Office','reason'=>'K transfer','idempotency_key'=>'k-transfer-'.$suffix];$codes=$race($k,[['transfer',$sameTransfer],['transfer',$sameTransfer]]);check($codes===[0,0],'K retry did not return successfully');$kl=$pdo->prepare('SELECT location_name,quantity FROM inventory_stock_levels WHERE item_id=?');$kl->execute([$k]);$kl=array_column($kl->fetchAll(),'quantity','location_name');check((int)$kl['Warehouse']===7&&(int)$kl['Office']===3,'K transfer applied more than once');check((int)row($pdo,'SELECT COUNT(*) c FROM inventory_movements WHERE item_id=?',[$k])['c']===1,'K wrote duplicate movements');

    // L: maintenance release must occur once.
    $l=$createAsset('Race L','maintenance');$release=['location'=>'Office','condition'=>'good','action_date'=>$now,'reason'=>'L release','idempotency_key'=>'l-release-'.$suffix];$codes=$race($l,[['maintenance_release',$release],['maintenance_release',array_merge($release,['idempotency_key'=>'l-release-other-'.$suffix])]]);check($codes===[0,1],'L released maintenance twice');check(row($pdo,'SELECT status FROM inventory_items WHERE id=?',[$l])['status']==='available','L final state is wrong');

    $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,status,location,version) VALUES(?,UUID(),'Stale count stock','Supplies','quantity',5,'in_stock','Warehouse',0)")->execute([$owner['id']]);
    $staleId=(int)$pdo->lastInsertId();$ids['items'][]=$staleId;$pdo->prepare("INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,'Warehouse',5)")->execute([$staleId]);
    $pdo->prepare("INSERT INTO inventory_stock_counts(item_id,user_id,expected_quantity,expected_location_quantity,item_version,counted_quantity,difference,location,counted_by,counted_by_name,count_date,reason,idempotency_key) VALUES(?,?,5,5,0,4,-1,'Warehouse',?,?,NOW(),'Stale test',?)")->execute([$staleId,$owner['id'],$owner['id'],$owner['name'],'stale-count-'.$suffix]);$staleCountId=(int)$pdo->lastInsertId();
    InventoryMovementService::perform($staleId,$owner,'add_stock',['quantity'=>1,'reason'=>'stock_correction','idempotency_key'=>'stale-change-'.$suffix]);
    try{InventoryMovementService::perform($staleId,$owner,'reconciliation',['apply_count_id'=>$staleCountId,'reason'=>'count_error','idempotency_key'=>'stock-count-'.$staleCountId]);throw new RuntimeException('Stale count was applied');}catch(RuntimeException $e){check($e->getCode()===409,'Unexpected stale-count error');}
    check(row($pdo,'SELECT status FROM inventory_stock_counts WHERE id=?',[$staleCountId])['status']==='saved','Rejected stale count was finalized');
    echo "inventory acceptance: PASS\n";
} finally {
    if ($ids['items']) {$marks=implode(',',array_fill(0,count($ids['items']),'?'));foreach(['inventory_stock_counts','inventory_stock_levels','inventory_movements'] as $child){$pdo->prepare("DELETE FROM {$child} WHERE item_id IN ($marks)")->execute($ids['items']);}$pdo->prepare("DELETE FROM inventory_items WHERE id IN ($marks)")->execute($ids['items']);}
    if ($ids['users']) {$values=array_values($ids['users']);$marks=implode(',',array_fill(0,count($values),'?'));$pdo->prepare("DELETE FROM users WHERE id IN ($marks)")->execute($values);}
}
