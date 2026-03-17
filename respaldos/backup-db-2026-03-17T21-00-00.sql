-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: localhost    Database: pos_iados
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '01730261-0bd2-11f1-9f02-42010a800003:1-394445';

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int DEFAULT NULL,
  `tienda_id` int DEFAULT NULL,
  `usuario_id` int NOT NULL,
  `usuario_nombre` varchar(100) NOT NULL,
  `accion` varchar(50) NOT NULL,
  `entidad` varchar(50) NOT NULL,
  `entidad_id` int DEFAULT NULL,
  `datos_anteriores` json DEFAULT NULL,
  `datos_nuevos` json DEFAULT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_fdfb12f33f6d47688004dd13b9` (`entidad`,`entidad_id`),
  KEY `IDX_02fd46dda176ec0acfd0d34d80` (`tenant_id`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
INSERT INTO `auditoria` VALUES (9,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',16,NULL,'{\"folio\": \"V-MLROGPNC\", \"items\": 5, \"total\": 466.32}',NULL,'2026-02-18 06:55:16.515352'),(10,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',17,NULL,'{\"folio\": \"V-MLROTL1J\", \"items\": 2, \"total\": 336.4}',NULL,'2026-02-18 07:05:17.057016'),(11,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',18,NULL,'{\"folio\": \"V-MLRP26CS\", \"items\": 2, \"total\": 250}',NULL,'2026-02-18 07:11:57.938748'),(12,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',19,NULL,'{\"folio\": \"V-MLRP31A3\", \"items\": 3, \"total\": 325}',NULL,'2026-02-18 07:12:38.007447'),(13,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',20,NULL,'{\"folio\": \"V-MLRPLPUO\", \"items\": 3, \"total\": 350}',NULL,'2026-02-18 07:27:09.664816'),(14,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',21,NULL,'{\"folio\": \"V-MLRQ7JPE\", \"items\": 5, \"total\": 702}',NULL,'2026-02-18 07:44:08.149514'),(17,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',24,NULL,'{\"folio\": \"V-MMMGD33A\", \"items\": 3, \"total\": 1535}',NULL,'2026-03-11 13:49:21.862832'),(18,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',25,NULL,'{\"folio\": \"V-MMMGN4VA\", \"items\": 3, \"total\": 605}',NULL,'2026-03-11 13:57:10.780341'),(19,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',26,NULL,'{\"folio\": \"V-MMMKORBM\", \"items\": 5, \"total\": 685}',NULL,'2026-03-11 15:50:25.023143'),(20,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',27,NULL,'{\"folio\": \"V-MMMKT9SW\", \"items\": 8, \"total\": 1030}',NULL,'2026-03-11 15:53:55.634783');
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_configs`
--

DROP TABLE IF EXISTS `backup_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `auto_backup_enabled` tinyint NOT NULL DEFAULT '1',
  `auto_backup_hora` varchar(5) NOT NULL DEFAULT '02:00',
  `retencion_dias` int NOT NULL DEFAULT '7',
  `incluir_db` tinyint NOT NULL DEFAULT '1',
  `incluir_excel` tinyint NOT NULL DEFAULT '1',
  `onedrive_enabled` tinyint NOT NULL DEFAULT '0',
  `onedrive_carpeta` varchar(500) DEFAULT NULL,
  `ultimo_backup_at` datetime DEFAULT NULL,
  `ultimo_backup_estado` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_configs`
--

LOCK TABLES `backup_configs` WRITE;
/*!40000 ALTER TABLE `backup_configs` DISABLE KEYS */;
INSERT INTO `backup_configs` VALUES (1,1,'15:00',7,1,1,0,NULL,'2026-03-11 19:31:34','ok');
/*!40000 ALTER TABLE `backup_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_logs`
--

DROP TABLE IF EXISTS `backup_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(20) NOT NULL,
  `archivo` varchar(500) NOT NULL,
  `tamano_bytes` bigint DEFAULT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'ok',
  `error_msg` text,
  `onedrive_copiado` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_logs`
--

LOCK TABLES `backup_logs` WRITE;
/*!40000 ALTER TABLE `backup_logs` DISABLE KEYS */;
INSERT INTO `backup_logs` VALUES (1,'excel','backup-excel-2026-03-11T21-51-24.xlsx',12652,'ok',NULL,0,'2026-03-11 15:51:25.221578'),(2,'excel','backup-excel-2026-03-11T21-51-26.xlsx',12652,'ok',NULL,0,'2026-03-11 15:51:26.946499'),(3,'db','',NULL,'error','mysqldump: mysqldump: [Warning] Using a password on the command line interface can be insecure.\r\nmysqldump: [ERROR] unknown option \'--skip-ssl\'.\r\n',0,'2026-03-11 15:51:29.960952'),(4,'db','',NULL,'error','mysqldump: mysqldump: [Warning] Using a password on the command line interface can be insecure.\r\nmysqldump: [ERROR] unknown option \'--skip-ssl\'.\r\n',0,'2026-03-11 15:51:56.008268'),(5,'excel','backup-excel-2026-03-11T21-51-56.xlsx',12652,'ok',NULL,0,'2026-03-11 15:51:56.130361'),(6,'db','',NULL,'error','mysqldump: mysqldump: [Warning] Using a password on the command line interface can be insecure.\r\nmysqldump: Couldn\'t execute \'FLUSH /*!40101 LOCAL */ TABLES\': Access denied; you need (at least one of) the RELOAD or FLUSH_TABLES privilege(s) for this operation (1227)\r\n',0,'2026-03-11 15:54:07.468288'),(7,'excel','backup-excel-2026-03-11T21-54-12.xlsx',12972,'ok',NULL,0,'2026-03-11 15:54:13.147418'),(8,'db','',NULL,'error','mysqldump: mysqldump: [Warning] Using a password on the command line interface can be insecure.\r\nmysqldump: Couldn\'t execute \'FLUSH /*!40101 LOCAL */ TABLES\': Access denied; you need (at least one of) the RELOAD or FLUSH_TABLES privilege(s) for this operation (1227)\r\n',0,'2026-03-11 15:54:16.401059'),(9,'excel','backup-excel-2026-03-11T21-54-16.xlsx',12972,'ok',NULL,0,'2026-03-11 15:54:16.540582'),(10,'db','backup-db-2026-03-12T01-30-31.sql',100253,'ok',NULL,0,'2026-03-11 19:30:31.764555'),(11,'db','backup-db-2026-03-12T01-31-33.sql',100344,'ok',NULL,0,'2026-03-11 19:31:33.742542');
/*!40000 ALTER TABLE `backup_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cajas`
--

DROP TABLE IF EXISTS `cajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cajas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `estado` enum('abierta','cerrada') NOT NULL DEFAULT 'cerrada',
  `fondo_apertura` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_ventas` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_entradas` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_salidas` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_esperado` decimal(10,2) DEFAULT NULL,
  `total_real` decimal(10,2) DEFAULT NULL,
  `diferencia` decimal(10,2) DEFAULT NULL,
  `fecha_apertura` datetime DEFAULT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `notas_cierre` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_d0194fc85079ae06f7f88d9821` (`tenant_id`,`tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cajas`
--

LOCK TABLES `cajas` WRITE;
/*!40000 ALTER TABLE `cajas` DISABLE KEYS */;
INSERT INTO `cajas` VALUES (9,4,4,3,7,'Caja-18/2/2026','cerrada',100.00,2429.72,0.00,0.00,2529.72,100.00,-2429.72,'2026-02-18 06:54:59','2026-02-18 07:45:21',NULL,'2026-02-18 06:54:58.957887','2026-02-18 07:45:20.000000'),(10,4,4,3,7,'Caja-11/3/2026','abierta',0.00,3855.00,0.00,0.00,NULL,NULL,NULL,'2026-03-11 13:43:54',NULL,NULL,'2026-03-11 13:43:54.169072','2026-03-11 15:53:55.000000');
/*!40000 ALTER TABLE `cajas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `icono` varchar(50) DEFAULT NULL,
  `orden` int NOT NULL DEFAULT '0',
  `activo` tinyint NOT NULL DEFAULT '1',
  `es_seccion_especial` tinyint NOT NULL DEFAULT '0',
  `tipo_seccion` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `imagen_url` text,
  PRIMARY KEY (`id`),
  KEY `IDX_310ef994cfa94ec2fc37da62ef` (`tenant_id`,`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,1,1,'Hamburguesas',NULL,'#FF6B35','burger',1,1,0,'','2026-02-17 07:49:37.000000','2026-02-18 01:13:44.000000','https://img.hogar.mapfre.es/wp-content/uploads/2018/09/hamburguesa-sencilla.jpg'),(2,1,1,'Pizzas',NULL,'#E8272C','pizza',2,1,0,'','2026-02-17 07:49:37.000000','2026-02-18 01:24:08.000000','https://www.sortirambnens.com/wp-content/uploads/2019/02/pizza-de-peperoni.jpg'),(3,1,1,'Tacos',NULL,'#FFA500','taco',3,1,0,NULL,'2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL),(4,1,1,'Ensaladas',NULL,'#4CAF50','salad',4,1,0,NULL,'2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL),(5,1,1,'Bebidas',NULL,'#2196F3','drink',5,1,1,'bebidas','2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL),(6,1,1,'Postres',NULL,'#E91E63','cake',6,1,1,'postres','2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL),(7,1,1,'Extras',NULL,'#9C27B0','plus',7,1,1,'adicionales','2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL),(8,4,4,'Filetes',NULL,'#3b82f6','',1,1,0,'','2026-02-18 05:42:13.853301','2026-02-18 05:42:13.853301','https://carnescesareogomez.es/wp-content/uploads/2019/07/018-carnescesareogomez-filetes-ternera-rosada-scaled.jpg'),(9,4,4,'Camarones',NULL,'#3b82f6','',3,1,0,'','2026-02-18 05:42:47.180654','2026-02-18 05:43:28.000000','https://recetascanarias.net/wp-content/uploads/2025/08/camarones-cocidos-al-estilo-canario.webp'),(10,4,4,'Caldos',NULL,'#3b82f6','',2,1,0,'','2026-02-18 05:43:16.395038','2026-02-18 05:43:16.395038','https://mojo.generalmills.com/api/public/content/G4xwfLpM6USzSPKYomXZtQ_gmi_hi_res_jpeg.jpeg?v\\u003d5fd6073b\\u0026t\\u003d16e3ce250f244648bef28c5949fb99ff'),(11,4,4,'Adicionales',NULL,'#3b82f6','',9,0,0,'','2026-02-18 05:43:53.781047','2026-02-18 06:27:49.000000','https://www.shutterstock.com/image-vector/dollar-plus-sign-additional-financing-600nw-2198715909.jpg'),(12,4,4,'Tostadas',NULL,'#3b82f6','',4,1,0,'','2026-02-18 05:44:16.863815','2026-02-18 05:44:16.863815','https://guerrerotortillas.com/wp-content/uploads/2021/04/beef-tostadas.jpg'),(13,4,4,'Aguachile',NULL,'#3b82f6','',5,1,0,'','2026-02-18 05:44:43.182900','2026-02-18 05:44:43.182900','https://www.chilipeppermadness.com/wp-content/uploads/2025/11/Aguachile-Recipe-SQ.jpg'),(14,4,4,'Cócteles',NULL,'#f67d3c','',6,1,0,'','2026-02-18 05:45:22.358359','2026-02-18 05:46:32.000000','https://www.muydelish.com/wp-content/uploads/2024/08/mexican-shrimp-cocktail.jpg'),(15,4,4,'Ceviches',NULL,'#3b82f6','',7,1,0,'','2026-02-18 05:46:16.299140','2026-02-18 05:46:16.299140','https://i.ytimg.com/vi/T0-clkZMi4I/maxresdefault.jpg'),(16,4,4,'Extras',NULL,'#0feb16','',10,1,1,'','2026-02-18 06:20:30.826824','2026-02-18 06:20:30.826824','https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgCC7E-fr6TmU_t0b-orKC5KyByDL6QQ_Puskxi3zhcvBCncGL2bHkCsCtgyWbmSZhi4FvprIWg_TZQ41oslurUyol5g8zjwRoou-oJloFqD7duTwcV6Klj9VV3swgIMptjq9w8RWRpfrGf/w1200-h630-p-k-no-nu/299881_294342510588372_100000378759302_965055_1680279504_n.jpg'),(17,4,4,'Bebidas',NULL,'#5f6063','',11,1,1,'','2026-02-18 06:21:16.246893','2026-02-18 06:21:16.246893','https://hips.hearstapps.com/hmg-prod/images/refrescos-portada-1653207586.jpg'),(18,1,1,'Mariscos',NULL,NULL,NULL,0,1,0,NULL,'2026-03-12 15:07:29.200542','2026-03-12 15:07:29.200542',NULL);
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `razon_social` varchar(200) DEFAULT NULL,
  `rfc` varchar(20) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `config_apariencia` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_6e976ce796c710bc669e877cd7` (`tenant_id`),
  CONSTRAINT `FK_6e976ce796c710bc669e877cd73` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (1,1,'Restaurante Demo iaDoS','Restaurante Demo SA de CV',NULL,NULL,NULL,NULL,NULL,1,'2026-02-17 07:49:37.000000','2026-02-21 17:42:09.000000',NULL),(4,4,'Mariscos 2-13\'s San Miguel',NULL,NULL,NULL,NULL,NULL,'/api/uploads/logo-empresa-4-1771392896645.jpeg',1,'2026-02-18 05:32:42.126201','2026-02-20 08:46:49.000000','{\"tema\": \"default\", \"paleta\": \"default\"}');
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuestas_servicio`
--

DROP TABLE IF EXISTS `encuestas_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encuestas_servicio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `mesa_numero` int NOT NULL,
  `mesero_id` int DEFAULT NULL,
  `mesero_nombre` varchar(200) DEFAULT NULL,
  `cliente_nombre` varchar(200) DEFAULT NULL,
  `calificacion_servicio` tinyint NOT NULL DEFAULT '0',
  `calificacion_comida` tinyint NOT NULL DEFAULT '0',
  `comentario` varchar(1000) DEFAULT NULL,
  `completada` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_6c11a778b3546abb8a08affe5b` (`pedido_id`),
  KEY `IDX_ca10f82617bd11644f07413986` (`tenant_id`,`empresa_id`,`tienda_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuestas_servicio`
--

LOCK TABLES `encuestas_servicio` WRITE;
/*!40000 ALTER TABLE `encuestas_servicio` DISABLE KEYS */;
/*!40000 ALTER TABLE `encuestas_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `licencias`
--

DROP TABLE IF EXISTS `licencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `licencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `codigo_instalacion` varchar(255) NOT NULL,
  `codigo_activacion` text,
  `plan` varchar(255) NOT NULL DEFAULT 'basico',
  `features` json DEFAULT NULL,
  `max_tiendas` int NOT NULL DEFAULT '1',
  `max_usuarios` int NOT NULL DEFAULT '3',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `grace_days` int NOT NULL DEFAULT '15',
  `offline_allowed` tinyint NOT NULL DEFAULT '1',
  `estado` varchar(255) NOT NULL DEFAULT 'trial',
  `activated_at` timestamp NULL DEFAULT NULL,
  `last_heartbeat` timestamp NULL DEFAULT NULL,
  `notas` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_0b7af62b17d15ac618b4bc05f4` (`codigo_instalacion`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `licencias`
--

LOCK TABLES `licencias` WRITE;
/*!40000 ALTER TABLE `licencias` DISABLE KEYS */;
INSERT INTO `licencias` VALUES (1,1,'INS-E7B5A92B',NULL,'pro','[\"pos\", \"caja\", \"pedidos\", \"reportes\", \"dashboard\"]',10,50,'2026-02-18','2027-12-31',30,1,'activa',NULL,NULL,NULL,'2026-02-18 00:17:57.000000','2026-03-11 19:28:08.226256'),(6,4,'INS-7C8024B3',NULL,'pro','[\"pos\", \"caja\", \"pedidos\", \"reportes\", \"dashboard\"]',10,50,'2026-02-18','2027-12-31',30,1,'activa',NULL,NULL,NULL,'2026-02-18 05:33:43.067415','2026-03-11 19:28:08.226256');
/*!40000 ALTER TABLE `licencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materia_prima`
--

DROP TABLE IF EXISTS `materia_prima`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materia_prima` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `tienda_id` int DEFAULT NULL,
  `sku` varchar(50) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `unidad` varchar(20) NOT NULL DEFAULT 'pza',
  `costo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `stock_actual` decimal(10,2) NOT NULL DEFAULT '0.00',
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `proveedor` varchar(200) DEFAULT NULL,
  `notas` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_33c52959a7dbf6409eacf9c92a` (`sku`,`tenant_id`,`empresa_id`),
  KEY `IDX_f8705250e2cba2abf811289a8d` (`tenant_id`,`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materia_prima`
--

LOCK TABLES `materia_prima` WRITE;
/*!40000 ALTER TABLE `materia_prima` DISABLE KEYS */;
INSERT INTO `materia_prima` VALUES (1,4,4,3,'MP-00001','Pepino','Pepino','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.258367','2026-02-18 06:51:45.258367'),(2,4,4,3,'MP-00002','Limón','Limón','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.282098','2026-02-18 06:51:45.282098'),(3,4,4,3,'MP-00003','Tomate','Tomate','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.298587','2026-02-18 06:51:45.298587'),(4,4,4,3,'MP-00004','Cebolla Blanca','Cebolla Blanca','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.316244','2026-02-18 06:51:45.316244'),(5,4,4,3,'MP-00005','Cebolla Morada','Cebolla Morada','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.334666','2026-02-18 06:51:45.334666'),(6,4,4,3,'MP-00006','Cilantro','Cilantro','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.350651','2026-02-18 06:51:45.350651'),(7,4,4,3,'MP-00007','Chile Serrano','Chile Serrano','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.365003','2026-02-18 06:51:45.365003'),(8,4,4,3,'MP-00008','Lechuga','Lechuga','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.377695','2026-02-18 06:51:45.377695'),(9,4,4,3,'MP-00009','Zanahoria','Zanahoria','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.393368','2026-02-18 06:51:45.393368'),(10,4,4,3,'MP-00010','Habanero','Habanero','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.407933','2026-02-18 06:51:45.407933'),(11,4,4,3,'MP-00011','Apio','Apio','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.421098','2026-02-18 06:51:45.421098'),(12,4,4,3,'MP-00012','Aguacate','Aguacate','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.434060','2026-02-18 06:51:45.434060'),(13,4,4,3,'MP-00013','Mango','Mango','Verduras','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.446885','2026-02-18 06:51:45.446885'),(14,4,4,3,'MP-00014','Pimienta','Pimienta','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.459406','2026-02-18 06:51:45.459406'),(15,4,4,3,'MP-00015','Ajo a Granel','Ajo a Granel','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.470825','2026-02-18 06:51:45.470825'),(16,4,4,3,'MP-00016','Consomé de Pollo','Consomé de Pollo','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.485005','2026-02-18 06:51:45.485005'),(17,4,4,3,'MP-00017','Consomé de Camarón','Consomé de Camarón','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.500968','2026-02-18 06:51:45.500968'),(18,4,4,3,'MP-00018','Camaron Seco','Camaron Seco','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.513991','2026-02-18 06:51:45.513991'),(19,4,4,3,'MP-00019','Orégano','Orégano','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.527174','2026-02-18 06:51:45.527174'),(20,4,4,3,'MP-00020','Laurel','Laurel','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.539889','2026-02-18 06:51:45.539889'),(21,4,4,3,'MP-00021','Chile Chiltepin','Chile Chiltepin','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.552866','2026-02-18 06:51:45.552866'),(22,4,4,3,'MP-00022','Chile Árbol','Chile Árbol','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.564944','2026-02-18 06:51:45.564944'),(23,4,4,3,'MP-00023','Chile Ancho','Chile Ancho','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.578943','2026-02-18 06:51:45.578943'),(24,4,4,3,'MP-00024','Chile Cascabel','Chile Cascabel','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.591510','2026-02-18 06:51:45.591510'),(25,4,4,3,'MP-00025','Hierbas Finas','Hierbas Finas','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.604498','2026-02-18 06:51:45.604498'),(26,4,4,3,'MP-00026','Azafrán','Azafrán','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.620691','2026-02-18 06:51:45.620691'),(27,4,4,3,'MP-00027','Ajonjolí','Ajonjolí','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.636912','2026-02-18 06:51:45.636912'),(28,4,4,3,'MP-00028','Ajo Molido','Ajo Molido','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.652264','2026-02-18 06:51:45.652264'),(29,4,4,3,'MP-00029','Tajín','Tajín','Especias','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.666783','2026-02-18 06:51:45.666783'),(30,4,4,3,'MP-00030','Catsup El Monte','Catsup El Monte','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.679273','2026-02-18 06:51:45.679273'),(31,4,4,3,'MP-00031','Aderezo Star','Aderezo Star','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.693457','2026-02-18 06:51:45.693457'),(32,4,4,3,'MP-00032','Galleta Salada','Galleta Salada','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.708485','2026-02-18 06:51:45.708485'),(33,4,4,3,'MP-00033','Soya','Soya','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.727387','2026-02-18 06:51:45.727387'),(34,4,4,3,'MP-00034','Vinagre Blanco','Vinagre Blanco','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.749657','2026-02-18 06:51:45.749657'),(35,4,4,3,'MP-00035','Vinagre de Manzana','Vinagre de Manzana','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.763092','2026-02-18 06:51:45.763092'),(36,4,4,3,'MP-00036','Kermato','Kermato','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.776805','2026-02-18 06:51:45.776805'),(37,4,4,3,'MP-00037','Salsa Viuda','Salsa Viuda','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.789350','2026-02-18 06:51:45.789350'),(38,4,4,3,'MP-00038','Puré de Tomate','Puré de Tomate','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.801955','2026-02-18 06:51:45.801955'),(39,4,4,3,'MP-00039','Arroz','Arroz','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.812473','2026-02-18 06:51:45.812473'),(40,4,4,3,'MP-00040','Harina Selecta','Harina Selecta','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.828044','2026-02-18 06:51:45.828044'),(41,4,4,3,'MP-00041','Sal','Sal','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.841047','2026-02-18 06:51:45.841047'),(42,4,4,3,'MP-00042','Azúcar','Azúcar','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.852254','2026-02-18 06:51:45.852254'),(43,4,4,3,'MP-00043','Mantequilla','Mantequilla','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.865253','2026-02-18 06:51:45.865253'),(44,4,4,3,'MP-00044','Chipotle','Chipotle','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.877378','2026-02-18 06:51:45.877378'),(45,4,4,3,'MP-00045','Aceite para Cocinar','Aceite para Cocinar','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.889678','2026-02-18 06:51:45.889678'),(46,4,4,3,'MP-00046','Aceite para Freír','Aceite para Freír','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.902569','2026-02-18 06:51:45.902569'),(47,4,4,3,'MP-00047','Salsa para Llevar R','Salsa para Llevar R','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.915527','2026-02-18 06:51:45.915527'),(48,4,4,3,'MP-00048','Salsa para Llevar A','Salsa para Llevar A','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.927227','2026-02-18 06:51:45.927227'),(49,4,4,3,'MP-00049','Cocas','Cocas','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.942622','2026-02-18 06:51:45.942622'),(50,4,4,3,'MP-00050','Aguas','Aguas','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.954264','2026-02-18 06:51:45.954264'),(51,4,4,3,'MP-00051','Galleta Mantequilla','Galleta Mantequilla','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.965993','2026-02-18 06:51:45.965993'),(52,4,4,3,'MP-00052','Galleta Natural','Galleta Natural','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.977504','2026-02-18 06:51:45.977504'),(53,4,4,3,'MP-00053','Servilletas','Servilletas','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:45.989695','2026-02-18 06:51:45.989695'),(54,4,4,3,'MP-00054','Mostaza','Mostaza','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.001386','2026-02-18 06:51:46.001386'),(55,4,4,3,'MP-00055','Tostadas','Tostadas','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.013366','2026-02-18 06:51:46.013366'),(56,4,4,3,'MP-00056','Queso','Queso','Abarrotes','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.025835','2026-02-18 06:51:46.025835'),(57,4,4,3,'MP-00057','Plato Charola','Plato Charola','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.037627','2026-02-18 06:51:46.037627'),(58,4,4,3,'MP-00058','Contenedor 7x7 Liso','Contenedor 7x7 Liso','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.050452','2026-02-18 06:51:46.050452'),(59,4,4,3,'MP-00059','Contenedor 8x8 División','Contenedor 8x8 División','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.061970','2026-02-18 06:51:46.061970'),(60,4,4,3,'MP-00060','Hamburguesero Contenedor','Hamburguesero Contenedor','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.073648','2026-02-18 06:51:46.073648'),(61,4,4,3,'MP-00061','Vaso 1 Litro','Vaso 1 Litro','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.085018','2026-02-18 06:51:46.085018'),(62,4,4,3,'MP-00062','Vaso 1/2 Litro','Vaso 1/2 Litro','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.096875','2026-02-18 06:51:46.096875'),(63,4,4,3,'MP-00063','Vaso 16 oz','Vaso 16 oz','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.108927','2026-02-18 06:51:46.108927'),(64,4,4,3,'MP-00064','Vaso 32 EU','Vaso 32 EU','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.121332','2026-02-18 06:51:46.121332'),(65,4,4,3,'MP-00065','Vaso Arroz #704','Vaso Arroz #704','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.133528','2026-02-18 06:51:46.133528'),(66,4,4,3,'MP-00066','Tapa Vaso 1 Litro','Tapa Vaso 1 Litro','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.146978','2026-02-18 06:51:46.146978'),(67,4,4,3,'MP-00067','Tapa Vaso 1/2','Tapa Vaso 1/2','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.162085','2026-02-18 06:51:46.162085'),(68,4,4,3,'MP-00068','Tapa Vaso 16 oz','Tapa Vaso 16 oz','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.174843','2026-02-18 06:51:46.174843'),(69,4,4,3,'MP-00069','Tapa Vaso 32 EU','Tapa Vaso 32 EU','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.187665','2026-02-18 06:51:46.187665'),(70,4,4,3,'MP-00070','Tapa Vaso #704','Tapa Vaso #704','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.199305','2026-02-18 06:51:46.199305'),(71,4,4,3,'MP-00071','Tenedores','Tenedores','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.211255','2026-02-18 06:51:46.211255'),(72,4,4,3,'MP-00072','Cucharas','Cucharas','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.223368','2026-02-18 06:51:46.223368'),(73,4,4,3,'MP-00073','Bollo','Bollo','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.236382','2026-02-18 06:51:46.236382'),(74,4,4,3,'MP-00074','Bolsa Basura 70x90','Bolsa Basura 70x90','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.248114','2026-02-18 06:51:46.248114'),(75,4,4,3,'MP-00075','Bolsa Basura 90x120','Bolsa Basura 90x120','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.260431','2026-02-18 06:51:46.260431'),(76,4,4,3,'MP-00076','Bolsa Camisa Mediana','Bolsa Camisa Mediana','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.272137','2026-02-18 06:51:46.272137'),(77,4,4,3,'MP-00077','Bolsa Rollo 2 Kilos','Bolsa Rollo 2 Kilos','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.284934','2026-02-18 06:51:46.284934'),(78,4,4,3,'MP-00078','Palillos de Dientes','Palillos de Dientes','Desechables','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.296651','2026-02-18 06:51:46.296651'),(79,4,4,3,'MP-00079','Pescado (Tilapia)','Pescado (Tilapia)','Mariscos','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.308412','2026-02-18 06:51:46.308412'),(80,4,4,3,'MP-00080','Camaron Gris 41/50','Camaron Gris 41/50','Mariscos','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.320299','2026-02-18 06:51:46.320299'),(81,4,4,3,'MP-00081','Pulpo','Pulpo','Mariscos','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.331965','2026-02-18 06:51:46.331965'),(82,4,4,3,'MP-00082','Jaiba','Jaiba','Mariscos','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.343704','2026-02-18 06:51:46.343704'),(83,4,4,3,'MP-00083','Zurimi','Zurimi','Mariscos','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.356712','2026-02-18 06:51:46.356712'),(84,4,4,3,'MP-00084','Camaron 21/25','Camaron 21/25','Mariscos','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.367044','2026-02-18 06:51:46.367044'),(85,4,4,3,'MP-00085','Papas','Papas','Mariscos','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.377892','2026-02-18 06:51:46.377892'),(86,4,4,3,'MP-00086','Gas del Boiler','Gas del Boiler','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.390276','2026-02-18 06:51:46.390276'),(87,4,4,3,'MP-00087','Gas Cam Blanca','Gas Cam Blanca','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.404291','2026-02-18 06:51:46.404291'),(88,4,4,3,'MP-00088','Gas Cam Roja','Gas Cam Roja','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.416155','2026-02-18 06:51:46.416155'),(89,4,4,3,'MP-00089','Gas Casa','Gas Casa','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.428985','2026-02-18 06:51:46.428985'),(90,4,4,3,'MP-00090','Agua Casa','Agua Casa','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.439690','2026-02-18 06:51:46.439690'),(91,4,4,3,'MP-00091','Luz Casa','Luz Casa','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.451303','2026-02-18 06:51:46.451303'),(92,4,4,3,'MP-00092','Comida Almuerzo','Comida Almuerzo','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.461577','2026-02-18 06:51:46.461577'),(93,4,4,3,'MP-00093','Salsa Valentina','Salsa Valentina','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.472332','2026-02-18 06:51:46.472332'),(94,4,4,3,'MP-00094','Salsa Huichol','Salsa Huichol','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.482832','2026-02-18 06:51:46.482832'),(95,4,4,3,'MP-00095','Salsa Habanera Loltun','Salsa Habanera Loltun','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.493738','2026-02-18 06:51:46.493738'),(96,4,4,3,'MP-00096','Salsa Negrita','Salsa Negrita','Otros','kg',0.00,0.00,0.00,'NA','NA','2026-02-18 06:51:46.504850','2026-02-18 06:51:46.504850');
/*!40000 ALTER TABLE `materia_prima` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_digital_config`
--

DROP TABLE IF EXISTS `menu_digital_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_digital_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `slug` varchar(120) NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '0',
  `modo_menu` varchar(20) NOT NULL DEFAULT 'consulta',
  `sync_mode` varchar(20) NOT NULL DEFAULT 'manual',
  `sync_interval` int NOT NULL DEFAULT '30',
  `cloud_url` varchar(500) DEFAULT NULL,
  `api_key` varchar(100) DEFAULT NULL,
  `last_published_at` datetime DEFAULT NULL,
  `last_publish_status` varchar(20) DEFAULT NULL,
  `last_publish_error` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `plantilla` varchar(20) NOT NULL DEFAULT 'oscuro',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_mdc_slug` (`slug`),
  UNIQUE KEY `UQ_mdc_tienda` (`tienda_id`),
  KEY `IDX_mdc_tenant_empresa` (`tenant_id`,`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_digital_config`
--

LOCK TABLES `menu_digital_config` WRITE;
/*!40000 ALTER TABLE `menu_digital_config` DISABLE KEYS */;
INSERT INTO `menu_digital_config` VALUES (1,1,1,3,'mariscos',1,'consulta','manual',30,'http://localhost:3000','291e95d74e25e613d93ee9d6ad53b82421513257017fb3a26ffde4c577c90624','2026-03-11 11:02:51','success',NULL,'2026-02-21 10:09:04.611177','2026-03-11 19:28:08.232676','oscuro'),(2,1,1,1,'sucursal-centro-mlw5zgbo',1,'consulta','manual',30,'http://localhost:3000','ebf018e0da86457faa8b75117c0c43d341862f05833f546956142b4657400fc5',NULL,NULL,NULL,'2026-02-21 10:16:49.028039','2026-03-11 19:28:08.232676','oscuro');
/*!40000 ALTER TABLE `menu_digital_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_digital_log`
--

DROP TABLE IF EXISTS `menu_digital_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_digital_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tienda_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `productos_count` int NOT NULL DEFAULT '0',
  `images_uploaded` int NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL,
  `error_message` text,
  `duration_ms` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_864aae7c3dbb1fd202e97f85eb` (`tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_digital_log`
--

LOCK TABLES `menu_digital_log` WRITE;
/*!40000 ALTER TABLE `menu_digital_log` DISABLE KEYS */;
INSERT INTO `menu_digital_log` VALUES (1,3,1,25,0,'success',NULL,904,'2026-02-21 10:09:58.442295'),(2,3,4,56,0,'success',NULL,765,'2026-02-21 10:11:07.682569'),(3,3,4,56,0,'success',NULL,703,'2026-02-21 10:11:36.838711'),(4,3,4,56,0,'success',NULL,769,'2026-02-21 10:14:34.139949'),(5,3,4,56,0,'success',NULL,734,'2026-02-21 10:15:54.541570'),(6,3,4,56,0,'success',NULL,718,'2026-02-21 10:15:58.805519'),(7,3,4,56,0,'success',NULL,787,'2026-02-21 10:17:55.302213'),(8,3,4,56,0,'success',NULL,760,'2026-02-21 17:42:58.728804'),(9,3,4,56,0,'success',NULL,172,'2026-02-21 17:59:21.994912'),(10,3,4,56,0,'success',NULL,140,'2026-02-21 19:09:59.203717'),(11,3,4,56,0,'success',NULL,125,'2026-02-21 19:10:45.309479'),(12,3,4,56,0,'success',NULL,128,'2026-02-21 19:11:03.752403'),(13,3,4,56,0,'success',NULL,516,'2026-02-21 19:13:45.112774'),(14,3,4,56,0,'success',NULL,1050,'2026-02-21 19:27:41.950697'),(15,3,4,56,0,'success',NULL,308,'2026-02-21 19:28:02.294316'),(16,3,4,56,0,'success',NULL,377,'2026-02-21 19:28:21.469541'),(17,3,4,56,0,'success',NULL,373,'2026-02-21 19:32:42.408108'),(18,3,4,56,0,'success',NULL,173,'2026-02-21 19:54:39.684175'),(19,3,4,56,0,'success',NULL,138,'2026-02-21 20:27:12.429460'),(20,3,4,56,0,'success',NULL,134,'2026-02-21 20:29:27.097333'),(21,3,4,56,0,'success',NULL,146,'2026-02-21 20:32:33.164254'),(22,3,4,56,0,'success',NULL,153,'2026-02-21 20:32:35.089026'),(23,3,1,56,0,'success',NULL,189,'2026-03-11 10:55:59.359997'),(24,3,1,56,0,'success',NULL,105,'2026-03-11 10:56:09.411899'),(25,3,1,56,0,'success',NULL,114,'2026-03-11 11:00:48.415967'),(26,3,1,56,0,'success',NULL,190,'2026-03-11 11:02:50.823682');
/*!40000 ALTER TABLE `menu_digital_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_digital_orders`
--

DROP TABLE IF EXISTS `menu_digital_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_digital_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(120) NOT NULL,
  `tienda_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `numero_orden` varchar(10) NOT NULL,
  `cliente_nombre` varchar(100) DEFAULT NULL,
  `mesa_numero` varchar(30) DEFAULT NULL,
  `items` json NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `notas` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_165b686c3f10ab3ca9ca04221b` (`tienda_id`,`status`),
  KEY `IDX_4f7664e1233495e4dea6fcd2a0` (`slug`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_digital_orders`
--

LOCK TABLES `menu_digital_orders` WRITE;
/*!40000 ALTER TABLE `menu_digital_orders` DISABLE KEYS */;
INSERT INTO `menu_digital_orders` VALUES (1,'mariscos',3,1,'001','axel','1','[{\"notas\": \"\", \"nombre\": \"Camarón al Coco\", \"precio\": 145, \"cantidad\": 1, \"subtotal\": 145, \"producto_id\": 148}, {\"notas\": \"\", \"nombre\": \"Camarón al Mojo de Ajo\", \"precio\": 145, \"cantidad\": 1, \"subtotal\": 145, \"producto_id\": 147}]',290.00,'pending',NULL,'2026-02-21 10:16:24.740748','2026-02-21 10:16:24.740748');
/*!40000 ALTER TABLE `menu_digital_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_digital_snapshot`
--

DROP TABLE IF EXISTS `menu_digital_snapshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_digital_snapshot` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(120) NOT NULL,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `modo_menu` varchar(20) NOT NULL DEFAULT 'consulta',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `tienda_json` longtext,
  `categorias_json` longtext,
  `productos_json` longtext,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `plantilla` varchar(20) NOT NULL DEFAULT 'oscuro',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_mds_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_digital_snapshot`
--

LOCK TABLES `menu_digital_snapshot` WRITE;
/*!40000 ALTER TABLE `menu_digital_snapshot` DISABLE KEYS */;
INSERT INTO `menu_digital_snapshot` VALUES (1,'mariscos',1,1,3,'consulta',1,'{\"nombre\":\"Mariscos 2-13\'s San Miguel\",\"direccion\":\"Apodaca\",\"telefono\":\"8318989580\",\"email\":\"contacto@mariscos213s.com\",\"logo_url\":\"/api/uploads/logo-empresa-4-1771392896645.jpeg\",\"empresa_nombre\":\"Mariscos 2-13\'s San Miguel\"}','[{\"id\":8,\"nombre\":\"Filetes\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":1},{\"id\":10,\"nombre\":\"Caldos\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":2},{\"id\":9,\"nombre\":\"Camarones\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":3},{\"id\":12,\"nombre\":\"Tostadas\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":4},{\"id\":13,\"nombre\":\"Aguachile\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":5},{\"id\":14,\"nombre\":\"Cócteles\",\"color\":\"#f67d3c\",\"icono\":null,\"orden\":6},{\"id\":15,\"nombre\":\"Ceviches\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":7},{\"id\":16,\"nombre\":\"Extras\",\"color\":\"#0feb16\",\"icono\":null,\"orden\":10},{\"id\":17,\"nombre\":\"Bebidas\",\"color\":\"#5f6063\",\"icono\":null,\"orden\":11}]','[{\"id\":143,\"nombre\":\"Filete a la Plancha\",\"descripcion\":\"\",\"precio\":135,\"categoria_id\":8,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":142,\"nombre\":\"Filete al Mojo de Ajo\",\"descripcion\":\"\",\"precio\":145,\"categoria_id\":8,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":140,\"nombre\":\"Filete Empanizado\",\"descripcion\":\"\",\"precio\":120,\"categoria_id\":8,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":144,\"nombre\":\"Filete Empanizado Mixto\",\"descripcion\":\"\",\"precio\":145,\"categoria_id\":8,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":141,\"nombre\":\"Filete Gratinado\",\"descripcion\":\"\",\"precio\":145,\"categoria_id\":8,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":148,\"nombre\":\"Camarón al Coco\",\"descripcion\":\"\",\"precio\":145,\"categoria_id\":9,\"imagen_url\":\"https://patijinich.com/es/wp-content/uploads/sites/3/2017/12/camarones-al-coco.jpg\",\"disponible\":true,\"orden\":0},{\"id\":147,\"nombre\":\"Camarón al Mojo de Ajo\",\"descripcion\":\"\",\"precio\":145,\"categoria_id\":9,\"imagen_url\":\"https://images.getrecipekit.com/20230115002211-21092021-xcd_1614-20-20editado.png?aspect_ratio\\\\u003d16:9\\\\u0026quality\\\\u003d90\\\\u0026\",\"disponible\":true,\"orden\":0},{\"id\":145,\"nombre\":\"Camarón Empanizado\",\"descripcion\":\"\",\"precio\":145,\"categoria_id\":9,\"imagen_url\":\"https://cdn.blog.paulinacocina.net/wp-content/uploads/2024/05/receta-de-camarones-empanizados-paulina-cocina-recetas-1722444280.jpg\",\"disponible\":true,\"orden\":0},{\"id\":146,\"nombre\":\"Camarón Gratinado\",\"descripcion\":\"\",\"precio\":155,\"categoria_id\":9,\"imagen_url\":\"https://restaurantearro.com/wp-content/uploads/2025/06/Filete-Gratinado-con-Camaron_v2-min.png\",\"disponible\":true,\"orden\":0},{\"id\":149,\"nombre\":\"Caldo de Camarón 1 Litro\",\"descripcion\":\"1 Litro\",\"precio\":155,\"categoria_id\":10,\"imagen_url\":\"https://mexicoenmicocina.com/wp-content/uploads/2017/05/1-2.jpg\",\"disponible\":true,\"orden\":0},{\"id\":150,\"nombre\":\"Caldo de Camarón 1/2 Litro\",\"descripcion\":\"1/2 Litro\",\"precio\":95,\"categoria_id\":10,\"imagen_url\":\"https://comedera.com/wp-content/uploads/sites/9/2023/01/caldo-de-camaron-mexicano-shutterstock_1333108010.jpg\",\"disponible\":true,\"orden\":0},{\"id\":151,\"nombre\":\"Caldo de Pescado 1 Litro\",\"descripcion\":\"1 Litro\",\"precio\":145,\"categoria_id\":10,\"imagen_url\":\"https://i.ytimg.com/vi/D8ByYtKjWi0/hq720.jpg?sqp\\\\u003d-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD\\\\u0026rs\\\\u003dAOn4CLB3g3lyjRlO1vOhj9K4ycfh4GVnBQ\",\"disponible\":true,\"orden\":0},{\"id\":152,\"nombre\":\"Caldo de Pescado 1/2 Litro\",\"descripcion\":\"1/2 Litro\",\"precio\":85,\"categoria_id\":10,\"imagen_url\":\"https://i.ytimg.com/vi/9NcII7FeKH4/maxresdefault.jpg\",\"disponible\":true,\"orden\":0},{\"id\":153,\"nombre\":\"Caldo Mixto 1 Litro\",\"descripcion\":\"1 Litro\",\"precio\":155,\"categoria_id\":10,\"imagen_url\":\"https://i.ytimg.com/vi/kSiEbXLjK2Q/maxresdefault.jpg\",\"disponible\":true,\"orden\":0},{\"id\":154,\"nombre\":\"Caldo Mixto 1/2 Litro\",\"descripcion\":\"1/2 Litro\",\"precio\":95,\"categoria_id\":10,\"imagen_url\":\"https://img-global.cpcdn.com/recipes/1b9c97a6b6809969/680x781cq80/caldo-de-camaron-mixto-foto-principal.jpg\",\"disponible\":true,\"orden\":0},{\"id\":156,\"nombre\":\"Consomé 1/2\",\"descripcion\":\"1/2\",\"precio\":75,\"categoria_id\":10,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":155,\"nombre\":\"Consomé Grande\",\"descripcion\":\"Grande\",\"precio\":120,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/1771705932838-4ltc5u.png\",\"disponible\":true,\"orden\":0},{\"id\":157,\"nombre\":\"Sopa de Mariscos\",\"descripcion\":\"\",\"precio\":200,\"categoria_id\":10,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":161,\"nombre\":\"Cebollas Empanizadas\",\"descripcion\":\"\",\"precio\":45,\"categoria_id\":11,\"imagen_url\":\"https://mylatinatable.com/wp-content/uploads/2016/01/foto-heroe-1024x693.jpg\",\"disponible\":true,\"orden\":0},{\"id\":158,\"nombre\":\"Mojarra Frita\",\"descripcion\":\"\",\"precio\":180,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":159,\"nombre\":\"Papas a la Francesa\",\"descripcion\":\"\",\"precio\":45,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":160,\"nombre\":\"Papas a la Francesa con Queso\",\"descripcion\":\"\",\"precio\":70,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":163,\"nombre\":\"Porción de Arroz\",\"descripcion\":\"\",\"precio\":15,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":166,\"nombre\":\"Refresco\",\"descripcion\":\"\",\"precio\":20,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":167,\"nombre\":\"Tostada de Aguachile\",\"descripcion\":\"\",\"precio\":65,\"categoria_id\":12,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":173,\"nombre\":\"Tostada de Atún\",\"descripcion\":\"\",\"precio\":120,\"categoria_id\":12,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":172,\"nombre\":\"Tostada de Camarón\",\"descripcion\":\"\",\"precio\":65,\"categoria_id\":12,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":168,\"nombre\":\"Tostada de Ceviche de Pez\",\"descripcion\":\"\",\"precio\":55,\"categoria_id\":12,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":171,\"nombre\":\"Tostada de Pulpo\",\"descripcion\":\"\",\"precio\":90,\"categoria_id\":12,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":170,\"nombre\":\"Tostada Mixta Ceviche Pez, Camarón y Pulpo \",\"descripcion\":\"\",\"precio\":100,\"categoria_id\":12,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":169,\"nombre\":\"Tostada Mixta Ceviche Pez/Camarón\",\"descripcion\":\"\",\"precio\":75,\"categoria_id\":12,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":180,\"nombre\":\"Agua Chile de Mango 1/2\",\"descripcion\":\"1/2\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"https://cdn7.kiwilimon.com/recetaimagen/29631/640x640/30928.jpg.jpg\",\"disponible\":true,\"orden\":0},{\"id\":181,\"nombre\":\"Agua Chile de Mango Grande\",\"descripcion\":\"Grande\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"https://chicanoeats.com/wp-content/uploads/2021/06/chicano-eats-14153.jpg\",\"disponible\":true,\"orden\":0},{\"id\":178,\"nombre\":\"Agua Chile Negro 1/2\",\"descripcion\":\"1/2\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"https://nibblesandfeasts.com/wp-content/uploads/2023/06/Aguachile-Negro-1.jpg\",\"disponible\":true,\"orden\":0},{\"id\":179,\"nombre\":\"Agua Chile Negro Grande\",\"descripcion\":\"Grande\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"https://i.ytimg.com/vi/crxmbRR3aQs/maxresdefault.jpg\",\"disponible\":true,\"orden\":0},{\"id\":174,\"nombre\":\"Agua Chile Rojo 1/2\",\"descripcion\":\"1/2\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"https://images.squarespace-cdn.com/content/v1/5ffcc1c8bfc8285d0384f741/1750729304916-IUIG0LQJK2JUHVV0POCN/Aguachile+Rojo+%40goatboyintl+7.jpg\",\"disponible\":true,\"orden\":0},{\"id\":175,\"nombre\":\"Agua Chile Rojo Grande\",\"descripcion\":\"Grande\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"https://i.ytimg.com/vi/Gk5-MH7WvKA/maxresdefault.jpg\",\"disponible\":true,\"orden\":0},{\"id\":176,\"nombre\":\"Agua Chile Verde 1/2\",\"descripcion\":\"1/2\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"https://30minutesmeals.com/wp-content/uploads/2022/09/fresh-aguachile-verde.jpg\",\"disponible\":true,\"orden\":0},{\"id\":177,\"nombre\":\"Agua Chile Verde Grande\",\"descripcion\":\"Grande\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"https://i.ytimg.com/vi/oqGxniYhLto/hq720.jpg?sqp\\\\u003d-oaymwE7CK4FEIIDSFryq4qpAy0IARUAAAAAGAElAADIQj0AgKJD8AEB-AH-CYAC0AWKAgwIABABGF8gZSg0MA8\\\\u003d\\\\u0026rs\\\\u003dAOn4CLAHymKptaLyXBfDteTuxiu6BHDupw\",\"disponible\":true,\"orden\":0},{\"id\":187,\"nombre\":\"Cóctel con Ceviche Grande\",\"descripcion\":\"Grande\",\"precio\":290,\"categoria_id\":14,\"imagen_url\":\"https://laroussecocina.mx/wp-content/uploads/2017/12/coctel-y-ceviche-de-mariscos-001-larousse-cocina.jpg.webp\",\"disponible\":true,\"orden\":0},{\"id\":186,\"nombre\":\"Cóctel con Ceviche Mediano\",\"descripcion\":\"Mediano\",\"precio\":150,\"categoria_id\":14,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":185,\"nombre\":\"Cóctel con Pulpo Grande\",\"descripcion\":\"Grande\",\"precio\":290,\"categoria_id\":14,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":184,\"nombre\":\"Cóctel con Pulpo Mediano\",\"descripcion\":\"Mediano\",\"precio\":150,\"categoria_id\":14,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":183,\"nombre\":\"Cóctel Grande\",\"descripcion\":\"\",\"precio\":230,\"categoria_id\":14,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":182,\"nombre\":\"Cóctel Mediano\",\"descripcion\":\"\",\"precio\":120,\"categoria_id\":14,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":189,\"nombre\":\"Ceviche de Pescado 1 Litro\",\"descripcion\":\"1 Litro\",\"precio\":250,\"categoria_id\":15,\"imagen_url\":\"https://media-cdn.tripadvisor.com/media/photo-s/19/77/73/67/litros-y-medios-litros.jpg\",\"disponible\":true,\"orden\":0},{\"id\":188,\"nombre\":\"Ceviche de Pescado 1/2\",\"descripcion\":\"1/2\",\"precio\":130,\"categoria_id\":15,\"imagen_url\":\"https://media-cdn.tripadvisor.com/media/photo-s/19/77/73/67/litros-y-medios-litros.jpg\",\"disponible\":true,\"orden\":0},{\"id\":191,\"nombre\":\"Ceviche Mixto Pez y Camarón 1 Litro\",\"descripcion\":\"1 Litro\",\"precio\":310,\"categoria_id\":15,\"imagen_url\":\"https://storage.googleapis.com/avena-recipes-v2/agtzfmF2ZW5hLWJvdHIZCxIMSW50ZXJjb21Vc2VyGICAgMW2rJ8LDA/30-03-2021/1617124296442.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":190,\"nombre\":\"Ceviche Mixto Pez y Camarón 1/2\",\"descripcion\":\"1/2\",\"precio\":160,\"categoria_id\":15,\"imagen_url\":\"https://storage.googleapis.com/avena-recipes-v2/agtzfmF2ZW5hLWJvdHIZCxIMSW50ZXJjb21Vc2VyGICAgMW2rJ8LDA/30-03-2021/1617124296442.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":193,\"nombre\":\"Ceviche Mixto Pez, Camarón y Pulpo 1 Litro\",\"descripcion\":\"1 Litro\",\"precio\":380,\"categoria_id\":15,\"imagen_url\":\"https://cdn0.recetasgratis.net/es/posts/9/9/6/ceviche_de_pescado_pulpo_y_camaron_58699_paso_5_600.jpg\",\"disponible\":true,\"orden\":0},{\"id\":192,\"nombre\":\"Ceviche Mixto Pez, Camarón y Pulpo 1/2\",\"descripcion\":\"1/2\",\"precio\":200,\"categoria_id\":15,\"imagen_url\":\"https://cdn0.recetasgratis.net/es/posts/9/9/6/ceviche_de_pescado_pulpo_y_camaron_58699_orig.jpg\",\"disponible\":true,\"orden\":0},{\"id\":195,\"nombre\":\"Ceviche Mixto Pez/Pulpo 1 Litro\",\"descripcion\":\"1 Litro\",\"precio\":380,\"categoria_id\":15,\"imagen_url\":\"https://i.ytimg.com/vi/WJlJhW8R2Ew/sddefault.jpg\",\"disponible\":true,\"orden\":0},{\"id\":194,\"nombre\":\"Ceviche Mixto Pez/Pulpo 1/2\",\"descripcion\":\"1/2\",\"precio\":200,\"categoria_id\":15,\"imagen_url\":\"https://cdn0.recetasgratis.net/es/posts/9/9/6/ceviche_de_pescado_pulpo_y_camaron_58699_orig.jpg\",\"disponible\":true,\"orden\":0},{\"id\":165,\"nombre\":\"Aderezo Extra\",\"descripcion\":\"\",\"precio\":5,\"categoria_id\":16,\"imagen_url\":\"https://www.unileverfoodsolutions.com.mx/tendencias/eficienciaencuaresma/aderezos-para-mariscos/jcr:content/parsys/set1/row2/span12/image_2115150458.img.jpg/1674109716651.jpg\",\"disponible\":true,\"orden\":0},{\"id\":164,\"nombre\":\"Salsa Extra\",\"descripcion\":\"\",\"precio\":5,\"categoria_id\":16,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":162,\"nombre\":\"Tostada Extra\",\"descripcion\":\"\",\"precio\":2,\"categoria_id\":16,\"imagen_url\":null,\"disponible\":true,\"orden\":0}]','2026-03-11 11:02:51','2026-02-21 10:09:58.134559','2026-03-11 11:02:50.000000','oscuro');
/*!40000 ALTER TABLE `menu_digital_snapshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mesa_asignaciones`
--

DROP TABLE IF EXISTS `mesa_asignaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mesa_asignaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mesa_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `user_id` int NOT NULL,
  `user_nombre` varchar(200) DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_92a02a8c4e6ac938067dee8596` (`tienda_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesa_asignaciones`
--

LOCK TABLES `mesa_asignaciones` WRITE;
/*!40000 ALTER TABLE `mesa_asignaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `mesa_asignaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mesas`
--

DROP TABLE IF EXISTS `mesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mesas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `numero` int NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `zona` varchar(100) DEFAULT NULL,
  `capacidad` int NOT NULL DEFAULT '4',
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_14346057106c5a63f176480db2` (`tenant_id`,`empresa_id`,`tienda_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesas`
--

LOCK TABLES `mesas` WRITE;
/*!40000 ALTER TABLE `mesas` DISABLE KEYS */;
/*!40000 ALTER TABLE `mesas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mesas_juntas`
--

DROP TABLE IF EXISTS `mesas_juntas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mesas_juntas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mesa_principal_id` int NOT NULL,
  `mesa_secundaria_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_8310949ee2222848e1229378b6` (`tienda_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesas_juntas`
--

LOCK TABLES `mesas_juntas` WRITE;
/*!40000 ALTER TABLE `mesas_juntas` DISABLE KEYS */;
/*!40000 ALTER TABLE `mesas_juntas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_caja`
--

DROP TABLE IF EXISTS `movimientos_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_caja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `caja_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `concepto` varchar(200) NOT NULL,
  `notas` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_fa3667fcb88a50ddfe4f39aa80` (`caja_id`),
  CONSTRAINT `FK_fa3667fcb88a50ddfe4f39aa800` FOREIGN KEY (`caja_id`) REFERENCES `cajas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_caja`
--

LOCK TABLES `movimientos_caja` WRITE;
/*!40000 ALTER TABLE `movimientos_caja` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimientos_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `producto_nombre` varchar(200) NOT NULL,
  `producto_sku` varchar(50) NOT NULL,
  `tipo` enum('entrada','salida','ajuste','devolucion') NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `stock_anterior` decimal(10,2) NOT NULL,
  `stock_nuevo` decimal(10,2) NOT NULL,
  `concepto` varchar(500) DEFAULT NULL,
  `usuario_id` int NOT NULL,
  `usuario_nombre` varchar(100) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_34e722a39e30087fa624b5955d` (`producto_id`),
  KEY `IDX_b164ce3750aaaba8f5e49e082e` (`tenant_id`,`empresa_id`,`tienda_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedido_detalles`
--

DROP TABLE IF EXISTS `pedido_detalles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_detalles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `producto_nombre` varchar(200) NOT NULL,
  `producto_sku` varchar(50) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) NOT NULL DEFAULT '0.00',
  `impuesto` decimal(10,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL,
  `modificadores` json DEFAULT NULL,
  `notas` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_5e6259e632098b78d455b9bff2` (`pedido_id`),
  CONSTRAINT `FK_5e6259e632098b78d455b9bff24` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido_detalles`
--

LOCK TABLES `pedido_detalles` WRITE;
/*!40000 ALTER TABLE `pedido_detalles` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedido_detalles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `folio` varchar(50) NOT NULL,
  `mesa` int NOT NULL,
  `estado` enum('recibido','en_elaboracion','listo_para_entrega','entregado','cancelado') NOT NULL DEFAULT 'recibido',
  `subtotal` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) NOT NULL DEFAULT '0.00',
  `impuestos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `notas` varchar(500) DEFAULT NULL,
  `cliente_nombre` varchar(200) DEFAULT NULL,
  `venta_id` int DEFAULT NULL,
  `usuario_nombre` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `self_order` tinyint NOT NULL DEFAULT '0',
  `mesero_id` int DEFAULT NULL,
  `mesero_nombre` varchar(200) DEFAULT NULL,
  `mesero_confirmado` tinyint NOT NULL DEFAULT '0',
  `encuesta_token` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_6dde461af02dbc411055f6011f` (`tienda_id`,`estado`),
  KEY `IDX_1386c9bb8690d9b47449219d3d` (`tenant_id`,`empresa_id`,`tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producto_tienda`
--

DROP TABLE IF EXISTS `producto_tienda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producto_tienda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `precio_local` decimal(10,2) DEFAULT NULL,
  `disponible` tinyint NOT NULL DEFAULT '1',
  `stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `IDX_8b200caae0b004b67731c12501` (`tenant_id`,`tienda_id`,`producto_id`),
  KEY `FK_533afe4c2d547a6ed9f38dec9b7` (`producto_id`),
  CONSTRAINT `FK_533afe4c2d547a6ed9f38dec9b7` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producto_tienda`
--

LOCK TABLES `producto_tienda` WRITE;
/*!40000 ALTER TABLE `producto_tienda` DISABLE KEYS */;
/*!40000 ALTER TABLE `producto_tienda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `sku` varchar(50) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `costo` decimal(10,2) DEFAULT NULL,
  `categoria_id` int DEFAULT NULL,
  `codigo_barras` varchar(50) DEFAULT NULL,
  `unidad` varchar(20) DEFAULT NULL,
  `impuesto_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `disponible` tinyint NOT NULL DEFAULT '1',
  `activo` tinyint NOT NULL DEFAULT '1',
  `controla_stock` tinyint NOT NULL DEFAULT '0',
  `stock_actual` decimal(10,2) NOT NULL DEFAULT '0.00',
  `stock_minimo` decimal(10,2) DEFAULT NULL,
  `orden` int NOT NULL DEFAULT '0',
  `modificadores` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `imagen_url` text,
  PRIMARY KEY (`id`),
  KEY `IDX_5b70474dda8aa40c28916b62e4` (`sku`,`tenant_id`,`empresa_id`),
  KEY `IDX_06e44dde74284af883347e26b9` (`tenant_id`,`empresa_id`),
  KEY `FK_5aaee6054b643e7c778477193a3` (`categoria_id`),
  CONSTRAINT `FK_5aaee6054b643e7c778477193a3` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=318 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (262,4,4,'PROD001','Filete Empanizado','Filete de pescado cubierto con empanizado crujiente y dorado al momento, servido caliente acompa├▒ado de papas ensalada y arroz',120.00,84.00,8,'7500000000001','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.583517','2026-03-17 13:28:09.050924','/api/uploads/img/mariscos213s/filete-empanizado.jpeg'),(263,4,4,'PROD002','Filete Gratinado','Filete de pescado cubierto con queso gratinado que se derrite sobre el pescado, creando un sabor cremoso acompa├▒ado de papas ensalada y arroz',145.00,101.50,8,'7500000000002','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.600668','2026-03-17 13:28:09.068070','/api/uploads/img/mariscos213s/filete-gratinado.jpeg'),(264,4,4,'PROD003','Filete al Mojo de Ajo','Filete de pescado salteado en mantequilla con ajo dorado soya y cilantro acompa├▒ado de papas ensalada y arroz',145.00,101.50,8,'7500000000003','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.616606','2026-03-17 13:28:09.074780','/api/uploads/img/mariscos213s/filete-al-mojo.jpeg'),(265,4,4,'PROD004','Filete a la Plancha','Filete fresco cocinado a la plancha con especias y un toque de lim├│n que resalta su sabor natural acompa├▒ado de papa ensalada y arroz',135.00,94.50,8,'7500000000004','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.634999','2026-03-17 13:28:09.079617','/api/uploads/img/mariscos213s/filete-al-mojo.jpeg'),(266,4,4,'PROD005','Filete Empanizado Mixto','Filete empanizado  y 2 a 3 camarones empanizados disfrutar una deliciosa combinaci├│n de mariscos acompa├▒ada de papas ensalada y arroz',145.00,101.50,8,'7500000000005','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.655453','2026-03-17 13:28:09.085012','/api/uploads/img/mariscos213s/filete-mixto.jpeg'),(267,4,4,'PROD006','Camarón Empanizado','Camarones cubiertos con empanizado dorado y crujiente, fritos al momento para mantener su jugosidad acompa├▒ado de papas ensalada y arroz',145.00,101.50,9,'7500000000006','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.672439','2026-03-17 13:28:09.089729','/api/uploads/img/mariscos213s/camarones-empanizados.jpeg'),(268,4,4,'PROD007','Camarón Gratinado','Camarones preparados con queso gratinado que aporta un sabor cremoso y delicioso acompa├▒ado de papas ensalada y arroz',155.00,108.50,9,'7500000000007','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.689969','2026-03-17 13:28:09.094944','/api/uploads/img/mariscos213s/camarones-gratinados.jpeg'),(269,4,4,'PROD008','Camarón al Mojo de Ajo','camarones preparados salteado en mantequilla con ajo dorado soya y cilantro acompa├▒ado de papas ensalada y arroz',145.00,101.50,9,'7500000000008','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.706161','2026-03-17 13:28:09.099965','/api/uploads/img/mariscos213s/camarones-diabla.jpeg'),(270,4,4,'PROD009','Camarón al Coco','Camarones empanizados con coco rallado que les da un toque crujiente y ligeramente dulce acompa├▒adocon salsa de mango papas arroz y ensalada',145.00,101.50,9,'7500000000009','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.721550','2026-03-17 13:28:09.104830','/api/uploads/img/mariscos213s/camaron.jpeg'),(271,4,4,'PROD010','Caldo de Camarón','Caldo caliente preparado con camarones frescos, verduras y especias que brindan un sabor intenso y reconfortante.',155.00,108.50,10,'7500000000010','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.737197','2026-03-17 13:28:09.110956','/api/uploads/img/mariscos213s/consome.jpeg'),(272,4,4,'PROD011','Caldo de Camarón','Caldo caliente preparado con camarones frescos, verduras y especias que brindan un sabor intenso y reconfortante.',95.00,66.50,10,'7500000000011','1/2 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.759414','2026-03-17 13:28:09.116950','/api/uploads/img/mariscos213s/consome.jpeg'),(273,4,4,'PROD012','Caldo de Pescado','caldo caliente con pescado fresco y verduras cocinadas en un caldo lleno de sabor.',145.00,101.50,10,'7500000000012','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.776962','2026-03-17 13:28:09.121476','/api/uploads/img/mariscos213s/caldo-de-pez.jpeg'),(274,4,4,'PROD013','Caldo de Pescado','caldo caliente con pescado fresco y verduras cocinadas en un caldo lleno de sabor.',85.00,59.50,10,'7500000000013','1/2 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.795789','2026-03-17 13:28:09.125857','/api/uploads/img/mariscos213s/caldo-de-pez.jpeg'),(275,4,4,'PROD014','Caldo Mixto','Caldo tradicional con mezcla de mariscos como camar├│n y pescado acompa├▒ado de verduras.',155.00,108.50,10,'7500000000014','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.813165','2026-03-17 13:28:09.130521','/api/uploads/img/mariscos213s/caldo-mixto.jpeg'),(276,4,4,'PROD015','Caldo Mixto','Caldo tradicional con mezcla de mariscos como camar├│n y pescado acompa├▒ado de verduras.',95.00,66.50,10,'7500000000015','1/2 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.829679','2026-03-17 13:28:09.136924','/api/uploads/img/mariscos213s/caldo-mixto.jpeg'),(277,4,4,'PROD016','Consomé','Caldo ligero preparado con especias y mariscos que brinda un sabor suave y reconfortante.',120.00,84.00,10,'7500000000016','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.851242','2026-03-17 13:28:09.143484','/api/uploads/img/mariscos213s/consome.jpeg'),(278,4,4,'PROD017','Consomé','Caldo ligero preparado con especias y mariscos que brinda un sabor suave y reconfortante.',75.00,52.50,10,'7500000000017','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.870327','2026-03-17 13:28:09.148276','/api/uploads/img/mariscos213s/consome.jpeg'),(279,4,4,'PROD018','Sopa de Mariscos','Deliciosa sopa preparada con variedad de mariscos en un caldo concentrado lleno de sabor.',200.00,140.00,10,'7500000000018','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.887533','2026-03-17 13:28:09.152643','/api/uploads/img/mariscos213s/sopa-de-mariscos.jpeg'),(280,4,4,'PROD019','Mojarra Frita','Mojarra entera frita hasta quedar dorada y crujiente por fuera, jugosa por dentro acompa├▒ada de papas arroz y ensalda',180.00,126.00,11,'7500000000019','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.903750','2026-03-17 13:28:09.157532',NULL),(281,4,4,'PROD020','Papas a la Francesa','Papas fritas doradas y crujientes, perfectas como acompa├▒amiento.',45.00,31.50,11,'7500000000020','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.916784','2026-03-17 13:28:09.162527',NULL),(282,4,4,'PROD021','Papas a la Francesa con Queso','Papas fritas cubiertas con queso derretido para un sabor extra delicioso.',70.00,49.00,11,'7500000000021','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.930323','2026-03-12 17:07:02.930323',NULL),(283,4,4,'PROD022','Cebollas Empanizadas','Aros de cebolla empanizados y fritos hasta quedar crujientes por fuera y suaves por dentro.',45.00,31.50,11,'7500000000022','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.943996','2026-03-12 17:07:02.943996',NULL),(284,4,4,'PROD023','Tostada Extra','paquete con 6 tostadas',2.00,1.40,11,'7500000000023','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.959465','2026-03-17 13:28:09.169379','/api/uploads/img/mariscos213s/tostada-con-todo.jpeg'),(285,4,4,'PROD024','Porción de Arroz',NULL,15.00,10.50,11,'7500000000024','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.977103','2026-03-12 17:07:02.977103',NULL),(286,4,4,'PROD025','Salsa Extra',NULL,5.00,3.50,11,'7500000000025','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.991483','2026-03-12 17:07:02.991483',NULL),(287,4,4,'PROD026','Aderezo Extra','',5.00,3.50,11,'7500000000026','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.008080','2026-03-12 18:33:23.000000','/api/uploads/producto-1773361992462-pk34.jpg'),(288,4,4,'PROD027','Refresco',NULL,20.00,14.00,11,'7500000000027','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.024344','2026-03-12 17:07:03.024344',NULL),(289,4,4,'PROD028','Tostada de Aguachile','Camar├│n fresco marinado en lim├│n con nuestra salsa especial (verde, roja, negra o mango) servido sobre tostada crujiente con pepino y cebolla.',65.00,45.50,12,'7500000000028','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.042967','2026-03-17 13:28:09.174217','/api/uploads/img/mariscos213s/tostada-de-ceviche.jpeg'),(290,4,4,'PROD029','Tostada de Ceviche de Pez','Pescado fresco marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.',55.00,38.50,12,'7500000000029','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.063388','2026-03-17 13:28:09.179652','/api/uploads/img/mariscos213s/tostiviche.jpeg'),(291,4,4,'PROD030','Tostada Mixta Ceviche Pez/Camarón','Pescado fresco y camaron marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.',75.00,52.50,12,'7500000000030','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.085654','2026-03-17 13:28:09.184527','/api/uploads/img/mariscos213s/tostada-mixta.jpeg'),(292,4,4,'PROD031','Tostada Mixta Ceviche Pez, Camarón y Pulpo','Pescado fresco y camaron y pulpo marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.',100.00,70.00,12,'7500000000031','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.120390','2026-03-17 13:28:09.190426','/api/uploads/img/mariscos213s/tostada-megalodon.jpeg'),(293,4,4,'PROD032','Tostada de Pulpo','Pulpo suave y fresco con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.',90.00,63.00,12,'7500000000032','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.135221','2026-03-17 13:28:09.195862','/api/uploads/img/mariscos213s/tostada-de-pulpo.jpeg'),(294,4,4,'PROD033','Tostada de Camarón','Camaron fresco en una tostada sobre una cama de pepino con aderezo de la casa y aguacate',65.00,45.50,12,'7500000000033','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.151767','2026-03-17 13:28:09.200715','/api/uploads/img/mariscos213s/tostada-de-camaron.jpeg'),(295,4,4,'PROD034','Tostada de Atún','Cubos de at├║n fresco preparados con salsas especiales y aguacate sobre tostada con un toque de cebolla empanizada',120.00,84.00,12,'7500000000034','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.167172','2026-03-17 13:28:09.207032','/api/uploads/img/mariscos213s/tostada-de-atun.jpeg'),(296,4,4,'PROD035','Agua Chile Rojo','Camarones frescos ba├▒ados en salsa roja picante con lim├│n, pepino y cebolla.',150.00,105.00,13,'7500000000035','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.181335','2026-03-17 13:28:09.213786','/api/uploads/img/mariscos213s/aguachile-rojo.jpeg'),(297,4,4,'PROD036','Agua Chile Rojo','Camarones frescos ba├▒ados en salsa roja picante con lim├│n, pepino y cebolla.',280.00,196.00,13,'7500000000036','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.193916','2026-03-17 13:28:09.219222','/api/uploads/img/mariscos213s/aguachile-rojo.jpeg'),(298,4,4,'PROD037','Agua Chile Verde','Camarones frescos en salsa verde de chile y cilantro con lim├│n y pepino.',150.00,105.00,13,'7500000000037','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.205682','2026-03-17 13:28:09.223728','/api/uploads/img/mariscos213s/aguachile-verde.jpeg'),(299,4,4,'PROD038','Agua Chile Verde','Camarones frescos en salsa verde de chile y cilantro con lim├│n y pepino.',280.00,196.00,13,'7500000000038','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.216570','2026-03-17 13:28:09.229419','/api/uploads/img/mariscos213s/aguachile-verde.jpeg'),(300,4,4,'PROD039','Agua Chile Negro','Camarones preparados con salsa oscura especial de la casa con un sabor intenso y ├║nico.',150.00,105.00,13,'7500000000039','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.231091','2026-03-17 13:28:09.233573','/api/uploads/img/mariscos213s/aguachile-negro.jpeg'),(301,4,4,'PROD040','Agua Chile Negro','Camarones preparados con salsa oscura especial de la casa con un sabor intenso y ├║nico.',280.00,196.00,13,'7500000000040','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.243774','2026-03-17 13:28:09.237824','/api/uploads/img/mariscos213s/aguachile-negro.jpeg'),(302,4,4,'PROD041','Agua Chile de Mango','Camarones frescos con salsa de mango, lim├│n y chile que combina lo dulce con lo picante.',150.00,105.00,13,'7500000000041','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.261418','2026-03-17 13:28:09.242771','/api/uploads/img/mariscos213s/aguachile-mango.jpeg'),(303,4,4,'PROD042','Agua Chile de Mango','Camarones frescos con salsa de mango, lim├│n y chile que combina lo dulce con lo picante.',280.00,196.00,13,'7500000000042','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.282824','2026-03-17 13:28:09.247028','/api/uploads/img/mariscos213s/aguachile-mango.jpeg'),(304,4,4,'PROD043','Cóctel Mediano','Camarones cocidos en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',120.00,84.00,14,'7500000000043','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.296953','2026-03-17 13:28:09.251543','/api/uploads/img/mariscos213s/coctel.jpeg'),(305,4,4,'PROD044','Cóctel Grande','Camarones cocidos en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',230.00,161.00,14,'7500000000044','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.311217','2026-03-17 13:28:09.255534','/api/uploads/img/mariscos213s/coctel-grande.jpeg'),(306,4,4,'PROD045','Cóctel con Pulpo','deliciosa mezcla de camarones y pulpo en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',150.00,105.00,14,'7500000000045','Mediano',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.324122','2026-03-17 13:28:09.259855','/api/uploads/img/mariscos213s/coctel.jpeg'),(307,4,4,'PROD046','Cóctel con Pulpo','deliciosa mezcla de camarones y pulpo en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',290.00,203.00,14,'7500000000046','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.336167','2026-03-17 13:28:09.266318','/api/uploads/img/mariscos213s/coctel-grande.jpeg'),(308,4,4,'PROD047','Cóctel con Ceviche','deliciosa mezcla de camarones y ceviche fresco en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',150.00,105.00,14,'7500000000047','Mediano',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.351173','2026-03-17 13:28:09.270509','/api/uploads/img/mariscos213s/coctel.jpeg'),(309,4,4,'PROD048','Cóctel con Ceviche','deliciosa mezcla de camarones y ceviche fresco en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',290.00,203.00,14,'7500000000048','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.364392','2026-03-17 13:28:09.275324','/api/uploads/img/mariscos213s/coctel-grande.jpeg'),(310,4,4,'PROD049','Ceviche de Pescado','Pescado fresco marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',130.00,91.00,15,'7500000000049','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.379245','2026-03-17 13:28:09.406316','/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg'),(311,4,4,'PROD050','Ceviche de Pescado','Pescado fresco marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',250.00,175.00,15,'7500000000050','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.400054','2026-03-17 13:28:09.412615','/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg'),(312,4,4,'PROD051','Ceviche Mixto Pez y Camarón','Pescado fresco con camaron marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',160.00,112.00,15,'7500000000051','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.417777','2026-03-17 13:28:09.417681','/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg'),(313,4,4,'PROD052','Ceviche Mixto Pez y Camarón','Pescado fresco con  marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',310.00,217.00,15,'7500000000052','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.432780','2026-03-17 13:28:09.422679','/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg'),(314,4,4,'PROD053','Ceviche Mixto Pez, Camarón y Pulpo','Pescado fresco con camaron y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',200.00,140.00,15,'7500000000053','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.447236','2026-03-17 13:28:09.428176','/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg'),(315,4,4,'PROD054','Ceviche Mixto Pez, Camarón y Pulpo','Pescado fresco con camaron y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',380.00,266.00,15,'7500000000054','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.459002','2026-03-17 13:28:09.432899','/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg'),(316,4,4,'PROD055','Ceviche Mixto Pez/Pulpo','Pescado fresco y  pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',200.00,140.00,15,'7500000000055','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.471753','2026-03-17 13:28:09.438382','/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg'),(317,4,4,'PROD056','Ceviche Mixto Pez/Pulpo','Pescado fresco y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',380.00,266.00,15,'7500000000056','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.484311','2026-03-17 13:28:09.443559','/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `razon_social` varchar(200) DEFAULT NULL,
  `rfc` varchar(20) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_2310ecc5cb8be427097154b18f` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'iaDoS Corp','iados-corp','iaDoS - Inteligencia Artificial DevOps Solutions',NULL,NULL,'555-IADOS','info@iados.mx',NULL,1,'2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000'),(4,'Mariscos 2-13\'s San Miguel','mariscos-2-13\'s-san-miguel','Mariscos 2-13\'s San Miguel','',NULL,'8318989580','contacto@mariscos213s.com',NULL,1,'2026-02-18 05:30:37.689786','2026-02-18 05:30:37.689786');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_configs`
--

DROP TABLE IF EXISTS `ticket_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int DEFAULT NULL,
  `tienda_id` int DEFAULT NULL,
  `encabezado_linea1` varchar(200) DEFAULT NULL,
  `encabezado_linea2` varchar(200) DEFAULT NULL,
  `encabezado_linea3` varchar(200) DEFAULT NULL,
  `pie_linea1` varchar(500) DEFAULT NULL,
  `pie_linea2` varchar(500) DEFAULT NULL,
  `ancho_papel` int NOT NULL DEFAULT '80',
  `columnas` int NOT NULL DEFAULT '42',
  `mostrar_logo` tinyint NOT NULL DEFAULT '1',
  `mostrar_fecha` tinyint NOT NULL DEFAULT '1',
  `mostrar_cajero` tinyint NOT NULL DEFAULT '1',
  `mostrar_folio` tinyint NOT NULL DEFAULT '1',
  `mostrar_marca_iados` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `logo_url` text,
  `fuente_familia` varchar(100) NOT NULL DEFAULT 'Courier New',
  `fuente_tamano` int NOT NULL DEFAULT '9',
  `logo_posicion` varchar(20) NOT NULL DEFAULT 'centro',
  PRIMARY KEY (`id`),
  KEY `IDX_3b407c46f6f31c07cd7046557f` (`tenant_id`,`empresa_id`,`tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_configs`
--

LOCK TABLES `ticket_configs` WRITE;
/*!40000 ALTER TABLE `ticket_configs` DISABLE KEYS */;
INSERT INTO `ticket_configs` VALUES (1,1,NULL,NULL,'Restaurante Demo iaDoS','Av. Principal #123, Centro','Tel: 555-IADOS','Gracias por su preferencia!','Desarrollado por iaDoS - iados.mx',80,42,1,1,1,1,1,'2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL,'Courier New',9,'centro'),(2,4,NULL,NULL,'Mariscos 2-13\'s ','San Miguel','Apodaca Nuevo Leon Suc. #1','Gracias por su compra','Desarrollado por iaDoS..mx',80,42,1,1,1,1,1,'2026-02-18 06:53:31.287000','2026-02-18 06:53:31.287000','/api/uploads/logo-ticket-1771400947812.jpeg','Consolas',9,'centro');
/*!40000 ALTER TABLE `ticket_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tiendas`
--

DROP TABLE IF EXISTS `tiendas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tiendas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `zona_horaria` varchar(50) DEFAULT NULL,
  `config_ticket` json DEFAULT NULL,
  `config_impresora` json DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `config_pos` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_14ac7ede89ea2e148e1a72ea1d` (`tenant_id`,`empresa_id`),
  KEY `FK_fc2d97946b484dafe8301319786` (`empresa_id`),
  CONSTRAINT `FK_fc2d97946b484dafe8301319786` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tiendas`
--

LOCK TABLES `tiendas` WRITE;
/*!40000 ALTER TABLE `tiendas` DISABLE KEYS */;
INSERT INTO `tiendas` VALUES (3,4,4,'Mariscos 2-13\'s San Miguel','Apodaca','8318989580','contacto@mariscos213s.com','America/Mexico_City',NULL,'{\"ancho\": 80, \"copias\": 1, \"modelo\": \"\", \"auto_print\": false}',1,'2026-02-18 05:32:42.162669','2026-03-11 19:38:41.000000','{\"num_mesas\": 20, \"iva_enabled\": false, \"iva_incluido\": true, \"modo_servicio\": \"autoservicio\", \"iva_porcentaje\": 16, \"tipo_cobro_mesa\": \"post_pago\"}');
/*!40000 ALTER TABLE `tiendas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `empresa_id` int DEFAULT NULL,
  `tienda_id` int DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('superadmin','admin','manager','cajero','mesero') NOT NULL DEFAULT 'cajero',
  `pin` varchar(20) DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `ultimo_login` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_4a1e826dc164ebf584d8604d17` (`tenant_id`,`empresa_id`),
  KEY `IDX_e9f4c2efab52114c4e99e28efb` (`tenant_id`,`email`),
  CONSTRAINT `FK_109638590074998bb72a2f2cf08` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,1,1,'Super Admin','admin@iados.mx','$2a$10$vxlPjwiQUu/dK/gyUB.DI.2HJakEqGynxOjwwqZZpCax8dOqRuvoy','superadmin','0000',1,'2026-03-11 22:58:15','2026-02-17 07:49:37.000000','2026-03-11 22:58:14.000000'),(2,1,1,1,'Administrador','admin2@iados.mx','$2a$10$vxlPjwiQUu/dK/gyUB.DI.2HJakEqGynxOjwwqZZpCax8dOqRuvoy','admin','1111',1,'2026-03-12 15:06:48','2026-02-17 07:49:37.000000','2026-03-12 15:06:48.000000'),(3,1,1,1,'Cajero Demo','cajero@iados.mx','$2a$10$2GE3so4U7kcdP5u0xd97QO7IeIripbjEuSqdAHqugrpKnxQOgskl6','cajero','1234',1,NULL,'2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000'),(4,1,1,1,'Mesero Demo','mesero@iados.mx','$2a$10$2GE3so4U7kcdP5u0xd97QO7IeIripbjEuSqdAHqugrpKnxQOgskl6','mesero','5678',1,NULL,'2026-02-17 07:49:37.000000','2026-02-17 22:47:12.000000'),(7,4,4,3,'Mariscos 2-13\'s San Miguel','admin@mariscos213s.com','$2a$10$vxlPjwiQUu/dK/gyUB.DI.2HJakEqGynxOjwwqZZpCax8dOqRuvoy','admin','1234',1,'2026-03-12 18:33:02','2026-02-18 05:32:42.393333','2026-03-12 18:33:02.000000'),(10,4,4,3,'cajero','cajero@mariscos213s.com','$2a$10$3.P56QWzYdgjpOpo6ZwerOc8noiRSGZEMkjU2LDBeXx1nGmq19o3y','cajero','1234',1,'2026-03-11 22:59:08','2026-03-11 19:54:08.681757','2026-03-11 22:59:08.000000'),(11,4,4,3,'Mesero','mesero@mariscos213s.com','$2a$10$AQ4S.WgGZwPIM5gdMmPzIOXTNTXw0aL84hP.e5iplVE/vvsC4jVzq','mesero','1234',1,NULL,'2026-03-11 19:57:27.072260','2026-03-11 19:57:27.072260');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venta_detalles`
--

DROP TABLE IF EXISTS `venta_detalles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venta_detalles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `producto_nombre` varchar(200) NOT NULL,
  `producto_sku` varchar(50) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) NOT NULL DEFAULT '0.00',
  `impuesto` decimal(10,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL,
  `modificadores` json DEFAULT NULL,
  `notas` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_4edde3f0f455374c9d44eb6dbc` (`venta_id`),
  CONSTRAINT `FK_4edde3f0f455374c9d44eb6dbc7` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta_detalles`
--

LOCK TABLES `venta_detalles` WRITE;
/*!40000 ALTER TABLE `venta_detalles` DISABLE KEYS */;
/*!40000 ALTER TABLE `venta_detalles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venta_pagos`
--

DROP TABLE IF EXISTS `venta_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venta_pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `metodo` enum('efectivo','tarjeta','transferencia','mixto') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_6d14801a0c30ebdb8f3fe4554e` (`venta_id`),
  CONSTRAINT `FK_6d14801a0c30ebdb8f3fe4554eb` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta_pagos`
--

LOCK TABLES `venta_pagos` WRITE;
/*!40000 ALTER TABLE `venta_pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `venta_pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `empresa_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  `caja_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `folio` varchar(50) NOT NULL,
  `folio_offline` varchar(50) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) NOT NULL DEFAULT '0.00',
  `impuestos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta','transferencia','mixto') NOT NULL DEFAULT 'efectivo',
  `pago_efectivo` decimal(10,2) DEFAULT NULL,
  `pago_tarjeta` decimal(10,2) DEFAULT NULL,
  `pago_transferencia` decimal(10,2) DEFAULT NULL,
  `cambio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estado` enum('completada','cancelada','pendiente') NOT NULL DEFAULT 'completada',
  `notas` varchar(500) DEFAULT NULL,
  `cliente_nombre` varchar(200) DEFAULT NULL,
  `sincronizado` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `pedido_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_8fb7c3b36bfd543df1075e77d1` (`folio`,`tenant_id`),
  KEY `IDX_ec7e16dd98e707f583479ded42` (`tenant_id`,`created_at`),
  KEY `IDX_45d0576fcc0f59d9b584584362` (`tenant_id`,`empresa_id`,`tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'pos_iados'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-17 15:00:00
