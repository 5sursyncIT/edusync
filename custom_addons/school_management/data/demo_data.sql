-- Script pour ajouter des données de démonstration

-- Types d'évaluation
INSERT INTO op_evaluation_type (name, code, niveau_scolaire, type_evaluation, coefficient, active, create_date, write_date, create_uid, write_uid) VALUES
('Composition Français', 'COMP_FR', 'middle', 'composition', 3.0, true, NOW(), NOW(), 1, 1),
('Devoir Français', 'DEV_FR', 'middle', 'devoir', 1.0, true, NOW(), NOW(), 1, 1),
('Composition Mathématiques', 'COMP_MATH', 'middle', 'composition', 3.0, true, NOW(), NOW(), 1, 1),
('Devoir Mathématiques', 'DEV_MATH', 'middle', 'devoir', 1.0, true, NOW(), NOW(), 1, 1),
('Composition Sciences', 'COMP_SCI', 'middle', 'composition', 2.0, true, NOW(), NOW(), 1, 1),
('Composition Histoire-Géo', 'COMP_HG', 'middle', 'composition', 2.0, true, NOW(), NOW(), 1, 1),
('Devoir Histoire-Géo', 'DEV_HG', 'middle', 'devoir', 1.0, true, NOW(), NOW(), 1, 1),
('Composition Philosophie', 'COMP_PHILO', 'high', 'composition', 4.0, true, NOW(), NOW(), 1, 1),
('Devoir Philosophie', 'DEV_PHILO', 'high', 'devoir', 2.0, true, NOW(), NOW(), 1, 1),
('Composition Physique', 'COMP_PHYS', 'high', 'composition', 4.0, true, NOW(), NOW(), 1, 1);

-- Matières 
INSERT INTO op_subject (name, code, type, department_id, active, create_date, write_date, create_uid, write_uid) VALUES
('Français', 'FR', 'theory', NULL, true, NOW(), NOW(), 1, 1),
('Mathématiques', 'MATH', 'theory', NULL, true, NOW(), NOW(), 1, 1),
('Sciences Physiques', 'PHYS', 'theory', NULL, true, NOW(), NOW(), 1, 1),
('Sciences Naturelles', 'SVT', 'theory', NULL, true, NOW(), NOW(), 1, 1),
('Histoire-Géographie', 'HG', 'theory', NULL, true, NOW(), NOW(), 1, 1),
('Anglais', 'ANG', 'theory', NULL, true, NOW(), NOW(), 1, 1),
('Philosophie', 'PHILO', 'theory', NULL, true, NOW(), NOW(), 1, 1),
('Éducation Physique', 'EPS', 'practical', NULL, true, NOW(), NOW(), 1, 1),
('Arts Plastiques', 'ART', 'practical', NULL, true, NOW(), NOW(), 1, 1),
('Informatique', 'INFO', 'theory', NULL, true, NOW(), NOW(), 1, 1); 