"""Publish the reviewed geometry in the Gallery drawing language. Standard library only.
Run from the repository root: python3 scripts/floor-plans/build.py
Gallery is read for reference symbols and is never written.
"""
from pathlib import Path
import copy,hashlib,html,json,math,textwrap,xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'astro-site/public/assets';DATA=json.loads(Path(__file__).with_name('concepts.json').read_text())
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
BG='#fffefa';INK='#263831';WALL='#33433c';FILL={0:'#f0f0ed',1:'#f7efe1',2:'#eee7d6',3:'#eaf0e9',4:'#eef3f2'}
IDS={'public':'windowfront','club':'shared-club','wings':'two-destinations','houses':'patient-houses'}
NAMES={'D1':'DEXA','D2':'BALANCE / MOVEMENT','D3':'VO₂ MAX','T1':'CONVENTIONAL HBOT','T2':'HBOT TECHNICAL','C1':'CLINICAL TEAM','C2':'CLEAN PREP','E1':'FLEXIBLE SALON','E2':'SKIN / DATA','B0':'SUPPORT / WC LOBBY','B1':'STAFF / OFFICE','B2':'PANTRY / SERVICE','B3':'IT / SERVICES','B4':'SOILED','B5':'CLEANER','W1':'ACCESSIBLE WC','W2':'WC','A1':'HOUSE A LOUNGE','A2':'LOCAL CARE / PREP','H1':'HOUSE B LOUNGE','H2':'LOCAL CARE / PREP'}
def polygons(g):return [g['coordinates']] if g['type']=='Polygon' else g['coordinates']
def path(g):return ''.join('M'+'L'.join(f'{x:.3f} {y:.3f}' for x,y in ring)+'Z' for poly in polygons(g) for ring in poly)
def inside_ring(p,ring):
 x,y=p;c=False
 for (ax,ay),(bx,by) in zip(ring,ring[1:]):
  if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:c=not c
 return c

def inside(g,p):return any(inside_ring(p,poly[0]) and not any(inside_ring(p,h) for h in poly[1:]) for poly in polygons(g))
def bbox(g):
 ps=[p for poly in polygons(g) for p in poly[0]];return min(x for x,y in ps),min(y for x,y in ps),max(x for x,y in ps),max(y for x,y in ps)
def fits(g,x,y,w,h):return all(inside(g,(x+dx*w,y+dy*h)) for dx in [-.5,-.25,0,.25,.5] for dy in [-.5,-.25,0,.25,.5])
def spot(g,w,h,near=None,avoid=()):
 x0,y0,x1,y1=bbox(g);near=near or ((x0+x1)/2,(y0+y1)/2)
 best=None
 for y in range(math.ceil(y0+h/2+4),math.floor(y1-h/2-4)+1,8):
  for x in range(math.ceil(x0+w/2+4),math.floor(x1-w/2-4)+1,8):
   if any(abs(x-cx)<(w+aw)/2+8 and abs(y-cy)<(h+ah)/2+8 for cx,cy,aw,ah in avoid):continue
   if fits(g,x,y,w,h):
    score=(x-near[0])**2+(y-near[1])**2
    if best is None or score<best[0]:best=(score,x,y)
 return (best[1],best[2]) if best else None
class Draw:
 def __init__(self):self.a=[]
 def raw(self,s):self.a.append(s)
 def rect(self,x,y,w,h,fill='#e0e4df',stroke='#8b968c',sw=1,rx=2):self.raw(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
 def line(self,d,stroke=WALL,w=1.3,dash=''):
  self.raw(f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="square"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
 def text(self,x,y,lines,size=14,anchor='middle',weight=600,color=INK):
  if isinstance(lines,str):lines=[lines]
  for i,t in enumerate(lines):self.raw(f'<text x="{x}" y="{y+i*(size+4)}" font-family="Arial,sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" fill="{color}">{html.escape(str(t))}</text>')
 def circle(self,x,y,r,fill='#fcfaf3'):self.raw(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="#a7a58e" stroke-width="1"/>')
 def ellipse(self,x,y,rx,ry):self.raw(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="white" stroke="#8b9e88" stroke-width="1"/>')
 def couch(self,x,y,w=55):self.rect(x,y,w,20,'#dce4d5',rx=4);self.line(f'M{x+4} {y+15}h{w-8}','#94a18f',1)
 def basin(self,x,y):self.rect(x,y,18,11,'white','#8b9e88',1,0)
 def toilet(self,x,y):self.rect(x-8,y-15,16,7,'white','#8b9e88',1,0);self.ellipse(x,y,8,11)
 def door(self,z,x,y):
  ringpoints=[ring for p in polygons(z['geometry']) for ring in p];edge=None
  for ring in ringpoints:
   for a,b in zip(ring,ring[1:]):
    l=math.dist(a,b)
    if l and abs(math.dist(a,(x,y))+math.dist((x,y),b)-l)<.05:edge=(a,b,l);break
   if edge:break
  if not edge:return
  a,b,l=edge;ux=(b[0]-a[0])/l;uy=(b[1]-a[1])/l;nx=-uy;ny=ux
  if not inside(z['geometry'],(x+nx*2,y+ny*2)):nx=-nx;ny=-ny
  w=min(28 if z['id'] in ['B3','B4','B5','W2'] else 35,l-4);hx=x-ux*w/2;hy=y-uy*w/2;tx=x+ux*w/2;ty=y+uy*w/2
  self.line(f'M{hx} {hy}L{tx} {ty}',BG,7)
  self.line(f'M{hx} {hy}L{hx+nx*w} {hy+ny*w}',WALL,1.3)
  self.line(f'M{tx} {ty}Q{tx+nx*w} {ty+ny*w} {hx+nx*w} {hy+ny*w}','#9ba59b',1)
 def suite(self,z):
  g=z['geometry'];s=1;loc=spot(g,130,105)
  if not loc:s=.8;loc=spot(g,104,84)
  if not loc:raise ValueError('Suite symbol will not fit '+z['id'])
  x,y=loc;self.raw(f'<g data-symbol="patient-suite" transform="translate({x} {y}) scale({s})">')
  self.rect(-61,-41,28,58,BG,rx=3);self.rect(-58,-38,22,11.6,'#dde4d9',rx=0)
  self.rect(0,-48,61,54,'#dce5da',WALL,2,0);self.rect(28,-43,28,30,'#f7faf4','#8b9e88',1,0)
  self.line('M29 -42L55 -14M55 -42L29 -14','#8b9e88',.8);self.toilet(14,-19);self.basin(5,-43)
  self.line('M0 -9V4',BG,7);self.line('M0 -9H-13',WALL,1.3);self.text(38,0,'ENS',9)
  self.text(-25,32,z['id'].replace('S','SUITE '),13,weight=700);self.couch(5,30,55);self.raw('</g>')
 def equipment(self,z):
  id=z['id'];g=z['geometry'];name=NAMES.get(id,z['name'].replace('|',' ')).upper();loc=None;scale=1
  if id=='B0':
   loc=spot(g,130,24)
   if loc:self.text(loc[0],loc[1]+3,'SUPPORT / WC LOBBY',10,weight=400)
   return
  sizes={'D1':(92,90),'D2':(92,88),'D3':(85,100),'T1':(104,94),'E1':(135,92),'E2':(105,85)}
  w,h=sizes.get(id,(90,78))
  lines=textwrap.wrap(name,max(11,int(w/7)),break_long_words=False)
  for scale in [1,.85,.7]:
   loc=spot(g,w*scale,h*scale)
   if loc:break
  if not loc:
   compact=spot(g,52,42)
   if compact:
    x,y=compact;self.raw(f'<g data-symbol="{id.lower()}-compact" transform="translate({x} {y})">');self.text(0,-7,id,12,weight=700)
    if id=='D3':self.rect(-10,0,20,18);self.rect(-7,3,14,12,BG,'#8c9c90',.8,0)
    elif id=='T1':self.rect(-22,1,44,17,'#f5f8fa','#8296a5',1.4,9)
    elif id.startswith('W'):self.toilet(0,9)
    elif id=='E2':self.couch(-20,1,26);self.rect(10,1,11,18)
    else:self.rect(-22,4,44,13)
    self.raw('</g>');return
   loc=spot(g,20,14)
   if not loc:raise ValueError('Label will not fit '+id)
   self.text(*loc,id,12,weight=700);return
  x,y=loc;self.raw(f'<g data-symbol="{id.lower()}" transform="translate({x} {y}) scale({scale})">')
  self.text(0,-h/2+13,[id]+lines,12)
  yb=h/2-28
  if id=='D1':
   self.rect(-42,yb-7,84,28);self.rect(-16,yb-12,17,39,'#cfdad5','#7d9488',1.2,0)
  elif id=='D2':self.rect(-33,yb,66,24,'none','#98aaa0',1.2,0);self.line(f'M-28 {yb+12}H28','#98aaa0',1,'4 3')
  elif id=='D3':self.rect(-18,yb-14,37,41);self.rect(-14,yb-10,29,28,'#f9fbf7','#8c9c90',1,0)
  elif id=='T1':self.rect(-48,yb-2,96,30,'#f5f8fa','#8296a5',1.4,15);self.line(f'M-36 {yb+13}H36','#8296a5',1.2)
  elif id=='E1':self.rect(-61,yb-6,122,32,'none','#b69a73',1.5,16);self.text(0,yb+14,'FLEXIBLE EQUIPMENT',7,weight=400)
  elif id=='E2':self.couch(-45,yb,50);self.rect(20,yb-4,25,28)
  elif id.startswith('W'):self.toilet(-13,yb+10);self.basin(13,yb)
  elif id in ['A1','H1']:self.couch(-34,yb,45);self.circle(25,yb+10,10)
  else:self.rect(-34,yb+6,68,18)
  self.raw('</g>')
 def coffee(self,z,avoid=()):
  g=z['geometry'];loc=spot(g,285,115,avoid=avoid);scale=1
  if not loc:loc=spot(g,228,92,avoid=avoid);scale=.8
  if not loc:return []
  x,y=loc;self.raw(f'<g data-symbol="working-coffee-bar" transform="translate({x} {y}) scale({scale})">')
  self.couch(-130,-2,65);self.couch(-130,43,65);self.circle(-98,31,13)
  self.rect(5,-27,120,26,'#d4b98f','#84745b',1.5,0);self.text(65,-10,'COFFEE / SERVE',10,weight=700)
  self.rect(5,35,120,16,'#ded8c9','#84745b',1.3,0);self.rect(12,38,23,10,'white','#84745b',.8,0)
  self.text(23,46,'SINK',6,weight=400);self.rect(45,37,38,12,'#aeb8b4','#6c7972',1,0);self.text(64,46,'ESPRESSO',6,weight=400)
  self.text(65,16,'STAFF AISLE',9,weight=400);self.text(65,29,'FRIDGE + WASHER BELOW',7,weight=400);self.raw('</g>')
  x0,y0,x1,y1=bbox(g);occupied=list(avoid)+[(x,y,285*scale,115*scale)]
  for near in [(x0+110,y),(x1-110,y),(x,y1-55)]:
   q=spot(g,140,85,near)
   if not q or any(abs(q[0]-cx)<(140+w)/2+20 and abs(q[1]-cy)<(85+h)/2+20 for cx,cy,w,h in occupied):continue
   cx,cy=q;occupied.append((cx,cy,140,85));self.raw('<g data-symbol="lounge-seating">')
   self.couch(cx-62,cy-32,55);self.couch(cx+7,cy+12,55);self.circle(cx,cy,14);self.raw('</g>')
  return occupied
 def public(self,z):
  id=z['id'];g=z['geometry'];x0,y0,x1,y1=bbox(g);name=z['name'].replace('|',' ').upper()
  if z.get('furniture')=='window-cafe':
   self.text(765,270,'WINDOW CAFÉ / DISCOVERY',15)
   self.raw('<g data-symbol="working-coffee-bar">')
   self.rect(650,300,160,22,'#d4b98f','#84745b',1.5,0);self.text(730,315,'COFFEE / SERVE',10)
   self.rect(650,360,160,16,'#ded8c9','#84745b',1.2,0)
   self.basin(658,363);self.rect(703,362,38,12,'#aeb8b4','#6c7972',1,0)
   self.text(721,371,'ESPRESSO',6,weight=400);self.text(730,341,'STAFF AISLE',9,weight=400)
   self.text(730,353,'FRIDGE + WASHER BELOW',7,weight=400)
   self.couch(850,320,60);self.circle(927,345,14);self.couch(946,355,60);self.raw('</g>')
   return
  if z['kind']=='walk':
   loc=spot(g,30,180)
   if loc:
    self.raw(f'<g transform="translate({loc[0]} {loc[1]}) rotate(-90)">');self.text(0,4,name,13);self.raw('</g>')
   return
  if id=='G' and 'CONNECTED' not in name:name='PATIENT ARRIVAL'
  lines=textwrap.wrap(name,18,break_long_words=False)
  tw=max(len(t) for t in lines)*9
  th=len(lines)*19+8
  loc=spot(g,tw,th)
  if not loc:
   lines=textwrap.wrap(name,12,break_long_words=False);tw=max(len(t) for t in lines)*9;th=len(lines)*19+8
   loc=spot(g,tw,th)
  if loc:
   x,y=loc
   if z['kind']=='coffee':
    label=spot(g,min(250,x1-x0-12),42,(x0+150,y0+45))
    if label:self.text(*label,textwrap.wrap(name,27),15)
    self.coffee(z,avoid=[(*label,min(250,x1-x0-12),42)] if label else [])
   else:
    self.text(x,y-(len(lines)-1)*9.5+5,lines,15)
    occupied=[(x,y,tw,th)]
    if z['kind']=='arrival':return
    if z['kind']=='lounge':
     for near in [(x0+90,y0+75),(x1-95,y1-65)]:
      q=spot(g,120,60,near,avoid=occupied)
      if q:
       occupied.append((*q,120,60));self.couch(q[0]-50,q[1]-10,65);self.circle(q[0]+32,q[1],13)
     return
    # Discovery furniture is decorative; place only within its own open zone.
    for px,py,tag in [(x0+100,y0+75,'TRY / LEARN'),(x1-90,y1-55,'DEMO / DATA')]:
     if abs(px-x)+abs(py-y)<100:continue
     q=spot(g,90,65,(px,py),avoid=occupied)
     if q and abs(q[0]-x)+abs(q[1]-y)>100:
      self.rect(q[0]-30,q[1]-7,60,20);self.text(q[0],q[1]+28,tag,9,weight=400);occupied.append((*q,90,65))
  elif id=='G':
   loc=spot(g,24,150)
   if loc:self.raw(f'<g transform="translate({loc[0]} {loc[1]}) rotate(-90)">');self.text(0,5,'PATIENT ARRIVAL',13);self.raw('</g>')
 def corner(self,z):
  g=z['geometry'];top=bbox(g)[1];kind=z['kind']
  self.raw('<g data-symbol="active-public-corner">')
  self.text(910,top+32,textwrap.wrap(z['name'],26),16)
  if kind=='discovery':
   self.rect(785,1160,225,33,'#ded8c9','#a4947b',1.2,2)
   self.text(897,1181,'LIVE DEMONSTRATIONS',10,weight=400)
   for x,y in [(780,1210),(1000,1210)]:
    self.rect(x,y,44,24);self.text(x+22,y+39,'EXPLORE',8,weight=400)
  elif kind=='lounge':
   self.couch(735,1110,78);self.couch(735,1175,78);self.circle(774,1150,17)
   self.circle(976,1135,33)
   for x,y in [(963,1081),(963,1174),(921,1122),(1018,1122)]:self.rect(x,y,25,25,'#dce4d5',rx=4)
   self.text(969,1220,'CONVERSATION / SHARED TABLE',10,weight=400)
  elif kind=='forum':
   self.rect(775,1148,230,34,'#ded8c9','#a4947b',1.2,2)
   self.text(890,1170,'TALKS / FLEXIBLE DISPLAY',10,weight=400)
   for y in [1200,1235]:
    for x in [805,850,895,940,985]:self.rect(x,y,24,22,'#dce4d5',rx=3)
  else:
   self.rect(885,1190,140,25,'#d4b98f','#84745b',1.5,0)
   self.text(955,1208,'COFFEE / SERVE',10)
   self.rect(885,1250,115,16,'#ded8c9','#84745b',1.2,0)
   self.basin(891,1253);self.rect(935,1252,38,12,'#aeb8b4','#6c7972',1,0)
   self.text(954,1261,'ESPRESSO',6,weight=400)
   self.text(957,1240,'STAFF AISLE',8,weight=400)
   self.couch(766,1190,70);self.circle(804,1230,14)
  # The angled seating follows the exact corner, rather than leaving a dead tip.
  self.raw('<path d="M800 1254L958 1331L1022 1239L1037 1249L964 1354L791 1270Z" fill="#dce4d5" stroke="#8b968c" stroke-width="1.2"/>')
  self.line('M802 1266L960 1343L1030 1247','#94a18f',1)
  self.circle(925,1295,16)
  self.raw('</g>')

# Exact reference symbols from Gallery: escape and perimeter glazing.
ref=E.parse(OUT/'plan-gallery.svg').getroot();rg=ref.find('.//*[@id="architectural-plan"]')
escape=copy.deepcopy(list(rg.find('./{*}g[@id="space-16"]'))[2]);escape.attrib.pop('clip-path',None)
reference_shell=DATA[0]['shell'];manifest=[]
for model in DATA:
 d=Draw();key=model['key'];slug=IDS[key];title=model['title'];zones=model['zones'];byid={z['id']:z for z in zones}
 d.raw('<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="1800" viewBox="0 0 2200 1800">')
 d.raw(f'<title>{html.escape(title)} / Immortals Macau concept floor plan</title><desc>Four suites, three assessments, conventional HBOT, public experiences and support. Original shell retained. Furniture illustrative; dimensions and equipment fit unverified.</desc>')
 d.rect(0,0,2200,1800,BG,'none',0,0);d.text(65,66,'IMMORTALS / MACAU',24,'start',700);d.text(65,119,title,39,'start',700)
 d.text(65,158,'Four private suites · active public corner · internal support · connected circulation',23,'start',400)
 d.raw('<g id="architectural-plan" transform="translate(15 155) scale(1.03)">')
 d.line('M205 832L651 1362L907 1489L1250 1599','#c6cbc2',1.2);d.line('M1507 509L1344 772L1329 1164L1131 1416L1472 1515','#c6cbc2',1.2)
 d.raw(f'<path d="{reference_shell}" fill="{BG}" stroke="{WALL}" stroke-width="4.5"/>')
 for z in zones:
  if z['id']=='R':continue
  fill='#e9eef3' if z['id'] in ['T1','T2'] else '#e7d7cf' if z['id']=='E' else FILL[z['cat']]
  d.raw(f'<path data-room="{z["id"]}" d="{path(z["geometry"])}" fill="{fill}" fill-rule="evenodd"/>')
 for z in zones:
  if not z['open']:d.line(path(z['geometry']),WALL,4.5)
 for id in model.get('glazedRooms',[]):
  x0,y0,x1,y1=bbox(byid[id]['geometry'])
  d.line(f'M{x0} {y0}H{x1}',BG,7);d.line(f'M{x0} {y0}H{x1}','#6c98a1',2,'5 3');d.line(f'M{x0+4} {y0+5}H{x1-4}','#6c98a1',.9,'5 3')
 for door in model['doors']:d.door(byid[door['room']],*door['door'])
 for z in zones:
  id=z['id'];rid='room-'+id;d.raw(f'<defs><clipPath id="{rid}"><path d="{path(z["geometry"])}" fill-rule="evenodd"/></clipPath></defs><g clip-path="url(#{rid})">')
  if id=='E':d.raw(E.tostring(escape,encoding='unicode'))
  elif id=='R':pass
  elif id=='K':d.corner(z)
  elif id.startswith('S'):d.suite(z)
  elif z['open']:d.public(z)
  else:d.equipment(z)
  d.raw('</g>')
 # Use Gallery's exact glazing paths, with no offset gaps.
 for el in rg:
  if el.tag.endswith('path') and el.attrib.get('stroke')=='#6c98a1':d.raw(E.tostring(el,encoding='unicode'))
 # Arrival doors use the same symbol size as Gallery.
 for x,y,angle,public in [(1149,982,103,False)]+([(600,1053,53,True)] if key in ['club','wings'] else []):
  d.raw(f'<g transform="translate({x} {y}) rotate({angle})">');d.line('M-22 0H22',BG,9);d.line('M-22 0V44',WALL,1.3);d.line('M-22 44A44 44 0 0 0 22 0','#9ba59b',1);d.raw('</g>')
  d.text(315 if public else 1234,1110 if public else 966,['PUBLIC ENTRY','PROPOSED SHOPFRONT DOOR'] if public else ['PATIENT ENTRY' if key in ['club','wings'] else 'SHARED ENTRY','EXISTING OPENING'],15 if public else 16,'middle' if public else 'start',700)
 # Prime mall frontage is public in every option, with proposed glazing explicit.
 d.line('M760 1260L975 1365L1133 1137',BG,7)
 d.line('M760 1260L975 1365L1133 1137','#6c98a1',3,'7 4')
 d.line('M766 1255L973 1356L1127 1134','#6c98a1',1,'7 4')
 d.line('M1045 1281L1150 1340H1190','#9aab9d',1)
 d.text(1206,1336,['HIGH-FOOTFALL CORNER','PROPOSED PUBLIC GLAZING'],13,'start',600)
 if key=='club':
  loc=spot(byid['R']['geometry'],130,38,(1165,580))
  if loc:d.text(loc[0],loc[1]-5,['PATIENT','CIRCULATION'],12,weight=400)
 # Host furniture in deliberately reserved circulation, without moving a wall.
 hx,hy=(960,1030) if key in ['club','wings'] else (1100,1030)
 if inside(byid['R']['geometry'],(hx,hy)):
  d.rect(hx-20,hy-14,40,25);d.text(hx,hy+27,'HOST',10,weight=400)
 d.text(796,139,'EXTERNAL WINDOWS / MACAU STRIP',19,weight=700)
 d.raw('<g transform="translate(285 850) rotate(48)">');d.text(0,0,'MALL WALKWAY / SHOP FRONTAGE',17,'start',400,'#778176');d.raw('</g>')
 d.raw('<g transform="translate(1270 1180) rotate(-65)">');d.text(0,0,'MALL WALKWAY',17,'start',400,'#778176');d.raw('</g></g>')
 d.line('M1580 233V1515','#d4d8d0',1.5);sx=1640
 d.text(sx,281,'HOW TO READ THE PLAN',23,'start',700)
 d.line('M1640 325H1695',WALL,5);d.text(1720,332,'Proposed wall',20,'start',400)
 d.line('M1640 372H1695','#6c98a1',3);d.line('M1640 378H1695','#6c98a1',1);d.text(1720,382,'Existing glazing',20,'start',400)
 d.rect(1640,412,55,26,BG,'#bac4b8',1,0);d.text(1720,433,'White = circulation',20,'start',400)
 d.rect(1640,463,55,26,FILL[1],'none',0,0);d.text(1720,484,'Tinted = room / public zone',20,'start',400)
 d.line('M1640 517H1695','#6c98a1',3,'7 4');d.line('M1640 523H1695','#6c98a1',1,'7 4');d.text(1720,525,'Proposed glazing',20,'start',400)
 d.text(sx,566,'DESIGN INTENT',23,'start',700);d.text(sx,610,model['notes']['title'],23,'start',600)
 for i,line in enumerate(model['notes']['journeys']):d.text(sx,653+i*30,line,20,'start',400)
 d.text(sx,829,'WINDOWS + PRIVATE CARE',23,'start',700)
 details={
 'public':['Public discovery and café on the windows.','Four internal suites with private showers.','One shared entrance; discreet clinical branch.'],
 'club':['A shared living room along the windows.','Four internal suites with private showers.','Left public arrival; right patient arrival.'],
 'wings':['Public café and private suites share the view.','Two window suites and two internal suites.','Two arrivals connected through a hosted hall.'],
 'houses':['Two care houses around a public window room.','Two suites per house, each with a shower.','Local lounges and preparation; shared tests.']}
 d.text(sx,874,details[key],20,'start',400)
 d.text(sx,1020,'ACTIVE MALL CORNER',23,'start',700)
 d.text(sx,1064,model['frontage']['lines'],20,'start',400)
 d.text(sx,1190,'CLINICAL + SUPPORT',23,'start',700)
 d.text(sx,1230,['D1 DEXA / D2 balance / D3 VO₂ max.','T1 HBOT / T2 technical / C1 team / '+('local prep.' if key=='houses' else 'C2 prep.'),'E1 salon / E2 skin-data / B1-B5 support.','W1 accessible WC / W2 WC; retained escape.'],18,'start',400)
 d.text(sx,1330,'CIRCULATION + DRAWING STATUS',23,'start',700)
 d.text(sx,1374,['Main guest corridors: 2.4 m clear design target.','Widths and equipment fit require a survey.','Internal drainage routes remain unconfirmed.','Corner glazing and furniture are proposals.'],20,'start',400)
 d.line('M65 1625H2135','#b4c0b2',1.5);d.text(65,1670,'MACAU CLINIC · REPORTED AREA 1,100 m²',22,'start',700);d.text(2135,1670,title.upper(),22,'end',700)
 d.text(65,1710,'Source: supplied footprint. All floor area is assigned to rooms, public space or connected circulation.',20,'start',400)
 d.text(65,1740,'Concept drawing only: structure, drainage, fire strategy, equipment and measured dimensions remain for the appointed design team.',20,'start',400)
 d.raw('</svg>');s=''.join(d.a);E.fromstring(s);p=OUT/f'plan-{slug}.svg';p.write_text(s);manifest.append(dict(id=slug,file=p.name,sha256=hashlib.sha256(s.encode()).hexdigest()))
(OUT/'plan-manifest.json').write_text(json.dumps(dict(referenceGallerySha256=hashlib.sha256((OUT/'plan-gallery.svg').read_bytes()).hexdigest(),plans=manifest),indent=2)+'\n')
print('Published four Gallery-style SVGs; Gallery unchanged.')
