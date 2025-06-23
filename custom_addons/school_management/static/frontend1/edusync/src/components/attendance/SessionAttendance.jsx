import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Table, Badge, Spin, Alert, DatePicker, Space, Statistic, Row, Col, message } from 'antd';
import { UserOutlined, CalendarOutlined, CheckOutlined, CloseOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSessionAttendances, useAttendanceActions } from '../../hooks/useAttendance';
import moment from 'moment';
import dayjs from 'dayjs';

const SessionAttendance = ({ sessionId, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [localAttendances, setLocalAttendances] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Hook pour récupérer les données de présence de la session
  const { 
    attendances, 
    session, 
    statistics,
    loading: sessionLoading, 
    error: sessionError, 
    refetch 
  } = useSessionAttendances(sessionId, selectedDate.format('YYYY-MM-DD'));

  const {
    bulkSaveAttendances,
    markAllPresent,
    markAllAbsent,
    loading: actionLoading,
    error: actionError
  } = useAttendanceActions();

  // Initialiser la date avec la date de la session quand elle devient disponible
  useEffect(() => {
    if (session && session.start_datetime) {
      const sessionDate = moment(session.start_datetime);
      if (sessionDate.isValid()) {
        console.log('🔄 SessionAttendance: Mise à jour de la date avec la date de la session:', sessionDate.format('YYYY-MM-DD'));
        setSelectedDate(sessionDate);
      }
    }
  }, [session]);

  // Initialiser les présences locales quand les données arrivent
  useEffect(() => {
    if (attendances && Array.isArray(attendances)) {
      const localData = {};
      attendances.forEach(student => {
        localData[student.id] = {
          state: student.attendance?.state || 'absent',
          remarks: student.attendance?.remarks || ''
        };
      });
      setLocalAttendances(localData);
      setHasChanges(false);
    }
  }, [attendances]);

  // Fonction pour marquer la présence d'un étudiant
  const handleAttendanceChange = (studentId, field, value) => {
    setLocalAttendances(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  // Sauvegarder toutes les présences
  const handleSaveAll = async () => {
    try {
      if (!attendances || attendances.length === 0) {
        message.warning('Aucun étudiant à sauvegarder');
        return;
      }

      const attendanceData = attendances.map(student => ({
        student_id: student.id,
        session_id: sessionId,
        date: selectedDate.format('YYYY-MM-DD'),
        state: localAttendances[student.id]?.state || 'absent',
        remarks: localAttendances[student.id]?.remarks || ''
      }));

      const result = await bulkSaveAttendances(attendanceData);
      
      if (result.status === 'success') {
        message.success('Présences sauvegardées avec succès');
        setHasChanges(false);
        await refetch();
      } else {
        message.error(result.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      message.error('Erreur lors de la sauvegarde des présences');
    }
  };

  // Marquer tous présents
  const handleMarkAllPresent = async () => {
    try {
      if (!attendances || attendances.length === 0) {
        message.warning('Aucun étudiant disponible');
        return;
      }

      const studentIds = attendances.map(student => student.id);
      const result = await markAllPresent(sessionId, studentIds, selectedDate.format('YYYY-MM-DD'));
      
      if (result.status === 'success') {
        message.success('Tous les étudiants marqués présents');
        await refetch();
        
        // Mettre à jour l'état local
        const newLocalAttendances = {};
        attendances.forEach(student => {
          newLocalAttendances[student.id] = {
            state: 'present',
            remarks: localAttendances[student.id]?.remarks || ''
          };
        });
        setLocalAttendances(newLocalAttendances);
        setHasChanges(false);
      } else {
        message.error(result.message || 'Erreur lors du marquage');
      }
    } catch (error) {
      console.error('Erreur lors du marquage tous présents:', error);
      message.error('Erreur lors du marquage des présences');
    }
  };

  // Marquer tous absents
  const handleMarkAllAbsent = async () => {
    try {
      if (!attendances || attendances.length === 0) {
        message.warning('Aucun étudiant disponible');
        return;
      }

      const studentIds = attendances.map(student => student.id);
      const result = await markAllAbsent(sessionId, studentIds, selectedDate.format('YYYY-MM-DD'));
      
      if (result.status === 'success') {
        message.success('Tous les étudiants marqués absents');
        await refetch();
        
        // Mettre à jour l'état local
        const newLocalAttendances = {};
        attendances.forEach(student => {
          newLocalAttendances[student.id] = {
            state: 'absent',
            remarks: localAttendances[student.id]?.remarks || ''
          };
        });
        setLocalAttendances(newLocalAttendances);
        setHasChanges(false);
      } else {
        message.error(result.message || 'Erreur lors du marquage');
      }
    } catch (error) {
      console.error('Erreur lors du marquage tous absents:', error);
      message.error('Erreur lors du marquage des présences');
    }
  };

  // Statistiques calculées
  const computedStats = useMemo(() => {
    if (!attendances || attendances.length === 0) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        not_marked: 0,
        attendance_rate: 0
      };
    }

    const stats = {
      total: attendances.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };

    attendances.forEach(student => {
      const state = localAttendances[student.id]?.state || 'absent';
      if (stats[state] !== undefined) {
        stats[state]++;
      }
    });

    stats.attendance_rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
    
    return stats;
  }, [attendances, localAttendances]);

  // Colonnes du tableau
  const columns = [
    {
      title: 'Étudiant',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <UserOutlined style={{ marginRight: 8 }} />
          {text}
        </div>
      ),
    },
    {
      title: 'Présence',
      key: 'attendance',
      width: 300,
      render: (_, record) => {
        const currentState = localAttendances[record.id]?.state || 'absent';
        return (
          <Space wrap>
            <Button
              type={currentState === 'present' ? 'primary' : 'default'}
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleAttendanceChange(record.id, 'state', 'present')}
            >
              Présent
            </Button>
            <Button
              type={currentState === 'absent' ? 'primary' : 'default'}
              icon={<CloseOutlined />}
              size="small"
              danger={currentState === 'absent'}
              onClick={() => handleAttendanceChange(record.id, 'state', 'absent')}
            >
              Absent
            </Button>
            <Button
              type={currentState === 'late' ? 'primary' : 'default'}
              size="small"
              onClick={() => handleAttendanceChange(record.id, 'state', 'late')}
            >
              Retard
            </Button>
            <Button
              type={currentState === 'excused' ? 'primary' : 'default'}
              size="small"
              onClick={() => handleAttendanceChange(record.id, 'state', 'excused')}
            >
              Excusé
            </Button>
          </Space>
        );
      },
    },
    {
      title: 'Statut',
      key: 'status',
      render: (_, record) => {
        const state = localAttendances[record.id]?.state || 'absent';
        const colors = {
          present: 'success',
          absent: 'error',
          late: 'warning',
          excused: 'processing'
        };
        const labels = {
          present: 'Présent',
          absent: 'Absent',
          late: 'En retard',
          excused: 'Excusé'
        };
        return <Badge status={colors[state]} text={labels[state]} />;
      },
    }
  ];

  const loading = sessionLoading || actionLoading;
  const error = sessionError || actionError;

  if (loading && !attendances) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Chargement des présences...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={() => refetch()} icon={<ReloadOutlined />}>
              Réessayer
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      {/* En-tête avec informations de session */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
            <h2>{session?.name || 'Session de présence'}</h2>
            <p>
              <CalendarOutlined style={{ marginRight: 8 }} />
              {session?.batch?.name && `Classe: ${session.batch.name}`}
              {session?.subject?.name && ` • Matière: ${session.subject.name}`}
              {session?.faculty?.name && ` • Enseignant: ${session.faculty.name}`}
            </p>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                format="DD/MM/YYYY"
                placeholder="Sélectionner une date"
              />
              <Button onClick={onClose}>Fermer</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistiques */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="Total étudiants" value={computedStats.total} />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Présents" 
              value={computedStats.present} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Absents" 
              value={computedStats.absent} 
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Taux de présence" 
              value={computedStats.attendance_rate}
              suffix="%" 
              valueStyle={{ color: computedStats.attendance_rate >= 75 ? '#3f8600' : '#cf1322' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Actions rapides */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<CheckOutlined />}
            onClick={handleMarkAllPresent}
            loading={loading}
          >
            Marquer tous présents
          </Button>
          <Button 
            danger 
            icon={<CloseOutlined />}
            onClick={handleMarkAllAbsent}
            loading={loading}
          >
            Marquer tous absents
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSaveAll}
            loading={loading}
            disabled={!hasChanges}
          >
            Sauvegarder {hasChanges ? '(modifié)' : ''}
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={refetch}
            loading={loading}
          >
            Actualiser
          </Button>
        </Space>
      </Card>

      {/* Tableau des étudiants */}
      <Card>
        <Table
          columns={columns}
          dataSource={attendances || []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} étudiants`,
          }}
          locale={{
            emptyText: 'Aucun étudiant trouvé'
          }}
        />
      </Card>
    </div>
  );
};

export default SessionAttendance;