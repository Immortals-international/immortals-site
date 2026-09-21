import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrip,stepGrip,createBalance,stepBalance,matchSummary} from '../astro-site/src/scripts/dealer-game-models.js';

test('grip requires controlled input; doing nothing or holding continuously loses',()=>{
  for(const held of [false,true]){const game=createGrip();for(let i=0;i<1801&&!game.done;i++)stepGrip(game,1/120,held);assert.equal(game.done,true);assert.equal(game.won,false);assert.equal(game.elapsed,15);assert.ok(game.level>=0&&game.level<=100)}
});
test('grip can be won with a controlled hold at different frame rates',()=>{
  for(const rate of [30,60,120]){const game=createGrip();for(let i=0;i<15*rate&&!game.done;i++)stepGrip(game,1/rate,game.level<67);assert.equal(game.won,true);assert.equal(game.best,3);assert.ok(game.elapsed<8)}
});
test('leaving the grip zone breaks continuity and preserves the best earlier hold',()=>{
  const game=createGrip();game.level=67;stepGrip(game,.2,true);assert.ok(game.streak>0);const best=game.best;stepGrip(game,1,true);assert.equal(game.streak,0);assert.ok(game.best>=best);assert.equal(game.won,false);
});
test('balance requires corrections and bounds score to time actually played',()=>{
  const game=createBalance();for(let i=0;i<1801&&!game.done;i++)stepBalance(game,1/120,0);assert.equal(game.done,true);assert.equal(game.won,false);assert.equal(game.elapsed,15);assert.ok(game.balanced<=game.elapsed);assert.ok(Math.abs(game.angle)<=22);
});
test('balance is winnable through opposing the tilt and momentum',()=>{
  for(const rate of [30,60,120]){const game=createBalance();for(let i=0;i<rate*16&&!game.done;i++)stepBalance(game,1/rate,Math.sign(-2*game.angle-1.2*game.velocity));assert.equal(game.done,true);assert.equal(game.won,true);assert.ok(game.balanced>=10);assert.ok(game.balanced<=15.00001)}
});
test('completed games cannot acquire extra points or change outcome',()=>{
  const grip=createGrip();stepGrip(grip,30,false);const balance=createBalance();stepBalance(balance,30,0);const before=JSON.stringify([grip,balance]);stepGrip(grip,10,true);stepBalance(balance,10,-1);assert.equal(JSON.stringify([grip,balance]),before);
});
test('skips and unplayed rounds do not create a win or a fabricated measurement',()=>{
  const won={status:'played',won:true,value:'3.0 sec'};
  assert.deepEqual(matchSummary([won,won,{status:'skipped'}]),{played:2,won:2,skipped:1,complete:false,winner:false});
  assert.equal(matchSummary([won,won,null]).winner,false);
  assert.equal(matchSummary([won,won,{status:'played',won:false}]).winner,true);
  assert.equal(matchSummary([{status:'played',won:false},won,{status:'played',won:false}]).winner,false);
});
