CREATE DATABASE  IF NOT EXISTS `email_assistant` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `email_assistant`;
-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: email_assistant
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'jaypatil1965@gmail.com','pbkdf2:sha256:1000000$YY9YdLgX06YYsoDK$5eb2bcdaa8dc180c1ca74287df037a8fecffca438b3bee4f2431f17d654e5375',0,1,'2025-03-26 09:35:32'),(3,'admin@example.com','pbkdf2:sha256:1000000$znuA6km05enpBLtl$2de606a3f275af637eb58dd3d8ffd9e81c79ca01c65ec2c42983c133db6c1d54',1,1,'2025-03-26 09:48:47'),(4,'parthpatilve@gmail.com','pbkdf2:sha256:1000000$qXO0EUjNmJ3Hgjit$bdea100c0a315c2dfcf8b154d72b5e28bb537d880d79994729bb5bb8b8cb6952',0,1,'2025-03-26 09:54:24'),(5,'1@gmail.com','pbkdf2:sha256:1000000$u284vC1llxyQfeMo$f662ea7fd01fa017f3899a90526a5b9a16331460154e45bc47e1f4d91bd92e16',0,1,'2025-03-26 10:13:19'),(6,'2@gmail.com','pbkdf2:sha256:1000000$h47T2ylNa3etbr82$2693af45d551cf2943613c39384b2879b7835411bd8de1719577ab0ef187235e',0,1,'2025-03-26 10:18:38'),(7,'rishivartak624@gmail.com','pbkdf2:sha256:1000000$EwBgKEOnEmS5JWZ2$06c74040843a23e1e4c8c08fbfd6a4dc9f897bcadff49af012f1ece54a543f48',0,1,'2025-03-26 15:45:13');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-04 11:46:26
