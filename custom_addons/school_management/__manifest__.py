# -*- coding: utf-8 -*-
{
    'name': 'School Management',
    'version': '1.0',
    'category': 'Education',
    'summary': 'Manage School, Students, Teachers, Courses',
    'sequence': 1,
    'author': 'Your Name',
    'website': 'http://www.yourwebsite.com',
    'depends': ['base', 'mail', 'openeducat_core', 'openeducat_admission'],
    'data': [
        'security/ir.model.access.csv',
        'views/admission_view.xml',
        'views/course_view.xml',
        'views/student_view.xml',
        'views/teacher_view.xml',
        'views/subject_view.xml',
        'views/batch_view.xml',
        'views/exam_view.xml',
        'views/session_view.xml',
        'views/timetable_view.xml',
        'views/menu.xml',
    ],
    # Retirez la section 'assets' pour éviter les conflits
    'installable': True,
    'application': True,
    'auto_install': False,
}