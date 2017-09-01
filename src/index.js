import phantom from 'phantom'
import util from './util'

class PossoFaltar {
  constructor ({login, password, classroom, log = false}) {
    if (!login || !password || !classroom) {
      throw new Error('Preencha todos os valores: login, password, classroom')
    }
    const consts = {
      URL: 'https://www.sigacentropaulasouza.com.br/aluno/login.aspx',
      DAYS: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }
    classroom = classroom.toUpperCase()
    this.data = {login, password, classroom}
    this.consts = consts
    this.instance = null
    this.page = null
    this.log = function () {
      if (log) console.log.apply([], Array.prototype.concat.apply([], arguments))
    }
  }
  _login () {
    let {login, password} = this.data
    if (!this.page.evaluate) throw new Error('Page isn\'t initialized')
    this.log('Fazendo login...')
    return this.page.evaluate(function (data) {
      document.querySelector('#vSIS_USUARIOID').value = data.login
      document.querySelector('#vSIS_USUARIOSENHA').value = data.password
      setTimeout(function () {
        document.querySelector('[name="BTCONFIRMA"]').click()
      }, 1000)
    }, {login, password})
  }
  verificarAssiduidadeTotal () {
    return this._scrapData()
  }
  verificarAssiduidadePorMateria ({initials}) {
    return this._scrapData().then(({attendances}) => {
      return attendances.filter(attendance => {
        return attendance.disciplineInitials === initials
      })[0]
    })
  }
  verificarFaltas ({day}) {
    return this._scrapData().then(({attendances, schedules, scheduleGrid}) => {
      return this._computeAttendances({day, attendances, schedules, scheduleGrid})
    })
  }
  _scrapData () {
    let phantomInstance = phantom.create()
    return phantomInstance.then(instance => {
      this.instance = instance
      return instance.createPage()
    }).then(page => {
      this.page = page
      return page.open(this.consts.URL)
    })
    .then(() => this._login())
    .then(() => this._getAttendance())
    .then((attendances) => {
      return this._getSchedule(this.page).then(({schedules, scheduleGrid}) => {
        return {attendances, schedules, scheduleGrid}
      })
    })
  }
  _computeAttendances ({day, attendances, schedules, scheduleGrid}) {
    this.log('Verificando faltas...')
    let today = new Date()
    let days = this.consts.DAYS
    today = days[today.getUTCDay() + (day === 'today' ? 1 : 2) - 1]
    let todaySchedules = schedules.filter(function (schedule) {
      return schedule.day === today
    })[0].schedule
    let todayClasses = todaySchedules.reduce((classes, schedule) => {
      let isRepeated = classes.filter((_class) => _class.disciplineInitials === schedule.disciplineInitials).length > 0
      if (!isRepeated && util.isMyDiscipline(scheduleGrid, schedule)) {
        classes.push(schedule)
      }
      return classes
    }, [])
    console.log(todayClasses)

    todayClasses.forEach(function (todayClass) {
      todayClass.workload = util.findDisciplineWorkload(scheduleGrid, todayClass.disciplineInitials)
      let maxAbsences = todayClass.workload * 5
      let myAbsences = util.findAttendanceAbsences(attendances, todayClass.disciplineInitials)
      let todayAbsences = util.todayClassesByDiscipline(todaySchedules, todayClass.disciplineInitials)
      delete todayClass.startAt
      delete todayClass.endAt
      myAbsences += todayAbsences
      todayClass.name = util.findDisciplineName(attendances, todayClass.disciplineInitials)
      todayClass.presences = util.findDisciplinePresences(attendances, todayClass.disciplineInitials)
      todayClass.absenses = myAbsences
      todayClass.maxAbsences = maxAbsences
      todayClass.canIMiss = maxAbsences - myAbsences >= 0
    })
    return todayClasses
  }
  _getAttendance () {
    let page = this.page
    this.log('Abrindo tela de presenças...')
    return this._wait(page, function () {
      return document.querySelector('#ygtvlabelel11Span') !== null
    }).then(() => {
      this.log('Abrindo tela de faltas...')
      return page.evaluate(function () {
        document.querySelector('#ygtvlabelel11Span').click()
      })
    }).then(() => {
      // Delay to load content
      return new Promise(resolve => setTimeout(resolve, 250))
    }).then(() => {
      this.log('Carregando tela de faltas parciais...')
      return this._wait(page, function () {
        return document.title === 'Faltas parciais do estudante'
      })
    }).then(() => {
      // Delay to load content
      return new Promise(resolve => setTimeout(resolve, 1000))
    }).then(() => {
      this.log('Resgatando dados...')
      return page.evaluate(function () {
        return Array.prototype.concat.apply([], document.querySelectorAll('#Grid1ContainerTbl tbody tr[class]')).map(function (tr) {
          var tds = tr.querySelectorAll('td')
          if (!tds || !tds.length) return {}
          return {
            disciplineInitials: tds[0].innerText,
            name: tds[1].innerText,
            presences: parseInt(tds[2].innerText),
            absences: parseInt(tds[3].innerText)
          }
        })
      })
    })
  }
  _getSchedule (page) {
    this.log('Resgatando grade...')
    return this._wait(page, function () {
      return document.querySelector('#ygtvlabelel9Span') !== null
    }).then(() => {
      return page.evaluate(function () {
        document.querySelector('#ygtvlabelel9Span').click()
      })
    }).then(() => {
      // Delay to load content
      return new Promise(resolve => setTimeout(resolve, 750))
    }).then(() => {
      return this._wait(page, function () {
        return document.title === 'Horário'
      })
    }).then(() => {
      return page.evaluate(function () {
        var getDaySchedules = function (id) {
          return Array.prototype.concat.apply([], document.querySelectorAll(id + ' tr[class]')).map(function (tr) {
            var tds = tr.querySelectorAll('td')
            return {
              startAt: tds[1].innerText.split('-')[0],
              endAt: tds[1].innerText.split('-')[1],
              disciplineInitials: tds[2].innerText,
              classroom: tds[3].innerText
            }
          })
        }
        var getScheduleGrid = function () {
          return Array.prototype.concat.apply([], document.querySelectorAll('#Grid1ContainerTbl tr[class]')).map(function (tr) {
            var tds = tr.querySelectorAll('td')
            return {
              disciplineInitials: tds[0].innerText,
              workload: parseInt(tds[1].innerText.split('-')[1].split('/')[0].replace('hs', '')),
              classroom: tds[2].innerText
            }
          })
        }
        var scheduleGrid = getScheduleGrid()
        var weekdays = []
        weekdays.push({
          day: 'monday',
          schedule: getDaySchedules('#Grid2ContainerTbl')
        })
        weekdays.push({
          day: 'tuesday',
          schedule: getDaySchedules('#Grid3ContainerTbl')
        })
        weekdays.push({
          day: 'wednesday',
          schedule: getDaySchedules('#Grid4ContainerTbl')
        })
        weekdays.push({
          day: 'thursday',
          schedule: getDaySchedules('#Grid5ContainerTbl')
        })
        weekdays.push({
          day: 'friday',
          schedule: getDaySchedules('#Grid6ContainerTbl')
        })
        weekdays.push({
          day: 'saturday',
          schedule: getDaySchedules('#Grid7ContainerTbl')
        })
        return {schedules: weekdays, scheduleGrid: scheduleGrid}
      })
    })
  }
  _wait (page, testFx) {
    return new Promise((resolve, reject) => {
      this._waitFor(function (cb) {
        page.evaluate(testFx).then(cb)
      }, resolve, reject, 10000)
    })
  }
  _waitFor (test, resolve, reject, maxWait, start) {
    start = start || new Date().getTime()
    if (new Date().getTime() - start < maxWait) {
      test((result) => {
        if (result) {
          resolve()
        } else {
          setTimeout(() => {
            this._waitFor(test, resolve, maxWait, start)
          }, 1000)
        }
      })
    } else {
      reject(new Error('Page wait timed out'))
    }
  }
}

export default PossoFaltar
