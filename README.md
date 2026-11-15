# Big Ben – strona statyczna

Strona szkoły Big Ben (bigben.edu.pl) zbudowana w [Eleventy](https://www.11ty.dev/). Wygląd odtwarza dotychczasową stronę na WordPressie; nie ma tu bazy danych, panelu logowania ani wtyczek.

## Uruchomienie na komputerze

Potrzebny jest Node.js 20 lub nowszy.

```
npm install
npm start        # podgląd pod adresem http://localhost:8080, odświeża się po zapisaniu pliku
npm run build    # gotowa strona trafia do folderu _site/
```

## Jak dodać wpis w aktualnościach

1. Utwórz plik `src/aktualnosci/RRRR-MM-DD-krotka-nazwa.md` (np. `2026-12-01-zimowe-warsztaty.md`).
   Wpis pojawi się pod adresem `/aktualnosci/krotka-nazwa/`.
2. Na górze pliku wpisz nagłówek, a pod nim treść w Markdownie:

```
---
title: "Zimowe warsztaty"
date: "2026-12-01"
zajawka: "Jedno–dwa zdania, które pokażą się na kafelku wpisu."
obraz: "2026/12/warsztaty.jpg"
obrazMaly: "2026/12/warsztaty-768x403.jpg"
---

Treść wpisu. **Pogrubienie**, [link](https://example.com), lista:

- punkt pierwszy
- punkt drugi

![Opis zdjęcia](/media/2026/12/zdjecie.jpg)
```

`obraz` i `obrazMaly` są opcjonalne. `obrazMaly` to mniejsza wersja na kafelek (ok. 768 px szerokości); gdy jej nie ma, używany jest `obraz`.

Sześć najnowszych wpisów pokazuje się automatycznie na stronie głównej.

## Zdjęcia (poza repozytorium)

Zdjęcia do wpisów i podstron nie leżą w repozytorium, tylko w osobnym folderze na serwerze. Jego adres ustawia się w jednym miejscu: `media` w pliku `src/_data/site.json`.

- W nagłówku wpisu podajesz ścieżkę względem tego folderu: `obraz: "2026/12/plik.jpg"`.
- W treści piszesz `/media/2026/12/plik.jpg` – przy budowaniu strona podmienia `/media` na właściwy adres.

Obecnie `media` wskazuje na dotychczasowy folder WordPressa (`https://bigben.edu.pl/wp-content/uploads`), więc wszystkie stare zdjęcia działają bez kopiowania. **Tego folderu nie wolno usunąć przy wyłączaniu WordPressa** – albo zostaje na miejscu, albo trzeba go przenieść i zmienić `media`.

W repozytorium (`src/img/`) są tylko elementy samego szablonu: logo, dwa banery, cztery kafle, znak Cambridge.

## Co gdzie jest

| Co chcesz zmienić | Plik |
| --- | --- |
| Telefon, adres, e-mail, menu, napis na przycisku „Zapisy’26”, numery formularzy ActiveNow | `src/_data/site.json` |
| Strona główna (banery, kafle, „Dlaczego BigBen?”) | `src/index.njk` |
| Opisy kursów | `src/kursy/*.md` |
| O nas, Podręczniki, Regulamin, RODO, Polityka Ochrony Małoletnich | `src/*.md` |
| Zapisy, Events, Plan lekcji (osadzone ActiveNow) | `src/zapisy.njk`, `src/events.njk`, `src/plan-lekcji.njk` |
| Kolory, czcionki, odstępy | `src/css/style.css` (zmienne na górze pliku) |
| Nagłówek, stopka, mapa | `src/_includes/base.njk` |
| Przekierowania starych adresów | `src/_data/przekierowania.json` |

Nowy rok zapisów: w `site.json` zmień `zapisyEtykieta` i ewentualnie `formularzZapisy`, a w `src/zapisy.njk` tytuł.

## Publikacja

Plik `.github/workflows/deploy.yml` buduje stronę i wysyła folder `_site/` przez FTPS na serwer po każdej zmianie w gałęzi `main`. W ustawieniach repozytorium trzeba dodać cztery sekrety: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_DIR`.

Na czas testów `FTP_DIR` powinien wskazywać katalog domeny testowej, a w `site.json` warto tymczasowo ustawić `url` na adres testowy.

Plik `.htaccess` jest generowany przy budowaniu (z `src/htaccess.njk`): wymusza HTTPS, ustawia nagłówki bezpieczeństwa i pamięć podręczną oraz przekierowuje stare adresy WordPressa na nowe (kod 301).

## Import z WordPressa

`tools/wordpress-export.json` to kopia wszystkich podstron i wpisów pobrana z WordPressa 15.11.2026 (także tych, których nie ma już na nowej stronie). Skrypt `tools/import-wordpress.mjs` zamienił ją na pliki Markdown; ponowne uruchomienie nadpisze ręczne poprawki, więc nie ma potrzeby go używać.
