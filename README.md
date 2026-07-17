# LOTS Security – egen webbplats utan WordPress

Den här leveransen är en egen lättviktig PHP-webbplats. Den använder inte WordPress, någon sidbyggare eller en databas för innehållet.

## Tekniska krav

- Apache med `mod_rewrite`
- PHP 8.1 eller senare
- PHP-funktionen `mail()` aktiverad för kontaktformulären

## Publicera

1. Ta en fullständig backup av nuvarande webbrot.
2. Behåll katalogen `/wp-content/uploads/`. Den används endast som statiskt arkiv för befintliga bilder och dokument; övriga delar av WordPress behövs inte.
3. Töm webbrooten utom `/wp-content/uploads/` och ladda upp innehållet i ZIP-filen.
4. Kontrollera att `app/storage/` är skrivbar för PHP. Endast misslyckade e-postförsök loggas där, utan meddelandetext.
5. Kontrollera adresserna i `app/config.php`. Formulären skickar som standard till `info@lotsab.se`.
6. Testa kontaktformuläret, produktkatalogen, nyhetsarkivet och ett urval gamla direktadresser.

## Struktur

- `index.php` – en gemensam router för alla publika adresser
- `app/views/` – gemensamma sidmallar, navigation och formulär
- `app/content/` – sanerat innehåll utan gamla sidbyggarstilar och ikoner
- `app/data/routes.json` – alla bevarade webbadresser
- `assets/data/search-index.json` – lokal sökning och sortering
- `api/contact.php` – CSRF-skyddad formulärhantering med validering, honeypot och enkel frekvensbegränsning

## Innehåll och sortering

- Produkter visas A–Ö som standard och kan sorteras efter senaste uppdatering.
- Nyheter visas med senaste publiceringsdatum först och kan sorteras A–Ö.
- Kategoriarkiv filtrerar på rätt kategorinyckel.
- Sammanfattningar avslutas vid en hel mening eller ett helt ord.
- Bilder ligger i en gemensam responsiv innehållsmall och gamla dekorativa ikoner har tagits bort.

## Omfattning

- 1 317 publika webbadresser
- 1 030 sökbara informationsposter, artiklar, produkter och nyhetsbrev
- 1 019 sanerade innehållsfiler
- 27 formuläradresser med fungerande formulärflöde

Innehållsimporten kan byggas om med `npm install` och `npm run build:content`. Node.js behövs inte på webbservern och ingår inte i publiceringspaketet.
