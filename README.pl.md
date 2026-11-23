[English](README.md) | **Polski**

<a href="http://www.youtube.com/watch?v=amMd0X906ZA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.youtube.com/vi/amMd0X906ZA/maxresdefault.jpg" alt="Nieoficjalny klient Home Assistant dla telewizorów Samsung (Tizen OS)" width="100%" />
</a>

[Zobacz demo: nieoficjalny klient Home Assistant dla telewizorów Samsung (Tizen OS)](http://www.youtube.com/watch?v=amMd0X906ZA)

# Home – klient Home Assistant dla telewizorów Samsung (Tizen)

Natywna aplikacja webowa Tizen (czysty HTML/CSS/JS, bez frameworka) w stylu Apple Home.
Łączy się z Home Assistantem przez WebSocket i **odtwarza dashboard Home Assistanta**:
widoki stają się zakładkami, a sekcje i karty – grupami kafelków.

## 1. Konfiguracja (jeden plik)

Edytuj `src/js/config.js`:

- `url`: adres Twojego Home Assistanta, np. `http://192.168.0.14:8123`
- `token`: token długoterminowy (profil HA -> Zabezpieczenia -> Tokeny długoterminowe).
  Nigdy go nie udostępniaj; jest przechowywany wewnątrz aplikacji na telewizorze.
- `dashboard`: awaryjny url_path dashboardu (domyślnie `"samsung-tv"`; `null` = dashboard domyślny), używany tylko
  wtedy, gdy w profilu HA użytkownika tokenu nie wskazano dashboardu. Aplikacja czyta dashboard przypisany
  użytkownikowi w profilu HA (`frontend/get_user_data`, klucz `core`, pole `default_panel`). Na prawdziwym TV wybór
  dashboardu jest ukryty i zawsze używany jest dashboard z profilu. W emulatorze (wykrywanym po modelu produktu /
  systeminfo) i w przeglądarce na komputerze wybór jest dostępny (zębatka -> Dashboard), a zapisany wybór ma
  pierwszeństwo przed profilem.
- `allowDashboardChange`: domyślnie `false`; ustaw `true`, żeby wybór dashboardu był dostępny także na prawdziwym TV.
- `columns`, `tapOpensDetails`, `longPressMs`: opcjonalne dostrajanie.
- `notificationsIgnore`, `notificationSound`: opcje powiadomień (patrz „Powiadomienia” niżej).

Wskazówka: utwórz w HA osobnego użytkownika dla TV i wygeneruj token dla tego użytkownika.

## 2. Budowanie i instalacja

Otwórz folder `src` w VS Code (zaufaj obszarowi roboczemu), a potem w rozszerzeniu Tizen TV:
Certificate Manager (certyfikat Samsung z DUID telewizora) -> Build Signed Package ->
Launch Application (TV w trybie developera, IP ustawione w ustawieniach rozszerzenia).

## 3. Pilot

| Przycisk | Działanie |
|---|---|
| Strzałki | przesuwają fokus (zakładki <-> kafelki; suwaki: lewo/prawo zmienia wartość) |
| OK | światła/przełączniki/wentylatory/rolety: przełącza; sceny/skrypty/przyciski: uruchamia; reszta: szczegóły |
| Przytrzymanie OK (lub Info) | szczegóły z suwakami (jasność, temperatura barwy, temperatura docelowa, pozycja, głośność) |
| Return | zamyka szczegóły -> przewija na górę -> wychodzi z aplikacji |
| W górę (na pasku zakładek) | skok do ikony zębatki; w lewo wraca do zakładek |

Zamki, klimatyzacja, odtwarzacze, kamery i czujniki zawsze otwierają szczegóły po OK
(żeby nie odblokować niczego przypadkiem).

## 4. Co jest odtwarzane z dashboardu

Widoki: `visible` jest respektowane tak jak we froncie HA (ukryte dla wszystkich lub tylko dla wymienionych
użytkowników – użytkownik tokenu jest odczytywany przez `auth/current_user`); podwidoki są ukryte.
Warunki `visibility` na poziomie kart nie są jeszcze oceniane.

Obsługiwane: `tile`, `button`, `entity`, `sensor`, `light`, `thermostat`, `media-control`,
`weather-forecast`, `picture-entity`, `entities`, `glance`, `picture-glance` (encje),
`grid`, `horizontal-stack`, `vertical-stack`, `heading`, `conditional` (zawsze pokazywana),
widoki sections i masonry.

Pomijane: karty `custom:*`, markdown, wykresy, mapy, iframe, `area` itd.
Lista pominiętych kart jest na ekranie diagnostyki (zębatka, prawy górny róg).
Jeśli dashboardu nie da się odczytać, encje są grupowane według typu.
Gdy zapiszesz dashboard w edytorze HA, TV przeładowuje go automatycznie.

## 5. Ustawienia i wybór dashboardu

Ikona zębatki (prawy górny róg; z paska zakładek naciśnij w górę) -> **Ustawienia**:

- **Dashboard**: lista dashboardów dostępnych dla użytkownika tokenu (jak w pasku bocznym HA),
  z zaznaczonym bieżącym. Wybór zapisuje się w aplikacji i od razu przeładowuje widok.
- **Styl wizualny**: Cupertino (domyślny) lub Simple Glass (szklany, wypukły wygląd; te same kolory).
- **Język**: Automatycznie, Polski lub English (patrz „Język” niżej).
- **Diagnostyka**, **Odśwież dashboard**, **Zamknij**.

Wybór jest zapisywany w pamięci webowej aplikacji i przetrwa restarty. Ponowna instalacja aplikacji
może go wyczyścić. Dashboardy generowane automatycznie przez HA (strategie bez widoków) nie dają się
odtworzyć; aplikacja informuje o tym i pokazuje encje pogrupowane według typu.

## 6. Diagnostyka

Zębatka (prawy górny róg; z paska zakładek naciśnij w górę) -> Diagnostyka pokazuje wersję silnika webowego (Chromium),
wersję Tizen, rozmiar ekranu, wersję HA, połączenie, pominięte karty i licznik klatek. Użyj jej w emulatorze i na TV.
Lista przewija się strzałkami góra/dół (przyciski pod nią zawsze zostają na ekranie).

## 7. Dashboardy wbudowane (generowane w aplikacji)

W oknie wyboru dashboardu (zębatka -> Dashboard) oprócz dashboardów z HA są dwa wpisy generowane przez aplikację
z rejestrów obszarów, urządzeń i encji (`config/area_registry/list`, `config/device_registry/list`,
`config/entity_registry/list`, a gdy odmówi – `list_for_display`):

- **Home Assistant – Przegląd (generowany)**: odtworzenie wbudowanego Przeglądu HA: Podsumowania (Światła, Klimat,
  Bezpieczeństwo, Odtwarzacze, Konserwacja, Pogoda) i Obszary. Kafelki podsumowań i obszarów otwierają podwidoki
  (Cofnij wraca). Przegląd w HA jest generowany dynamicznie przez frontend i nie da się go odczytać przez
  `lovelace/config`, więc jest tu odtworzony – wygląda podobnie, ale nie jest identyczny.
- **Apple Home (pokoje)**: zakładka „Dom” (podsumowania, sceny) + jedna zakładka na pokój.

Układ awaryjny (gdy wybrany dashboard się nie wczyta lub jest pusty) to układ Apple Home według obszarów;
jeśli rejestry są niedostępne dla użytkownika tokenu, jest to grupowanie według typów encji w jednym widoku „Dom”.

Niezweryfikowane na prawdziwym HA: dostępność komend rejestrów dla użytkownika nie-administratora oraz dokładna
zgodność podsumowań z Przeglądem HA. W diagnostyce pole „Źródło układu” pokazuje, co faktycznie zadziałało.

## 8. Własny dashboard w stylu Przeglądu (`dashboard/`)

`dashboard/przeglad-apple.yaml` to gotowy układ do wklejenia w surowym edytorze dashboardu HA (zamień `/dashboard-dom/`
na swój URL i encje `zmien_…` na własne). Aplikacja obsługuje kafelki z `tap_action: navigate` oraz widoki
`subview: true` (kafelek otwiera podwidok, Cofnij wraca; przytrzymanie OK na kafelku z encją otwiera jej szczegóły).
`dashboard/pomocnicze-encje.yaml` zawiera przykładowe encje pomocnicze (czujnik „Bezpieczeństwo”, średnia temperatura).

## 9. Styl wizualny

W ustawieniach (ikona zębatki) wiersz **Styl wizualny** przełącza **Cupertino** (domyślny) i **Simple Glass**
(szklany efekt wypukłości, te same kolory). Wybór jest zapamiętywany i działa na TV oraz w emulatorze.

## 10. Język

W ustawieniach wiersz **Język** wybiera język aplikacji: **Automatycznie** (domyślnie; polski, gdy język TV /
przeglądarki to polski, w przeciwnym razie angielski), **Polski** lub **English**. Zmiana działa od razu i jest
zapamiętywana. Tłumaczone są napisy aplikacji (stany, ustawienia, diagnostyka, powiadomienia, wygenerowane
dashboardy); nazwy z Home Assistanta (encje, obszary, dashboardy) zostają bez zmian. Wszystkie teksty są w
`src/js/i18n.js`; żeby dodać kolejny język, dopisz nowy słownik obok `PL` i `EN`.

## 11. Powiadomienia

Dzwonek w górnym pasku (obok zębatki) pokazuje powiadomienia trwałe z HA (`persistent_notification`),
tylko do odczytu: OK otwiera listę, OK na pozycji rozwija / zwija treść, Cofnij zamyka. Czerwona kropka z licznikiem
pojawia się i znika z animacją, a nowe powiadomienie porusza dzwonkiem i odtwarza dźwięk
(`src/sound/notify.wav`, można wyłączyć: `notificationSound: false` w `js/config.js`).

Domyślnie lista jest tylko do odczytu. Po ustawieniu `notificationsDismiss: true` w `js/config.js` każde powiadomienie
ma przycisk × (strzałka w prawo przechodzi na niego, OK pyta o potwierdzenie), a pod listą jest przycisk **Odrzuć wszystkie**
(też z potwierdzeniem). Lista przewija się razem z fokusem (góra / dół), a przyciski pod nią zawsze zostają na ekranie.
Odrzucenie usuwa powiadomienie także w Home Assistant, więc użytkownik tokenu musi mieć prawo do usługi
`persistent_notification.dismiss`; ukryte powiadomienia (`notificationsIgnore`) nigdy nie są odrzucane.

Powiadomienia ukrywa się listą `notificationsIgnore` w `js/config.js`: `"id"`, `"prefiks*"` lub
`"title:fragment tytułu"`. W diagnostyce widać stan połączenia z powiadomieniami oraz ID ukrytych.
Jeśli subskrypcja nie działa dla użytkownika tokenu, aplikacja czyta listę co 30 s, a gdy i to się nie uda,
dzwonek jest ukryty.

## Przetestowane na prawdziwym TV

Przetestowane na Samsungu S95B (Tizen 6.5) z prawdziwym Home Assistantem: wczytywanie i automatyczne przeładowanie
dashboardu, klawisze pilota (Return, Info / przytrzymanie OK), animacje i przejścia między widokami, styl Simple Glass,
wybór dashboardu (`allowDashboardChange`), powiadomienia (lista, dźwięk) i ich odrzucanie (`notificationsDismiss`) oraz
dashboardy generowane w aplikacji dla użytkownika tokenu bez uprawnień administratora.

Jeszcze niezweryfikowane:

- Kolory i efekty światła na prawdziwym urządzeniu z efektami (np. Twinkly); testowane tylko na serwerze testowym (mocku).
