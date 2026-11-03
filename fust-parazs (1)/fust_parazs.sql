-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1:3307
-- Létrehozás ideje: 2026. Nov 02. 10:30
-- Kiszolgáló verziója: 10.4.28-MariaDB
-- PHP verzió: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `fust_parazs`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `ertekelesek`
--

CREATE TABLE `ertekelesek` (
  `hely_id` varchar(40) NOT NULL,
  `kliens_id` varchar(64) NOT NULL,
  `csillag` tinyint(3) UNSIGNED NOT NULL,
  `modositva` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `gyik`
--

CREATE TABLE `gyik` (
  `id` int(11) NOT NULL,
  `kerdes` varchar(200) NOT NULL,
  `valasz` text NOT NULL,
  `sorszam` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `gyik`
--

INSERT INTO `gyik` (`id`, `kerdes`, `valasz`, `sorszam`) VALUES
(1, 'Faszén vagy gáz a jobb?', 'A faszén intenzívebb, füstösebb ízt ad, de lassabban gyullad és több odafigyelést kér. A gázgrill gyorsabb és pontosabban szabályozható. A választás ízlés és alkalom kérdése.', 1),
(2, 'Miért kell pihentetni a húst sütés után?', 'Sütés közben a hús leve a közepe felé szorul. Pár perc pihenés alatt újra eloszlik, így szeleteléskor kevesebb folyik ki, és szaftosabb marad.', 2),
(3, 'Mi az a low and slow?', 'Alacsony hőmérsékleten, hosszú idő alatt sütés, jellemzően kb. 110–135 °C-on. Ettől a kötőszövet omlóssá válik, ezért ezt használják brisketnél és pulled porknál.', 3),
(4, 'Hogyan tisztítsam a grillrácsot?', 'A legkönnyebb még forrón, drótkefével lekaparni, majd olajozott ruhával áttörölni. Így nem ragad rá a következő hús.', 4),
(5, 'Mikor tilos tüzet gyújtani?', 'Száraz, aszályos időszakban az egész országra vagy egyes területekre tűzgyújtási tilalmat rendelhetnek el, ilyenkor a kijelölt tűzrakóhelyek sem használhatók. Indulás előtt érdemes megnézni az aktuális tájékoztatást.', 5);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `helyek`
--

CREATE TABLE `helyek` (
  `sorszam` int(11) NOT NULL,
  `id` varchar(40) NOT NULL,
  `tipus` enum('etterem','food_truck','tuzrako') NOT NULL,
  `nev` varchar(60) NOT NULL,
  `helyszin` varchar(90) NOT NULL,
  `leiras` varchar(240) NOT NULL DEFAULT '',
  `regisztralt` tinyint(1) NOT NULL DEFAULT 0,
  `tulajdonos_kliens` varchar(64) DEFAULT NULL,
  `pin_hash` varchar(200) DEFAULT NULL,
  `letrehozva` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `helyek`
--

INSERT INTO `helyek` (`sorszam`, `id`, `tipus`, `nev`, `helyszin`, `leiras`, `regisztralt`, `tulajdonos_kliens`, `pin_hash`, `letrehozva`) VALUES
(1, 'e1', 'etterem', 'Smokey Monkies BBQ', 'Budapest (több egység)', 'Smokerben készült BBQ-tálak, szendvicsek, smashed burger és klasszikus déli köretek, mint a BBQ-bab és a mac and cheese.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(9, 'e10', 'etterem', 'Beef Heaven by Tuning', 'Budapest', 'Marhás hely wagyu rajongóknak, a Tuning Burger családjából.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(10, 'e11', 'etterem', 'Famous – Steak, Burger & More', 'Szeged, Kelemen László utca', 'Belvárosi steakhouse prémium húsokkal és burgerekkel, a vendégek a steaket és a barna vajas krumplipürét dicsérik.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(2, 'e2', 'etterem', 'Petrol Beer & Barbeque', 'Budapest, József körút', 'Texasi és louisianai ihletésű, újhullámos BBQ-hely füstölt pho levessel, szárnyakkal és vegán BBQ-opciókkal.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(3, 'e3', 'etterem', 'MAG kert BBQ', 'Budapest, Kelenvölgy–Őrmező–Kelenföld határán', 'Élő zenés, szabadtéri BBQ- és burgerbár pulled porkkal és szmókerben füstölt burgerekkel.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(4, 'e4', 'etterem', 'Blokk BBQ', 'Budapest, XIX. kerület (Kispest)', 'Baráti kerti sütögetésekből kinőtt, amerikai stílusú BBQ és burger.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(5, 'e5', 'etterem', 'DP BBQ', 'Budapest, budafoki Duna-part', 'Grill és BBQ a Duna-parton, a siófoki Déli Part BBQ testvérhelye.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(6, 'e6', 'etterem', 'Déli Part BBQ', 'Siófok, Vámház u. 2.', 'Professzionális smokerben készült füstölt oldalas, steakek és házi burgerek texasi hangulatban.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(7, 'e7', 'etterem', 'Fat Mama', 'Budapest, a belváros bulinegyedében', 'Reggeltől estig nyitva tartó BBQ-konyha és közösségi tér, amerikai alapokra nemzetközi hatásokkal.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(8, 'e8', 'etterem', 'Yu Grill', 'Budapest, Kolosy tér', 'Szerb grillkonyha: csevap, pljeskavica, kajmak és házi lepény.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(11, 'e9', 'etterem', 'Gangsikdang', 'Budapest', 'Koreai BBQ azoknak, akik az ázsiai grillezést szeretnék kipróbálni.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(19, 'f1', 'tuzrako', 'Normafa', 'Budapest, XII. kerület', 'Kijelölt tűzrakóhely a Budai-hegységben, népszerű kirándulóhely.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(28, 'f10', 'tuzrako', 'Pótharaszti sétaerdő', 'Csévharaszt', 'Két tűzrakóhellyel a sétaerdőben.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(29, 'f11', 'tuzrako', 'Golyós', 'Budapest', 'Belső udvari tűzrakóhelyek, amelyeket előre foglalni lehet. Ellenőrizd, hogy még elérhető-e.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(20, 'f2', 'tuzrako', 'Doberdó út (Kiscelli Múzeum mellett)', 'Budapest, III. kerület', 'Grilltérképen szereplő tűzrakóhely a fővárosban.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(21, 'f3', 'tuzrako', 'Zöldmál, Ferenchegyi út', 'Budapest, II. kerület', 'Kijelölt tűzrakó a Zöldmál környékén.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(22, 'f4', 'tuzrako', 'Cinkotai kiserdő', 'Budapest, XVI. kerület', 'Két tűzrakóhely is található itt.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(23, 'f5', 'tuzrako', 'Szent Anna-kápolna', 'Budapest, XII. kerület', 'Erdei tűzrakóhely a grilltérkép szerint.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(24, 'f6', 'tuzrako', 'Kárpát-forrás', 'Pilisszentlászló', 'Pest megyei tűzrakóhely a Pilisben.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(25, 'f7', 'tuzrako', 'Nyakas-kő', 'Biatorbágy', 'Pest megyei kirándulóhely tűzrakóval.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(26, 'f8', 'tuzrako', 'Ezüst-hegy', 'Budakalász–Pilisborosjenő', 'Pest megyei tűzrakóhely a hegyen.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(27, 'f9', 'tuzrako', 'Törökmezői turistaház', 'Nagymaros', 'Dunakanyari túrapont tűzrakóval.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(12, 't1', 'food_truck', 'Smoke & Meat BBQ', 'Kecskemét', 'A 2019-es Hungarian Street Food Awards fődíjasa és közönségdíjasa, mangalicás BBQ-ételekkel.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(13, 't2', 'food_truck', 'Smoke Riders BBQ', 'Budapest, Kazinczy utcai Karaván', 'BBQ-vállalkozás több food trucckal, jó ár-érték aránnyal.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(14, 't3', 'food_truck', 'Karaván Street Food', 'Budapest, Kazinczy utca', 'Budapest első, nagy street food udvara food truckok és kocsik gyűjtőhelye.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(15, 't4', 'food_truck', 'Che-Che', 'Országos rendezvényeken', 'Díjnyertes food truck, a Food Truck Show szakmai zsűrijének és a Street Food Egyesület díját nyerte.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(16, 't5', 'food_truck', 'Kanálgép', 'Országos rendezvényeken', 'Húsgolyós street food, amelyet a Food Truck Show közönsége az év street foodjának választott.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(17, 't6', 'food_truck', 'Borkas', 'Országos rendezvényeken', 'A 2019-es Hungarian Street Food Awards legszebb food truckja.', 0, NULL, NULL, '2026-11-02 09:36:49'),
(18, 't7', 'food_truck', 'Zing Burger', 'Országos hálózat', 'Egy food trucknál indult, ma Magyarország legnagyobb hazai burgerlánca.', 0, NULL, NULL, '2026-11-02 09:36:49');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `hely_kategoriak`
--

CREATE TABLE `hely_kategoriak` (
  `hely_id` varchar(40) NOT NULL,
  `kategoria_id` tinyint(3) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `hely_kategoriak`
--

INSERT INTO `hely_kategoriak` (`hely_id`, `kategoria_id`) VALUES
('e1', 1),
('e10', 2),
('e11', 2),
('e2', 1),
('e3', 1),
('e4', 1),
('e5', 1),
('e6', 1),
('e6', 2),
('e7', 1),
('e8', 3),
('e9', 3),
('f1', 3),
('f10', 3),
('f11', 3),
('f2', 3),
('f3', 3),
('f4', 3),
('f5', 3),
('f6', 3),
('f7', 3),
('f8', 3),
('f9', 3),
('t1', 1),
('t2', 1),
('t3', 3),
('t4', 3),
('t5', 3),
('t6', 3),
('t7', 3);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `homersekletek`
--

CREATE TABLE `homersekletek` (
  `id` int(11) NOT NULL,
  `hus` varchar(60) NOT NULL,
  `cel` varchar(40) NOT NULL,
  `homerseklet` varchar(20) NOT NULL,
  `sorszam` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `homersekletek`
--

INSERT INTO `homersekletek` (`id`, `hus`, `cel`, `homerseklet`, `sorszam`) VALUES
(1, 'Csirke, pulyka', 'Átsült, biztonságos', '74 °C', 1),
(2, 'Sertésszelet, sertéskaraj', 'Átsült, szaftos', '63–70 °C', 2),
(3, 'Marhahús (steak)', 'Medium', '57–63 °C', 3),
(4, 'Darált hús (burger)', 'Átsült', '71 °C', 4),
(5, 'Pulled pork (sertéslapocka)', 'Szálaira omlik', '93–96 °C', 5),
(6, 'Brisket (marhamell)', 'Omlós', '93–96 °C', 6);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `husok`
--

CREATE TABLE `husok` (
  `id` int(11) NOT NULL,
  `nev` varchar(40) NOT NULL,
  `teljes_nev` varchar(80) NOT NULL,
  `gramm_fo` smallint(5) UNSIGNED NOT NULL,
  `sutesi_ido` varchar(120) NOT NULL,
  `sorszam` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `husok`
--

INSERT INTO `husok` (`id`, `nev`, `teljes_nev`, `gramm_fo`, `sutesi_ido`, `sorszam`) VALUES
(1, 'Steak, szelet', 'Steak, szelet (csont nélkül)', 250, 'Steak: oldalanként kb. 2–4 perc, utána pihentetés', 1),
(2, 'Csirkecomb', 'Csirkecomb (csontos)', 400, 'Közvetett hőn kb. 30–40 perc, belül 74 °C', 2),
(3, 'Oldalas', 'Sertésoldalas (csontos)', 450, '110–120 °C-on kb. 4–6 óra', 3),
(4, 'Pulled pork', 'Sertéslapocka pulled porkhoz (nyers)', 350, '110–120 °C-on kb. 8–10 óra, belül 93–96 °C', 4);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `kategoriak`
--

CREATE TABLE `kategoriak` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `kod` varchar(20) NOT NULL,
  `nev` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `kategoriak`
--

INSERT INTO `kategoriak` (`id`, `kod`, `nev`) VALUES
(1, 'bbq', 'BBQ'),
(2, 'steak', 'Steak'),
(3, 'egyeb', 'Egyéb');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `kviz_kerdesek`
--

CREATE TABLE `kviz_kerdesek` (
  `id` int(11) NOT NULL,
  `kerdes` varchar(200) NOT NULL,
  `sorszam` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `kviz_kerdesek`
--

INSERT INTO `kviz_kerdesek` (`id`, `kerdes`, `sorszam`) VALUES
(1, 'Hány °C a csirke biztonságos belső hőmérséklete?', 1),
(2, 'Mekkora belső hőfokon omlik szét a pulled pork?', 2),
(3, 'Mit jelent a low and slow?', 3),
(4, 'Honnan ered a barbecue szó?', 4),
(5, 'Hol szabad erdőben tüzet rakni külön engedély nélkül?', 5);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `kviz_valaszok`
--

CREATE TABLE `kviz_valaszok` (
  `id` int(11) NOT NULL,
  `kerdes_id` int(11) NOT NULL,
  `szoveg` varchar(120) NOT NULL,
  `helyes` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `kviz_valaszok`
--

INSERT INTO `kviz_valaszok` (`id`, `kerdes_id`, `szoveg`, `helyes`) VALUES
(1, 1, '63 °C', 0),
(2, 1, '74 °C', 1),
(3, 1, '93 °C', 0),
(4, 2, '57 °C', 0),
(5, 2, '74 °C', 0),
(6, 2, '93–96 °C', 1),
(7, 3, 'Alacsony hő, hosszú idő', 1),
(8, 3, 'Magas hő, rövid idő', 0),
(9, 3, 'Csak hideg füstölés', 0),
(10, 4, 'A taíno barbacoa szóból', 1),
(11, 4, 'Egy francia szóból', 0),
(12, 4, 'Egy német szóból', 0),
(13, 5, 'Bárhol, ahol nincs száraz fű', 0),
(14, 5, 'Csak kijelölt tűzrakóhelyen', 1),
(15, 5, 'Csak éjszaka', 0);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `megallok`
--

CREATE TABLE `megallok` (
  `id` int(11) NOT NULL,
  `hely_id` varchar(40) NOT NULL,
  `helyszin` varchar(90) NOT NULL,
  `mikor` varchar(40) NOT NULL DEFAULT '',
  `letrehozva` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `ertekelesek`
--
ALTER TABLE `ertekelesek`
  ADD PRIMARY KEY (`hely_id`,`kliens_id`);

--
-- A tábla indexei `gyik`
--
ALTER TABLE `gyik`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `helyek`
--
ALTER TABLE `helyek`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_helyek_sorszam` (`sorszam`),
  ADD KEY `idx_helyek_tipus` (`tipus`),
  ADD KEY `idx_helyek_tulajdonos` (`tulajdonos_kliens`);

--
-- A tábla indexei `hely_kategoriak`
--
ALTER TABLE `hely_kategoriak`
  ADD PRIMARY KEY (`hely_id`,`kategoria_id`),
  ADD KEY `fk_hk_kategoria` (`kategoria_id`);

--
-- A tábla indexei `homersekletek`
--
ALTER TABLE `homersekletek`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `husok`
--
ALTER TABLE `husok`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `kategoriak`
--
ALTER TABLE `kategoriak`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_kategoriak_kod` (`kod`);

--
-- A tábla indexei `kviz_kerdesek`
--
ALTER TABLE `kviz_kerdesek`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `kviz_valaszok`
--
ALTER TABLE `kviz_valaszok`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_valaszok_kerdes` (`kerdes_id`);

--
-- A tábla indexei `megallok`
--
ALTER TABLE `megallok`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_megallok_hely` (`hely_id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `gyik`
--
ALTER TABLE `gyik`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT a táblához `helyek`
--
ALTER TABLE `helyek`
  MODIFY `sorszam` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT a táblához `homersekletek`
--
ALTER TABLE `homersekletek`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT a táblához `husok`
--
ALTER TABLE `husok`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT a táblához `kategoriak`
--
ALTER TABLE `kategoriak`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `kviz_kerdesek`
--
ALTER TABLE `kviz_kerdesek`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT a táblához `kviz_valaszok`
--
ALTER TABLE `kviz_valaszok`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT a táblához `megallok`
--
ALTER TABLE `megallok`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `ertekelesek`
--
ALTER TABLE `ertekelesek`
  ADD CONSTRAINT `fk_ertekelesek_hely` FOREIGN KEY (`hely_id`) REFERENCES `helyek` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `hely_kategoriak`
--
ALTER TABLE `hely_kategoriak`
  ADD CONSTRAINT `fk_hk_hely` FOREIGN KEY (`hely_id`) REFERENCES `helyek` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_hk_kategoria` FOREIGN KEY (`kategoria_id`) REFERENCES `kategoriak` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `kviz_valaszok`
--
ALTER TABLE `kviz_valaszok`
  ADD CONSTRAINT `fk_valaszok_kerdes` FOREIGN KEY (`kerdes_id`) REFERENCES `kviz_kerdesek` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `megallok`
--
ALTER TABLE `megallok`
  ADD CONSTRAINT `fk_megallok_hely` FOREIGN KEY (`hely_id`) REFERENCES `helyek` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
