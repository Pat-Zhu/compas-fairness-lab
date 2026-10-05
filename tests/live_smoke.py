"""Exercise the public REST interface in an isolated classroom; close it afterward.
No student names, real class responses, or existing classrooms are used.
"""
import json
import pathlib
import re
import secrets
import urllib.request
import urllib.error

cfg = pathlib.Path('config.js').read_text()
URL = re.search(r'url\s*:\s*[\"\']([^\"\']+)', cfg).group(1)
KEY = re.search(r'anonKey\s*:\s*[\"\']([^\"\']+)', cfg).group(1)

def rpc(name, body):
    request = urllib.request.Request(
        URL + '/rest/v1/rpc/' + name,
        data=json.dumps(body).encode(),
        headers={'apikey': KEY, 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read().decode()
            return json.loads(data) if data else None
    except urllib.error.HTTPError as error:
        data = json.loads(error.read().decode())
        raise RuntimeError(data.get('message', 'Request rejected')) from None

def rejected(name, body):
    try:
        rpc(name, body)
    except RuntimeError:
        return
    raise AssertionError('Unauthorized or invalid request accepted: ' + name)

room = rpc('lab_create', {})
host = {'p_session': room['id'], 'p_host': room['host']}
t1, t2 = secrets.token_hex(32), secrets.token_hex(32)
s1 = {'p_join': room['join'], 'p_token': t1}
s2 = {'p_join': room['join'], 'p_token': t2}

def control(action, value=None):
    return rpc('lab_control', {**host, 'p_action': action, 'p_value': value})

try:
    assert rpc('lab_snapshot', host)['participants'] == 0
    rpc('lab_join', s1)
    rpc('lab_join', s2)
    rpc('lab_join', s1)
    assert rpc('lab_snapshot', host)['participants'] == 2
    rejected('lab_control', {'p_session': room['id'], 'p_host': t1, 'p_action': 'stage', 'p_value': 10})

    control('stage', 10)
    snapshot = rpc('lab_snapshot', s1)
    assert snapshot['stage'] == 10 and not snapshot['voting_open']
    rejected('lab_submit', {**s1, 'p_stage': 10, 'p_context': 'detention', 'p_answer': 'judge'})
    control('stage', 1)
    rejected('lab_control', {**host, 'p_action': 'reading', 'p_value': True})
    rpc('lab_submit', {**s1, 'p_stage': 1, 'p_context': 'detention', 'p_answer': 'algorithm'})
    rpc('lab_submit', {**s2, 'p_stage': 1, 'p_context': 'detention', 'p_answer': 'judge'})
    assert rpc('lab_snapshot', s1)['aggregates'] == {}
    snapshot = rpc('lab_snapshot', host)
    assert snapshot['response_count'] == 2
    assert snapshot['aggregates']['initial'] == {'algorithm': 1, 'judge': 1}
    control('reveal')
    rejected('lab_submit', {**s1, 'p_stage': 1, 'p_context': 'detention', 'p_answer': 'judge'})

    control('stage', 2)
    assert not rpc('lab_snapshot', s1)['reading_visible']
    control('reading', True)
    snapshot = rpc('lab_snapshot', s1)
    assert snapshot['reading_visible'] and snapshot['voting_open'] and not snapshot['results_visible']
    rejected('lab_control', {'p_session': room['id'], 'p_host': t1, 'p_action': 'reading', 'p_value': False})
    control('reading', False)
    assert not rpc('lab_snapshot', s1)['reading_visible']
    control('reading', True)
    control('stage', 4)
    assert not rpc('lab_snapshot', s1)['reading_visible']
    control('reading', True)

    control('stage', 5)
    rpc('lab_submit', {**s1, 'p_stage': 5, 'p_context': 'detention', 'p_answer': 8})
    control('reading', True)
    control('context', 'support')
    assert not rpc('lab_snapshot', s1)['reading_visible']
    rejected('lab_submit', {**s1, 'p_stage': 5, 'p_context': 'detention', 'p_answer': 4})
    rpc('lab_submit', {**s1, 'p_stage': 5, 'p_context': 'support', 'p_answer': 3})
    aggregate = rpc('lab_snapshot', host)['aggregates']
    assert aggregate['threshold_detention'] == {'8': 1}
    assert aggregate['threshold_support'] == {'3': 1}
    control('stage', 7)
    control('reading', True)
    assert rpc('lab_snapshot', s1)['reading_visible']
    for stage in (3, 6, 8, 9):
        control('stage', stage)
        rejected('lab_control', {**host, 'p_action': 'reading', 'p_value': True})
    print('PASS: briefing, host-only source reveals, no opinion answers, independent vote/results state, submitted totals, closed voting, two threshold scenarios.')
finally:
    control('end')
print('PASS: isolated classroom closed; existing class records unchanged.')
