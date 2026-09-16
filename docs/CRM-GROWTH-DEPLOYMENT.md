# Wdrożenie Growth OS — 16.09.2026

PR pozostaje draftem. Sekret CRM_WEBHOOK_SECRET istnieje w panelu; wartości nie odczytywano. Zapis leada z WWW nie został jeszcze sprawdzony w produkcji.

## Osobne etapy

1. `20260907120000_fotz_growth_os.sql`: cztery tabele integracji z RLS, kolumny źródeł/UTM, normalizacja e-maili i telefonów oraz uzupełnienie istniejących kontaktów. Zachowuje rekordy i notatki, ale zmienia format kontaktu i dane źródłowe. Dostęp do leads/deals/contact_history/bookings zostaje ograniczony do admin/manager. Usuwany jest publiczny zapis do leads i bookings. Dotychczasowy webhook używający service role nadal może zapisywać. Zweryfikować wszystkie rzeczywiste źródła zapisujące do bazy przed przełączeniem.
2. `crm-webhook`: nowe uwierzytelnienie wspólnym sekretem wdrożyć wraz ze stroną wysyłającą kontakt przez własny serwer. Stary klient wysyłający bez sekretu nie będzie akceptowany przez nową funkcję. Przygotowanie samego schematu nie włącza nowego webhooka.
3. `20260907123000_auth_storage_hardening.sql` zmienia zaproszenia, tworzenie kont i uprawnienia plików. Wdrożyć z odpowiadającymi zmianami interfejsu dopiero po odbiorze administratora, zaproszenia i plików. Nie traktować jako części przygotowania samego CRM.

## Stan odczytany przed migracją

Brak czterech nowych tabel. Istnieje 62 leadów, 9 deali i 0 rezerwacji. Role: admin 1, manager 1, employee 1, client 2. Funkcje has_role, is_team_member i update_updated_at_column istnieją. Backup w panelu: 16.09.2026 03:07:35 UTC; odtworzenie nie było testowane. To odczyt agregatów, bez pobierania treści rekordów klientów.

## Testy lokalne

`python3 scripts/verify-growth-migration.py` wymaga PostgreSQL 16 (`initdb`, `pg_ctl`, `psql`) w PATH. Tworzy jednorazową bazę przez prywatny socket Unix, bez nasłuchu TCP. Używa rzeczywistych początkowych migracji CRM/roles, syntetycznej funkcji auth.uid i danych testowych. Nie łączy się z produkcją.

Przeszło 9 kontroli: uzupełnienie/normalizacja kontaktów, zachowanie notatek i rezerwacji, RLS nowych tabel, odczyt admin/manager i odmowa employee/client, odmowa anon, zapis przez service role bez e-maila, unikalność zdarzeń, data wygrania deala i inicjalizacja źródeł bez aktywacji kampanii/budżetu. To nie zastępuje testu logowania w prawdziwym Supabase.

## Odbiór produkcyjny

Próba pełnej migracji zakończona rollbackiem, porównanie liczby dotychczasowych rekordów i ról, następnie zapis po poprawnym wyniku. Sprawdzić RLS, dostęp obecnego administratora, rzeczywisty webhook, idempotencję i next_step. Nowe kampanie mają status planned i budżet 0. Nie uruchamiać reklam na podstawie samego zielonego builda.
