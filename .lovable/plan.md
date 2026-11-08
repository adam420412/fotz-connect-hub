# Codzienna praca handlowców w CRM

## Zakres i bezpieczeństwo
- Dodać „Mój dzień”, dni robocze, miasta, rolę Handlowiec, tereny i preferencję e-maila.
- Zachować istniejące dane i polityki admina i managera. Bez porządkowania rekordów, przenoszenia terminów istniejących rekordów ani przypisywania ich wstecz.
- Nie odczytywać ani zmieniać sekretów. Nie uruchamiać bootstrapów kont, nie wysyłać produkcyjnych testowych leadów, replay, maili ani powiadomień. Nie publikować frontendu automatycznie.
- Wdrożyć tylko zmieniony `crm-webhook`, po testach offline. Zachować uwierzytelnianie, CORS, verify_jwt, wyłączony legacy i dotychczasowe odpowiedzi.

## 1. Dni robocze i terminy
- Wspólne obliczenia dla Europe/Warsaw: poniedziałek-piątek, wszystkie wskazane święta, Wielkanoc i święta ruchome; godziny kontaktu 9:00-17:00.
- W formularzach leadów i deali dodać cztery szybkie przyciski. Nowo wybrana data wolna przesuwa się do najbliższego dnia roboczego z krótkim komunikatem. Samo otwarcie istniejącego rekordu nie zmienia daty.
- Założenie: „Za tydzień” oznacza 7 dni kalendarzowych od dziś, następnie przesunięcie do dnia roboczego; „Jutro (roboczy)” oznacza następny dzień roboczy.
- Liczniki i NextStepBadge liczą „dziś” według Warszawy, niezależnie od strefy urządzenia.
- W miejscach tego repozytorium obiecujących kontakt stosować dokładnie „Odezwiemy się w dni robocze, 9:00 do 17:00”. Osobna strona publiczna FOTZ nie jest częścią tego projektu, jej tekstów nie da się tu zmienić.
- Nowe i zmieniane teksty interfejsu bez znaków pauzy i półpauzy.

## 2. „Mój dzień”
- Nowa trasa `/moj-dzien`, pierwsza w menu admina, managera i handlowca. Domyślne wejście po logowaniu dla admina i sales.
- Sekcje w podanej kolejności: Nowe leady do telefonu, Zaległe, Na dziś, Oferty do follow-upu, Najbliższe 5 dni roboczych, Bez następnego kroku.
- Uwzględnić leady i deale w sekcjach terminowych, z czytelnym oznaczeniem rodzaju rekordu. Nowe i Bez następnego kroku dotyczą leadów. Oferty obejmują leady `status=proposal` i deale `stage=proposal`. Zakończone rekordy nie trafiają do aktywnych kolejek.
- Założenie: rekord może wystąpić w kilku pasujących sekcjach; liczniki nie dublują tego samego rekordu. Najbliższe 5 dni roboczych liczone od następnego dnia roboczego, bez sekcji Na dziś.
- Wiersze z firmą, miastem, źródłem, telefonem, następnym krokiem, datą i trzema żądanymi akcjami; układ dopasowany do telefonu.
- Filtry opiekuna dla admina/managera, domyślnie Moje. Admin w Moje widzi też nieprzypisane leady. Handlowiec widzi wyłącznie swoje rekordy. Filtr miasta dla wszystkich.
- Okno „Zapisz kontakt” z rodzajem, wynikiem, notatką i wymaganym wyborem daty dla spotkania/oddzwonienia. Historia i zmiana następnego kroku zapisywane razem, bez ryzyka zapisu tylko jednej połowy operacji.
- Wyniki kontaktu dokładnie według briefu, w tym `proposal` jako dodatkowy status leada, bez przekształcania istniejących statusów.
- Zamykany panel „Jak pracować z CRM”, zapamiętany osobno dla użytkownika. Poza godzinami pracy widoczna informacja o godzinach kontaktu; zapis wcześniejszej rozmowy pozostaje możliwy.

## 3. Handlowcy, miasta i zaproszenia
- `leads.city`, `profiles.notification_email` oraz miasta w zaproszeniu jako nowe nullable kolumny. Nowa tabela `sales_territories(user_id, city)` z jawnymi uprawnieniami i RLS.
- Sales ma odczyt, dodawanie i edycję wyłącznie swoich leadów/deali, historię tylko własnych leadów, bez usuwania i bez możliwości przekazania sobie cudzego rekordu.
- Sales nie staje się ogólnym członkiem zespołu. Osobna lista dozwolonych tras i menu: Mój dzień, CRM, Ustawienia. Ukryć także linki do Growth OS, akcje usuwania i niedostępne funkcje w CRM oraz wyszukiwarce globalnej.
- Zweryfikować istniejące polityki pozwalające każdemu zalogowanemu na dostęp do innych modułów i dodać ograniczenia dla sales tam, gdzie potrzebne, bez usuwania dostępu admina/managera.
- Miasto edytowalne w formularzu i tabeli leadów. Admin przypisuje pojedyncze i wiele zaznaczonych leadów do opiekuna.
- Zaproszenie Handlowca z jednym lub wieloma miastami; istniejący mechanizm jednorazowego, ważnego zaproszenia nadal obowiązuje. Rejestracja przekazuje rolę i teren z zaufanego zaproszenia, nie z dowolnych danych użytkownika.
- Admin może później zmienić rolę i miasta użytkownika. Żadnych takich zmian istniejących kont podczas wdrożenia.
- Ustawienia zapisują prawdziwy e-mail do powiadomień, pusty oznacza e-mail logowania; połączenie własnego Google Calendar pozostaje widoczne, bez wywoływania połączenia podczas testów.
- Założenie przypisania: porównanie miast bez rozróżniania wielkości liter i zbędnych spacji. Przy braku dopasowania pozostaje nieprzypisany; przy kilku pasujących handlowcach również pozostaje nieprzypisany, zamiast arbitralnego wyboru.

## 4. Produkcyjny webhook
- Zachować cztery obecne formularze Meta i dodać `1103341015857330: meta:lead-form:www-sms-2026-11`.
- Odczytać `city`, `miasto`, `miejscowosc` z obsługiwanych struktur danych, również pól dodatkowych.
- Nowy lead bez terminu otrzymuje „Zadzwonić” i warszawskie dziś lub najbliższy dzień roboczy. Jeśli nadejdzie jawny termin, zachować jego intencję z korektą dnia wolnego.
- Przypisywać nowe leady po terenie na stronie serwera. Nie przepisywać właściciela istniejącego leada przy deduplikacji i nie resetować jego następnego kroku.
- Dodać `assigned_to_email` do odpowiedzi sukcesu, również dla powtórzonego zdarzenia: e-mail powiadomień opiekuna, w razie pustej wartości e-mail logowania, bez opiekuna null. Nie wysyłać e-maila z funkcji.

## Szczegóły techniczne i migracje
1. Osobna migracja wyłącznie dodająca `sales` do `app_role`.
2. Następna migracja: nullable kolumny, tabela terenów, indeksy, jawne GRANT, dodatkowe polityki RLS, bez usuwania obecnych polityk admina/managera.
3. Obsługa zaproszeń, przypisania przy tworzeniu leada oraz atomowego zapisu wyniku kontaktu przez zaufane funkcje/wyzwalacze w `public`. Funkcje sprawdzają użytkownika, rolę, własność i dane wejściowe. Nie zmieniać istniejących rekordów podczas migracji.
- Obliczenia dni roboczych dla przeglądarki i funkcji Cloud korzystają z jednej implementacji kompatybilnej z wdrażaniem funkcji, z publicznym helperem `src/lib/workingDays.ts`.
- Oddzielne klucze pamięci zapytań dla użytkowników i czyszczenie po zmianie sesji, aby dane admina nie pozostawały widoczne po logowaniu handlowca.
- Nie uruchamiać ponownie migracji CRM Growth ani zmieniać aliasu Preloadera.

## Weryfikacja bez produkcyjnych zgłoszeń
- Dodać i uruchomić testy konkretnych reguł: wszystkie święta, Wielkanoc/Boże Ciało, weekendy, przejście miesiąca/roku, Warszawa, 9.11 i 11.11.2026, szybkie terminy i wyniki kontaktów.
- Testy offline z atrapami danych i zablokowaną siecią dla webhooka: wszystkie pięć formularzy Meta, trzy nazwy pola miasta, brak/pojedynczy/wieloznaczny teren, e-mail z fallbackiem, deduplikacja i niezmienione zasady autoryzacji.
- Uprawnienia i zapis kontaktu sprawdzić na izolowanych danych testowych lub w wycofywanych transakcjach, bez tworzenia produkcyjnych kont i zgłoszeń. Prawdziwe odczyty admina w panelu można sprawdzić bez zmian danych.
- Sprawdzić „Mój dzień” i okna na komputerze oraz telefonie, logi kompilacji i potwierdzenie wdrożenia wyłącznie crm-webhook. Oddzielić testy offline od potwierdzenia zachowania na produkcji.
- Na koniec podać listę migracji, wynik wdrożenia oraz krótką instrukcję testowania; zaznaczyć wszystko, czego nie udało się zweryfikować.