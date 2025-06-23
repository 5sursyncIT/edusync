from odoo import models, fields, api
import json
import random
from datetime import datetime, timedelta

class SchoolManagementMockData(models.Model):
    _name = 'school.management.mock.data'
    _description = 'Mock Data for School Management API'

    # Cette méthode est utilisée pour savoir si on doit utiliser les données de démonstration
    @api.model
    def should_use_mock_data(self):
        # On retourne False pour utiliser les données réelles
        return False

    @api.model
    def get_mock_students(self):
        students = []
        for i in range(1, 51):
            students.append({
                'id': i,
                'name': f'Étudiant {i}',
                'first_name': f'Prénom{i}',
                'last_name': f'Nom{i}',
                'email': f'etudiant{i}@example.com',
                'phone': f'+33 6 {random.randint(10000000, 99999999)}',
                'course_id': random.choice([(1, 'Licence Informatique'), (2, 'Master Data Science')]),
                'batch_id': random.choice([(1, 'Promo 2023'), (2, 'Promo 2024')])
            })
        return students

    @api.model
    def get_mock_teachers(self):
        teachers = []
        for i in range(1, 21):
            teachers.append({
                'id': i,
                'name': f'Enseignant {i}',
                'first_name': f'Prénom{i}',
                'last_name': f'Nom{i}',
                'email': f'enseignant{i}@example.com',
                'phone': f'+33 6 {random.randint(10000000, 99999999)}',
                'subject_ids': [(6, 0, random.sample(range(1, 10), random.randint(1, 3)))]
            })
        return teachers

    @api.model
    def get_mock_courses(self):
        courses = []
        for i in range(1, 11):
            courses.append({
                'id': i,
                'name': f'Cours {i}',
                'code': f'C00{i}',
                'evaluation_type': random.choice(['normal', 'GPA']),
                'subject_ids': [(6, 0, random.sample(range(1, 10), random.randint(2, 5)))]
            })
        return courses

    @api.model
    def get_mock_exams(self):
        exams = []
        states = ['draft', 'scheduled', 'held', 'result_updated', 'cancelled']
        now = datetime.now()
        
        for i in range(1, 16):
            start_time = now + timedelta(days=random.randint(-10, 20))
            end_time = start_time + timedelta(hours=random.randint(1, 3))
            
            exams.append({
                'id': i,
                'name': f'Examen {i}',
                'course_id': random.choice([(1, 'Licence Informatique'), (2, 'Master Data Science')]),
                'subject_id': random.choice([(i, f'Matière {i}') for i in range(1, 10)]),
                'start_time': start_time.strftime('%Y-%m-%d %H:%M:%S'),
                'end_time': end_time.strftime('%Y-%m-%d %H:%M:%S'),
                'state': random.choice(states),
                'min_marks': 0,
                'max_marks': 100
            })
        return exams

    @api.model
    def get_mock_attendance_sheets(self):
        sheets = []
        for i in range(1, 11):
            date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
            attendance_lines = []
            for j in range(1, random.randint(15, 30)):
                attendance_lines.append((0, 0, {
                    'student_id': (j, f'Étudiant {j}'),
                    'present': random.choice([True, True, True, False])  # 75% de présence
                }))
            
            sheets.append({
                'id': i,
                'name': f'Feuille de présence {i}',
                'register_id': (i, f'Registre {i}'),
                'attendance_date': date,
                'faculty_id': random.choice([(j, f'Enseignant {j}') for j in range(1, 10)]),
                'attendance_line': attendance_lines
            })
        return sheets

    @api.model
    def api_mock_data(self, model_name, method):
        data = {
            'op.student': {
                'search_read': self.get_mock_students
            },
            'op.faculty': {
                'search_read': self.get_mock_teachers
            },
            'op.course': {
                'search_read': self.get_mock_courses
            },
            'op.exam': {
                'search_read': self.get_mock_exams
            },
            'op.attendance.sheet': {
                'search_read': self.get_mock_attendance_sheets
            }
        }
        
        if model_name in data and method in data[model_name]:
            return data[model_name][method]()
        
        return [] 