-- phpMyAdmin SQL Dump
-- Adatbázis: `fust_parazs`
-- Teljes séma és adatok a frontendhez igazítva

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Adatbázis létrehozása és kiválasztása
CREATE DATABASE IF NOT EXISTS `fust_parazs` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;
USE `fust_parazs`;

-- Táblák törlése, ha léteznek (tiszta telepítéshez)
DROP TABLE IF EXISTS `receptek`;
DROP TABLE IF EXISTS `megallok`;
DROP TABLE IF EXISTS `ertekelesek`;
DROP TABLE IF EXISTS `helyek`;
DROP TABLE IF EXISTS `felhasznalok`;
DROP TABLE IF EXISTS `gyik`;
DROP TABLE IF EXISTS `homersekletek`;
DROP TABLE IF EXISTS `husok`;
DROP TABLE IF EXISTS `kviz_kerdesek`;
DROP TABLE IF EXISTS `kviz_valaszok`;

-- --------------------------------------------------------
-- Tábla: felhasznalok (Regisztrációhoz és belépéshez)
-- --------------------------------------------------------
CREATE TABLE `felhasznalok` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nev` varchar(60) NOT NULL,
  `email` varchar(100) NOT NULL,
  `jelszo_hash` varchar(255) NOT NULL,
  `szerep` enum('user','etterem','truck','mindketto') NOT NULL DEFAULT 'user',
  `letrehozva` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fh_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------
-- Tábla: helyek (Térkép és helyfeltöltés)
-- --------------------------------------------------------
CREATE TABLE `helyek` (
  `sorszam` int(11) NOT NULL AUTO_INCREMENT,
  `id` varchar(40) NOT NULL,
  `tipus` enum('etterem','food_truck','tuzrako') NOT NULL,
  `nev` varchar(60) NOT NULL,
  `helyszin` varchar(90) NOT NULL,
  `megye` varchar(40) NOT NULL DEFAULT '',
  `leiras` varchar(240) NOT NULL DEFAULT '',
  `regisztralt` tinyint(1) NOT NULL DEFAULT 0,
  `tulajdonos_id` int(11) DEFAULT NULL,
  `pin_hash` varchar(200) DEFAULT NULL,
  `letrehozva` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_helyek_sorszam` (`sorszam`),
  KEY `idx_helyek_tipus` (`tipus`),
  KEY `idx_helyek_megye` (`megye`),
  KEY `idx_helyek_tulaj` (`tulajdonos_id`),
  CONSTRAINT `fk_helyek_tulaj` FOREIGN KEY (`tulajdonos_id`) REFERENCES `felhasznalok` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------
-- Tábla: ertekelesek (Értékelések a térképen)
-- --------------------------------------------------------
CREATE TABLE `ertekelesek` (
  `hely_id` varchar(40) NOT NULL,
  `felhasznalo_id` int(11) NOT NULL,
  `csillag` tinyint(3) UNSIGNED NOT NULL,
  `modositva` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`hely_id`,`felhasznalo_id`),
  KEY `idx_ert_fh` (`felhasznalo_id`),
  CONSTRAINT `fk_ert_hely` FOREIGN KEY (`hely_id`) REFERENCES `helyek` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ert_fh` FOREIGN KEY (`felhasznalo_id`) REFERENCES `felhasznalok` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------
-- Tábla: receptek (Receptfeltöltés)
-- --------------------------------------------------------
CREATE TABLE `receptek` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cim` varchar(80) NOT NULL,
  `kat` enum('marha','sertes','csirke','hal','vega','egyeb') NOT NULL DEFAULT 'egyeb',
  `ido_perc` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `hozzavalok` text NOT NULL,
  `lepesek` text NOT NULL,
  `feltolto_id` int(11) DEFAULT NULL,
  `feltoltve` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_rec_kat` (`kat`),
  KEY `idx_rec_feltolto` (`feltolto_id`),
  CONSTRAINT `fk_rec_feltolto` FOREIGN KEY (`feltolto_id`) REFERENCES `felhasznalok` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------
-- Tábla: megallok (Food truck megállók)
-- --------------------------------------------------------
CREATE TABLE `megallok` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hely_id` varchar(40) NOT NULL,
  `helyszin` varchar(90) NOT NULL,
  `mikor` varchar(40) NOT NULL DEFAULT '',
  `letrehozva` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_meg_hely` (`hely_id`),
  CONSTRAINT `fk_meg_hely` FOREIGN KEY (`hely_id`) REFERENCES `helyek` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------
-- Táblák az index.html statikus adataihoz
-- --------------------------------------------------------
CREATE TABLE `gyik` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kerdes` varchar(200) NOT NULL,
  `valasz` text NOT NULL,
  `sorszam` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE `homersekletek` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hus` varchar(60) NOT NULL,
  `cel` varchar(40) NOT NULL,
  `homerseklet` varchar(20) NOT NULL,
  `sorszam` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE `husok` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nev` varchar(40) NOT NULL,
  `teljes_nev` varchar(80) NOT NULL,
  `gramm_fo` smallint(5) UNSIGNED NOT NULL,
  `sutesi_ido` varchar(120) NOT NULL,
  `sorszam` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE `kviz_kerdesek` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kerdes` varchar(200) NOT NULL,
  `sorszam` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

CREATE TABLE `kviz_valaszok` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kerdes_id` int(11) NOT NULL,
  `szoveg` varchar(120) NOT NULL,
  `helyes` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_kv_kerdes` (`kerdes_id`),
  CONSTRAINT `fk_kv_kerdes` FOREIGN KEY (`kerdes_id`) REFERENCES `kviz_kerdesek` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------
-- ADATOK BESZÚRÁSA
-- --------------------------------------------------------

-- 1. Demó Felhasználók (Jelszó: "password" - bcrypt hash)
INSERT INTO `felhasznalok` (`nev`, `email`, `jelszo_hash`, `szerep`) VALUES
('Kovács István', 'istvan@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user'),
('Smokey Monkies Kft.', 'info@smokey.hu', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'etterem'),
('Smoke & Meat Kft.', 'info@smokemeat.hu', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'truck'),
('BBQ Mester', 'mester@bbq.hu', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'mindketto');

-- 2. Helyek
-- Budapest
INSERT INTO `helyek` (`id`, `tipus`, `nev`, `helyszin`, `megye`, `leiras`, `regisztralt`, `tulajdonos_id`) VALUES
('e1', 'etterem', 'Smokey Monkies BBQ', 'Budapest (több egység)', 'Budapest', 'Smokerben készült BBQ-tálak, szendvicsek, smashed burger és klasszikus déli köretek.', 0, 2),
('e2', 'etterem', 'Petrol Beer & Barbeque', 'Budapest, József körút', 'Budapest', 'Texasi és louisianai ihletésű újhullámos BBQ füstölt pho levessel.', 0, NULL),
('e3', 'etterem', 'MAG kert BBQ', 'Budapest, Kelenföld', 'Budapest', 'Élő zenés, szabadtéri BBQ- és burgerbár.', 0, NULL),
('e4', 'etterem', 'Blokk BBQ', 'Budapest, XIX. kerület', 'Budapest', 'Amerikai stílusú BBQ és burger Kispesten.', 0, NULL),
('e5', 'etterem', 'DP BBQ', 'Budapest, budafoki Duna-part', 'Budapest', 'Grill és BBQ a Duna-parton.', 0, NULL),
('e7', 'etterem', 'Fat Mama', 'Budapest belváros', 'Budapest', 'Reggeltől estig nyitva tartó BBQ-konyha és közösségi tér.', 0, NULL),
('e8', 'etterem', 'Yu Grill', 'Budapest, Kolosy tér', 'Budapest', 'Szerb grillkonyha: csevap, pljeskavica, kajmak.', 0, NULL),
('e9', 'etterem', 'Gangsikdang', 'Budapest', 'Budapest', 'Koreai BBQ az ázsiai grillezés kedvelőinek.', 0, NULL),
('e10', 'etterem', 'Beef Heaven by Tuning', 'Budapest', 'Budapest', 'Marhás hely wagyu rajongóknak.', 0, NULL),
('t2', 'food_truck', 'Smoke Riders BBQ', 'Budapest, Kazinczy utca', 'Budapest', 'BBQ food truck a Karaván udvarban.', 0, NULL),
('t3', 'food_truck', 'Karaván Street Food', 'Budapest, Kazinczy utca', 'Budapest', 'Budapest első nagy street food udvara.', 0, NULL),
('t4', 'food_truck', 'Che-Che', 'Országos rendezvények', 'Budapest', 'Díjnyertes food truck.', 0, NULL),
('t5', 'food_truck', 'Kanálgép', 'Országos rendezvények', 'Budapest', 'Húsgolyós street food, év street foodja díj.', 0, NULL),
('t6', 'food_truck', 'Borkas', 'Országos rendezvények', 'Budapest', 'A 2019-es HSFA legszebb food truckja.', 0, NULL),
('t7', 'food_truck', 'Zing Burger', 'Országos hálózat', 'Budapest', 'Az ország legnagyobb hazai burgerlánca.', 0, NULL),
('f1', 'tuzrako', 'Normafa', 'Budapest, XII. kerület', 'Budapest', 'Kijelölt tűzrakóhely a Budai-hegységben.', 0, NULL),
('f2', 'tuzrako', 'Doberdó út', 'Budapest, III. kerület', 'Budapest', 'Tűzrakóhely a Kiscelli Múzeum mellett.', 0, NULL),
('f3', 'tuzrako', 'Zöldmál', 'Budapest, II. kerület', 'Budapest', 'Kijelölt tűzrakó a Zöldmál környékén.', 0, NULL),
('f4', 'tuzrako', 'Cinkotai kiserdő', 'Budapest, XVI. kerület', 'Budapest', 'Két tűzrakóhely a kiserdőben.', 0, NULL),
('f5', 'tuzrako', 'Szent Anna-kápolna', 'Budapest, XII. kerület', 'Budapest', 'Erdei tűzrakóhely.', 0, NULL),
('f11', 'tuzrako', 'Golyós udvar', 'Budapest', 'Budapest', 'Belső udvari tűzrakóhelyek, előre foglalhatók.', 0, NULL);

-- Pest
INSERT INTO `helyek` (`id`, `tipus`, `nev`, `helyszin`, `megye`, `leiras`, `regisztralt`, `tulajdonos_id`) VALUES
('f6', 'tuzrako', 'Kárpát-forrás', 'Pilisszentlászló', 'Pest', 'Tűzrakóhely a Pilisben.', 0, NULL),
('f7', 'tuzrako', 'Nyakas-kő', 'Biatorbágy', 'Pest', 'Kirándulóhely tűzrakóval.', 0, NULL),
('f8', 'tuzrako', 'Ezüst-hegy', 'Budakalász–Pilisborosjenő', 'Pest', 'Tűzrakóhely a hegyen.', 0, NULL),
('f9', 'tuzrako', 'Törökmezői turistaház', 'Nagymaros', 'Pest', 'Dunakanyari túrapont tűzrakóval.', 0, NULL),
('f10', 'tuzrako', 'Pótharaszti sétaerdő', 'Csévharaszt', 'Pest', 'Két tűzrakóhely a sétaerdőben.', 0, NULL);

-- Megyék (3 hely / megye)
INSERT INTO `helyek` (`id`, `tipus`, `nev`, `helyszin`, `megye`, `leiras`, `regisztralt`, `tulajdonos_id`) VALUES
('bk-e1', 'etterem', 'Kecskeméti Pusztai Grill', 'Kecskemét, Kossuth tér', 'Bács-Kiskun', 'Pusztai ízek és grillezett húsok.', 0, NULL),
('bk-t1', 'food_truck', 'Kecskeméti BBQ', 'Kecskemét', 'Bács-Kiskun', 'Mangalicás ételek és füstölt ízek.', 0, 3),
('bk-f1', 'tuzrako', 'Kiskunsági Nemzeti Park', 'Kecskemét', 'Bács-Kiskun', 'Kijelölt tűzrakóhely a nemzeti parkban.', 0, NULL),
('ba-e1', 'etterem', 'Mecseki BBQ', 'Pécs, Király utca', 'Baranya', 'Erdei hangulat, füstölt ízek.', 0, NULL),
('ba-t1', 'food_truck', 'Pécsi Grill Kocsi', 'Pécs, Széchenyi tér', 'Baranya', 'Gyors grillezett ételek a főtéren.', 0, NULL),
('ba-f1', 'tuzrako', 'Mecsek Tűzrakó', 'Pécs, Mecsek', 'Baranya', 'Tűzrakóhely a Mecsek erdejében.', 0, NULL),
('be-e1', 'etterem', 'Békéscsabai Csárda', 'Békéscsaba', 'Békés', 'Hagyományos alföldi ízek, grillezett húsok.', 0, NULL),
('be-t1', 'food_truck', 'Békési Grill', 'Békéscsaba', 'Békés', 'Gyors grillezett ételek a városközpontban.', 0, NULL),
('be-f1', 'tuzrako', 'Körös-parti tűzrakó', 'Békés', 'Békés', 'Tűzrakóhely a folyóparton.', 0, NULL),
('bo-e1', 'etterem', 'Bükki BBQ', 'Miskolc, Széchenyi utca', 'Borsod-Abaúj-Zemplén', 'Bükki ízek, füstölt húsok.', 0, NULL),
('bo-t1', 'food_truck', 'Miskolci Grill', 'Miskolc, Lillafüred', 'Borsod-Abaúj-Zemplén', 'Erdei környezetben grillezett ételek.', 0, NULL),
('bo-f1', 'tuzrako', 'Lillafüredi tűzrakó', 'Miskolc', 'Borsod-Abaúj-Zemplén', 'Tűzrakóhely a Bükk szívében.', 0, NULL),
('cs-e1', 'etterem', 'Famous Steak & Burger', 'Szeged, Kelemen László utca', 'Csongrád-Csanád', 'Belvárosi steakhouse prémium húsokkal.', 0, NULL),
('cs-e2', 'etterem', 'Tiszapart Grill', 'Szeged, Tisza-part', 'Csongrád-Csanád', 'Halak és grillezett ételek a vízparton.', 0, NULL),
('cs-t1', 'food_truck', 'Szegedi BBQ Truck', 'Szeged', 'Csongrád-Csanád', 'Mangalicás burger és füstölt oldalas.', 0, NULL),
('cs-f1', 'tuzrako', 'Újszegedi liget', 'Szeged', 'Csongrád-Csanád', 'Kijelölt tűzrakóhely a ligetben.', 0, NULL),
('fe-e1', 'etterem', 'Fehérvári Steak', 'Székesfehérvár, Fő utca', 'Fejér', 'Steakek és burgerek a belvárosban.', 0, NULL),
('fe-t1', 'food_truck', 'Fehérvári Grill', 'Székesfehérvár', 'Fejér', 'Gyors grillezett ételek a piacnál.', 0, NULL),
('fe-f1', 'tuzrako', 'Velencei-tó tűzrakó', 'Velence', 'Fejér', 'Tűzrakóhely a tó partján.', 0, NULL),
('gy-e1', 'etterem', 'Győri Steak House', 'Győr, Baross Gábor út', 'Győr-Moson-Sopron', 'Steakek és burgerek a belvárosban.', 0, NULL),
('gy-t1', 'food_truck', 'Rába Grill Truck', 'Győr', 'Győr-Moson-Sopron', 'Folyóparti grillezés.', 0, NULL),
('gy-f1', 'tuzrako', 'Pannonhalmi erdő', 'Pannonhalma', 'Győr-Moson-Sopron', 'Tűzrakóhely az apátság közelében.', 0, NULL),
('hb-e1', 'etterem', 'Debreceni BBQ', 'Debrecen, Piac utca', 'Hajdú-Bihar', 'Füstölt húsok és helyi specialitások.', 0, NULL),
('hb-t1', 'food_truck', 'Hajdúsági Grill', 'Debrecen, Nagyerdő', 'Hajdú-Bihar', 'Helyi alapanyagokból grillezett ételek.', 0, NULL),
('hb-f1', 'tuzrako', 'Nagyerdő tűzrakó', 'Debrecen', 'Hajdú-Bihar', 'Kijelölt tűzrakóhely az egyetem mellett.', 0, NULL),
('he-e1', 'etterem', 'Egri Bor és Grill', 'Eger, Szépasszony-völgy', 'Heves', 'Borozás és grillezés a völgyben.', 0, NULL),
('he-t1', 'food_truck', 'Egri BBQ Kocsi', 'Eger', 'Heves', 'Füstölt ízek a történelmi városban.', 0, NULL),
('he-f1', 'tuzrako', 'Szépasszony-völgy tűzrakó', 'Eger', 'Heves', 'Tűzrakóhely a pincék között.', 0, NULL),
('ja-e1', 'etterem', 'Szolnoki Tiszapart', 'Szolnok, Tisza-part', 'Jász-Nagykun-Szolnok', 'Halak és grillezett ételek a Tisza partján.', 0, NULL),
('ja-t1', 'food_truck', 'Szolnoki Grill', 'Szolnok', 'Jász-Nagykun-Szolnok', 'Gyors grillezett ételek.', 0, NULL),
('ja-f1', 'tuzrako', 'Tiszaliget tűzrakó', 'Szolnok', 'Jász-Nagykun-Szolnok', 'Kijelölt tűzrakóhely a ligetben.', 0, NULL),
('ke-e1', 'etterem', 'Tatabányai Grill', 'Tatabánya, Fő tér', 'Komárom-Esztergom', 'Városi grillezés és füstölt ételek.', 0, NULL),
('ke-t1', 'food_truck', 'Tatai-tó Grill', 'Tata', 'Komárom-Esztergom', 'Tóparti grillezés és friss halak.', 0, NULL),
('ke-f1', 'tuzrako', 'Tatai-tó tűzrakó', 'Tata', 'Komárom-Esztergom', 'Kijelölt tűzrakóhely a tó partján.', 0, NULL),
('no-e1', 'etterem', 'Salgótarjáni Grill', 'Salgótarján', 'Nógrád', 'Városi grillezés és helyi ízek.', 0, NULL),
('no-t1', 'food_truck', 'Nógrádi BBQ', 'Salgótarján', 'Nógrád', 'Füstölt húsok a palóc vidéken.', 0, NULL),
('no-f1', 'tuzrako', 'Hollókői tűzrakó', 'Hollókő', 'Nógrád', 'Tűzrakóhely a világörökségi faluban.', 0, NULL),
('so-e1', 'etterem', 'Déli Part BBQ', 'Siófok, Vámház utca', 'Somogy', 'Füstölt oldalas, steakek texasi hangulatban.', 0, NULL),
('so-e2', 'etterem', 'Kaposvári Grill', 'Kaposvár, Fő utca', 'Somogy', 'Somogyi ízek és grillezett húsok.', 0, NULL),
('so-t1', 'food_truck', 'Balatoni Grill Truck', 'Siófok', 'Somogy', 'Tóparti grillezés és friss halak.', 0, NULL),
('so-f1', 'tuzrako', 'Balaton-parti tűzrakó', 'Zamárdi', 'Somogy', 'Kijelölt tűzrakóhely a tó partján.', 0, NULL),
('sz-e1', 'etterem', 'Nyíregyházi Sóstó Grill', 'Nyíregyháza, Sóstó', 'Szabolcs-Szatmár-Bereg', 'Tóparti grillezés és helyi ízek.', 0, NULL),
('sz-t1', 'food_truck', 'Nyírségi BBQ', 'Nyíregyháza', 'Szabolcs-Szatmár-Bereg', 'Füstölt húsok a nyírségi síkságon.', 0, NULL),
('sz-f1', 'tuzrako', 'Sóstó tűzrakó', 'Nyíregyháza', 'Szabolcs-Szatmár-Bereg', 'Tűzrakóhely a tó mellett.', 0, NULL),
('to-e1', 'etterem', 'Szekszárdi Bor és Grill', 'Szekszárd', 'Tolna', 'Borozás és grillezés a borvidéken.', 0, NULL),
('to-t1', 'food_truck', 'Tolnai BBQ', 'Szekszárd', 'Tolna', 'Füstölt ízek a szekszárdi dombok között.', 0, NULL),
('to-f1', 'tuzrako', 'Duna-parti tűzrakó', 'Paks', 'Tolna', 'Kijelölt tűzrakóhely a Duna partján.', 0, NULL),
('va-e1', 'etterem', 'Szombathelyi Grill', 'Szombathely, Fő tér', 'Vas', 'Nyugat-dunántúli ízek és grillezett húsok.', 0, NULL),
('va-t1', 'food_truck', 'Vasi BBQ', 'Szombathely', 'Vas', 'Füstölt húsok a határ mentén.', 0, NULL),
('va-f1', 'tuzrako', 'Őrségi tűzrakó', 'Őriszentpéter', 'Vas', 'Tűzrakóhely az Őrségi Nemzeti Parkban.', 0, NULL),
('ve-e1', 'etterem', 'Veszprémi Vár Grill', 'Veszprém, Vár utca', 'Veszprém', 'Füstölt ételek a vár alatt.', 0, NULL),
('ve-t1', 'food_truck', 'Balatoni BBQ Truck', 'Balatonfüred', 'Veszprém', 'Tóparti grillezés.', 0, NULL),
('ve-f1', 'tuzrako', 'Balaton-felvidéki tűzrakó', 'Csopak', 'Veszprém', 'Tűzrakóhely a Balaton-felvidéken.', 0, NULL),
('za-e1', 'etterem', 'Zalaegerszegi Grill', 'Zalaegerszeg, Dísz tér', 'Zala', 'Zalai ízek és grillezett húsok.', 0, NULL),
('za-t1', 'food_truck', 'Zalai BBQ', 'Zalaegerszeg', 'Zala', 'Füstölt ízek a zalai dombok között.', 0, NULL),
('za-f1', 'tuzrako', 'Hévízi-tó tűzrakó', 'Hévíz', 'Zala', 'Kijelölt tűzrakóhely a fürdőváros mellett.', 0, NULL);

-- 3. Receptek
INSERT INTO `receptek` (`cim`, `kat`, `ido_perc`, `hozzavalok`, `lepesek`, `feltolto_id`) VALUES
('Füstölt pulled pork', 'sertes', 600, '2,5–3 kg sertéslapocka (csont nélkül)\n3 ek barna cukor\n2 ek füstölt paprika\n1 ek só\n1 ek fekete bors\n1 tk fokhagymapor\n1 tk hagymapor\n1 dl almalé', '1. Keverd össze a fűszereket, dörzsöld be a húst, pihentesd hűtőben 2–12 órát.\n2. Állítsd a smokert 110–120 °C-ra, tegyél rá gyümölcsfát.\n3. Süsd 5–6 órán át, óránként permetezd almalével.\n4. 70 °C belső hőnél csomagold alufóliába, süsd tovább 93–96 °C-ig.\n5. Pihentesd 30–60 percig, szedd szálaira, tálald zsemlével és coleslaw-val.', 2),
('Brisket (marhamell)', 'marha', 720, '4 kg marhamell\nSó\nFekete bors\nMustár (dörzsöléshez)', '1. Sózd be a húst előző nap, hagyd hűtőben.\n2. Kend be mustárral, szórd be borssal.\n3. Süsd 110 °C-on 10–12 órán át.\n4. Szeletelés előtt pihentesd 1 órát.', 3);

-- 4. Statikus adatok (index.html)
INSERT INTO `gyik` (`kerdes`, `valasz`, `sorszam`) VALUES
('Faszén vagy gáz a jobb?', 'A faszén intenzívebb, füstösebb ízt ad, de lassabban gyullad. A gázgrill gyorsabb és pontosabban szabályozható.', 1),
('Miért kell pihentetni a húst sütés után?', 'Sütés közben a hús leve a közepe felé szorul. Pár perc pihenés alatt újra eloszlik, szaftosabb marad.', 2),
('Mi az a low and slow?', 'Alacsony hőmérsékleten (kb. 110–135 °C) hosszú ideig sütés. A kötőszövet omlóssá válik.', 3),
('Hogyan tisztítsam a grillrácsot?', 'Még forrón, drótkefével kapard le, majd olajozott ruhával töröld át.', 4),
('Mikor tilos tüzet gyújtani?', 'Száraz, aszályos időszakban tűzgyújtási tilalom lehet érvényben. Mindig nézd meg az aktuális tájékoztatást.', 5);

INSERT INTO `homersekletek` (`hus`, `cel`, `homerseklet`, `sorszam`) VALUES
('Csirke, pulyka', 'Átsült, biztonságos', '74 °C', 1),
('Sertésszelet, sertéskaraj', 'Átsült, szaftos', '63–70 °C', 2),
('Marhahús (steak)', 'Medium', '57–63 °C', 3),
('Darált hús (burger)', 'Átsült', '71 °C', 4),
('Pulled pork (sertéslapocka)', 'Szálaira omlik', '93–96 °C', 5),
('Brisket (marhamell)', 'Omlós', '93–96 °C', 6);

INSERT INTO `husok` (`nev`, `teljes_nev`, `gramm_fo`, `sutesi_ido`, `sorszam`) VALUES
('Steak, szelet', 'Steak, szelet (csont nélkül)', 250, 'Oldalanként 2–4 perc, utána pihentetés', 1),
('Csirkecomb', 'Csirkecomb (csontos)', 400, 'Közvetett hőn 30–40 perc, belül 74 °C', 2),
('Oldalas', 'Sertésoldalas (csontos)', 450, '110–120 °C-on 4–6 óra', 3),
('Pulled pork', 'Sertéslapocka (nyers)', 350, '110–120 °C-on 8–10 óra, belül 93–96 °C', 4);

INSERT INTO `kviz_kerdesek` (`kerdes`, `sorszam`) VALUES
('Hány °C a csirke biztonságos belső hőmérséklete?', 1),
('Mekkora belső hőfokon omlik szét a pulled pork?', 2),
('Mit jelent a low and slow?', 3),
('Honnan ered a barbecue szó?', 4),
('Hol szabad erdőben tüzet rakni külön engedély nélkül?', 5);

INSERT INTO `kviz_valaszok` (`kerdes_id`, `szoveg`, `helyes`) VALUES
(1, '63 °C', 0), (1, '74 °C', 1), (1, '93 °C', 0),
(2, '57 °C', 0), (2, '74 °C', 0), (2, '93–96 °C', 1),
(3, 'Alacsony hő, hosszú idő', 1), (3, 'Magas hő, rövid idő', 0), (3, 'Csak hideg füstölés', 0),
(4, 'A taíno barbacoa szóból', 1), (4, 'Egy francia szóból', 0), (4, 'Egy német szóból', 0),
(5, 'Bárhol, ahol nincs száraz fű', 0), (5, 'Csak kijelölt tűzrakóhelyen', 1), (5, 'Csak éjszaka', 0);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;