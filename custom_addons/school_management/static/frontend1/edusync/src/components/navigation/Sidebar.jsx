import { 
  Calendar, Users, BookOpen, FileText, Clock, 
  BarChart3, Settings, Home, User 
} from 'lucide-react';

const menuItems = [
  {
    title: 'Tableau de Bord',
    icon: Home,
    path: '/dashboard'
  },
  {
    title: 'Sessions & Cours',
    icon: Calendar,
    path: '/sessions'
  },
  {
    title: 'Emplois du Temps',
    icon: Clock,
    path: '/timetables'
  },
  {
    title: 'Bulletins & Notes',
    icon: FileText,
    path: '/bulletins'
  },
  {
    title: 'Étudiants',
    icon: Users,
    path: '/students'
  },
  {
    title: 'Enseignants',
    icon: User,
    path: '/faculty'
  },
  {
    title: 'Matières',
    icon: BookOpen,
    path: '/subjects'
  },
  {
    title: 'Statistiques',
    icon: BarChart3,
    path: '/stats'
  },
  {
    title: 'Paramètres',
    icon: Settings,
    path: '/settings'
  }
]; 