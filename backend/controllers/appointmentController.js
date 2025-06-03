const db = require('../config/database');

// Crear nueva cita
const createAppointment = async (req, res) => {
  try {
    if (req.user.user_type !== 'patient') {
      return res.status(403).json({ message: 'Solo pacientes pueden solicitar citas' });
    }

    const {
      professionalId,
      serviceId,
      appointmentDate,
      appointmentTime,
      modality,
      notes
    } = req.body;

    // Obtener el ID del paciente
    const [patient] = await db.execute(
      'SELECT id FROM patients WHERE user_id = ?',
      [req.user.id]
    );

    if (patient.length === 0) {
      return res.status(404).json({ message: 'Perfil de paciente no encontrado' });
    }

    // Obtener información del servicio
    const [service] = await db.execute(
      'SELECT duration FROM services WHERE id = ?',
      [serviceId]
    );

    if (service.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    // Obtener el ID del profesional
    const [professional] = await db.execute(
      'SELECT id FROM professionals WHERE user_id = ?',
      [professionalId]
    );

    if (professional.length === 0) {
      return res.status(404).json({ message: 'Profesional no encontrado' });
    }

    const [result] = await db.execute(`
      INSERT INTO appointments (patient_id, professional_id, service_id, appointment_date, appointment_time, duration, modality, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [patient[0].id, professional[0].id, serviceId, appointmentDate, appointmentTime, service[0].duration, modality, notes]);

    res.status(201).json({
      message: 'Cita solicitada exitosamente',
      appointmentId: result.insertId
    });

  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener citas del usuario
const getUserAppointments = async (req, res) => {
  try {
    let query;
    let queryParams = [];

    if (req.user.user_type === 'patient') {
      query = `
        SELECT a.*, s.name as service_name, s.description as service_description,
               u.first_name as professional_first_name, u.last_name as professional_last_name,
               pr.specialty
        FROM appointments a
        INNER JOIN patients p ON a.patient_id = p.id
        INNER JOIN services s ON a.service_id = s.id
        INNER JOIN professionals pr ON a.professional_id = pr.id
        INNER JOIN users u ON pr.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;
      queryParams = [req.user.id];
    } else if (req.user.user_type === 'professional') {
      query = `
        SELECT a.*, s.name as service_name, s.description as service_description,
               u.first_name as patient_first_name, u.last_name as patient_last_name
        FROM appointments a
        INNER JOIN professionals pr ON a.professional_id = pr.id
        INNER JOIN services s ON a.service_id = s.id
        INNER JOIN patients p ON a.patient_id = p.id
        INNER JOIN users u ON p.user_id = u.id
        WHERE pr.user_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;
      queryParams = [req.user.id];
    } else {
      return res.status(403).json({ message: 'Tipo de usuario no válido' });
    }

    const [appointments] = await db.execute(query, queryParams);

    res.json({ appointments });

  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar estado de cita (solo profesionales)
const updateAppointmentStatus = async (req, res) => {
  try {
    if (req.user.user_type !== 'professional') {
      return res.status(403).json({ message: 'Solo profesionales pueden actualizar citas' });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Verificar que la cita pertenece al profesional
    const [appointment] = await db.execute(`
      SELECT a.* FROM appointments a
      INNER JOIN professionals pr ON a.professional_id = pr.id
      WHERE a.id = ? AND pr.user_id = ?
    `, [id, req.user.id]);

    if (appointment.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    await db.execute(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Estado de cita actualizado exitosamente' });

  } catch (error) {
    console.error('Error actualizando cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  createAppointment,
  getUserAppointments,
  updateAppointmentStatus
};