-- =====================================================
-- ONCONNECT - BASE DE DATOS COMPLETA CON DATOS DE PRUEBA
-- =====================================================

-- Crear base de datos
DROP DATABASE IF EXISTS onconnect;
CREATE DATABASE onconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE onconnect;
SELECT DATABASE();

-- =====================================================
-- ESTRUCTURA DE TABLAS
-- =====================================================

-- Tabla de usuarios
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    birth_date DATE,
    location VARCHAR(255),
    avatar VARCHAR(255),
    user_type ENUM('patient', 'professional', 'admin') NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla específica para pacientes
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    cancer_type VARCHAR(100),
    treatment_stage ENUM('in_treatment', 'post_treatment', 'survivor'),
    diagnosis_date DATE,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla específica para profesionales
CREATE TABLE professionals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE,
    years_experience INT,
    education TEXT,
    bio TEXT,
    institution VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de servicios ofrecidos por profesionales
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    professional_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT NOT NULL, -- minutos
    price DECIMAL(8,2) DEFAULT 0.00,
    is_free BOOLEAN DEFAULT FALSE,
    service_type ENUM('consultation', 'therapy', 'counseling', 'nutrition', 'other') NOT NULL,
    modality ENUM('online', 'in_person', 'both') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);

-- Tabla de disponibilidad de profesionales
CREATE TABLE availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    professional_id INT NOT NULL,
    day_of_week INT NOT NULL, -- 0=Domingo, 1=Lunes, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);

-- Tabla de citas
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    professional_id INT NOT NULL,
    service_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INT NOT NULL,
    modality ENUM('online', 'in_person', 'phone') NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    notes TEXT,
    meeting_link VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Tabla de contenido educativo
CREATE TABLE content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    author_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(255),
    content_type ENUM('article', 'video', 'infographic', 'document') NOT NULL,
    category VARCHAR(100),
    tags TEXT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    views INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES professionals(id) ON DELETE CASCADE
);

-- Tabla de mensajes
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    attachment VARCHAR(255),
    message_type ENUM('direct', 'appointment', 'system') DEFAULT 'direct',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de reseñas
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    professional_id INT NOT NULL,
    appointment_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

-- Tabla de favoritos
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    professional_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (patient_id, professional_id)
);

-- =====================================================
-- DATOS DE PRUEBA COMPLETOS
-- =====================================================

-- Insertar usuarios (contraseña: password123 para todos)
INSERT INTO users (email, password, first_name, last_name, phone, birth_date, location, user_type, is_verified, is_active) VALUES
-- Administrador
('admin@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super', 'Admin', '900123456', '1980-01-01', 'Madrid, España', 'admin', TRUE, TRUE),

-- Profesionales
('dr.martinez@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María', 'Martínez', '691234567', '1975-03-15', 'Barcelona, España', 'professional', TRUE, TRUE),
('dr.garcia@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos', 'García', '692345678', '1980-07-22', 'Madrid, España', 'professional', TRUE, TRUE),
('dr.lopez@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana', 'López', '693456789', '1983-11-08', 'Valencia, España', 'professional', TRUE, TRUE),
('dr.rodriguez@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David', 'Rodríguez', '694567890', '1978-05-30', 'Sevilla, España', 'professional', TRUE, TRUE),
('dr.fernandez@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elena', 'Fernández', '695678901', '1985-09-12', 'Bilbao, España', 'professional', TRUE, TRUE),
('dr.ruiz@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Miguel', 'Ruiz', '696789012', '1982-02-28', 'Granada, España', 'professional', TRUE, TRUE),
('dr.sanchez@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Laura', 'Sánchez', '697890123', '1979-06-14', 'Zaragoza, España', 'professional', TRUE, TRUE),
('dr.moreno@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Javier', 'Moreno', '698901234', '1981-10-05', 'Málaga, España', 'professional', TRUE, TRUE),
('dr.jimenez@onconnect.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carmen', 'Jiménez', '699012345', '1984-12-18', 'Palma, España', 'professional', TRUE, TRUE),

-- Pacientes
('laura.fernandez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Laura', 'Fernández', '611234567', '1990-04-20', 'Madrid, España', 'patient', TRUE, TRUE),
('roberto.sanchez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Roberto', 'Sánchez', '612345678', '1985-08-15', 'Barcelona, España', 'patient', TRUE, TRUE),
('isabel.ruiz@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Isabel', 'Ruiz', '613456789', '1992-12-03', 'Valencia, España', 'patient', TRUE, TRUE),
('antonio.lopez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Antonio', 'López', '614567890', '1987-01-25', 'Sevilla, España', 'patient', TRUE, TRUE),
('maria.gonzalez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María', 'González', '615678901', '1988-09-10', 'Bilbao, España', 'patient', TRUE, TRUE),
('jose.martin@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'José', 'Martín', '616789012', '1993-05-18', 'Granada, España', 'patient', TRUE, TRUE),
('cristina.perez@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cristina', 'Pérez', '617890123', '1991-11-07', 'Zaragoza, España', 'patient', TRUE, TRUE),
('francisco.torres@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Francisco', 'Torres', '618901234', '1986-03-14', 'Málaga, España', 'patient', TRUE, TRUE);

-- Insertar datos de profesionales
INSERT INTO professionals (user_id, specialty, license_number, years_experience, education, bio, institution, is_verified, rating, total_reviews) VALUES
(2, 'Oncología Médica', 'COL28001234', 15, 'Doctor en Medicina por la Universidad de Barcelona. Especialista en Oncología Médica por el Hospital Clínic.', 'Especialista en oncología médica con 15 años de experiencia. Me dedico al tratamiento integral del cáncer con especial enfoque en cáncer de mama y pulmón.', 'Hospital Clínic Barcelona', TRUE, 4.8, 127),
(3, 'Psicología Oncológica', 'COL28005678', 10, 'Licenciado en Psicología por la Universidad Complutense. Máster en Psico-oncología por la Universidad Autónoma.', 'Psicólogo especializado en apoyo emocional a pacientes oncológicos y sus familias. Utilizo técnicas de terapia cognitivo-conductual y mindfulness.', 'Hospital Universitario La Paz', TRUE, 4.9, 89),
(4, 'Nutrición Oncológica', 'COL46001111', 8, 'Graduada en Nutrición Humana y Dietética por la Universidad de Valencia. Especialización en Nutrición Clínica.', 'Nutricionista especializada en el apoyo nutricional durante el tratamiento oncológico. Ayudo a mantener el estado nutricional óptimo.', 'Instituto Valenciano de Oncología', TRUE, 4.7, 156),
(5, 'Fisioterapia Oncológica', 'COL41002222', 12, 'Graduado en Fisioterapia por la Universidad de Sevilla. Máster en Fisioterapia Oncológica.', 'Fisioterapeuta especializado en rehabilitación oncológica. Trabajo con pacientes en todas las fases del tratamiento.', 'Hospital Universitario Virgen del Rocío', TRUE, 4.6, 98),
(6, 'Trabajo Social', 'COL48003333', 9, 'Graduada en Trabajo Social por la Universidad de Deusto. Especialista en Oncología Social.', 'Trabajadora social especializada en apoyo integral a pacientes oncológicos y familias. Gestión de recursos y apoyo psicosocial.', 'Hospital Universitario Cruces', TRUE, 4.8, 76),
(7, 'Enfermería Oncológica', 'COL18004444', 14, 'Diplomado en Enfermería por la Universidad de Granada. Especialista en Cuidados Oncológicos.', 'Enfermero especialista en cuidados oncológicos con amplia experiencia en hospitalización y consultas externas.', 'Hospital Universitario San Cecilio', TRUE, 4.7, 134),
(8, 'Psicología Oncológica', 'COL50005555', 7, 'Licenciada en Psicología por la Universidad de Zaragoza. Máster en Intervención Psicológica en Cuidados Paliativos.', 'Psicóloga especializada en acompañamiento emocional y cuidados paliativos. Trabajo con pacientes y familias.', 'Hospital Universitario Miguel Servet', TRUE, 4.9, 67),
(9, 'Oncología Médica', 'COL29006666', 18, 'Doctor en Medicina por la Universidad de Málaga. Especialista en Oncología Radioterápica.', 'Oncólogo radioterápico con 18 años de experiencia. Especializado en tratamientos de precisión y radioterapia avanzada.', 'Hospital Regional Universitario de Málaga', TRUE, 4.8, 203),
(10, 'Nutrición Oncológica', 'COL07007777', 11, 'Graduada en Nutrición por la Universidad de las Islas Baleares. Doctorado en Nutrición Clínica.', 'Nutricionista clínica especializada en oncología. Investigo sobre el impacto de la nutrición en el pronóstico oncológico.', 'Hospital Universitario Son Espases', TRUE, 4.6, 112);

-- Insertar datos de pacientes
INSERT INTO patients (user_id, cancer_type, treatment_stage, diagnosis_date, description) VALUES
(11, 'Cáncer de mama', 'in_treatment', '2024-01-15', 'Diagnóstico reciente de cáncer de mama. Iniciando tratamiento de quimioterapia neoadyuvante.'),
(12, 'Cáncer de próstata', 'post_treatment', '2023-06-20', 'Tratamiento quirúrgico completado. En seguimiento oncológico.'),
(13, 'Linfoma de Hodgkin', 'survivor', '2022-03-10', 'Superviviente de linfoma. Dos años libre de enfermedad.'),
(14, 'Cáncer de colon', 'in_treatment', '2024-02-08', 'Tratamiento con quimioterapia adyuvante tras cirugía.'),
(15, 'Cáncer de pulmón', 'in_treatment', '2023-11-22', 'Tratamiento con inmunoterapia. Respondiendo bien al tratamiento.'),
(16, 'Leucemia', 'post_treatment', '2023-09-15', 'Trasplante de médula ósea realizado. En fase de recuperación.'),
(17, 'Cáncer de ovario', 'in_treatment', '2024-03-01', 'Iniciando segundo ciclo de quimioterapia.'),
(18, 'Melanoma', 'survivor', '2022-08-30', 'Superviviente de melanoma. Controles regulares.');

-- Insertar servicios
INSERT INTO services (professional_id, name, description, duration, price, is_free, service_type, modality, is_active) VALUES
-- Servicios de Dr. Martínez (Oncología)
(1, 'Consulta Oncológica', 'Consulta médica especializada en oncología para evaluación y seguimiento de pacientes.', 60, 0.00, TRUE, 'consultation', 'both', TRUE),
(1, 'Segunda Opinión Oncológica', 'Revisión de diagnóstico y plan de tratamiento oncológico por experto.', 45, 0.00, TRUE, 'consultation', 'online', TRUE),
(1, 'Consulta de Seguimiento', 'Consulta de control y seguimiento post-tratamiento.', 30, 0.00, TRUE, 'consultation', 'both', TRUE),

-- Servicios de Dr. García (Psicología)
(2, 'Terapia Individual', 'Sesión de terapia psicológica individual para pacientes oncológicos.', 60, 0.00, TRUE, 'therapy', 'both', TRUE),
(2, 'Terapia Familiar', 'Sesión de terapia familiar para apoyo a familiares de pacientes oncológicos.', 90, 0.00, TRUE, 'counseling', 'both', TRUE),
(2, 'Mindfulness Oncológico', 'Sesión grupal de mindfulness y técnicas de relajación.', 45, 0.00, TRUE, 'therapy', 'online', TRUE),

-- Servicios de Dr. López (Nutrición)
(3, 'Consulta Nutricional', 'Evaluación nutricional completa y plan de alimentación personalizado.', 60, 0.00, TRUE, 'nutrition', 'both', TRUE),
(3, 'Seguimiento Nutricional', 'Consulta de seguimiento y ajuste del plan nutricional.', 30, 0.00, TRUE, 'nutrition', 'both', TRUE),
(3, 'Educación Nutricional', 'Charla educativa sobre alimentación durante el tratamiento oncológico.', 45, 0.00, TRUE, 'nutrition', 'online', TRUE),

-- Servicios de Dr. Rodríguez (Fisioterapia)
(4, 'Rehabilitación Oncológica', 'Sesión de fisioterapia especializada en rehabilitación oncológica.', 60, 0.00, TRUE, 'therapy', 'in_person', TRUE),
(4, 'Ejercicio Terapéutico', 'Programa de ejercicios adaptados para pacientes oncológicos.', 45, 0.00, TRUE, 'therapy', 'both', TRUE),

-- Servicios de Dr. Fernández (Trabajo Social)
(5, 'Apoyo Psicosocial', 'Sesión de apoyo y orientación psicosocial para pacientes y familias.', 60, 0.00, TRUE, 'counseling', 'both', TRUE),
(5, 'Gestión de Recursos', 'Orientación sobre recursos disponibles y gestión de ayudas.', 45, 0.00, TRUE, 'counseling', 'online', TRUE),

-- Servicios adicionales
(6, 'Cuidados de Enfermería', 'Consulta especializada en cuidados de enfermería oncológica.', 30, 0.00, TRUE, 'consultation', 'both', TRUE),
(7, 'Apoyo Emocional', 'Sesión de apoyo emocional y acompañamiento psicológico.', 60, 0.00, TRUE, 'therapy', 'both', TRUE),
(8, 'Consulta Radioterápica', 'Consulta especializada en radioterapia oncológica.', 45, 0.00, TRUE, 'consultation', 'in_person', TRUE),
(9, 'Asesoramiento Nutricional', 'Consulta de nutrición especializada en oncología.', 60, 0.00, TRUE, 'nutrition', 'both', TRUE);

-- Insertar disponibilidad (horarios de lunes a viernes para todos los profesionales)
INSERT INTO availability (professional_id, day_of_week, start_time, end_time, is_active) VALUES
-- Dr. Martínez (Lunes a Viernes)
(1, 1, '09:00:00', '13:00:00', TRUE), (1, 1, '15:00:00', '18:00:00', TRUE),
(1, 2, '09:00:00', '13:00:00', TRUE), (1, 2, '15:00:00', '18:00:00', TRUE),
(1, 3, '09:00:00', '13:00:00', TRUE), (1, 3, '15:00:00', '18:00:00', TRUE),
(1, 4, '09:00:00', '13:00:00', TRUE), (1, 4, '15:00:00', '18:00:00', TRUE),
(1, 5, '09:00:00', '12:00:00', TRUE),

-- Dr. García (Lunes, Miércoles, Viernes)
(2, 1, '10:00:00', '14:00:00', TRUE), (2, 1, '16:00:00', '20:00:00', TRUE),
(2, 3, '10:00:00', '14:00:00', TRUE), (2, 3, '16:00:00', '20:00:00', TRUE),
(2, 5, '10:00:00', '14:00:00', TRUE), (2, 5, '16:00:00', '20:00:00', TRUE),

-- Dr. López (Martes, Jueves, Sábado)
(3, 2, '08:00:00', '14:00:00', TRUE),
(3, 4, '08:00:00', '14:00:00', TRUE),
(3, 6, '09:00:00', '13:00:00', TRUE),

-- Resto de profesionales (horarios variados)
(4, 1, '09:00:00', '17:00:00', TRUE), (4, 3, '09:00:00', '17:00:00', TRUE), (4, 5, '09:00:00', '17:00:00', TRUE),
(5, 2, '10:00:00', '18:00:00', TRUE), (5, 4, '10:00:00', '18:00:00', TRUE),
(6, 1, '08:00:00', '16:00:00', TRUE), (6, 2, '08:00:00', '16:00:00', TRUE), (6, 3, '08:00:00', '16:00:00', TRUE),
(7, 1, '14:00:00', '20:00:00', TRUE), (7, 3, '14:00:00', '20:00:00', TRUE), (7, 5, '14:00:00', '20:00:00', TRUE),
(8, 2, '09:00:00', '15:00:00', TRUE), (8, 4, '09:00:00', '15:00:00', TRUE),
(9, 1, '11:00:00', '19:00:00', TRUE), (9, 2, '11:00:00', '19:00:00', TRUE), (9, 4, '11:00:00', '19:00:00', TRUE);

-- Insertar citas de ejemplo
INSERT INTO appointments (patient_id, professional_id, service_id, appointment_date, appointment_time, duration, modality, status, notes, created_at) VALUES
(1, 1, 1, '2024-06-05', '10:00:00', 60, 'in_person', 'confirmed', 'Primera consulta oncológica. Revisar historial médico completo.', '2024-05-20 09:30:00'),
(2, 2, 4, '2024-06-06', '16:00:00', 60, 'online', 'pending', 'Sesión de apoyo psicológico post-cirugía.', '2024-05-21 14:20:00'),
(3, 3, 7, '2024-06-07', '09:00:00', 60, 'in_person', 'confirmed', 'Evaluación nutricional inicial para superviviente.', '2024-05-22 11:15:00'),
(4, 1, 3, '2024-06-10', '11:00:00', 30, 'online', 'pending', 'Seguimiento post-quimioterapia.', '2024-05-23 16:45:00'),
(5, 4, 10, '2024-06-08', '14:00:00', 60, 'in_person', 'confirmed', 'Inicio de programa de rehabilitación.', '2024-05-24 10:30:00'),
(6, 5, 12, '2024-06-12', '17:00:00', 60, 'online', 'pending', 'Apoyo psicosocial post-trasplante.', '2024-05-25 08:20:00'),
(7, 3, 8, '2024-06-11', '10:30:00', 30, 'online', 'confirmed', 'Seguimiento nutricional durante tratamiento.', '2024-05-26 13:10:00'),
(8, 2, 6, '2024-06-13', '18:00:00', 45, 'online', 'pending', 'Sesión de mindfulness para supervivientes.', '2024-05-27 15:40:00'),
-- Citas del pasado para historial
(1, 1, 1, '2024-05-15', '10:00:00', 60, 'in_person', 'completed', 'Consulta inicial. Diagnóstico confirmado.', '2024-05-01 09:00:00'),
(2, 2, 4, '2024-05-20', '16:00:00', 60, 'online', 'completed', 'Primera sesión de terapia psicológica.', '2024-05-05 14:30:00'),
(3, 3, 7, '2024-05-22', '09:00:00', 60, 'in_person', 'completed', 'Evaluación nutricional completa.', '2024-05-10 11:00:00');

-- Insertar contenido educativo
INSERT INTO content (author_id, title, content, excerpt, content_type, category, tags, status, views, is_featured, published_at, created_at) VALUES
(1, 'Nutrición durante la quimioterapia: Guía completa', 'La alimentación durante el tratamiento de quimioterapia es fundamental para mantener las fuerzas y ayudar al cuerpo a recuperarse. Durante este período, el organismo necesita nutrientes adicionales para hacer frente a los efectos del tratamiento.', 'Consejos esenciales para mantener una alimentación adecuada durante el tratamiento de quimioterapia.', 'article', 'Nutrición', 'quimioterapia, alimentación, cuidados, nutrición oncológica', 'published', 1245, TRUE, NOW(), '2024-05-01 10:00:00'),
(2, 'Manejo del estrés durante el tratamiento oncológico', 'El diagnóstico y tratamiento del cáncer puede generar altos niveles de estrés y ansiedad. Es normal sentirse abrumado, pero existen estrategias efectivas para gestionar estas emociones.', 'Estrategias efectivas para gestionar el estrés y la ansiedad durante el proceso oncológico.', 'article', 'Bienestar', 'estrés, ansiedad, mindfulness, apoyo psicológico', 'published', 892, TRUE, NOW(), '2024-05-02 11:30:00'),
(3, 'Ejercicio físico adaptado para pacientes oncológicos', 'El ejercicio físico moderado y supervisado puede ser muy beneficioso durante y después del tratamiento oncológico. Contrario a lo que se pensaba anteriormente, el reposo absoluto no siempre es la mejor opción.', 'Descubre cómo el ejercicio físico puede mejorar tu calidad de vida durante el tratamiento oncológico.', 'article', 'Ejercicio', 'ejercicio, fisioterapia, calidad de vida, rehabilitación', 'published', 567, FALSE, NOW(), '2024-05-03 14:15:00'),
(4, 'Rehabilitación post-cirugía oncológica', 'La rehabilitación después de una cirugía oncológica es crucial para una recuperación completa y exitosa. Cada tipo de intervención requiere un enfoque específico de rehabilitación.', 'Guía completa sobre la rehabilitación física después de cirugías oncológicas.', 'article', 'Rehabilitación', 'rehabilitación, cirugía, fisioterapia, recuperación', 'published', 423, FALSE, NOW(), '2024-05-04 16:45:00'),
(5, 'Apoyo familiar en el proceso oncológico', 'El apoyo familiar es fundamental durante el proceso oncológico. Las familias también necesitan herramientas y orientación para poder brindar el mejor apoyo posible.', 'Consejos para familias sobre cómo brindar apoyo efectivo durante el tratamiento oncológico.', 'article', 'Apoyo familiar', 'familia, apoyo, cuidadores, comunicación', 'published', 678, FALSE, NOW(), '2024-05-05 09:20:00'),
(7, 'Mindfulness para pacientes oncológicos', 'La práctica de mindfulness o atención plena puede ser una herramienta poderosa para gestionar el estrés, la ansiedad y mejorar la calidad de vida durante el tratamiento oncológico.', 'Descubre cómo el mindfulness puede ayudarte a gestionar mejor el estrés durante el tratamiento.', 'article', 'Mindfulness', 'mindfulness, meditación, estrés, bienestar mental', 'published', 789, TRUE, NOW(), '2024-05-06 13:30:00'),
(8, 'Radioterapia: Qué esperar y cómo prepararse', 'La radioterapia es uno de los tratamientos más comunes en oncología. Conocer qué esperar puede ayudar a reducir la ansiedad y prepararse mejor para el proceso.', 'Guía completa sobre la radioterapia: proceso, efectos secundarios y cuidados.', 'article', 'Tratamiento', 'radioterapia, tratamiento, efectos secundarios, cuidados', 'published', 934, FALSE, NOW(), '2024-05-07 11:10:00'),
(9, 'Alimentación durante la radioterapia', 'La nutrición adecuada durante la radioterapia es esencial para mantener la energía, fortalecer el sistema inmune y minimizar los efectos secundarios del tratamiento.', 'Consejos nutricionales específicos para pacientes que reciben radioterapia.', 'article', 'Nutrición', 'radioterapia, nutrición, efectos secundarios, alimentación', 'published', 612, FALSE, NOW(), '2024-05-08 15:25:00');

-- Insertar mensajes
INSERT INTO messages (sender_id, receiver_id, subject, message, is_read, message_type, created_at) VALUES
(11, 2, 'Consulta sobre próxima cita', 'Estimado Dr. Martínez, quisiera confirmar mi cita del próximo lunes y preguntarle sobre los resultados de mis últimos análisis.', FALSE, 'direct', '2024-05-28 14:30:00'),
(2, 11, 'Re: Consulta sobre próxima cita', 'Estimada Laura, su cita está confirmada para el lunes a las 10:00. Los resultados los revisaremos juntos en la consulta. Están dentro de los parámetros esperados.', TRUE, 'direct', '2024-05-28 16:45:00'),
(12, 3, 'Sesión de terapia', 'Dr. García, me gustaría agendar una sesión adicional esta semana si es posible. He estado experimentando más ansiedad de lo normal.', FALSE, 'direct', '2024-05-29 09:15:00'),
(3, 12, 'Re: Sesión de terapia', 'Hola Roberto, por supuesto. Tengo disponibilidad el miércoles a las 17:00. Es normal que haya fluctuaciones en los niveles de ansiedad. Lo conversamos en la sesión.', TRUE, 'direct', '2024-05-29 11:20:00'),
(13, 4, 'Consulta nutricional', 'Dra. López, después de nuestra última consulta he seguido sus recomendaciones y me siento con más energía. ¿Podríamos ajustar algo más en la dieta?', FALSE, 'direct', '2024-05-30 12:00:00'),
(1, 11, 'Recordatorio de cita', 'Le recordamos que tiene una cita programada mañana a las 10:00 con el Dr. Martínez. Por favor, traiga sus últimos análisis.', FALSE, 'appointment', '2024-06-04 18:00:00'),
(1, 12, 'Recordatorio de cita', 'Su sesión de terapia con el Dr. García está programada para mañana a las 16:00. La sesión será online.', FALSE, 'appointment', '2024-06-05 18:00:00');

-- Insertar reseñas
INSERT INTO reviews (patient_id, professional_id, appointment_id, rating, comment, is_anonymous, created_at) VALUES
(1, 1, 9, 5, 'Excelente profesional. El Dr. Martínez me explicó todo el proceso de tratamiento de manera muy clara y comprensible. Me sentí muy tranquila y confiada durante toda la consulta.', FALSE, '2024-05-16 14:30:00'),
(2, 2, 10, 5, 'Las sesiones con el Dr. García han sido fundamentales en mi proceso. Su enfoque empático y las técnicas que me ha enseñado me han ayudado muchísimo a gestionar la ansiedad.', FALSE, '2024-05-21 17:15:00'),
(3, 3, 11, 4, 'Muy buena nutricionista. Las pautas alimentarias que me dio son muy prácticas y fáciles de seguir. He notado una mejora significativa en mi energía durante el tratamiento.', FALSE, '2024-05-23 10:45:00'),
(1, 1, NULL, 5, 'Un oncólogo excepcional. Su dedicación y profesionalismo son admirables. Siempre disponible para resolver dudas y muy humano en el trato.', TRUE, '2024-05-25 16:20:00'),
(4, 1, NULL, 5, 'El Dr. Martínez no solo es un excelente médico, sino también una persona muy comprensiva. Me ha acompañado en todo el proceso con mucha paciencia.', FALSE, '2024-05-26 11:30:00'),
(5, 4, NULL, 4, 'La fisioterapia con el Dr. Rodríguez me está ayudando mucho en la recuperación. Los ejercicios están bien adaptados a mi situación y veo progreso cada semana.', FALSE, '2024-05-27 09:10:00'),
(6, 5, NULL, 5, 'Elena es una trabajadora social excepcional. Me ha ayudado con todos los trámites y recursos disponibles. Su apoyo ha sido invaluable para mi familia.', FALSE, '2024-05-28 13:45:00'),
(2, 2, NULL, 5, 'Recomiendo al 100% las sesiones de mindfulness del Dr. García. Me han dado herramientas muy útiles para manejar el estrés del tratamiento.', TRUE, '2024-05-29 15:25:00');

-- Insertar favoritos
INSERT INTO favorites (patient_id, professional_id, created_at) VALUES
(1, 1, '2024-05-16 14:35:00'),
(1, 2, '2024-05-18 10:20:00'),
(1, 3, '2024-05-20 16:45:00'),
(2, 1, '2024-05-17 09:15:00'),
(2, 2, '2024-05-21 17:20:00'),
(3, 3, '2024-05-23 10:50:00'),
(3, 1, '2024-05-24 14:30:00'),
(4, 1, '2024-05-25 11:00:00'),
(4, 4, '2024-05-26 16:15:00'),
(5, 4, '2024-05-27 09:15:00'),
(5, 2, '2024-05-28 13:30:00'),
(6, 5, '2024-05-28 13:50:00'),
(7, 3, '2024-05-29 11:20:00'),
(8, 2, '2024-05-30 15:40:00');

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices en users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_active ON users(is_active);

-- Índices en professionals
CREATE INDEX idx_professionals_specialty ON professionals(specialty);
CREATE INDEX idx_professionals_verified ON professionals(is_verified);
CREATE INDEX idx_professionals_rating ON professionals(rating);

-- Índices en services
CREATE INDEX idx_services_type ON services(service_type);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_professional ON services(professional_id);

-- Índices en appointments
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id);

-- Índices en content
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_category ON content(category);
CREATE INDEX idx_content_published ON content(published_at);

-- Índices en messages
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_read ON messages(is_read);
CREATE INDEX idx_messages_created ON messages(created_at);

-- =====================================================
-- ESTADÍSTICAS FINALES
-- =====================================================

SELECT 
'Base de datos OnConnect creada exitosamente' as mensaje,
(SELECT COUNT(*) FROM users) as total_usuarios,
(SELECT COUNT(*) FROM users WHERE user_type = 'patient') as pacientes,
(SELECT COUNT(*) FROM users WHERE user_type = 'professional') as profesionales,
(SELECT COUNT(*) FROM users WHERE user_type = 'admin') as administradores,
(SELECT COUNT(*) FROM services) as servicios_totales,
(SELECT COUNT(*) FROM appointments) as citas_totales,
(SELECT COUNT(*) FROM content WHERE status = 'published') as contenido_publicado,
(SELECT COUNT(*) FROM reviews) as reseñas_totales;

-- =====================================================
-- USUARIOS DE PRUEBA PARA LOGIN
-- =====================================================

SELECT 'USUARIOS DE PRUEBA (Contraseña: password123 para todos)' as info;

SELECT email, CONCAT(first_name, ' ', last_name) as nombre, user_type as tipo
FROM users
WHERE user_type IN ('admin', 'professional', 'patient')
ORDER BY user_type, first_name;