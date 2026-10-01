<?php

require dirname(__DIR__) . '/vendor/autoload.php';
foreach (file(dirname(__DIR__).'/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
    $line=trim($line); if($line===''||str_starts_with($line,'#')||!str_contains($line,'='))continue;
    [$key,$value]=array_map('trim',explode('=',$line,2)); $_ENV[$key]=trim($value,"\"'");
}

use App\Config\Database;
use App\Services\InventoryMovementService;

function verify(bool $condition,string $message):void{if(!$condition)throw new RuntimeException($message);}
function one(PDO $pdo,string $sql,array $params=[]):array{$s=$pdo->prepare($sql);$s->execute($params);return $s->fetch()?:[];}
function scalar(PDO $pdo,string $sql,array $params=[]):string{$s=$pdo->prepare($sql);$s->execute($params);return (string)$s->fetchColumn();}
function expectSqlFailure(PDO $pdo,string $sql,string $message):void{try{$pdo->exec($sql);throw new RuntimeException($message);}catch(PDOException $e){verify($e->getCode()!=='00000',$message);}}

$database=$argv[1]??'';$mode=$argv[2]??'';
if(!preg_match('/^[a-zA-Z0-9_]+$/',$database))throw new InvalidArgumentException('Safe database name required.');
$_ENV['DB_NAME']=$database;
$pdo=Database::getInstance();
$pdo->exec('SET @inventory_allow_history_cleanup=0');

if($mode==='fresh'){
    foreach(['users','qr_codes','inventory_items','inventory_locations','inventory_movements','inventory_stock_levels','inventory_stock_counts','inventory_access'] as $table){verify(scalar($pdo,"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?",[$table])==='1',"Missing table $table");}
    foreach(['inventory_public_token_unique','inventory_movement_idempotency_unique','inventory_stock_location_unique','inventory_count_idempotency_unique'] as $index){verify(scalar($pdo,"SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND index_name=?",[$index])!=='0',"Missing index $index");}
    foreach(['inventory_movements_block_update','inventory_movements_block_delete','inventory_applied_counts_block_update','inventory_counts_block_delete'] as $trigger){verify(scalar($pdo,"SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema=DATABASE() AND trigger_name=?",[$trigger])==='1',"Missing trigger $trigger");}

    $pdo->prepare("INSERT INTO users(email,password,name,plan,email_verified_at) VALUES('fresh-migration@example.test','disabled','Fresh Owner','Free',NOW())")->execute();$ownerId=(int)$pdo->lastInsertId();$owner=['id'=>$ownerId,'name'=>'Fresh Owner'];
    $pdo->prepare("INSERT INTO qr_codes(user_id,type,name,content,dynamic_id) VALUES(?,'text','Fresh inventory QR',JSON_OBJECT('content','fresh-inventory'),'fresh-migration-qr')")->execute([$ownerId]);$qrId=(int)$pdo->lastInsertId();
    $pdo->prepare("INSERT INTO inventory_locations(user_id,name) VALUES(?,'Warehouse'),(?,'Office')")->execute([$ownerId,$ownerId]);
    $pdo->prepare("INSERT INTO inventory_items(user_id,qr_id,public_token,name,category,inventory_type,quantity,minimum_stock_level,status,location,version) VALUES(?,?,UUID(),'Fresh quantity','Supplies','quantity',10,2,'in_stock','Warehouse',0)")->execute([$ownerId,$qrId]);$quantityId=(int)$pdo->lastInsertId();
    $pdo->prepare("INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,'Warehouse',10)")->execute([$quantityId]);
    $resolved=one($pdo,'SELECT i.id,i.qr_id,q.dynamic_id FROM inventory_items i JOIN qr_codes q ON q.id=i.qr_id WHERE q.id=?',[$qrId]);verify((int)$resolved['id']===$quantityId&&$resolved['dynamic_id']==='fresh-migration-qr','Fresh inventory QR did not resolve');
    InventoryMovementService::perform($quantityId,$owner,'add_stock',['quantity'=>5,'location'=>'Warehouse','reason'=>'restock','idempotency_key'=>'fresh-add']);
    InventoryMovementService::perform($quantityId,$owner,'transfer',['quantity'=>3,'from_location'=>'Warehouse','to_location'=>'Office','reason'=>'Fresh transfer','idempotency_key'=>'fresh-transfer']);
    InventoryMovementService::perform($quantityId,$owner,'remove_stock',['quantity'=>2,'location'=>'Office','reason'=>'issued_for_internal_use','idempotency_key'=>'fresh-remove']);
    InventoryMovementService::perform($quantityId,$owner,'adjust',['new_quantity'=>14,'location'=>'Warehouse','reason'=>'system_correction','idempotency_key'=>'fresh-adjust']);
    $current=one($pdo,'SELECT quantity,version FROM inventory_items WHERE id=?',[$quantityId]);$warehouse=(int)scalar($pdo,"SELECT quantity FROM inventory_stock_levels WHERE item_id=? AND location_name='Warehouse'",[$quantityId]);
    $pdo->prepare("INSERT INTO inventory_stock_counts(item_id,user_id,expected_quantity,expected_location_quantity,item_version,counted_quantity,difference,location,counted_by,counted_by_name,count_date,reason,notes,idempotency_key) VALUES(?,?,?,?,?,?,?,'Warehouse',?, ?,NOW(),'count_error','Fresh count','fresh-count')")->execute([$quantityId,$ownerId,$current['quantity'],$warehouse,$current['version'],$warehouse+1,1,$ownerId,$owner['name']]);$countId=(int)$pdo->lastInsertId();
    InventoryMovementService::perform($quantityId,$owner,'reconciliation',['apply_count_id'=>$countId,'reason'=>'count_error','idempotency_key'=>'fresh-reconcile']);
    verify((int)scalar($pdo,'SELECT COUNT(*) FROM inventory_movements WHERE item_id=?',[$quantityId])===5,'Fresh quantity history incomplete');
    verify((int)scalar($pdo,'SELECT quantity FROM inventory_items WHERE id=?',[$quantityId])===(int)scalar($pdo,'SELECT COALESCE(SUM(quantity),0) FROM inventory_stock_levels WHERE item_id=?',[$quantityId]),'Fresh quantity invariant failed');

    $pdo->prepare("INSERT INTO inventory_items(user_id,public_token,name,category,inventory_type,quantity,status,location,version) VALUES(?,UUID(),'Fresh serialized','Equipment','serialized',1,'available','Office',0)")->execute([$ownerId]);$assetId=(int)$pdo->lastInsertId();$now=date('Y-m-d H:i:s');
    InventoryMovementService::perform($assetId,$owner,'transfer',['quantity'=>1,'from_location'=>'Office','to_location'=>'Warehouse','reason'=>'Fresh asset transfer','idempotency_key'=>'fresh-asset-transfer']);
    InventoryMovementService::perform($assetId,$owner,'checkout',['related_party'=>'Test team','location'=>'Warehouse','purpose'=>'Fresh lifecycle','action_date'=>$now,'expected_return_date'=>date('Y-m-d',strtotime('+1 day')),'reason'=>'Fresh checkout','idempotency_key'=>'fresh-checkout']);
    InventoryMovementService::perform($assetId,$owner,'return',['returned_by'=>'Test team','location'=>'Warehouse','action_date'=>$now,'condition'=>'good','reason'=>'Fresh return','idempotency_key'=>'fresh-return']);
    InventoryMovementService::perform($assetId,$owner,'maintenance_send',['location'=>'Warehouse','maintenance_reason'=>'inspection','action_date'=>$now,'expected_completion_date'=>date('Y-m-d',strtotime('+1 day')),'technician'=>'Test desk','reason'=>'Fresh maintenance','idempotency_key'=>'fresh-maintenance']);
    InventoryMovementService::perform($assetId,$owner,'maintenance_release',['location'=>'Warehouse','action_date'=>$now,'condition'=>'good','reason'=>'Fresh release','idempotency_key'=>'fresh-release']);
    verify(one($pdo,'SELECT status,location,assigned_to FROM inventory_items WHERE id=?',[$assetId])['status']==='available','Fresh serialized lifecycle failed');
    verify((int)scalar($pdo,'SELECT COUNT(*) FROM inventory_movements WHERE item_id=?',[$assetId])===5,'Fresh serialized history incomplete');
    echo "FRESH SCHEMA: PASS\nFRESH QUANTITY LIFECYCLE: PASS\nFRESH SERIALIZED LIFECYCLE: PASS\n";exit(0);
}

if($mode==='legacy-seed'){
    $pdo->prepare("INSERT INTO users(email,password,name,plan,email_verified_at) VALUES('legacy-migration@example.test','disabled','Legacy Owner','Free',NOW())")->execute();$owner=(int)$pdo->lastInsertId();
    $pdo->prepare("INSERT INTO qr_codes(user_id,type,name,content,dynamic_id) VALUES(?,'text','Legacy inventory QR',JSON_OBJECT('content','legacy-inventory'),'legacy-inventory-qr')")->execute([$owner]);$qr=(int)$pdo->lastInsertId();
    $items=[
      [$qr,'Legacy quantity multi','Supplies','quantity',12,'in_stock','Location A',null],
      [null,'Legacy quantity single','Supplies','quantity',9,'in_stock','Warehouse',null],
      [null,'Legacy serialized active','Equipment','serialized',1,'in_stock','Office',null],
      [null,'Legacy serialized maintenance','Equipment','serialized',1,'maintenance','Workshop',null],
      [null,'Legacy archived','Equipment','serialized',1,'out','Archive','2025-01-01 00:00:00'],
    ];
    $ids=[];$stmt=$pdo->prepare('INSERT INTO inventory_items(user_id,qr_id,name,category,inventory_type,quantity,status,location,deleted_at) VALUES(?,?,?,?,?,?,?,?,?)');foreach($items as $item){$stmt->execute([$owner,...$item]);$ids[]=(int)$pdo->lastInsertId();}
    $pdo->prepare("INSERT INTO inventory_stock_levels(item_id,location_name,quantity) VALUES(?,'Location A',7),(?,'Location B',5)")->execute([$ids[0],$ids[0]]);
    echo json_encode(['owner'=>$owner,'qr'=>$qr,'items'=>$ids],JSON_THROW_ON_ERROR);exit(0);
}

if($mode==='legacy-verify'){
    $multi=one($pdo,"SELECT * FROM inventory_items WHERE name='Legacy quantity multi'");$single=one($pdo,"SELECT * FROM inventory_items WHERE name='Legacy quantity single'");
    verify((int)$multi['quantity']===12&&(int)$single['quantity']===9,'Legacy quantity changed');
    verify((int)scalar($pdo,'SELECT COALESCE(SUM(quantity),0) FROM inventory_stock_levels WHERE item_id=?',[$multi['id']])===12,'Legacy multi-location quantity changed');
    verify((int)scalar($pdo,'SELECT COALESCE(SUM(quantity),0) FROM inventory_stock_levels WHERE item_id=?',[$single['id']])===9,'Legacy single-location quantity was not backfilled');
    $qr=one($pdo,"SELECT q.id,q.dynamic_id,i.id item_id FROM qr_codes q JOIN inventory_items i ON i.qr_id=q.id WHERE q.dynamic_id='legacy-inventory-qr'");verify(!empty($qr)&&$qr['dynamic_id']==='legacy-inventory-qr','Legacy QR no longer resolves');
    verify((int)scalar($pdo,"SELECT COUNT(*) FROM qr_codes WHERE dynamic_id='legacy-inventory-qr'")===1,'Legacy QR duplicated');
    verify((int)scalar($pdo,"SELECT COUNT(*) FROM inventory_movements WHERE action_type='legacy_opening_state' AND JSON_UNQUOTE(JSON_EXTRACT(metadata,'$.provenance'))='migration_030'")===5,'Opening provenance is missing or duplicated');
    verify((int)scalar($pdo,"SELECT COUNT(*) FROM inventory_items i WHERE i.inventory_type='quantity' AND i.deleted_at IS NULL AND i.quantity<>(SELECT COALESCE(SUM(s.quantity),0) FROM inventory_stock_levels s WHERE s.item_id=i.id)")===0,'Legacy quantity invariant mismatch');
    echo "LEGACY QUANTITY: PASS\nLEGACY QR: PASS\nOPENING MOVEMENT: PASS\nMULTI-LOCATION REPLAY: PASS\nQUANTITY INVARIANT: PASS\n";exit(0);
}

if($mode==='integrity'){
    $movement=one($pdo,"SELECT m.id,m.item_id,m.user_id,m.performed_by,m.from_location FROM inventory_movements m LIMIT 1");verify(!empty($movement),'Movement fixture missing');
    expectSqlFailure($pdo,"UPDATE inventory_movements SET reason='tampered' WHERE id=".(int)$movement['id'],'Movement update unexpectedly succeeded');
    expectSqlFailure($pdo,"DELETE FROM inventory_movements WHERE id=".(int)$movement['id'],'Movement delete unexpectedly succeeded');
    expectSqlFailure($pdo,"DELETE FROM inventory_items WHERE id=".(int)$movement['item_id'],'Referenced item delete unexpectedly succeeded');
    expectSqlFailure($pdo,"DELETE FROM users WHERE id=".(int)$movement['user_id'],'Referenced owner delete unexpectedly succeeded');
    $count=one($pdo,"SELECT id,item_id,user_id FROM inventory_stock_counts WHERE status='applied' LIMIT 1");verify(!empty($count),'Applied count fixture missing');
    expectSqlFailure($pdo,"UPDATE inventory_stock_counts SET notes='tampered' WHERE id=".(int)$count['id'],'Applied count update unexpectedly succeeded');
    expectSqlFailure($pdo,"DELETE FROM inventory_stock_counts WHERE id=".(int)$count['id'],'Count delete unexpectedly succeeded');
    // Actor removal is deliberately SET NULL; immutable actor name remains as the historical snapshot.
    $actorId=(int)$movement['performed_by'];if($actorId!==(int)$movement['user_id']){$pdo->exec("DELETE FROM users WHERE id=$actorId");verify(scalar($pdo,'SELECT performed_by FROM inventory_movements WHERE id=?',[$movement['id']])===''&&scalar($pdo,'SELECT performed_by_name FROM inventory_movements WHERE id=?',[$movement['id']])!=='','Actor snapshot was not preserved');}
    // Locations are referenced by immutable names in the ledger; deleting configuration must not alter history.
    $before=scalar($pdo,'SELECT from_location FROM inventory_movements WHERE id=?',[$movement['id']]);if($before!==''){$pdo->prepare('DELETE FROM inventory_locations WHERE user_id=? AND name=?')->execute([$movement['user_id'],$before]);verify(scalar($pdo,'SELECT from_location FROM inventory_movements WHERE id=?',[$movement['id']])===$before,'Location history was orphaned');}
    echo "REFERENTIAL INTEGRITY: PASS\n";exit(0);
}

throw new InvalidArgumentException('Mode must be fresh, legacy-seed, legacy-verify, or integrity.');
