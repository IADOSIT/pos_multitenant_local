-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: 74.208.149.7    Database: pos_iados
-- ------------------------------------------------------
-- Server version	8.0.45

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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
INSERT INTO `auditoria` VALUES (9,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',16,NULL,'{\"folio\": \"V-MLROGPNC\", \"items\": 5, \"total\": 466.32}',NULL,'2026-02-18 06:55:16.515352'),(10,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',17,NULL,'{\"folio\": \"V-MLROTL1J\", \"items\": 2, \"total\": 336.4}',NULL,'2026-02-18 07:05:17.057016'),(11,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',18,NULL,'{\"folio\": \"V-MLRP26CS\", \"items\": 2, \"total\": 250}',NULL,'2026-02-18 07:11:57.938748'),(12,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',19,NULL,'{\"folio\": \"V-MLRP31A3\", \"items\": 3, \"total\": 325}',NULL,'2026-02-18 07:12:38.007447'),(13,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',20,NULL,'{\"folio\": \"V-MLRPLPUO\", \"items\": 3, \"total\": 350}',NULL,'2026-02-18 07:27:09.664816'),(14,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',21,NULL,'{\"folio\": \"V-MLRQ7JPE\", \"items\": 5, \"total\": 702}',NULL,'2026-02-18 07:44:08.149514'),(17,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',24,NULL,'{\"folio\": \"V-MMMGD33A\", \"items\": 3, \"total\": 1535}',NULL,'2026-03-11 13:49:21.862832'),(18,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',25,NULL,'{\"folio\": \"V-MMMGN4VA\", \"items\": 3, \"total\": 605}',NULL,'2026-03-11 13:57:10.780341'),(19,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',26,NULL,'{\"folio\": \"V-MMMKORBM\", \"items\": 5, \"total\": 685}',NULL,'2026-03-11 15:50:25.023143'),(20,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',27,NULL,'{\"folio\": \"V-MMMKT9SW\", \"items\": 8, \"total\": 1030}',NULL,'2026-03-11 15:53:55.634783'),(21,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',28,NULL,'{\"folio\": \"IM00000001\", \"items\": 3, \"total\": 370}',NULL,'2026-03-19 09:19:41.290758'),(22,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',29,NULL,'{\"folio\": \"IM00000002\", \"items\": 4, \"total\": 540}',NULL,'2026-03-19 09:20:00.265666'),(23,4,4,3,10,'cajero','crear','venta',30,NULL,'{\"folio\": \"IM00000003\", \"items\": 3, \"total\": 370}',NULL,'2026-03-20 18:22:17.105743'),(24,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',31,NULL,'{\"folio\": \"IM00000004\", \"items\": 2, \"total\": 580}',NULL,'2026-04-14 07:48:19.678472'),(25,6,5,4,15,'Regina','crear','venta',32,NULL,'{\"folio\": \"IR00000001\", \"items\": 3, \"total\": 0}',NULL,'2026-04-14 08:36:14.828692'),(26,6,5,4,17,'Cajero Carbon','crear','venta',33,NULL,'{\"folio\": \"IR00000002\", \"items\": 1, \"total\": 0}',NULL,'2026-04-14 08:39:39.429477'),(27,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',34,NULL,'{\"folio\": \"IM00000005\", \"items\": 2, \"total\": 215}',NULL,'2026-04-14 09:12:24.111929'),(28,4,4,3,7,'Mariscos 2-13\'s San Miguel','crear','venta',35,NULL,'{\"folio\": \"IM00000006\", \"items\": 2, \"total\": 215}',NULL,'2026-04-14 15:16:04.630496'),(29,6,5,4,15,'Regina','crear','venta',36,NULL,'{\"folio\": \"IR00000003\", \"items\": 2, \"total\": 80}',NULL,'2026-04-14 15:35:41.305012'),(30,6,5,4,17,'Cajero Carbon','crear','venta',37,NULL,'{\"folio\": \"IR00000004\", \"items\": 3, \"total\": 94}',NULL,'2026-04-14 16:05:08.832790'),(31,6,5,4,17,'Cajero Carbon','crear','venta',38,NULL,'{\"folio\": \"IR00000005\", \"items\": 2, \"total\": 710}',NULL,'2026-04-14 16:07:37.111225'),(32,6,5,4,17,'Cajero Carbon','crear','venta',39,NULL,'{\"folio\": \"IR00000006\", \"items\": 1, \"total\": 180}',NULL,'2026-04-14 16:08:02.608854'),(33,6,5,4,17,'Cajero Carbon','crear','venta',40,NULL,'{\"folio\": \"IR00000007\", \"items\": 1, \"total\": 315}',NULL,'2026-04-14 16:18:33.588066'),(34,6,5,4,15,'Regina','crear','venta',41,NULL,'{\"folio\": \"IR00000008\", \"items\": 1, \"total\": 280}',NULL,'2026-04-14 16:21:43.121466'),(35,6,5,4,15,'Regina','crear','venta',42,NULL,'{\"folio\": \"IR00000009\", \"items\": 1, \"total\": 175}',NULL,'2026-04-14 16:30:04.650066'),(36,6,5,4,15,'Regina','crear','venta',43,NULL,'{\"folio\": \"IR00000010\", \"items\": 2, \"total\": 80}',NULL,'2026-04-14 16:43:42.958822'),(37,6,5,4,17,'Cajero Carbon','crear','venta',44,NULL,'{\"folio\": \"IR00000011\", \"items\": 3, \"total\": 813}',NULL,'2026-04-14 17:02:17.647753'),(38,6,5,4,15,'Regina','crear','venta',45,NULL,'{\"folio\": \"IR00000012\", \"items\": 3, \"total\": 159}',NULL,'2026-04-14 17:13:00.350511'),(39,6,5,4,16,'Cajero Hielo','crear','venta',46,NULL,'{\"folio\": \"IR00000013\", \"items\": 1, \"total\": 350}',NULL,'2026-04-14 17:24:05.281941'),(40,6,5,4,15,'Regina','crear','venta',47,NULL,'{\"folio\": \"IR00000001\", \"items\": 3, \"total\": 168}',NULL,'2026-04-14 18:57:15.074704'),(41,6,5,4,15,'Regina','crear','venta',48,NULL,'{\"folio\": \"IR00000002\", \"items\": 3, \"total\": 144}',NULL,'2026-04-14 19:52:34.150128'),(42,6,5,4,15,'Regina','crear','venta',49,NULL,'{\"folio\": \"IR00000003\", \"items\": 1, \"total\": 280}',NULL,'2026-04-14 20:42:30.359725');
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
  `sftp_enabled` tinyint NOT NULL DEFAULT '0',
  `sftp_host` varchar(255) DEFAULT 'https://sftp.iados.online',
  `sftp_port` int DEFAULT '22',
  `sftp_usuario` varchar(100) DEFAULT 'admin',
  `sftp_password` varchar(255) DEFAULT NULL,
  `sftp_directorio` varchar(500) DEFAULT '/pos-iados/backups',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_configs`
--

LOCK TABLES `backup_configs` WRITE;
/*!40000 ALTER TABLE `backup_configs` DISABLE KEYS */;
INSERT INTO `backup_configs` VALUES (1,1,'15:00',7,1,1,0,NULL,'2026-04-14 19:55:06','ok',1,'https://sftp.iados.online',22,'admin','2oYjsKtOzI7Y_Hmo','/pos-iados/backups');
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
  `sftp_subido` tinyint NOT NULL DEFAULT '0',
  `sftp_error` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_logs`
--

LOCK TABLES `backup_logs` WRITE;
/*!40000 ALTER TABLE `backup_logs` DISABLE KEYS */;
INSERT INTO `backup_logs` VALUES (1,'excel','backup-excel-2026-03-11T21-51-24.xlsx',12652,'ok',NULL,0,'2026-03-11 15:51:25.221578',0,NULL),(2,'excel','backup-excel-2026-03-11T21-51-26.xlsx',12652,'ok',NULL,0,'2026-03-11 15:51:26.946499',0,NULL),(3,'db','',NULL,'error','mysqldump: mysqldump: [Warning] Using a password on the command line interface can be insecure.\r\nmysqldump: [ERROR] unknown option \'--skip-ssl\'.\r\n',0,'2026-03-11 15:51:29.960952',0,NULL),(4,'db','',NULL,'error','mysqldump: mysqldump: [Warning] Using a password on the command line interface can be insecure.\r\nmysqldump: [ERROR] unknown option \'--skip-ssl\'.\r\n',0,'2026-03-11 15:51:56.008268',0,NULL),(5,'excel','backup-excel-2026-03-11T21-51-56.xlsx',12652,'ok',NULL,0,'2026-03-11 15:51:56.130361',0,NULL),(6,'db','',NULL,'error','mysqldump: mysqldump: [Warning] Using a password on the command line interface can be insecure.\r\nmysqldump: Couldn\'t execute \'FLUSH /*!40101 LOCAL */ TABLES\': Access denied; you need (at least one of) the RELOAD or FLUSH_TABLES privilege(s) for this operation (1227)\r\n',0,'2026-03-11 15:54:07.468288',0,NULL),(7,'excel','backup-excel-2026-03-11T21-54-12.xlsx',12972,'ok',NULL,0,'2026-03-11 15:54:13.147418',0,NULL),(8,'db','',NULL,'error','mysqldump: mysqldump: [Warning] Using a password on the command line interface can be insecure.\r\nmysqldump: Couldn\'t execute \'FLUSH /*!40101 LOCAL */ TABLES\': Access denied; you need (at least one of) the RELOAD or FLUSH_TABLES privilege(s) for this operation (1227)\r\n',0,'2026-03-11 15:54:16.401059',0,NULL),(9,'excel','backup-excel-2026-03-11T21-54-16.xlsx',12972,'ok',NULL,0,'2026-03-11 15:54:16.540582',0,NULL),(10,'db','backup-db-2026-03-12T01-30-31.sql',100253,'ok',NULL,0,'2026-03-11 19:30:31.764555',0,NULL),(11,'db','backup-db-2026-03-12T01-31-33.sql',100344,'ok',NULL,0,'2026-03-11 19:31:33.742542',0,NULL),(12,'db','backup-db-2026-03-17T21-00-00.sql',99477,'ok',NULL,0,'2026-03-17 15:00:01.019917',0,NULL),(13,'excel','backup-excel-2026-03-17T21-00-01.xlsx',8913,'ok',NULL,0,'2026-03-17 15:00:01.198233',0,NULL),(14,'db','',NULL,'error','mysqldump no encontrado: spawn mysqldump ENOENT',0,'2026-03-18 21:35:53.031179',0,NULL),(15,'db','',NULL,'error','mysqldump no encontrado: spawn mysqldump ENOENT',0,'2026-03-18 21:36:01.692262',0,NULL),(16,'excel','backup-excel-2026-03-18T21-36-01.xlsx',8912,'ok',NULL,0,'2026-03-18 21:36:01.788082',0,NULL),(17,'db','backup-e4-2026-03-19T08-28-24.sql',55821,'ok',NULL,0,'2026-03-19 08:28:24.708574',0,NULL),(18,'excel','backup-excel-e4-2026-03-19T08-28-24.xlsx',11518,'ok',NULL,0,'2026-03-19 08:28:24.826541',0,NULL),(19,'db','backup-tenundefined-2026-03-20T15-00-00.sql',229,'ok',NULL,0,'2026-03-20 15:00:00.031774',0,NULL),(20,'excel','backup-excel-full-2026-03-20T15-00-00.xlsx',11963,'ok',NULL,0,'2026-03-20 15:00:00.182506',0,NULL),(21,'db','backup-tenundefined-2026-03-21T15-00-00.sql',229,'ok',NULL,0,'2026-03-21 15:00:00.013964',0,NULL),(22,'excel','backup-excel-full-2026-03-21T15-00-00.xlsx',12132,'ok',NULL,0,'2026-03-21 15:00:00.136372',0,NULL),(61,'db','backup-2026-04-08T15-00-00.sql',262,'ok',NULL,0,'2026-04-08 15:00:00.245572',0,NULL),(62,'excel','backup-excel-full-2026-04-08T15-00-00.xlsx',12133,'ok',NULL,0,'2026-04-08 15:00:00.408930',0,NULL),(63,'db','backup-2026-04-09T15-00-00.sql',262,'ok',NULL,0,'2026-04-09 15:00:00.319994',0,NULL),(64,'excel','backup-excel-full-2026-04-09T15-00-00.xlsx',12133,'ok',NULL,0,'2026-04-09 15:00:00.445322',0,NULL),(65,'db','backup-2026-04-10T15-00-00.sql',262,'ok',NULL,0,'2026-04-10 15:00:00.256878',0,NULL),(66,'excel','backup-excel-full-2026-04-10T15-00-00.xlsx',12132,'ok',NULL,0,'2026-04-10 15:00:00.371598',0,NULL),(67,'db','backup-2026-04-11T15-00-00.sql',262,'ok',NULL,0,'2026-04-11 15:00:00.280071',0,NULL),(68,'excel','backup-excel-full-2026-04-11T15-00-00.xlsx',12132,'ok',NULL,0,'2026-04-11 15:00:00.426040',0,NULL),(69,'db','backup-2026-04-12T15-00-00.sql',262,'ok',NULL,0,'2026-04-12 15:00:00.284668',0,NULL),(70,'excel','backup-excel-full-2026-04-12T15-00-00.xlsx',12132,'ok',NULL,0,'2026-04-12 15:00:00.408649',0,NULL),(71,'db','backup-2026-04-13T15-00-00.sql',262,'ok',NULL,0,'2026-04-13 15:00:00.407094',0,NULL),(72,'excel','backup-excel-full-2026-04-13T15-00-00.xlsx',12132,'ok',NULL,0,'2026-04-13 15:00:00.615067',0,NULL),(73,'db','backup-2026-04-14T15-00-00.sql',262,'ok',NULL,0,'2026-04-14 15:00:00.371604',0,NULL),(74,'excel','backup-excel-full-2026-04-14T15-00-00.xlsx',13057,'ok',NULL,0,'2026-04-14 15:00:00.568827',0,NULL),(75,'db','Regina-2026-04-14T19-55-06.sql',39837,'ok',NULL,0,'2026-04-14 19:55:06.204082',0,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cajas`
--

LOCK TABLES `cajas` WRITE;
/*!40000 ALTER TABLE `cajas` DISABLE KEYS */;
INSERT INTO `cajas` VALUES (9,4,4,3,7,'Caja-18/2/2026','cerrada',100.00,2429.72,0.00,0.00,2529.72,100.00,-2429.72,'2026-02-18 06:54:59','2026-02-18 07:45:21',NULL,'2026-02-18 06:54:58.957887','2026-02-18 07:45:20.000000'),(10,4,4,3,7,'Caja-11/3/2026','cerrada',0.00,3855.00,0.00,0.00,0.00,0.00,0.00,'2026-03-11 13:43:54','2026-03-19 09:18:53',NULL,'2026-03-11 13:43:54.169072','2026-03-19 09:18:53.000000'),(12,4,4,3,7,'Caja-19/3/2026','cerrada',0.00,910.00,0.00,0.00,910.00,0.00,-910.00,'2026-03-19 09:19:34','2026-03-19 09:20:19',NULL,'2026-03-19 09:19:34.068076','2026-03-19 09:20:19.000000'),(13,4,4,3,10,'Caja-20/3/2026','abierta',0.00,1380.00,0.00,0.00,NULL,NULL,NULL,'2026-03-20 18:22:10',NULL,NULL,'2026-03-20 18:22:09.641575','2026-04-14 15:16:04.000000'),(14,6,5,4,15,'Caja-14/4/2026','abierta',100.00,3828.00,200.00,0.00,NULL,NULL,NULL,'2026-04-14 08:35:14',NULL,NULL,'2026-04-14 08:35:14.121007','2026-04-14 20:42:29.000000');
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
  `modulo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_310ef994cfa94ec2fc37da62ef` (`tenant_id`,`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,1,1,'Hamburguesas',NULL,'#FF6B35','burger',1,1,0,'','2026-02-17 07:49:37.000000','2026-02-18 01:13:44.000000','https://img.hogar.mapfre.es/wp-content/uploads/2018/09/hamburguesa-sencilla.jpg',NULL),(2,1,1,'Pizzas',NULL,'#E8272C','pizza',2,1,0,'','2026-02-17 07:49:37.000000','2026-02-18 01:24:08.000000','https://www.sortirambnens.com/wp-content/uploads/2019/02/pizza-de-peperoni.jpg',NULL),(3,1,1,'Tacos',NULL,'#FFA500','taco',3,1,0,NULL,'2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL,NULL),(4,1,1,'Ensaladas',NULL,'#4CAF50','salad',4,1,0,NULL,'2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL,NULL),(5,1,1,'Bebidas',NULL,'#2196F3','drink',5,1,1,'bebidas','2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL,NULL),(6,1,1,'Postres',NULL,'#E91E63','cake',6,1,1,'postres','2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL,NULL),(7,1,1,'Extras',NULL,'#9C27B0','plus',7,1,1,'adicionales','2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL,NULL),(8,4,4,'Filetes',NULL,'#3b82f6','',1,1,0,'','2026-02-18 05:42:13.853301','2026-02-18 05:42:13.853301','https://carnescesareogomez.es/wp-content/uploads/2019/07/018-carnescesareogomez-filetes-ternera-rosada-scaled.jpg',NULL),(9,4,4,'Camarones',NULL,'#3b82f6','',3,1,0,'','2026-02-18 05:42:47.180654','2026-02-18 05:43:28.000000','https://recetascanarias.net/wp-content/uploads/2025/08/camarones-cocidos-al-estilo-canario.webp',NULL),(10,4,4,'Caldos',NULL,'#3b82f6','',2,1,0,'','2026-02-18 05:43:16.395038','2026-02-18 05:43:16.395038','https://mojo.generalmills.com/api/public/content/G4xwfLpM6USzSPKYomXZtQ_gmi_hi_res_jpeg.jpeg?v\\u003d5fd6073b\\u0026t\\u003d16e3ce250f244648bef28c5949fb99ff',NULL),(11,4,4,'Adicionales',NULL,'#3b82f6','',9,0,0,'','2026-02-18 05:43:53.781047','2026-02-18 06:27:49.000000','https://www.shutterstock.com/image-vector/dollar-plus-sign-additional-financing-600nw-2198715909.jpg',NULL),(12,4,4,'Tostadas',NULL,'#3b82f6','',4,1,0,'','2026-02-18 05:44:16.863815','2026-02-18 05:44:16.863815','https://guerrerotortillas.com/wp-content/uploads/2021/04/beef-tostadas.jpg',NULL),(13,4,4,'Aguachile',NULL,'#3b82f6','',5,1,0,'','2026-02-18 05:44:43.182900','2026-02-18 05:44:43.182900','https://www.chilipeppermadness.com/wp-content/uploads/2025/11/Aguachile-Recipe-SQ.jpg',NULL),(14,4,4,'Cocteles',NULL,'#f67d3c','',6,1,0,'','2026-02-18 05:45:22.358359','2026-03-17 17:35:29.938877','https://www.muydelish.com/wp-content/uploads/2024/08/mexican-shrimp-cocktail.jpg',NULL),(15,4,4,'Ceviches',NULL,'#3b82f6','',7,1,0,'','2026-02-18 05:46:16.299140','2026-02-18 05:46:16.299140','https://i.ytimg.com/vi/T0-clkZMi4I/maxresdefault.jpg',NULL),(16,4,4,'Extras',NULL,'#0feb16','',10,1,1,'','2026-02-18 06:20:30.826824','2026-02-18 06:20:30.826824','https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgCC7E-fr6TmU_t0b-orKC5KyByDL6QQ_Puskxi3zhcvBCncGL2bHkCsCtgyWbmSZhi4FvprIWg_TZQ41oslurUyol5g8zjwRoou-oJloFqD7duTwcV6Klj9VV3swgIMptjq9w8RWRpfrGf/w1200-h630-p-k-no-nu/299881_294342510588372_100000378759302_965055_1680279504_n.jpg',NULL),(17,4,4,'Bebidas',NULL,'#5f6063','',11,1,1,'','2026-02-18 06:21:16.246893','2026-02-18 06:21:16.246893','https://hips.hearstapps.com/hmg-prod/images/refrescos-portada-1653207586.jpg',NULL),(18,1,1,'Mariscos',NULL,NULL,NULL,0,1,0,NULL,'2026-03-12 15:07:29.200542','2026-03-12 15:07:29.200542',NULL,NULL),(19,6,5,'Carbón',NULL,'#a6a8ab','Flame',90,1,0,'','2026-04-14 07:59:00.826162','2026-04-14 15:39:05.000000',NULL,NULL),(20,6,5,'Hielo',NULL,'#0ea5e9','Snowflake',91,1,0,NULL,'2026-04-14 07:59:00.830699','2026-04-14 07:59:00.830699',NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (1,1,'Restaurante Demo iaDoS','Restaurante Demo SA de CV',NULL,NULL,NULL,NULL,NULL,1,'2026-02-17 07:49:37.000000','2026-02-21 17:42:09.000000',NULL),(4,4,'Mariscos 2-13\'s San Miguel',NULL,NULL,NULL,NULL,NULL,'/api/uploads/logo-empresa-4-1771392896645.jpeg',1,'2026-02-18 05:32:42.126201','2026-02-20 08:46:49.000000','{\"tema\": \"default\", \"paleta\": \"default\"}'),(5,6,'Regina',NULL,NULL,NULL,NULL,NULL,'/api/uploads/logo-empresa-5-1776183198921-c1ot.jpg',1,'2026-04-14 07:58:40.552123','2026-04-14 16:13:18.000000','{\"tema\": \"default\", \"paleta\": \"default\"}');
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
-- Table structure for table `gateway_configs`
--

DROP TABLE IF EXISTS `gateway_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gateway_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tienda_id` int NOT NULL,
  `mp_access_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mp_public_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mp_user_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mp_point_device_id` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_secret_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_publishable_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_webhook_secret` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opciones` json DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_3a8854e07c8cbf0439a0161f68` (`tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gateway_configs`
--

LOCK TABLES `gateway_configs` WRITE;
/*!40000 ALTER TABLE `gateway_configs` DISABLE KEYS */;
INSERT INTO `gateway_configs` VALUES (1,3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"mp_qr_habilitado\": false, \"stripe_habilitado\": false, \"mp_point_habilitado\": false, \"comision_mp_porcentaje\": 3.49, \"confirmacion_automatica\": true, \"comision_stripe_porcentaje\": 3.6}',1,'2026-03-19 01:48:43.750556','2026-03-19 01:48:43.750556'),(2,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"mp_qr_habilitado\": false, \"stripe_habilitado\": false, \"mp_point_habilitado\": false, \"comision_mp_porcentaje\": 3.49, \"confirmacion_automatica\": true, \"comision_stripe_porcentaje\": 3.6}',1,'2026-03-23 02:27:12.241951','2026-03-23 02:27:12.241951'),(3,4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"mp_qr_habilitado\": false, \"stripe_habilitado\": false, \"mp_point_habilitado\": false, \"comision_mp_porcentaje\": 3.49, \"confirmacion_automatica\": true, \"comision_stripe_porcentaje\": 3.6}',1,'2026-04-14 08:01:32.862260','2026-04-14 08:01:32.862260');
/*!40000 ALTER TABLE `gateway_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gateway_transacciones`
--

DROP TABLE IF EXISTS `gateway_transacciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gateway_transacciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tienda_id` int NOT NULL,
  `venta_id` int DEFAULT NULL,
  `pedido_id` int DEFAULT NULL,
  `gateway` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referencia_gateway` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_interna` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `monto` decimal(10,2) NOT NULL,
  `comision` decimal(10,2) NOT NULL DEFAULT '0.00',
  `neto` decimal(10,2) NOT NULL DEFAULT '0.00',
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_06a46355fef30cf7fe6407a02a` (`tienda_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gateway_transacciones`
--

LOCK TABLES `gateway_transacciones` WRITE;
/*!40000 ALTER TABLE `gateway_transacciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `gateway_transacciones` ENABLE KEYS */;
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
  `permanente` tinyint NOT NULL DEFAULT '0',
  `machine_locked` tinyint NOT NULL DEFAULT '0',
  `machine_fingerprint` text,
  `activation_token` text,
  `activation_token_code` text,
  `activation_token_expires` timestamp NULL DEFAULT NULL,
  `activation_token_used` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_0b7af62b17d15ac618b4bc05f4` (`codigo_instalacion`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `licencias`
--

LOCK TABLES `licencias` WRITE;
/*!40000 ALTER TABLE `licencias` DISABLE KEYS */;
INSERT INTO `licencias` VALUES (1,1,'INS-E7B5A92B',NULL,'pro','[\"pos\", \"caja\", \"pedidos\", \"reportes\", \"dashboard\"]',10,50,'2026-02-18','2027-12-31',30,1,'activa',NULL,NULL,NULL,'2026-02-18 00:17:57.000000','2026-03-11 19:28:08.226256',0,0,NULL,NULL,NULL,NULL,0),(6,4,'INS-7C8024B3',NULL,'pro','[\"pos\", \"caja\", \"pedidos\", \"reportes\", \"dashboard\"]',10,50,'2026-02-18','2027-12-31',30,1,'activa',NULL,NULL,NULL,'2026-02-18 05:33:43.067415','2026-03-11 19:28:08.226256',0,0,NULL,NULL,NULL,NULL,0),(7,6,'INS-7E492F20',NULL,'pro','[\"pos\", \"caja\", \"pedidos\", \"reportes\", \"dashboard\"]',2,5,'2026-04-14','2026-05-14',7,1,'trial',NULL,NULL,NULL,'2026-04-14 07:58:52.070035','2026-04-14 07:58:52.070035',0,0,NULL,NULL,NULL,NULL,0);
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_digital_config`
--

LOCK TABLES `menu_digital_config` WRITE;
/*!40000 ALTER TABLE `menu_digital_config` DISABLE KEYS */;
INSERT INTO `menu_digital_config` VALUES (1,1,1,3,'mariscos',1,'consulta','manual',30,'https://pos.iados.online','291e95d74e25e613d93ee9d6ad53b82421513257017fb3a26ffde4c577c90624','2026-03-22 09:17:29','success',NULL,'2026-02-21 10:09:04.611177','2026-03-22 09:17:28.000000','oscuro'),(2,1,1,1,'sucursal-centro-mlw5zgbo',1,'consulta','manual',30,'http://localhost:3000','ebf018e0da86457faa8b75117c0c43d341862f05833f546956142b4657400fc5',NULL,NULL,NULL,'2026-02-21 10:16:49.028039','2026-03-11 19:28:08.232676','oscuro'),(3,6,5,4,'regina-mnyc1slt',0,'consulta','manual',30,'http://localhost:3000','e46e48f26a52a5366fb6cf45e60a0e9503cc1643a7bd0064119a4d9af9fbcd86',NULL,NULL,NULL,'2026-04-14 08:01:32.947076','2026-04-14 08:01:32.947076','oscuro');
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
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_digital_log`
--

LOCK TABLES `menu_digital_log` WRITE;
/*!40000 ALTER TABLE `menu_digital_log` DISABLE KEYS */;
INSERT INTO `menu_digital_log` VALUES (1,3,1,25,0,'success',NULL,904,'2026-02-21 10:09:58.442295'),(2,3,4,56,0,'success',NULL,765,'2026-02-21 10:11:07.682569'),(3,3,4,56,0,'success',NULL,703,'2026-02-21 10:11:36.838711'),(4,3,4,56,0,'success',NULL,769,'2026-02-21 10:14:34.139949'),(5,3,4,56,0,'success',NULL,734,'2026-02-21 10:15:54.541570'),(6,3,4,56,0,'success',NULL,718,'2026-02-21 10:15:58.805519'),(7,3,4,56,0,'success',NULL,787,'2026-02-21 10:17:55.302213'),(8,3,4,56,0,'success',NULL,760,'2026-02-21 17:42:58.728804'),(9,3,4,56,0,'success',NULL,172,'2026-02-21 17:59:21.994912'),(10,3,4,56,0,'success',NULL,140,'2026-02-21 19:09:59.203717'),(11,3,4,56,0,'success',NULL,125,'2026-02-21 19:10:45.309479'),(12,3,4,56,0,'success',NULL,128,'2026-02-21 19:11:03.752403'),(13,3,4,56,0,'success',NULL,516,'2026-02-21 19:13:45.112774'),(14,3,4,56,0,'success',NULL,1050,'2026-02-21 19:27:41.950697'),(15,3,4,56,0,'success',NULL,308,'2026-02-21 19:28:02.294316'),(16,3,4,56,0,'success',NULL,377,'2026-02-21 19:28:21.469541'),(17,3,4,56,0,'success',NULL,373,'2026-02-21 19:32:42.408108'),(18,3,4,56,0,'success',NULL,173,'2026-02-21 19:54:39.684175'),(19,3,4,56,0,'success',NULL,138,'2026-02-21 20:27:12.429460'),(20,3,4,56,0,'success',NULL,134,'2026-02-21 20:29:27.097333'),(21,3,4,56,0,'success',NULL,146,'2026-02-21 20:32:33.164254'),(22,3,4,56,0,'success',NULL,153,'2026-02-21 20:32:35.089026'),(23,3,1,56,0,'success',NULL,189,'2026-03-11 10:55:59.359997'),(24,3,1,56,0,'success',NULL,105,'2026-03-11 10:56:09.411899'),(25,3,1,56,0,'success',NULL,114,'2026-03-11 11:00:48.415967'),(26,3,1,56,0,'success',NULL,190,'2026-03-11 11:02:50.823682'),(27,3,1,56,0,'success',NULL,24,'2026-03-18 21:13:55.252085'),(28,3,1,56,0,'success',NULL,27,'2026-03-19 08:34:03.327732'),(29,3,1,56,0,'success',NULL,39,'2026-03-19 09:17:32.818029'),(30,3,1,56,0,'success',NULL,30,'2026-03-19 23:33:34.410404'),(31,3,1,56,0,'success',NULL,23,'2026-03-22 06:33:00.808181'),(32,3,1,56,0,'success',NULL,29,'2026-03-22 09:03:15.537507'),(33,3,1,56,0,'success',NULL,22,'2026-03-22 09:03:20.396411'),(34,3,1,56,0,'success',NULL,25,'2026-03-22 09:03:22.099376'),(35,3,1,56,0,'success',NULL,19,'2026-03-22 09:03:35.845319'),(36,3,1,56,0,'success',NULL,19,'2026-03-22 09:04:11.954630'),(37,3,1,56,0,'success',NULL,24,'2026-03-22 09:17:09.815195'),(38,3,1,56,0,'success',NULL,20,'2026-03-22 09:17:21.766670'),(39,3,1,56,0,'success',NULL,22,'2026-03-22 09:17:28.872386');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_digital_snapshot`
--

LOCK TABLES `menu_digital_snapshot` WRITE;
/*!40000 ALTER TABLE `menu_digital_snapshot` DISABLE KEYS */;
INSERT INTO `menu_digital_snapshot` VALUES (1,'mariscos',1,1,3,'consulta',1,'{\"nombre\":\"Mariscos 2-13\'s San Miguel\",\"direccion\":\"Apodaca\",\"telefono\":\"\",\"email\":\"contacto@mariscos213s.com\",\"logo_url\":\"/api/uploads/logo-empresa-4-1771392896645.jpeg\",\"empresa_nombre\":\"Mariscos 2-13\'s San Miguel\"}','[{\"id\":8,\"nombre\":\"Filetes\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":1},{\"id\":10,\"nombre\":\"Caldos\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":2},{\"id\":9,\"nombre\":\"Camarones\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":3},{\"id\":12,\"nombre\":\"Tostadas\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":4},{\"id\":13,\"nombre\":\"Aguachile\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":5},{\"id\":14,\"nombre\":\"Cocteles\",\"color\":\"#f67d3c\",\"icono\":null,\"orden\":6},{\"id\":15,\"nombre\":\"Ceviches\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":7},{\"id\":16,\"nombre\":\"Extras\",\"color\":\"#0feb16\",\"icono\":null,\"orden\":10},{\"id\":17,\"nombre\":\"Bebidas\",\"color\":\"#5f6063\",\"icono\":null,\"orden\":11}]','[{\"id\":265,\"nombre\":\"Filete a la Plancha\",\"descripcion\":\"Filete fresco cocinado a la plancha con especias y un toque de lim├│n que resalta su sabor natural acompa├▒ado de papa ensalada y arroz\",\"precio\":135,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-al-mojo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":264,\"nombre\":\"Filete al Mojo de Ajo\",\"descripcion\":\"Filete de pescado salteado en mantequilla con ajo dorado soya y cilantro acompa├▒ado de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-al-mojo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":262,\"nombre\":\"Filete Empanizado\",\"descripcion\":\"Filete de pescado cubierto con empanizado crujiente y dorado al momento, servido caliente acompa├▒ado de papas ensalada y arroz\",\"precio\":120,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-empanizado.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":266,\"nombre\":\"Filete Empanizado Mixto\",\"descripcion\":\"Filete empanizado  y 2 a 3 camarones empanizados disfrutar una deliciosa combinaci├│n de mariscos acompa├▒ada de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-mixto.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":263,\"nombre\":\"Filete Gratinado\",\"descripcion\":\"Filete de pescado cubierto con queso gratinado que se derrite sobre el pescado, creando un sabor cremoso acompa├▒ado de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-gratinado.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":270,\"nombre\":\"Camaron al Coco\",\"descripcion\":\"Camarones empanizados con coco rallado que les da un toque crujiente y ligeramente dulce acompa├▒adocon salsa de mango papas arroz y ensalada\",\"precio\":145,\"categoria_id\":9,\"imagen_url\":\"/api/uploads/img/mariscos213s/camaron.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":269,\"nombre\":\"Camaron al Mojo de Ajo\",\"descripcion\":\"camarones preparados salteado en mantequilla con ajo dorado soya y cilantro acompa├▒ado de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":9,\"imagen_url\":\"/api/uploads/img/mariscos213s/camarones-diabla.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":267,\"nombre\":\"Camaron Empanizado\",\"descripcion\":\"Camarones cubiertos con empanizado dorado y crujiente, fritos al momento para mantener su jugosidad acompa├▒ado de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":9,\"imagen_url\":\"/api/uploads/img/mariscos213s/camarones-empanizados.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":268,\"nombre\":\"Camaron Gratinado\",\"descripcion\":\"Camarones preparados con queso gratinado que aporta un sabor cremoso y delicioso acompa├▒ado de papas ensalada y arroz\",\"precio\":155,\"categoria_id\":9,\"imagen_url\":\"/api/uploads/img/mariscos213s/camarones-gratinados.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":271,\"nombre\":\"Caldo de Camaron 1 Litro\",\"descripcion\":\"Caldo caliente preparado con camarones frescos, verduras y especias que brindan un sabor intenso y reconfortante.\",\"precio\":155,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/consome.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":272,\"nombre\":\"Caldo de Camaron 1/2 Litro\",\"descripcion\":\"Caldo caliente preparado con camarones frescos, verduras y especias que brindan un sabor intenso y reconfortante.\",\"precio\":95,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/consome.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":273,\"nombre\":\"Caldo de Pescado\",\"descripcion\":\"caldo caliente con pescado fresco y verduras cocinadas en un caldo lleno de sabor.\",\"precio\":145,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/caldo-de-pez.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":274,\"nombre\":\"Caldo de Pescado\",\"descripcion\":\"caldo caliente con pescado fresco y verduras cocinadas en un caldo lleno de sabor.\",\"precio\":85,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/caldo-de-pez.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":275,\"nombre\":\"Caldo Mixto\",\"descripcion\":\"Caldo tradicional con mezcla de mariscos como camar├│n y pescado acompa├▒ado de verduras.\",\"precio\":155,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/caldo-mixto.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":276,\"nombre\":\"Caldo Mixto\",\"descripcion\":\"Caldo tradicional con mezcla de mariscos como camar├│n y pescado acompa├▒ado de verduras.\",\"precio\":95,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/caldo-mixto.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":278,\"nombre\":\"Consome 1/2\",\"descripcion\":\"Caldo ligero preparado con especias y mariscos que brinda un sabor suave y reconfortante.\",\"precio\":75,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/consome.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":277,\"nombre\":\"Consome Grande\",\"descripcion\":\"Caldo ligero preparado con especias y mariscos que brinda un sabor suave y reconfortante.\",\"precio\":120,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/consome.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":279,\"nombre\":\"Sopa de Mariscos\",\"descripcion\":\"Deliciosa sopa preparada con variedad de mariscos en un caldo concentrado lleno de sabor.\",\"precio\":200,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/sopa-de-mariscos.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":287,\"nombre\":\"Aderezo Extra\",\"descripcion\":\"\",\"precio\":5,\"categoria_id\":11,\"imagen_url\":\"/api/uploads/producto-1773361992462-pk34.jpg\",\"disponible\":true,\"orden\":0},{\"id\":283,\"nombre\":\"Cebollas Empanizadas\",\"descripcion\":\"Aros de cebolla empanizados y fritos hasta quedar crujientes por fuera y suaves por dentro.\",\"precio\":45,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":280,\"nombre\":\"Mojarra Frita\",\"descripcion\":\"Mojarra entera frita hasta quedar dorada y crujiente por fuera, jugosa por dentro acompa├▒ada de papas arroz y ensalda\",\"precio\":180,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":281,\"nombre\":\"Papas a la Francesa\",\"descripcion\":\"Papas fritas doradas y crujientes, perfectas como acompa├▒amiento.\",\"precio\":45,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":282,\"nombre\":\"Papas a la Francesa con Queso\",\"descripcion\":\"Papas fritas cubiertas con queso derretido para un sabor extra delicioso.\",\"precio\":70,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":285,\"nombre\":\"Porcion de Arroz\",\"descripcion\":\"\",\"precio\":15,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":288,\"nombre\":\"Refresco\",\"descripcion\":\"\",\"precio\":20,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":286,\"nombre\":\"Salsa Extra\",\"descripcion\":\"\",\"precio\":5,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":284,\"nombre\":\"Tostada Extra\",\"descripcion\":\"paquete con 6 tostadas\",\"precio\":2,\"categoria_id\":11,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-con-todo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":289,\"nombre\":\"Tostada de Aguachile\",\"descripcion\":\"Camar├│n fresco marinado en lim├│n con nuestra salsa especial (verde, roja, negra o mango) servido sobre tostada crujiente con pepino y cebolla.\",\"precio\":65,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":295,\"nombre\":\"Tostada de Atun\",\"descripcion\":\"Cubos de at├║n fresco preparados con salsas especiales y aguacate sobre tostada con un toque de cebolla empanizada\",\"precio\":120,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-de-atun.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":294,\"nombre\":\"Tostada de Camaron\",\"descripcion\":\"Camaron fresco en una tostada sobre una cama de pepino con aderezo de la casa y aguacate\",\"precio\":65,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-de-camaron.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":290,\"nombre\":\"Tostada de Ceviche de Pez\",\"descripcion\":\"Pescado fresco marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.\",\"precio\":55,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostiviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":293,\"nombre\":\"Tostada de Pulpo\",\"descripcion\":\"Pulpo suave y fresco con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.\",\"precio\":90,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-de-pulpo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":292,\"nombre\":\"Tostada Mixta Ceviche Pez, Camaron y Pulpo\",\"descripcion\":\"Pescado fresco y camaron y pulpo marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.\",\"precio\":100,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-megalodon.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":291,\"nombre\":\"Tostada Mixta Ceviche Pez/Camaron\",\"descripcion\":\"Pescado fresco y camaron marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.\",\"precio\":75,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-mixta.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":302,\"nombre\":\"Agua Chile de Mango\",\"descripcion\":\"Camarones frescos con salsa de mango, lim├│n y chile que combina lo dulce con lo picante.\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-mango.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":303,\"nombre\":\"Agua Chile de Mango\",\"descripcion\":\"Camarones frescos con salsa de mango, lim├│n y chile que combina lo dulce con lo picante.\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-mango.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":300,\"nombre\":\"Agua Chile Negro\",\"descripcion\":\"Camarones preparados con salsa oscura especial de la casa con un sabor intenso y ├║nico.\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-negro.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":301,\"nombre\":\"Agua Chile Negro\",\"descripcion\":\"Camarones preparados con salsa oscura especial de la casa con un sabor intenso y ├║nico.\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-negro.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":296,\"nombre\":\"Agua Chile Rojo\",\"descripcion\":\"Camarones frescos ba├▒ados en salsa roja picante con lim├│n, pepino y cebolla.\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-rojo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":297,\"nombre\":\"Agua Chile Rojo\",\"descripcion\":\"Camarones frescos ba├▒ados en salsa roja picante con lim├│n, pepino y cebolla.\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-rojo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":298,\"nombre\":\"Agua Chile Verde\",\"descripcion\":\"Camarones frescos en salsa verde de chile y cilantro con lim├│n y pepino.\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-verde.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":299,\"nombre\":\"Agua Chile Verde\",\"descripcion\":\"Camarones frescos en salsa verde de chile y cilantro con lim├│n y pepino.\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/producto-1773908854969-1vnw.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":309,\"nombre\":\"Coctel con Ceviche Grande\",\"descripcion\":\"deliciosa mezcla de camarones y ceviche fresco en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":290,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel-grande.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":308,\"nombre\":\"Coctel con Ceviche Mediano\",\"descripcion\":\"deliciosa mezcla de camarones y ceviche fresco en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":150,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":307,\"nombre\":\"Coctel con Pulpo Grande\",\"descripcion\":\"deliciosa mezcla de camarones y pulpo en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":290,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel-grande.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":306,\"nombre\":\"Coctel con Pulpo Mediano\",\"descripcion\":\"deliciosa mezcla de camarones y pulpo en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":150,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":305,\"nombre\":\"Coctel Grande\",\"descripcion\":\"Camarones cocidos en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":230,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel-grande.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":304,\"nombre\":\"Coctel Mediano\",\"descripcion\":\"Camarones cocidos en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":120,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":310,\"nombre\":\"Ceviche de Pescado\",\"descripcion\":\"Pescado fresco marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":130,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":311,\"nombre\":\"Ceviche de Pescado\",\"descripcion\":\"Pescado fresco marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":250,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":313,\"nombre\":\"Ceviche Mixto Pez y Camaron 1 Litro\",\"descripcion\":\"Pescado fresco con  marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":310,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":312,\"nombre\":\"Ceviche Mixto Pez y Camaron 1/2\",\"descripcion\":\"Pescado fresco con camaron marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":160,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":315,\"nombre\":\"Ceviche Mixto Pez, Camaron y Pulpo 1 Litro\",\"descripcion\":\"Pescado fresco con camaron y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":380,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":314,\"nombre\":\"Ceviche Mixto Pez, Camaron y Pulpo 1/2\",\"descripcion\":\"Pescado fresco con camaron y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":200,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":317,\"nombre\":\"Ceviche Mixto Pez/Pulpo 1 Litro\",\"descripcion\":\"Pescado fresco y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":380,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":316,\"nombre\":\"Ceviche Mixto Pez/Pulpo 1/2\",\"descripcion\":\"Pescado fresco y  pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":200,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0}]','2026-03-22 09:17:29','2026-02-21 10:09:58.134559','2026-03-22 09:17:28.000000','oscuro'),(2,'mariscos2',1,1,3,'consulta',1,'{\"nombre\":\"Mariscos 2-13\'s San Miguel\",\"direccion\":\"Apodaca\",\"telefono\":\"8318989580\",\"email\":\"contacto@mariscos213s.com\",\"logo_url\":\"/api/uploads/logo-empresa-4-1771392896645.jpeg\",\"empresa_nombre\":\"Mariscos 2-13\'s San Miguel\"}','[{\"id\":8,\"nombre\":\"Filetes\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":1},{\"id\":10,\"nombre\":\"Caldos\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":2},{\"id\":9,\"nombre\":\"Camarones\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":3},{\"id\":12,\"nombre\":\"Tostadas\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":4},{\"id\":13,\"nombre\":\"Aguachile\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":5},{\"id\":14,\"nombre\":\"Cocteles\",\"color\":\"#f67d3c\",\"icono\":null,\"orden\":6},{\"id\":15,\"nombre\":\"Ceviches\",\"color\":\"#3b82f6\",\"icono\":null,\"orden\":7},{\"id\":16,\"nombre\":\"Extras\",\"color\":\"#0feb16\",\"icono\":null,\"orden\":10},{\"id\":17,\"nombre\":\"Bebidas\",\"color\":\"#5f6063\",\"icono\":null,\"orden\":11}]','[{\"id\":265,\"nombre\":\"Filete a la Plancha\",\"descripcion\":\"Filete fresco cocinado a la plancha con especias y un toque de lim├│n que resalta su sabor natural acompa├▒ado de papa ensalada y arroz\",\"precio\":135,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-al-mojo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":264,\"nombre\":\"Filete al Mojo de Ajo\",\"descripcion\":\"Filete de pescado salteado en mantequilla con ajo dorado soya y cilantro acompa├▒ado de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-al-mojo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":262,\"nombre\":\"Filete Empanizado\",\"descripcion\":\"Filete de pescado cubierto con empanizado crujiente y dorado al momento, servido caliente acompa├▒ado de papas ensalada y arroz\",\"precio\":120,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-empanizado.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":266,\"nombre\":\"Filete Empanizado Mixto\",\"descripcion\":\"Filete empanizado  y 2 a 3 camarones empanizados disfrutar una deliciosa combinaci├│n de mariscos acompa├▒ada de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-mixto.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":263,\"nombre\":\"Filete Gratinado\",\"descripcion\":\"Filete de pescado cubierto con queso gratinado que se derrite sobre el pescado, creando un sabor cremoso acompa├▒ado de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":8,\"imagen_url\":\"/api/uploads/img/mariscos213s/filete-gratinado.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":270,\"nombre\":\"Camaron al Coco\",\"descripcion\":\"Camarones empanizados con coco rallado que les da un toque crujiente y ligeramente dulce acompa├▒adocon salsa de mango papas arroz y ensalada\",\"precio\":145,\"categoria_id\":9,\"imagen_url\":\"/api/uploads/img/mariscos213s/camaron.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":269,\"nombre\":\"Camaron al Mojo de Ajo\",\"descripcion\":\"camarones preparados salteado en mantequilla con ajo dorado soya y cilantro acompa├▒ado de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":9,\"imagen_url\":\"/api/uploads/img/mariscos213s/camarones-diabla.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":267,\"nombre\":\"Camaron Empanizado\",\"descripcion\":\"Camarones cubiertos con empanizado dorado y crujiente, fritos al momento para mantener su jugosidad acompa├▒ado de papas ensalada y arroz\",\"precio\":145,\"categoria_id\":9,\"imagen_url\":\"/api/uploads/img/mariscos213s/camarones-empanizados.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":268,\"nombre\":\"Camaron Gratinado\",\"descripcion\":\"Camarones preparados con queso gratinado que aporta un sabor cremoso y delicioso acompa├▒ado de papas ensalada y arroz\",\"precio\":155,\"categoria_id\":9,\"imagen_url\":\"/api/uploads/img/mariscos213s/camarones-gratinados.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":271,\"nombre\":\"Caldo de Camaron 1 Litro\",\"descripcion\":\"Caldo caliente preparado con camarones frescos, verduras y especias que brindan un sabor intenso y reconfortante.\",\"precio\":155,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/consome.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":272,\"nombre\":\"Caldo de Camaron 1/2 Litro\",\"descripcion\":\"Caldo caliente preparado con camarones frescos, verduras y especias que brindan un sabor intenso y reconfortante.\",\"precio\":95,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/consome.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":273,\"nombre\":\"Caldo de Pescado\",\"descripcion\":\"caldo caliente con pescado fresco y verduras cocinadas en un caldo lleno de sabor.\",\"precio\":145,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/caldo-de-pez.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":274,\"nombre\":\"Caldo de Pescado\",\"descripcion\":\"caldo caliente con pescado fresco y verduras cocinadas en un caldo lleno de sabor.\",\"precio\":85,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/caldo-de-pez.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":275,\"nombre\":\"Caldo Mixto\",\"descripcion\":\"Caldo tradicional con mezcla de mariscos como camar├│n y pescado acompa├▒ado de verduras.\",\"precio\":155,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/caldo-mixto.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":276,\"nombre\":\"Caldo Mixto\",\"descripcion\":\"Caldo tradicional con mezcla de mariscos como camar├│n y pescado acompa├▒ado de verduras.\",\"precio\":95,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/caldo-mixto.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":278,\"nombre\":\"Consome 1/2\",\"descripcion\":\"Caldo ligero preparado con especias y mariscos que brinda un sabor suave y reconfortante.\",\"precio\":75,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/consome.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":277,\"nombre\":\"Consome Grande\",\"descripcion\":\"Caldo ligero preparado con especias y mariscos que brinda un sabor suave y reconfortante.\",\"precio\":120,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/consome.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":279,\"nombre\":\"Sopa de Mariscos\",\"descripcion\":\"Deliciosa sopa preparada con variedad de mariscos en un caldo concentrado lleno de sabor.\",\"precio\":200,\"categoria_id\":10,\"imagen_url\":\"/api/uploads/img/mariscos213s/sopa-de-mariscos.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":287,\"nombre\":\"Aderezo Extra\",\"descripcion\":\"\",\"precio\":5,\"categoria_id\":11,\"imagen_url\":\"/api/uploads/producto-1773361992462-pk34.jpg\",\"disponible\":true,\"orden\":0},{\"id\":283,\"nombre\":\"Cebollas Empanizadas\",\"descripcion\":\"Aros de cebolla empanizados y fritos hasta quedar crujientes por fuera y suaves por dentro.\",\"precio\":45,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":280,\"nombre\":\"Mojarra Frita\",\"descripcion\":\"Mojarra entera frita hasta quedar dorada y crujiente por fuera, jugosa por dentro acompa├▒ada de papas arroz y ensalda\",\"precio\":180,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":281,\"nombre\":\"Papas a la Francesa\",\"descripcion\":\"Papas fritas doradas y crujientes, perfectas como acompa├▒amiento.\",\"precio\":45,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":282,\"nombre\":\"Papas a la Francesa con Queso\",\"descripcion\":\"Papas fritas cubiertas con queso derretido para un sabor extra delicioso.\",\"precio\":70,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":285,\"nombre\":\"Porcion de Arroz\",\"descripcion\":\"\",\"precio\":15,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":288,\"nombre\":\"Refresco\",\"descripcion\":\"\",\"precio\":20,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":286,\"nombre\":\"Salsa Extra\",\"descripcion\":\"\",\"precio\":5,\"categoria_id\":11,\"imagen_url\":null,\"disponible\":true,\"orden\":0},{\"id\":284,\"nombre\":\"Tostada Extra\",\"descripcion\":\"paquete con 6 tostadas\",\"precio\":2,\"categoria_id\":11,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-con-todo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":289,\"nombre\":\"Tostada de Aguachile\",\"descripcion\":\"Camar├│n fresco marinado en lim├│n con nuestra salsa especial (verde, roja, negra o mango) servido sobre tostada crujiente con pepino y cebolla.\",\"precio\":65,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":295,\"nombre\":\"Tostada de Atun\",\"descripcion\":\"Cubos de at├║n fresco preparados con salsas especiales y aguacate sobre tostada con un toque de cebolla empanizada\",\"precio\":120,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-de-atun.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":294,\"nombre\":\"Tostada de Camaron\",\"descripcion\":\"Camaron fresco en una tostada sobre una cama de pepino con aderezo de la casa y aguacate\",\"precio\":65,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-de-camaron.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":290,\"nombre\":\"Tostada de Ceviche de Pez\",\"descripcion\":\"Pescado fresco marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.\",\"precio\":55,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostiviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":293,\"nombre\":\"Tostada de Pulpo\",\"descripcion\":\"Pulpo suave y fresco con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.\",\"precio\":90,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-de-pulpo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":292,\"nombre\":\"Tostada Mixta Ceviche Pez, Camaron y Pulpo\",\"descripcion\":\"Pescado fresco y camaron y pulpo marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.\",\"precio\":100,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-megalodon.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":291,\"nombre\":\"Tostada Mixta Ceviche Pez/Camaron\",\"descripcion\":\"Pescado fresco y camaron marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.\",\"precio\":75,\"categoria_id\":12,\"imagen_url\":\"/api/uploads/img/mariscos213s/tostada-mixta.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":302,\"nombre\":\"Agua Chile de Mango\",\"descripcion\":\"Camarones frescos con salsa de mango, lim├│n y chile que combina lo dulce con lo picante.\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-mango.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":303,\"nombre\":\"Agua Chile de Mango\",\"descripcion\":\"Camarones frescos con salsa de mango, lim├│n y chile que combina lo dulce con lo picante.\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-mango.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":300,\"nombre\":\"Agua Chile Negro\",\"descripcion\":\"Camarones preparados con salsa oscura especial de la casa con un sabor intenso y ├║nico.\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-negro.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":301,\"nombre\":\"Agua Chile Negro\",\"descripcion\":\"Camarones preparados con salsa oscura especial de la casa con un sabor intenso y ├║nico.\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-negro.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":296,\"nombre\":\"Agua Chile Rojo\",\"descripcion\":\"Camarones frescos ba├▒ados en salsa roja picante con lim├│n, pepino y cebolla.\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-rojo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":297,\"nombre\":\"Agua Chile Rojo\",\"descripcion\":\"Camarones frescos ba├▒ados en salsa roja picante con lim├│n, pepino y cebolla.\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-rojo.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":298,\"nombre\":\"Agua Chile Verde\",\"descripcion\":\"Camarones frescos en salsa verde de chile y cilantro con lim├│n y pepino.\",\"precio\":150,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/img/mariscos213s/aguachile-verde.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":299,\"nombre\":\"Agua Chile Verde\",\"descripcion\":\"Camarones frescos en salsa verde de chile y cilantro con lim├│n y pepino.\",\"precio\":280,\"categoria_id\":13,\"imagen_url\":\"/api/uploads/producto-1773908854969-1vnw.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":309,\"nombre\":\"Coctel con Ceviche Grande\",\"descripcion\":\"deliciosa mezcla de camarones y ceviche fresco en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":290,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel-grande.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":308,\"nombre\":\"Coctel con Ceviche Mediano\",\"descripcion\":\"deliciosa mezcla de camarones y ceviche fresco en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":150,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":307,\"nombre\":\"Coctel con Pulpo Grande\",\"descripcion\":\"deliciosa mezcla de camarones y pulpo en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":290,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel-grande.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":306,\"nombre\":\"Coctel con Pulpo Mediano\",\"descripcion\":\"deliciosa mezcla de camarones y pulpo en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":150,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":305,\"nombre\":\"Coctel Grande\",\"descripcion\":\"Camarones cocidos en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":230,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel-grande.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":304,\"nombre\":\"Coctel Mediano\",\"descripcion\":\"Camarones cocidos en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.\",\"precio\":120,\"categoria_id\":14,\"imagen_url\":\"/api/uploads/img/mariscos213s/coctel.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":310,\"nombre\":\"Ceviche de Pescado\",\"descripcion\":\"Pescado fresco marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":130,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":311,\"nombre\":\"Ceviche de Pescado\",\"descripcion\":\"Pescado fresco marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":250,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":313,\"nombre\":\"Ceviche Mixto Pez y Camaron 1 Litro\",\"descripcion\":\"Pescado fresco con  marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":310,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":312,\"nombre\":\"Ceviche Mixto Pez y Camaron 1/2\",\"descripcion\":\"Pescado fresco con camaron marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":160,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":315,\"nombre\":\"Ceviche Mixto Pez, Camaron y Pulpo 1 Litro\",\"descripcion\":\"Pescado fresco con camaron y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":380,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":314,\"nombre\":\"Ceviche Mixto Pez, Camaron y Pulpo 1/2\",\"descripcion\":\"Pescado fresco con camaron y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":200,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":317,\"nombre\":\"Ceviche Mixto Pez/Pulpo 1 Litro\",\"descripcion\":\"Pescado fresco y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":380,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0},{\"id\":316,\"nombre\":\"Ceviche Mixto Pez/Pulpo 1/2\",\"descripcion\":\"Pescado fresco y  pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.\",\"precio\":200,\"categoria_id\":15,\"imagen_url\":\"/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg\",\"disponible\":true,\"orden\":0}]','2026-03-22 06:33:01','2026-03-22 06:33:00.797290','2026-03-22 06:33:00.797290','oscuro');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesa_asignaciones`
--

LOCK TABLES `mesa_asignaciones` WRITE;
/*!40000 ALTER TABLE `mesa_asignaciones` DISABLE KEYS */;
INSERT INTO `mesa_asignaciones` VALUES (1,1,3,4,4,11,'Mesero',1,'2026-03-17 15:49:26.133914'),(2,2,3,4,4,12,'Mesero Axel',1,'2026-03-19 07:25:52.771738'),(3,3,3,4,4,14,'Mesero Daniel',1,'2026-03-19 07:28:19.223004'),(4,4,3,4,4,13,'Mesero Fabian',1,'2026-03-19 07:28:21.430834'),(6,6,3,4,4,13,'Mesero Fabian',1,'2026-03-19 07:28:26.104838'),(7,7,1,1,1,14,'Mesero Daniel',1,'2026-03-23 02:30:48.770820');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesas`
--

LOCK TABLES `mesas` WRITE;
/*!40000 ALTER TABLE `mesas` DISABLE KEYS */;
INSERT INTO `mesas` VALUES (1,4,4,3,1,'','Interior',4,1,'2026-03-17 15:49:23.059586','2026-03-17 15:50:19.000000'),(2,4,4,3,2,'','Interior',4,1,'2026-03-19 07:25:49.347380','2026-03-19 07:25:49.347380'),(3,4,4,3,3,'','',4,1,'2026-03-19 07:27:57.848118','2026-03-19 07:27:57.848118'),(4,4,4,3,4,'','',4,1,'2026-03-19 07:28:03.901309','2026-03-19 07:28:03.901309'),(5,4,4,3,5,'','',4,1,'2026-03-19 07:28:08.851602','2026-03-19 07:28:08.851602'),(6,4,4,3,6,'','',4,1,'2026-03-19 07:28:14.462248','2026-03-19 07:28:14.462248'),(7,1,1,1,1,'terraza','interior',4,1,'2026-03-23 02:29:44.499846','2026-03-23 02:29:44.499846');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_caja`
--

LOCK TABLES `movimientos_caja` WRITE;
/*!40000 ALTER TABLE `movimientos_caja` DISABLE KEYS */;
INSERT INTO `movimientos_caja` VALUES (2,14,15,'entrada',200.00,'feria',NULL,'2026-04-14 08:35:29.321994');
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
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (1,6,5,4,323,'Hielo Barra','HIEL-BARR','entrada',10.00,0.00,10.00,'Compra',15,'Regina','2026-04-14 07:59:53.931335'),(2,6,5,4,319,'Carbón Bolsa 2.5kg','CARB-2.5KG','entrada',10.00,0.00,10.00,'Compra',15,'Regina','2026-04-14 15:52:28.643765'),(3,6,5,4,319,'Carbón Bolsa 2.5kg','CARB-2.5KG','entrada',30.00,10.00,40.00,NULL,15,'Regina','2026-04-14 15:52:39.910441'),(4,6,5,4,318,'Carbón Bolsa 3kg','CARB-3KG','entrada',45.00,0.00,45.00,NULL,15,'Regina','2026-04-14 15:52:47.109787'),(5,6,5,4,320,'Carbón Granel kg','CARB-GRAN','entrada',35.00,0.00,35.00,NULL,15,'Regina','2026-04-14 15:52:53.815471'),(6,6,5,4,320,'Carbón Granel kg','CARB-GRAN','entrada',65.00,35.00,100.00,NULL,15,'Regina','2026-04-14 15:53:01.689754'),(7,6,5,4,320,'Carbón Granel kg','CARB-GRAN','entrada',100.00,100.00,200.00,NULL,15,'Regina','2026-04-14 15:53:18.279199'),(8,6,5,4,323,'Hielo Barra','HIEL-BARR','entrada',10.00,10.00,20.00,NULL,15,'Regina','2026-04-14 15:53:42.679731'),(9,6,5,4,323,'Hielo Barra','HIEL-BARR','entrada',30.00,20.00,50.00,NULL,15,'Regina','2026-04-14 15:53:58.756002'),(10,6,5,4,318,'Carbón Bolsa 3kg','CARB-3KG','salida',20.00,45.00,25.00,NULL,15,'Regina','2026-04-14 15:54:39.318745'),(11,6,5,4,318,'Carbón Bolsa 3kg','CARB-3KG','salida',20.00,25.00,5.00,NULL,15,'Regina','2026-04-14 15:54:46.477198'),(12,6,5,4,318,'Carbón Bolsa 3kg','CARB-3KG','entrada',1.00,5.00,6.00,NULL,15,'Regina','2026-04-14 15:55:18.004140'),(13,6,5,4,319,'Carbón Bolsa 2.5kg','CARB-2.5KG','salida',5.00,40.00,35.00,'Venta IR00000009',15,'Regina','2026-04-14 16:30:04.647540'),(14,6,5,4,318,'Carbón Bolsa 3kg','CARB-3KG','salida',1.00,6.00,5.00,'Venta IR00000010',15,'Regina','2026-04-14 16:43:42.951806'),(15,6,5,4,319,'Carbón Bolsa 2.5kg','CARB-2.5KG','salida',1.00,35.00,34.00,'Venta IR00000010',15,'Regina','2026-04-14 16:43:42.955892'),(16,6,5,4,320,'Carbón Granel kg','CARB-GRAN','salida',7.00,200.00,193.00,'Venta IR00000011',17,'Cajero Carbon','2026-04-14 17:02:17.638371'),(17,6,5,4,319,'Carbón Bolsa 2.5kg','CARB-2.5KG','salida',14.00,34.00,20.00,'Venta IR00000011',17,'Cajero Carbon','2026-04-14 17:02:17.641399'),(18,6,5,4,318,'Carbón Bolsa 3kg','CARB-3KG','salida',5.00,5.00,0.00,'Venta IR00000011',17,'Cajero Carbon','2026-04-14 17:02:17.644408'),(19,6,5,4,319,'Carbón Bolsa 2.5kg','CARB-2.5KG','salida',1.00,20.00,19.00,'Venta IR00000012',15,'Regina','2026-04-14 17:13:00.344316'),(20,6,5,4,320,'Carbón Granel kg','CARB-GRAN','salida',1.00,193.00,192.00,'Venta IR00000012',15,'Regina','2026-04-14 17:13:00.348152'),(21,6,5,4,323,'Hielo Barra','HIEL-BARR','salida',1.00,50.00,49.00,'Venta IR00000013',16,'Cajero Hielo','2026-04-14 17:24:05.278566'),(22,6,5,4,318,'Carbón Bolsa 3kg','CARB-3KG','entrada',10.00,0.00,10.00,NULL,15,'Regina','2026-04-14 18:56:22.475515'),(23,6,5,4,322,'Hielo Bolsa 20kg','HIEL-20KG','entrada',10.00,0.00,10.00,NULL,15,'Regina','2026-04-14 18:56:30.600347'),(24,6,5,4,321,'Hielo Bolsa 5kg Mayoreo','HIEL-5KG','entrada',10.00,0.00,10.00,NULL,15,'Regina','2026-04-14 18:56:34.952135'),(25,6,5,4,324,'Hielo Bolsa 5kg Menudeo','HIEL-5KGM','entrada',100.00,0.00,100.00,NULL,15,'Regina','2026-04-14 18:56:52.516070'),(26,6,5,4,325,'Hielo Triturado 30 kg','HIELTR-30K','entrada',100.00,0.00,100.00,NULL,15,'Regina','2026-04-14 18:56:59.377478'),(27,6,5,4,320,'Carbón Granel kg','CARB-GRAN','salida',2.00,192.00,190.00,'Venta IR00000001',15,'Regina','2026-04-14 18:57:15.064086'),(28,6,5,4,325,'Hielo Triturado 30 kg','HIELTR-30K','salida',1.00,100.00,99.00,'Venta IR00000001',15,'Regina','2026-04-14 18:57:15.067501'),(29,6,5,4,321,'Hielo Bolsa 5kg Mayoreo','HIEL-5KG','salida',1.00,10.00,9.00,'Venta IR00000001',15,'Regina','2026-04-14 18:57:15.070636'),(30,6,5,4,322,'Hielo Bolsa 20kg','HIEL-20KG','salida',1.00,10.00,9.00,'Venta IR00000002',15,'Regina','2026-04-14 19:52:34.140478'),(31,6,5,4,321,'Hielo Bolsa 5kg Mayoreo','HIEL-5KG','salida',1.00,9.00,8.00,'Venta IR00000002',15,'Regina','2026-04-14 19:52:34.143518'),(32,6,5,4,320,'Carbón Granel kg','CARB-GRAN','salida',1.00,190.00,189.00,'Venta IR00000002',15,'Regina','2026-04-14 19:52:34.146636'),(33,6,5,4,319,'Carbón Bolsa 2.5kg','CARB-2.5KG','salida',8.00,19.00,11.00,'Venta IR00000003',15,'Regina','2026-04-14 20:42:29.296684');
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
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedido_detalles`
--

LOCK TABLES `pedido_detalles` WRITE;
/*!40000 ALTER TABLE `pedido_detalles` DISABLE KEYS */;
INSERT INTO `pedido_detalles` VALUES (32,9,276,'Caldo Mixto','PROD015',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(33,9,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(34,9,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(38,11,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(39,11,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(40,11,270,'Camaron al Coco','PROD009',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(41,11,295,'Tostada de Atun','PROD034',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(42,12,276,'Caldo Mixto','PROD015',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(43,12,277,'Consome Grande','PROD016',2.00,120.00,0.00,0.00,240.00,NULL,NULL),(44,12,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(45,12,278,'Consome 1/2','PROD017',1.00,75.00,0.00,0.00,75.00,NULL,NULL),(46,13,263,'Filete Gratinado','PROD002',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(47,13,274,'Caldo de Pescado','PROD013',1.00,85.00,0.00,0.00,85.00,NULL,NULL),(53,16,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(54,16,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(55,16,272,'Caldo de Camaron 1/2 Litro','PROD011',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(56,16,278,'Consome 1/2','PROD017',1.00,75.00,0.00,0.00,75.00,NULL,NULL),(57,17,295,'Tostada de Atun','PROD034',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(58,17,290,'Tostada de Ceviche de Pez','PROD029',1.00,55.00,0.00,0.00,55.00,NULL,NULL),(59,17,270,'Camaron al Coco','PROD009',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(60,18,266,'Filete Empanizado Mixto','PROD005',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(61,18,262,'Filete Empanizado','PROD001',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(62,18,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(63,18,276,'Caldo Mixto','PROD015',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(64,18,270,'Camaron al Coco','PROD009',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(65,18,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(66,10,278,'Consome 1/2','PROD017',1.00,75.00,0.00,0.00,75.00,NULL,NULL),(67,10,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(68,10,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(69,19,265,'Filete a la Plancha','265',1.00,135.00,0.00,0.00,135.00,NULL,NULL),(70,19,262,'Filete Empanizado','262',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(71,20,265,'Filete a la Plancha','265',1.00,135.00,0.00,0.00,135.00,NULL,NULL),(72,20,264,'Filete al Mojo de Ajo','264',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(73,20,262,'Filete Empanizado','262',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(74,21,265,'Filete a la Plancha','265',1.00,135.00,0.00,0.00,135.00,NULL,NULL),(75,21,264,'Filete al Mojo de Ajo','264',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(88,14,276,'Caldo Mixto','PROD015',2.00,95.00,0.00,0.00,190.00,NULL,NULL),(89,14,277,'Consome Grande','PROD016',2.00,120.00,0.00,0.00,240.00,NULL,NULL),(90,14,270,'Camaron al Coco','PROD009',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(91,14,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(95,15,278,'Consome 1/2','PROD017',1.00,75.00,0.00,0.00,75.00,NULL,NULL),(96,15,272,'Caldo de Camaron 1/2 Litro','PROD011',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(97,15,273,'Caldo de Pescado','PROD012',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(98,15,270,'Camaron al Coco','PROD009',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(99,22,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(100,22,276,'Caldo Mixto','PROD015',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(101,23,265,'Filete a la Plancha','PROD004',1.00,135.00,0.00,0.00,135.00,NULL,NULL),(102,23,266,'Filete Empanizado Mixto','PROD005',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(103,24,276,'Caldo Mixto','PROD015',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(104,24,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(105,24,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(106,24,270,'Camaron al Coco','PROD009',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(107,25,272,'Caldo de Camaron 1/2 Litro','PROD011',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(108,25,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(109,25,270,'Camaron al Coco','PROD009',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(110,26,278,'Consome 1/2','PROD017',1.00,75.00,0.00,0.00,75.00,NULL,NULL),(111,26,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(112,26,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(113,27,264,'Filete al Mojo de Ajo','PROD003',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(114,27,263,'Filete Gratinado','PROD002',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(115,27,265,'Filete a la Plancha','PROD004',1.00,135.00,0.00,0.00,135.00,NULL,NULL),(116,28,318,'Carbón Bolsa 3kg','CARB-3KG',4.00,45.00,0.00,0.00,180.00,NULL,NULL),(117,28,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',25.00,35.00,0.00,0.00,875.00,NULL,NULL),(118,29,318,'Carbón Bolsa 3kg','CARB-3KG',1.00,45.00,0.00,0.00,45.00,NULL,NULL),(119,30,318,'Carbón Bolsa 3kg','CARB-3KG',1.00,45.00,0.00,0.00,45.00,NULL,NULL),(120,31,318,'Carbón Bolsa 3kg','CARB-3KG',4.00,45.00,0.00,0.00,180.00,NULL,NULL),(121,31,320,'Carbón Granel kg','CARB-GRAN',6.00,14.00,0.00,0.00,84.00,NULL,NULL);
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
  `cliente_telefono` varchar(20) DEFAULT NULL,
  `cliente_direccion` varchar(300) DEFAULT NULL,
  `tipo_servicio` varchar(20) NOT NULL DEFAULT 'en_sitio',
  `cuenta_abierta` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `IDX_6dde461af02dbc411055f6011f` (`tienda_id`,`estado`),
  KEY `IDX_1386c9bb8690d9b47449219d3d` (`tenant_id`,`empresa_id`,`tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (9,4,4,3,7,'P-MMX118AK',1,'entregado',370.00,0.00,0.00,370.00,NULL,NULL,28,'Mariscos 2-13\'s San Miguel','2026-03-19 05:25:42.336562','2026-03-19 09:19:41.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(10,4,4,3,7,'P-MMX11IBP',1,'cancelado',350.00,0.00,0.00,350.00,' | CANCELADO: Cancelado desde Cuentas Abiertas',NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-19 05:25:55.335300','2026-03-20 18:13:03.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(11,4,4,3,7,'P-MMX11L7D',1,'entregado',540.00,0.00,0.00,540.00,NULL,NULL,29,'Mariscos 2-13\'s San Miguel','2026-03-19 05:25:59.067427','2026-03-19 09:20:00.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(12,4,4,3,7,'P-MMX11R4U',1,'cancelado',565.00,0.00,0.00,565.00,' | CANCELADO: Cancelado desde Cuentas Abiertas',NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-19 05:26:06.752509','2026-03-20 18:13:11.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(13,4,4,3,7,'P-MMX3U2UI',1,'cancelado',230.00,0.00,0.00,230.00,' | CANCELADO: Cancelado desde Cuentas Abiertas',NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-19 06:44:07.534928','2026-03-20 18:13:06.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(14,4,4,3,7,'P-MMX3U7RB',1,'cancelado',730.00,0.00,0.00,730.00,' | CANCELADO: NADA',NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-19 06:44:13.897275','2026-03-23 08:05:56.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(15,4,4,3,7,'IM00000001',2,'recibido',460.00,0.00,0.00,460.00,NULL,NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-19 07:29:04.523160','2026-03-22 09:21:46.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(16,4,4,3,7,'IM00000002',3,'recibido',445.00,0.00,0.00,445.00,NULL,NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-19 07:29:11.696032','2026-03-19 07:29:11.696032',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(17,4,4,3,7,'IM00000003',5,'recibido',320.00,0.00,0.00,320.00,NULL,NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-19 07:29:18.061194','2026-03-19 07:29:18.061194',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(18,4,4,3,7,'IM00000004',1,'recibido',780.00,0.00,0.00,780.00,NULL,NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-20 18:12:38.025146','2026-03-20 18:12:38.025146',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(19,4,4,3,NULL,'SO-MMZ7XCGB',1,'cancelado',255.00,0.00,0.00,255.00,' | CANCELADO: Errror','Axel',NULL,'Axel','2026-03-20 18:14:10.765578','2026-03-20 18:17:35.000000',1,7,'Mariscos 2-13\'s San Miguel',1,'443caab5-b781-43c3-9d5d-879203b67f70',NULL,NULL,'en_sitio',0),(20,4,4,3,NULL,'SO-MMZ811HZ',1,'en_elaboracion',400.00,0.00,0.00,400.00,NULL,'Axel2',NULL,'Axel2','2026-03-20 18:17:03.192582','2026-03-20 18:17:17.000000',1,7,'Mariscos 2-13\'s San Miguel',1,'d2da8a7e-b809-4147-aac8-d1a4e7a4f574',NULL,NULL,'en_sitio',0),(21,4,4,3,NULL,'SO-MMZCI9XK',1,'en_elaboracion',280.00,0.00,0.00,280.00,NULL,'1',NULL,'1','2026-03-20 20:22:25.738199','2026-03-22 07:34:48.000000',1,7,'Mariscos 2-13\'s San Miguel',1,'04edc12b-5200-43a8-8406-564caa8cf18f',NULL,NULL,'en_sitio',0),(22,4,4,3,7,'IM00000005',1,'recibido',215.00,0.00,0.00,215.00,NULL,NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-23 18:00:38.798206','2026-03-23 18:00:38.798206',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(23,4,4,3,12,'IM00000006',1,'recibido',280.00,0.00,0.00,280.00,NULL,NULL,NULL,'Mesero Axel','2026-03-23 18:02:15.777686','2026-03-23 18:02:15.777686',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(24,4,4,3,12,'IM00000007',1,'recibido',515.00,0.00,0.00,515.00,NULL,NULL,NULL,'Mesero Axel','2026-03-23 18:02:25.215739','2026-03-23 18:02:25.215739',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(25,4,4,3,12,'IM00000008',1,'recibido',395.00,0.00,0.00,395.00,NULL,NULL,NULL,'Mesero Axel','2026-03-23 18:05:01.742611','2026-03-23 18:05:01.742611',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(26,4,4,3,7,'IM00000009',1,'recibido',350.00,0.00,0.00,350.00,NULL,NULL,NULL,'Mariscos 2-13\'s San Miguel','2026-03-23 18:05:45.586358','2026-03-23 18:05:45.586358',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(27,4,4,3,7,'IM00000010',2,'recibido',425.00,0.00,0.00,425.00,NULL,'Qxel',NULL,'Mariscos 2-13\'s San Miguel','2026-04-07 17:47:12.406268','2026-04-07 17:47:12.406268',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(28,6,5,4,15,'IR00000001',1,'cancelado',1055.00,0.00,0.00,1055.00,' | CANCELADO: Cancelado desde Cuentas Abiertas','Axel Muñiz',NULL,'Regina','2026-04-14 21:06:42.024252','2026-04-14 21:21:07.000000',0,NULL,NULL,0,NULL,'8318989580','Conocido','para_llevar',0),(29,6,5,4,15,'IR00000002',5,'cancelado',45.00,0.00,0.00,45.00,' | CANCELADO: Cancelado desde Cuentas Abiertas',NULL,NULL,'Regina','2026-04-14 21:23:32.836996','2026-04-14 21:23:45.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(30,6,5,4,15,'IR00000003',9,'cancelado',45.00,0.00,0.00,45.00,' | CANCELADO: Cancelado desde Cuentas Abiertas',NULL,NULL,'Regina','2026-04-14 22:11:37.407990','2026-04-15 00:39:14.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0),(31,6,5,4,18,'IR00000004',1,'cancelado',264.00,0.00,0.00,264.00,' | CANCELADO: qsad',NULL,NULL,'Regina Admin','2026-04-14 23:28:14.522448','2026-04-15 00:03:02.000000',0,NULL,NULL,0,NULL,NULL,NULL,'en_sitio',0);
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfiles_negocio`
--

DROP TABLE IF EXISTS `perfiles_negocio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfiles_negocio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `config` json DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_e42e6081e7622fd2bcccb2d3ec` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfiles_negocio`
--

LOCK TABLES `perfiles_negocio` WRITE;
/*!40000 ALTER TABLE `perfiles_negocio` DISABLE KEYS */;
INSERT INTO `perfiles_negocio` VALUES (1,'carbon_hielo','Carbón + Hielo','Perfil para negocios de venta de carbón y hielo con inventario dual','{\"modulos\": [\"carbon\", \"hielo\"], \"alertas_stock\": true, \"modulos_config\": {\"hielo\": {\"color\": \"#0ea5e9\", \"icono\": \"Snowflake\", \"label\": \"Hielo\"}, \"carbon\": {\"color\": \"#374151\", \"icono\": \"Flame\", \"label\": \"Carbón\"}}, \"productos_base\": [{\"sku\": \"CARB-3KG\", \"costo\": 0, \"modulo\": \"carbon\", \"nombre\": \"Carbón Bolsa 3kg\", \"precio\": 0, \"unidad\": \"bolsa\", \"stock_minimo\": 20, \"controla_stock\": true}, {\"sku\": \"CARB-2.5KG\", \"costo\": 0, \"modulo\": \"carbon\", \"nombre\": \"Carbón Bolsa 2.5kg\", \"precio\": 0, \"unidad\": \"bolsa\", \"stock_minimo\": 20, \"controla_stock\": true}, {\"sku\": \"CARB-GRAN\", \"costo\": 0, \"modulo\": \"carbon\", \"nombre\": \"Carbón Granel kg\", \"precio\": 0, \"unidad\": \"kg\", \"stock_minimo\": 50, \"controla_stock\": true}, {\"sku\": \"HIEL-5KG\", \"costo\": 0, \"modulo\": \"hielo\", \"nombre\": \"Hielo Bolsa 5kg\", \"precio\": 0, \"unidad\": \"bolsa\", \"stock_minimo\": 30, \"controla_stock\": true}, {\"sku\": \"HIEL-20KG\", \"costo\": 0, \"modulo\": \"hielo\", \"nombre\": \"Hielo Bolsa 20kg\", \"precio\": 0, \"unidad\": \"bolsa\", \"stock_minimo\": 10, \"controla_stock\": true}, {\"sku\": \"HIEL-BARR\", \"costo\": 0, \"modulo\": \"hielo\", \"nombre\": \"Hielo Barra\", \"precio\": 0, \"unidad\": \"pieza\", \"stock_minimo\": 5, \"controla_stock\": true}], \"inventario_critico\": true}',1,'2026-04-14 07:59:00.811889','2026-04-14 07:59:00.811889');
/*!40000 ALTER TABLE `perfiles_negocio` ENABLE KEYS */;
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
  `modulo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_5b70474dda8aa40c28916b62e4` (`sku`,`tenant_id`,`empresa_id`),
  KEY `IDX_06e44dde74284af883347e26b9` (`tenant_id`,`empresa_id`),
  KEY `FK_5aaee6054b643e7c778477193a3` (`categoria_id`),
  CONSTRAINT `FK_5aaee6054b643e7c778477193a3` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=326 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (262,4,4,'PROD001','Filete Empanizado','Filete de pescado cubierto con empanizado crujiente y dorado al momento, servido caliente acompa├▒ado de papas ensalada y arroz',120.00,84.00,8,'7500000000001','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.583517','2026-03-17 13:28:09.050924','/api/uploads/img/mariscos213s/filete-empanizado.jpeg',NULL),(263,4,4,'PROD002','Filete Gratinado','Filete de pescado cubierto con queso gratinado que se derrite sobre el pescado, creando un sabor cremoso acompa├▒ado de papas ensalada y arroz',145.00,101.50,8,'7500000000002','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.600668','2026-03-17 13:28:09.068070','/api/uploads/img/mariscos213s/filete-gratinado.jpeg',NULL),(264,4,4,'PROD003','Filete al Mojo de Ajo','Filete de pescado salteado en mantequilla con ajo dorado soya y cilantro acompa├▒ado de papas ensalada y arroz',145.00,101.50,8,'7500000000003','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.616606','2026-03-17 13:28:09.074780','/api/uploads/img/mariscos213s/filete-al-mojo.jpeg',NULL),(265,4,4,'PROD004','Filete a la Plancha','Filete fresco cocinado a la plancha con especias y un toque de lim├│n que resalta su sabor natural acompa├▒ado de papa ensalada y arroz',135.00,94.50,8,'7500000000004','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.634999','2026-03-17 13:28:09.079617','/api/uploads/img/mariscos213s/filete-al-mojo.jpeg',NULL),(266,4,4,'PROD005','Filete Empanizado Mixto','Filete empanizado  y 2 a 3 camarones empanizados disfrutar una deliciosa combinaci├│n de mariscos acompa├▒ada de papas ensalada y arroz',145.00,101.50,8,'7500000000005','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.655453','2026-03-17 13:28:09.085012','/api/uploads/img/mariscos213s/filete-mixto.jpeg',NULL),(267,4,4,'PROD006','Camaron Empanizado','Camarones cubiertos con empanizado dorado y crujiente, fritos al momento para mantener su jugosidad acompa├▒ado de papas ensalada y arroz',145.00,101.50,9,'7500000000006','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.672439','2026-03-17 17:34:12.496774','/api/uploads/img/mariscos213s/camarones-empanizados.jpeg',NULL),(268,4,4,'PROD007','Camaron Gratinado','Camarones preparados con queso gratinado que aporta un sabor cremoso y delicioso acompa├▒ado de papas ensalada y arroz',155.00,108.50,9,'7500000000007','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.689969','2026-03-17 17:34:12.511683','/api/uploads/img/mariscos213s/camarones-gratinados.jpeg',NULL),(269,4,4,'PROD008','Camaron al Mojo de Ajo','camarones preparados salteado en mantequilla con ajo dorado soya y cilantro acompa├▒ado de papas ensalada y arroz',145.00,101.50,9,'7500000000008','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.706161','2026-03-17 17:34:12.515515','/api/uploads/img/mariscos213s/camarones-diabla.jpeg',NULL),(270,4,4,'PROD009','Camaron al Coco','Camarones empanizados con coco rallado que les da un toque crujiente y ligeramente dulce acompa├▒adocon salsa de mango papas arroz y ensalada',145.00,101.50,9,'7500000000009','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.721550','2026-03-17 17:34:12.523390','/api/uploads/img/mariscos213s/camaron.jpeg',NULL),(271,4,4,'PROD010','Caldo de Camaron 1 Litro','Caldo caliente preparado con camarones frescos, verduras y especias que brindan un sabor intenso y reconfortante.',155.00,108.50,10,'7500000000010','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.737197','2026-03-17 17:34:12.528788','/api/uploads/img/mariscos213s/consome.jpeg',NULL),(272,4,4,'PROD011','Caldo de Camaron 1/2 Litro','Caldo caliente preparado con camarones frescos, verduras y especias que brindan un sabor intenso y reconfortante.',95.00,66.50,10,'7500000000011','1/2 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.759414','2026-03-17 17:34:12.533478','/api/uploads/img/mariscos213s/consome.jpeg',NULL),(273,4,4,'PROD012','Caldo de Pescado','caldo caliente con pescado fresco y verduras cocinadas en un caldo lleno de sabor.',145.00,101.50,10,'7500000000012','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.776962','2026-03-17 13:28:09.121476','/api/uploads/img/mariscos213s/caldo-de-pez.jpeg',NULL),(274,4,4,'PROD013','Caldo de Pescado','caldo caliente con pescado fresco y verduras cocinadas en un caldo lleno de sabor.',85.00,59.50,10,'7500000000013','1/2 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.795789','2026-03-17 13:28:09.125857','/api/uploads/img/mariscos213s/caldo-de-pez.jpeg',NULL),(275,4,4,'PROD014','Caldo Mixto','Caldo tradicional con mezcla de mariscos como camar├│n y pescado acompa├▒ado de verduras.',155.00,108.50,10,'7500000000014','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.813165','2026-03-17 13:28:09.130521','/api/uploads/img/mariscos213s/caldo-mixto.jpeg',NULL),(276,4,4,'PROD015','Caldo Mixto','Caldo tradicional con mezcla de mariscos como camar├│n y pescado acompa├▒ado de verduras.',95.00,66.50,10,'7500000000015','1/2 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.829679','2026-03-17 13:28:09.136924','/api/uploads/img/mariscos213s/caldo-mixto.jpeg',NULL),(277,4,4,'PROD016','Consome Grande','Caldo ligero preparado con especias y mariscos que brinda un sabor suave y reconfortante.',120.00,84.00,10,'7500000000016','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.851242','2026-03-17 17:34:12.537544','/api/uploads/img/mariscos213s/consome.jpeg',NULL),(278,4,4,'PROD017','Consome 1/2','Caldo ligero preparado con especias y mariscos que brinda un sabor suave y reconfortante.',75.00,52.50,10,'7500000000017','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.870327','2026-03-17 17:34:12.541851','/api/uploads/img/mariscos213s/consome.jpeg',NULL),(279,4,4,'PROD018','Sopa de Mariscos','Deliciosa sopa preparada con variedad de mariscos en un caldo concentrado lleno de sabor.',200.00,140.00,10,'7500000000018','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.887533','2026-03-17 13:28:09.152643','/api/uploads/img/mariscos213s/sopa-de-mariscos.jpeg',NULL),(280,4,4,'PROD019','Mojarra Frita','Mojarra entera frita hasta quedar dorada y crujiente por fuera, jugosa por dentro acompa├▒ada de papas arroz y ensalda',180.00,126.00,11,'7500000000019','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.903750','2026-03-17 13:28:09.157532',NULL,NULL),(281,4,4,'PROD020','Papas a la Francesa','Papas fritas doradas y crujientes, perfectas como acompa├▒amiento.',45.00,31.50,11,'7500000000020','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.916784','2026-03-17 13:28:09.162527',NULL,NULL),(282,4,4,'PROD021','Papas a la Francesa con Queso','Papas fritas cubiertas con queso derretido para un sabor extra delicioso.',70.00,49.00,11,'7500000000021','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.930323','2026-03-12 17:07:02.930323',NULL,NULL),(283,4,4,'PROD022','Cebollas Empanizadas','Aros de cebolla empanizados y fritos hasta quedar crujientes por fuera y suaves por dentro.',45.00,31.50,11,'7500000000022','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.943996','2026-03-19 07:37:34.000000',NULL,NULL),(284,4,4,'PROD023','Tostada Extra','paquete con 6 tostadas',2.00,1.40,11,'7500000000023','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.959465','2026-03-17 13:28:09.169379','/api/uploads/img/mariscos213s/tostada-con-todo.jpeg',NULL),(285,4,4,'PROD024','Porcion de Arroz',NULL,15.00,10.50,11,'7500000000024','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.977103','2026-03-17 17:34:12.545817',NULL,NULL),(286,4,4,'PROD025','Salsa Extra',NULL,5.00,3.50,11,'7500000000025','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:02.991483','2026-03-12 17:07:02.991483',NULL,NULL),(287,4,4,'PROD026','Aderezo Extra','',5.00,3.50,11,'7500000000026','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.008080','2026-03-19 23:31:50.000000','/api/uploads/producto-1773361992462-pk34.jpg',NULL),(288,4,4,'PROD027','Refresco',NULL,20.00,14.00,11,'7500000000027','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.024344','2026-03-12 17:07:03.024344',NULL,NULL),(289,4,4,'PROD028','Tostada de Aguachile','Camar├│n fresco marinado en lim├│n con nuestra salsa especial (verde, roja, negra o mango) servido sobre tostada crujiente con pepino y cebolla.',65.00,45.50,12,'7500000000028','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.042967','2026-03-17 13:28:09.174217','/api/uploads/img/mariscos213s/tostada-de-ceviche.jpeg',NULL),(290,4,4,'PROD029','Tostada de Ceviche de Pez','Pescado fresco marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.',55.00,38.50,12,'7500000000029','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.063388','2026-03-17 13:28:09.179652','/api/uploads/img/mariscos213s/tostiviche.jpeg',NULL),(291,4,4,'PROD030','Tostada Mixta Ceviche Pez/Camaron','Pescado fresco y camaron marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.',75.00,52.50,12,'7500000000030','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.085654','2026-03-17 17:34:12.550591','/api/uploads/img/mariscos213s/tostada-mixta.jpeg',NULL),(292,4,4,'PROD031','Tostada Mixta Ceviche Pez, Camaron y Pulpo','Pescado fresco y camaron y pulpo marinado con limon con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.',100.00,70.00,12,'7500000000031','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.120390','2026-03-17 17:34:12.555628','/api/uploads/img/mariscos213s/tostada-megalodon.jpeg',NULL),(293,4,4,'PROD032','Tostada de Pulpo','Pulpo suave y fresco con tomate, cebolla blanca ,morada y cilantro, servido sobre tostada con aderezo de la casa kermato y aguacate.',90.00,63.00,12,'7500000000032','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.135221','2026-03-17 13:28:09.195862','/api/uploads/img/mariscos213s/tostada-de-pulpo.jpeg',NULL),(294,4,4,'PROD033','Tostada de Camaron','Camaron fresco en una tostada sobre una cama de pepino con aderezo de la casa y aguacate',65.00,45.50,12,'7500000000033','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.151767','2026-03-17 17:34:12.559468','/api/uploads/img/mariscos213s/tostada-de-camaron.jpeg',NULL),(295,4,4,'PROD034','Tostada de Atun','Cubos de at├║n fresco preparados con salsas especiales y aguacate sobre tostada con un toque de cebolla empanizada',120.00,84.00,12,'7500000000034','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.167172','2026-03-17 17:34:12.562748','/api/uploads/img/mariscos213s/tostada-de-atun.jpeg',NULL),(296,4,4,'PROD035','Agua Chile Rojo','Camarones frescos ba├▒ados en salsa roja picante con lim├│n, pepino y cebolla.',150.00,105.00,13,'7500000000035','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.181335','2026-03-17 13:28:09.213786','/api/uploads/img/mariscos213s/aguachile-rojo.jpeg',NULL),(297,4,4,'PROD036','Agua Chile Rojo','Camarones frescos ba├▒ados en salsa roja picante con lim├│n, pepino y cebolla.',280.00,196.00,13,'7500000000036','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.193916','2026-03-17 13:28:09.219222','/api/uploads/img/mariscos213s/aguachile-rojo.jpeg',NULL),(298,4,4,'PROD037','Agua Chile Verde','Camarones frescos en salsa verde de chile y cilantro con lim├│n y pepino.',150.00,105.00,13,'7500000000037','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.205682','2026-03-17 13:28:09.223728','/api/uploads/img/mariscos213s/aguachile-verde.jpeg',NULL),(299,4,4,'PROD038','Agua Chile Verde','Camarones frescos en salsa verde de chile y cilantro con lim├│n y pepino.',280.00,196.00,13,'7500000000038','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.216570','2026-03-19 08:27:37.000000','/api/uploads/producto-1773908854969-1vnw.jpeg',NULL),(300,4,4,'PROD039','Agua Chile Negro','Camarones preparados con salsa oscura especial de la casa con un sabor intenso y ├║nico.',150.00,105.00,13,'7500000000039','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.231091','2026-03-17 13:28:09.233573','/api/uploads/img/mariscos213s/aguachile-negro.jpeg',NULL),(301,4,4,'PROD040','Agua Chile Negro','Camarones preparados con salsa oscura especial de la casa con un sabor intenso y ├║nico.',280.00,196.00,13,'7500000000040','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.243774','2026-03-18 00:11:03.000000','/api/uploads/img/mariscos213s/aguachile-negro.jpeg',NULL),(302,4,4,'PROD041','Agua Chile de Mango','Camarones frescos con salsa de mango, lim├│n y chile que combina lo dulce con lo picante.',150.00,105.00,13,'7500000000041','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.261418','2026-03-18 00:11:04.000000','/api/uploads/img/mariscos213s/aguachile-mango.jpeg',NULL),(303,4,4,'PROD042','Agua Chile de Mango','Camarones frescos con salsa de mango, lim├│n y chile que combina lo dulce con lo picante.',280.00,196.00,13,'7500000000042','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.282824','2026-03-18 00:11:04.000000','/api/uploads/img/mariscos213s/aguachile-mango.jpeg',NULL),(304,4,4,'PROD043','Coctel Mediano','Camarones cocidos en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',120.00,84.00,14,'7500000000043','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.296953','2026-03-17 17:34:12.568678','/api/uploads/img/mariscos213s/coctel.jpeg',NULL),(305,4,4,'PROD044','Coctel Grande','Camarones cocidos en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',230.00,161.00,14,'7500000000044','pza',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.311217','2026-03-17 17:34:12.572497','/api/uploads/img/mariscos213s/coctel-grande.jpeg',NULL),(306,4,4,'PROD045','Coctel con Pulpo Mediano','deliciosa mezcla de camarones y pulpo en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',150.00,105.00,14,'7500000000045','Mediano',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.324122','2026-03-17 17:34:12.575976','/api/uploads/img/mariscos213s/coctel.jpeg',NULL),(307,4,4,'PROD046','Coctel con Pulpo Grande','deliciosa mezcla de camarones y pulpo en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',290.00,203.00,14,'7500000000046','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.336167','2026-03-17 17:34:12.579660','/api/uploads/img/mariscos213s/coctel-grande.jpeg',NULL),(308,4,4,'PROD047','Coctel con Ceviche Mediano','deliciosa mezcla de camarones y ceviche fresco en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',150.00,105.00,14,'7500000000047','Mediano',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.351173','2026-03-17 17:34:12.584767','/api/uploads/img/mariscos213s/coctel.jpeg',NULL),(309,4,4,'PROD048','Coctel con Ceviche Grande','deliciosa mezcla de camarones y ceviche fresco en una refrescante en salsa coctelera de la casa con aguacate, cilantro y cebolla.',290.00,203.00,14,'7500000000048','Grande',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.364392','2026-03-17 17:34:12.589475','/api/uploads/img/mariscos213s/coctel-grande.jpeg',NULL),(310,4,4,'PROD049','Ceviche de Pescado','Pescado fresco marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',130.00,91.00,15,'7500000000049','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.379245','2026-03-17 13:28:09.406316','/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg',NULL),(311,4,4,'PROD050','Ceviche de Pescado','Pescado fresco marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',250.00,175.00,15,'7500000000050','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.400054','2026-03-17 13:28:09.412615','/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg',NULL),(312,4,4,'PROD051','Ceviche Mixto Pez y Camaron 1/2','Pescado fresco con camaron marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',160.00,112.00,15,'7500000000051','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.417777','2026-03-17 17:34:12.593911','/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg',NULL),(313,4,4,'PROD052','Ceviche Mixto Pez y Camaron 1 Litro','Pescado fresco con  marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',310.00,217.00,15,'7500000000052','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.432780','2026-03-17 17:34:12.599094','/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg',NULL),(314,4,4,'PROD053','Ceviche Mixto Pez, Camaron y Pulpo 1/2','Pescado fresco con camaron y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',200.00,140.00,15,'7500000000053','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.447236','2026-03-17 17:34:12.603154','/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg',NULL),(315,4,4,'PROD054','Ceviche Mixto Pez, Camaron y Pulpo 1 Litro','Pescado fresco con camaron y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',380.00,266.00,15,'7500000000054','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.459002','2026-03-17 17:34:12.608654','/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg',NULL),(316,4,4,'PROD055','Ceviche Mixto Pez/Pulpo 1/2','Pescado fresco y  pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',200.00,140.00,15,'7500000000055','01-feb',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.471753','2026-03-17 17:34:12.614505','/api/uploads/img/mariscos213s/medio-de-ceviche.jpeg',NULL),(317,4,4,'PROD056','Ceviche Mixto Pez/Pulpo 1 Litro','Pescado fresco y pulpo marinado en lim├│n con jitomate, cebolla, cilantro y un toque de chile.',380.00,266.00,15,'7500000000056','1 Litro',16.00,1,1,0,0.00,0.00,0,NULL,'2026-03-12 17:07:03.484311','2026-03-17 17:34:12.619558','/api/uploads/img/mariscos213s/litro-de-ceviche.jpeg',NULL),(318,6,5,'CARB-3KG','Carbón Bolsa 3kg','',45.00,35.00,19,NULL,'Bolsa',0.00,1,1,1,10.00,20.00,0,NULL,'2026-04-14 07:59:00.836038','2026-04-14 18:56:22.000000','/api/uploads/producto-1776181404556-hd98.jpg',NULL),(319,6,5,'CARB-2.5KG','Carbón Bolsa 2.5kg','',35.00,25.00,19,NULL,'Bolsa',0.00,1,1,1,11.00,20.00,0,NULL,'2026-04-14 07:59:00.841339','2026-04-14 20:42:29.296316','/api/uploads/producto-1776181394525-q4dz.jpg',NULL),(320,6,5,'CARB-GRAN','Carbón Granel kg','',14.00,10.00,19,NULL,'kg',0.00,1,1,1,189.00,10.00,0,NULL,'2026-04-14 07:59:00.845666','2026-04-14 19:52:34.146231','/api/uploads/producto-1776181641010-yv81.jpg',NULL),(321,6,5,'HIEL-5KG','Hielo Bolsa 5kg Mayoreo','',30.00,20.00,20,NULL,'Bolsa',0.00,1,1,1,8.00,30.00,0,NULL,'2026-04-14 07:59:00.850378','2026-04-14 19:52:34.143033','/api/uploads/producto-1776181674922-id9i.jpeg',NULL),(322,6,5,'HIEL-20KG','Hielo Bolsa 20kg','',100.00,90.00,20,NULL,'bolsa',0.00,1,1,1,9.00,10.00,0,NULL,'2026-04-14 07:59:00.854643','2026-04-14 19:52:34.140056','/api/uploads/producto-1776181663373-sibi.jpeg',NULL),(323,6,5,'HIEL-BARR','Hielo Barra','',350.00,300.00,20,NULL,'pieza',0.00,1,1,1,49.00,5.00,0,NULL,'2026-04-14 07:59:00.859011','2026-04-14 17:24:05.277774','/api/uploads/producto-1776181650437-jrgw.jpg',NULL),(324,6,5,'HIEL-5KGM','Hielo Bolsa 5kg Menudeo','',35.00,25.00,20,NULL,'Bolsa',0.00,1,1,1,100.00,10.00,0,NULL,'2026-04-14 15:31:59.961030','2026-04-14 18:56:52.000000','/api/uploads/producto-1776181684757-d0bd.jpeg',NULL),(325,6,5,'HIELTR-30K','Hielo Triturado 30 kg','',110.00,100.00,20,NULL,'Bolsa',0.00,1,1,1,99.00,NULL,0,NULL,'2026-04-14 15:33:44.195203','2026-04-14 18:57:15.067047','/api/uploads/producto-1776181911822-lw0j.png',NULL);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_perfiles`
--

DROP TABLE IF EXISTS `tenant_perfiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_perfiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `perfil_clave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_override` json DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_19705df3b9ae18be2e7e83c1a7` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_perfiles`
--

LOCK TABLES `tenant_perfiles` WRITE;
/*!40000 ALTER TABLE `tenant_perfiles` DISABLE KEYS */;
INSERT INTO `tenant_perfiles` VALUES (1,6,'carbon_hielo',NULL,1,'2026-04-14 07:59:00.819334','2026-04-14 08:33:23.000000');
/*!40000 ALTER TABLE `tenant_perfiles` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'iaDoS Corp','iados-corp','iaDoS - Inteligencia Artificial DevOps Solutions',NULL,NULL,'555-IADOS','info@iados.mx',NULL,1,'2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000'),(4,'Mariscos 2-13\'s San Miguel','mariscos-2-13\'s-san-miguel','Mariscos 2-13\'s San Miguel','',NULL,'8318989580','contacto@mariscos213s.com',NULL,1,'2026-02-18 05:30:37.689786','2026-02-18 05:30:37.689786'),(6,'Regina','regina',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-04-14 07:58:40.546768','2026-04-14 07:58:40.546768');
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
  `fuente_familia` varchar(100) NOT NULL DEFAULT 'Consolas',
  `fuente_tamano` int NOT NULL DEFAULT '11',
  `logo_posicion` varchar(20) NOT NULL DEFAULT 'centro',
  `copias` int NOT NULL DEFAULT '1',
  `comanda_enabled` tinyint NOT NULL DEFAULT '0',
  `comanda_header` varchar(100) DEFAULT NULL,
  `comanda_ancho` int NOT NULL DEFAULT '80',
  `comanda_auto_print` tinyint NOT NULL DEFAULT '0',
  `comanda_mostrar_precio` tinyint NOT NULL DEFAULT '1',
  `comanda_copias` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `IDX_3b407c46f6f31c07cd7046557f` (`tenant_id`,`empresa_id`,`tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_configs`
--

LOCK TABLES `ticket_configs` WRITE;
/*!40000 ALTER TABLE `ticket_configs` DISABLE KEYS */;
INSERT INTO `ticket_configs` VALUES (1,1,NULL,NULL,'Restaurante Demo iaDoS','Av. Principal #123, Centro','Tel: 555-IADOS','Gracias por su preferencia!','Desarrollado por iaDoS - iados.mx',80,42,1,1,1,1,1,'2026-02-17 07:49:37.000000','2026-02-17 07:49:37.000000',NULL,'Courier New',9,'centro',1,0,NULL,80,0,1,1),(2,4,NULL,NULL,'Mariscos 2-13\'s ','San Miguel','Apodaca Nuevo Leon Suc. #1','Gracias por su compra','Desarrollado por iaDoS..mx',80,42,1,1,1,1,1,'2026-02-18 06:53:31.287000','2026-03-23 18:05:40.000000','/api/uploads/logo-ticket-1771400947812.jpeg','Consolas',11,'centro',1,0,NULL,80,0,1,1),(3,6,NULL,NULL,'Abastecimiento Regina','Guadalupe, Nuevo Leon.',NULL,'Gracias por su compra','Desarrollado por iaDoS - iados.mx',80,42,1,1,1,1,0,'2026-04-14 16:53:38.018835','2026-04-14 16:55:10.000000','/api/uploads/logo-ticket-1776185705980-iri4.jpg','Consolas',11,'centro',1,0,NULL,80,0,1,1),(4,6,NULL,NULL,'Abastecimiento Regina','Guadalupe, Nuevo Leon.',NULL,'Gracias por su compra','Desarrollado por iaDoS - iados.mx',80,42,1,1,1,1,1,'2026-04-14 16:53:51.917371','2026-04-14 16:53:51.917371','/api/uploads/logo-ticket-1776185627937-r6ff.jpg','Consolas',11,'centro',1,0,NULL,80,0,1,1),(5,6,NULL,NULL,'Abastecimiento Regina','Guadalupe, Nuevo Leon.',NULL,'Gracias por su compra','',80,42,1,1,1,1,1,'2026-04-14 16:54:04.695977','2026-04-14 16:54:04.695977','/api/uploads/logo-ticket-1776185627937-r6ff.jpg','Consolas',11,'centro',1,0,NULL,80,0,1,1),(6,6,NULL,NULL,'Abastecimiento Regina','Guadalupe, Nuevo Leon.',NULL,'Gracias por su compra','',80,42,1,1,1,1,1,'2026-04-14 16:54:13.540465','2026-04-14 16:54:13.540465','/api/uploads/logo-ticket-1776185627937-r6ff.jpg','Consolas',11,'centro',1,0,NULL,80,0,1,1);
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
  `slug` varchar(100) DEFAULT NULL,
  `folio_pedido_counter` int NOT NULL DEFAULT '0',
  `folio_venta_counter` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `IDX_14ac7ede89ea2e148e1a72ea1d` (`tenant_id`,`empresa_id`),
  KEY `FK_fc2d97946b484dafe8301319786` (`empresa_id`),
  CONSTRAINT `FK_fc2d97946b484dafe8301319786` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tiendas`
--

LOCK TABLES `tiendas` WRITE;
/*!40000 ALTER TABLE `tiendas` DISABLE KEYS */;
INSERT INTO `tiendas` VALUES (3,4,4,'Mariscos 2-13\'s San Miguel','Apodaca','','contacto@mariscos213s.com','America/Mexico_City',NULL,'{\"ancho\": 80, \"copias\": 1, \"modelo\": \"\", \"auto_print\": false}',1,'2026-02-18 05:32:42.162669','2026-04-14 15:16:04.603184','{\"num_mesas\": 20, \"iva_enabled\": false, \"iva_incluido\": true, \"modo_servicio\": \"autoservicio\", \"notas_rapidas\": \"Sin cebolla, Sin Salsa, Sin Sal, Sin Ajo, Con Muchas papas, Sin picante\", \"iva_porcentaje\": 16, \"notas_por_item\": true, \"self_order_url\": \"https://pos.iados.online/\", \"tipo_cobro_mesa\": \"post_pago\", \"self_order_enabled\": false, \"datos_envio_enabled\": true, \"notas_pedido_enabled\": false, \"habilitar_cuenta_abierta\": true, \"mostrar_so_pendiente_en_pos\": true}',NULL,0,0),(4,6,5,'Regina','Guadalupe Mty','8318989580','axel.muniz@live.com','America/Mexico_City',NULL,'{\"ancho\": 80, \"copias\": 1, \"modelo\": \"\", \"auto_print\": false}',1,'2026-04-14 07:58:40.556434','2026-04-15 00:15:14.000000','{\"num_mesas\": 20, \"iva_enabled\": false, \"iva_incluido\": true, \"modo_servicio\": \"mesa\", \"notas_rapidas\": \"\", \"iva_porcentaje\": 16, \"notas_por_item\": true, \"whatsapp_phone\": \"528318989580\", \"whatsapp_token\": \"\", \"caja_ocultar_ui\": true, \"dashboard_top_n\": 10, \"tipo_cobro_mesa\": \"post_pago\", \"sidebar_permisos\": {\"cajero\": [\"/pos\", \"/dashboard\", \"/inventario\", \"/reportes\", \"/pedidos\"], \"mesero\": [\"/pos\", \"/pedidos\"]}, \"whatsapp_enabled\": true, \"whatsapp_eventos\": {\"stock_bajo\": true, \"nueva_venta\": true, \"resumen_diario\": true}, \"caja_auto_enabled\": true, \"cantidades_rapidas\": \"10,25,50,100\", \"mesa_numero_oculto\": true, \"self_order_enabled\": false, \"datos_envio_enabled\": true, \"notas_pedido_enabled\": false, \"cajero_dashboard_enabled\": true, \"dashboard_mostrar_margen\": true, \"dashboard_unidad_enabled\": false, \"dashboard_ventas_enabled\": false, \"habilitar_cuenta_abierta\": false, \"dashboard_selforder_enabled\": false, \"mostrar_so_pendiente_en_pos\": false, \"dashboard_categorias_enabled\": true, \"dashboard_drill_down_enabled\": true, \"dashboard_top_productos_enabled\": true}','regina-4',4,3);
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
  `modulo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_4a1e826dc164ebf584d8604d17` (`tenant_id`,`empresa_id`),
  KEY `IDX_e9f4c2efab52114c4e99e28efb` (`tenant_id`,`email`),
  CONSTRAINT `FK_109638590074998bb72a2f2cf08` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,1,1,'Super Admin','admin@iados.mx','$2a$10$vxlPjwiQUu/dK/gyUB.DI.2HJakEqGynxOjwwqZZpCax8dOqRuvoy','superadmin','0000',1,'2026-04-15 00:14:44','2026-02-17 07:49:37.000000','2026-04-15 00:14:43.000000',NULL),(2,1,1,1,'Administrador','admin2@iados.mx','$2a$10$vxlPjwiQUu/dK/gyUB.DI.2HJakEqGynxOjwwqZZpCax8dOqRuvoy','admin','1111',1,'2026-03-12 15:06:48','2026-02-17 07:49:37.000000','2026-03-12 15:06:48.000000',NULL),(3,1,1,1,'Cajero Demo','cajero@iados.mx','$2a$10$2GE3so4U7kcdP5u0xd97QO7IeIripbjEuSqdAHqugrpKnxQOgskl6','cajero','1234',1,'2026-04-14 21:23:53','2026-02-17 07:49:37.000000','2026-04-14 21:23:52.000000',NULL),(4,1,1,1,'Mesero Demo','mesero@iados.mx','$2a$10$2GE3so4U7kcdP5u0xd97QO7IeIripbjEuSqdAHqugrpKnxQOgskl6','mesero','5678',1,NULL,'2026-02-17 07:49:37.000000','2026-02-17 22:47:12.000000',NULL),(7,4,4,3,'Mariscos 2-13\'s San Miguel','admin@mariscos213s.com','$2a$10$vxlPjwiQUu/dK/gyUB.DI.2HJakEqGynxOjwwqZZpCax8dOqRuvoy','admin','1234',1,'2026-04-14 15:15:16','2026-02-18 05:32:42.393333','2026-04-14 15:15:16.000000',NULL),(10,4,4,3,'cajero','cajero@mariscos213s.com','$2a$10$3.P56QWzYdgjpOpo6ZwerOc8noiRSGZEMkjU2LDBeXx1nGmq19o3y','cajero','1234',1,'2026-03-20 20:05:42','2026-03-11 19:54:08.681757','2026-03-20 20:05:41.000000',NULL),(11,4,4,3,'Mesero iaDoS','mesero@mariscos213s.com','$2a$10$AQ4S.WgGZwPIM5gdMmPzIOXTNTXw0aL84hP.e5iplVE/vvsC4jVzq','mesero','1234',1,NULL,'2026-03-11 19:57:27.072260','2026-03-19 07:27:47.000000',NULL),(12,4,4,3,'Mesero Axel','mesero02@mariscos213s.com','$2a$10$34D/F00VJ/Q/M8dRXZD4Su3Cb6b29yVg/LJqwin7EKvWdAzY24nzG','mesero','1234',1,'2026-03-23 18:02:11','2026-03-19 07:26:37.371428','2026-03-23 18:02:10.000000',NULL),(13,4,4,3,'Mesero Fabian','mesero03@mariscos213s.com','$2a$10$RbBbJ0Q3AG8SlPGxNaFdje8G9syKil3ht8DYYrPSH5BdW/kbZnCF.','mesero','1234',1,NULL,'2026-03-19 07:26:58.461201','2026-03-19 07:26:58.461201',NULL),(14,4,4,3,'Mesero Daniel','mesero04@mariscos213s.com','$2a$10$IdxETscf8vdTa0E7letg5OKyL4/aclA78LEH2wjfxZV4Ak5SFUk0a','mesero','1234',1,NULL,'2026-03-19 07:27:35.992702','2026-03-19 07:27:35.992702',NULL),(15,6,5,4,'Regina','admin@regina.com','$2a$10$GxFykxZaPQudcs4ItXiZ1eLVq41IeH3EPE1WGn7YrJ5uZmMb7bb/a','admin','1234',1,'2026-04-15 00:16:27','2026-04-14 07:58:40.655753','2026-04-15 00:16:26.000000',NULL),(16,6,5,4,'Cajero Hielo','cajerohielo@regina.com','$2a$10$QxB1mBf/J1btAc/VY9EVDuFyaQSUNi./Gh3ClbqoE7/bXdk34oSQ6','mesero','1234',1,'2026-04-14 23:22:32','2026-04-14 08:31:32.831342','2026-04-14 23:22:32.000000','hielo'),(17,6,5,4,'Cajero Carbon','cajerocarbon@regina.com','$2a$10$Rgb8mbIBkvKifyMWBxZy6uhN2/WbrTO5bOBKdDgdfbxOi8iYQRhza','mesero','1234',1,'2026-04-14 23:07:33','2026-04-14 08:32:03.086291','2026-04-14 23:10:00.000000','carbon'),(18,6,5,4,'Regina Admin','regina@regina.com','$2a$10$A4LEQWwErUGyCHm..DqZvOhG6iJZ5wgAgOYaOtw.lZXp52zNWOfFm','cajero','1234',1,'2026-04-15 00:15:36','2026-04-14 23:06:42.042224','2026-04-15 00:15:36.000000',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venta_detalles`
--

LOCK TABLES `venta_detalles` WRITE;
/*!40000 ALTER TABLE `venta_detalles` DISABLE KEYS */;
INSERT INTO `venta_detalles` VALUES (70,28,276,'Caldo Mixto','PROD015',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(71,28,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(72,28,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(73,29,277,'Consome Grande','PROD016',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(74,29,271,'Caldo de Camaron 1 Litro','PROD010',1.00,155.00,0.00,0.00,155.00,NULL,NULL),(75,29,270,'Camaron al Coco','PROD009',1.00,145.00,0.00,0.00,145.00,NULL,NULL),(76,29,295,'Tostada de Atun','PROD034',1.00,120.00,0.00,0.00,120.00,NULL,NULL),(77,30,279,'Sopa de Mariscos','PROD018',1.00,200.00,0.00,0.00,200.00,NULL,NULL),(78,30,278,'Consome 1/2','PROD017',1.00,75.00,0.00,0.00,75.00,NULL,NULL),(79,30,272,'Caldo de Camaron 1/2 Litro','PROD011',1.00,95.00,0.00,0.00,95.00,NULL,NULL),(80,31,316,'Ceviche Mixto Pez/Pulpo 1/2','PROD055',1.00,200.00,0.00,0.00,200.00,NULL,'sin cebolla'),(81,31,317,'Ceviche Mixto Pez/Pulpo 1 Litro','PROD056',1.00,380.00,0.00,0.00,380.00,NULL,'oks'),(82,32,318,'Carbón Bolsa 3kg','CARB-3KG',1.00,0.00,0.00,0.00,0.00,NULL,NULL),(83,32,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',1.00,0.00,0.00,0.00,0.00,NULL,NULL),(84,32,320,'Carbón Granel kg','CARB-GRAN',1.00,0.00,0.00,0.00,0.00,NULL,NULL),(85,33,321,'Hielo Bolsa 5kg','HIEL-5KG',1.00,0.00,0.00,0.00,0.00,NULL,NULL),(86,34,262,'Filete Empanizado','PROD001',1.00,120.00,0.00,0.00,120.00,NULL,'Con Muchas papas, Sin Salsa'),(87,34,276,'Caldo Mixto','PROD015',1.00,95.00,0.00,0.00,95.00,NULL,'Sin picante'),(88,35,262,'Filete Empanizado','PROD001',1.00,120.00,0.00,0.00,120.00,NULL,'Sin Sal'),(89,35,276,'Caldo Mixto','PROD015',1.00,95.00,0.00,0.00,95.00,NULL,'Con Muchas papas'),(90,36,318,'Carbón Bolsa 3kg','CARB-3KG',1.00,45.00,0.00,0.00,45.00,NULL,NULL),(91,36,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',1.00,35.00,0.00,0.00,35.00,NULL,NULL),(92,37,318,'Carbón Bolsa 3kg','CARB-3KG',1.00,45.00,0.00,0.00,45.00,NULL,NULL),(93,37,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',1.00,35.00,0.00,0.00,35.00,NULL,NULL),(94,37,320,'Carbón Granel kg','CARB-GRAN',1.00,14.00,0.00,0.00,14.00,NULL,NULL),(95,38,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',1.00,35.00,0.00,0.00,35.00,NULL,NULL),(96,38,318,'Carbón Bolsa 3kg','CARB-3KG',15.00,45.00,0.00,0.00,675.00,NULL,NULL),(97,39,318,'Carbón Bolsa 3kg','CARB-3KG',4.00,45.00,0.00,0.00,180.00,NULL,NULL),(98,40,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',9.00,35.00,0.00,0.00,315.00,NULL,NULL),(99,41,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',8.00,35.00,0.00,0.00,280.00,NULL,NULL),(100,42,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',5.00,35.00,0.00,0.00,175.00,NULL,NULL),(101,43,318,'Carbón Bolsa 3kg','CARB-3KG',1.00,45.00,0.00,0.00,45.00,NULL,NULL),(102,43,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',1.00,35.00,0.00,0.00,35.00,NULL,NULL),(103,44,320,'Carbón Granel kg','CARB-GRAN',7.00,14.00,0.00,0.00,98.00,NULL,'RFC: RAGF861106'),(104,44,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',14.00,35.00,0.00,0.00,490.00,NULL,'Daniel San'),(105,44,318,'Carbón Bolsa 3kg','CARB-3KG',5.00,45.00,0.00,0.00,225.00,NULL,NULL),(106,45,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',1.00,35.00,0.00,0.00,35.00,NULL,NULL),(107,45,325,'Hielo Triturado 30 kg','HIELTR-30K',1.00,110.00,0.00,0.00,110.00,NULL,NULL),(108,45,320,'Carbón Granel kg','CARB-GRAN',1.00,14.00,0.00,0.00,14.00,NULL,NULL),(109,46,323,'Hielo Barra','HIEL-BARR',1.00,350.00,0.00,0.00,350.00,NULL,NULL),(110,47,320,'Carbón Granel kg','CARB-GRAN',2.00,14.00,0.00,0.00,28.00,NULL,NULL),(111,47,325,'Hielo Triturado 30 kg','HIELTR-30K',1.00,110.00,0.00,0.00,110.00,NULL,NULL),(112,47,321,'Hielo Bolsa 5kg Mayoreo','HIEL-5KG',1.00,30.00,0.00,0.00,30.00,NULL,NULL),(113,48,322,'Hielo Bolsa 20kg','HIEL-20KG',1.00,100.00,0.00,0.00,100.00,NULL,NULL),(114,48,321,'Hielo Bolsa 5kg Mayoreo','HIEL-5KG',1.00,30.00,0.00,0.00,30.00,NULL,NULL),(115,48,320,'Carbón Granel kg','CARB-GRAN',1.00,14.00,0.00,0.00,14.00,NULL,NULL),(116,49,319,'Carbón Bolsa 2.5kg','CARB-2.5KG',8.00,35.00,0.00,0.00,280.00,NULL,NULL);
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
  `cliente_telefono` varchar(20) DEFAULT NULL,
  `cliente_direccion` varchar(300) DEFAULT NULL,
  `tipo_servicio` varchar(20) NOT NULL DEFAULT 'en_sitio',
  PRIMARY KEY (`id`),
  KEY `IDX_8fb7c3b36bfd543df1075e77d1` (`folio`,`tenant_id`),
  KEY `IDX_ec7e16dd98e707f583479ded42` (`tenant_id`,`created_at`),
  KEY `IDX_45d0576fcc0f59d9b584584362` (`tenant_id`,`empresa_id`,`tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (28,4,4,3,12,7,'IM00000001',NULL,370.00,0.00,0.00,370.00,'efectivo',500.00,NULL,NULL,130.00,'completada','Mesa 1',NULL,1,'2026-03-19 09:19:41.277044','2026-03-19 09:19:41.000000',9,NULL,NULL,'en_sitio'),(29,4,4,3,12,7,'IM00000002',NULL,540.00,0.00,0.00,540.00,'efectivo',1000.00,NULL,NULL,460.00,'completada','Mesa 1',NULL,1,'2026-03-19 09:20:00.250422','2026-03-19 09:20:00.000000',11,NULL,NULL,'en_sitio'),(30,4,4,3,13,10,'IM00000003',NULL,370.00,0.00,0.00,370.00,'efectivo',1000.00,NULL,NULL,630.00,'completada',NULL,NULL,1,'2026-03-20 18:22:17.088771','2026-03-20 18:22:17.088771',NULL,NULL,NULL,'en_sitio'),(31,4,4,3,13,7,'IM00000004',NULL,580.00,0.00,0.00,580.00,'efectivo',700.00,NULL,NULL,120.00,'completada',NULL,'axel',1,'2026-04-14 07:48:19.663005','2026-04-14 07:48:19.663005',NULL,NULL,NULL,'en_sitio'),(32,6,5,4,14,15,'IR00000001',NULL,0.00,0.00,0.00,0.00,'efectivo',500.00,NULL,NULL,500.00,'completada',NULL,NULL,1,'2026-04-14 08:36:14.814392','2026-04-14 08:36:14.814392',NULL,NULL,NULL,'en_sitio'),(33,6,5,4,14,17,'IR00000002',NULL,0.00,0.00,0.00,0.00,'efectivo',500.00,NULL,NULL,500.00,'completada',NULL,NULL,1,'2026-04-14 08:39:39.414042','2026-04-14 08:39:39.414042',NULL,NULL,NULL,'en_sitio'),(34,4,4,3,13,7,'IM00000005',NULL,215.00,0.00,0.00,215.00,'efectivo',500.00,NULL,NULL,285.00,'completada',NULL,'Axel Muñiz',1,'2026-04-14 09:12:24.096129','2026-04-14 09:12:24.096129',NULL,NULL,NULL,'en_sitio'),(35,4,4,3,13,7,'IM00000006',NULL,215.00,0.00,0.00,215.00,'efectivo',215.00,NULL,NULL,0.00,'completada',NULL,'Axel Muñiz',1,'2026-04-14 15:16:04.611841','2026-04-14 15:16:04.611841',NULL,NULL,NULL,'en_sitio'),(36,6,5,4,14,15,'IR00000003',NULL,80.00,0.00,0.00,80.00,'efectivo',80.00,NULL,NULL,0.00,'completada',NULL,'Axel Muñiz',1,'2026-04-14 15:35:41.291710','2026-04-14 15:35:41.291710',NULL,NULL,NULL,'en_sitio'),(37,6,5,4,14,17,'IR00000004',NULL,94.00,0.00,0.00,94.00,'efectivo',94.00,NULL,NULL,0.00,'completada',NULL,NULL,1,'2026-04-14 16:05:08.816609','2026-04-14 16:05:08.816609',NULL,NULL,NULL,'en_sitio'),(38,6,5,4,14,17,'IR00000005',NULL,710.00,0.00,0.00,710.00,'efectivo',710.00,NULL,NULL,0.00,'completada',NULL,NULL,1,'2026-04-14 16:07:37.099251','2026-04-14 16:07:37.099251',NULL,NULL,NULL,'en_sitio'),(39,6,5,4,14,17,'IR00000006',NULL,180.00,0.00,0.00,180.00,'efectivo',180.00,NULL,NULL,0.00,'completada',NULL,NULL,1,'2026-04-14 16:08:02.598319','2026-04-14 16:08:02.598319',NULL,NULL,NULL,'en_sitio'),(40,6,5,4,14,17,'IR00000007',NULL,315.00,0.00,0.00,315.00,'efectivo',315.00,NULL,NULL,0.00,'completada',NULL,NULL,1,'2026-04-14 16:18:33.550003','2026-04-14 16:18:33.550003',NULL,NULL,NULL,'en_sitio'),(41,6,5,4,14,15,'IR00000008',NULL,280.00,0.00,0.00,280.00,'efectivo',280.00,NULL,NULL,0.00,'completada',NULL,NULL,1,'2026-04-14 16:21:43.095456','2026-04-14 16:21:43.095456',NULL,NULL,NULL,'en_sitio'),(42,6,5,4,14,15,'IR00000009',NULL,175.00,0.00,0.00,175.00,'efectivo',175.00,NULL,NULL,0.00,'completada',NULL,NULL,1,'2026-04-14 16:30:04.634079','2026-04-14 16:30:04.634079',NULL,NULL,NULL,'en_sitio'),(43,6,5,4,14,15,'IR00000010',NULL,80.00,0.00,0.00,80.00,'efectivo',80.00,NULL,NULL,0.00,'completada',NULL,'Axel Muñiz',1,'2026-04-14 16:43:42.937481','2026-04-14 16:43:42.937481',NULL,NULL,NULL,'en_sitio'),(44,6,5,4,14,17,'IR00000011',NULL,813.00,0.00,0.00,813.00,'efectivo',813.00,NULL,NULL,0.00,'completada',NULL,'Fabian RAmirez',1,'2026-04-14 17:02:17.619153','2026-04-14 17:02:17.619153',NULL,NULL,NULL,'en_sitio'),(45,6,5,4,14,15,'IR00000012',NULL,159.00,0.00,0.00,159.00,'efectivo',159.00,NULL,NULL,0.00,'completada',NULL,'Fabian RAmirez',1,'2026-04-14 17:13:00.332543','2026-04-14 17:13:00.332543',NULL,NULL,NULL,'en_sitio'),(46,6,5,4,14,16,'IR00000013',NULL,350.00,0.00,0.00,350.00,'efectivo',350.00,NULL,NULL,0.00,'completada',NULL,'p',1,'2026-04-14 17:24:05.268002','2026-04-14 17:24:05.268002',NULL,NULL,NULL,'en_sitio'),(47,6,5,4,14,15,'IR00000001',NULL,168.00,0.00,0.00,168.00,'efectivo',168.00,NULL,NULL,0.00,'completada',NULL,'Axel Muñiz',1,'2026-04-14 18:57:15.047870','2026-04-14 18:57:15.047870',NULL,'8318989580','Conocido','para_llevar'),(48,6,5,4,14,15,'IR00000002',NULL,144.00,0.00,0.00,144.00,'efectivo',500.00,NULL,NULL,356.00,'completada',NULL,'Axel Muñiz',1,'2026-04-14 19:52:34.124420','2026-04-14 19:52:34.124420',NULL,'8318989580','Conocido','para_llevar'),(49,6,5,4,14,15,'IR00000003',NULL,280.00,0.00,0.00,280.00,'efectivo',280.00,NULL,NULL,0.00,'completada',NULL,NULL,1,'2026-04-14 20:42:29.284655','2026-04-14 20:42:29.284655',NULL,NULL,NULL,'en_sitio');
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-14 19:00:17
