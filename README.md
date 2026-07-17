# LOTS Security — redesignkoncept

En fristående och responsiv front-end som visar hur LOTS Securitys webbplats kan bli tydligare, modernare och mer kundorienterad utan att tappa nuvarande innehåll.

## Förhandsvisa

Öppna `index.html` direkt i en webbläsare eller starta en enkel lokal webbserver i mappen:

```bash
python3 -m http.server 8080
```

Besök sedan `http://localhost:8080`.

## Så är sidan uppbyggd

- Lösningsbaserad startsida för personlarm, vård och omsorg, ensamarbete, simhall samt butik och service.
- Snabbguide som hjälper besökaren från behov till rätt lösningsområde.
- Sökbar produktkatalog som läser aktuella produkter från LOTS befintliga WordPress-API.
- Nyhetsdel som automatiskt visar de senaste publicerade artiklarna.
- Tydliga kontaktvägar, kundexempel, uthyrning och företagsinformation.
- Responsiv meny och layout för mobil, surfplatta och dator.
- Tillgänglig grund med semantisk HTML, tangentbordsfokus och stöd för minskad rörelse.

## Filer

- `index.html` — innehåll och struktur.
- `styles.css` — design, responsivitet och animationer.
- `app.js` — meny, snabbguide, produktsökning och nyhetsflöde.

## Inför en riktig lansering

Konceptet använder den nuvarande webbplatsens publika bilder, produktdata och nyheter. Vid en skarp flytt bör WordPress fortsätta vara innehållskälla eller innehållet exporteras till det CMS som väljs. Kontaktformulär, kundinloggning, varukorg och återförsäljarfunktioner länkar tills vidare till befintliga LOTS-sidor och behöver kopplas till vald backend vid en fullständig ersättning.

Alla produkt- och företagsuppgifter bör slutgranskas av LOTS före publicering.
