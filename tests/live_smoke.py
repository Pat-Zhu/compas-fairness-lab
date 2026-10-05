"""Live Supabase REST smoke test. Creates and closes an isolated test classroom.
No names, private keys, student records, or real class answers are used.
"""
import json,pathlib,re,secrets,urllib.request,urllib.error
cfg=pathlib.Path('config.js').read_text()
URL=re.search(r'url\s*:\s*[\"\']([^\"\']+)',cfg).group(1)
KEY=re.search(r'anonKey\s*:\s*[\"\']([^\"\']+)',cfg).group(1)
def rpc(name,body):
 req=urllib.request.Request(URL+'/rest/v1/rpc/'+name,data=json.dumps(body).encode(),headers={'apikey':KEY,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=30) as response:
   data=response.read().decode();return json.loads(data) if data else None
 except urllib.error.HTTPError as e:
  data=json.loads(e.read().decode());raise RuntimeError(data.get('message','Request rejected')) from None

def rejected(name,body):
 try:rpc(name,body)
 except RuntimeError:return
 raise AssertionError('Unauthorized or invalid request was accepted: '+name)

c=rpc('lab_create',{});h={'p_session':c['id'],'p_host':c['host']};t1=secrets.token_hex(32);t2=secrets.token_hex(32)
s1={'p_join':c['join'],'p_token':t1};s2={'p_join':c['join'],'p_token':t2}
try:
 assert rpc('lab_snapshot',h)['participants']==0
 rpc('lab_join',s1);rpc('lab_join',s2);rpc('lab_join',s1)
 assert rpc('lab_snapshot',h)['participants']==2
 rejected('lab_control',{'p_session':c['id'],'p_host':t1,'p_action':'stage','p_value':1})
 rpc('lab_control',{**h,'p_action':'stage','p_value':1})
 rpc('lab_submit',{**s1,'p_stage':1,'p_context':'detention','p_answer':'algorithm'})
 rpc('lab_submit',{**s2,'p_stage':1,'p_context':'detention','p_answer':'judge'})
 assert rpc('lab_snapshot',s1)['aggregates']=={}
 snap=rpc('lab_snapshot',h);assert snap['response_count']==2 and snap['aggregates']['initial']=={'algorithm':1,'judge':1}
 rpc('lab_control',{**h,'p_action':'reveal'})
 rejected('lab_submit',{**s1,'p_stage':1,'p_context':'detention','p_answer':'judge'})
 assert rpc('lab_snapshot',s1)['results_visible']
 rpc('lab_control',{**h,'p_action':'stage','p_value':5})
 rpc('lab_submit',{**s1,'p_stage':5,'p_context':'detention','p_answer':8})
 rpc('lab_control',{**h,'p_action':'context','p_value':'support'})
 rpc('lab_submit',{**s1,'p_stage':5,'p_context':'support','p_answer':3})
 a=rpc('lab_snapshot',h)['aggregates'];assert a['threshold_detention']=={'8':1} and a['threshold_support']=={'3':1}
 print('PASS: live REST auth, join deduplication, host stage control, hidden results, vote totals, closed voting, two threshold rounds.')
finally:
 rpc('lab_control',{**h,'p_action':'end'})
print('PASS: isolated smoke-test room closed. No real classroom data modified.')
