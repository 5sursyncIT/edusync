# -*- coding: utf-8 -*-

# Importation des modèles existants dans le répertoire
from . import op_student
from . import op_course
from . import op_faculty
from . import op_subject
from . import op_batch
from . import op_session  # Réactivé pour le système de sessions et présences
from . import op_timetable  # Nouveau système d'emploi du temps
from . import op_evaluation
from . import op_bulletin
from . import op_fees  # Nouveau modèle d'héritage pour les frais
from . import models
from . import mock_data
from . import school_api
