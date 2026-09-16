"""Run Growth OS migration against a disposable, synthetic PostgreSQL fixture."""
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / 'supabase/migrations'
work = Path(tempfile.mkdtemp(prefix='fotz-growth-check-'))
started = False
checks = []

def run(args):
    result = subprocess.run(args, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return result.stdout.strip()

def query(sql):
    return run(['psql','-h',str(work),'-p','55445','-d','postgres','-v','ON_ERROR_STOP=1','-qAt','-c',sql])

def uid(number):
    return f'00000000-0000-0000-0000-{number:012d}'

def as_user(number, sql):
    return query(f"BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='{uid(number)}'; {sql}; ROLLBACK;")

try:
    run(['initdb','-D',str(work/'data'),'--no-locale','-E','UTF8','--auth-local=trust','--auth-host=reject','--wal-segsize=1'])
    run(['pg_ctl','-D',str(work/'data'),'-l',str(work/'log'),'-w','start','-o',f"-c listen_addresses='' -c unix_socket_directories='{work}' -p 55445"])
    started = True
    query("""CREATE EXTENSION pgcrypto;
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
    CREATE TABLE public.team_members(id uuid PRIMARY KEY);""")
    auth_source = (MIGRATIONS/'20251215115635_d6384a79-f78b-4220-a26e-bc6160ed2d9f.sql').read_text()
    query(auth_source.split('-- Trigger function to create profile on signup')[0])
    query((MIGRATIONS/'20251215112945_ca759aad-9777-427c-a882-5d9060cc90ef.sql').read_text())
    query((MIGRATIONS/'20260104140222_451fce76-78c6-4611-988a-094b3f458e3b.sql').read_text())
    for number, role in enumerate(['admin','manager','employee','client'], 1):
        query(f"INSERT INTO auth.users VALUES('{uid(number)}'); INSERT INTO profiles(id,email) VALUES('{uid(number)}','{role}@example.invalid'); INSERT INTO user_roles(user_id,role) VALUES('{uid(number)}','{role}');")
    query("""INSERT INTO leads(name,email,phone,source,notes) VALUES('Fixture',' TEST@EXAMPLE.INVALID ',' +48 123 456 789 ','linkedin','preserve-me');
    INSERT INTO deals(title,stage) VALUES('Fixture deal','won');
    INSERT INTO bookings(client_name,client_email,booking_date,booking_time) VALUES('Fixture','test@example.invalid','2026-09-18','10:00');""")
    query((MIGRATIONS/'20260907120000_fotz_growth_os.sql').read_text())
    assert query("SELECT email||':'||email_normalized||':'||phone_normalized||':'||source_channel FROM leads") == 'test@example.invalid:test@example.invalid:48123456789:linkedin_kanbox'
    checks.append('existing lead identity and channel backfilled')
    assert query("SELECT count(*)||':'||min(notes) FROM leads") == '1:preserve-me'
    assert query("SELECT count(*) FROM bookings") == '1'
    checks.append('existing lead notes and booking retained')
    assert query("SELECT count(*) FROM pg_class WHERE relname IN ('growth_campaigns','integration_sources','integration_events','lead_touchpoints') AND relrowsecurity") == '4'
    checks.append('all four integration tables have RLS')
    query('GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role; GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA public TO anon,authenticated,service_role')
    for number, expected in [(1,'1'),(2,'1'),(3,'0'),(4,'0')]:
        assert as_user(number, 'SELECT count(*) FROM leads') == expected
    checks.append('CRM readable by manager/admin; hidden from employee/client')
    assert query('BEGIN; SET LOCAL ROLE anon; SELECT count(*) FROM leads; ROLLBACK;') == '0'
    try:
        query("BEGIN; SET LOCAL ROLE anon; INSERT INTO leads(name,email) VALUES('Anonymous','anon@example.invalid'); COMMIT;")
        raise AssertionError('anonymous write accepted')
    except RuntimeError as error:
        assert 'row-level security' in str(error)
    checks.append('anonymous CRM reads and writes blocked')
    query("SET ROLE service_role; INSERT INTO leads(name,source_channel) VALUES('No email','linkedin_kanbox')")
    assert query("SELECT email IS NULL FROM leads WHERE name='No email'") == 't'
    checks.append('server intake supports contacts without email')
    query("INSERT INTO integration_events(provider,channel,event_type,idempotency_key) VALUES('fixture','website','lead.captured','test-unique')")
    try:
        query("INSERT INTO integration_events(provider,channel,event_type,idempotency_key) VALUES('fixture','website','lead.captured','test-unique')")
        raise AssertionError('duplicate accepted')
    except RuntimeError as error:
        assert 'duplicate key' in str(error)
    checks.append('duplicate integration event blocked')
    assert query("SELECT won_at IS NOT NULL FROM deals") == 't'
    query("UPDATE deals SET stage='lost'")
    assert query("SELECT won_at IS NULL FROM deals") == 't'
    checks.append('deal win timestamp follows stage')
    assert query('SELECT count(*) FROM integration_sources') == '7'
    assert query("SELECT status||':'||budget FROM growth_campaigns WHERE code='FOTZ-GROWTH-2026-Q4'") == 'planned:0'
    checks.append('integration setup seeded without activating campaign or budget')
    print(json.dumps({'passed':len(checks),'checks':checks,'production_database_touched':False},indent=2))
finally:
    if started:
        run(['pg_ctl','-D',str(work/'data'),'-m','fast','-w','stop'])
    shutil.rmtree(work)
