export default {
  findDisciplineWorkload (scheduleGrid, initials) {
    let result = scheduleGrid.filter(function (schedule) {
      return schedule.disciplineInitials === initials
    })[0]
    return (result && result.workload) || 0
  },
  findAttendanceAbsences (attendances, initials) {
    let result = attendances.filter(function (attendance) {
      return attendance.disciplineInitials === initials
    })[0]
    return (result && result.absences) || 0
  },
  findDisciplineName (attendances, initials) {
    let result = attendances.filter(function (attendance) {
      return attendance.disciplineInitials === initials
    })[0]
    return (result && result.name) || ''
  },
  findDisciplinePresences (attendances, initials) {
    let result = attendances.filter(function (attendance) {
      return attendance.disciplineInitials === initials
    })[0]
    return (result && result.presences) || 0
  },
  isMyDiscipline (scheduleGrid, {classroom, disciplineInitials}) {
    return scheduleGrid.filter(schedule => {
      return schedule.disciplineInitials === disciplineInitials && schedule.classroom === classroom
    }).length > 0
  },
  todayClassesByDiscipline (todaySchedules, initials) {
    return todaySchedules.filter(function (todaySchedule) {
      return todaySchedule.disciplineInitials === initials
    }).length
  }
}
