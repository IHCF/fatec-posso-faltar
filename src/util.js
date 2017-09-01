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
    let result = attendances.filter(function (schedule) {
      return schedule.disciplineInitials === initials
    })[0]
    return (result && result.name) || ''
  },
  todayClassesByDiscipline (todaySchedules, initials) {
    return todaySchedules.filter(function (todaySchedule) {
      return todaySchedule.disciplineInitials === initials
    }).length
  }
}
